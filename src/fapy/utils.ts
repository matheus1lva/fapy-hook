import { Strategy } from './types/strategies'
import { fetchErc20PriceUsd } from '../utils/prices'
import {
  convexBaseStrategyAbi,
  crvRewardsAbi,
  cvxBoosterAbi
} from './abis'
import {
  convertFloatAPRToAPY,
  CRV_TOKEN_ADDRESS, CVX_BOOSTER_ADDRESS, CVX_TOKEN_ADDRESS, getCVXForCRV, YEARN_VOTER_ADDRESS
} from '../helpers'
import { Gauge } from './types'
import { CrvPool } from './types'
import { CrvSubgraphPool } from './types'
import { FraxPool } from './types'
import { rpcs } from '../utils/rpcs'
import { Float } from '../helpers/bignumber-float'
import { BigNumberInt, toNormalizedAmount } from '../helpers/bignumber-int'
import { CVXPoolInfo } from './types'
import { YEARN_VAULT_V022_ABI, YEARN_VAULT_V030_ABI, YEARN_VAULT_ABI_04 } from '../abis/0xAbis.abi'

export function isCurveStrategy(vault: Strategy & { name: string }) {
  const vaultName = vault?.name.toLowerCase()
  return (
    (vaultName?.includes('curve') || vaultName?.includes('convex') || vaultName?.includes('crv')) &&
    !vaultName?.includes('ajna-')
  )
}

export function isConvexStrategy(strategy: Strategy) {
  const strategyName = strategy.name?.toLowerCase()
  return strategyName?.includes('convex') && !strategyName?.includes('curve')
}

export function isFraxStrategy(strategy: Strategy) {
  const vaultName = strategy?.name?.toLowerCase()
  return vaultName?.includes('frax')
}

export function isPrismaStrategy(strategy: Strategy) {
  const vaultName = strategy?.name?.toLowerCase()
  return vaultName?.includes('prisma')
}

export function findGaugeForVault(assetAddress: string, gauges: Gauge[]) {
  return gauges.find((gauge) => {
    if (gauge.swap_token?.toLowerCase() === assetAddress.toLowerCase()) {
      return true
    }
    if (gauge.swap?.toLowerCase() === assetAddress.toLowerCase()) {
      return true
    }
    return false
  })
}

export function findPoolForVault(assetAddress: string, pools: CrvPool[]) {
  return pools.find((pool) => {
    return pool.lpTokenAddress?.toLowerCase() === assetAddress.toLowerCase()
  })
}

export function findFraxPoolForVault(assetAddress: string, fraxPools: FraxPool[]) {
  return fraxPools.find((pool) => {
    return pool.underlyingTokenAddress.toLowerCase() === assetAddress.toLowerCase()
  })
}

export function findSubgraphItemForVault(swapAddress: string, subgraphData: CrvSubgraphPool[]) {
  return subgraphData.find(item =>
    item.address && item.address.toLowerCase() === swapAddress?.toLowerCase()
  )
}

export function getPoolWeeklyAPY(subgraphItem: CrvSubgraphPool | undefined) {
  const result = new Float(0)
  return result.div(new Float(subgraphItem?.latestWeeklyApy || 0), new Float(100))
}

export function getPoolDailyAPY(subgraphItem: CrvSubgraphPool | undefined) {
  const result = new Float(0)
  return result.div(new Float(subgraphItem?.latestDailyApy || 0), new Float(100))
}

export function getPoolPrice(gauge: Gauge): Float {
  let virtualPrice = new BigNumberInt(0)
  if (gauge.swap_data?.virtual_price) {
    virtualPrice = new BigNumberInt(gauge.swap_data.virtual_price)
  }
  return toNormalizedAmount(virtualPrice, 18)
}

export function getRewardsAPY(chainId: number, pool: CrvPool) {
  let totalRewardAPR = new Float(0)
  if (!pool.gaugeRewards || pool.gaugeRewards.length === 0) {
    return totalRewardAPR
  }

  for (const reward of pool.gaugeRewards) {
    const rewardAPR = new Float().div(new Float(reward.APY), new Float(100))
    totalRewardAPR = new Float().add(totalRewardAPR, rewardAPR)
  }

  return totalRewardAPR
}

