'use client';

import { useEffect, useState } from 'react';
import { formatUnits } from '../lib/amounts';
import { MARKET } from '../lib/deepbook';

const ALLOWED_COINS = [MARKET.base, MARKET.quote, MARKET.fee] as const;
type CoinSymbol = (typeof ALLOWED_COINS)[number]['symbol'];
type BalanceSnapshot = Partial<Record<CoinSymbol, { amount: string; updatedAt: number }>>;

const STALE_AFTER_MS = 30_000;

export function WalletBalances({
  owner,
  client,
  refreshVersion,
}: {
  owner: string;
  client: {
    core: {
      getBalance(args: {
        owner: string;
        coinType: string;
      }): Promise<{ balance: { balance: string } }>;
    };
  };
  refreshVersion: number;
}) {
  const [snapshot, setSnapshot] = useState<BalanceSnapshot>({});
  const [failedCoins, setFailedCoins] = useState<ReadonlySet<CoinSymbol>>(() => new Set());
  const [manualRefresh, setManualRefresh] = useState(0);
  const [completedRequest, setCompletedRequest] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const requestKey = `${refreshVersion}:${manualRefresh}`;
  const loading = completedRequest !== requestKey;
  const hasBalances = Object.keys(snapshot).length > 0;

  useEffect(() => {
    let active = true;
    Promise.allSettled(
      ALLOWED_COINS.map(async (coin) => {
        const result = await client.core.getBalance({ owner, coinType: coin.type });
        return {
          symbol: coin.symbol,
          amount: formatUnits(BigInt(result.balance.balance), coin.decimals),
        };
      }),
    ).then((results) => {
      if (!active) return;
      const updatedAt = Date.now();
      const nextFailures = new Set<CoinSymbol>();
      const nextSnapshot: BalanceSnapshot = {};
      results.forEach((result, index) => {
        const coin = ALLOWED_COINS[index];
        if (!coin) return;
        if (result.status === 'fulfilled') {
          nextSnapshot[result.value.symbol] = { amount: result.value.amount, updatedAt };
        } else {
          nextFailures.add(coin.symbol);
        }
      });
      setSnapshot((current) => ({ ...current, ...nextSnapshot }));
      setFailedCoins(nextFailures);
      setCompletedRequest(requestKey);
    });
    return () => {
      active = false;
    };
  }, [client, owner, refreshVersion, manualRefresh, requestKey]);

  useEffect(() => {
    if (!hasBalances) return;
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [hasBalances]);

  const failedSymbols = ALLOWED_COINS.filter((coin) => failedCoins.has(coin.symbol)).map(
    (coin) => coin.symbol,
  );

  return (
    <section className="wallet-balances" aria-labelledby="wallet-balances-heading">
      <div className="row wallet-balances__heading">
        <div>
          <h3 id="wallet-balances-heading">Số dư ví Testnet</h3>
          <p>Đọc trực tiếp on-chain · Không gồm tài sản trong BalanceManager</p>
        </div>
        <button
          className="wallet-secondary-action"
          onClick={() => setManualRefresh((value) => value + 1)}
          disabled={loading}
        >
          {loading ? 'Đang cập nhật…' : 'Làm mới số dư'}
        </button>
      </div>
      {failedSymbols.length > 0 && (
        <p className="wallet-error" role="alert">
          Không đọc được số dư {failedSymbols.join(', ')}. Giá trị cũ (nếu có) được giữ lại và đánh
          dấu; hãy thử làm mới.
        </p>
      )}
      <ul className="wallet-balance-list" aria-label="Số dư các coin được cho phép">
        {ALLOWED_COINS.map((coin) => {
          const balance = snapshot[coin.symbol];
          const age = balance ? Math.floor((now - balance.updatedAt) / 1000) : undefined;
          const stale =
            !!balance && (failedCoins.has(coin.symbol) || (age ?? 0) * 1000 >= STALE_AFTER_MS);
          const amountText = balance
            ? `${balance.amount} ${coin.symbol}`
            : loading
              ? 'Đang tải…'
              : 'Không đọc được';
          const stateText = balance
            ? stale
              ? `Dữ liệu cũ · ${age} giây trước`
              : loading
                ? 'Đang làm mới…'
                : age === 0
                  ? 'Vừa cập nhật'
                  : `Cập nhật ${age} giây trước`
            : loading
              ? 'Đang tải số dư…'
              : 'Chưa có dữ liệu';

          return (
            <li
              className="wallet-balance-row"
              key={coin.symbol}
              data-state={stale ? 'stale' : undefined}
            >
              <div className="wallet-balance-row__coin">
                <strong>{coin.symbol}</strong>
                <code className="wallet-balance-row__type">{coin.type}</code>
              </div>
              <div className="wallet-balance-row__amount" aria-live="polite">
                <span className="mono">{amountText}</span>
                <small>{stateText}</small>
              </div>
            </li>
          );
        })}
      </ul>
      {!hasBalances && loading && (
        <p className="wallet-balance-loading" role="status" aria-live="polite">
          Đang tải số dư SUI, DBUSDC và DEEP…
        </p>
      )}
    </section>
  );
}
