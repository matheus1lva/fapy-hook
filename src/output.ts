import { KongWebhook, Output, OutputSchema } from './types/schemas';
import { computeVaultFapy } from './';

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
] as const;

export async function computeFapy(hook: KongWebhook): Promise<Output[] | null> {
  const res = await computeVaultFapy(hook.chainId, hook.address);

  if (res) {
    const outputs: Output[] = COMPONENTS.map((component) =>
      OutputSchema.parse({
        chainId: hook.chainId,
        address: hook.address,
        label: 'crv-estimated-apr',
        component,
        value: res[component as keyof typeof res] ?? 0,
        blockNumber: hook.blockNumber,
        blockTime: hook.blockTime,
      }),
    );
    return OutputSchema.array().parse(outputs);
  }
  return null;
}
