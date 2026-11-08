import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

vi.mock('../components/wallet-loader', () => ({
  WalletLoader: () => <div role="region" aria-label="Ứng dụng ví và swap" />,
}));

describe('WhaleDEX welcome page', () => {
  it('states the Testnet limitations and exposes the wallet application', () => {
    render(<Home />);

    const testnetBanner = screen.getByRole('region', { name: 'Môi trường thử nghiệm' });
    expect(within(testnetBanner).getByText('Sui Testnet:')).toBeInTheDocument();
    expect(testnetBanner).toHaveTextContent(/token thử nghiệm không có giá trị thật/i);
    expect(screen.getByRole('link', { name: 'Kết nối ví Sui' })).toHaveAttribute('href', '#trade');
    expect(screen.getByRole('region', { name: 'Ứng dụng ví và swap' })).toBeInTheDocument();
    expect(screen.getByText(/Không hiển thị giá, số dư hay phí giả/i)).toBeInTheDocument();
  });

  it('keeps navigation anchors connected to real sections', () => {
    render(<Home />);

    const navigation = within(screen.getByRole('navigation', { name: 'Điều hướng chính' }));
    expect(navigation.getByRole('link', { name: 'Giao dịch' })).toHaveAttribute('href', '#trade');
    expect(navigation.getByRole('link', { name: 'Thị trường' })).toHaveAttribute(
      'href',
      '#markets',
    );
    expect(navigation.getByRole('link', { name: 'Hướng dẫn' })).toHaveAttribute('href', '#journey');
    expect(navigation.getByRole('link', { name: 'Hỏi đáp' })).toHaveAttribute('href', '#faq');
  });

  it('links to the integrated swap and keeps Limit orders unavailable', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Mở swap SUI / DBUSDC' })).toHaveAttribute(
      'href',
      '#trade',
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Pro Terminal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đặt lệnh chưa khả dụng' })).toBeDisabled();
    expect(screen.getByText('Sổ lệnh chưa được kết nối')).toBeInTheDocument();
  });

  it('renders the verified-data market state and onboarding content', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Chỉ hiện số liệu khi có nguồn xác thực' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem sổ lệnh Testnet' })).toHaveAttribute(
      'href',
      '#trade',
    );
    expect(screen.queryByText('WAL / USDC')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Kết nối ví Sui' })).toBeInTheDocument();
    expect(screen.getByText('Giao diện này đã giao dịch được chưa?')).toBeInTheDocument();
  });
});
