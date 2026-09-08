import { describe, expect, it } from 'vitest';
import { parseWebEnv } from './env';

describe('web environment', () => {
  it('uses the local API URL by default', () => {
    expect(parseWebEnv({}).NEXT_PUBLIC_API_URL).toBe('http://localhost:3001');
  });

  it('accepts an HTTPS API URL', () => {
    expect(
      parseWebEnv({ NEXT_PUBLIC_API_URL: 'https://api.example.com' }).NEXT_PUBLIC_API_URL,
    ).toBe('https://api.example.com');
  });

  it.each(['', 'invalid', 'ftp://example.com'])('rejects invalid URL %j', (NEXT_PUBLIC_API_URL) => {
    expect(() => parseWebEnv({ NEXT_PUBLIC_API_URL })).toThrow('NEXT_PUBLIC_API_URL');
  });
});
