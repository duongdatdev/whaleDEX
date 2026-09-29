import { z } from 'zod';

export const supportedSuiNetworkNames = ['testnet', 'mainnet'] as const;
export const suiNetworkNameSchema = z.enum(supportedSuiNetworkNames);
export type SuiNetworkName = z.infer<typeof suiNetworkNameSchema>;

export const DEFAULT_SUI_NETWORK = 'testnet' satisfies SuiNetworkName;
export const suiNetworkEnvSchema = suiNetworkNameSchema.default(DEFAULT_SUI_NETWORK);

const httpsUrlSchema = z.url({ protocol: /^https$/ });
export const suiNetworkConfigSchema = z
  .object({
    network: suiNetworkNameSchema,
    name: z.string().min(1),
    testnet: z.boolean(),
    transactionEnabled: z.boolean(),
    nativeCurrency: z
      .object({
        name: z.literal('Sui'),
        symbol: z.literal('SUI'),
        decimals: z.literal(9),
      })
      .readonly(),
    grpcUrls: z.array(httpsUrlSchema).min(1).readonly(),
    faucetUrl: httpsUrlSchema.nullable(),
    explorerUrl: httpsUrlSchema,
  })
  .superRefine((config, context) => {
    if (config.network === 'testnet' && (!config.testnet || config.faucetUrl === null)) {
      context.addIssue({
        code: 'custom',
        message: 'Sui Testnet must be marked as testnet and provide a faucet',
      });
    }
    if (
      config.network === 'mainnet' &&
      (config.testnet || config.transactionEnabled || config.faucetUrl !== null)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Sui Mainnet must remain transaction-disabled and have no faucet in the MVP',
      });
    }
  })
  .readonly();
export type SuiNetworkConfig = z.infer<typeof suiNetworkConfigSchema>;

// Public metadata only. Never put provider credentials in this portable registry.
// Official public full nodes are rate-limited; production provider/fallback selection is separate.
export const supportedSuiNetworks: readonly SuiNetworkConfig[] = Object.freeze([
  suiNetworkConfigSchema.parse({
    network: 'testnet',
    name: 'Sui Testnet',
    testnet: true,
    transactionEnabled: true,
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
    grpcUrls: ['https://fullnode.testnet.sui.io:443'],
    faucetUrl: 'https://faucet.testnet.sui.io/v2/gas',
    explorerUrl: 'https://suiscan.xyz/testnet',
  }),
  suiNetworkConfigSchema.parse({
    network: 'mainnet',
    name: 'Sui Mainnet',
    testnet: false,
    transactionEnabled: false,
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
    grpcUrls: ['https://fullnode.mainnet.sui.io:443'],
    faucetUrl: null,
    explorerUrl: 'https://suiscan.xyz/mainnet',
  }),
]);

export function getSuiNetwork(network: string): SuiNetworkConfig {
  const name = suiNetworkNameSchema.parse(network);
  const config = supportedSuiNetworks.find((entry) => entry.network === name);
  if (!config) throw new Error('Supported Sui network is missing from the registry');
  return config;
}

export const suiNetworksResponseSchema = z.object({
  defaultNetwork: suiNetworkNameSchema,
  networks: z.array(suiNetworkConfigSchema),
});
export type SuiNetworksResponse = z.infer<typeof suiNetworksResponseSchema>;
