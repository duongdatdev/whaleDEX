import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('WhaleDEX Landing Page', () => {
  it('renders the core branding and navigation elements', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Chuyển đến nội dung chính' })).toHaveAttribute(
      'href',
      '#main-content'
    );
    expect(screen.getByRole('link', { name: 'Trang chủ WhaleDEX' })).toBeInTheDocument();
    expect(screen.getByText('Sui Testnet:')).toBeInTheDocument();
    expect(screen.getByText('24ms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kết nối ví Sui' })).toBeInTheDocument();
  });

  it('renders the hero section with actionable CTAs and headline', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Sàn giao dịch Spot phi tập trung trên Sui Testnet',
      })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Mở ứng dụng' })).toHaveAttribute('href', '#modes');
    expect(screen.getByRole('link', { name: 'Hướng dẫn Testnet' })).toHaveAttribute('href', '#journey');
  });

  it('renders dual trading modes', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Hai chế độ giao dịch chuyên biệt' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 3, name: 'Đổi token (Swap)' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 3, name: 'Bàn giao dịch Nâng cao (Pro Terminal)' })
    ).toBeInTheDocument();
  });

  it('renders onboarding journey steps and FAQ accordion', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Quy trình tiếp cận an toàn trên Sui Testnet' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Câu hỏi thường gặp' })
    ).toBeInTheDocument();

    expect(
      screen.getByText('Token trên sàn có giá trị tiền thật không?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('BalanceManager là gì và tại sao cần sử dụng?')
    ).toBeInTheDocument();
  });
});

