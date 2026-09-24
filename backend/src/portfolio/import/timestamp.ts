/** UTC ISO-8601 with a literal `Z`, e.g. 2025-10-01T09:00:00Z, optionally with milliseconds. */
const ISO_UTC = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;

/**
 * Milliseconds since the epoch, or null when the text is not a real UTC instant. Offsets other
 * than `Z` are rejected so every stored timestamp means the same thing, and impossible dates
 * (2025-02-30) are caught by round-tripping the parts instead of trusting Date's rollover.
 */
export function parseUtcTimestamp(text: string): number | null {
  const match = ISO_UTC.exec(text);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const millis = match[7] ? Number(match[7].padEnd(3, '0')) : 0;
  const time = Date.UTC(year, month - 1, day, hour, minute, second, millis);
  const date = new Date(time);
  const sameParts =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second;
  return sameParts ? time : null;
}
