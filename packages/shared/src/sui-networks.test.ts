import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUI_NETWORK,
  getSuiNetwork,
  suiNetworkConfigSchema,
  suiNetworkEnvSchema,
  supportedSuiNetworkNames,
  supportedSuiNetworks,
  resolveSuiConnection,
} from './sui-networks.js';

describe('Sui network configuration', () => {
  it.each(supportedSuiNetworkNames)(
    'resolves the endpoint for %s without using another network',
    (network) => {
      expect(resolveSuiConnection({ network })).toEqual({
        network,
        grpcUrl: getSuiNetwork(network).grpcUrls[0],
        timeoutMs: 10000,
      });
    },
  );

  it('keeps a private endpoint override out of the public registry', () => {
    const grpcUrl = 'https://provider.example/private-key';
    expect(resolveSuiConnection({ network: 'testnet', grpcUrl, timeoutMs: 5000 })).toEqual({
      network: 'testnet',
      grpcUrl,
      timeoutMs: 5000,
    });
    expect(JSON.stringify(supportedSuiNetworks)).not.toContain('private-key');
    expect(() => resolveSuiConnection({ network: 'testnet', grpcUrl: '' })).toThrow();
  });
  it('contains Testnet and a disabled Mainnet entry without duplicate names', () => {
    expect(supportedSuiNetworks.map((network) => network.network)).toEqual(['testnet', 'mainnet']);
    expect(new Set(supportedSuiNetworks.map((network) => network.network)).size).toBe(2);
    expect(getSuiNetwork(DEFAULT_SUI_NETWORK)).toMatchObject({
      testnet: true,
      transactionEnabled: true,
    });
    expect(getSuiNetwork('mainnet')).toMatchObject({
      testnet: false,
      transactionEnabled: false,
      faucetUrl: null,
    });
  });

  it.each(supportedSuiNetworkNames)('uses valid public metadata for %s', (name) => {
    const network = getSuiNetwork(name);
    expect(network.nativeCurrency).toEqual({ name: 'Sui', symbol: 'SUI', decimals: 9 });
    expect(network.grpcUrls).toHaveLength(1);
    expect(network.grpcUrls[0]).toMatch(/^https:\/\/fullnode\.(testnet|mainnet)\.sui\.io:443$/);
    expect(network.explorerUrl).toMatch(new RegExp(`^https://suiscan\\.xyz/${name}$`));
  });

  it('defaults only missing environment input to Testnet', () => {
    expect(suiNetworkEnvSchema.parse(undefined)).toBe('testnet');
    for (const name of supportedSuiNetworkNames) {
      expect(suiNetworkEnvSchema.parse(name)).toBe(name);
    }
  });

  it.each(['', ' ', 'devnet', 'localnet', 'sepolia', '11155111', 'TESTNET', null, 1])(
    'rejects malformed or unsupported network %j',
    (value) => {
      expect(suiNetworkEnvSchema.safeParse(value).success).toBe(false);
    },
  );

  it.each(['devnet', 'localnet', 'sepolia', '', 'TESTNET'])(
    'rejects unsupported lookup %j',
    (name) => {
      expect(() => getSuiNetwork(name)).toThrow();
    },
  );

  it('rejects invalid endpoints and Sui currency metadata', () => {
    const network = getSuiNetwork('testnet');
    expect(suiNetworkConfigSchema.safeParse({ ...network, grpcUrls: [] }).success).toBe(false);
    expect(
      suiNetworkConfigSchema.safeParse({ ...network, grpcUrls: ['http://localhost:9000'] }).success,
    ).toBe(false);
    expect(
      suiNetworkConfigSchema.safeParse({
        ...network,
        nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 18 },
      }).success,
    ).toBe(false);
  });

  it('enforces the Testnet-only transaction release gate', () => {
    const mainnet = getSuiNetwork('mainnet');
    expect(suiNetworkConfigSchema.safeParse({ ...mainnet, transactionEnabled: true }).success).toBe(
      false,
    );
    const testnet = getSuiNetwork('testnet');
    expect(suiNetworkConfigSchema.safeParse({ ...testnet, faucetUrl: null }).success).toBe(false);
  });

  it('prevents consumers from changing the shared registry', () => {
    const network = getSuiNetwork('testnet');
    expect(Object.isFrozen(supportedSuiNetworks)).toBe(true);
    expect(Object.isFrozen(network)).toBe(true);
    expect(Object.isFrozen(network.nativeCurrency)).toBe(true);
    expect(Object.isFrozen(network.grpcUrls)).toBe(true);
  });
});
