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

/** Names what each line of a row shows, once above the list instead of in every row. */
export type ExpandableColumns = {
  title: string;
  subtitle: string;
  value: string;
  subvalue: string;
};

/**
 * A table's rows for narrow screens: the key figures in one line, the rest behind a native
 * <details>, which brings keyboard support and the expanded state for screen readers.
 */
export function ExpandableList({
  items,
  label,
  columns,
}: {
  items: ExpandableItem[];
  label: string;
  columns: ExpandableColumns;
}) {
  return (
    <>
      {/* Visual only: each row names its own figures for screen readers. */}
      <div className="xlist-head" aria-hidden="true">
        <span className="xlist-main">
          <span>{columns.title}</span>
          <span>{columns.subtitle}</span>
        </span>
        <span className="xlist-figures">
          <span>{columns.value}</span>
          <span>{columns.subvalue}</span>
        </span>
      </div>
      <ul className="xlist" aria-label={label}>
        {items.map((item) => (
          <li key={item.key} className={item.dimmed ? 'xlist-dimmed' : undefined}>
            <details>
              <summary>
                <span className="xlist-main">
                  <span className="xlist-title">{item.title}</span>
                  {item.subtitle ? (
                    <span className="xlist-sub">
                      <SpokenLabel>{columns.subtitle}</SpokenLabel>
                      {item.subtitle}
                    </span>
                  ) : null}
                </span>
                <span className="xlist-figures">
                  <span className="xlist-value">
                    <SpokenLabel>{columns.value}</SpokenLabel>
                    {item.value}
                  </span>
                  {item.subvalue ? (
                    <span className="xlist-sub">
                      <SpokenLabel>{columns.subvalue}</SpokenLabel>
                      {item.subvalue}
                    </span>
                  ) : null}
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
    </>
  );
}

function SpokenLabel({ children }: { children: string }) {
  return <span className="visually-hidden">{children}: </span>;
}
