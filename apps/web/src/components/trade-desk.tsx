'use client';

import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { useEffect, useRef, useState } from 'react';
import { formatUnits } from '../lib/amounts';
import {
  assertFresh,
  GAS_BUDGET,
  MARKET,
  prepareSwap,
  quoteSwap,
  readMarket,
  type MarketSnapshot,
  type Side,
  type SwapQuote,
} from '../lib/deepbook';

type TxRecord = {
  digest: string;
  owner: string;
  status: 'awaiting-signature' | 'submitted' | 'confirmed' | 'failed' | 'rejected' | 'unknown';
};
const STORAGE_KEY = 'whaledex:testnet:last-swap';
const STATUS = {
  'awaiting-signature': 'Đang chờ ký trong ví',
  submitted: 'Đã gửi, đang chờ xác nhận',
  confirmed: 'Đã xác nhận on-chain',
  failed: 'Giao dịch thất bại on-chain',
  rejected: 'Đã từ chối ký',
  unknown: 'Chưa xác định kết quả. Kiểm tra digest trước khi tạo giao dịch mới.',
};
function restore(): TxRecord | null {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (
      data &&
      /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(data.digest) &&
      /^0x[0-9a-f]{64}$/i.test(data.owner)
    ) {
      return {
        digest: data.digest,
        owner: data.owner,
        status: ['confirmed', 'failed', 'rejected'].includes(data.status) ? data.status : 'unknown',
      };
    }
  } catch {
    /* Storage may be disabled. */
  }
  return null;
}

