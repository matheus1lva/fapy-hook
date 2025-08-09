import { BigNumber } from '@ethersproject/bignumber';
import { BigNumberInt } from './bignumber-int';
import BigDecimal from 'js-big-decimal';

export class Float {
  private value: BigDecimal;

  constructor(defaultValue?: number | string | BigNumber | BigDecimal) {
    if (defaultValue === undefined || defaultValue === null) {
      this.value = new BigDecimal('0');
    } else if (defaultValue instanceof BigDecimal) {
      this.value = defaultValue;
    } else if (defaultValue instanceof BigNumber) {
      this.value = new BigDecimal(defaultValue.toString());
    } else if (typeof defaultValue === 'string') {
      if (defaultValue === '' || defaultValue === '""') {
        this.value = new BigDecimal('0');
      } else {
        try {
          this.value = new BigDecimal(defaultValue);
        } catch (e) {
          this.value = new BigDecimal('0');
        }
      }
    } else {
      try {
        this.value = new BigDecimal(defaultValue.toString());
      } catch (e) {
        this.value = new BigDecimal('0');
      }
    }
  }

  toBigNumber(): BigNumber {
    const valueStr = this.value.getValue();
    if (valueStr.includes('.')) {
      const intValue = valueStr.replace('.', '');
      return BigNumber.from(intValue);
    }
    return BigNumber.from(valueStr);
  }

  static from(value?: Float | BigDecimal | BigNumber | number | string): Float {
    if (value instanceof Float) {
      return new Float(value.value);
    }
    return new Float(value);
  }

  clone(source: Float | null | undefined): Float {
    if (!source) return this;
    this.value = source.value;
    return this;
  }

  set(value: BigDecimal | BigNumber | null | undefined): Float {
    if (!value) return this;
    if (value instanceof BigNumber) {
      this.value = new BigDecimal(value.toString());
    } else {
      this.value = value as BigDecimal;
    }
    return this;
  }

  setString(value: string): Float {
    if (value === '' || value === '""') {
      this.value = new BigDecimal('0');
      return this;
    }

    try {
      this.value = new BigDecimal(value);
    } catch (e) {}
    return this;
  }

  setNumber(value: number): Float {
    this.value = new BigDecimal(value.toString());
    return this;
  }

  setInt(value: BigNumberInt): Float {
    this.value = new BigDecimal(value.toString());
    return this;
  }

  setUint64(value: number): Float {
    this.value = new BigDecimal(value.toString());
    return this;
  }

  setFloat64(x: number): Float {
    if (isNaN(x)) {
      throw new Error('Float.setFloat64(NaN): Cannot set NaN value');
    }
    this.value = new BigDecimal(x.toString());
    return this;
  }

  add(x: Float | null | undefined, y: Float | null | undefined): Float {
    const xValue = (x as any)?.value || new BigDecimal('0');
    const yValue = (y as any)?.value || new BigDecimal('0');
    this.value = xValue.add(yValue);
    return this;
  }

  sub(x: Float | null | undefined, y: Float | null | undefined): Float {
    const xValue = (x as any)?.value || new BigDecimal('0');
    const yValue = (y as any)?.value || new BigDecimal('0');
    this.value = xValue.subtract(yValue);
    return this;
  }

  mul(x: Float | null | undefined, y: Float | null | undefined): Float {
    const xValue = (x as any)?.value || new BigDecimal('0');
    const yValue = (y as any)?.value || new BigDecimal('0');
    this.value = xValue.multiply(yValue);
    return this;
  }

  div(x: Float | null | undefined, y: Float | null | undefined): Float {
    const xValue = (x as any)?.value || new BigDecimal('0');
    const yValue = (y as any)?.value || new BigDecimal('0');

    if (yValue.getValue() === '0') {
      this.value = new BigDecimal('0');
      return this;
    }

    this.value = xValue.divide(yValue, 20);
    return this;
  }

  quo = this.div;

  static pow(x: Float, y: number): Float {
    if (y === 0) return new Float(1);

    const base = (x as any).value as BigDecimal;
    let result = new BigDecimal('1');

    for (let i = 0; i < y; i++) {
      result = result.multiply(base);
    }

    return new Float(result);
  }

  pow(y: number): Float {
    if (y === 0) return new Float(1);

    let result = new BigDecimal('1');
    const base = (this as any).value as BigDecimal;

    for (let i = 0; i < y; i++) {
      result = result.multiply(base);
    }

    return new Float(result);
  }

  toString(): string {
    return this.value.getValue();
  }

  isZero(): boolean {
    return this.value.getValue() === '0';
  }

