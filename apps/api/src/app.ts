import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  DEFAULT_SUI_NETWORK,
  healthResponseSchema,
  suiNetworkNameSchema,
  supportedSuiNetworks,
  type HealthResponse,
  type SuiNetworkName,
  type SuiNetworksResponse,
} from '@whaledex/shared';

export function buildApp(
  options: FastifyServerOptions = {},
  network: { defaultNetwork: SuiNetworkName } = { defaultNetwork: DEFAULT_SUI_NETWORK },
) {
  const defaultNetwork = suiNetworkNameSchema.parse(network.defaultNetwork);
  const app = Fastify(options);

  app.get<{ Reply: HealthResponse }>('/health', async () => {
    return healthResponseSchema.parse({ status: 'ok' });
  });

  app.get<{ Reply: SuiNetworksResponse }>('/v1/networks', async () => ({
    defaultNetwork,
    networks: [...supportedSuiNetworks],
  }));

  return app;
}
