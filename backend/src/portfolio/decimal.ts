import { Decimal } from 'decimal.js';

/**
 * Money and quantities, never JS numbers: binary floats leave dust such as -8.9e-16 after a full
 * close, breaking the zero-reset rule and the no-short check. A private clone so no other code
 * can change its settings; 40 significant digits is far beyond the 8-decimal inputs.
 */
export const Dec = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });
export type Dec = Decimal;

export const ZERO: Dec = new Dec(0);

/** Plain notation only: no exponent, plus sign, separators or currency symbol. */
const DECIMAL_TEXT = /^-?\d+(\.\d+)?$/;

export function parseDecimal(text: string): Dec | null {
  return DECIMAL_TEXT.test(text) ? new Dec(text) : null;
}

export function sumOf<T>(items: readonly T[], pick: (item: T) => Dec | null): Dec {
  return items.reduce((total, item) => total.plus(pick(item) ?? ZERO), ZERO);
}
