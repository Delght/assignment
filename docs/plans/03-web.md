# 3. Web

Goal: a dashboard that answers "how is my portfolio doing and why" at a glance, on a phone as well as a desktop, without ever recomputing a number the API already gave.

## Scope

`frontend/src/`, React with Vite:

- `api/`: fetch client, TanStack Query hooks, the contract types mirrored from the backend.
- `features/overview/`: summary cards (value, cost basis, realized, unrealized, total P&L, fees) and the price timestamp.
- `features/holdings/`: holdings table on wide screens, expandable list on narrow ones; closed assets with realized P&L stay visible.
- `features/charts/`: allocation donut by current value; realized and unrealized P&L per asset.
- `features/transactions/`: explorer with asset search, exchange, side and date filters, sort by time, pagination, gross value and fee columns.
- `features/dataset/`: import and reset, with every validation issue listed.
- `format/`: the only place numbers are rounded for display.
- `shared/`: pieces used by several features (P&L figure, asset label and colours, section, alert, error boundary, scroll region, expandable list).

## Decisions

- **Formatting from strings.**
  `Intl.NumberFormat.format` takes the decimal string with `roundingMode: 'halfEven'`, so display rounding is exact.
  Charts convert to numbers only to size bars and slices.
- **Server-side explorer.**
  Filtering, sorting and paging happen in `/api/transactions`, so totals for a filter cover every matching row, not only the page.
- **Colour has one meaning.**
  Green and red are gain and loss; assets have fixed colours; BUY and SELL differ by shape (SELL filled), not by colour.
- **Phones.**
  Wide tables become native `<details>` lists instead of scrolling sideways; the layout reacts to its container, not only the viewport.

## UI review

Changes made after reviewing the running app, now part of the `ui-review` skill:

- Figures joined with `;` or `·` read as noise; they became labelled values.
- Mixed symbols and words in the same place became consistent.
- A grey P&L chart hid the meaning; bars are now coloured by sign with unrealized hatched, and the legend shows both colours.
- The donut tooltip slid under the centre label; it now sits above it.
- Two arrows on one figure; secondary percentages keep sign and colour only.
- All-white tables were hard to scan; asset dots and muted secondary columns fixed it.
- Cards side by side had uneven heights and gaps; they now stretch to match.

## Acceptance

- [x] Every figure the API returns is shown, rounded only in `format/`.
- [x] States: loading, API down with retry, empty dataset, unpriced holding, all positions closed, invalid import with its issues.
- [x] Explorer: every filter, sort, pagination, reset of filters.
- [x] 375 px, 1024 px and 1280 px, light and dark, keyboard only: checked in the browser.
- [x] Tests for formatting, chart data, filters, the explorer, import and the compact layout.
- [x] `pnpm verify` exits 0 for both folders; CI runs both.
