# Charts in the screen (SU-185 – SU-191)

For chart form, palette and mark specs, follow the **dataviz** skill: it owns construction and ships a
palette validator. These rules cover what shibroUI adds: how a chart fits the screen's system, and what
`audit.js` can measure in a live page. SU-43 (series told apart by more than color) still applies.

### SU-185 The chart answers the screen's job
**Rule:** one primary chart per dashboard, sized as the focal point or clearly below it (SU-119). A
single number that matters is a KPI with a delta and a sparkline, not a one-bar chart. The title states
the takeaway ("Online passed retail in May"), not the dataset ("Sales").

### SU-186 Honest scales
**Rule:** bar and area charts start at zero. Small multiples share a scale. No dual y-axes. Never
interpolate across missing data: mark the gap. Pie slices under about 3° need a callout, or the chart
should be a bar chart.
- **Measure:** manual.

### SU-187 Series stay visible and stay in the color budget
**Rule:** each series' marks reach 3:1 against the plot background (WCAG 1.4.11). Adjacent series differ
by more than color: line style, marker shape or a direct label. Series colors come from chart tokens
(`--chart-1…n`, validated by the dataviz palette script), so they don't count against SU-127's single
accent. Keep the same color for the same series across the page.
- ❌ Two near-identical blues told apart only by a legend.
- ✅ A solid line and a dashed line, in distinct hues, each labeled at its end.
- **Measure:** `audit.js` SU-187: warn per series color under 3:1 against the chart background.

### SU-188 Chart text is real, readable text
**Rule:** axis labels, tick values and annotations are text at least 12px and at least 4.5:1, with
tabular figures and units in the label. Gridlines stay quiet, and data ink is the highest contrast in the
chart.
- ❌ 10px `#3f3f46` ticks on `#1b1b1e` (1.7:1).
- ✅ 12px `#a1a1aa` (6.8:1).
- **Measure:** `audit.js` SU-188: warn on chart text under 12px; fail on chart text under 4.5:1.

### SU-189 Every chart has a text alternative
**Rule:** the chart has `role="img"` and an `aria-label` that states the takeaway, *plus* the data as a
table or a "View as table" control. Tooltips are reachable by keyboard focus, can be dismissed, and are
never the only place a value lives (WCAG 1.4.13).
- **Measure:** `audit.js` SU-189: fail on an SVG or canvas chart with no accessible name; info when
  there's no table nearby. Canvas contents can't be measured and are listed in `coverage.skipped`.

### SU-190 Charts have states too
**Rule:** charts are part of the state matrix (SU-155):
- loading: an axis skeleton;
- empty: "No orders in this period";
- error: with Retry;
- sparse data: a single point.

Use fewer ticks below 480px.

### SU-191 Legends only when labels can't do it
**Rule:** prefer direct labels. Drop the legend for a single series. A legend stays in series order and
uses at most two lines (about 30% of chart height, per Carbon). Long names go below the chart, never
squeezed into the plot.
