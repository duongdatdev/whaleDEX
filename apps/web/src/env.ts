import { z } from 'zod';
import { suiNetworkEnvSchema, suiGrpcUrlSchema, suiGrpcTimeoutEnvSchema } from '@whaledex/shared';

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:3001'),
  NEXT_PUBLIC_DEFAULT_SUI_NETWORK: suiNetworkEnvSchema,
  NEXT_PUBLIC_SUI_GRPC_URL: suiGrpcUrlSchema.optional(),
  NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS: suiGrpcTimeoutEnvSchema,
});

export function parseWebEnv(input: {
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_DEFAULT_SUI_NETWORK?: string;
  NEXT_PUBLIC_SUI_GRPC_URL?: string;
  NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS?: string;
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
  NEXT_PUBLIC_DEFAULT_SUI_NETWORK: process.env.NEXT_PUBLIC_DEFAULT_SUI_NETWORK,
  NEXT_PUBLIC_SUI_GRPC_URL: process.env.NEXT_PUBLIC_SUI_GRPC_URL,
  NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS: process.env.NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS,
});
