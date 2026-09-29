import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('WhaleDEX welcome page', () => {
  it('states the Testnet and static UI limitations clearly', () => {
    render(<Home />);

    const testnetBanner = screen.getByRole('region', { name: 'Môi trường thử nghiệm' });
    expect(within(testnetBanner).getByText('Sui Testnet:')).toBeInTheDocument();
    expect(testnetBanner).toHaveTextContent(/token thử nghiệm không có giá trị thật/i);
    expect(screen.getByRole('button', { name: 'Ví đang phát triển' })).toBeDisabled();
    expect(screen.getByText(/Không hiển thị giá, số dư hay phí giả/i)).toBeInTheDocument();
  });

  it('keeps navigation anchors connected to real sections', () => {
    render(<Home />);

    const navigation = within(screen.getByRole('navigation', { name: 'Điều hướng chính' }));
    expect(navigation.getByRole('link', { name: 'Giao dịch' })).toHaveAttribute('href', '#modes');
    expect(navigation.getByRole('link', { name: 'Thị trường' })).toHaveAttribute(
      'href',
      '#markets',
    );
    expect(navigation.getByRole('link', { name: 'Hướng dẫn' })).toHaveAttribute('href', '#journey');
    expect(navigation.getByRole('link', { name: 'Hỏi đáp' })).toHaveAttribute('href', '#faq');
  });

  it('renders honest Swap and Pro Terminal previews', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 3, name: 'Đổi token' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Pro Terminal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Giao dịch chưa khả dụng' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Đặt lệnh chưa khả dụng' })).toBeDisabled();
    expect(screen.getByText('Sổ lệnh chưa được kết nối')).toBeInTheDocument();
  });

  it('renders the verified-data market state and onboarding content', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Chỉ hiện số liệu khi có nguồn xác thực' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Chờ dữ liệu')).toHaveLength(3);
    expect(screen.getByRole('heading', { level: 3, name: 'Kết nối ví Sui' })).toBeInTheDocument();
    expect(screen.getByText('Giao diện này đã giao dịch được chưa?')).toBeInTheDocument();
  });
});
