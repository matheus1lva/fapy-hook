"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPPSToday = fetchPPSToday;
exports.fetchPPSLastWeek = fetchPPSLastWeek;
exports.fetchPPSLastMonth = fetchPPSLastMonth;
exports.calculateAPY = calculateAPY;
const rpcs_1 = require("../../utils/rpcs");
const _0xAbis_abi_1 = require("../abis/0xAbis.abi");
const bignumber_float_1 = require("./bignumber-float");
const bignumber_int_1 = require("./bignumber-int");
async function fetchPPSToday({ chainId, vaultAddress, decimals }) {
    const pps = await rpcs_1.rpcs.next(chainId).readContract({
        address: vaultAddress,
        abi: _0xAbis_abi_1.YEARN_VAULT_ABI_04,
        functionName: 'pricePerShare',
    });
    return (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt(pps), decimals);
}
function fetchPPSLastWeek(vaultAddress) {
    // TODO: Implement this function
    return new bignumber_float_1.Float(0);
}
function fetchPPSLastMonth(vaultAddress) {
    // TODO: Implement this function
    return new bignumber_float_1.Float(0);
}
function calculateAPY(ppsToday, ppsYesterday, days) {
    if (ppsYesterday.isZero())
        return new bignumber_float_1.Float(0);
    const apr = new bignumber_float_1.Float().sub(ppsToday, ppsYesterday);
    const result = new bignumber_float_1.Float().div(apr, ppsYesterday);
    if (days === 0)
        return new bignumber_float_1.Float(0);
    const dailyAPR = new bignumber_float_1.Float().div(result, new bignumber_float_1.Float(days));
    const yearlyAPR = new bignumber_float_1.Float().mul(dailyAPR, new bignumber_float_1.Float(365));
    return yearlyAPR;
}
