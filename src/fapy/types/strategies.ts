export interface StrategyMeta {
  displayName?: string;
  description?: string;
  protocols?: string[];
}

export interface Apr {
  gross?: number;
  net?: number;
}

export interface ReportDetail {
  // Add properties as needed based on your GraphQL schema
  [key: string]: any;
}

export interface LenderStatus {
  // Add properties as needed based on your GraphQL schema
  [key: string]: any;
}

export interface Reward {
  // Add properties as needed based on your GraphQL schema
  [key: string]: any;
}

export interface RiskScore {
  // Add properties as needed based on your GraphQL schema
  [key: string]: any;
}

export interface Strategy {
  chainId?: number;
  address?: string;
  apiVersion?: string;
  balanceOfWant?: bigint;
  baseFeeOracle?: string;
  creditThreshold?: bigint;
  crv?: string;
  curveVoter?: string;
  delegatedAssets?: bigint;
  doHealthCheck?: boolean;
  emergencyExit?: boolean;
  erc4626?: boolean;
  estimatedTotalAssets?: bigint;
  forceHarvestTriggerOnce?: boolean;
  gauge?: string;
  healthCheck?: string;
  inceptTime?: bigint;
  inceptBlock?: bigint;
  isActive?: boolean;
  isBaseFeeAcceptable?: boolean;
  isOriginal?: boolean;
  keeper?: string;
  localKeepCRV?: bigint;
  maxReportDelay?: bigint;
  metadataURI?: string;
  minReportDelay?: bigint;
  name?: string;
  proxy?: string;
  rewards?: string;
  stakedBalance?: bigint;
  strategist?: string;
  tradeFactory?: string;
  vault?: string;
  want?: string;
  DOMAIN_SEPARATOR?: string;
  FACTORY?: string;
  MAX_FEE?: number;
  MIN_FEE?: number;
  decimals?: number;
  fullProfitUnlockDate?: bigint;
  isShutdown?: boolean;
  lastReport?: bigint;
  lastReportDetail?: ReportDetail;
  management?: string;
  pendingManagement?: string;
  performanceFee?: number;
  performanceFeeRecipient?: string;
  pricePerShare?: bigint;
  profitMaxUnlockTime?: bigint;
  profitUnlockingRate?: bigint;
  symbol?: string;
  totalAssets?: bigint;
  totalDebt?: bigint;
  totalIdle?: bigint;
  totalSupply?: bigint;
  totalDebtUsd?: number;
  lenderStatuses?: LenderStatus[];
  claims?: Reward[];
  risk?: RiskScore;
  meta?: StrategyMeta;
  v3?: boolean;
  yearn?: boolean;
}