import { getChain, supportedChains } from '@whaledex/shared';
import { env } from '../env';

export const chains = supportedChains;
export const defaultChain = getChain(env.NEXT_PUBLIC_DEFAULT_CHAIN_ID);