export function TradeDesk({ onConfirmed }: { onConfirmed: () => void }) {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const kit = useDAppKit();
  const [market, setMarket] = useState<MarketSnapshot>();
  const [marketError, setMarketError] = useState(false);
  const [marketVersion, setMarketVersion] = useState(0);
  const [side, setSide] = useState<Side>('buy');
  const [amount, setAmount] = useState('');
  const [bps, setBps] = useState(50);
  const [review, setReview] = useState<{
    quote: SwapQuote;
    prepared: Awaited<ReturnType<typeof prepareSwap>>;
  }>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const request = useRef(0);
  const [now, setNow] = useState(() => Date.now());
  const [record, setRecord] = useState<TxRecord | null>(restore);
  const [checking, setChecking] = useState(false);

  function save(next: TxRecord) {
    setRecord(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Keep the digest visible even without storage. */
    }
  }
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    readMarket(client)
      .then((data) => {
        if (active) {
          setMarket(data);
          setMarketError(false);
        }
      })
      .catch(() => {
        if (active) setMarketError(true);
      });
    return () => {
      active = false;
    };
  }, [client, marketVersion]);

  const supported = account?.chains.includes('sui:testnet') && client.network === 'testnet';
  const currentReview = review?.quote.owner === account?.address ? review : undefined;
  const fresh = currentReview && now < currentReview.quote.expiresAt;
  const unresolved =
    record && ['awaiting-signature', 'submitted', 'unknown'].includes(record.status);

  function invalidate() {
    request.current++;
    setReview(undefined);
    setMessage('');
  }
  async function preview() {
    if (!account || !supported || lock.current || unresolved) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    setReview(undefined);
    const id = ++request.current;
    const owner = account.address;
    try {
      const quote = await quoteSwap(client, owner, side, amount, bps);
      const prepared = await prepareSwap(client, quote);
      if (request.current === id && kit.stores.$connection.get().account?.address === owner)
        setReview({ quote, prepared });
    } catch (error) {
      if (request.current === id)
        setMessage(
          error instanceof Error && !/https?:/.test(error.message)
            ? error.message
            : 'Không thể chuẩn bị giao dịch. Kiểm tra kết nối và thử lại.',
        );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function checkTransaction(tx: TxRecord) {
    setChecking(true);
    try {
      const result = await client.core.waitForTransaction({ digest: tx.digest, timeout: 20_000 });
      save({ ...tx, status: result.FailedTransaction ? 'failed' : 'confirmed' });
      if (!result.FailedTransaction) {
        onConfirmed();
        setMarketVersion((value) => value + 1);
      }
    } catch {
      save({ ...tx, status: 'unknown' });
    } finally {
      setChecking(false);
    }
  }
  async function submit() {
    if (!currentReview || !account || !supported || lock.current || unresolved) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    let pending: TxRecord | undefined;
    try {
      const active = kit.stores.$connection.get().account;
      if (
        !active ||
        active.address !== currentReview.quote.owner ||
        !active.chains.includes('sui:testnet')
      )
        throw new Error('Tài khoản đã đổi. Lấy quote mới.');
      assertFresh(currentReview.quote, active.address);
      pending = {
        digest: currentReview.prepared.digest,
        owner: active.address,
        status: 'awaiting-signature',
      };
      save(pending);
      const result = await kit.signAndExecuteTransaction({
        transaction: currentReview.prepared.transaction,
        account: active,
        network: 'testnet',
      });
      const tx = result.Transaction ?? result.FailedTransaction;
      pending = { ...pending, digest: tx.digest, status: 'submitted' };
      save(pending);
      setReview(undefined);
      await checkTransaction(pending);
    } catch (error) {
      if (pending) {
        const rejected =
          typeof error === 'object' && error !== null && 'code' in error && error.code === 4001;
        save({ ...pending, status: rejected ? 'rejected' : 'unknown' });
      } else setMessage(error instanceof Error ? error.message : 'Không thể yêu cầu ký.');
      setReview(undefined);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <section className="panel" aria-labelledby="market-heading">
        <div className="row">
          <h2 id="market-heading">SUI / DBUSDC</h2>
          <button onClick={() => setMarketVersion((value) => value + 1)}>Làm mới thị trường</button>
        </div>
        <p>
          DeepBookV3 · Testnet ·{' '}
          <a
            href={`https://suiscan.xyz/testnet/object/${MARKET.pool}`}
            target="_blank"
            rel="noreferrer"
          >
            Pool đã đối chiếu SDK ↗
          </a>
        </p>
        {marketError ? (
          <p role="alert">Không đọc được thị trường. Dữ liệu cũ không dùng để giao dịch.</p>
        ) : !market ? (
          <p role="status">Đang xác minh pool và tải sổ lệnh…</p>
        ) : (
          <>
            <p>
              Cập nhật {Math.floor((now - market.updatedAt) / 1000)} giây trước{' '}
              {now - market.updatedAt > 30_000 ? '· Dữ liệu cũ, hãy làm mới' : ''}
            </p>
            <div className="book-grid">
              {(['bid', 'ask'] as const).map((kind) => (
                <div key={kind}>
                  <h3>{kind === 'bid' ? 'Bên mua' : 'Bên bán'}</h3>
                  {market.book[`${kind}_prices`].length === 0 ? (
                    <p>Chưa có thanh khoản.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Giá (DBUSDC)</th>
                          <th>Số lượng (SUI)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {market.book[`${kind}_prices`].map((price, index) => (
                          <tr key={index}>
                            <td>{price}</td>
                            <td>{market.book[`${kind}_quantities`][index]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
            <p>
              Lot size: {market.params.lotSize} SUI · Minimum size: {market.params.minSize} SUI
            </p>
          </>
        )}
        <details>
          <summary>Coin type được phép</summary>
          {[MARKET.base, MARKET.quote, MARKET.fee].map((coin) => (
            <p className="mono address" key={coin.symbol}>
              {coin.symbol}: {coin.type}
            </p>
          ))}
        </details>
      </section>
      <section className="panel" aria-labelledby="swap-heading">
        <h2 id="swap-heading">Đổi token</h2>
        <p>Swap qua sổ lệnh DeepBook. Phí giao dịch trả bằng DEEP Testnet; cần SUI để trả gas.</p>
        <div className="trade-form">
          <label>
            Chiều giao dịch
            <select
              value={side}
              disabled={busy}
              onChange={(event) => {
                setSide(event.target.value as Side);
                invalidate();
              }}
            >
              <option value="buy">DBUSDC → SUI</option>
              <option value="sell">SUI → DBUSDC</option>
            </select>
          </label>
          <label>
            Số lượng {side === 'sell' ? 'SUI' : 'DBUSDC'}
            <input
              inputMode="decimal"
              value={amount}
              disabled={busy}
              onChange={(event) => {
                setAmount(event.target.value);
                invalidate();
              }}
              placeholder="0.00"
            />
          </label>
          <label>
            Trượt giá tối đa
            <select
              value={bps}
              disabled={busy}
              onChange={(event) => {
                setBps(Number(event.target.value));
                invalidate();
              }}
            >
              <option value={10}>0,1%</option>
              <option value={50}>0,5%</option>
              <option value={100}>1%</option>
            </select>
          </label>
          <button onClick={preview} disabled={!supported || busy || !!unresolved || !amount}>
            {busy ? 'Đang xử lý…' : 'Lấy quote & mô phỏng'}
          </button>
        </div>
        {!supported && <p>Kết nối ví hỗ trợ Sui Testnet để tiếp tục.</p>}
        {message && <p role="alert">{message}</p>}
        {currentReview && (
          <div className="review" aria-label="Xem lại giao dịch">
            <h3>Xem lại trước khi ký</h3>
            <p>
              Gửi tối đa: {formatUnits(currentReview.quote.amount, side === 'sell' ? 9 : 6)}{' '}
              {side === 'sell' ? 'SUI' : 'DBUSDC'}; phần dư được trả về ví.
            </p>
            <p>
              Ước tính nhận: {formatUnits(currentReview.quote.output, side === 'sell' ? 6 : 9)}{' '}
              {side === 'sell' ? 'DBUSDC' : 'SUI'}
            </p>
            <p>
              Nhận tối thiểu:{' '}
              <strong>
                {formatUnits(currentReview.quote.minimum, side === 'sell' ? 6 : 9)}{' '}
                {side === 'sell' ? 'DBUSDC' : 'SUI'}
              </strong>
            </p>
            <p>
              DEEP cấp cho phí: {formatUnits(currentReview.quote.deepFee, 6)} DEEP (phần dư trả về
              ví).
            </p>
            <p>
              Gas mô phỏng: {formatUnits(currentReview.prepared.gasEstimate, 9)} SUI · Giới hạn gas:{' '}
              {formatUnits(GAS_BUDGET, 9)} SUI
            </p>
            <p className="mono address">Người nhận: {currentReview.quote.owner}</p>
            <p>
              {fresh
                ? `Quote còn ${Math.ceil((currentReview.quote.expiresAt - now) / 1000)} giây`
                : 'Quote hết hạn. Lấy quote mới.'}
            </p>
            <button onClick={submit} disabled={!fresh || busy || !supported || !!unresolved}>
              Xác nhận & ký trong ví
            </button>
          </div>
        )}
      </section>
      {record && (
        <section className="panel" aria-label="Giao dịch gần nhất" aria-live="polite">
          <h2>Giao dịch gần nhất · Testnet</h2>
          <p>{STATUS[record.status]}</p>
          <p className="mono address">Ví: {record.owner}</p>
          <a
            className="mono address"
            href={`https://suiscan.xyz/testnet/tx/${record.digest}`}
            target="_blank"
            rel="noreferrer"
          >
            {record.digest} ↗
          </a>
          {['unknown', 'submitted'].includes(record.status) && (
            <p>
              <button disabled={checking || busy} onClick={() => checkTransaction(record)}>
                {checking ? 'Đang kiểm tra…' : 'Kiểm tra lại trạng thái'}
              </button>
            </p>
          )}
          {record.status === 'unknown' && (
            <p>
              <button
                disabled={checking || busy}
                onClick={() => {
                  if (
                    window.confirm(
                      'Chỉ tiếp tục sau khi đã kiểm tra Explorer và ví. Giao dịch cũ có thể vẫn được gửi. Bỏ theo dõi giao dịch này?',
                    )
                  ) {
                    setRecord(null);
                    try {
                      localStorage.removeItem(STORAGE_KEY);
                    } catch {
                      /* optional storage */
                    }
                  }
                }}
              >
                Bỏ theo dõi sau khi kiểm tra ví/Explorer
              </button>
            </p>
          )}
        </section>
      )}
    </>
  );
}
