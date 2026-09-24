import { AMOUNT_LIMITS, Dec, parseDecimal } from '../decimal.js';
import type { ValidationIssue } from '../model.js';
import { parseUtcTimestamp } from './timestamp.js';

const AMOUNT_CEILING = new Dec(10).pow(AMOUNT_LIMITS.integerDigits);

/** Reads the cells of one CSV row, collecting every problem instead of stopping at the first. */
export class RowReader {
  readonly issues: ValidationIssue[] = [];

  constructor(
    readonly line: number,
    private readonly cells: Record<string, string>,
  ) {}

  get ok(): boolean {
    return this.issues.length === 0;
  }

  fail(column: string, code: string, message: string): void {
    this.issues.push({ line: this.line, column, code, message: `Line ${this.line}: ${message}` });
  }

  text(column: string): string | null {
    const value = this.cells[column] ?? '';
    if (value === '') {
      this.fail(column, 'missing_value', `${column} is empty.`);
      return null;
    }
    return value;
  }

  choice<T extends string>(column: string, allowed: readonly T[]): T | null {
    const value = this.text(column);
    if (value === null) return null;
    if ((allowed as readonly string[]).includes(value)) return value as T;
    this.fail(
      column,
      `unsupported_${column}`,
      `${column} must be one of ${allowed.join(', ')} (got "${value}").`,
    );
    return null;
  }

  /** Milliseconds since the epoch. */
  timestamp(column: string): number | null {
    const value = this.text(column);
    if (value === null) return null;
    const time = parseUtcTimestamp(value);
    if (time === null) {
      this.fail(
        column,
        'invalid_timestamp',
        `${column} "${value}" is not a valid UTC ISO-8601 time (expected e.g. 2025-10-01T09:00:00Z).`,
      );
    }
    return time;
  }

  amount(column: string, rule: 'positive' | 'non-negative'): Dec | null {
    const value = this.text(column);
    if (value === null) return null;
    const amount = parseDecimal(value);
    if (!amount) {
      this.fail(
        column,
        'invalid_number',
        `${column} "${value}" is not a plain decimal number (e.g. 0.5 or 1200.25).`,
      );
      return null;
    }
    if (amount.decimalPlaces() > AMOUNT_LIMITS.decimalPlaces) {
      this.fail(
        column,
        'too_many_decimals',
        `${column} ${value} has more than ${AMOUNT_LIMITS.decimalPlaces} decimal places.`,
      );
      return null;
    }
    if (amount.abs().greaterThanOrEqualTo(AMOUNT_CEILING)) {
      this.fail(
        column,
        'too_large',
        `${column} ${value} has more than ${AMOUNT_LIMITS.integerDigits} digits before the decimal point.`,
      );
      return null;
    }
    if (rule === 'positive' && !amount.greaterThan(0)) {
      this.fail(column, 'not_positive', `${column} must be greater than 0 (got ${value}).`);
      return null;
    }
    if (rule === 'non-negative' && amount.isNegative()) {
      this.fail(column, 'negative', `${column} must be 0 or greater (got ${value}).`);
      return null;
    }
    return amount;
  }
}

/** Remembers the first line each key was seen on, to report duplicates. */
export class FirstSeen {
  private readonly lines = new Map<string, number>();

  /** The line this key was first seen on, or undefined when this is the first time. */
  before(key: string, line: number): number | undefined {
    const first = this.lines.get(key);
    if (first === undefined) this.lines.set(key, line);
    return first;
  }
}
