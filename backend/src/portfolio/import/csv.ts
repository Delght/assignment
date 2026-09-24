import { CsvError, parse } from 'csv-parse/sync';

import type { ValidationIssue } from '../model.js';

export type CsvRow = { line: number; cells: Record<string, string> };

/** `rows` is null when the file is unreadable or its header is unusable. */
export type CsvReadResult = { rows: CsvRow[] | null; issues: ValidationIssue[] };

type RecordWithInfo = { record: string[]; info: { lines: number } };

/**
 * Rows keyed by header name, with the real line number of each. Rows with the wrong number of
 * values are reported and left out; extra columns are ignored.
 */
export function readCsv(text: string, required: readonly string[]): CsvReadResult {
  if (text.trim() === '') return fileIssue('empty_file', 'The file is empty.');

  let records: RecordWithInfo[];
  try {
    records = parse(text, {
      bom: true,
      info: true,
      // Both endings: with one fixed delimiter, a file mixing \r\n and \n is misread.
      record_delimiter: ['\r\n', '\n'],
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    }) as unknown as RecordWithInfo[];
  } catch (error) {
    if (!(error instanceof CsvError)) throw error;
    return {
      rows: null,
      issues: [
        {
          line: typeof error.lines === 'number' ? error.lines : null,
          code: 'malformed_csv',
          message: `The file is not valid CSV: ${error.message}`,
        },
      ],
    };
  }

  const [header, ...body] = records;
  if (!header) return fileIssue('empty_file', 'The file is empty.');

  const issues = headerIssues(header.record, required);
  if (issues.length > 0) return { rows: null, issues };

  const columns = header.record;
  const rows: CsvRow[] = [];
  for (const { record, info } of body) {
    if (record.length !== columns.length) {
      issues.push({
        line: info.lines,
        code: 'column_count',
        message: `Line ${info.lines} has ${plural(record.length, 'value')}; the header has ${columns.length}.`,
      });
      continue;
    }
    rows.push({
      line: info.lines,
      cells: Object.fromEntries(columns.map((column, index) => [column, record[index] ?? ''])),
    });
  }
  return { rows, issues };
}

function headerIssues(columns: string[], required: readonly string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const missing = required.filter((column) => !columns.includes(column));
  if (missing.length > 0) {
    issues.push({
      line: 1,
      code: 'missing_columns',
      message: `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Expected: ${required.join(', ')}.`,
    });
  }
  const duplicated = [
    ...new Set(columns.filter((column, index) => columns.indexOf(column) !== index)),
  ];
  if (duplicated.length > 0) {
    issues.push({
      line: 1,
      code: 'duplicate_columns',
      message: `Listed twice in the header: ${duplicated.join(', ')}.`,
    });
  }
  return issues;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function fileIssue(code: string, message: string): CsvReadResult {
  return { rows: null, issues: [{ line: null, code, message }] };
}
