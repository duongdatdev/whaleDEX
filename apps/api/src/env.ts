import { z } from 'zod';
import { suiNetworkEnvSchema, suiGrpcUrlSchema, suiGrpcTimeoutEnvSchema } from '@whaledex/shared';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DEFAULT_SUI_NETWORK: suiNetworkEnvSchema,
  SUI_GRPC_URL: suiGrpcUrlSchema.optional(),
  SUI_GRPC_TIMEOUT_MS: suiGrpcTimeoutEnvSchema,
});

export function parseEnv(input: NodeJS.ProcessEnv) {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${fields}`);
  }
  return result.data;
}
