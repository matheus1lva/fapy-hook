"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConvexRewardAPY = exports.getCVXForCRV = void 0;
const erc20_abi_1 = require("../abis/erc20.abi");
const prices_1 = require("../utils/prices");
const calculation_helper_1 = require("./calculation.helper");
const maps_helper_1 = require("./maps.helper");
const convex_base_strategy_abi_1 = require("../abis/convex-base-strategy.abi");
const cvx_booster_abi_1 = require("../abis/cvx-booster.abi");
const crv_rewards_abi_1 = require("../abis/crv-rewards.abi");
const bignumber_float_1 = require("./bignumber-float");
const bignumber_int_1 = require("./bignumber-int");
const viem_1 = require("viem");
const getCVXForCRV = async (chainID, crvEarned) => {
    const client = (0, viem_1.createPublicClient)({ transport: (0, viem_1.http)(process.env[`RPC_FULL_NODE_${chainID}`]) });
    const cliffSize = new bignumber_float_1.Float(0).setString('100000000000000000000000');
    const cliffCount = new bignumber_float_1.Float(0).setString('1000');
    const maxSupply = new bignumber_float_1.Float(0).setString('100000000000000000000000000');
    try {
        const cvxTotalSupplyInt = (await client.readContract({
            address: maps_helper_1.CVX_TOKEN_ADDRESS[chainID],
            abi: erc20_abi_1.erc20Abi,
            functionName: 'totalSupply',
            args: [],
        }));
        const cvxTotalSupply = new bignumber_float_1.Float(0).setInt(new bignumber_int_1.BigNumberInt(cvxTotalSupplyInt));
        const crvEarnedFloat = new bignumber_float_1.Float(0).setInt(new bignumber_int_1.BigNumberInt(crvEarned));
        const currentCliff = new bignumber_float_1.Float(0).div(cvxTotalSupply, cliffSize);
        if (currentCliff.gte(cliffCount)) {
            return new bignumber_float_1.Float(0);
        }
        const remaining = new bignumber_float_1.Float(0).sub(cliffCount, currentCliff);
        let cvxEarned = new bignumber_float_1.Float(0).mul(crvEarnedFloat, remaining);
        cvxEarned = new bignumber_float_1.Float(0).div(cvxEarned, cliffCount);
        const amountTillMax = new bignumber_float_1.Float(0).sub(maxSupply, cvxTotalSupply);
        if (cvxEarned.gt(amountTillMax)) {
            cvxEarned = amountTillMax;
        }
        return cvxEarned;
    }
    catch {
        return new bignumber_float_1.Float(0);
    }
};
exports.getCVXForCRV = getCVXForCRV;
const getConvexRewardAPY = async (chainID, strategy, baseAssetPrice, poolPrice) => {
    const client = (0, viem_1.createPublicClient)({ transport: (0, viem_1.http)(process.env[`RPC_FULL_NODE_${chainID}`]) });
    let rewardPID;
    try {
        rewardPID = (await client.readContract({
            address: strategy,
            abi: convex_base_strategy_abi_1.convexBaseStrategyAbi,
            functionName: 'pid',
            args: [],
        }));
    }
    catch {
        try {
            rewardPID = (await client.readContract({
                address: strategy,
                abi: convex_base_strategy_abi_1.convexBaseStrategyAbi,
                functionName: 'id',
                args: [],
            }));
        }
        catch {
            try {
                rewardPID = (await client.readContract({
                    address: strategy,
                    abi: convex_base_strategy_abi_1.convexBaseStrategyAbi,
                    functionName: 'fraxPid',
                    args: [],
                }));
            }
            catch {
                return { totalRewardsAPR: new bignumber_float_1.Float(0), totalRewardsAPY: new bignumber_float_1.Float(0) };
            }
        }
    }
    let poolInfo;
    try {
        poolInfo = (await client.readContract({
            address: maps_helper_1.CVX_TOKEN_ADDRESS[chainID],
            abi: cvx_booster_abi_1.cvxBoosterAbi,
            functionName: 'poolInfo',
            args: [rewardPID],
        }));
    }
    catch {
        return { totalRewardsAPR: new bignumber_float_1.Float(0), totalRewardsAPY: new bignumber_float_1.Float(0) };
    }
    let rewardsLength;
    try {
        rewardsLength = (await client.readContract({
            address: poolInfo.crvRewards,
            abi: crv_rewards_abi_1.crvRewardsAbi,
            functionName: 'extraRewardsLength',
            args: [],
        }));
    }
    catch {
        return { totalRewardsAPR: new bignumber_float_1.Float(0), totalRewardsAPY: new bignumber_float_1.Float(0) };
    }
    const now = BigInt(Math.floor(Date.now() / 1000));
    let totalRewardsAPR = new bignumber_float_1.Float(0);
    if (rewardsLength > BigInt(0)) {
        for (let i = 0; i < Number(rewardsLength); i++) {
            try {
                const virtualRewardsPool = (await client.readContract({
                    address: poolInfo.crvRewards,
                    abi: crv_rewards_abi_1.crvRewardsAbi,
                    functionName: 'extraRewards',
                    args: [BigInt(i)],
                }));
                const [periodFinish, rewardToken, rewardRateInt, totalSupplyInt] = await Promise.all([
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: crv_rewards_abi_1.crvRewardsAbi,
                        functionName: 'periodFinish',
                        args: [],
                    }),
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: crv_rewards_abi_1.crvRewardsAbi,
                        functionName: 'rewardToken',
                        args: [],
                    }),
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: crv_rewards_abi_1.crvRewardsAbi,
                        functionName: 'rewardRate',
                        args: [],
                    }),
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: crv_rewards_abi_1.crvRewardsAbi,
                        functionName: 'totalSupply',
                        args: [],
                    }),
                ]);
                if (periodFinish < now)
                    continue;
                const { priceUsd: rewardTokenPrice } = await (0, prices_1.fetchErc20PriceUsd)(chainID, rewardToken, undefined, true);
                if (!rewardTokenPrice)
                    continue;
                const tokenPrice = new bignumber_float_1.Float(rewardTokenPrice);
                const rewardRate = (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt(rewardRateInt), 18);
                const totalSupply = (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt(totalSupplyInt), 18);
                const secondPerYear = new bignumber_float_1.Float(0).setFloat64(31556952);
                let rewardAPRTop = new bignumber_float_1.Float(0).mul(rewardRate, secondPerYear);
                rewardAPRTop = new bignumber_float_1.Float(0).mul(rewardAPRTop, tokenPrice);
                let rewardAPRBottom = new bignumber_float_1.Float(0).div(poolPrice, new bignumber_float_1.Float(1));
                rewardAPRBottom = new bignumber_float_1.Float(0).mul(rewardAPRBottom, baseAssetPrice);
                rewardAPRBottom = new bignumber_float_1.Float(0).mul(rewardAPRBottom, totalSupply);
                const rewardAPR = new bignumber_float_1.Float(0).div(rewardAPRTop, rewardAPRBottom);
                totalRewardsAPR = new bignumber_float_1.Float(0).add(totalRewardsAPR, rewardAPR);
            }
            catch { }
        }
    }
    const [totalRewardsAPRFloat64] = totalRewardsAPR.toFloat64();
    const totalRewardsAPY = new bignumber_float_1.Float((0, calculation_helper_1.convertFloatAPRToAPY)(totalRewardsAPRFloat64, 365 / 15));
    return { totalRewardsAPR: totalRewardsAPR, totalRewardsAPY };
};
exports.getConvexRewardAPY = getConvexRewardAPY;
