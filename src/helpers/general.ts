import { Thing } from '../types';

export function isV3Vault(vault: Thing): boolean {
  const versionMajor = (vault as any).defaults?.apiVersion?.split?.('.')?.[0];
  return versionMajor === '3' || versionMajor === '~3';
}
