import dotenv from 'dotenv';

dotenv.config({ path: '../.env' })

import { computeVaultFapy } from "./";

async function main() {
    const result = await computeVaultFapy(1, "0x790a60024bC3aea28385b60480f15a0771f26D09")
    console.log("result", result)
}

main()