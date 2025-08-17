
import { zeroAddress, createPublicClient, http } from 'viem';
import { fetchErc20PriceUsd } from '../utils/prices';
import { convexBaseStrategyAbi } from '../abis/convex-base-strategy.abi';
import { crvRewardsAbi } from '../abis/crv-rewards.abi';
import { cvxBoosterAbi } from '../abis/cvx-booster.abi';
import { yprismaAbi } from '../abis/yprisma.abi';
import {
  convertFloatAPRToAPY,
  CRV_TOKEN_ADDRESS,
  CVX_BOOSTER_ADDRESS,
  CVX_TOKEN_ADDRESS,
  determineConvexKeepCRV,
  getConvexRewardAPY,
  getCurveBoost,
  getCVXForCRV,
  getPrismaAPY,
  YEARN_VOTER_ADDRESS,
} from '../helpers';
import { Gauge } from '../types/gauges';
import { CrvPool } from '../types/crv-pools';
import { CrvSubgraphPool } from '../types/crv-subgraph';
import { FraxPool } from '../types/frax-pools';
import { Float } from '../helpers/bignumber-float';
import { BigNumberInt, toNormalizedAmount } from '../helpers/bignumber-int';
import { CVXPoolInfo } from '../types/cvx';
import { GqlStrategy, GqlVault } from '../types/kongTypes';
import { VaultAPY } from './fapy';
import { getChainFromChainId } from '../utils/rpcs';

export function isCurveStrategy(vault: { name?: string | null }) {
  const vaultName = (vault?.name || '').toLowerCase();
  return (
    (vaultName.includes('curve') || vaultName.includes('convex') || vaultName.includes('crv')) &&
    !vaultName.includes('ajna-')
  );
}

export function isConvexStrategy(strategy: { name?: string | null }) {
  const strategyName = strategy.name?.toLowerCase();
  return strategyName?.includes('convex') && !strategyName?.includes('curve');
}
export function isFraxStrategy(strategy: { name?: string | null }) {
  return strategy?.name?.toLowerCase().includes('frax');
}
export function isPrismaStrategy(strategy: { name?: string | null }) {
  return strategy?.name?.toLowerCase().includes('prisma');
}

export function findGaugeForVault(assetAddress: string | undefined, gauges: Gauge[]) {
  if (!assetAddress) return null;
  return gauges.find(
    (gauge) =>
      gauge.swap_token?.toLowerCase() === assetAddress.toLowerCase() ||
      gauge.swap?.toLowerCase() === assetAddress.toLowerCase(),
  );
}
export function findPoolForVault(assetAddress: string, pools: CrvPool[]) {
  return pools.find((pool) => pool.lpTokenAddress?.toLowerCase() === assetAddress.toLowerCase());
}
export function findFraxPoolForVault(assetAddress: string, fraxPools: FraxPool[]) {
  return fraxPools.find(
    (pool) => pool.underlyingTokenAddress.toLowerCase() === assetAddress.toLowerCase(),
  );
}
export function findSubgraphItemForVault(swapAddress: string, subgraphData: CrvSubgraphPool[]) {
  return subgraphData.find(
    (item) => item.address && item.address.toLowerCase() === swapAddress?.toLowerCase(),
  );
}

export function getPoolWeeklyAPY(subgraphItem: CrvSubgraphPool | undefined) {
  return new Float(0).div(new Float(subgraphItem?.latestWeeklyApy || 0), new Float(100));
}
export function getPoolDailyAPY(subgraphItem: CrvSubgraphPool | undefined) {
  return new Float(0).div(new Float(subgraphItem?.latestDailyApy || 0), new Float(100));
}
export function getPoolPrice(gauge: Gauge): Float {
  const vp = gauge.swap_data?.virtual_price
    ? new BigNumberInt(gauge.swap_data.virtual_price)
    : new BigNumberInt(0);
  return toNormalizedAmount(vp, 18);
}
export function getRewardsAPY(chainId: number, pool: CrvPool) {
  let total = new Float(0);
  if (!pool?.gaugeRewards?.length) return total;
  for (const reward of pool.gaugeRewards) {
    const apr = new Float().div(new Float(reward.APY), new Float(100));
    total = new Float().add(total, apr);
  }
  return total;
}

