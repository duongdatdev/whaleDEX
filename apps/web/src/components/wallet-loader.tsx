'use client';

import dynamic from 'next/dynamic';

const WalletApp = dynamic(() => import('./wallet-app'), {
  ssr: false,
  loading: () => <p role="status">Đang tải ví…</p>,
});

export function WalletLoader() {
  return <WalletApp />;
}
