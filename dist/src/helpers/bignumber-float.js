"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Float = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const js_big_decimal_1 = __importDefault(require("js-big-decimal"));
class Float {
    constructor(defaultValue) {
        this.quo = this.div;
        if (defaultValue === undefined || defaultValue === null) {
            this.value = new js_big_decimal_1.default('0');
        }
        else if (defaultValue instanceof js_big_decimal_1.default) {
            this.value = defaultValue;
        }
        else if (defaultValue instanceof bignumber_1.BigNumber) {
            this.value = new js_big_decimal_1.default(defaultValue.toString());
        }
        else if (typeof defaultValue === 'string') {
            if (defaultValue === '' || defaultValue === '""') {
                this.value = new js_big_decimal_1.default('0');
            }
            else {
                try {
                    this.value = new js_big_decimal_1.default(defaultValue);
                }
                catch (e) {
                    this.value = new js_big_decimal_1.default('0');
                }
            }
        }
        else {
            try {
                this.value = new js_big_decimal_1.default(defaultValue.toString());
            }
            catch (e) {
                this.value = new js_big_decimal_1.default('0');
            }
        }
    }
    toBigNumber() {
        const valueStr = this.value.getValue();
        if (valueStr.includes('.')) {
            const intValue = valueStr.replace('.', '');
            return bignumber_1.BigNumber.from(intValue);
        }
        return bignumber_1.BigNumber.from(valueStr);
    }
    static from(value) {
        if (value instanceof Float) {
            return new Float(value.value);
        }
        return new Float(value);
    }
    clone(source) {
        if (!source)
            return this;
        this.value = source.value;
        return this;
    }
    set(value) {
        if (!value)
            return this;
        if (value instanceof bignumber_1.BigNumber) {
            this.value = new js_big_decimal_1.default(value.toString());
        }
        else {
            this.value = value;
        }
        return this;
    }
    setString(value) {
        if (value === '' || value === '""') {
            this.value = new js_big_decimal_1.default('0');
            return this;
        }
        try {
            this.value = new js_big_decimal_1.default(value);
        }
        catch (e) { }
        return this;
    }
    setNumber(value) {
        this.value = new js_big_decimal_1.default(value.toString());
        return this;
    }
    setInt(value) {
        this.value = new js_big_decimal_1.default(value.toString());
        return this;
    }
    setUint64(value) {
        this.value = new js_big_decimal_1.default(value.toString());
        return this;
    }
    setFloat64(x) {
        if (isNaN(x)) {
            throw new Error('Float.setFloat64(NaN): Cannot set NaN value');
        }
        this.value = new js_big_decimal_1.default(x.toString());
        return this;
    }
    add(x, y) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        const yValue = y?.value || new js_big_decimal_1.default('0');
        this.value = xValue.add(yValue);
        return this;
    }
    sub(x, y) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        const yValue = y?.value || new js_big_decimal_1.default('0');
        this.value = xValue.subtract(yValue);
        return this;
    }
    mul(x, y) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        const yValue = y?.value || new js_big_decimal_1.default('0');
        this.value = xValue.multiply(yValue);
        return this;
    }
    div(x, y) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        const yValue = y?.value || new js_big_decimal_1.default('0');
        if (yValue.getValue() === '0') {
            this.value = new js_big_decimal_1.default('0');
            return this;
        }
        this.value = xValue.divide(yValue, 20);
        return this;
    }
    static pow(x, y) {
        if (y === 0)
            return new Float(1);
        const base = x.value;
        let result = new js_big_decimal_1.default('1');
        for (let i = 0; i < y; i++) {
            result = result.multiply(base);
        }
        return new Float(result);
    }
    pow(y) {
        if (y === 0)
            return new Float(1);
        let result = new js_big_decimal_1.default('1');
        const base = this.value;
        for (let i = 0; i < y; i++) {
            result = result.multiply(base);
        }
        return new Float(result);
    }
    toString() {
        return this.value.getValue();
    }
    isZero() {
        return this.value.getValue() === '0';
    }
    gt(x) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        return this.value.compareTo(xValue) > 0;
    }
    gte(x) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        return this.value.compareTo(xValue) >= 0;
    }
    lt(x) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        return this.value.compareTo(xValue) < 0;
    }
    lte(x) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        return this.value.compareTo(xValue) <= 0;
    }
    eq(x) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        return this.value.compareTo(xValue) === 0;
    }
    neq(x) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        return this.value.compareTo(xValue) !== 0;
    }
    not(x) {
        return this.neq(x);
    }
    static safe(value, defaultValue) {
        if (!value) {
            return defaultValue || new Float(0);
        }
        return value;
    }
    safe(value, defaultValue) {
        if (!value) {
            return defaultValue || new Float(0);
        }
        return value;
    }
    toJSON() {
        return this.value.getValue();
    }
    toNumber() {
        try {
            return parseFloat(this.value.getValue());
        }
        catch {
            return 0;
        }
    }
    toInt() {
        const intPart = this.value.getValue().split('.')[0] || '0';
        return bignumber_1.BigNumber.from(intPart);
    }
    abs() {
        return new Float(this.value.abs());
    }
    neg() {
        return new Float(this.value.multiply(new js_big_decimal_1.default('-1')));
    }
    mod(x, y) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        const yValue = y?.value || new js_big_decimal_1.default('0');
        if (yValue.getValue() === '0') {
            this.value = new js_big_decimal_1.default('0');
            return this;
        }
        const quotient = xValue.divide(yValue, 0);
        const product = quotient.multiply(yValue);
        this.value = xValue.subtract(product);
        return this;
    }
    isInt() {
        const valueStr = this.value.getValue();
        return !valueStr.includes('.') || valueStr.endsWith('.0');
    }
    isInf() {
        return false;
    }
    format(decimals) {
        if (decimals <= 0)
            return this.value.round(0).getValue();
        return this.value.round(decimals).getValue();
    }
    cmp(x) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        return this.value.compareTo(xValue);
    }
    isNegative() {
        return this.value.compareTo(new js_big_decimal_1.default('0')) < 0;
    }
    isPositive() {
        return this.value.compareTo(new js_big_decimal_1.default('0')) > 0;
    }
    sign() {
        const cmp = this.value.compareTo(new js_big_decimal_1.default('0'));
        return cmp === 0 ? 0 : cmp < 0 ? -1 : 1;
    }
    min(x, y) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        const yValue = y?.value || new js_big_decimal_1.default('0');
        this.value = xValue.compareTo(yValue) < 0 ? xValue : yValue;
        return this;
    }
    max(x, y) {
        const xValue = x?.value || new js_big_decimal_1.default('0');
        const yValue = y?.value || new js_big_decimal_1.default('0');
        this.value = xValue.compareTo(yValue) > 0 ? xValue : yValue;
        return this;
    }
    toFloat64() {
        if (this.isZero()) {
            return [0, 'exact'];
        }
        const num = parseFloat(this.value.getValue());
        if (Math.abs(num) <= Number.MAX_SAFE_INTEGER) {
            const reconstructed = new Float(num);
            if (this.eq(reconstructed)) {
                return [num, 'exact'];
            }
            const diff = new Float(this.value.subtract(reconstructed.value));
            if (diff.isZero()) {
                return [num, 'exact'];
            }
            else if (diff.isPositive()) {
                return [num, 'below'];
            }
            else {
                return [num, 'above'];
            }
        }
        return [num, this.isNegative() ? 'above' : 'below'];
    }
}
exports.Float = Float;
