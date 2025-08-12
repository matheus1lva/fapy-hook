import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as forward from '../src/fapy/crv-like.forward'
vi.mock('viem', async (orig) => {
  const actual = await (orig as any)()
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({ readContract: vi.fn() })),
  }
})
import * as helpers from '../src/helpers'
import { Float } from '../src/helpers/bignumber-float'

function hex(addr: string): `0x${string}` { return addr as `0x${string}` }

describe('crv-like.forward core helpers', () => {
  beforeEach(() => { vi.resetAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('determineCurveKeepCRV prefers strategy.localKeepCRV when present', async () => {
    const strat: any = { address: hex('0xS'), localKeepCRV: 2500 }
    const result = await forward.determineCurveKeepCRV(strat, 1)
    // 2500 bps => 0.25
    // result is a Float (toNormalizedAmount returns Float), allow numeric compare via toFloat64
    const asNum = (result as any).toFloat64 ? (result as any).toFloat64()[0] : Number(result)
    expect(asNum).toBeCloseTo(0.25, 1e-9)
  })

  it('determineCurveKeepCRV falls back to on-chain calls in order', async () => {
    const strat: any = { address: hex('0xS2') }

    const readContract = vi.fn()
      // localKeepCRV missing -> reject first
      .mockRejectedValueOnce(new Error('no localKeepCRV'))
      // keepCRV present -> resolve with 1000 (10%)
      .mockResolvedValueOnce(BigInt(1000))
      // keepCRVPercentage should not be called, but return if it is
      .mockResolvedValueOnce(BigInt(0))

    // Inject our desired readContract behavior
    const viem = await import('viem')
    ;(viem.createPublicClient as any).mockReturnValue({ readContract })

    const result = await forward.determineCurveKeepCRV(strat, 1)
    const asNum = (result as any).toFloat64 ? (result as any).toFloat64()[0] : Number(result)
    expect(asNum).toBeCloseTo(0.1, 1e-9)

    // Ensure keepCRV path used
    expect(readContract).toHaveBeenCalled()
  })

  it('getPoolWeeklyAPY returns 0 when subgraph undefined', () => {
    const res = forward.getPoolWeeklyAPY(undefined as any)
    const [num] = (res as any).toFloat64()
    expect(num).toBe(0)
  })

  it('getRewardsAPY accumulates rewards', () => {
    const pool: any = { gaugeRewards: [{ APY: 1.5 }, { APY: 3.5 }] }
    const res = forward.getRewardsAPY(1, pool)
    const [num] = (res as any).toFloat64()
    expect(num).toBeCloseTo(0.05, 1e-9) // 1.5% + 3.5% = 5% -> 0.05
  })

  it('calculateCurveForwardAPY composes pieces', async () => {
    // Minimal inputs
    const data = {
      gaugeAddress: hex('0xG'),
      strategy: { address: hex('0xS'), performanceFee: 0, managementFee: 0, debtRatio: 10000 } as any,
      baseAPY: new Float(0.05),
      rewardAPY: new Float(0.02),
      poolAPY: new Float(0.01),
      chainId: 1,
      lastDebtRatio: new Float(10000),
    }

    // Boost 2.5x, keepCRV 10%
    vi.spyOn(helpers, 'getCurveBoost' as any).mockResolvedValueOnce(new Float(2.5))
    vi.spyOn(forward, 'determineCurveKeepCRV').mockResolvedValueOnce(new Float(0.1) as any)

    const res = await forward.calculateCurveForwardAPY(data as any)

    expect(res.type).toBe('crv')
    expect(typeof res.netAPY).toBe('number')
    expect(typeof res.boost).toBe('number')
    expect(typeof res.poolAPY).toBe('number')
    expect(typeof res.keepCRV).toBe('number')
  })
})
