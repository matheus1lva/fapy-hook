"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpcs = void 0;
const viem_1 = require("viem");
function getRpcUrl(chainId) {
    const envKey = `RPC_FULL_NODE_${chainId}`;
    const url = process.env[envKey];
    if (!url)
        throw new Error(`Missing ${envKey}`);
    return url;
}
exports.rpcs = {
    next(chainId) {
        const client = (0, viem_1.createPublicClient)({ transport: (0, viem_1.http)(getRpcUrl(chainId)) });
        return {
            readContract: client.readContract.bind(client),
            multicall: client.multicall.bind(client),
        };
    },
};
