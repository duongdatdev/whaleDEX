import Fastify, { type FastifyServerOptions } from 'fastify';
import { healthResponseSchema, type HealthResponse } from '@whaledex/shared';

export function buildApp(options: FastifyServerOptions = {}) {
  const app = Fastify(options);

  app.get<{ Reply: HealthResponse }>('/health', async () => {
    return healthResponseSchema.parse({ status: 'ok' });
  });

  return app;
}
