import { describe, expect, it } from 'vitest';
import { parseWebEnv } from './env';

describe('web environment', () => {
  it('uses the local API URL by default', () => {
    expect(parseWebEnv({}).NEXT_PUBLIC_API_URL).toBe('http://localhost:3001');
  });

  it('uses a bounded default timeout and accepts a public HTTPS override', () => {
    expect(parseWebEnv({}).NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS).toBe(10000);
    expect(
      parseWebEnv({
        NEXT_PUBLIC_SUI_GRPC_URL: 'https://provider.example/grpc',
        NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS: '5000',
      }),
    ).toMatchObject({
      NEXT_PUBLIC_SUI_GRPC_URL: 'https://provider.example/grpc',
      NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS: 5000,
    });
  });

  it.each(['', 'http://provider.example', 'invalid'])(
    'rejects invalid public endpoints',
    (NEXT_PUBLIC_SUI_GRPC_URL) => {
      expect(() => parseWebEnv({ NEXT_PUBLIC_SUI_GRPC_URL })).toThrow('NEXT_PUBLIC_SUI_GRPC_URL');
    },
  );

  it.each(['', '0', '30001', '1e3'])(
    'rejects invalid public timeouts',
    (NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS) => {
      expect(() => parseWebEnv({ NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS })).toThrow(
        'NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS',
      );
    },
  );

  it('defaults to Sui Testnet and supports an explicit Mainnet read context', () => {
    expect(parseWebEnv({}).NEXT_PUBLIC_DEFAULT_SUI_NETWORK).toBe('testnet');
    expect(
      parseWebEnv({ NEXT_PUBLIC_DEFAULT_SUI_NETWORK: 'mainnet' }).NEXT_PUBLIC_DEFAULT_SUI_NETWORK,
    ).toBe('mainnet');
  });

  it.each(['', 'sepolia', '11155111', 'secret-value'])(
    'rejects invalid default Sui network %j without exposing values',
    (NEXT_PUBLIC_DEFAULT_SUI_NETWORK) => {
      expect(() => parseWebEnv({ NEXT_PUBLIC_DEFAULT_SUI_NETWORK })).toThrow(
        'Invalid environment variables: NEXT_PUBLIC_DEFAULT_SUI_NETWORK',
      );
    },
  );

  it('accepts an HTTPS API URL', () => {
    expect(
      parseWebEnv({ NEXT_PUBLIC_API_URL: 'https://api.example.com' }).NEXT_PUBLIC_API_URL,
    ).toBe('https://api.example.com');
  });

  it.each(['', 'invalid', 'ftp://example.com'])('rejects invalid URL %j', (NEXT_PUBLIC_API_URL) => {
    expect(() => parseWebEnv({ NEXT_PUBLIC_API_URL })).toThrow('NEXT_PUBLIC_API_URL');
  });
});
