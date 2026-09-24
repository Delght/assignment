import './facts.css';

import type { ReactNode } from 'react';

/** Labelled figures in a row: a small label above each value. */
export function Facts({
  items,
  label,
}: {
  items: { label: string; value: ReactNode }[];
  label?: string;
}) {
  return (
    // A description list has no role that takes a name, so a labelled one is a group.
    <dl className="facts" role={label ? 'group' : undefined} aria-label={label}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
