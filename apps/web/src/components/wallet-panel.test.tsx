import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { WalletPanel } from './wallet-panel';
import { MARKET } from '../lib/deepbook';

const state = vi.hoisted(() => ({
  account: null as null | { address: string; chains: string[] },
  network: 'testnet',
  connection: { status: 'disconnected', isConnecting: false, isReconnecting: false } as {
    status: string;
    isConnecting: boolean;
    isReconnecting: boolean;
    wallet?: { name: string };
  },
  wallets: [] as { name: string }[],
  failedCoins: [] as string[],
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  getBalance: vi.fn(),
}));
vi.mock('@mysten/dapp-kit-react', () => ({
  useCurrentAccount: () => state.account,
  useCurrentNetwork: () => state.network,
  useCurrentClient: () => ({ core: { getBalance: state.getBalance } }),
  useWalletConnection: () => state.connection,
  useWallets: () => state.wallets,
  useDAppKit: () => ({
    connectWallet: state.connectWallet,
    disconnectWallet: state.disconnectWallet,
  }),
}));

beforeEach(() => {
  state.account = null;
  state.network = 'testnet';
  state.connection = { status: 'disconnected', isConnecting: false, isReconnecting: false };
  state.wallets = [];
  state.failedCoins = [];
  state.connectWallet.mockReset().mockResolvedValue({ accounts: [] });
  state.disconnectWallet.mockReset().mockResolvedValue(undefined);
  state.getBalance.mockReset().mockResolvedValue({ balance: { balance: '0' } });
});

it('shows missing-wallet onboarding and returns focus after closing the dialog', async () => {
  render(<WalletPanel />);
  const trigger = screen.getByRole('button', { name: 'Kết nối ví' });
  trigger.focus();
  fireEvent.click(trigger);

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Chưa tìm thấy ví')).toBeInTheDocument();
  expect(screen.getByText(/Cài ví hỗ trợ Sui Wallet Standard/)).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(document.activeElement).toBe(trigger);
});

