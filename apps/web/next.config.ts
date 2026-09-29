import type { NextConfig } from 'next';
import { parseWebEnv } from './src/env';

parseWebEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_DEFAULT_SUI_NETWORK: process.env.NEXT_PUBLIC_DEFAULT_SUI_NETWORK,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@whaledex/shared'],
};

export default nextConfig;
