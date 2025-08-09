import { KongWebhook, Output, OutputSchema } from './types';
import { computeVaultFapy } from './fapy_impl';

const COMPONENTS = [
  'netAPR',
  'forwardBoost',
  'poolAPY',
  'boostedAPR',
  'baseAPR',
  'rewardsAPR',
  'cvxAPR',
  'keepCRV',
] as const;

export async function computeFapyOutputs(hook: KongWebhook): Promise<Output[]> {
  try {
    const res = await computeVaultFapy(hook.chainId, hook.address);
    if (res) {
      const outputs: Output[] = COMPONENTS.map((component) =>
        OutputSchema.parse({
          chainId: hook.chainId,
          address: hook.address,
          label: 'fapy',
          component,
          value: res[component as keyof typeof res] ?? 0,
          blockNumber: hook.blockNumber,
          blockTime: hook.blockTime,
        }),
      );
      return OutputSchema.array().parse(outputs);
    }
  } catch {}

  // Fallback zeros
  const outputs: Output[] = COMPONENTS.map((component) =>
    OutputSchema.parse({
      chainId: hook.chainId,
      address: hook.address,
      label: 'fapy',
      component,
      value: 0,
      blockNumber: hook.blockNumber,
      blockTime: hook.blockTime,
    }),
  );
  return OutputSchema.array().parse(outputs);
}
