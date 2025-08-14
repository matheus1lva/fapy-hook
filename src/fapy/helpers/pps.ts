import { rpcs } from '../../utils/rpcs'
import { YEARN_VAULT_ABI_04 } from '../abis/0xAbis.abi'
import { Float } from './bignumber-float'
import { BigNumberInt, toNormalizedAmount } from './bignumber-int'

export async function fetchPPSToday({ chainId, vaultAddress, decimals }: { chainId: number, vaultAddress: string, decimals: number }) {
  const pps = await rpcs.next(chainId).readContract({
    address: vaultAddress as `0x${string}`,
    abi: YEARN_VAULT_ABI_04,
    functionName: 'pricePerShare',
  })

  return toNormalizedAmount(new BigNumberInt(pps as bigint), decimals)
}

export function fetchPPSLastWeek(vaultAddress: string): Float {
  // TODO: Implement this function
  return new Float(0)
}

export function fetchPPSLastMonth(vaultAddress: string): Float {
  // TODO: Implement this function
  return new Float(0)
}

export function calculateAPY(ppsToday: Float, ppsYesterday: Float, days: number): Float {
  if (ppsYesterday.isZero()) return new Float(0)

  const apr = new Float().sub(ppsToday, ppsYesterday)
  const result = new Float().div(apr, ppsYesterday)

  if (days === 0) return new Float(0)

  const dailyAPR = new Float().div(result, new Float(days))
  const yearlyAPR = new Float().mul(dailyAPR, new Float(365))

  return yearlyAPR
}
