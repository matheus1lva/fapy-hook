import { Strategy } from '../fapy/types/strategies';

export function isV3Vault(vault: Strategy): boolean {
  const versionMajor = vault.apiVersion?.split('.')[0]
  return versionMajor === '3' || versionMajor === '~3';
}
