import type { ValidationIssue } from '../portfolio/index.js';

// What can go wrong when the dataset changes, in the dataset's own terms; the API decides what
// each means over HTTP.

/** An uploaded trades file was rejected; the current dataset is unchanged. */
export class InvalidTradesError extends Error {
  constructor(readonly issues: readonly ValidationIssue[]) {
    const count = issues.length;
    super(
      `The file was not imported: ${count} problem${count === 1 ? '' : 's'} found. Nothing was changed.`,
    );
    this.name = 'InvalidTradesError';
  }
}

/** A reset was asked for, but the sample files cannot be loaded. */
export class SampleUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SampleUnavailableError';
  }
}
