import { getChainByChainId } from './lib/chains';
import { fetchFraxPools, fetchGauges, fetchPools, fetchSubgraph } from './lib/crv.fetcher';
import { isCurveStrategy, computeCurveLikeForwardAPY } from './lib/crv-like.forward';
export async function computeChainAPY(vault, chainId, strategies) {
    const chain = getChainByChainId(chainId)?.name?.toLowerCase();
    if (!chain)
        return null;
    const [gauges, pools, subgraph, fraxPools] = await Promise.all([
        fetchGauges(chain),
        fetchPools(chain),
        fetchSubgraph(chainId),
        fetchFraxPools(),
    ]);
    if (isCurveStrategy(vault)) {
        return await computeCurveLikeForwardAPY({
            vault: vault,
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
