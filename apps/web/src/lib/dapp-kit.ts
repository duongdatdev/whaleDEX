import { createDAppKit } from '@mysten/dapp-kit-react';
import { createSuiClient } from './sui-client';

export const dAppKit = createDAppKit({
  networks: ['testnet'],
  createClient: () => createSuiClient('testnet'),
});

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