export async function getCVXPoolAPY(
  chainId: number,
  strategyAddress: `0x${string}`,
  baseAssetPrice: Float,
) {
  const client = createPublicClient({
    chain: getChainFromChainId(chainId),
    transport: http(process.env[`RPC_CHAIN_URL_${chainId}`]!),
  });
  let crvAPR = new Float(0),
    cvxAPR = new Float(0),
    crvAPY = new Float(0),
    cvxAPY = new Float(0);
  try {
    let rewardPID: any;
    try {
      rewardPID = await client.readContract({
        address: strategyAddress,
        abi: convexBaseStrategyAbi as any,
        functionName: 'PID',
        args: [],
      });
    } catch {
      try {
        rewardPID = await client.readContract({
          address: strategyAddress,
          abi: convexBaseStrategyAbi as any,
          functionName: 'ID',
          args: [],
        });
      } catch {
        try {
          rewardPID = await client.readContract({
            address: strategyAddress,
            abi: convexBaseStrategyAbi as any,
            functionName: 'fraxPid',
            args: [],
          });
        } catch {
          return { crvAPR, cvxAPR, crvAPY, cvxAPY };
        }
      }
    }
    let poolInfo: CVXPoolInfo;
    try {
      poolInfo = (await client.readContract({
        address: CVX_BOOSTER_ADDRESS[chainId],
        abi: cvxBoosterAbi as any,
        functionName: 'poolInfo',
        args: [rewardPID],
      })) as any;
    } catch {
      return { crvAPR, cvxAPR, crvAPY, cvxAPY };
    }

    const [rateResult, totalSupply] = await Promise.all([
      client.readContract({
        address: poolInfo.crvRewards as any,
        abi: crvRewardsAbi as any,
        functionName: 'rewardRate',
        args: [],
      }) as Promise<bigint>,
      client.readContract({
        address: poolInfo.crvRewards as any,
        abi: crvRewardsAbi as any,
        functionName: 'totalSupply',
        args: [],
      }) as Promise<bigint>,
    ]);

    const rate = toNormalizedAmount(new BigNumberInt(rateResult), 18);
    const supply = toNormalizedAmount(new BigNumberInt(totalSupply), 18);
    let crvPerUnderlying = new Float(0);
    const virtualSupply = new Float(0).mul(supply, baseAssetPrice);
    if (virtualSupply.gt(new Float(0))) crvPerUnderlying = new Float(0).div(rate, virtualSupply);

    const crvPerUnderlyingPerYear = new Float(0).mul(crvPerUnderlying, new Float(31536000));
    const cvxPerYear = await getCVXForCRV(chainId, BigInt(crvPerUnderlyingPerYear.toNumber()));

    const [{ priceUsd: crvPrice }, { priceUsd: cvxPrice }] = await Promise.all([
      fetchErc20PriceUsd(chainId, CRV_TOKEN_ADDRESS[chainId], undefined, true),
      fetchErc20PriceUsd(chainId, CVX_TOKEN_ADDRESS[chainId], undefined, true),
    ]);

    crvAPR = new Float(0).mul(crvPerUnderlyingPerYear, new Float(crvPrice));
    cvxAPR = new Float(0).mul(cvxPerYear, new Float(cvxPrice));

    const [crvAPRFloat64] = (crvAPR as any).toFloat64();
    const [cvxAPRFloat64] = (cvxAPR as any).toFloat64();

    crvAPY = new Float().setFloat64(convertFloatAPRToAPY(crvAPRFloat64, 365 / 15));
    cvxAPY = new Float().setFloat64(convertFloatAPRToAPY(cvxAPRFloat64, 365 / 15));
  } catch { }
  return { crvAPR, cvxAPR, crvAPY, cvxAPY };
}
export async function determineCurveKeepCRV(strategy: GqlStrategy, chainId: number) {
  const local = (strategy as any).localKeepCRV;
  if (local !== undefined && local !== null) {
    return toNormalizedAmount(new BigNumberInt(local as any), 4) as any;
  }

  try {
    const client = createPublicClient({
      chain: getChainFromChainId(chainId),
      transport: http(process.env[`RPC_CHAIN_URL_${chainId}`]!),
    });
    const abi = convexBaseStrategyAbi as any;

    const [localKeepCRVResult, keepCRVResult, keepCRVPercentageResult] = await Promise.allSettled([
      client.readContract({ address: strategy.address, abi, functionName: 'localKeepCRV', args: [] }) as Promise<bigint>,
      client.readContract({ address: strategy.address, abi, functionName: 'keepCRV', args: [] }) as Promise<bigint>,
      client.readContract({ address: strategy.address, abi, functionName: 'keepCRVPercentage', args: [] }) as Promise<bigint>,
    ]);

    let raw: bigint = 0n;
    if (localKeepCRVResult.status === 'fulfilled') raw = localKeepCRVResult.value;
    else if (keepCRVResult.status === 'fulfilled') raw = keepCRVResult.value;
    else if (keepCRVPercentageResult.status === 'fulfilled') raw = keepCRVPercentageResult.value;

    return toNormalizedAmount(new BigNumberInt(raw), 4) as any;
  } catch {
    return new Float(0) as any;
  }
}

