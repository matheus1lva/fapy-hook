import { KongClient } from './kongClient';
import { StrategyWithIndicators } from './types';

export async function getVaultWithStrategies(chainId: number, vaultAddress: `0x${string}`) {
  const kong = new KongClient();
  const vault = await kong.getVault(chainId, vaultAddress);
  const strategies = (
    await Promise.all(
      (vault?.strategies || []).map((s) => kong.getStrategy(chainId, s as `0x${string}`)),
    )
  )
    .filter((s) => s !== null)
    .map((strategy) => {
      return {
        ...strategy,
        ...vault,
        name: strategy.name,
        token: strategy.want,
        symbol: strategy.symbol,
        rewards: strategy.rewards,
        guardian: strategy.guardian,
        blockTime: 0,
        totalDebt: BigInt(strategy.totalDebt ?? 0),
        totalIdle: BigInt(strategy.totalIdle ?? 0),
        debtRatio: Number(strategy.debtRatio ?? 0),
        decimals: Number(vault?.decimals ?? 18),
        management: strategy.management,
        blockNumber: BigInt(vault?.activation ?? 0),
        totalAssets: BigInt(vault?.totalAssets ?? 0),
        totalSupply: BigInt(vault?.totalSupply ?? 0),
        depositLimit: BigInt(vault?.depositLimit ?? 0),
        lockedProfit: BigInt(vault?.lockedProfit ?? 0),
        managementFee: Number(vault?.managementFee ?? 0),
        pricePerShare: BigInt(vault?.pricePerShare ?? 0),
        expectedReturn: BigInt(vault?.expectedReturn ?? 0),
        performanceFee: Number(strategy?.performanceFee ?? 0),
        creditAvailable: BigInt(vault?.creditAvailable ?? 0),
        debtOutstanding: BigInt(vault?.debtOutstanding ?? 0),
        maxAvailableShares: BigInt(vault?.maxAvailableShares ?? 0),
        localKeepCRV: BigInt(strategy.localKeepCRV ?? 0),
        apiVersion: strategy.apiVersion,
        address: (strategy.address ?? vaultAddress) as `0x${string}`,
      } as unknown as StrategyWithIndicators;
    });

  if (!strategies && !vault) return null;

  return {
    vault,
    strategies,
  };
}
