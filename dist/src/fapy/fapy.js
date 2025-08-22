"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeChainAPY = computeChainAPY;
const chains_1 = require("../utils/chains");
const crv_fetcher_1 = require("./crv.fetcher");
const crv_like_forward_1 = require("./crv-like.forward");
async function computeChainAPY(vault, chainId, strategies) {
    const chain = (0, chains_1.getChainByChainId)(chainId)?.name?.toLowerCase();
    if (!chain)
        return null;
    const [gauges, pools, subgraph, fraxPools] = await Promise.all([
        (0, crv_fetcher_1.fetchGauges)(chain),
        (0, crv_fetcher_1.fetchPools)(chain),
        (0, crv_fetcher_1.fetchSubgraph)(chainId),
        (0, crv_fetcher_1.fetchFraxPools)(),
    ]);
    if ((0, crv_like_forward_1.isCurveStrategy)(vault)) {
        return await (0, crv_like_forward_1.computeCurveLikeForwardAPY)({
            vault,
            gauges,
            pools,
            subgraphData: subgraph,
            fraxPools,
            allStrategiesForVault: strategies,
            chainId,
        });
    }
    return null;
}
