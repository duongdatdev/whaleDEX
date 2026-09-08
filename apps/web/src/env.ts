import { z } from 'zod';

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:3001'),
});

export function parseWebEnv(input: { NEXT_PUBLIC_API_URL?: string }) {
  const result = webEnvSchema.safeParse(input);
  if (!result.success) {
    throw new Error('Invalid environment variable: NEXT_PUBLIC_API_URL (expected an HTTP(S) URL)');
  }
  return result.data;
}

export const env = parseWebEnv({ NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL });
