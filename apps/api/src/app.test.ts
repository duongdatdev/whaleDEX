import { expect, it } from 'vitest';
import { buildApp } from './app.js';
import { suiNetworksResponseSchema } from '@whaledex/shared';

it('GET /health returns the public health contract', async () => {
  const app = buildApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.json()).toEqual({ status: 'ok' });
  } finally {
    await app.close();
  }
});

it('GET /v1/networks returns Sui networks and defaults to transaction-enabled Testnet', async () => {
  const app = buildApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/v1/networks' });
    expect(response.statusCode).toBe(200);
    const data = suiNetworksResponseSchema.parse(response.json());
    expect(data.defaultNetwork).toBe('testnet');
    expect(data.networks.map((network) => network.network)).toEqual(['testnet', 'mainnet']);
    expect(data.networks.filter((network) => network.transactionEnabled)).toHaveLength(1);
  } finally {
    await app.close();
  }
});

it('GET /v1/networks preserves release metadata when the configured default changes', async () => {
  const app = buildApp({}, { defaultNetwork: 'mainnet' });
  try {
    const response = await app.inject({ method: 'GET', url: '/v1/networks' });
    const data = suiNetworksResponseSchema.parse(response.json());
    expect(data.defaultNetwork).toBe('mainnet');
    expect(data.networks).toHaveLength(2);
    expect(data.networks.find((network) => network.network === 'mainnet')?.transactionEnabled).toBe(
      false,
    );
  } finally {
    await app.close();
  }
});

it('does not expose the legacy EVM chain catalog', async () => {
  const app = buildApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/v1/chains' });
    expect(response.statusCode).toBe(404);
  } finally {
    await app.close();
  }
});
