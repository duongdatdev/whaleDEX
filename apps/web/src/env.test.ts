import { describe, expect, it } from 'vitest';
import { parseWebEnv } from './env';

describe('web environment', () => {
  it('uses the local API URL by default', () => {
    expect(parseWebEnv({}).NEXT_PUBLIC_API_URL).toBe('http://localhost:3001');
  });

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
