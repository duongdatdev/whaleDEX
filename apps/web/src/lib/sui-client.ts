import { SuiGrpcClient } from '@mysten/sui/grpc';
import { resolveSuiConnection, type SuiNetworkName } from '@whaledex/shared';
import { env } from '../env';

// A selected-network override must never be reused for a different network.
export function createSuiClient(network: SuiNetworkName = env.NEXT_PUBLIC_DEFAULT_SUI_NETWORK) {
  const config = resolveSuiConnection({
    network,
    grpcUrl:
      network === env.NEXT_PUBLIC_DEFAULT_SUI_NETWORK ? env.NEXT_PUBLIC_SUI_GRPC_URL : undefined,
    timeoutMs: env.NEXT_PUBLIC_SUI_GRPC_TIMEOUT_MS,
  });
  return new SuiGrpcClient({
    network: config.network,
    baseUrl: config.grpcUrl,
    timeout: config.timeoutMs,
  });
}
