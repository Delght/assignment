import './alert.css';

import type { ReactNode } from 'react';

type Tone = 'info' | 'warning' | 'error' | 'success';

/** Errors interrupt screen readers (role=alert); the rest are announced politely. */
export function Alert({
  tone,
  title,
  children,
}: {
  tone: Tone;
  title?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title ? <strong className="alert-title">{title}</strong> : null}
      {children ? <div>{children}</div> : null}
    </div>
  );
}