export async function calculateCurveForwardAPY(data: {
  gaugeAddress: `0x${string}`;
  strategy: GqlStrategy;
  baseAPY: Float;
  rewardAPY: Float;
  poolAPY: Float;
  chainId: number;
  lastDebtRatio: Float;
}) {
  const chainId = data.chainId;
  const [yboost, keepCrv] = await Promise.all([
    getCurveBoost(chainId, YEARN_VOTER_ADDRESS[chainId], data.gaugeAddress),
    determineCurveKeepCRV(data.strategy, chainId),
  ]);
  const debtRatio = toNormalizedAmount(new BigNumberInt(data.lastDebtRatio.toNumber()), 4);
  const performanceFee = toNormalizedAmount(
    new BigNumberInt((data.strategy as any).performanceFee ?? 0),
    4,
  );
  const managementFee = toNormalizedAmount(
    new BigNumberInt((data.strategy as any).managementFee ?? 0),
    4,
  );
  const oneMinusPerfFee = new Float().sub(new Float(1), performanceFee);

  let crvAPY = new Float().mul(data.baseAPY, yboost);
  crvAPY = new Float().add(crvAPY, data.rewardAPY);

  const keepCRVRatio = new Float().add(new Float(1), new Float((keepCrv as any) ?? 0));
  let grossAPY = new Float().mul(data.baseAPY, yboost);
  grossAPY = new Float().mul(grossAPY, keepCRVRatio);
  grossAPY = new Float().add(grossAPY, data.rewardAPY);

  let netAPY = new Float().mul(grossAPY, oneMinusPerfFee);
  if (netAPY.gt(managementFee)) netAPY = new Float().sub(netAPY, managementFee);
  else netAPY = new Float(0);

  return {
    type: 'crv',
    netAPY: (netAPY as any).toFloat64()[0],
    boost: new Float().mul(yboost, debtRatio).toFloat64()[0],
    poolAPY: new Float().mul(data.poolAPY, debtRatio).toFloat64()[0],
    boostedAPR: new Float().mul(crvAPY, debtRatio).toFloat64()[0],
    baseAPR: new Float().mul(data.baseAPY, debtRatio).toFloat64()[0],
    rewardsAPY: new Float().mul(data.rewardAPY, debtRatio).toFloat64()[0],
    keepCRV: new Float(keepCrv).toFloat64()[0],
  };
}

