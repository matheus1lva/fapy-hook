export function isV3Vault(vault) {
    const versionMajor = vault.defaults?.apiVersion?.split?.('.')?.[0];
    return versionMajor === '3' || versionMajor === '~3';
}
