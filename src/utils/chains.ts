import * as chains from 'viem/chains';

export function getChainByChainId(chainId: number): chains.Chain | undefined {
  return Object.values(chains).find((chain) => chain.id === chainId);
}
