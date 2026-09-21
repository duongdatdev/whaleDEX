import { describe, expect, it } from 'vitest';
import {
  chainIdEnvSchema,
  chainSchema,
  DEFAULT_CHAIN_ID,
  getChain,
  supportedChains,
  supportedChainIds,
} from './chains.js';

describe('EVM network configuration', () => {
  it('contains exactly five mainnets and Ethereum Sepolia with no duplicate IDs', () => {
    expect(supportedChains.map((chain) => chain.id)).toEqual([56, 1, 8453, 137, 42161, 11155111]);
    expect(new Set(supportedChains.map((chain) => chain.id)).size).toBe(6);
    expect(supportedChains.filter((chain) => chain.testnet).map((chain) => chain.id)).toEqual([
      11155111,
    ]);
    expect(getChain(DEFAULT_CHAIN_ID).testnet).toBe(true);
  });

  it.each([
    [56, 'BNB'],
    [1, 'ETH'],
    [8453, 'ETH'],
    [137, 'POL'],
    [42161, 'ETH'],
    [11155111, 'ETH'],
  ] as const)('uses the correct gas token for chain %i', (id, symbol) => {
    const chain = getChain(id);
    expect(chain.nativeCurrency.symbol).toBe(symbol);
    expect(chain.rpcUrls.default.http.length).toBeGreaterThanOrEqual(2);
    expect(new Set(chain.rpcUrls.default.http).size).toBe(chain.rpcUrls.default.http.length);
    for (const url of chain.rpcUrls.default.http) {
      expect(url).toMatch(/^https:\/\/[a-z0-9.-]+(?:\/[a-z0-9/-]*)?$/);
    }
  });

  it('defaults only missing environment input to Sepolia', () => {
    expect(chainIdEnvSchema.parse(undefined)).toBe(11155111);
    for (const id of supportedChainIds) expect(chainIdEnvSchema.parse(String(id))).toBe(id);
  });

  it.each(['', ' ', '0x1', '1.0', '1e0', '10', '421614', '84532', 'secret-value', null, 1])(
    'rejects malformed or unsupported environment chain ID %j',
    (value) => {
      expect(chainIdEnvSchema.safeParse(value).success).toBe(false);
    },
  );

  it.each([0, 10, 421614, 84532, NaN, Infinity])('rejects unsupported lookup %j', (id) => {
    expect(() => getChain(id)).toThrow();
  });

  it('rejects missing or non-HTTPS RPC endpoints', () => {
    const chain = getChain(1);
    for (const http of [[], ['http://localhost:8545'], ['not-a-url']]) {
      expect(chainSchema.safeParse({ ...chain, rpcUrls: { default: { http } } }).success).toBe(
        false,
      );
    }
  });

  it('prevents consumers from changing the shared registry', () => {
    expect(Object.isFrozen(supportedChains)).toBe(true);
    const chain = getChain(137);
    expect(Object.isFrozen(chain)).toBe(true);
    expect(Object.isFrozen(chain.nativeCurrency)).toBe(true);
    expect(Object.isFrozen(chain.rpcUrls.default.http)).toBe(true);
  });
});
