import type { ApiError } from '@/api/client';
import { Alert } from '@/shared/Alert';

/** Every problem the server found, by line, so the file can be fixed in one pass. */
export function ImportIssues({ error }: { error: ApiError }) {
  const hidden = error.totalIssues - error.issues.length;
  return (
    <Alert tone="error" title={error.message}>
      <ul className="issues">
        {error.issues.map((issue) => (
          <li key={`${issue.line}:${issue.column ?? ''}:${issue.code}:${issue.message}`}>
            {issue.line === null ? null : <span className="issue-line">Line {issue.line}</span>}
            {issue.message.replace(/^Line \d+: /, '')}
          </li>
        ))}
      </ul>
      {hidden > 0 ? (
        <p>
          Showing the first {error.issues.length} of {error.totalIssues} problems. Fix these and
          import again to see the rest.
        </p>
      ) : null}
    </Alert>
  );
}
