import { z } from 'zod';

import { ApiError } from '../../infra/http/api-error.js';
import { EXCHANGES, parseUtcTimestamp, SIDES, SYMBOLS } from '../../portfolio/index.js';

const DAY_MS = 86_400_000;

/** A calendar day in UTC, YYYY-MM-DD, as its first millisecond. */
const utcDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'use YYYY-MM-DD')
  .transform((day, context) => {
    const time = parseUtcTimestamp(`${day}T00:00:00Z`);
    if (time === null) {
      context.addIssue({ code: 'custom', message: `${day} is not a real date` });
      return z.NEVER;
    }
    return time;
  });

const schema = z
  .object({
    symbol: z.enum(SYMBOLS).optional(),
    exchange: z.enum(EXCHANGES).optional(),
    side: z.enum(SIDES).optional(),
    /** Case-insensitive part of a trade_id. */
    q: z.string().trim().max(64).optional(),
    /** Inclusive UTC days. */
    from: utcDay.optional(),
    to: utcDay.optional(),
    sort: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict()
  .refine((query) => query.from === undefined || query.to === undefined || query.from <= query.to, {
    message: '"from" must be on or before "to"',
    path: ['from'],
  });

export type TransactionsQuery = Omit<z.infer<typeof schema>, 'to'> & {
  /** Exclusive upper bound: the millisecond after the `to` day ends. */
  toExclusive?: number;
};

export function parseTransactionsQuery(raw: unknown): TransactionsQuery {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(
      400,
      'invalid_query',
      'Some filters are not valid.',
      result.error.issues.map((issue) => ({
        line: null,
        column: issue.path.join('.') || undefined,
        code: 'invalid_query',
        message:
          issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
      })),
    );
  }
  const { to, ...rest } = result.data;
  return to === undefined ? rest : { ...rest, toExclusive: to + DAY_MS };
}
