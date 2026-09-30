import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import Home from './page';
vi.mock('../components/wallet-loader', () => ({ WalletLoader: () => <p>Ví Sui</p> }));

it('renders the application landing page', () => {
  render(<Home />);
  expect(screen.getByRole('heading', { level: 1, name: 'Giao dịch trên Sui' })).toBeInTheDocument();
  expect(screen.getByText(/Token thử nghiệm không có giá trị thật/)).toBeInTheDocument();
});