export async function calculateConvexForwardAPY(data: {
  gaugeAddress: `0x${string}`;
  strategy: GqlStrategy;
  baseAssetPrice: Float;
  poolPrice: Float;
  baseAPY: Float;
  rewardAPY: Float;
  poolWeeklyAPY: Float;
  chainId: number;
  lastDebtRatio: Float;
}) {
  const {
    gaugeAddress,
    strategy,
    baseAssetPrice,
    poolPrice,
    baseAPY,
    rewardAPY,
    poolWeeklyAPY,
    chainId,
    lastDebtRatio,
  } = data;
  const [cvxBoost, keepCRV] = await Promise.all([
    getCurveBoost(chainId, gaugeAddress, strategy.address),
    determineConvexKeepCRV(chainId, strategy as any),
  ]);
  const debtRatio = toNormalizedAmount(new BigNumberInt(lastDebtRatio.toNumber()), 4);
  const performanceFee = toNormalizedAmount(
    new BigNumberInt((strategy as any).performanceFee ?? 0),
    4,
  );
  const managementFee = toNormalizedAmount(
    new BigNumberInt((strategy as any).managementFee ?? 0),
    4,
  );
  const oneMinusPerfFee = new Float().sub(new Float(1), performanceFee);

  const [{ crvAPR, cvxAPR, crvAPY, cvxAPY }, { totalRewardsAPY: rewardsAPY }] = await Promise.all([
    getCVXPoolAPY(chainId, strategy.address as any, baseAssetPrice),
    getConvexRewardAPY(chainId, strategy.address as any, baseAssetPrice, poolPrice),
  ]);

  const keepCRVRatio = new Float().sub(new Float(1), keepCRV);
  let grossAPY = new Float().mul(crvAPY, keepCRVRatio);
  grossAPY = new Float().add(grossAPY, rewardsAPY);
  grossAPY = new Float().add(grossAPY, poolWeeklyAPY);
  grossAPY = new Float().add(grossAPY, cvxAPY);

  let netAPY = new Float().mul(grossAPY, oneMinusPerfFee);
  if (netAPY.gt(managementFee)) netAPY = new Float().sub(netAPY, managementFee);
  else netAPY = new Float(0);

  return {
    type: 'cvx',
    debtRatio: debtRatio.toFloat64()[0],
    netAPY: netAPY.toFloat64()[0],
    boost: new Float().mul(cvxBoost, debtRatio).toFloat64()[0],
    poolAPY: new Float().mul(poolWeeklyAPY, debtRatio).toFloat64()[0],
    boostedAPR: new Float().mul(crvAPR, debtRatio).toFloat64()[0],
    baseAPR: new Float().mul(baseAPY, debtRatio).toFloat64()[0],
    cvxAPR: new Float().mul(cvxAPR, debtRatio).toFloat64()[0],
    rewardsAPY: new Float().mul(rewardAPY, debtRatio).toFloat64()[0],
    keepCRV: keepCRV.toFloat64()[0],
  };
}

export async function calculateFraxForwardAPY(data: any, fraxPool: any) {
  if (!fraxPool) return null;
  const base = await calculateConvexForwardAPY(data);
  const minRewardsAPR = parseFloat(fraxPool.totalRewardAprs.min);
  return {
    ...base,
    type: 'frax',
    netAPY: base.netAPY + minRewardsAPR,
    rewardsAPY: base.rewardsAPY + minRewardsAPR,
  };
}

