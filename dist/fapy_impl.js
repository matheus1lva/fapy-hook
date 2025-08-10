import 'dotenv/config';
import { computeChainAPY } from './index';
import { getVaultWithStrategies } from './service';
export async function computeVaultFapy(chainId, vaultAddress) {
    try {
        const result = await getVaultWithStrategies(chainId, vaultAddress);
        if (!result)
            return null;
        const { vault, strategies } = result;
        if (!vault)
            return null;
        const fapy = await computeChainAPY(vault, chainId, strategies);
        if (!fapy)
            return null;
        return {
            netAPR: fapy.netAPR,
            netAPY: fapy.netAPY ?? fapy.netAPR,
            forwardBoost: fapy.boost,
            poolAPY: fapy.poolAPY,
            boostedAPR: fapy.boostedAPR,
            baseAPR: fapy.baseAPR,
            rewardsAPR: fapy.rewardsAPR ?? fapy.rewardsAPY,
            rewardsAPY: fapy.rewardsAPY ?? fapy.rewardsAPR,
            cvxAPR: fapy.cvxAPR,
            keepCRV: fapy.keepCRV,
        };
    }
    catch {
        return null;
    }
}
