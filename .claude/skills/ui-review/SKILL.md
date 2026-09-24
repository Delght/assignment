---
name: ui-review
description: Review a UI change in a real browser against the house rules (copy, colour meaning, layout at phone and desktop widths, states, accessibility) before calling it finished.
---

Open the running app (`pnpm dev`, http://localhost:5173) and check the changed area.
Fix what fails, then report what was checked at which width and theme.

**Copy**
- Full sentences, no `;` joins, no figures strung together with `·`: show figures with labels.
- Symbols or words, consistently in one place (not "Realized + unrealized" next to plain words).
- No developer notes on screen ("totals match the summary"); no subtitle that repeats what the page already shows.

**Colour**
- Green and red mean gain and loss only.
  Nothing else uses them (not BUY/SELL, not exchanges).
- Each asset keeps its colour everywhere (`shared/assetColors.ts`); never colour by rank.
- Legend keys show the colours they stand for; a chart must not be all greys.
- Direction readable without colour: sign and arrow on the main figure, one arrow per figure (a secondary percentage under it has sign and colour only).

**Layout**
- 375 px: no sideways page scroll; wide tables become expandable lists.
- 1024 px and 1280 px: side-by-side cards are the same height with no empty gap; a legend sits beside or centred under its chart, not hanging to one side.
- Hover every chart: tooltips are above everything else and readable.
- Light and dark mode.

**States:** loading, API down (with retry), no trades, missing price, every position closed.

**Accessibility:** tables have captions, sortable headers `aria-sort`, errors `role="alert"`, labelled groups have a role that takes a name, keyboard reaches every control.
