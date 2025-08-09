import * as chains from 'viem/chains';
export function getChainByChainId(chainId) {
    return Object.values(chains).find((chain) => chain.id === chainId);
}
