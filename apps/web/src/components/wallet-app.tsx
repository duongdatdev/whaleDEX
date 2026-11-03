'use client';

import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { dAppKit } from '../lib/dapp-kit';
import { env } from '../env';
import { WalletPanel } from './wallet-panel';
import { TradeDesk } from './trade-desk';
import { useState } from 'react';

export default function WalletApp() {
  const [balanceVersion, setBalanceVersion] = useState(0);
  if (env.NEXT_PUBLIC_DEFAULT_SUI_NETWORK !== 'testnet') {
    return (
      <p role="alert">
        Giao dịch chỉ khả dụng trên Sui Testnet. Cấu hình ứng dụng đang dùng Mainnet.
      </p>
    );
  }
  return (
    <DAppKitProvider dAppKit={dAppKit}>
      <WalletPanel key={balanceVersion} />
      <TradeDesk onConfirmed={() => setBalanceVersion((value) => value + 1)} />
    </DAppKitProvider>
  );
}
