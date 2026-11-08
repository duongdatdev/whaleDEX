import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { TradeDesk } from './trade-desk';

const mocks = vi.hoisted(() => {
  const account = { address: `0x${'1'.repeat(64)}`, chains: ['sui:testnet'] };
  const wait = vi.fn();
  return {
    account,
    current: account as typeof account | null,
    network: 'testnet',
    quote: vi.fn(),
    prepare: vi.fn(),
    sign: vi.fn(),
    wait,
    client: { network: 'testnet', core: { waitForTransaction: wait } },
    market: vi.fn(),
    connections: new Set<(value: { account: typeof account | null }) => void>(),
    networks: new Set<(value: string) => void>(),
  };
});
vi.mock('@mysten/dapp-kit-react', () => {
  const kit = {
    signAndExecuteTransaction: mocks.sign,
    stores: {
      $connection: {
        get: () => ({ account: mocks.current }),
        subscribe: (listener: (value: { account: typeof mocks.current }) => void) => {
          mocks.connections.add(listener);
          listener({ account: mocks.current });
          return () => mocks.connections.delete(listener);
        },
      },
      $currentNetwork: {
        get: () => mocks.network,
        subscribe: (listener: (value: string) => void) => {
          mocks.networks.add(listener);
          listener(mocks.network);
          return () => mocks.networks.delete(listener);
        },
      },
    },
  };
  return {
    useCurrentAccount: () => mocks.current,
    useCurrentClient: () => mocks.client,
    useCurrentNetwork: () => mocks.network,
    useDAppKit: () => kit,
  };
});
vi.mock('../lib/deepbook', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/deepbook')>()),
  quoteSwap: mocks.quote,
  prepareSwap: mocks.prepare,
  readMarket: mocks.market,
}));
const digest = 'A'.repeat(44);
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.current = mocks.account;
  mocks.network = 'testnet';
  mocks.client.network = 'testnet';
  mocks.market.mockResolvedValue({
    book: { bid_prices: [], bid_quantities: [], ask_prices: [1.5], ask_quantities: [1] },
    params: { lotSize: 0.1, minSize: 1 },
    updatedAt: Date.now(),
  });
  mocks.quote.mockResolvedValue({
    owner: mocks.account.address,
    side: 'buy',
    amount: 2000000n,
    output: 1300000000n,
    minimum: 1293500000n,
    deepFee: 60028n,
    expiresAt: Date.now() + 30000,
  });
  mocks.prepare.mockResolvedValue({ transaction: {}, digest, gasEstimate: 10000n });
  mocks.sign.mockResolvedValue({ Transaction: { digest } });
  mocks.wait.mockResolvedValue({ Transaction: { digest } });
});
async function preview() {
  fireEvent.change(screen.getByLabelText('Số lượng DBUSDC'), { target: { value: '2' } });
  fireEvent.click(screen.getByText('Lấy quote & mô phỏng'));
  await screen.findByText('Xem lại trước khi ký');
}
function switchAccount(account: typeof mocks.current) {
  act(() => {
    mocks.current = account;
    mocks.connections.forEach((listener) => listener({ account }));
  });
}
function switchNetwork(network: string) {
  act(() => {
    mocks.network = network;
    mocks.client.network = network;
    mocks.networks.forEach((listener) => listener(network));
  });
}
it('reviews and signs once, then confirms only after the chain response', async () => {
  let confirm!: (value: unknown) => void;
  mocks.wait.mockReturnValue(
    new Promise((resolve) => {
      confirm = resolve;
    }),
  );
  const onConfirmed = vi.fn();
  render(<TradeDesk onConfirmed={onConfirmed} />);
  await preview();
  expect(mocks.sign).not.toHaveBeenCalled();
  const button = screen.getByText('Xác nhận & ký trong ví');
  fireEvent.click(button);
  fireEvent.click(button);
  await screen.findByText('Đã gửi, đang chờ xác nhận');
  expect(mocks.sign).toHaveBeenCalledTimes(1);
  expect(onConfirmed).not.toHaveBeenCalled();
  await act(async () => {
    confirm({ Transaction: { digest } });
  });
  expect(screen.getByText('Đã xác nhận on-chain')).toBeInTheDocument();
  expect(onConfirmed).toHaveBeenCalledOnce();
});
it('invalidates review on changed input or wallet account', async () => {
  const view = render(<TradeDesk onConfirmed={vi.fn()} />);
  await preview();
  switchAccount({ ...mocks.account, address: `0x${'2'.repeat(64)}` });
  view.rerender(<TradeDesk onConfirmed={vi.fn()} />);
  expect(screen.queryByText('Xác nhận & ký trong ví')).not.toBeInTheDocument();
  switchAccount(mocks.account);
  view.rerender(<TradeDesk onConfirmed={vi.fn()} />);
  expect(screen.queryByText('Xác nhận & ký trong ví')).not.toBeInTheDocument();
  await preview();
  fireEvent.change(screen.getByLabelText('Số lượng DBUSDC'), { target: { value: '3' } });
  expect(screen.queryByText('Xác nhận & ký trong ví')).not.toBeInTheDocument();
  expect(mocks.sign).not.toHaveBeenCalled();
});

