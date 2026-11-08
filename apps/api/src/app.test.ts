import { expect, it, vi } from 'vitest';
import { buildApp } from './app.js';
import { suiNetworksResponseSchema, suiReadinessSchema } from '@whaledex/shared';

it('keeps liveness and public catalog independent of the upstream readiness check', async () => {
  const checkSui = vi
    .fn()
    .mockResolvedValue({ status: 'unavailable', network: 'testnet', code: 'SUI_UNAVAILABLE' });
  const app = buildApp(
    {},
    { defaultNetwork: 'testnet', grpcUrl: 'https://provider.example/private-key' },
    { checkSui },
  );
  try {
    expect((await app.inject('/health')).statusCode).toBe(200);
    const catalog = await app.inject('/v1/networks');
    expect(catalog.body).not.toContain('private-key');
    expect(checkSui).not.toHaveBeenCalled();
    const response = await app.inject('/ready');
    expect(response.statusCode).toBe(503);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(suiReadinessSchema.parse(response.json()).status).toBe('unavailable');
  } finally {
    await app.close();
  }
});

it('reports ready only when the configured Sui read succeeds', async () => {
  const app = buildApp(
    {},
    { defaultNetwork: 'testnet' },
    {
      checkSui: async () => ({ status: 'ok', network: 'testnet', checkpoint: '42' }),
    },
  );
  try {
    const response = await app.inject('/ready');
    expect(response.statusCode).toBe(200);
    expect(suiReadinessSchema.parse(response.json())).toEqual({
      status: 'ok',
      network: 'testnet',
      checkpoint: '42',
    });
  } finally {
    await app.close();
  }
});

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
