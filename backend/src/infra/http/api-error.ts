import type { ValidationIssue } from '../../portfolio/index.js';

/** Every error response has this shape: a stable code, a sentence for people, maybe issues. */
export type ErrorBody = {
  code: string;
  message: string;
  issues?: ValidationIssue[];
  /** Set when `issues` was cut short. */
  totalIssues?: number;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues?: ValidationIssue[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
