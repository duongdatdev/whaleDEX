import { describe, expect, it, vi } from 'vitest';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { bcs } from '@mysten/sui/bcs';
import {
  assertFresh,
  assertTestnet,
  buildSwap,
  estimatePriceImpact,
  MARKET,
  minimumOutput,
  quoteSwap,
  prepareSwap,
  verifyMarket,
  type SwapQuote,
  type MarketSnapshot,
} from './deepbook';

const owner = `0x${'1'.repeat(64)}`;
const quote: SwapQuote = {
  owner,
  side: 'sell',
  amount: 9007199254740993n,
  output: 1001n,
  minimum: 995n,
  deepFee: 17n,
  inputRemainder: 0n,
  expiresAt: 30000,
};
describe('DeepBook transaction constraints', () => {
  it('rejects mainnet and expired or cross-account quotes', () => {
    expect(() => assertTestnet({ network: 'mainnet' })).toThrow();
    expect(() => assertFresh(quote, owner, 30000)).toThrow();
    expect(() => assertFresh(quote, '0x2', 0)).toThrow();
    expect(() => assertFresh(quote, owner, 29999)).not.toThrow();
  });
  it('rounds minimum received down using integer arithmetic', () => {
    expect(minimumOutput(9007199254740993n, 50)).toBe(8962163258467288n);
    expect(() => minimumOutput(0n, 50)).toThrow();
    expect(() => minimumOutput(1n, 50)).toThrow();
    expect(() => minimumOutput(1000n, 101)).toThrow();
  });
  it.each(['sell', 'buy'] as const)(
    'builds %s with the exact amount, minimum output and recipient',
    (side) => {
      const client = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://example.com' });
      const data = buildSwap(client, { ...quote, side }).getData();
      expect(data.sender).toBe(owner);
      expect(data.gasData.budget).toBe('100000000');
      const serialized = JSON.stringify(data, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      expect(serialized).toContain(MARKET.pool);
      expect(serialized).toContain(
        side === 'sell' ? 'swap_exact_base_for_quote' : 'swap_exact_quote_for_base',
      );
      const pure = data.inputs.flatMap((input) => (input.Pure ? [input.Pure.bytes] : []));
      expect(pure).toContain(bcs.U64.serialize(quote.minimum).toBase64());
      expect(pure).toContain(bcs.Address.serialize(owner).toBase64());
      // coinWithBalance intents retain raw integer amounts before resolving coin selection.
      expect(serialized).toContain(quote.amount.toString());
      expect(data.commands.at(-1)?.TransferObjects).toBeDefined();
    },
  );
});

function fixture() {
  const client = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://example.com' });
  vi.spyOn(client.ledgerService, 'getServiceInfo').mockReturnValue(
    Promise.resolve({
      response: { chain: 'testnet' },
    }) as unknown as ReturnType<typeof client.ledgerService.getServiceInfo>,
  );
  // Registry verification is itself a simulated Move call returning an address.
  const simulate = vi.spyOn(client.core, 'simulateTransaction');
  const registryResult = {
    $kind: 'Transaction',
    Transaction: {},
    commandResults: [{ returnValues: [{ bcs: bcs.Address.serialize(MARKET.pool).toBytes() }] }],
  };
  simulate.mockResolvedValue(registryResult as never);
  return { client, simulate, registryResult };
}

it('decodes quote integers directly from BCS without losing precision', async () => {
  const { client, simulate, registryResult } = fixture();
  const u64 = (value: bigint) => ({ bcs: bcs.U64.serialize(value).toBytes() });
  simulate.mockResolvedValueOnce(registryResult as never).mockResolvedValueOnce({
    $kind: 'Transaction',
    Transaction: {},
    commandResults: [
      { returnValues: [u64(9007199254740993n), u64(0n), u64(123n)] },
      { returnValues: [u64(1n), u64(1n), u64(1n)] },
    ],
  } as never);
  const result = await quoteSwap(client, owner, 'buy', '2', 50);
  expect(result.output).toBe(9007199254740993n);
  expect(result.deepFee).toBe(123n);
  expect(result.minimum).toBe(8962163258467288n);
});

it.each([900_000_000n, 1_050_000_000n])(
  'rejects buy output %s that violates the pool minimum or lot size',
  async (baseOutput) => {
    const { client, simulate, registryResult } = fixture();
    const u64 = (value: bigint) => ({ bcs: bcs.U64.serialize(value).toBytes() });
    simulate.mockResolvedValueOnce(registryResult as never).mockResolvedValueOnce({
      $kind: 'Transaction',
      Transaction: {},
      commandResults: [
        { returnValues: [u64(baseOutput), u64(0n), u64(1n)] },
        { returnValues: [u64(1n), u64(100_000_000n), u64(1_000_000_000n)] },
      ],
    } as never);

    await expect(quoteSwap(client, owner, 'buy', '2', 50)).rejects.toThrow(
      'Lượng SUI nhận không khớp lot size hoặc nhỏ hơn minimum size của pool.',
    );
  },
);

it.each(['0.5', '1.05'])(
  'rejects sell amount %s that violates the pool minimum or lot size',
  async (baseAmount) => {
    const { client, simulate, registryResult } = fixture();
    const u64 = (value: bigint) => ({ bcs: bcs.U64.serialize(value).toBytes() });
    simulate.mockResolvedValueOnce(registryResult as never).mockResolvedValueOnce({
      $kind: 'Transaction',
      Transaction: {},
      commandResults: [
        { returnValues: [u64(0n), u64(1_000_000n), u64(1n)] },
        { returnValues: [u64(1n), u64(100_000_000n), u64(1_000_000_000n)] },
      ],
    } as never);

    await expect(quoteSwap(client, owner, 'sell', baseAmount, 50)).rejects.toThrow(
      'Số lượng SUI không khớp lot size hoặc nhỏ hơn minimum size của pool.',
    );
  },
);

describe('DeepBook price impact estimate', () => {
  const market = {
    book: {
      bid_prices: [1.49],
      bid_quantities: [20],
      ask_prices: [1.51],
      ask_quantities: [20],
    },
    params: { tickSize: 0.00001, lotSize: 0.1, minSize: 1 },
    updatedAt: 1000,
  } as MarketSnapshot;

  it('compares simulated execution with the best-bid/ask midpoint using integer arithmetic', () => {
    const impact = estimatePriceImpact(
      {
        ...quote,
        side: 'buy',
        amount: 2_000_000n,
        output: 1_300_000_000n,
        inputRemainder: 0n,
      },
      market,
    );
    expect(impact).toEqual({
      basisPoints: 257n,
      referencePrice: '1.5',
      sourceUpdatedAt: 1000,
    });
  });

  it('uses the actually filled amount after input remainder for either side', () => {
    const sellImpact = estimatePriceImpact(
      {
        ...quote,
        side: 'sell',
        amount: 2_000_000_000n,
        output: 3_000_000n,
        inputRemainder: 0n,
      },
      market,
    );
    const improvedBuy = estimatePriceImpact(
      {
        ...quote,
        side: 'buy',
        amount: 2_000_000n,
        output: 1_900_000_000n,
        inputRemainder: 100_000n,
      },
      market,
    );
    expect(sellImpact?.basisPoints).toBe(0n);
    expect(improvedBuy?.basisPoints).toBe(-3333n);
  });

  it('does not invent an impact when either side of the reference book is empty', () => {
    expect(
      estimatePriceImpact(quote, {
        ...market,
        book: { ...market.book, bid_prices: [], bid_quantities: [] },
      }),
    ).toBeNull();
  });
});

it('rejects an RPC override reporting another network', async () => {
  const { client } = fixture();
  vi.mocked(client.ledgerService.getServiceInfo).mockReturnValue(
    Promise.resolve({
      response: { chain: 'mainnet' },
    }) as unknown as ReturnType<typeof client.ledgerService.getServiceInfo>,
  );
  await expect(verifyMarket(client)).rejects.toThrow('Network hoặc pool');
});

it('rejects a mismatched pool returned by the on-chain registry', async () => {
  const { client, simulate } = fixture();
  simulate.mockResolvedValue({
    $kind: 'Transaction',
    Transaction: {},
    commandResults: [{ returnValues: [{ bcs: bcs.Address.serialize('0x2').toBytes() }] }],
  } as never);
  await expect(verifyMarket(client)).rejects.toThrow('Network hoặc pool');
});

it.each(['gas', 'fee'] as const)(
  'blocks insufficient %s before coin selection or signing',
  async (missing) => {
    const { client } = fixture();
    vi.spyOn(client.core, 'getBalance').mockImplementation(async ({ coinType }) => ({
      balance: {
        coinType: coinType ?? MARKET.base.type,
        coinBalance: '0',
        addressBalance: '0',
        balance:
          (missing === 'gas' && !coinType) || (missing === 'fee' && coinType === MARKET.fee.type)
            ? '0'
            : '999999999999',
      },
    }));
    await expect(
      prepareSwap(client, {
        ...quote,
        side: 'buy',
        amount: 2000000n,
        expiresAt: Date.now() + 30000,
      }),
    ).rejects.toThrow(missing === 'gas' ? 'Thiếu token' : 'Thiếu DEEP');
  },
);

it('reserves gas from the same SUI balance for a sell-side swap', async () => {
  const { client } = fixture();
  vi.spyOn(client.core, 'getBalance').mockImplementation(async ({ coinType }) => ({
    balance: {
      coinType: coinType ?? MARKET.base.type,
      coinBalance: '0',
      addressBalance: '0',
      balance: coinType === MARKET.fee.type ? '999999999' : '1050000000',
    },
  }));

  await expect(
    prepareSwap(client, {
      ...quote,
      side: 'sell',
      amount: 1_000_000_000n,
      inputRemainder: 0n,
      expiresAt: Date.now() + 30_000,
    }),
  ).rejects.toThrow('Thiếu token đầu vào hoặc SUI dự phòng gas (0,1 SUI).');
});
