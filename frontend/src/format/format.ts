/**
 * Display formatting. Amounts arrive as exact decimal strings and go to Intl as strings, which it
 * treats as exact decimals (ES2023), so rounding happens once, here, half-even. A double keeps
 * about 17 significant digits: "1234500011.3450000000000001" shows as $1,234,500,011.35, where
 * Number() would drop the final 1 and show $1,234,500,011.34.
 */
const formats = new Map<string, Intl.NumberFormat>();

function format(value: string, options: Intl.NumberFormatOptions): string {
  const key = JSON.stringify(options);
  let formatter = formats.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { roundingMode: 'halfEven', ...options });
    formats.set(key, formatter);
  }
  return formatter.format(value as Intl.StringNumericLiteral);
}

const DOLLARS = { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } as const;
const PERCENT = { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;
/** No sign once the value rounds to zero, so "$0.00" never reads as a gain or a loss. */
const SIGNED = { signDisplay: 'exceptZero' } as const;

export const usd = (value: string) => format(value, { ...DOLLARS, maximumFractionDigits: 2 });

export const signedUsd = (value: string) =>
  format(value, { ...DOLLARS, maximumFractionDigits: 2, ...SIGNED });

/** Up to 8 decimals below $1, so CKB at $0.00715 does not show as $0.01. */
export const unitPrice = (value: string) =>
  format(value, { ...DOLLARS, maximumFractionDigits: Math.abs(Number(value)) < 1 ? 8 : 2 });

/** Up to 8 decimals, the precision of the input. */
export const quantity = (value: string) => format(value, { maximumFractionDigits: 8 });

export const percent = (value: string) => format(value, PERCENT);

export const signedPercent = (value: string) => format(value, { ...PERCENT, ...SIGNED });

/** A dash where there is nothing to show, e.g. no price. */
export const orDash = (value: string | null, format: (value: string) => string): string =>
  value === null ? '—' : format(value);

export function utcDateTime(iso: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/.exec(iso);
  return match ? `${match[1]} ${match[2]} UTC` : iso;
}

/** For columns already headed "UTC": 2025-10-01 09:00, with seconds only when they are not 0. */
export function utcCompact(iso: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?/.exec(iso);
  if (!match) return iso;
  return match[3] && match[3] !== '00'
    ? `${match[1]} ${match[2]}:${match[3]}`
    : `${match[1]} ${match[2]}`;
}

/** Direction as displayed: a value shown as zero is flat. */
export function trendOf(
  value: string,
  displayedAs: (value: string) => string = signedUsd,
): 'up' | 'down' | 'flat' {
  const shown = displayedAs(value);
  if (shown.startsWith('+')) return 'up';
  if (shown.startsWith('-')) return 'down';
  return 'flat';
}

/** Chart axis coordinates: keep sub-dollar ticks distinct, and tiny ticks short enough to fit. */
export function compactUsd(value: number): string {
  const magnitude = Math.abs(value);
  return format(String(value), {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'negative',
    ...(magnitude > 0 && magnitude < 1
      ? { notation: magnitude < 0.001 ? 'scientific' : 'standard', maximumSignificantDigits: 2 }
      : { notation: 'compact', maximumFractionDigits: 1 }),
  });
}
