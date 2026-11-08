import { SuiGrpcClient } from '@mysten/sui/grpc';
import { resolveSuiConnection, type SuiNetworkName, type SuiReadiness } from '@whaledex/shared';

type ServiceInfo = { chain?: string; checkpointHeight?: bigint };
export type ReadServiceInfo = (signal: AbortSignal) => Promise<ServiceInfo>;

export function createSuiReadinessCheck(
  input: { network: SuiNetworkName; grpcUrl?: string; timeoutMs?: number },
  readServiceInfo?: ReadServiceInfo,
): () => Promise<SuiReadiness> {
  const config = resolveSuiConnection(input);
  const client = new SuiGrpcClient({
    network: config.network,
    baseUrl: config.grpcUrl,
    timeout: config.timeoutMs,
  });
  const read: ReadServiceInfo =
    readServiceInfo ??
    (async (signal) => {
      const { response } = await client.ledgerService.getServiceInfo({}, { abort: signal });
      return response;
    });

  return async () => {
    try {
      const info = await read(AbortSignal.timeout(config.timeoutMs));
      if (!info.chain || typeof info.checkpointHeight !== 'bigint' || info.checkpointHeight < 0n) {
        return { status: 'unavailable', network: config.network, code: 'SUI_INVALID_RESPONSE' };
      }
      if (info.chain !== config.network) {
        return { status: 'unavailable', network: config.network, code: 'SUI_NETWORK_MISMATCH' };
      }
      return {
        status: 'ok',
        network: config.network,
        checkpoint: info.checkpointHeight.toString(),
      };
    } catch {
      // Provider errors can include credential-bearing URLs: never expose them to callers.
      return { status: 'unavailable', network: config.network, code: 'SUI_UNAVAILABLE' };
    }
  };
}
