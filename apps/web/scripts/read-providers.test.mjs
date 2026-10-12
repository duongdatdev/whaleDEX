import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProviders, readWithProviders, VerificationError } from './read-providers.mjs';

test('validates HTTPS endpoints without echoing credentials', () => {
  for (const value of [
    '',
    'http://secret.example/key',
    'invalid',
    'https://a,https://b,https://c,https://d',
  ]) {
    assert.throws(() => parseProviders(value), { message: 'INVALID_PROVIDER_CONFIG' });
  }
  assert.deepEqual(parseProviders('https://a,https://a'), ['https://a']);
});
test('retries reads twice then fails over and redacts upstream errors', async () => {
  const calls = [];
  const result = await readWithProviders(
    ['primary', 'fallback'],
    async (url) => {
      calls.push(url);
      if (url === 'primary') throw new Error('https://secret/key');
      return { chain: 'testnet' };
    },
    { delayMs: 0 },
  );
  assert.deepEqual(calls, ['primary', 'primary', 'fallback']);
  assert.equal(result.result.chain, 'testnet');
  assert.ok(!JSON.stringify(result).includes('secret'));
});
test('timeouts abort hanging reads and the number of attempts is bounded', async () => {
  const signals = [];
  const result = await readWithProviders(
    ['primary'],
    (_url, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    },
    { timeoutMs: 10, delayMs: 0 },
  );
  assert.equal(result.result, null);
  assert.equal(result.attempts.length, 2);
  assert.ok(signals.every((signal) => signal.aborted));
});
test('network or allowlist mismatch fails closed without retry or fallback', async () => {
  let calls = 0;
  await assert.rejects(
    readWithProviders(['primary', 'fallback'], async () => {
      calls++;
      throw new VerificationError('NETWORK_MISMATCH');
    }),
    { message: 'NETWORK_MISMATCH' },
  );
  assert.equal(calls, 1);
});
