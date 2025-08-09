import { z } from 'zod';
export const AddressSchema = z.custom((val) => typeof val === 'string' && /^0x[0-9a-fA-F]{40}$/.test(val), 'invalid evm address');
export const WebhookSubscriptionSchema = z.object({
    id: z.string(),
    url: z.string().url(),
    abiPath: z.string(),
    type: z.enum(['timeseries']),
    label: z.string(),
});
export const KongWebhookSchema = z.object({
    abiPath: z.string(),
    chainId: z.number(),
    address: AddressSchema,
    blockNumber: z.bigint({ coerce: true }),
    blockTime: z.bigint({ coerce: true }),
    subscription: WebhookSubscriptionSchema,
});
export const OutputSchema = z.object({
    chainId: z.number(),
    address: AddressSchema,
    label: z.string(),
    component: z.string().nullish(),
    value: z
        .any()
        .transform((val) => {
        const result = z.number().safeParse(val);
        if (result.success && isFinite(result.data))
            return result.data;
        return undefined;
    })
        .nullish(),
    blockNumber: z.bigint({ coerce: true }),
    blockTime: z.bigint({ coerce: true }),
});
