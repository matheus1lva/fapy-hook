import { OutputSchema } from './types';
import { computeVaultFapy } from './fapy_impl';
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
export async function computeFapyOutputs(hook) {
    try {
        const res = await computeVaultFapy(hook.chainId, hook.address);
        if (res) {
            const outputs = COMPONENTS.map((component) => OutputSchema.parse({
                chainId: hook.chainId,
                address: hook.address,
                label: 'fapy',
                component,
                value: res[component] ?? 0,
                blockNumber: hook.blockNumber,
                blockTime: hook.blockTime,
            }));
            return OutputSchema.array().parse(outputs);
        }
    }
    catch { }
    // Fallback zeros
    const outputs = COMPONENTS.map((component) => OutputSchema.parse({
        chainId: hook.chainId,
        address: hook.address,
        label: 'fapy',
        component,
        value: 0,
        blockNumber: hook.blockNumber,
        blockTime: hook.blockTime,
    }));
    return OutputSchema.array().parse(outputs);
}
