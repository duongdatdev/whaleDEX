import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  DEFAULT_SUI_NETWORK,
  healthResponseSchema,
  suiNetworkNameSchema,
  supportedSuiNetworks,
  type HealthResponse,
  type SuiNetworkName,
  type SuiNetworksResponse,
  type SuiReadiness,
} from '@whaledex/shared';
import { createSuiReadinessCheck } from './sui.js';

export function buildApp(
  options: FastifyServerOptions = {},
  network: { defaultNetwork: SuiNetworkName; grpcUrl?: string; timeoutMs?: number } = {
    defaultNetwork: DEFAULT_SUI_NETWORK,
  },
  dependencies: { checkSui?: () => Promise<SuiReadiness> } = {},
) {
  const defaultNetwork = suiNetworkNameSchema.parse(network.defaultNetwork);
  const checkSui =
    dependencies.checkSui ??
    createSuiReadinessCheck({
      network: defaultNetwork,
      grpcUrl: network.grpcUrl,
      timeoutMs: network.timeoutMs,
    });
  const app = Fastify(options);

  app.get<{ Reply: HealthResponse }>('/health', async () => {
    return healthResponseSchema.parse({ status: 'ok' });
  });

  app.get<{ Reply: SuiReadiness }>('/ready', async (_request, reply) => {
    const readiness = await checkSui();
    return reply
      .header('Cache-Control', 'no-store')
      .code(readiness.status === 'ok' ? 200 : 503)
      .send(readiness);
  });

  app.get<{ Reply: SuiNetworksResponse }>('/v1/networks', async () => ({
    defaultNetwork,
    networks: [...supportedSuiNetworks],
  }));

  return app;
}
