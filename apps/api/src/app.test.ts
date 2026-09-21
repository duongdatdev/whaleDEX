import { expect, it } from 'vitest';
import { buildApp } from './app.js';
import { chainsResponseSchema } from '@whaledex/shared';

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

it('GET /v1/chains returns the six configured networks and defaults to Sepolia', async () => {
  const app = buildApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/v1/chains' });
    expect(response.statusCode).toBe(200);
    const data = chainsResponseSchema.parse(response.json());
    expect(data.defaultChainId).toBe(11155111);
    expect(data.chains.map((chain) => chain.id)).toEqual([56, 1, 8453, 137, 42161, 11155111]);
    expect(data.chains.filter((chain) => chain.testnet)).toHaveLength(1);
  } finally {
    await app.close();
  }
});

it('GET /v1/chains respects the configured default without filtering other networks', async () => {
  const app = buildApp({}, { defaultChainId: 8453 });
  try {
    const response = await app.inject({ method: 'GET', url: '/v1/chains' });
    const data = chainsResponseSchema.parse(response.json());
    expect(data.defaultChainId).toBe(8453);
    expect(data.chains).toHaveLength(6);
  } finally {
    await app.close();
  }
});
