import { erc20Abi } from '../abis/erc20.abi';
import { fetchErc20PriceUsd } from '../prices';
import { convertFloatAPRToAPY } from './calculation.helper';
import { CVX_TOKEN_ADDRESS } from './maps.helper';
import { convexBaseStrategyAbi } from '../abis/convex-base-strategy.abi';
import { cvxBoosterAbi } from '../abis/cvx-booster.abi';
import { crvRewardsAbi } from '../abis/crv-rewards.abi';
import { Float } from './bignumber-float';
import { toNormalizedAmount, BigNumberInt } from './bignumber-int';
import { createPublicClient, http } from 'viem';
export const getCVXForCRV = async (chainID, crvEarned) => {
    const client = createPublicClient({ transport: http(process.env[`RPC_FULL_NODE_${chainID}`]) });
    const cliffSize = new Float(0).setString('100000000000000000000000');
    const cliffCount = new Float(0).setString('1000');
    const maxSupply = new Float(0).setString('100000000000000000000000000');
    try {
        const cvxTotalSupplyInt = (await client.readContract({
            address: CVX_TOKEN_ADDRESS[chainID],
            abi: erc20Abi,
            functionName: 'totalSupply',
            args: [],
        }));
        const cvxTotalSupply = new Float(0).setInt(new BigNumberInt(cvxTotalSupplyInt));
        const crvEarnedFloat = new Float(0).setInt(new BigNumberInt(crvEarned));
        const currentCliff = new Float(0).div(cvxTotalSupply, cliffSize);
        if (currentCliff.gte(cliffCount)) {
            return new Float(0);
        }
        const remaining = new Float(0).sub(cliffCount, currentCliff);
        let cvxEarned = new Float(0).mul(crvEarnedFloat, remaining);
        cvxEarned = new Float(0).div(cvxEarned, cliffCount);
        const amountTillMax = new Float(0).sub(maxSupply, cvxTotalSupply);
        if (cvxEarned.gt(amountTillMax)) {
            cvxEarned = amountTillMax;
        }
        return cvxEarned;
    }
    catch {
        return new Float(0);
    }
};
export const getConvexRewardAPY = async (chainID, strategy, baseAssetPrice, poolPrice) => {
    const client = createPublicClient({ transport: http(process.env[`RPC_FULL_NODE_${chainID}`]) });
    let rewardPID;
    try {
        rewardPID = (await client.readContract({
            address: strategy,
            abi: convexBaseStrategyAbi,
            functionName: 'pid',
            args: [],
        }));
    }
    catch {
        try {
            rewardPID = (await client.readContract({
                address: strategy,
                abi: convexBaseStrategyAbi,
                functionName: 'id',
                args: [],
            }));
        }
        catch {
            try {
                rewardPID = (await client.readContract({
                    address: strategy,
                    abi: convexBaseStrategyAbi,
                    functionName: 'fraxPid',
                    args: [],
                }));
            }
            catch {
                return { totalRewardsAPR: new Float(0), totalRewardsAPY: new Float(0) };
            }
        }
    }
    let poolInfo;
    try {
        poolInfo = (await client.readContract({
            address: CVX_TOKEN_ADDRESS[chainID],
            abi: cvxBoosterAbi,
            functionName: 'poolInfo',
            args: [rewardPID],
        }));
    }
    catch {
        return { totalRewardsAPR: new Float(0), totalRewardsAPY: new Float(0) };
    }
    let rewardsLength;
    try {
        rewardsLength = (await client.readContract({
            address: poolInfo.crvRewards,
            abi: crvRewardsAbi,
            functionName: 'extraRewardsLength',
            args: [],
        }));
    }
    catch {
        return { totalRewardsAPR: new Float(0), totalRewardsAPY: new Float(0) };
    }
    const now = BigInt(Math.floor(Date.now() / 1000));
    let totalRewardsAPR = new Float(0);
    if (rewardsLength > BigInt(0)) {
        for (let i = 0; i < Number(rewardsLength); i++) {
            try {
                const virtualRewardsPool = (await client.readContract({
                    address: poolInfo.crvRewards,
                    abi: crvRewardsAbi,
                    functionName: 'extraRewards',
                    args: [BigInt(i)],
                }));
                const [periodFinish, rewardToken, rewardRateInt, totalSupplyInt] = await Promise.all([
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: crvRewardsAbi,
                        functionName: 'periodFinish',
                        args: [],
                    }),
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: crvRewardsAbi,
                        functionName: 'rewardToken',
                        args: [],
                    }),
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: crvRewardsAbi,
                        functionName: 'rewardRate',
                        args: [],
                    }),
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: crvRewardsAbi,
                        functionName: 'totalSupply',
                        args: [],
                    }),
                ]);
                if (periodFinish < now)
                    continue;
                const { priceUsd: rewardTokenPrice } = await fetchErc20PriceUsd(chainID, rewardToken, undefined, true);
                if (!rewardTokenPrice)
                    continue;
                const tokenPrice = new Float(rewardTokenPrice);
                const rewardRate = toNormalizedAmount(new BigNumberInt(rewardRateInt), 18);
                const totalSupply = toNormalizedAmount(new BigNumberInt(totalSupplyInt), 18);
                const secondPerYear = new Float(0).setFloat64(31556952);
                let rewardAPRTop = new Float(0).mul(rewardRate, secondPerYear);
                rewardAPRTop = new Float(0).mul(rewardAPRTop, tokenPrice);
                let rewardAPRBottom = new Float(0).div(poolPrice, new Float(1));
                rewardAPRBottom = new Float(0).mul(rewardAPRBottom, baseAssetPrice);
                rewardAPRBottom = new Float(0).mul(rewardAPRBottom, totalSupply);
                const rewardAPR = new Float(0).div(rewardAPRTop, rewardAPRBottom);
                totalRewardsAPR = new Float(0).add(totalRewardsAPR, rewardAPR);
            }
            catch { }
        }
    }
    const [totalRewardsAPRFloat64] = totalRewardsAPR.toFloat64();
    const totalRewardsAPY = new Float(convertFloatAPRToAPY(totalRewardsAPRFloat64, 365 / 15));
    return { totalRewardsAPR: totalRewardsAPR, totalRewardsAPY };
};