it('reports rejected wallet connection and allows retry', async () => {
  state.wallets = [{ name: 'Slush' }];
  state.connectWallet
    .mockRejectedValueOnce({ code: 4001000 })
    .mockResolvedValueOnce({ accounts: [] });
  render(<WalletPanel />);
  fireEvent.click(screen.getByRole('button', { name: 'Kết nối ví' }));
  fireEvent.click(screen.getByRole('button', { name: /Slush/ }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/Bạn đã từ chối yêu cầu kết nối/);
  fireEvent.click(screen.getByRole('button', { name: /Slush/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(state.connectWallet).toHaveBeenCalledTimes(2);
});

it('announces that it is waiting for wallet approval', async () => {
  state.wallets = [{ name: 'Slush' }];
  let resolveConnection!: (value: { accounts: [] }) => void;
  state.connectWallet.mockReturnValue(
    new Promise((resolve) => {
      resolveConnection = resolve;
    }),
  );
  render(<WalletPanel />);
  fireEvent.click(screen.getByRole('button', { name: 'Kết nối ví' }));
  fireEvent.click(screen.getByRole('button', { name: /Slush/ }));
  expect(await screen.findByText(/Đang chờ Slush xác nhận/)).toBeInTheDocument();

  await act(async () => resolveConnection({ accounts: [] }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('disconnects the active wallet', async () => {
  state.account = { address: '0x1', chains: ['sui:testnet'] };
  state.connection = {
    status: 'connected',
    isConnecting: false,
    isReconnecting: false,
    wallet: { name: 'Slush' },
  };
  render(<WalletPanel />);
  fireEvent.click(screen.getByRole('button', { name: 'Ngắt kết nối' }));
  await waitFor(() => expect(state.disconnectWallet).toHaveBeenCalledOnce());
});

it('does not read balances while disconnected or on an unsupported account', () => {
  state.account = null;
  const view = render(<WalletPanel />);
  expect(screen.getByText(/Kết nối ví hỗ trợ Sui Wallet Standard/)).toBeInTheDocument();
  state.account = { address: '0x1', chains: ['sui:mainnet'] };
  view.rerender(<WalletPanel />);
  expect(screen.getByRole('alert')).toHaveTextContent('Chuyển tài khoản sang Testnet');
  expect(state.getBalance).not.toHaveBeenCalled();
});

it('discards an old account balance when the account changes', async () => {
  let resolveOld!: (value: { balance: { balance: string } }) => void;
  state.connection = {
    status: 'connected',
    isConnecting: false,
    isReconnecting: false,
    wallet: { name: 'Slush' },
  };
  state.account = { address: '0x1', chains: ['sui:testnet'] };
  state.getBalance
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    )
    .mockResolvedValue({ balance: { balance: '2000000000' } });
  const view = render(<WalletPanel />);
  state.account = { address: '0x2', chains: ['sui:testnet'] };
  view.rerender(<WalletPanel />);
  expect(await screen.findByText('2 SUI')).toBeInTheDocument();
  await act(async () => {
    resolveOld({ balance: { balance: '99000000000' } });
  });
  expect(screen.queryByText('99 SUI')).not.toBeInTheDocument();
});

it('loads every allowlisted coin with its own exact decimals', async () => {
  state.account = { address: '0x1', chains: ['sui:testnet'] };
  state.connection = {
    status: 'connected',
    isConnecting: false,
    isReconnecting: false,
    wallet: { name: 'Slush' },
  };
  const values: Record<string, string> = {
    [MARKET.base.type]: '1234567890',
    [MARKET.quote.type]: '123456789',
    [MARKET.fee.type]: '20000001',
  };
  state.getBalance.mockImplementation(({ coinType }: { coinType: string }) =>
    Promise.resolve({ balance: { balance: values[coinType]! } }),
  );
  render(<WalletPanel />);

  expect(await screen.findByText('1.23456789 SUI')).toBeInTheDocument();
  expect(screen.getByText('123.456789 DBUSDC')).toBeInTheDocument();
  expect(screen.getByText('20.000001 DEEP')).toBeInTheDocument();
  expect(state.getBalance).toHaveBeenCalledWith({ owner: '0x1', coinType: MARKET.base.type });
  expect(state.getBalance).toHaveBeenCalledWith({ owner: '0x1', coinType: MARKET.quote.type });
  expect(state.getBalance).toHaveBeenCalledWith({ owner: '0x1', coinType: MARKET.fee.type });
  expect(screen.getByText(/Không gồm tài sản trong BalanceManager/)).toBeInTheDocument();
});

it('shows loading and keeps a failed coin balance marked stale after refresh', async () => {
  state.account = { address: '0x1', chains: ['sui:testnet'] };
  state.connection = {
    status: 'connected',
    isConnecting: false,
    isReconnecting: false,
    wallet: { name: 'Slush' },
  };
  const values: Record<string, string> = {
    [MARKET.base.type]: '1000000000',
    [MARKET.quote.type]: '10000000',
    [MARKET.fee.type]: '3000000',
  };
  state.getBalance.mockImplementation(({ coinType }: { coinType: string }) => {
    if (state.failedCoins.includes(coinType)) return Promise.reject(new Error('RPC failure'));
    return Promise.resolve({ balance: { balance: values[coinType]! } });
  });
  const view = render(<WalletPanel />);
  expect(screen.getAllByText('Đang tải…')).toHaveLength(3);
  expect(await screen.findByText('10 DBUSDC')).toBeInTheDocument();

  state.failedCoins = [MARKET.quote.type];
  view.rerender(<WalletPanel balanceRefreshVersion={1} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Không đọc được số dư DBUSDC');
  expect(screen.getByText('10 DBUSDC')).toBeInTheDocument();
  expect(screen.getByText(/Dữ liệu cũ ·/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Làm mới số dư' })).toBeEnabled();
});
