import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('API environment', () => {
  it('uses local defaults', () => {
    expect(parseEnv({})).toEqual({ NODE_ENV: 'development', HOST: '127.0.0.1', PORT: 3001 });
  });

  it('accepts deployment overrides', () => {
    expect(parseEnv({ NODE_ENV: 'production', HOST: '0.0.0.0', PORT: '8080' }).PORT).toBe(8080);
  });

  it.each(['0', '65536', 'abc', '3001.5', ''])('rejects invalid PORT %j', (PORT) => {
    expect(() => parseEnv({ PORT })).toThrow('PORT');
  });

  it('reports invalid configuration without echoing its values', () => {
    expect(() => parseEnv({ NODE_ENV: 'secret-value', HOST: '' })).toThrow(
      'Invalid environment variables: NODE_ENV, HOST',
    );
  });
});
