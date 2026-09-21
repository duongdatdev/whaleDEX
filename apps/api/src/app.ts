import Fastify, { type FastifyServerOptions } from 'fastify';
import { healthResponseSchema, type HealthResponse } from '@whaledex/shared';
import {
  DEFAULT_CHAIN_ID,
  chainIdSchema,
  supportedChains,
  type ChainId,
  type ChainsResponse,
} from '@whaledex/shared';

export function buildApp(
  options: FastifyServerOptions = {},
  network: { defaultChainId: ChainId } = { defaultChainId: DEFAULT_CHAIN_ID },
) {
  const defaultChainId = chainIdSchema.parse(network.defaultChainId);
  const app = Fastify(options);

  app.get<{ Reply: HealthResponse }>('/health', async () => {
    return healthResponseSchema.parse({ status: 'ok' });
  });

  app.get<{ Reply: ChainsResponse }>('/v1/chains', async () => ({
    defaultChainId,
    chains: [...supportedChains],
  }));

  return app;
}
