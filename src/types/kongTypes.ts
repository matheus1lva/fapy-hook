// Types derived from live GraphQL introspection of https://kong.yearn.farm/api/gql

export type GqlVault = {
  chainId: number;
  address: `0x${string}`;
  name?: string | null;
  symbol?: string | null;
  apiVersion?: string | null;
  activation?: string | number | bigint | null;
  totalDebt?: string | number | bigint | null;
  totalIdle?: string | number | bigint | null;
  debtRatio?: string | number | null;
  management?: `0x${string}` | null;
  totalAssets?: string | number | bigint | null;
  totalSupply?: string | number | bigint | null;
  depositLimit?: string | number | bigint | null;
  lockedProfit?: string | number | bigint | null;
  managementFee?: string | number | null;
  pricePerShare?: string | number | bigint | null;
  expectedReturn?: string | number | bigint | null;
  performanceFee?: string | number | null;
  creditAvailable?: string | number | bigint | null;
  debtOutstanding?: string | number | bigint | null;
  DOMAIN_SEPARATOR?: string | null;
  emergencyShutdown?: boolean | null;
  maxAvailableShares?: string | number | bigint | null;
  availableDepositLimit?: string | number | bigint | null;
  lockedProfitDegradation?: string | number | bigint | null;
  // asset is an Erc20 object in schema; we primarily need its address
  asset?: {
    chainId: number;
    address: `0x${string}`;
    name: string;
    symbol: string;
    decimals: number;
  } | null;
  assetAddress?: `0x${string}` | null; // convenience; some resolvers expose this
  decimals?: number | null;
  strategies?: string[];
};

export type GqlStrategy = {
  chainId: number;
  address: `0x${string}`;
  name?: string | null;
  apiVersion?: string | null;
  vault?: `0x${string}` | null;
  vaultAddress?: `0x${string}` | null;
  debtRatio?: number | null;
  performanceFee?: number | null;
  management?: `0x${string}` | null;
  keeper?: `0x${string}` | null;
  want?: `0x${string}` | null;
  symbol?: string | null;
  rewards?: `0x${string}` | null;
  guardian?: `0x${string}` | null;
  localKeepCRV?: string | number | bigint | null;
  totalDebt?: string | number | bigint | null;
  totalIdle?: string | number | bigint | null;
  totalAssets?: string | number | bigint | null;
  totalSupply?: string | number | bigint | null;
  depositLimit?: string | number | bigint | null;
  pricePerShare?: string | number | bigint | null;
  expectedReturn?: string | number | bigint | null;
  creditAvailable?: string | number | bigint | null;
  debtOutstanding?: string | number | bigint | null;
  DOMAIN_SEPARATOR?: string | null;
  emergencyShutdown?: boolean | null;
  maxAvailableShares?: string | number | bigint | null;
  availableDepositLimit?: string | number | bigint | null;
  lockedProfitDegradation?: string | number | bigint | null;
  asset?: {
    chainId: number;
    address: `0x${string}`;
    name: string;
    symbol: string;
    decimals: number;
  } | null;
};

export type GqlOutput = {
  chainId: number;
  address: `0x${string}`;
  label: string;
  component?: string | null;
  value: number;
  period: string;
  time?: string | number | null;
};

export type GqlTvl = {
  chainId: number;
  address: `0x${string}`;
  value: number;
  priceUsd?: number | null;
  priceSource: string;
  period: string;
  blockNumber: number;
  time?: string | number | null;
};

export type GqlPrice = {
  chainId: number;
  address: `0x${string}`;
  priceUsd: number;
  priceSource: string;
  blockNumber: number;
  timestamp: string | number;
};

export type GqlLatestBlock = {
  chainId: number;
  blockNumber: string | number;
  blockTime: string | number;
};
