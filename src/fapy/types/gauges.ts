export interface Gauge {
  isPool: boolean;
  name: string;
  shortName: string;
  poolUrls: { swap: string[]; deposit: string[]; withdraw: string[] };
  poolAddress: string;
  virtualPrice: number;
  factory: boolean;
  type: string;
  swap: string;
  swap_token: string;
  lpTokenPrice: number | null;
  blockchainId: string;
  gauge: string;
  gauge_data: { inflation_rate: string; working_supply: string };
  gauge_controller: {
    gauge_relative_weight: string;
    gauge_future_relative_weight: string;
    get_gauge_weight: string;
    inflation_rate: string;
  };
  gaugeCrvApy: [number, number];
  gaugeFutureCrvApy: [number, number];
  side_chain: boolean;
  is_killed: boolean;
  hasNoCrv: boolean;
  swap_data: { virtual_price: string };
}
