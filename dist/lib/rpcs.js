import { createPublicClient, http } from 'viem';
function getRpcUrl(chainId) {
    const envKey = `RPC_FULL_NODE_${chainId}`;
    const url = process.env[envKey];
    if (!url)
        throw new Error(`Missing ${envKey}`);
    return url;
}
export const rpcs = {
    next(chainId) {
        const client = createPublicClient({ transport: http(getRpcUrl(chainId)) });
        return {
            readContract: client.readContract.bind(client),
            multicall: client.multicall.bind(client),
        };
    },
};
