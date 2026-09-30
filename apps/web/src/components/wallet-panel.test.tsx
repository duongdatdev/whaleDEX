import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { WalletPanel } from './wallet-panel';

const state = vi.hoisted(() => ({
  account: null as null | { address: string; chains: string[] },
  getBalance: vi.fn(),
}));
vi.mock('@mysten/dapp-kit-react', () => ({
  useCurrentAccount: () => state.account,
  useCurrentNetwork: () => 'testnet',
  useCurrentClient: () => ({ core: { getBalance: state.getBalance } }),
}));
vi.mock('@mysten/dapp-kit-react/ui', () => ({ ConnectButton: () => <button>Kết nối ví</button> }));

it('does not read balances while disconnected or on an unsupported account', () => {
  state.account = null;
  state.getBalance.mockClear();
  const view = render(<WalletPanel />);
  expect(screen.getByText(/Kết nối ví Sui để xem/)).toBeInTheDocument();
  state.account = { address: '0x1', chains: ['sui:mainnet'] };
  view.rerender(<WalletPanel />);
  expect(screen.getByRole('alert')).toHaveTextContent('Chuyển ví sang Sui Testnet');
  expect(state.getBalance).not.toHaveBeenCalled();
});

it('discards an old account balance when the account changes', async () => {
  let resolveOld!: (value: { balance: { balance: string } }) => void;
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
  expect(await screen.findByText('Số dư ví: 2 SUI')).toBeInTheDocument();
  await act(async () => {
    resolveOld({ balance: { balance: '99000000000' } });
  });
  expect(screen.queryByText('Số dư ví: 99 SUI')).not.toBeInTheDocument();
});
