"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFapy = computeFapy;
const types_1 = require("./types/types");
const fapy_1 = require("./fapy");
const COMPONENTS = [
    'netAPR',
    'netAPY',
    'forwardBoost',
    'poolAPY',
    'boostedAPR',
    'baseAPR',
    'rewardsAPR',
    'rewardsAPY',
    'cvxAPR',
    'keepCRV',
];
async function computeFapy(hook) {
    const res = await (0, fapy_1.computeVaultFapy)(hook.chainId, hook.address);
    if (res) {
        const outputs = COMPONENTS.map((component) => types_1.OutputSchema.parse({
            chainId: hook.chainId,
            address: hook.address,
            label: 'fapy',
            component,
            value: res[component] ?? 0,
            blockNumber: hook.blockNumber,
            blockTime: hook.blockTime,
        }));
        return types_1.OutputSchema.array().parse(outputs);
    }
    return null;
}