it('discards an in-flight quote after leaving and returning to the same account', async () => {
  let resolveQuote!: (value: unknown) => void;
  const quote = await mocks.quote();
  mocks.quote.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveQuote = resolve;
    }),
  );
  const view = render(<TradeDesk onConfirmed={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Số lượng DBUSDC'), { target: { value: '2' } });
  fireEvent.click(screen.getByText('Lấy quote & mô phỏng'));
  switchAccount(null);
  view.rerender(<TradeDesk onConfirmed={vi.fn()} />);
  switchAccount(mocks.account);
  view.rerender(<TradeDesk onConfirmed={vi.fn()} />);
  await act(async () => {
    resolveQuote(quote);
  });
  expect(screen.queryByText('Xác nhận & ký trong ví')).not.toBeInTheDocument();
  expect(mocks.sign).not.toHaveBeenCalled();
});

it('discards an in-flight quote when the network changes away and back', async () => {
  let resolveQuote!: (value: unknown) => void;
  const quote = await mocks.quote();
  mocks.quote.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveQuote = resolve;
    }),
  );
  const view = render(<TradeDesk onConfirmed={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Số lượng DBUSDC'), { target: { value: '2' } });
  fireEvent.click(screen.getByText('Lấy quote & mô phỏng'));
  switchNetwork('mainnet');
  switchNetwork('testnet');
  view.rerender(<TradeDesk onConfirmed={vi.fn()} />);
  await act(async () => resolveQuote(quote));
  expect(screen.queryByText('Xem lại trước khi ký')).not.toBeInTheDocument();
  expect(mocks.sign).not.toHaveBeenCalled();
});

it('clears an existing review and blocks signing outside Testnet', async () => {
  const view = render(<TradeDesk onConfirmed={vi.fn()} />);
  await preview();
  switchNetwork('mainnet');
  view.rerender(<TradeDesk onConfirmed={vi.fn()} />);
  expect(screen.queryByText('Xem lại trước khi ký')).not.toBeInTheDocument();
  expect(screen.getByText('Lấy quote & mô phỏng')).toBeDisabled();
  expect(mocks.sign).not.toHaveBeenCalled();
});

it.each([{}, { Transaction: { digest: 'B'.repeat(44) } }])(
  'keeps incomplete or mismatched transaction responses unknown',
  async (result) => {
    mocks.wait.mockResolvedValue(result);
    const onConfirmed = vi.fn();
    render(<TradeDesk onConfirmed={onConfirmed} />);
    await preview();
    fireEvent.click(screen.getByText('Xác nhận & ký trong ví'));
    await screen.findByText(/Chưa xác định kết quả/);
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(screen.getByText('Lấy quote & mô phỏng')).toBeDisabled();
  },
);