export async function getCVXPoolAPY(chainId: number, strategyAddress: `0x${string}`, baseAssetPrice: Float) {
  const client = rpcs.next(chainId)
  let crvAPR = new Float(0)
  let cvxAPR = new Float(0)
  let crvAPY = new Float(0)
  let cvxAPY = new Float(0)

  try {
    let rewardPID
    try {
      rewardPID = await client.readContract({
        address: strategyAddress,
        abi: convexBaseStrategyAbi,
        functionName: 'PID',
      })
    } catch (error) {
      try {
        rewardPID = await client.readContract({
          address: strategyAddress,
          abi: convexBaseStrategyAbi,
          functionName: 'ID',
        })
      } catch (innerError) {
        try {
          rewardPID = await client.readContract({
            address: strategyAddress,
            abi: convexBaseStrategyAbi,
            functionName: 'fraxPid',
          })
        } catch (deepError) {
          return { crvAPR, cvxAPR, crvAPY, cvxAPY }
        }
      }
    }

    let poolInfo
    try {
      poolInfo = await client.readContract({
        address: CVX_BOOSTER_ADDRESS[chainId],
        abi: cvxBoosterAbi,
        functionName: 'poolInfo',
        args: [rewardPID],
      }) as CVXPoolInfo
    } catch (error) {
      return { crvAPR, cvxAPR, crvAPY, cvxAPY }
    }

    const [rateResult, totalSupply] = await Promise.all([
      client.readContract({
        address: poolInfo.crvRewards as `0x${string}`,
        abi: crvRewardsAbi,
        functionName: 'rewardRate',
        args: []
      }),
      client.readContract({
        address: poolInfo.crvRewards as `0x${string}`,
        abi: crvRewardsAbi,
        functionName: 'totalSupply',
        args: []
      })
    ]) as [bigint, bigint]

    const rate = toNormalizedAmount(new BigNumberInt(rateResult), 18)
    const supply = toNormalizedAmount(new BigNumberInt(totalSupply), 18)
    let crvPerUnderlying = new Float(0)
    const virtualSupply = new Float(0).mul(supply, baseAssetPrice)

    if (virtualSupply.gt(new Float(0))) {
      crvPerUnderlying = new Float(0).div(rate, virtualSupply)
    }

    const crvPerUnderlyingPerYear = new Float(0).mul(crvPerUnderlying, new Float(31536000))
    const cvxPerYear = await getCVXForCRV(chainId, BigInt(crvPerUnderlyingPerYear.toNumber()))

    const [{ priceUsd: crvPrice }, { priceUsd: cvxPrice }] = await Promise.all([
      fetchErc20PriceUsd(chainId, CRV_TOKEN_ADDRESS[chainId], undefined, true),
      fetchErc20PriceUsd(chainId, CVX_TOKEN_ADDRESS[chainId], undefined, true)
    ])

    crvAPR = new Float(0).mul(crvPerUnderlyingPerYear, new Float(crvPrice))
    cvxAPR = new Float(0).mul(cvxPerYear, new Float(cvxPrice))

    const [crvAPRFloat64] = crvAPR.toFloat64()
    const [cvxAPRFloat64] = cvxAPR.toFloat64()

    crvAPY = new Float().setFloat64(convertFloatAPRToAPY(crvAPRFloat64, 365 / 15))
    cvxAPY = new Float().setFloat64(convertFloatAPRToAPY(cvxAPRFloat64, 365 / 15))
  } catch (error) {
    // Error handled silently
  }

  return {
    crvAPR,
    cvxAPR,
    crvAPY,
    cvxAPY
  }
}

export function getStrategyContractAbi(strategy: Strategy) {
  if (strategy.apiVersion === '0.2.2') {
    return YEARN_VAULT_V022_ABI
  }

  if (strategy.apiVersion === '0.3.0' || strategy.apiVersion === '0.3.1') {
    return YEARN_VAULT_V030_ABI
  }

  return YEARN_VAULT_ABI_04
}

export async function determineCurveKeepCRV(strategy: Strategy, chainId: number) {
  let keepPercentage = BigInt(0)
  let keepCRV = BigInt(0)

  try {
    const [keepCRVResult, keepPercentageResult] = await Promise.all([
      rpcs.next(chainId).readContract({
        address: strategy.address as `0x${string}`,
        abi: getStrategyContractAbi(strategy),
        functionName: 'keepCRV',
      }) as Promise<bigint>,
      rpcs.next(chainId).readContract({
        address: strategy.address as `0x${string}`,
        abi: getStrategyContractAbi(strategy),
        functionName: 'keepCRVPercentage',
      }) as Promise<bigint>
    ])
    keepCRV = keepCRVResult
    keepPercentage = keepPercentageResult
  } catch (error) {
    return 0
  }

  const keepValue = new BigNumberInt(keepCRV).add(new BigNumberInt(keepPercentage))
  return toNormalizedAmount(keepValue, 4).toNumber()
}

