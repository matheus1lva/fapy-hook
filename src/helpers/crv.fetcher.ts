import { CrvPool } from '../types/crv-pools';
import { FraxPool } from '../types/frax-pools';
import { Gauge } from '../types/gauges';
import { CURVE_SUBGRAPHDATA_URI } from './maps.helper';

// API fetch functions
export async function fetchGauges(chain: string) {
  const gaugesResponse = await fetch(
    `${process.env.CRV_GAUGE_REGISTRY_URL}?blockchainId=${chain}`,
  );
  const gauges = (await gaugesResponse.json()) as any;
  return Object.values(gauges.data) as Gauge[];
}

export async function fetchPools(chain: string) {
  const poolsResponse = await fetch(`${process.env.CRV_POOLS_URL}/${chain}`);
  const pools = (await poolsResponse.json()) as any;
  return pools.data?.poolData as CrvPool[];
}

export async function fetchSubgraph(chainId: number) {
  const subgraphResponse = await fetch(`${CURVE_SUBGRAPHDATA_URI[chainId]}`);
  const subgraph = (await subgraphResponse.json()) as any;
  return subgraph;
}

export async function fetchFraxPools() {
  const fraxPoolsResponse = await fetch('https://frax.convexfinance.com/api/frax/pools');
  const fraxPools = (await fraxPoolsResponse.json()) as any;

  const pools = fraxPools.map((pool: FraxPool) => {
    if (pool.type !== 'convex') {
      return null;
    }
    const poolUsd = pool.stakingTokenUsdPrice;

    const poolPrice = typeof poolUsd === 'string' ? parseFloat(poolUsd) : poolUsd;
    pool.stakingTokenUsdPrice = poolPrice;

    pool.rewardCoins = pool.rewardCoins.map((coin, index) => {
      const rewardApr = parseFloat(pool.rewardAprs[index]);
      const minBoostedRewardApr = parseFloat(pool.boostedRewardAprs[index].min);
      const maxBoostedRewardApr = parseFloat(pool.boostedRewardAprs[index].max);

      return {
        rewardApr,
        minBoostedRewardApr,
        maxBoostedRewardApr,
      };
    });

    return pool;
  });

  return pools.filter((pool: FraxPool) => pool !== null) as FraxPool[];
}
