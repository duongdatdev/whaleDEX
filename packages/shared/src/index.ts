import { z } from 'zod';

export * from './sui-networks.js';

export const healthResponseSchema = z.object({ status: z.literal('ok') });

export type HealthResponse = z.infer<typeof healthResponseSchema>;
