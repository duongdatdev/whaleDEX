import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('API environment', () => {
  it('uses local defaults', () => {
    expect(parseEnv({})).toEqual({
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      PORT: 3001,
      DEFAULT_SUI_NETWORK: 'testnet',
      SUI_GRPC_TIMEOUT_MS: 10000,
    });
  });

  it('accepts deployment overrides', () => {
    expect(parseEnv({ NODE_ENV: 'production', HOST: '0.0.0.0', PORT: '8080' }).PORT).toBe(8080);
  });

  it('accepts an HTTPS provider override and bounded timeout', () => {
    expect(
      parseEnv({ SUI_GRPC_URL: 'https://provider.example/grpc', SUI_GRPC_TIMEOUT_MS: '5000' }),
    ).toMatchObject({
      SUI_GRPC_URL: 'https://provider.example/grpc',
      SUI_GRPC_TIMEOUT_MS: 5000,
    });
  });

  it.each(['', 'http://provider.example/secret', 'not-a-url'])(
    'rejects invalid gRPC endpoints without echoing them',
    (SUI_GRPC_URL) => {
      expect(() => parseEnv({ SUI_GRPC_URL })).toThrow(
        'Invalid environment variables: SUI_GRPC_URL',
      );
    },
  );

  it.each(['', '0', '99', '30001', '100.5', '1e3', 'secret'])(
    'rejects invalid timeout %j',
    (SUI_GRPC_TIMEOUT_MS) => {
      expect(() => parseEnv({ SUI_GRPC_TIMEOUT_MS })).toThrow('SUI_GRPC_TIMEOUT_MS');
    },
  );

  it('accepts a configured Sui Mainnet read context', () => {
    expect(parseEnv({ DEFAULT_SUI_NETWORK: 'mainnet' }).DEFAULT_SUI_NETWORK).toBe('mainnet');
  });

  it.each(['', 'sepolia', '11155111', 'secret-value'])(
    'rejects invalid default Sui network %j without exposing values',
    (DEFAULT_SUI_NETWORK) => {
      expect(() => parseEnv({ DEFAULT_SUI_NETWORK })).toThrow(
        'Invalid environment variables: DEFAULT_SUI_NETWORK',
      );
    },
  );

  it.each(['0', '65536', 'abc', '3001.5', ''])('rejects invalid PORT %j', (PORT) => {
    expect(() => parseEnv({ PORT })).toThrow('PORT');
  });

  it('reports invalid configuration without echoing its values', () => {
    expect(() => parseEnv({ NODE_ENV: 'secret-value', HOST: '' })).toThrow(
      'Invalid environment variables: NODE_ENV, HOST',
    );
  });
});
