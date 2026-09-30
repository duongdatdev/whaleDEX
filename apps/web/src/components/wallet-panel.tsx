'use client';

import { useCurrentAccount, useCurrentClient, useCurrentNetwork } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { useEffect, useState } from 'react';
import { formatUnits } from '../lib/amounts';

export function WalletPanel() {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const network = useCurrentNetwork();
  return (
    <section className="panel" aria-label="Ví Sui">
      <div className="row">
        <h2>Ví của bạn</h2>
        <ConnectButton />
      </div>
      {account ? (
        <>
          <p className="mono address">{account.address}</p>
          {network !== 'testnet' || !account.chains.includes('sui:testnet') ? (
            <p role="alert">Chuyển ví sang Sui Testnet để giao dịch.</p>
          ) : (
            <WalletBalance
              key={`${network}:${account.address}`}
              owner={account.address}
              client={client}
            />
          )}
        </>
      ) : (
        <p>
          Kết nối ví Sui để xem số dư và ký giao dịch. Nếu chưa có ví, cài ví hỗ trợ Sui Wallet
          Standard.
        </p>
      )}
      <a href="https://faucet.sui.io/?network=testnet" target="_blank" rel="noreferrer">
        Nhận SUI Testnet từ faucet ↗
      </a>
    </section>
  );
}

export function WalletBalance({
  owner,
  client,
}: {
  owner: string;
  client: ReturnType<typeof useCurrentClient>;
}) {
  const [balance, setBalance] = useState<string>();
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    client.core
      .getBalance({ owner })
      .then(({ balance }) => {
        if (active) setBalance(formatUnits(BigInt(balance.balance), 9));
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [client, owner, refresh]);
  return (
    <div aria-live="polite">
      <p>
        {error
          ? 'Không đọc được số dư. Hãy thử lại.'
          : balance === undefined
            ? 'Đang đọc số dư…'
            : `Số dư ví: ${balance} SUI`}
      </p>
      <button
        onClick={() => {
          setError(false);
          setBalance(undefined);
          setRefresh((value) => value + 1);
        }}
      >
        Làm mới số dư
      </button>
    </div>
  );
}
