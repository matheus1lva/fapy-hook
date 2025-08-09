export function convertFloatAPRToAPY(apr, periodsPerYear) {
    const aprDecimal = apr / 100.0;
    const apy = Math.pow(1 + aprDecimal / periodsPerYear, periodsPerYear) - 1;
    return apy * 100;
}
