import { z } from 'zod';
import { chainIdEnvSchema } from '@whaledex/shared';

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:3001'),
  NEXT_PUBLIC_DEFAULT_CHAIN_ID: chainIdEnvSchema,
});

export function parseWebEnv(input: {
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_DEFAULT_CHAIN_ID?: string;
}) {
  const result = webEnvSchema.safeParse(input);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${fields}`);
  }
  return result.data;
}

export const env = parseWebEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_DEFAULT_CHAIN_ID: process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID,
});
