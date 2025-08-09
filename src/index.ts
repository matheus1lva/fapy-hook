import { getChainByChainId } from './lib/chains';
import { fetchFraxPools, fetchGauges, fetchPools, fetchSubgraph } from './lib/crv.fetcher';
import { isCurveStrategy, computeCurveLikeForwardAPY } from './lib/crv-like.forward';
import { GqlVault, GqlStrategy } from './kongTypes';

export interface VaultAPY {
  type?: string;
  netAPR?: number;
  netAPY?: number;
  boost?: number;
  poolAPY?: number;
  boostedAPR?: number;
  baseAPR?: number;
  cvxAPR?: number;
  rewardsAPR?: number;
  keepCRV?: number;
  v3OracleCurrentAPR?: number;
  v3OracleStratRatioAPR?: number;
}

export async function computeChainAPY(
  vault: GqlVault,
  chainId: number,
  strategies: GqlStrategy[],
): Promise<VaultAPY | null> {
  const chain = getChainByChainId(chainId)?.name?.toLowerCase();

  if (!chain) return null;

  const [gauges, pools, subgraph, fraxPools] = await Promise.all([
    fetchGauges(chain),
    fetchPools(chain),
    fetchSubgraph(chainId),
    fetchFraxPools(),
  ]);

  if (isCurveStrategy(vault)) {
    return await computeCurveLikeForwardAPY({
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
