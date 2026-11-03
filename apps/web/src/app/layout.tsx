import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WhaleDEX | Spot DEX trên Sui Testnet',
  description:
    'Giao diện thử nghiệm cho Spot DEX không lưu ký trên Sui Testnet, sử dụng sổ lệnh DeepBookV3.',
  keywords: ['WhaleDEX', 'Sui', 'DeepBookV3', 'DEX', 'Spot', 'Testnet', 'Crypto'],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${jetBrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