export async function getConvexRewardAPY(
  chainID: number,
  strategy: `0x${string}`,
  baseAssetPrice: Float,
  poolPrice: Float
): Promise<{ totalRewardsAPR: Float; totalRewardsAPY: Float }> {
  const client = rpcs.next(chainID)

  let rewardPID: bigint
  try {
    rewardPID = await client.readContract({
      address: strategy,
      abi: convexBaseStrategyAbi,
      functionName: 'pid',
    }) as bigint
  } catch (error) {
    try {
      rewardPID = await client.readContract({
        address: strategy,
        abi: convexBaseStrategyAbi,
        functionName: 'id',
      }) as bigint
    } catch (error) {
      try {
        rewardPID = await client.readContract({
          address: strategy,
          abi: convexBaseStrategyAbi,
          functionName: 'fraxPid',
        }) as bigint
      } catch (error) {
        return { totalRewardsAPR: new Float(0), totalRewardsAPY: new Float(0) }
      }
    }
  }

  let poolInfo: { crvRewards: `0x${string}` }
  try {
    poolInfo = await client.readContract({
      address: CVX_BOOSTER_ADDRESS[chainID],
      abi: cvxBoosterAbi,
      functionName: 'poolInfo',
      args: [rewardPID],
    }) as { crvRewards: `0x${string}` }
  } catch (error) {
    return { totalRewardsAPR: new Float(0), totalRewardsAPY: new Float(0) }
  }

  let rewardsLength: bigint
  try {
    rewardsLength = await client.readContract({
      address: poolInfo.crvRewards as `0x${string}`,
      abi: crvRewardsAbi,
      functionName: 'extraRewardsLength',
    }) as bigint
  } catch (error) {
    return { totalRewardsAPR: new Float(0), totalRewardsAPY: new Float(0) }
  }

  const now = BigInt(Math.floor(Date.now() / 1000))
  let totalRewardsAPR = new Float(0)

  if (rewardsLength > BigInt(0)) {
    for (let i = 0; i < Number(rewardsLength); i++) {
      try {
        const virtualRewardsPool = await client.readContract({
          address: poolInfo.crvRewards as `0x${string}`,
          abi: crvRewardsAbi,
          functionName: 'extraRewards',
          args: [BigInt(i)],
        }) as `0x${string}`

        const [periodFinish, rewardToken, rewardRateInt, totalSupplyInt] = await Promise.all([
          client.readContract({
            address: virtualRewardsPool,
            abi: crvRewardsAbi,
            functionName: 'periodFinish',
          }) as Promise<bigint>,
          client.readContract({
            address: virtualRewardsPool,
            abi: crvRewardsAbi,
            functionName: 'rewardToken',
          }) as Promise<`0x${string}`>,
          client.readContract({
            address: virtualRewardsPool,
            abi: crvRewardsAbi,
            functionName: 'rewardRate',
          }) as Promise<bigint>,
          client.readContract({
            address: virtualRewardsPool,
            abi: crvRewardsAbi,
            functionName: 'totalSupply',
          }) as Promise<bigint>
        ])

        if (periodFinish < now) {
          continue
        }

        const { priceUsd: rewardTokenPrice } = await fetchErc20PriceUsd(chainID, rewardToken, undefined, true)
        if (!rewardTokenPrice) {
          continue
        }

        const tokenPrice = new Float(rewardTokenPrice)

        const rewardRate = toNormalizedAmount(new BigNumberInt(rewardRateInt), 18)
        const totalSupply = toNormalizedAmount(new BigNumberInt(totalSupplyInt), 18)
        const secondPerYear = new Float(0).setFloat64(31556952)

        let rewardAPRTop = new Float(0).mul(rewardRate, secondPerYear)
        rewardAPRTop = new Float(0).mul(rewardAPRTop, tokenPrice)

        let rewardAPRBottom = new Float(0).div(poolPrice, new Float(1))
        rewardAPRBottom = new Float(0).mul(rewardAPRBottom, baseAssetPrice)
        rewardAPRBottom = new Float(0).mul(rewardAPRBottom, totalSupply)

        const rewardAPR = new Float(0).div(rewardAPRTop, rewardAPRBottom)
        totalRewardsAPR = new Float(0).add(totalRewardsAPR, rewardAPR)
      } catch (error) {
        continue
      }
    }
  }

  const [totalRewardsAPRFloat64] = totalRewardsAPR.toFloat64()
  const totalRewardsAPY = new Float(convertFloatAPRToAPY(totalRewardsAPRFloat64, 365 / 15))

  return {
    totalRewardsAPR: totalRewardsAPR,
    totalRewardsAPY: totalRewardsAPY
  }
}

export { YEARN_VOTER_ADDRESS, CRV_TOKEN_ADDRESS, CVX_TOKEN_ADDRESS, CVX_BOOSTER_ADDRESS, convertFloatAPRToAPY, fetchErc20PriceUsd }
