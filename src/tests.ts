import dotenv from 'dotenv';

dotenv.config({ path: '../.env' })

import { computeVaultFapy } from "./fapy";

async function main() {
    const result = await computeVaultFapy(1, "0xf165a634296800812B8B0607a75DeDdcD4D3cC88")
    console.log("result", result)
}

main()