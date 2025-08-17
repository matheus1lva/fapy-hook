import { getChainByChainId } from '../utils/chains';
import { fetchFraxPools, fetchGauges, fetchPools, fetchSubgraph } from './crv.fetcher';
import { isCurveStrategy, computeCurveLikeForwardAPY } from './crv-like.forward';
import { GqlStrategy, GqlVault } from '../types/kongTypes';

export interface VaultAPY {
  type?: string;
  netAPR?: number;
  netAPY?: number;
  boost?: number;
  poolAPY?: number;
  boostedAPR?: number;
  baseAPR?: number;
  cvxAPR?: number;
  rewardsAPY?: number;
  keepCRV?: number;
  v3OracleCurrentAPR?: number;
  v3OracleStratRatioAPR?: number;
}

export async function computeChainAPY(
  vault: GqlVault,
  chainId: number,
  strategies: Array<GqlStrategy>,
): Promise<VaultAPY | null> {
  const chain = getChainByChainId(chainId)?.name?.toLowerCase();

  if (!chain) return null;

  const [gauges, pools, subgraph, fraxPools] = await Promise.all([
    fetchGauges(),
    fetchPools(),
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
