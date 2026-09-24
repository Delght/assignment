import './section.css';

import type { ReactNode } from 'react';

export function Section({
  id,
  title,
  actions,
  fill = false,
  children,
}: {
  id: string;
  title: string;
  actions?: ReactNode;
  /** Let the content take the remaining height, e.g. a chart beside a taller card. */
  fill?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={fill ? 'section section-fill panel' : 'section panel'}
      aria-labelledby={`${id}-title`}
    >
      <div className="section-head">
        <h2 id={`${id}-title`}>{title}</h2>
        {actions ? <div className="section-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
