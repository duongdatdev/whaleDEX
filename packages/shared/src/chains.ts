import { z } from 'zod';

export const supportedChainIds = [56, 1, 8453, 137, 42161, 11155111] as const;
export const chainIdSchema = z.union([
  z.literal(56),
  z.literal(1),
  z.literal(8453),
  z.literal(137),
  z.literal(42161),
  z.literal(11155111),
]);
export type ChainId = z.infer<typeof chainIdSchema>;
export const DEFAULT_CHAIN_ID = 11155111 satisfies ChainId;

// Environment input stays strict: no empty strings, hex, decimals or silent fallback.
export const chainIdEnvSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(chainIdSchema)
  .default(DEFAULT_CHAIN_ID);

const httpsUrlSchema = z.url({ protocol: /^https$/ });
export const chainSchema = z
  .object({
    id: chainIdSchema,
    name: z.string().min(1),
    testnet: z.boolean(),
    nativeCurrency: z
      .object({
        name: z.string().min(1),
        symbol: z.string().min(1),
        decimals: z.literal(18),
      })
      .readonly(),
    rpcUrls: z
      .object({
        default: z
          .object({
            http: z.array(httpsUrlSchema).min(1).readonly(),
          })
          .readonly(),
      })
      .readonly(),
    blockExplorers: z
      .object({
        default: z
          .object({
            name: z.string().min(1),
            url: httpsUrlSchema,
          })
          .readonly(),
      })
      .readonly(),
  })
  .readonly();
export type ChainConfig = z.infer<typeof chainSchema>;

// Public metadata only. Never put provider credentials in this portable registry.
// Sources: ethereum-lists/chains and docs.polygon.technology/pos/reference/rpc-endpoints.
export const supportedChains: readonly ChainConfig[] = Object.freeze([
  chainSchema.parse({
    id: 56,
    name: 'BNB Smart Chain',
    testnet: false,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://bsc-dataseed1.bnbchain.org', 'https://bsc-rpc.publicnode.com'] },
    },
    blockExplorers: { default: { name: 'BscScan', url: 'https://bscscan.com' } },
  }),
  chainSchema.parse({
    id: 1,
    name: 'Ethereum',
    testnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://ethereum-rpc.publicnode.com', 'https://eth.drpc.org'] } },
    blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
  }),
  chainSchema.parse({
    id: 8453,
    name: 'Base',
    testnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'] } },
    blockExplorers: { default: { name: 'Basescan', url: 'https://basescan.org' } },
  }),
  chainSchema.parse({
    id: 137,
    name: 'Polygon PoS',
    testnet: false,
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://polygon.drpc.org', 'https://polygon-bor-rpc.publicnode.com'] },
    },
    blockExplorers: { default: { name: 'PolygonScan', url: 'https://polygonscan.com' } },
  }),
  chainSchema.parse({
    id: 42161,
    name: 'Arbitrum One',
    testnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: {
        http: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'],
      },
    },
    blockExplorers: { default: { name: 'Arbiscan', url: 'https://arbiscan.io' } },
  }),
  chainSchema.parse({
    id: 11155111,
    name: 'Ethereum Sepolia',
    testnet: true,
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: {
        http: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://sepolia.drpc.org'],
      },
    },
    blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' } },
  }),
]);

export function getChain(chainId: number): ChainConfig {
  const id = chainIdSchema.parse(chainId);
  const chain = supportedChains.find((entry) => entry.id === id);
  if (!chain) throw new Error('Supported chain is missing from the registry');
  return chain;
}

export const chainsResponseSchema = z.object({
  defaultChainId: chainIdSchema,
  chains: z.array(chainSchema),
});
export type ChainsResponse = z.infer<typeof chainsResponseSchema>;
