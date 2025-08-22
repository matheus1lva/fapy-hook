"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchErc20PriceUsd = exports.convertFloatAPRToAPY = exports.CVX_BOOSTER_ADDRESS = exports.CVX_TOKEN_ADDRESS = exports.CRV_TOKEN_ADDRESS = exports.YEARN_VOTER_ADDRESS = void 0;
exports.isCurveStrategy = isCurveStrategy;
exports.isConvexStrategy = isConvexStrategy;
exports.isFraxStrategy = isFraxStrategy;
exports.isPrismaStrategy = isPrismaStrategy;
exports.findGaugeForVault = findGaugeForVault;
exports.findPoolForVault = findPoolForVault;
exports.findFraxPoolForVault = findFraxPoolForVault;
exports.findSubgraphItemForVault = findSubgraphItemForVault;
exports.getPoolWeeklyAPY = getPoolWeeklyAPY;
exports.getPoolDailyAPY = getPoolDailyAPY;
exports.getPoolPrice = getPoolPrice;
exports.getRewardsAPY = getRewardsAPY;
exports.getCVXPoolAPY = getCVXPoolAPY;
exports.getStrategyContractAbi = getStrategyContractAbi;
exports.determineCurveKeepCRV = determineCurveKeepCRV;
exports.getConvexRewardAPY = getConvexRewardAPY;
const prices_1 = require("../utils/prices");
Object.defineProperty(exports, "fetchErc20PriceUsd", { enumerable: true, get: function () { return prices_1.fetchErc20PriceUsd; } });
const abis_1 = require("./abis");
const helpers_1 = require("../helpers");
Object.defineProperty(exports, "convertFloatAPRToAPY", { enumerable: true, get: function () { return helpers_1.convertFloatAPRToAPY; } });
Object.defineProperty(exports, "CRV_TOKEN_ADDRESS", { enumerable: true, get: function () { return helpers_1.CRV_TOKEN_ADDRESS; } });
Object.defineProperty(exports, "CVX_BOOSTER_ADDRESS", { enumerable: true, get: function () { return helpers_1.CVX_BOOSTER_ADDRESS; } });
Object.defineProperty(exports, "CVX_TOKEN_ADDRESS", { enumerable: true, get: function () { return helpers_1.CVX_TOKEN_ADDRESS; } });
Object.defineProperty(exports, "YEARN_VOTER_ADDRESS", { enumerable: true, get: function () { return helpers_1.YEARN_VOTER_ADDRESS; } });
const rpcs_1 = require("../utils/rpcs");
const bignumber_float_1 = require("../helpers/bignumber-float");
const bignumber_int_1 = require("../helpers/bignumber-int");
const _0xAbis_abi_1 = require("../abis/0xAbis.abi");
function isCurveStrategy(vault) {
    const vaultName = vault?.name.toLowerCase();
    return ((vaultName?.includes('curve') || vaultName?.includes('convex') || vaultName?.includes('crv')) &&
        !vaultName?.includes('ajna-'));
}
function isConvexStrategy(strategy) {
    const strategyName = strategy.name?.toLowerCase();
    return strategyName?.includes('convex') && !strategyName?.includes('curve');
}
function isFraxStrategy(strategy) {
    const vaultName = strategy?.name?.toLowerCase();
    return vaultName?.includes('frax');
}
function isPrismaStrategy(strategy) {
    const vaultName = strategy?.name?.toLowerCase();
    return vaultName?.includes('prisma');
}
function findGaugeForVault(assetAddress, gauges) {
    return gauges.find((gauge) => {
        if (gauge.swap_token?.toLowerCase() === assetAddress.toLowerCase()) {
            return true;
        }
        if (gauge.swap?.toLowerCase() === assetAddress.toLowerCase()) {
            return true;
        }
        return false;
    });
}
function findPoolForVault(assetAddress, pools) {
    return pools.find((pool) => {
        return pool.lpTokenAddress?.toLowerCase() === assetAddress.toLowerCase();
    });
}
function findFraxPoolForVault(assetAddress, fraxPools) {
    return fraxPools.find((pool) => {
        return pool.underlyingTokenAddress.toLowerCase() === assetAddress.toLowerCase();
    });
}
function findSubgraphItemForVault(swapAddress, subgraphData) {
    return subgraphData.find(item => item.address && item.address.toLowerCase() === swapAddress?.toLowerCase());
}
function getPoolWeeklyAPY(subgraphItem) {
    const result = new bignumber_float_1.Float(0);
    return result.div(new bignumber_float_1.Float(subgraphItem?.latestWeeklyApy || 0), new bignumber_float_1.Float(100));
}
function getPoolDailyAPY(subgraphItem) {
    const result = new bignumber_float_1.Float(0);
    return result.div(new bignumber_float_1.Float(subgraphItem?.latestDailyApy || 0), new bignumber_float_1.Float(100));
}
function getPoolPrice(gauge) {
    let virtualPrice = new bignumber_int_1.BigNumberInt(0);
    if (gauge.swap_data?.virtual_price) {
        virtualPrice = new bignumber_int_1.BigNumberInt(gauge.swap_data.virtual_price);
    }
    return (0, bignumber_int_1.toNormalizedAmount)(virtualPrice, 18);
}
function getRewardsAPY(chainId, pool) {
    let totalRewardAPR = new bignumber_float_1.Float(0);
    if (!pool.gaugeRewards || pool.gaugeRewards.length === 0) {
        return totalRewardAPR;
    }
    for (const reward of pool.gaugeRewards) {
        const rewardAPR = new bignumber_float_1.Float().div(new bignumber_float_1.Float(reward.APY), new bignumber_float_1.Float(100));
        totalRewardAPR = new bignumber_float_1.Float().add(totalRewardAPR, rewardAPR);
    }
    return totalRewardAPR;
}
async function getCVXPoolAPY(chainId, strategyAddress, baseAssetPrice) {
    const client = rpcs_1.rpcs.next(chainId);
    let crvAPR = new bignumber_float_1.Float(0);
    let cvxAPR = new bignumber_float_1.Float(0);
    let crvAPY = new bignumber_float_1.Float(0);
    let cvxAPY = new bignumber_float_1.Float(0);
    try {
        let rewardPID;
        try {
            rewardPID = await client.readContract({
                address: strategyAddress,
                abi: abis_1.convexBaseStrategyAbi,
                functionName: 'PID',
            });
        }
        catch (error) {
            try {
                rewardPID = await client.readContract({
                    address: strategyAddress,
                    abi: abis_1.convexBaseStrategyAbi,
                    functionName: 'ID',
                });
            }
            catch (innerError) {
                try {
                    rewardPID = await client.readContract({
                        address: strategyAddress,
                        abi: abis_1.convexBaseStrategyAbi,
                        functionName: 'fraxPid',
                    });
                }
                catch (deepError) {
                    return { crvAPR, cvxAPR, crvAPY, cvxAPY };
                }
            }
        }
        let poolInfo;
        try {
            poolInfo = await client.readContract({
                address: helpers_1.CVX_BOOSTER_ADDRESS[chainId],
                abi: abis_1.cvxBoosterAbi,
                functionName: 'poolInfo',
                args: [rewardPID],
            });
        }
        catch (error) {
            return { crvAPR, cvxAPR, crvAPY, cvxAPY };
        }
        const [rateResult, totalSupply] = await Promise.all([
            client.readContract({
                address: poolInfo.crvRewards,
                abi: abis_1.crvRewardsAbi,
                functionName: 'rewardRate',
                args: []
            }),
            client.readContract({
                address: poolInfo.crvRewards,
                abi: abis_1.crvRewardsAbi,
                functionName: 'totalSupply',
                args: []
            })
        ]);
        const rate = (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt(rateResult), 18);
        const supply = (0, bignumber_int_1.toNormalizedAmount)(new bignumber_int_1.BigNumberInt(totalSupply), 18);
        let crvPerUnderlying = new bignumber_float_1.Float(0);
        const virtualSupply = new bignumber_float_1.Float(0).mul(supply, baseAssetPrice);
        if (virtualSupply.gt(new bignumber_float_1.Float(0))) {
            crvPerUnderlying = new bignumber_float_1.Float(0).div(rate, virtualSupply);
        }
        const crvPerUnderlyingPerYear = new bignumber_float_1.Float(0).mul(crvPerUnderlying, new bignumber_float_1.Float(31536000));
        const cvxPerYear = await (0, helpers_1.getCVXForCRV)(chainId, BigInt(crvPerUnderlyingPerYear.toNumber()));
        const [{ priceUsd: crvPrice }, { priceUsd: cvxPrice }] = await Promise.all([
            (0, prices_1.fetchErc20PriceUsd)(chainId, helpers_1.CRV_TOKEN_ADDRESS[chainId], undefined, true),
            (0, prices_1.fetchErc20PriceUsd)(chainId, helpers_1.CVX_TOKEN_ADDRESS[chainId], undefined, true)
        ]);
        crvAPR = new bignumber_float_1.Float(0).mul(crvPerUnderlyingPerYear, new bignumber_float_1.Float(crvPrice));
        cvxAPR = new bignumber_float_1.Float(0).mul(cvxPerYear, new bignumber_float_1.Float(cvxPrice));
        const [crvAPRFloat64] = crvAPR.toFloat64();
        const [cvxAPRFloat64] = cvxAPR.toFloat64();
        crvAPY = new bignumber_float_1.Float().setFloat64((0, helpers_1.convertFloatAPRToAPY)(crvAPRFloat64, 365 / 15));
        cvxAPY = new bignumber_float_1.Float().setFloat64((0, helpers_1.convertFloatAPRToAPY)(cvxAPRFloat64, 365 / 15));
    }
    catch (error) {
        // Error handled silently
    }
    return {
        crvAPR,
        cvxAPR,
        crvAPY,
        cvxAPY
    };
}
function getStrategyContractAbi(strategy) {
    if (strategy.apiVersion === '0.2.2') {
        return _0xAbis_abi_1.YEARN_VAULT_V022_ABI;
    }
    if (strategy.apiVersion === '0.3.0' || strategy.apiVersion === '0.3.1') {
        return _0xAbis_abi_1.YEARN_VAULT_V030_ABI;
    }
    return _0xAbis_abi_1.YEARN_VAULT_ABI_04;
}
async function determineCurveKeepCRV(strategy, chainId) {
    let keepPercentage = BigInt(0);
    let keepCRV = BigInt(0);
    try {
        const [keepCRVResult, keepPercentageResult] = await Promise.all([
            rpcs_1.rpcs.next(chainId).readContract({
                address: strategy.address,
                abi: getStrategyContractAbi(strategy),
                functionName: 'keepCRV',
            }),
            rpcs_1.rpcs.next(chainId).readContract({
                address: strategy.address,
                abi: getStrategyContractAbi(strategy),
                functionName: 'keepCRVPercentage',
            })
        ]);
        keepCRV = keepCRVResult;
        keepPercentage = keepPercentageResult;
    }
    catch (error) {
        return 0;
    }
    const keepValue = new bignumber_int_1.BigNumberInt(keepCRV).add(new bignumber_int_1.BigNumberInt(keepPercentage));
    return (0, bignumber_int_1.toNormalizedAmount)(keepValue, 4).toNumber();
}
async function getConvexRewardAPY(chainID, strategy, baseAssetPrice, poolPrice) {
    const client = rpcs_1.rpcs.next(chainID);
    let rewardPID;
    try {
        rewardPID = await client.readContract({
            address: strategy,
            abi: abis_1.convexBaseStrategyAbi,
            functionName: 'pid',
        });
    }
    catch (error) {
        try {
            rewardPID = await client.readContract({
                address: strategy,
                abi: abis_1.convexBaseStrategyAbi,
                functionName: 'id',
            });
        }
        catch (error) {
            try {
                rewardPID = await client.readContract({
                    address: strategy,
                    abi: abis_1.convexBaseStrategyAbi,
                    functionName: 'fraxPid',
                });
            }
            catch (error) {
                return { totalRewardsAPR: new bignumber_float_1.Float(0), totalRewardsAPY: new bignumber_float_1.Float(0) };
            }
        }
    }
    let poolInfo;
    try {
        poolInfo = await client.readContract({
            address: helpers_1.CVX_BOOSTER_ADDRESS[chainID],
            abi: abis_1.cvxBoosterAbi,
            functionName: 'poolInfo',
            args: [rewardPID],
        });
    }
    catch (error) {
        return { totalRewardsAPR: new bignumber_float_1.Float(0), totalRewardsAPY: new bignumber_float_1.Float(0) };
    }
    let rewardsLength;
    try {
        rewardsLength = await client.readContract({
            address: poolInfo.crvRewards,
            abi: abis_1.crvRewardsAbi,
            functionName: 'extraRewardsLength',
        });
    }
    catch (error) {
        return { totalRewardsAPR: new bignumber_float_1.Float(0), totalRewardsAPY: new bignumber_float_1.Float(0) };
    }
    const now = BigInt(Math.floor(Date.now() / 1000));
    let totalRewardsAPR = new bignumber_float_1.Float(0);
    if (rewardsLength > BigInt(0)) {
        for (let i = 0; i < Number(rewardsLength); i++) {
            try {
                const virtualRewardsPool = await client.readContract({
                    address: poolInfo.crvRewards,
                    abi: abis_1.crvRewardsAbi,
                    functionName: 'extraRewards',
                    args: [BigInt(i)],
                });
                const [periodFinish, rewardToken, rewardRateInt, totalSupplyInt] = await Promise.all([
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: abis_1.crvRewardsAbi,
                        functionName: 'periodFinish',
                    }),
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: abis_1.crvRewardsAbi,
                        functionName: 'rewardToken',
                    }),
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: abis_1.crvRewardsAbi,
                        functionName: 'rewardRate',
                    }),
                    client.readContract({
                        address: virtualRewardsPool,
                        abi: abis_1.crvRewardsAbi,
                        functionName: 'totalSupply',
                    })
                ]);
                if (periodFinish < now) {
                    continue;
                }
                const { priceUsd: rewardTokenPrice } = await (0, prices_1.fetchErc20PriceUsd)(chainID, rewardToken, undefined, true);
                if (!rewardTokenPrice) {
                    continue;
                }
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
            catch (error) {
                continue;
            }
        }
    }
    const [totalRewardsAPRFloat64] = totalRewardsAPR.toFloat64();
    const totalRewardsAPY = new bignumber_float_1.Float((0, helpers_1.convertFloatAPRToAPY)(totalRewardsAPRFloat64, 365 / 15));
    return {
        totalRewardsAPR: totalRewardsAPR,
        totalRewardsAPY: totalRewardsAPY
    };
}