export async function calculatePrismaForwardAPR(data: any) {
  const { vault, chainId } = data;
  const client = createPublicClient({
    chain: getChainFromChainId(chainId),
    transport: http(process.env[`RPC_CHAIN_URL_${chainId}`]!),
  });
  const [receiver] = (await client.readContract({
    address: vault.address,
    abi: yprismaAbi as any,
    functionName: 'prismaReceiver',
    args: [],
  })) as any;
  if (receiver === zeroAddress) return null;
  const [base, [, prismaAPY]] = await Promise.all([
    calculateConvexForwardAPY({ ...data, lastDebtRatio: new Float((data.strategy?.debtRatio || 0) as any) }),
    getPrismaAPY(chainId, receiver),
  ]);
  return {
    ...base,
    type: 'prisma',
    netAPY: base.netAPY + prismaAPY,
    rewardsAPY: base.rewardsAPY + prismaAPY,
  };
}

export async function calculateGaugeBaseAPR(
  gauge: Gauge,
  crvTokenPrice: Float,
  poolPrice: Float,
  baseAssetPrice: Float,
) {
  let inflationRate = new Float(0);
  if (typeof gauge.gauge_controller.inflation_rate === 'string')
    inflationRate = toNormalizedAmount(new BigNumberInt(gauge.gauge_controller.inflation_rate), 18);
  else inflationRate = new Float().setFloat64((gauge.gauge_controller as any).inflation_rate);
  const gaugeWeight = toNormalizedAmount(
    new BigNumberInt(gauge.gauge_controller.gauge_relative_weight),
    18,
  );
  const secondsPerYear = new Float(31556952);
  const workingSupply = toNormalizedAmount(new BigNumberInt(gauge.gauge_data.working_supply), 18);
  const perMaxBoost = new Float(0.4);
  const crvPrice = crvTokenPrice instanceof Float ? crvTokenPrice : new Float(crvTokenPrice);
  const poolPriceFloat = poolPrice instanceof Float ? poolPrice : new Float(poolPrice);
  const baseAssetPriceFloat =
    baseAssetPrice instanceof Float ? baseAssetPrice : new Float(baseAssetPrice);
  let baseAPR = new Float(0).mul(inflationRate, gaugeWeight);
  const yearsBySupply = new Float(0).div(secondsPerYear, workingSupply);
  baseAPR = new Float().mul(baseAPR, yearsBySupply);
  const boostByPool = new Float(0).div(perMaxBoost, poolPriceFloat);
  baseAPR = new Float().mul(baseAPR, boostByPool);
  baseAPR = new Float().mul(baseAPR, crvPrice);
  baseAPR = new Float().div(baseAPR, baseAssetPriceFloat);
  const [baseAPRFloat] = (baseAPR as any).toFloat64();
  const baseAPY = new Float().setFloat64(convertFloatAPRToAPY(baseAPRFloat, 365 / 15));
  return { baseAPY, baseAPR };
}

export async function calculateCurveLikeStrategyAPR(
  vault: GqlVault,
  strategy: GqlStrategy,
  gauge: Gauge,
  pool: CrvPool | undefined,
  fraxPool: FraxPool | undefined,
  subgraphItem: CrvSubgraphPool | undefined,
  chainId: number,
) {
  const baseAssetPrice = new Float().setFloat64(gauge.lpTokenPrice || 0);
  const [{ priceUsd }, poolPrice] = await Promise.all([
    fetchErc20PriceUsd(chainId, CRV_TOKEN_ADDRESS[chainId], undefined, true),
    Promise.resolve(getPoolPrice(gauge)),
  ]);
  const crvPrice = new Float(priceUsd);
  const { baseAPY } = await calculateGaugeBaseAPR(gauge, crvPrice, poolPrice, baseAssetPrice);
  const rewardAPY = getRewardsAPY(chainId, pool as any);
  const poolWeeklyAPY = getPoolWeeklyAPY(subgraphItem);

  if (isPrismaStrategy(strategy as any))
    return calculatePrismaForwardAPR({
      vault,
      chainId,
      gaugeAddress: gauge.gauge as any,
      strategy: strategy as any,
      baseAssetPrice,
      poolPrice,
      baseAPY,
      rewardAPY,
      poolWeeklyAPY,
    });
  if (isFraxStrategy(strategy as any))
    return calculateFraxForwardAPY(
      {
        gaugeAddress: gauge.gauge as any,
        strategy: strategy as any,
        baseAssetPrice,
        poolPrice,
        baseAPY,
        rewardAPY,
        poolWeeklyAPY,
        chainId,
        lastDebtRatio: new Float(strategy.debtRatio || 0),
      },
      fraxPool,
    );
  if (isConvexStrategy(strategy as any))
    return calculateConvexForwardAPY({
      gaugeAddress: gauge.gauge as any,
      strategy: strategy as any,
      baseAssetPrice,
      poolPrice,
      baseAPY,
      rewardAPY,
      poolWeeklyAPY,
      chainId,
      lastDebtRatio: new Float(strategy.debtRatio || 0),
    });
  return calculateCurveForwardAPY({
    gaugeAddress: gauge.gauge as any,
    strategy: strategy as any,
    baseAPY,
    rewardAPY,
    poolAPY: poolWeeklyAPY,
    chainId,
    lastDebtRatio: new Float(strategy.debtRatio || 0),
  });
}

