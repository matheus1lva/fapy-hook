export interface YearnVaultData {
    address: string;
    type: string;
    kind: string;
    symbol: string;
    name: string;
    category: string;
    version: string;
    description: string;
    decimals: number;
    chainID: number;
    token: Token;
    tvl: Tvl;
    apr: Apr;
    strategies: Strategy[];
    staking: Staking;
    migration: Migration;
    featuringScore: number;
    pricePerShare: string;
    info: Info;
}

export interface Token {
    address: string;
    name: string;
    symbol: string;
    description: string;
    decimals: number;
}

export interface Tvl {
    totalAssets: string;
    tvl: number;
    price: number;
}

export interface Apr {
    type: string;
    netAPR: number;
    fees: Fees;
    points: Points;
    pricePerShare: AprPricePerShare;
    extra: Extra;
    forwardAPR: ForwardAPR;
}

export interface Fees {
    performance: number;
    management: number;
}

export interface Points {
    weekAgo: number;
    monthAgo: number;
    inception: number;
}

export interface AprPricePerShare {
    today: number;
    weekAgo: number;
    monthAgo: number;
}

export interface Extra {
    stakingRewardsAPR: number | null;
    gammaRewardAPR: number | null;
}

export interface ForwardAPR {
    type: string;
    netAPR: number;
    composite: Composite;
}

export interface Composite {
    boost: number;
    poolAPY: number;
    boostedAPR: number;
    baseAPR: number;
    cvxAPR: number;
    rewardsAPR: number;
}

export interface Strategy {
    address: string;
    name: string;
    status: string;
    netAPR: number;
    details: StrategyDetails;
}

export interface StrategyDetails {
    totalDebt: string;
    totalLoss: string;
    totalGain: string;
    performanceFee: number;
    lastReport: number;
    debtRatio: number;
}

export interface Staking {
    address: string;
    available: boolean;
    source: string;
    rewards: null; // Or 'any' if the type can vary
}

export interface Migration {
    available: boolean;
    address: string;
    contract: string;
}

export interface Info {
    sourceURL: string;
    riskLevel: number;
    isRetired: boolean;
    isBoosted: boolean;
    isHighlighted: boolean;
    riskScore: number[];
}