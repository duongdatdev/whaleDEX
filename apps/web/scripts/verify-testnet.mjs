import { SuiGrpcClient } from '@mysten/sui/grpc';
import { deepbook, testnetCoins, testnetPools, testnetPackageIds } from '@mysten/deepbook-v3';
import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import { isValidSuiAddress, normalizeSuiAddress, normalizeStructTag } from '@mysten/sui/utils';
import { readWithProviders, parseProviders, VerificationError } from './read-providers.mjs';

async function verify(url, signal, owner) {
  const client = new SuiGrpcClient({
    network: 'testnet',
    baseUrl: url,
    timeout: 10000,
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        signal: AbortSignal.any([signal, ...(init?.signal ? [init.signal] : [])]),
      }),
  });
  const { response } = await client.ledgerService.getServiceInfo({});
  if (response.chain !== 'testnet') throw new VerificationError('NETWORK_MISMATCH');
  const { response: packageResponse } = await client.movePackageService.getPackage({
    packageId: testnetPackageIds.DEEPBOOK_PACKAGE_ID,
  });
  const pkg = packageResponse.package;
  if (
    !pkg?.originalId ||
    normalizeSuiAddress(pkg.storageId) !==
      normalizeSuiAddress(testnetPackageIds.DEEPBOOK_PACKAGE_ID)
  )
    throw new VerificationError('PACKAGE_MISMATCH');
  const db = client.$extend(deepbook({ address: owner ?? '0x1' })).deepbook;
  const coins = [];
  for (const symbol of ['SUI', 'DBUSDC', 'DEEP']) {
    const coin = testnetCoins[symbol];
    const { coinMetadata } = await client.core.getCoinMetadata({ coinType: coin.type });
    if (!coinMetadata || 10 ** coinMetadata.decimals !== coin.scalar)
      throw new VerificationError('COIN_DECIMALS_MISMATCH');
    coins.push({
      symbol,
      type: coin.type,
      decimals: coinMetadata.decimals,
      ...(owner
        ? {
            balance: (await client.core.getBalance({ owner, coinType: coin.type })).balance.balance,
          }
        : {}),
    });
  }
  const pools = [];
  for (const key of ['SUI_DBUSDC', 'DEEP_SUI']) {
    const pool = testnetPools[key];
    const registryId = await db.getPoolIdByAssets(
      testnetCoins[pool.baseCoin].type,
      testnetCoins[pool.quoteCoin].type,
    );
    if (normalizeSuiAddress(registryId) !== normalizeSuiAddress(pool.address))
      throw new VerificationError('POOL_MISMATCH');
    const { object } = await client.core.getObject({ objectId: pool.address });
    const expectedType = `${pkg.originalId}::pool::Pool<${testnetCoins[pool.baseCoin].type},${testnetCoins[pool.quoteCoin].type}>`;
    if (normalizeStructTag(object.type) !== normalizeStructTag(expectedType))
      throw new VerificationError('POOL_TYPE_MISMATCH');
    const book = await db.getLevel2TicksFromMid(key, 5);
    const params = await db.poolBookParams(key);
    const quotes = [];
    for (const side of ['sell', 'buy']) {
      const tx = new Transaction();
      tx.setSender(owner ?? '0x1');
      const inputSymbol = side === 'sell' ? pool.baseCoin : pool.quoteCoin;
      const amount =
        BigInt(testnetCoins[inputSymbol].scalar) *
        (key === 'DEEP_SUI' && side === 'sell' ? 20n : 2n);
      tx.add(
        side === 'sell'
          ? db.deepBook.getQuoteQuantityOut(key, amount)
          : db.deepBook.getBaseQuantityOut(key, amount),
      );
      const res = await client.core.simulateTransaction({
        transaction: tx,
        include: { commandResults: true },
      });
      if (res.FailedTransaction) {
        quotes.push({ side, inputSymbol, amount: String(amount), status: 'simulation_failed' });
        continue;
      }
      const [baseOut, quoteOut, deepFee] = res.commandResults[0].returnValues.map((v) =>
        bcs.U64.parse(v.bcs),
      );
      quotes.push({
        side,
        inputSymbol,
        amount: String(amount),
        baseOut,
        quoteOut,
        deepFee,
        status: BigInt(side === 'sell' ? quoteOut : baseOut) > 0n ? 'quoted' : 'no_liquidity',
      });
    }
    pools.push({
      key,
      ...pool,
      objectType: object.type,
      registryMatched: true,
      params,
      book,
      quotes,
    });
  }
  return {
    chain: response.chain,
    checkpoint: String(response.checkpointHeight),
    packages: {
      storageId: pkg.storageId,
      originalId: pkg.originalId,
      version: String(pkg.version),
      registryId: testnetPackageIds.REGISTRY_ID,
    },
    coins,
    pools,
    funding: owner
      ? coins.every((c) => BigInt(c.balance) > 0n)
        ? 'nonzero_balances_not_trade_guarantee'
        : 'missing_tokens'
      : 'wallet_not_supplied',
  };
}

try {
  const owner = process.env.SUI_TESTNET_ADDRESS;
  if (owner && !isValidSuiAddress(owner)) throw new VerificationError('INVALID_WALLET_ADDRESS');
  const providers = parseProviders(process.env.SUI_VERIFY_URLS);
  const report = await readWithProviders(providers, (url, signal) => verify(url, signal, owner));
  console.log(
    JSON.stringify({ checkedAt: new Date().toISOString(), readOnly: true, ...report }, null, 2),
  );
  if (!report.result) process.exitCode = 1;
} catch (error) {
  console.error(
    JSON.stringify({
      status: 'failed',
      code: error instanceof VerificationError ? error.message : 'VERIFICATION_FAILED',
    }),
  );
  process.exitCode = 1;
}
