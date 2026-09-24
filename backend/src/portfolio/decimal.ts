import { Decimal } from 'decimal.js';

/** Imported amounts have at most 8 decimal places and 12 integer digits. */
export const AMOUNT_LIMITS = { decimalPlaces: 8, integerDigits: 12 } as const;

/**
 * Money and quantities, never JS numbers: binary floats leave dust such as -8.9e-16 after a full
 * close, breaking the zero-reset rule and the no-short check. Divisions (average cost, allocation,
 * return) round at 60 significant digits. A private clone so no other code can change it.
 */
export const Dec = Decimal.clone({ precision: 60, rounding: Decimal.ROUND_HALF_EVEN });
export type Dec = Decimal;

export const ZERO: Dec = new Dec(0);

/** Plain notation only: no exponent, plus sign, separators or currency symbol. */
const DECIMAL_TEXT = /^-?\d+(\.\d+)?$/;

export function parseDecimal(text: string): Dec | null {
  return DECIMAL_TEXT.test(text) ? new Dec(text) : null;
}

/**
 * Additions, subtractions and products keep every digit. At 60 digits, adding a division result to
 * a larger amount rounds it, and that rounding can move a total across a half cent (an exact
 * -0.025 became -0.025…002 and showed as -$0.03). Finite operands give finite results, so the
 * maximum precision never rounds them.
 */
const Exact = Dec.clone({ precision: 1e9 });

export function addExact(left: Dec, right: Dec): Dec {
  return new Dec(new Exact(left).plus(right));
}

export function subtractExact(left: Dec, right: Dec): Dec {
  return new Dec(new Exact(left).minus(right));
}

export function multiplyExact(left: Dec, right: Dec): Dec {
  return new Dec(new Exact(left).times(right));
}

export function sumOf<T>(items: readonly T[], pick: (item: T) => Dec | null): Dec {
  return items.reduce((total, item) => addExact(total, pick(item) ?? ZERO), ZERO);
}
