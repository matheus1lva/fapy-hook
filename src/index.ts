import 'dotenv/config';
import { getVaultWithStrategies } from './service';
import { computeChainAPY } from './fapy';

export type VaultFapy = {
  netAPR?: number;
  netAPY?: number;
  boost?: number;
  poolAPY?: number;
  boostedAPR?: number;
  baseAPR?: number;
  rewardsAPY?: number;
  cvxAPR?: number;
  keepCRV?: number;
};

export async function computeVaultFapy(
  chainId: number,
  vaultAddress: `0x${string}`,
): Promise<VaultFapy | null> {
  try {
    const result = await getVaultWithStrategies(chainId, vaultAddress);

    if (!result) return null;

    const { vault, strategies } = result;

    if (!vault) return null;

    const fapy = await computeChainAPY(vault, chainId, strategies);

    if (!fapy) return null;

    return {
      netAPR: fapy.netAPR,
      netAPY: fapy.netAPY ?? fapy.netAPR,
      boost: fapy.boost,
      poolAPY: fapy.poolAPY,
      boostedAPR: fapy.boostedAPR,
      baseAPR: fapy.baseAPR,
      rewardsAPY: fapy.rewardsAPY,
      cvxAPR: fapy.cvxAPR,
      keepCRV: fapy.keepCRV,
    };
  } catch (error) {
    console.log("error", error)
    return null;
  }
}
