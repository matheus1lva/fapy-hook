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

export const getCVXForCRV = async (chainID: number, crvEarned: bigint) => {
  const client = createPublicClient({ transport: http(process.env[`RPC_FULL_NODE_${chainID}`]!) });

  const cliffSize = new Float(0).setString('100000000000000000000000');
  const cliffCount = new Float(0).setString('1000');
  const maxSupply = new Float(0).setString('100000000000000000000000000');

  try {
    const cvxTotalSupplyInt = (await client.readContract({
      address: CVX_TOKEN_ADDRESS[chainID],
      abi: erc20Abi as any,
      functionName: 'totalSupply',
      args: [],
    })) as bigint;

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
  } catch {
    return new Float(0);
  }
};

export const getConvexRewardAPY = async (
  chainID: number,
  strategy: `0x${string}`,
  baseAssetPrice: Float,
  poolPrice: Float,
): Promise<{ totalRewardsAPR: Float; totalRewardsAPY: Float }> => {
  const client = createPublicClient({ transport: http(process.env[`RPC_FULL_NODE_${chainID}`]!) });

  let rewardPID: bigint;
  try {
    rewardPID = (await client.readContract({
      address: strategy,
      abi: convexBaseStrategyAbi as any,
      functionName: 'pid',
      args: [],
    })) as bigint;
  } catch {
    try {
      rewardPID = (await client.readContract({
        address: strategy,
        abi: convexBaseStrategyAbi as any,
        functionName: 'id',
        args: [],
      })) as bigint;
    } catch {
      try {
        rewardPID = (await client.readContract({
          address: strategy,
          abi: convexBaseStrategyAbi as any,
          functionName: 'fraxPid',
          args: [],
        })) as bigint;
      } catch {
        return { totalRewardsAPR: new Float(0), totalRewardsAPY: new Float(0) };
      }
    }
  }

  let poolInfo: { crvRewards: `0x${string}` };
  try {
    poolInfo = (await client.readContract({
      address: CVX_TOKEN_ADDRESS[chainID],
      abi: cvxBoosterAbi as any,
      functionName: 'poolInfo',
      args: [rewardPID],
    })) as any;
  } catch {
    return { totalRewardsAPR: new Float(0), totalRewardsAPY: new Float(0) };
  }

  let rewardsLength: bigint;
  try {
    rewardsLength = (await client.readContract({
      address: poolInfo.crvRewards,
      abi: crvRewardsAbi as any,
      functionName: 'extraRewardsLength',
      args: [],
    })) as bigint;
  } catch {
    return { totalRewardsAPR: new Float(0), totalRewardsAPY: new Float(0) };
  }

  const now = BigInt(Math.floor(Date.now() / 1000));
  let totalRewardsAPR = new Float(0);

  if (rewardsLength > BigInt(0)) {
    for (let i = 0; i < Number(rewardsLength); i++) {
      try {
        const virtualRewardsPool = (await client.readContract({
          address: poolInfo.crvRewards,
          abi: crvRewardsAbi as any,
          functionName: 'extraRewards',
          args: [BigInt(i)],
        })) as `0x${string}`;

        const [periodFinish, rewardToken, rewardRateInt, totalSupplyInt] = await Promise.all([
          client.readContract({
            address: virtualRewardsPool,
            abi: crvRewardsAbi as any,
            functionName: 'periodFinish',
            args: [],
          }) as Promise<bigint>,
          client.readContract({
            address: virtualRewardsPool,
            abi: crvRewardsAbi as any,
            functionName: 'rewardToken',
            args: [],
          }) as Promise<`0x${string}`>,
          client.readContract({
            address: virtualRewardsPool,
            abi: crvRewardsAbi as any,
            functionName: 'rewardRate',
            args: [],
          }) as Promise<bigint>,
          client.readContract({
            address: virtualRewardsPool,
            abi: crvRewardsAbi as any,
            functionName: 'totalSupply',
            args: [],
          }) as Promise<bigint>,
        ]);

        if (periodFinish < now) continue;

        const { priceUsd: rewardTokenPrice } = await fetchErc20PriceUsd(
          chainID,
          rewardToken,
          undefined,
          true,
        );
        if (!rewardTokenPrice) continue;

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
      } catch {}
    }
  }

  const [totalRewardsAPRFloat64] = (totalRewardsAPR as any).toFloat64();
  const totalRewardsAPY = new Float(convertFloatAPRToAPY(totalRewardsAPRFloat64, 365 / 15));

  return { totalRewardsAPR: totalRewardsAPR as any, totalRewardsAPY };
};
