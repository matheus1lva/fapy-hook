import { KongClient } from './clients/kongClient';

export async function fetchErc20PriceUsd(
  chainId: number,
  address: `0x${string}`,
  _unused?: unknown,
  _force?: boolean,
): Promise<{ priceUsd: number }> {
  try {
    const kong = new KongClient();
    const prices = await kong.getPrices({ chainId, address });
    const latest = prices?.[0]?.priceUsd ?? 0;
    return { priceUsd: Number(latest) };
  } catch {
    return { priceUsd: 0 };
  }
}
