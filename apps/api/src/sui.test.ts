import { describe, expect, it, vi } from 'vitest';
import { createSuiReadinessCheck } from './sui.js';

describe('Sui readiness', () => {
  it('serializes checkpoint heights without precision loss', async () => {
    const read = vi
      .fn()
      .mockResolvedValue({ chain: 'testnet', checkpointHeight: 9007199254740993n });
    expect(await createSuiReadinessCheck({ network: 'testnet' }, read)()).toEqual({
      status: 'ok',
      network: 'testnet',
      checkpoint: '9007199254740993',
    });
    expect(read.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
  });

  it('rejects an endpoint on the wrong network even when it responds successfully', async () => {
    const read = async () => ({ chain: 'mainnet', checkpointHeight: 12n });
    expect(await createSuiReadinessCheck({ network: 'testnet' }, read)()).toMatchObject({
      status: 'unavailable',
      code: 'SUI_NETWORK_MISMATCH',
    });
  });

  it.each([
    {},
    { chain: 'testnet' },
    { checkpointHeight: 1n },
    { chain: 'testnet', checkpointHeight: -1n },
  ])('rejects incomplete or invalid service metadata', async (info) => {
    expect(await createSuiReadinessCheck({ network: 'testnet' }, async () => info)()).toMatchObject(
      {
        status: 'unavailable',
        code: 'SUI_INVALID_RESPONSE',
      },
    );
  });

  it('redacts upstream errors and credential-bearing URLs', async () => {
    const read = async () => {
      throw new Error('https://provider.example/secret-key');
    };
    const result = await createSuiReadinessCheck({ network: 'mainnet' }, read)();
    expect(result).toEqual({ status: 'unavailable', network: 'mainnet', code: 'SUI_UNAVAILABLE' });
    expect(JSON.stringify(result)).not.toContain('secret-key');
  });

  it('aborts a hanging read after the configured timeout', async () => {
    const read = (signal: AbortSignal) =>
      new Promise<never>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    expect(
      await createSuiReadinessCheck({ network: 'testnet', timeoutMs: 100 }, read)(),
    ).toMatchObject({
      status: 'unavailable',
      code: 'SUI_UNAVAILABLE',
    });
  });
});
