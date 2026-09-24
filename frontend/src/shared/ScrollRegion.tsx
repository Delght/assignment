import './table.css';

import type { ReactNode } from 'react';

export function ScrollRegion({
  labelledBy,
  children,
}: {
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to focus a scrolling region to scroll it (axe: scrollable-region-focusable)
    <section className="table-scroll" tabIndex={0} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}
