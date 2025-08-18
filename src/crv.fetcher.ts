import { CURVE_SUBGRAPHDATA_URI } from './helpers/maps.helper';
import { CrvPool, CrvSubgraphPool, FraxPool } from './types';

export async function fetchGauges() {
  const gaugesResponse = await fetch(
    `${process.env.CRV_GAUGE_REGISTRY_URL || 'https://api.curve.finance/api/getAllGauges'}`,
  );
  const gauges = (await gaugesResponse.json()) as any;
  return Object.values(gauges.data) as any[];
}

export async function fetchPools() {
  try {
    const poolsResponse = await fetch(
      `${process.env.CRV_POOLS_URL || 'https://api.curve.finance/api/getPools/all'}`,
    );
    const pools = (await poolsResponse.json()) as any;
    return pools.data?.poolData as CrvPool[];
  } catch {
    return [];
  }
}

export async function fetchSubgraph(chainId: number) {
  try {
    const subgraphResponse = await fetch(`${CURVE_SUBGRAPHDATA_URI[chainId]}`);
    const subgraph = (await subgraphResponse.json()) as any;
    return subgraph.data.poolList as CrvSubgraphPool[];
  } catch {
    return [];
  }
}

export async function fetchFraxPools() {
  const res = await fetch('https://frax.convexfinance.com/api/frax/pools');
  const json = (await res.json()) as any;
  const pools = (json?.pools?.augmentedPoolData || []) as FraxPool[];
  return pools
    .filter((p) => p && p.type === 'convex')
    .map((pool) => {
      const poolUsd = (pool as any).stakingTokenUsdPrice;
      const poolPrice = typeof poolUsd === 'string' ? parseFloat(poolUsd) : poolUsd;
      pool.stakingTokenUsdPrice = poolPrice;
      pool.rewardCoins = pool.rewardCoins.map((coin: any, index: number) => ({
        rewardApr: parseFloat(pool.rewardAprs[index]),
        minBoostedRewardApr: parseFloat(pool.boostedRewardAprs[index].min),
        maxBoostedRewardApr: parseFloat(pool.boostedRewardAprs[index].max),
      }));
      return pool;
    });
}