export async function computeCurveLikeForwardAPY({
  vault,
  gauges,
  pools,
  subgraphData,
  fraxPools,
  allStrategiesForVault,
  chainId,
}: {
  vault: GqlVault;
  gauges: Gauge[];
  pools: CrvPool[];
  subgraphData: CrvSubgraphPool[];
  fraxPools: FraxPool[];
  allStrategiesForVault: GqlStrategy[];
  chainId: number;
}): Promise<VaultAPY> {
  const gauge = findGaugeForVault(vault.asset?.address ?? '', gauges);
  if (!gauge) return { type: '', netAPY: 0 };
  const pool = findPoolForVault(vault.asset?.address ?? '', pools);
  const fraxPool = findFraxPoolForVault(vault.asset?.address ?? '', fraxPools);
  const subgraphItem = findSubgraphItemForVault(gauge.swap, subgraphData);

  let typeOf = '',
    netAPY = new Float(0),
    boost = new Float(0),
    poolAPY = new Float(0),
    boostedAPR = new Float(0),
    baseAPR = new Float(0),
    cvxAPR = new Float(0),
    rewardsAPY = new Float(0),
    keepCRV = new Float(0);

  const strategyAPRs = await Promise.all(
    allStrategiesForVault.map(async (strategy) => {
      if (!strategy.debtRatio || strategy.debtRatio === 0) return null;
      return calculateCurveLikeStrategyAPR(
        vault,
        strategy,
        gauge,
        pool,
        fraxPool,
        subgraphItem,
        chainId,
      );
    }),
  );

  for (const s of strategyAPRs) {
    if (!s) continue;
    typeOf += s.type;
    netAPY = new Float(0).add(netAPY, new Float(s.netAPY || 0));
    boost = new Float(0).add(boost, new Float(s.boost || 0));
    poolAPY = new Float(0).add(poolAPY, new Float(s.poolAPY || 0));
    boostedAPR = new Float(0).add(boostedAPR, new Float(s.boostedAPR || 0));
    baseAPR = new Float(0).add(baseAPR, new Float(s.baseAPR || 0));
    cvxAPR = new Float(0).add(cvxAPR, new Float((s as any).cvxAPR || 0));
    rewardsAPY = new Float(0).add(rewardsAPY, new Float(s.rewardsAPY || 0));
    keepCRV = new Float(0).add(keepCRV, new Float(s.keepCRV || 0));
  }

  return {
    type: typeOf,
    netAPR: netAPY.toFloat64()[0],
    boost: boost.toFloat64()[0],
    poolAPY: poolAPY.toFloat64()[0],
    boostedAPR: boostedAPR.toFloat64()[0],
    baseAPR: baseAPR.toFloat64()[0],
    cvxAPR: cvxAPR.toFloat64()[0],
    rewardsAPY: rewardsAPY.toFloat64()[0],
    keepCRV: keepCRV.toFloat64()[0],
  };
}
