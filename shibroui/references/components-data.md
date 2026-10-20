# Data components: tables, row actions, pagination, filters (SU-222 – SU-227)

Tables are where product screens spend most of their pixels, and where "fine in the mockup" breaks first:
mixed row heights, truncated numbers, hidden actions, filters nobody can see. These are starting specs.
The project's design system wins (component workflow step 3). Values marked † were checked against the
primary source named in the *Why* line. Pagination heights are SU-59; search is SU-58; empty states are
SU-117.

- [Table structure](#table-structure) SU-222–224
- [Rows, paging and filters](#rows-paging-and-filters) SU-225–227

## Table structure

### SU-222 One density per table
**Rule:** rows are 32 (compact) · 40 (default) · 48 (comfortable) px; 64 only for two-line rows. The header
row matches the row height. Cell inline padding is 12–16px.
- ❌ A `tbody` with `36px`, `44px` and `52px` rows, and a `56px` header over `40px` rows.
- ✅ Every row `40px`, header `40px`, cells `padding-inline: 16px`.
- **Why:** one rhythm lets the eye scan down a column (Carbon: 24/32/40/48/64, header = row; Primer padding
  8/12/16).
- **Do:** `tr{block-size:40px} td,th{padding-inline:16px}`; a `data-density` attribute on the table swaps
  32/40/48. Offer a density switch only in tools people live in (admin, finance, inboxes). Rows that wrap
  to two lines are the 64px case, not a reason to mix heights.
- **Measure:** `audit.js` SU-222: row heights per table; warn on mixed row heights in one `tbody` (not
  caused by wrapping).

### SU-223 Columns are sized by their content
**Rule:** fixed widths for selection (40–48px), status, dates and amounts; the name or description column
flexes. Text cells truncate, numbers and IDs never do. Headers stick when the table is taller than the
screen; the first column (the human-readable identifier) sticks when the table scrolls sideways.
- ❌ A `1,240.50` amount cut to `1,24…`, and a 12-column table that scrolls away from its row names.
- ✅ Amount column `width: 112px`, right-aligned, tabular figures; first column frozen with a soft shadow
  on its right edge.
- **Why:** truncated numbers misreport the value, and a scrolled-away name makes the row unreadable
  (NN/g: freeze the header and the first column once the table outgrows the screen).
- **Do:** `th{position:sticky;top:0}` and `td:first-child{position:sticky;left:0;box-shadow:1px 0 0
  var(--border)}` with an opaque background. Text cells use SU-200 (full value on hover *and* focus).
  `font-variant-numeric: tabular-nums`; keep `scroll-margin` for anchored rows.
- **On phones (under ~600px):** a table of records (invoices, people, orders) becomes stacked rows, one
  card-like row per record: line 1 the identifier and the key value (amount), line 2 the status, then the
  secondary fields as label–value pairs, with a "Sort by" select replacing the header sort. Keep sideways
  scrolling (with the frozen first column) only for tables people compare *across* columns: comparison
  grids, spreadsheets, logs.
- **Measure:** `audit.js` SU-223: warn on truncated numeric cells; warn on a horizontally scrolling table of
  4+ columns with no sticky first column and no edge cue; info at ≤ 480px on a scrolling table of 5+
  columns (stack the rows instead).

### SU-224 Sort and select are visible state
**Rule:** the header label is a `<button>` inside the `th`. Only the sorted column carries `aria-sort` and
shows its icon; a sortable table starts sorted by one column. A selection column has a header checkbox
(indeterminate when some rows are selected). Selecting a row swaps the toolbar for a batch bar.
- ❌ A sort arrow on every column, no `aria-sort` anywhere, and a header checkbox that stays unchecked
  when 3 of 50 rows are selected.
- ✅ `<th aria-sort="ascending"><button>Due date <svg/></button></th>` on one column only; a header
  checkbox with `indeterminate = true`.
- **Batch bar:** the toolbar is replaced by a bar at row height: "3 selected", the bulk actions, and Cancel
  at the far end. Row actions are disabled meanwhile. When the whole page is selected, offer "Select all
  1,240".
- **Why:** screen readers and sighted users both need to know *which* column orders the rows (APG sortable
  table; Carbon batch actions; Primer always starts with one sorted column).
- **Do:** cycle ascending, descending, off only if the table can be unsorted; announce the new order in a
  `role="status"` region (SU-146). Selection never changes row height or shifts columns (SU-249).
- **Measure:** `audit.js` SU-224: fail when header buttons inside `th` show a sort icon but no `th` in the
  table has `aria-sort`; warn on a checkbox column without a header checkbox.

## Rows, paging and filters

### SU-225 Row actions sit at the end and are always visible
**Rule:** one or two actions in the last column plus "⋯" for the rest, named per row ("Actions for
INV-2041"), never revealed only on hover (SU-174).
- ❌ Icon buttons that appear on row hover, all named "More", and a clickable row that also holds three
  buttons.
- ✅ "Edit" and "⋯" always visible, `aria-label="Actions for INV-2041"`; the name cell is the link.
- **Why:** hover-only actions don't exist on touch or for keyboard users, and identical names tell a
  screen-reader user nothing.
- **Do:** make the whole row open its detail only when the row has no other controls; otherwise link the
  name cell. Targets follow SU-61/62. Empty cells show "—" with an accessible "None"
  (`<span class="sr-only">None</span>`). Menus follow SU-233 (overlays file).
- **Measure:** `audit.js` SU-174 check; info on rows with `onclick` that also contain buttons.

### SU-226 Paginate tables and search results; scroll feeds
**Rule:** tables show the range and total ("1–50 of 1,240"), with pagination below the table at row
height, the page size in a menu (25 / 50 / 100 by convention) and the page in the URL. Infinite scroll
only for aimless browsing of similar items.
- ❌ Infinite scroll on an invoice list: no footer, no count, and Back lands at the top.
- ✅ "1–50 of 1,240", `?page=3&size=50` in the URL, and Back returns to the same page and scroll position.
- **Why:** people searching, comparing or needing the footer can't use endless lists (NN/g infinite
  scrolling; Carbon). "Load more" keeps the footer reachable where a feed is right.
- **Do:** pagination control heights are SU-59; navigation links get `aria-current="page"` on the current
  page; restore the position on Back (`history.scrollRestoration`). Prefer search over scrolling for
  long option lists (SU-54).
- **Measure:** manual.

### SU-227 Filters show what's applied
**Rule:** search plus 2–3 visible filters; the rest behind "Filters". Applied filters appear as removable
chips with "Clear all". The result count updates in a `role="status"` region; filters live in the URL.
- ❌ Six dropdowns across the toolbar, no sign of what's applied, and a blank table for zero results.
- ✅ Search + Status + Owner + "Filters (2)"; chips "Status: Paid ×", "Clear all"; "42 results" announced.
- **Why:** a filter you can't see is a bug report ("where did my rows go?"). The URL makes a view
  shareable and survives reload.
- **Do:** chip remove buttons are named ("Remove filter: Paid") with a ≥ 24px target (SU-246). Zero
  results says what is filtered and offers "Clear filters" (SU-117). Control heights match (SU-58–60).
- **Measure:** SU-146 check for the count; manual otherwise.
