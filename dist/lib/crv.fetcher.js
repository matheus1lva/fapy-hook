import { CURVE_SUBGRAPHDATA_URI } from '../helpers/maps.helper';
export async function fetchGauges(chain) {
    const gaugesResponse = await fetch(`${process.env.CRV_GAUGE_REGISTRY_URL || 'https://api.curve.fi/api/getAllGauges'}?blockchainId=${chain}`);
    const gauges = await gaugesResponse.json();
    return Object.values(gauges.data);
}
export async function fetchPools(chain) {
    try {
        const poolsResponse = await fetch(`${process.env.CRV_POOLS_URL || 'https://api.curve.fi/api/getPools/all'}/${chain}`);
        const pools = await poolsResponse.json();
        return pools.data?.poolData;
    }
    catch {
        return [];
    }
}
export async function fetchSubgraph(chainId) {
    try {
        const subgraphResponse = await fetch(`${CURVE_SUBGRAPHDATA_URI[chainId]}`);
        const subgraph = await subgraphResponse.json();
        return subgraph.data.poolList;
    }
    catch {
        return [];
    }
}
export async function fetchFraxPools() {
    const res = await fetch('https://frax.convexfinance.com/api/frax/pools');
    const json = await res.json();
    const pools = (json?.pools?.augmentedPoolData || []);
    return pools
        .filter((p) => p && p.type === 'convex')
        .map((pool) => {
        const poolUsd = pool.stakingTokenUsdPrice;
        const poolPrice = typeof poolUsd === 'string' ? parseFloat(poolUsd) : poolUsd;
        pool.stakingTokenUsdPrice = poolPrice;
        pool.rewardCoins = pool.rewardCoins.map((coin, index) => ({
            rewardApr: parseFloat(pool.rewardAprs[index]),
            minBoostedRewardApr: parseFloat(pool.boostedRewardAprs[index].min),
            maxBoostedRewardApr: parseFloat(pool.boostedRewardAprs[index].max),
        }));
        return pool;
    });
}
