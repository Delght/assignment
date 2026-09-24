import './expandable-list.css';

import type { ReactNode } from 'react';

export type ExpandableItem = {
  key: string;
  title: ReactNode;
  subtitle?: ReactNode;
  value: ReactNode;
  subvalue?: ReactNode;
  details: { label: string; value: ReactNode }[];
  dimmed?: boolean;
};

/**
 * A table's rows for narrow screens: the key figures in one line, the rest behind a native
 * <details>, which brings keyboard support and the expanded state for screen readers.
 */
export function ExpandableList({ items, label }: { items: ExpandableItem[]; label: string }) {
  return (
    <ul className="xlist" aria-label={label}>
      {items.map((item) => (
        <li key={item.key} className={item.dimmed ? 'xlist-dimmed' : undefined}>
          <details>
            <summary>
              <span className="xlist-main">
                <span className="xlist-title">{item.title}</span>
                {item.subtitle ? <span className="xlist-sub">{item.subtitle}</span> : null}
              </span>
              <span className="xlist-figures">
                <span className="xlist-value">{item.value}</span>
                {item.subvalue ? <span className="xlist-sub">{item.subvalue}</span> : null}
              </span>
              <span className="xlist-chevron" aria-hidden="true" />
            </summary>
            <dl className="xlist-details">
              {item.details.map((detail) => (
                <div key={detail.label}>
                  <dt>{detail.label}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          </details>
        </li>
      ))}
    </ul>
  );
}
