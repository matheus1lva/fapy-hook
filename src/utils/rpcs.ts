import * as chains from 'viem/chains';

export const getChainFromChainId = (chainId: number) => {
  return Object.values(chains).find((chain) => chain.id === chainId);
};