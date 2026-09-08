import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './index.js';

describe('health response contract', () => {
  it('accepts a healthy response', () => {
    expect(healthResponseSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
  });

  it.each([{}, { status: 'error' }, { status: true }])(
    'rejects an invalid response: %j',
    (value) => {
      expect(healthResponseSchema.safeParse(value).success).toBe(false);
    },
  );
});
