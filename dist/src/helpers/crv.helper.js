"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineConvexKeepCRV = exports.getCurveBoost = void 0;
const convex_base_strategy_abi_1 = require("../abis/convex-base-strategy.abi");
const crv_gauge_abi_1 = require("../abis/crv-gauge.abi");
const strategy_base_abi_1 = require("../abis/strategy-base.abi");
const viem_1 = require("viem");
const bignumber_float_1 = require("./bignumber-float");
const bignumber_int_1 = require("./bignumber-int");
const getCurveBoost = async (chainID, voter, gauge) => {
    const client = (0, viem_1.createPublicClient)({ transport: (0, viem_1.http)(process.env[`RPC_FULL_NODE_${chainID}`]) });
    const [{ result: workingBalance }, { result: balanceOf }] = await client.multicall({
        contracts: [
            {
                address: gauge,
                abi: crv_gauge_abi_1.curveGaugeAbi,
                functionName: 'working_balances',
                args: [voter],
            },
            { address: gauge, abi: crv_gauge_abi_1.curveGaugeAbi, functionName: 'balanceOf', args: [voter] },
        ],
    });
    if (balanceOf && BigInt(balanceOf ?? '0') <= 0n) {
        if (chainID === 1)
            return new bignumber_float_1.Float(2.5);
        return new bignumber_float_1.Float(1);
    }
    const boost = new bignumber_float_1.Float().div((0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt().set(workingBalance ?? 0n), 18), new bignumber_float_1.Float().mul(new bignumber_float_1.Float(0.4), (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt().set(balanceOf ?? 0n), 18)));
    return boost;
};
exports.getCurveBoost = getCurveBoost;
const determineConvexKeepCRV = async (chainID, strategy) => {
    const client = (0, viem_1.createPublicClient)({ transport: (0, viem_1.http)(process.env[`RPC_FULL_NODE_${chainID}`]) });
    try {
        const uselLocalCRV = await client.readContract({
            address: strategy.address,
            abi: convex_base_strategy_abi_1.convexBaseStrategyAbi,
            functionName: 'uselLocalCRV',
            args: [],
        });
        if (uselLocalCRV) {
            const [keepCVX, localKeepCRV] = await Promise.allSettled([
                client.readContract({
                    address: strategy.address,
                    abi: convex_base_strategy_abi_1.convexBaseStrategyAbi,
                    functionName: 'keepCVX',
                    args: [],
                }),
                client.readContract({
                    address: strategy.address,
                    abi: convex_base_strategy_abi_1.convexBaseStrategyAbi,
                    functionName: 'localKeepCRV',
                    args: [],
                }),
            ]);
            if (keepCVX.status === 'fulfilled')
                return (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt().set(keepCVX.value), 4);
            if (localKeepCRV.status === 'fulfilled')
                return (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt().set(localKeepCRV.value), 4);
            return (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt().set(0n), 4);
        }
        const curveGlobal = (await client.readContract({
            address: strategy.address,
            abi: convex_base_strategy_abi_1.convexBaseStrategyAbi,
            functionName: 'curveGlobal',
            args: [],
        }));
        if (!curveGlobal)
            return new bignumber_float_1.Float(0);
        try {
            const keepCRV = (await client.readContract({
                address: curveGlobal,
                abi: strategy_base_abi_1.strategyBaseAbi,
                functionName: 'keepCRV',
                args: [],
            }));
            return (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt().set(keepCRV), 4);
        }
        catch {
            return (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt().set(0n), 4);
        }
    }
    catch {
        return (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt().set(0n), 4);
    }
};
exports.determineConvexKeepCRV = determineConvexKeepCRV;
