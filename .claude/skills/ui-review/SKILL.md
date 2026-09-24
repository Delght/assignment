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
- One name per figure everywhere (card, chart, table, phone list): labels come from the feature's single label map (`holdingFields.tsx`, `transactionFields.ts`), never typed again in a layout.
- Say the same thing once: a phrase repeated on every row belongs in a column head.

**Colour**
- Green and red mean gain and loss only.
  Nothing else uses them (not BUY/SELL, not exchanges).
- Each asset keeps its colour everywhere (`shared/assetColors.ts`); never colour by rank.
- Legend keys show the colours they stand for; a chart must not be all greys.
- Direction readable without colour: sign and arrow on the main figure, one arrow per figure (a secondary percentage under it has sign and colour only).

**Layout**
- 375 px: no sideways page scroll; wide tables become expandable lists.
- 1024 px and 1280 px: side-by-side cards are the same height with no empty gap; a legend sits beside or centred under its chart, not hanging to one side.
- Figures in one row of cards line up, whether or not a card has a note.
- Set the viewport size before loading the page: the phone layout is chosen when the page loads.
- Hover every chart: tooltips are above everything else and readable.
- Check sub-dollar and sub-cent P&L: axis ticks stay distinct instead of all reading `-$0`; very small ticks use scientific notation.
- Light and dark mode.

**States:** loading, API down (with retry), no trades, missing price, every position closed.

**Accessibility:** tables have captions, sortable headers `aria-sort`, errors `role="alert"`, labelled groups have a role that takes a name, keyboard reaches every control.
Anything visual only (`aria-hidden`, such as a list's column head) must be said another way: each figure on a phone row carries its label for screen readers.
Hidden helpers (the file input behind the import button) are out of the tab order.
