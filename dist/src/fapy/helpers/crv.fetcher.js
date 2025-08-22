"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGauges = fetchGauges;
exports.fetchPools = fetchPools;
exports.fetchSubgraph = fetchSubgraph;
exports.fetchFraxPools = fetchFraxPools;
const maps_helper_1 = require("./maps.helper");
const cache_1 = require("../../utils/cache");
// API fetch functions
async function fetchGauges(chain) {
    const gauges = await cache_1.cache.wrap(`fetchGauges:${chain}`, async () => {
        const gaugesResponse = await fetch(`${process.env.CRV_GAUGE_REGISTRY_URL}?blockchainId=${chain}`);
        const gauges = (await gaugesResponse.json());
        return Object.values(gauges.data);
    }, 1000 * 60 * 5);
    return gauges;
}
async function fetchPools(chain) {
    const pools = await cache_1.cache.wrap(`fetchPools:${chain}`, async () => {
        try {
            const poolsResponse = await fetch(`${process.env.CRV_POOLS_URL}/${chain}`);
            const pools = (await poolsResponse.json());
            return pools.data?.poolData;
        }
        catch (err) {
            console.error(err);
            return [];
        }
    }, 1000 * 60 * 5);
    return pools;
}
async function fetchSubgraph(chainId) {
    const subgraph = await cache_1.cache.wrap(`fetchSubgraph:${chainId}`, async () => {
        try {
            const subgraphResponse = await fetch(`${maps_helper_1.CURVE_SUBGRAPHDATA_URI[chainId]}`);
            const subgraph = (await subgraphResponse.json());
            return subgraph.data.poolList;
        }
        catch (err) {
            console.error(err);
            return [];
        }
    }, 1000 * 60 * 5);
    return subgraph;
}
async function fetchFraxPools() {
    const fraxPools = await cache_1.cache.wrap('fetchFraxPools', async () => {
        const fraxPoolsResponse = await fetch('https://frax.convexfinance.com/api/frax/pools');
        const fraxPools = (await fraxPoolsResponse.json());
        return fraxPools?.pools?.augmentedPoolData;
    }, 1000 * 60 * 5);
    const pools = fraxPools.map((pool) => {
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
    return pools.filter((pool) => pool !== null);
}
