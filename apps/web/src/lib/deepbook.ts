import { deepbook, testnetCoins, testnetPools } from '@mysten/deepbook-v3';
import { bcs } from '@mysten/sui/bcs';
import type { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { parseUnits } from './amounts';

export const MARKET = {
  key: 'SUI_DBUSDC',
  pool: testnetPools.SUI_DBUSDC!.address,
  base: { symbol: 'SUI', type: testnetCoins.SUI!.type, decimals: 9 },
  quote: { symbol: 'DBUSDC', type: testnetCoins.DBUSDC!.type, decimals: 6 },
  fee: { symbol: 'DEEP', type: testnetCoins.DEEP!.type, decimals: 6 },
} as const;
export type Side = 'sell' | 'buy';
export const GAS_BUDGET = 100_000_000n;
export const QUOTE_TTL = 30_000;

export function assertTestnet(client: Pick<SuiGrpcClient, 'network'>) {
  if (client.network !== 'testnet') throw new Error('Chỉ hỗ trợ Sui Testnet.');
}
function adapter(client: SuiGrpcClient, owner = '0x1') {
  assertTestnet(client);
  return client.$extend(deepbook({ address: owner })).deepbook;
}
export async function verifyMarket(client: SuiGrpcClient) {
  const db = adapter(client);
  const [{ response }, pool] = await Promise.all([
    client.ledgerService.getServiceInfo({}),
    db.getPoolIdByAssets(MARKET.base.type, MARKET.quote.type),
  ]);
  if (
    response.chain !== 'testnet' ||
    normalizeSuiAddress(pool) !== normalizeSuiAddress(MARKET.pool)
  ) {
    throw new Error('Network hoặc pool không khớp allowlist Testnet.');
  }
  return db;
}
export async function readMarket(client: SuiGrpcClient) {
  const db = await verifyMarket(client);
  const [book, params] = await Promise.all([
    db.getLevel2TicksFromMid(MARKET.key, 8),
    db.poolBookParams(MARKET.key),
  ]);
  return { book, params, updatedAt: Date.now() };
}
export type MarketSnapshot = Awaited<ReturnType<typeof readMarket>>;
export type SwapQuote = {
  owner: string;
  side: Side;
  amount: bigint;
  output: bigint;
  minimum: bigint;
  deepFee: bigint;
  expiresAt: number;
};
export function minimumOutput(output: bigint, bps: number) {
  if (!Number.isInteger(bps) || bps < 1 || bps > 100)
    throw new Error('Trượt giá phải từ 0,01% đến 1%.');
  const minimum = (output * BigInt(10000 - bps)) / 10000n;
  if (minimum <= 0n) throw new Error('Không đủ thanh khoản cho số lượng này.');
  return minimum;
}
export function assertFresh(quote: SwapQuote, owner: string, now = Date.now()) {
  if (quote.owner !== owner || now >= quote.expiresAt)
    throw new Error('Quote hết hạn hoặc tài khoản đã đổi. Lấy quote mới.');
}

export async function quoteSwap(
  client: SuiGrpcClient,
  owner: string,
  side: Side,
  value: string,
  bps: number,
): Promise<SwapQuote> {
  await verifyMarket(client);
  const db = adapter(client, owner);
  const amount = parseUnits(value, side === 'sell' ? 9 : 6);
  const tx = new Transaction();
  tx.setSender(owner);
  tx.add(
    side === 'sell'
      ? db.deepBook.getQuoteQuantityOut(MARKET.key, amount)
      : db.deepBook.getBaseQuantityOut(MARKET.key, amount),
  );
  tx.add(db.deepBook.poolBookParams(MARKET.key));
  const result = await client.core.simulateTransaction({
    transaction: tx,
    include: { commandResults: true },
  });
  if (result.FailedTransaction) throw new Error('Không thể lấy quote DeepBook.');
  const values = result.commandResults[0]!.returnValues.map((value) =>
    BigInt(bcs.U64.parse(value.bcs)),
  );
  const params = result.commandResults[1]!.returnValues.map((value) =>
    BigInt(bcs.U64.parse(value.bcs)),
  );
  if (side === 'sell' && (amount < params[2]! || amount % params[1]! !== 0n)) {
    throw new Error('Số lượng SUI không khớp lot size hoặc nhỏ hơn minimum size của pool.');
  }
  const output = values[side === 'sell' ? 1 : 0]!;
  return {
    owner,
    side,
    amount,
    output,
    minimum: minimumOutput(output, bps),
    deepFee: values[2]!,
    expiresAt: Date.now() + QUOTE_TTL,
  };
}

export function buildSwap(client: SuiGrpcClient, quote: SwapQuote) {
  const db = adapter(client, quote.owner);
  const tx = new Transaction();
  tx.setSender(quote.owner);
  tx.setGasBudget(GAS_BUDGET);
  const args = {
    poolKey: MARKET.key,
    amount: quote.amount,
    deepAmount: quote.deepFee,
    minOut: quote.minimum,
  };
  const coins = tx.add(
    quote.side === 'sell'
      ? db.deepBook.swapExactBaseForQuote(args)
      : db.deepBook.swapExactQuoteForBase(args),
  );
  tx.transferObjects([...coins], quote.owner);
  return tx;
}

export async function prepareSwap(client: SuiGrpcClient, quote: SwapQuote) {
  assertFresh(quote, quote.owner);
  await verifyMarket(client);
  const inputType = quote.side === 'sell' ? MARKET.base.type : MARKET.quote.type;
  const [input, gas, fee] = await Promise.all([
    client.core.getBalance({ owner: quote.owner, coinType: inputType }),
    client.core.getBalance({ owner: quote.owner }),
    client.core.getBalance({ owner: quote.owner, coinType: MARKET.fee.type }),
  ]);
  if (
    BigInt(input.balance.balance) < quote.amount + (quote.side === 'sell' ? GAS_BUDGET : 0n) ||
    BigInt(gas.balance.balance) < GAS_BUDGET
  ) {
    throw new Error('Thiếu token đầu vào hoặc SUI dự phòng gas (0,1 SUI).');
  }
  if (BigInt(fee.balance.balance) < quote.deepFee)
    throw new Error('Thiếu DEEP Testnet để trả phí giao dịch.');
  const tx = buildSwap(client, quote);
  const bytes = await tx.build({ client });
  const result = await client.core.simulateTransaction({
    transaction: bytes,
    include: { effects: true },
  });
  if (result.FailedTransaction)
    throw new Error('Mô phỏng thất bại: kiểm tra số dư, thanh khoản và lấy quote mới.');
  const costs = result.Transaction.effects!.gasUsed;
  const gasEstimate =
    BigInt(costs.computationCost) + BigInt(costs.storageCost) - BigInt(costs.storageRebate);
  assertFresh(quote, quote.owner);
  return {
    transaction: Transaction.from(bytes),
    digest: await Transaction.from(bytes).getDigest(),
    gasEstimate: gasEstimate > 0n ? gasEstimate : 0n,
  };
}
