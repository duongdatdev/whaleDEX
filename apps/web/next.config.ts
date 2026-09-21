import type { NextConfig } from 'next';
import { parseWebEnv } from './src/env';

parseWebEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_DEFAULT_CHAIN_ID: process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@whaledex/shared'],
};

export default nextConfig;
