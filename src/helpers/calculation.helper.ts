export function convertFloatAPRToAPY(apr: number, periodsPerYear: number): number {
  const aprDecimal = apr / 100.0;
  const apy = Math.pow(1 + aprDecimal / periodsPerYear, periodsPerYear) - 1;
  return apy * 100;
}
