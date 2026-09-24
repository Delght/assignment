import { Decimal } from 'decimal.js';

/**
 * Imported amounts have at most 8 decimal places and 12 integer digits (20 significant digits).
 * A product of two is at most 40 digits and the sums of a 2 MB file add fewer than 6 more, so at
 * 60 digits every imported amount, and every product or sum of them, is exact. Rounding enters
 * only through divisions: the average cost and what is computed from it, allocation and return.
 */
export const AMOUNT_LIMITS = { decimalPlaces: 8, integerDigits: 12 } as const;

/**
 * Money and quantities, never JS numbers: binary floats leave dust such as -8.9e-16 after a full
 * close, breaking the zero-reset rule and the no-short check. A private clone so no other code
 * can change its settings.
 */
export const Dec = Decimal.clone({ precision: 60, rounding: Decimal.ROUND_HALF_EVEN });
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
