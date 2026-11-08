'use client';

import {
  useCurrentAccount,
  useCurrentClient,
  useCurrentNetwork,
  useDAppKit,
  useWalletConnection,
  useWallets,
} from '@mysten/dapp-kit-react';
import { useEffect, useRef, useState } from 'react';
import { formatUnits } from '../lib/amounts';

function isRequestRejected(error: unknown) {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  return error.code === 4001 || error.code === 4001000;
}

export function WalletPanel() {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const network = useCurrentNetwork();
  const connection = useWalletConnection();
  const wallets = useWallets();
  const kit = useDAppKit();
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);
  const connectTrigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const currentWallet = connection.status === 'connected' ? connection.wallet : null;
  const supportedAccount = network === 'testnet' && account?.chains.includes('sui:testnet');

  useEffect(() => {
    if (!connectOpen) return;
    const trigger = connectTrigger.current;
    const frame = window.requestAnimationFrame(() => {
      dialog.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    });
    function keepFocusInside(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setConnectOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialog.current) return;
      const items = Array.from(
        dialog.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!items.length) {
        event.preventDefault();
        dialog.current.focus();
        return;
      }
      const first = items.at(0);
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', keepFocusInside);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', keepFocusInside);
      trigger?.focus();
    };
  }, [connectOpen]);

  async function connect(wallet: (typeof wallets)[number]) {
    if (connectingWallet) return;
    setConnectionError('');
    setConnectingWallet(wallet.name);
    try {
      await kit.connectWallet({ wallet });
      setConnectOpen(false);
    } catch (error) {
      setConnectionError(
        isRequestRejected(error)
          ? 'Bạn đã từ chối yêu cầu kết nối trong ví. Chọn thử lại hoặc chọn ví khác.'
          : 'Không thể kết nối ví. Hãy mở khóa ví rồi thử lại.',
      );
    } finally {
      setConnectingWallet('');
    }
  }

  async function disconnect() {
    setConnectionError('');
    setDisconnecting(true);
    try {
      await kit.disconnectWallet();
    } catch {
      setConnectionError('Không thể ngắt kết nối ví. Hãy thử lại.');
    } finally {
      setDisconnecting(false);
    }
  }

  const statusText =
    connection.status === 'connecting'
      ? 'Đang chờ xác nhận từ ví…'
      : connection.status === 'reconnecting'
        ? 'Đang kết nối lại ví…'
        : currentWallet
          ? `Đã kết nối · ${currentWallet.name}`
          : 'Chưa kết nối ví';

  return (
    <section className="panel wallet-panel" aria-labelledby="wallet-heading">
      <div className="row wallet-panel__heading">
        <div>
          <h2 id="wallet-heading">Ví của bạn</h2>
          <p className="wallet-network">Mạng ứng dụng: Sui Testnet</p>
        </div>
        {currentWallet ? (
          <button className="wallet-secondary-action" onClick={disconnect} disabled={disconnecting}>
            {disconnecting ? 'Đang ngắt kết nối…' : 'Ngắt kết nối'}
          </button>
        ) : (
          <button
            ref={connectTrigger}
            onClick={() => {
              setConnectionError('');
              setConnectOpen(true);
            }}
            disabled={connection.isConnecting || connection.isReconnecting}
          >
            {connection.isConnecting || connection.isReconnecting ? 'Đang kết nối…' : 'Kết nối ví'}
          </button>
        )}
      </div>

      <p
        className="wallet-status"
        data-state={connection.status === 'connected' && supportedAccount ? 'connected' : 'disconnected'}
        role="status"
        aria-live="polite"
      >
        <span className="wallet-status__dot" aria-hidden="true" />
        {statusText}
      </p>

      {connectionError && <p className="wallet-error" role="alert">{connectionError}</p>}
      {account ? (
        <>
          <p className="mono address wallet-address" aria-label="Địa chỉ ví">
            {account.address}
          </p>
          {!supportedAccount ? (
            <p className="wallet-error" role="alert">
              Ví hoặc mạng hiện tại chưa ở Sui Testnet. Chuyển tài khoản sang Testnet để xem số dư
              và giao dịch.
            </p>
          ) : (
            <WalletBalance
              key={`${network}:${account.address}`}
              owner={account.address}
              client={client}
            />
          )}
        </>
      ) : (
        <p className="wallet-help">
          Kết nối ví hỗ trợ Sui Wallet Standard để xem số dư và ký giao dịch. Nếu chưa có ví, hãy
          cài ví Sui rồi tải lại trang.
        </p>
      )}
      <a className="wallet-faucet" href="https://faucet.sui.io/?network=testnet" target="_blank" rel="noreferrer">
        Nhận SUI Testnet từ faucet ↗
      </a>

      {connectOpen && (
        <div
          className="wallet-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !connectingWallet) setConnectOpen(false);
          }}
        >
          <div
            className="wallet-modal"
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-dialog-title"
            tabIndex={-1}
          >
            <div className="wallet-modal__heading">
              <div>
                <p className="wallet-network">Kết nối an toàn · Sui Testnet</p>
                <h2 id="wallet-dialog-title">Chọn ví để tiếp tục</h2>
              </div>
              <button
                className="wallet-modal__close"
                aria-label="Đóng cửa sổ kết nối ví"
                onClick={() => setConnectOpen(false)}
                disabled={!!connectingWallet}
              >
                ×
              </button>
            </div>
            {connectionError && <p className="wallet-error" role="alert">{connectionError}</p>}
            {connection.isConnecting || connectingWallet ? (
              <p className="wallet-modal__message" role="status" aria-live="polite">
                Đang chờ {connectingWallet || 'ví'} xác nhận. Hãy kiểm tra cửa sổ ví của bạn.
              </p>
            ) : wallets.length ? (
              <ul className="wallet-options" aria-label="Ví tương thích">
                {wallets.map((wallet) => (
                  <li key={wallet.name}>
                    <button
                      className="wallet-option"
                      onClick={() => connect(wallet)}
                      disabled={!!connectingWallet}
                    >
                      <span className="wallet-option__mark" aria-hidden="true">↗</span>
                      <span>
                        <strong>{wallet.name}</strong>
                        <small>Ví Sui tương thích · Testnet</small>
                      </span>
                      <span className="wallet-option__arrow" aria-hidden="true">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="wallet-modal__empty">
                <p className="wallet-modal__empty-mark" aria-hidden="true">◇</p>
                <h3>Chưa tìm thấy ví</h3>
                <p>
                  Cài ví hỗ trợ Sui Wallet Standard, mở khóa ví rồi tải lại trang để kết nối.
                </p>
              </div>
            )}
            <button
              className="wallet-secondary-action wallet-modal__cancel"
              onClick={() => setConnectOpen(false)}
              disabled={!!connectingWallet}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
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
    <div className="wallet-balance" aria-live="polite">
      <p className="wallet-balance__value">
        {error
          ? 'Không đọc được số dư. Hãy thử lại.'
          : balance === undefined
            ? 'Đang đọc số dư…'
            : `Số dư ví: ${balance} SUI`}
      </p>
      {error && (
        <button
          className="wallet-secondary-action"
          onClick={() => {
            setError(false);
            setBalance(undefined);
            setRefresh((value) => value + 1);
          }}
        >
          Làm mới số dư
        </button>
      )}
    </div>
  );
}