it('keeps tracking a submitted transaction after the connected account changes', async () => {
  let confirm!: (value: unknown) => void;
  mocks.wait.mockReturnValue(
    new Promise((resolve) => {
      confirm = resolve;
    }),
  );
  const onConfirmed = vi.fn();
  const view = render(<TradeDesk onConfirmed={onConfirmed} />);
  await preview();
  fireEvent.click(screen.getByText('Xác nhận & ký trong ví'));
  await screen.findByText('Đã gửi, đang chờ xác nhận');
  switchAccount({ ...mocks.account, address: `0x${'2'.repeat(64)}` });
  view.rerender(<TradeDesk onConfirmed={onConfirmed} />);
  await act(async () => {
    confirm({ Transaction: { digest } });
  });
  expect(screen.getByText('Đã xác nhận on-chain')).toBeInTheDocument();
  expect(screen.getByText(`Ví: ${mocks.account.address}`)).toBeInTheDocument();
  expect(onConfirmed).toHaveBeenCalledOnce();
});
it('keeps tracking a submitted transaction after the network changes', async () => {
  let confirm!: (value: unknown) => void;
  mocks.wait.mockReturnValue(
    new Promise((resolve) => {
      confirm = resolve;
    }),
  );
  const onConfirmed = vi.fn();
  const view = render(<TradeDesk onConfirmed={onConfirmed} />);
  await preview();
  fireEvent.click(screen.getByText('Xác nhận & ký trong ví'));
  await screen.findByText('Đã gửi, đang chờ xác nhận');
  switchNetwork('mainnet');
  view.rerender(<TradeDesk onConfirmed={onConfirmed} />);
  await act(async () => {
    confirm({ Transaction: { digest } });
  });
  expect(screen.getByText('Đã xác nhận on-chain')).toBeInTheDocument();
  expect(onConfirmed).toHaveBeenCalledOnce();
});
it('blocks a stale quote at click time even before the countdown rerenders', async () => {
  render(<TradeDesk onConfirmed={vi.fn()} />);
  await preview();
  const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31000);
  fireEvent.click(screen.getByText('Xác nhận & ký trong ví'));
  await screen.findByText(/Quote hết hạn hoặc tài khoản đã đổi/);
  expect(mocks.sign).not.toHaveBeenCalled();
  clock.mockRestore();
});
it('keeps an unknown send result and digest without resubmitting', async () => {
  mocks.sign.mockRejectedValue(new Error('transport lost'));
  render(<TradeDesk onConfirmed={vi.fn()} />);
  await preview();
  fireEvent.click(screen.getByText('Xác nhận & ký trong ví'));
  await screen.findByText(/Chưa xác định kết quả/);
  expect(localStorage.getItem('whaledex:testnet:last-swap')).toContain(digest);
  expect(screen.getByText('Lấy quote & mô phỏng')).toBeDisabled();
  expect(mocks.sign).toHaveBeenCalledOnce();
});
it('reports explicit wallet rejection and failed on-chain transactions distinctly', async () => {
  mocks.sign.mockRejectedValue({ code: 4001 });
  render(<TradeDesk onConfirmed={vi.fn()} />);
  await preview();
  fireEvent.click(screen.getByText('Xác nhận & ký trong ví'));
  await screen.findByText('Đã từ chối ký');
  mocks.sign.mockResolvedValue({ FailedTransaction: { digest } });
  mocks.wait.mockResolvedValue({ FailedTransaction: { digest } });
  await preview();
  fireEvent.click(screen.getByText('Xác nhận & ký trong ví'));
  await screen.findByText('Giao dịch thất bại on-chain');
});
it('shows unavailable liquidity and never opens signing after preflight failure', async () => {
  mocks.prepare.mockRejectedValue(new Error('Thiếu DEEP Testnet để trả phí giao dịch.'));
  render(<TradeDesk onConfirmed={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Số lượng DBUSDC'), { target: { value: '2' } });
  fireEvent.click(screen.getByText('Lấy quote & mô phỏng'));
  await screen.findByText('Thiếu DEEP Testnet để trả phí giao dịch.');
  expect(screen.getByText('Chưa có thanh khoản.')).toBeInTheDocument();
  expect(mocks.sign).not.toHaveBeenCalled();
});
it('restores a pending digest after reload and can recheck without a wallet', async () => {
  localStorage.setItem(
    'whaledex:testnet:last-swap',
    JSON.stringify({ digest, owner: mocks.account.address, status: 'submitted' }),
  );
  mocks.current = null;
  render(<TradeDesk onConfirmed={vi.fn()} />);
  fireEvent.click(screen.getByText('Kiểm tra lại trạng thái'));
  await waitFor(() => expect(screen.getByText('Đã xác nhận on-chain')).toBeInTheDocument());
  expect(mocks.sign).not.toHaveBeenCalled();
});
