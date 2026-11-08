import { getSuiNetwork, supportedSuiNetworks } from '@whaledex/shared';
import { env } from '../env';

export const suiNetworks = supportedSuiNetworks;
export const defaultSuiNetwork = getSuiNetwork(env.NEXT_PUBLIC_DEFAULT_SUI_NETWORK);