  gt(x: Float | null | undefined): boolean {
    const xValue = (x as any)?.value || new BigDecimal('0');
    return this.value.compareTo(xValue) > 0;
  }

  gte(x: Float | null | undefined): boolean {
    const xValue = (x as any)?.value || new BigDecimal('0');
    return this.value.compareTo(xValue) >= 0;
  }

  lt(x: Float | null | undefined): boolean {
    const xValue = (x as any)?.value || new BigDecimal('0');
    return this.value.compareTo(xValue) < 0;
  }

  lte(x: Float | null | undefined): boolean {
    const xValue = (x as any)?.value || new BigDecimal('0');
    return this.value.compareTo(xValue) <= 0;
  }

  eq(x: Float | null | undefined): boolean {
    const xValue = (x as any)?.value || new BigDecimal('0');
    return this.value.compareTo(xValue) === 0;
  }

  neq(x: Float | null | undefined): boolean {
    const xValue = (x as any)?.value || new BigDecimal('0');
    return this.value.compareTo(xValue) !== 0;
  }

  not(x: Float | null | undefined): boolean {
    return this.neq(x);
  }

  static safe(value: Float | null | undefined, defaultValue?: Float): Float {
    if (!value) {
      return defaultValue || new Float(0);
    }
    return value;
  }

  safe(value: Float | null | undefined, defaultValue?: Float): Float {
    if (!value) {
      return defaultValue || new Float(0);
    }
    return value;
  }

  toJSON(): string {
    return this.value.getValue();
  }

  toNumber(): number {
    try {
      return parseFloat(this.value.getValue());
    } catch {
      return 0;
    }
  }

  toInt(): BigNumber {
    const intPart = this.value.getValue().split('.')[0] || '0';
    return BigNumber.from(intPart);
  }

  abs(): Float {
    return new Float(this.value.abs());
  }
  neg(): Float {
    return new Float(this.value.multiply(new BigDecimal('-1')));
  }

  mod(x: Float | null | undefined, y: Float | null | undefined): Float {
    const xValue = (x as any)?.value || new BigDecimal('0');
    const yValue = (y as any)?.value || new BigDecimal('0');

    if (yValue.getValue() === '0') {
      this.value = new BigDecimal('0');
      return this;
    }

    const quotient = xValue.divide(yValue, 0);
    const product = quotient.multiply(yValue);
    this.value = xValue.subtract(product);
    return this;
  }

  isInt(): boolean {
    const valueStr = this.value.getValue();
    return !valueStr.includes('.') || valueStr.endsWith('.0');
  }

  isInf(): boolean {
    return false;
  }

  format(decimals: number): string {
    if (decimals <= 0) return this.value.round(0).getValue();
    return this.value.round(decimals).getValue();
  }

  cmp(x: Float | null | undefined): number {
    const xValue = (x as any)?.value || new BigDecimal('0');
    return this.value.compareTo(xValue);
  }

  isNegative(): boolean {
    return this.value.compareTo(new BigDecimal('0')) < 0;
  }
  isPositive(): boolean {
    return this.value.compareTo(new BigDecimal('0')) > 0;
  }

  sign(): number {
    const cmp = this.value.compareTo(new BigDecimal('0'));
    return cmp === 0 ? 0 : cmp < 0 ? -1 : 1;
  }

  min(x: Float | null | undefined, y: Float | null | undefined): Float {
    const xValue = (x as any)?.value || new BigDecimal('0');
    const yValue = (y as any)?.value || new BigDecimal('0');

    this.value = xValue.compareTo(yValue) < 0 ? xValue : yValue;
    return this;
  }

  max(x: Float | null | undefined, y: Float | null | undefined): Float {
    const xValue = (x as any)?.value || new BigDecimal('0');
    const yValue = (y as any)?.value || new BigDecimal('0');

    this.value = xValue.compareTo(yValue) > 0 ? xValue : yValue;
    return this;
  }

  toFloat64(): [number, string] {
    if (this.isZero()) {
      return [0, 'exact'];
    }

    const num = parseFloat(this.value.getValue());

    if (Math.abs(num) <= Number.MAX_SAFE_INTEGER) {
      const reconstructed = new Float(num);
      if (this.eq(reconstructed)) {
        return [num, 'exact'];
      }

      const diff = new Float((this.value as any).subtract(reconstructed.value));
      if (diff.isZero()) {
        return [num, 'exact'];
      } else if (diff.isPositive()) {
        return [num, 'below'];
      } else {
        return [num, 'above'];
      }
    }

    return [num, this.isNegative() ? 'above' : 'below'];
  }
}
