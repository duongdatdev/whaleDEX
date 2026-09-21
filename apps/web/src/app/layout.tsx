import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'WhaleDEX | Testnet swap product preview',
  description:
    'Explore the requirements-led preview for a transparent, testnet-only WhaleDEX swap experience.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
