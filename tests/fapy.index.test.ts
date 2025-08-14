import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Subject under test
import * as fapyIndex from '../src/fapy/index'

// Dependencies to mock
import * as service from '../src/fapy/service'
import * as strategyQueries from '../src/queries/strategy'
import { computeChainAPY } from '../src/fapy/apy'

// Shared helpers
function hex(addr: string): `0x${string}` {
  return addr as `0x${string}`
}

describe('computeVaultFapy', () => {
  const chainId = 1
  const vaultAddress = hex('0x0000000000000000000000000000000000000001')

  const baseVault = {
    chainId,
    address: vaultAddress,
    name: 'Yearn Curve Vault',
    asset: { address: hex('0xToken'), chainId: 1, name: 'Token', symbol: 'TKN', decimals: 18 },
    decimals: 18,
  } as any

  const baseStrategy = {
    chainId,
    address: hex('0xStrategy'),
    name: 'Convex Strategy',
    debtRatio: 1000,
    performanceFee: 0,
    managementFee: 0,
  } as any

  const baseFapy = {
    type: 'cvx',
    netAPR: 0.12,
    netAPY: 0.13,
    boost: 1.7,
    poolAPY: 0.01,
    boostedAPR: 0.10,
    baseAPR: 0.05,
    cvxAPR: 0.02,
    rewardsAPY: 0.03,
    keepCRV: 0.1,
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when service returns null', async () => {
    vi.spyOn(strategyQueries, 'getVaultStrategies').mockResolvedValueOnce(null)

    const res = await fapyIndex.computeChainAPY(chainId, vaultAddress)
    expect(res).toBeNull()
  })

  it('returns null when no vault returned', async () => {
    vi.spyOn(strategyQueries, 'getVaultStrategies').mockResolvedValueOnce({ vault: null, strategies: [] } as any)

    const res = await fapyIndex.computeChainAPY(chainId, vaultAddress)
    expect(res).toBeNull()
  })

  it('returns null when computeChainAPY returns null', async () => {
    vi.spyOn(strategyQueries, 'getVaultStrategies').mockResolvedValueOnce({ vault: baseVault, strategies: [baseStrategy] } as any)
    vi.spyOn(fapyIndex, 'computeChainAPY').mockResolvedValueOnce(null)

    const res = await fapyIndex.computeChainAPY(chainId, vaultAddress)
    expect(res).toBeNull()
  })

  it('maps computeChainAPY fields to VaultFapy correctly (with netAPY present)', async () => {
    vi.spyOn(strategyQueries, 'getVaultStrategies').mockResolvedValueOnce({ vault: baseVault, strategies: [baseStrategy] } as any)
    vi.spyOn(fapyIndex, 'computeChainAPY').mockResolvedValueOnce({ ...baseFapy })

    const res = await fapyIndex.computeChainAPY(chainId, vaultAddress)
    expect(res).toEqual({
      netAPR: baseFapy.netAPR,
      netAPY: baseFapy.netAPY,
      forwardBoost: baseFapy.boost,
      poolAPY: baseFapy.poolAPY,
      boostedAPR: baseFapy.boostedAPR,
      baseAPR: baseFapy.baseAPR,
      rewardsAPY: baseFapy.rewardsAPY,
      cvxAPR: baseFapy.cvxAPR,
      keepCRV: baseFapy.keepCRV,
    })
  })

  it('falls back to netAPR when netAPY is undefined', async () => {
    vi.spyOn(strategyQueries, 'getVaultStrategies').mockResolvedValueOnce({ vault: baseVault, strategies: [baseStrategy] } as any)
    vi.spyOn(fapyIndex, 'computeChainAPY').mockResolvedValueOnce({ ...baseFapy, netAPY: undefined })

    const res = await fapyIndex.computeChainAPY(chainId, vaultAddress)
    expect(res?.netAPY).toBe(baseFapy.netAPR)
  })

  it('propagates thrown errors as null', async () => {
    vi.spyOn(strategyQueries, 'getVaultStrategies').mockRejectedValueOnce(new Error('network'))

    const res = await fapyIndex.computeChainAPY(chainId, vaultAddress)
    expect(res).toBeNull()
  })
})
