import { convexBaseStrategyAbi } from '../abis/convex-base-strategy.abi';
import { curveGaugeAbi } from '../abis/crv-gauge.abi';
import { strategyBaseAbi } from '../abis/strategy-base.abi';
import { createPublicClient, http } from 'viem';
import { Float } from './bignumber-float';
import { BigNumberInt, toNormalizedAmount } from './bignumber-int';

export const getCurveBoost = async (
  chainID: number,
  voter: `0x${string}`,
  gauge: `0x${string}`,
) => {
  const client = createPublicClient({ transport: http(process.env[`RPC_FULL_NODE_${chainID}`]!) });

  const [{ result: workingBalance }, { result: balanceOf }] = await (client as any).multicall({
    contracts: [
      {
        address: gauge,
        abi: curveGaugeAbi as any,
        functionName: 'working_balances',
        args: [voter],
      },
      { address: gauge, abi: curveGaugeAbi as any, functionName: 'balanceOf', args: [voter] },
    ],
  });

  if (balanceOf && BigInt(balanceOf ?? '0') <= 0n) {
    if (chainID === 1) return new Float(2.5);
    return new Float(1);
  }

  const boost = new Float().div(
    toNormalizedAmount(new BigNumberInt().set(workingBalance ?? 0n), 18),
    new Float().mul(
      new Float(0.4),
      toNormalizedAmount(new BigNumberInt().set(balanceOf ?? 0n), 18),
    ),
  );

  return boost;
};

export const determineConvexKeepCRV = async (
  chainID: number,
  strategy: { address: `0x${string}` },
) => {
  const client = createPublicClient({ transport: http(process.env[`RPC_FULL_NODE_${chainID}`]!) });
  try {
    const uselLocalCRV = await client.readContract({
      address: strategy.address,
      abi: convexBaseStrategyAbi as any,
      functionName: 'uselLocalCRV',
      args: [],
    });
    if (uselLocalCRV) {
      const [keepCVX, localKeepCRV] = await Promise.allSettled([
        client.readContract({
          address: strategy.address,
          abi: convexBaseStrategyAbi as any,
          functionName: 'keepCVX',
          args: [],
        }) as Promise<bigint>,
        client.readContract({
          address: strategy.address,
          abi: convexBaseStrategyAbi as any,
          functionName: 'localKeepCRV',
          args: [],
        }) as Promise<bigint>,
      ]);
      if (keepCVX.status === 'fulfilled')
        return toNormalizedAmount(new BigNumberInt().set(keepCVX.value), 4);
      if (localKeepCRV.status === 'fulfilled')
        return toNormalizedAmount(new BigNumberInt().set(localKeepCRV.value), 4);
      return toNormalizedAmount(new BigNumberInt().set(0n), 4);
    }

    const curveGlobal = (await client.readContract({
      address: strategy.address,
      abi: convexBaseStrategyAbi as any,
      functionName: 'curveGlobal',
      args: [],
    })) as `0x${string}`;
    if (!curveGlobal) return new Float(0);

    try {
      const keepCRV = (await client.readContract({
        address: curveGlobal,
        abi: strategyBaseAbi as any,
        functionName: 'keepCRV',
        args: [],
      })) as bigint;
      return toNormalizedAmount(new BigNumberInt().set(keepCRV), 4);
    } catch {
      return toNormalizedAmount(new BigNumberInt().set(0n), 4);
    }
  } catch {
    return toNormalizedAmount(new BigNumberInt().set(0n), 4);
  }
};
