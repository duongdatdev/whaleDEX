'use client';

import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { dAppKit } from '../lib/dapp-kit';
import { env } from '../env';
import { WalletPanel } from './wallet-panel';

export default function WalletApp() {
  if (env.NEXT_PUBLIC_DEFAULT_SUI_NETWORK !== 'testnet') {
    return (
      <p role="alert">
        Giao dịch chỉ khả dụng trên Sui Testnet. Cấu hình ứng dụng đang dùng Mainnet.
      </p>
    );
  }
  return (
    <DAppKitProvider dAppKit={dAppKit}>
      <WalletPanel />
    </DAppKitProvider>
  );
}
