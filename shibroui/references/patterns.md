# Page patterns (SU-212 – SU-221)

Starting shapes for whole pages. The app patterns come first (copied from composition.md). Marketing and
docs pages are judged on looks first, so their rules have numbers too: a hero that says one thing, proof
that is specific, pricing that compares at a glance, and articles with one reading column. The numbers are
starting values; the user's own brand system wins. Long-page behaviour (bands, sticky header, reveals) is
in long-pages.md.

- [App patterns](#app-patterns): dashboard, settings, list/detail, data table, form, landing
- [Marketing pages](#marketing-pages) SU-212–218
- [Docs and articles](#docs-and-articles) SU-219–221

## App patterns

Starting points. Adapt them, but keep their reading order.

**Dashboard** (job: see status, spot problems, act)
```
+----------------------------------------------------------------+
| Page title                           [Secondary] [Primary CTA] |
| KPI | KPI | KPI | KPI          (equal peers, neutral surfaces) |
| Primary chart / main insight (2/3)       | Alerts / to-do (1/3)|
| Detail table (full width, right-aligned numbers)               |
+----------------------------------------------------------------+
```
Section gap 32px, card gap 24px. KPIs are peers: same style, neutral backgrounds, with color only on
deltas and status.

**Settings** (job: find and change one thing)
```
+---------------+------------------------------------------------+
| Side nav      | Section title                                  |
| (240px fixed) | One-line description                           |
| • General     | ------------------------------------------------ |
| • Members     | Label           [ control             ]        |
| • Billing     | Label           [ control ]                    |
| • Danger zone | [Save] (one primary per section)               |
+---------------+------------------------------------------------+
```
Or stacked sections at a 640–720px width, each with an `h2` and a description. The danger zone goes
last and is visually separated.

**List / detail**
```
+--------------------+-------------------------------------------+
| Search + filter    | Detail title               [Primary]      |
| Row  (selected)    | Key facts (label/value grid)              |
| Row                | Body / activity                           |
| Row                |                                           |
+--------------------+-------------------------------------------+
```
The list is 320–400px wide and the selected row is clearly marked.

**Data table admin**
- Page header with the title and a primary action.
- A single filter bar with search plus 2–3 filters, and the rest behind "More filters".
- A table with sticky headers, right-aligned numbers and row actions in the last column.
- Pagination or a count under the table.

**Form**: a single 480–640px column, label above field, groups with `h2`s, and the primary action
at the end, aligned with the fields. Keep long forms in sections, not columns.

**Landing**: hero (one message + one CTA) → proof (logos/metrics) → 3–4 features → testimonial →
final CTA. Sections are separated by 64–128px.

## Marketing pages

Where installed sibling skills disagree: redesign-existing-projects says avoid accordion FAQs while
minimalist-ui specs a boxless one (SU-217 keeps native `<details>`: findable, keyboard-ready, no JS);
impeccable caps pricing at 3 tiers (SU-216 prefers 3 and allows 4 with an enterprise tier);
design-taste-frontend allows a secondary hero CTA while stitch-design-taste allows one CTA only (SU-212
follows the former). Keep the numbers as starting values.

### SU-212 The hero says one thing and shows the product
**Rule:** a headline of about 10 words or fewer that names the outcome, a short subhead, one primary CTA,
and a visual that is the product. All of it fits the first screen at 1280×800 and 375×667.
- **Headline:** ≤ 2 lines at desktop (3 on phones), 10–20ch measure, `text-wrap: balance`.
- **Subhead:** ≤ ~20 words, 18–22px, ≤ 60ch.
- **CTAs:** one primary plus at most one secondary of the same height; labels ≤ 3 words.
- **Visual:** a real screenshot, demo or output, not an abstract shape.
- ❌ "Reimagining the future of work, together" over a gradient blob, with three equal buttons.
- ✅ "Ship previews on every pull request", one sentence below, "Start free trial" and "See a demo", and a
  product screenshot.
- **Why:** no primary source gives hero numbers; these follow design-taste-frontend (hero lines 236–245).
- **Measure:** page-map band 1: words in the `h1`, loud buttons, `aboveFold` at both widths (headline ≤
  ~10 words and ≤ 2 lines; subhead ≤ ~20 words; CTA ≤ 2; all in the first viewport).

### SU-213 Proof is specific
**Rule:** logos (SU-260) or 2–4 numbers with units and a source. Testimonials carry a real name, role,
company and photo, quoted in ≤ ~40 words with hanging quotes (SU-38). Proof sits right after the hero or
right before a CTA.
- ❌ "10x faster" with no unit, "John Doe, CEO", and a wall of logos in the middle of the features.
- ✅ "Deploys in 42s (median, last 30 days)", and a quote from "Maya Ortiz, Staff Engineer, Linear".
- **Measure:** manual; SU-184 already flags John Doe and round numbers.

### SU-214 Features are benefits with evidence
**Rule:** 3–6 features per band. Each band or card leads with the benefit as its heading ("Ship previews
on every PR"), then one sentence, then the proof (a screenshot crop, a code sample, a number).
- **Split bands:** alternate media left and right.
- **Icon-only grids:** keep to a single band.
- ❌ Six cards titled "Fast", "Secure", "Scalable", each with an icon and one vague line.
- ✅ Three split bands, each with a benefit heading and a real crop of the product.
- **Measure:** page-map layout fingerprints (SU-205).

### SU-215 Bento grids have one hero cell and one gap
**Rule:** a 12- or 6-column grid with spans, one gap equal to the gutter, at most two cell sizes besides the
hero cell (≤ 3 cell sizes in all), one message per cell, and the same text inset in every cell. Cells in a
row share height (SU-132). Not every cell gets a picture.
- ❌ Gaps of 12, 16 and 24px, five cell sizes, and a picture in every cell.
- ✅ A 24px gap, one 2×2 hero cell, 1×1 and 2×1 cells, 24px inset throughout.
- **Measure:** page-map: rows (SU-132) and equal gaps (SU-203 logic applied to grids).

### SU-216 Pricing compares at a glance
**Rule:** 3–4 plans in one row (stacked on phones, the recommended plan first), all cards the same height.
- **Cards:** feature lists start at the same line and CTAs are pinned to the bottom (`margin-top: auto`).
  The same features appear in the same order on every card. One CTA style per card, and only the
  recommended one is filled.
- **Recommended plan:** marked by a text badge ("Most popular") *and* a border or accent, never by color
  alone and never by making it taller.
- **Prices:** `tabular-nums`, the period baseline-aligned (SU-4), the same billing unit on every plan,
  and a range when there is no exact price. A monthly/annual switch states the saving.
- **Comparison table:** below the cards, isolating what differs between tiers. Sticky header, ✓ and ✕
  icons with text for screen readers; missing features show ✕, not low-contrast gray (NN/g).
- ❌ A taller "Pro" card marked only by a blue outline, CTAs at different heights, "/mo" at the top.
- ✅ Equal cards, a "Most popular" badge plus a 2px accent border, "$29" with "/month" on the baseline.
- **Measure:** `audit.js` SU-4, SU-16, SU-121 per band; info when plan cards' feature lists differ in order.

### SU-217 FAQ answers objections
**Rule:** 5–10 real questions in `<details>`/`<summary>` (or the APG accordion). The whole header row is
the target (NN/g), with a caret or plus at the end. Several can be open at once, and every answer is
reachable by in-page search (`hidden="until-found"` where supported).
- ❌ A single-open accordion with a 16px caret as the only target, answers hidden with `display: none`.
- ✅ A full-width `<summary>`, a trailing caret, `details` independent of each other.
- **Measure:** `audit.js` existing SU-147 checks; info on FAQ items hidden with `display: none` (not
  findable).

### SU-218 The footer is quiet and complete, not a link farm
**Rule:** only the links people look for (product, company, support, legal), in ≤ ~4 short groups under
short headings at 14px muted (≥ 4.5:1). The legal row comes last, and the primary CTA appears once more
above the footer (SU-208).
- ❌ 40 links in six columns at 11px gray on gray.
- ✅ Four groups of 4–6 links at 14px, `--text-muted` at 4.5:1 or more.
- **Measure:** contrast checks already cover it.

## Docs and articles

### SU-219 Article layout: one reading column, wider media
**Rule:** prose at 60–75ch. Figures, tables and code may break out to ~80–100ch (or full bleed for
images). Captions are 14px muted directly under their figure. A sticky TOC sits beside the column from
~1200px (SU-207). Headings have anchor links that appear on hover *and* focus.
- ❌ A 120ch text column, a figure squeezed into 50ch, anchor links only on `:hover`.
- ✅ 68ch prose, a 96ch figure, `h2:hover a, h2:focus-within a { opacity: 1 }`.
- **Measure:** `audit.js` SU-15 already measures prose width; info when figures are narrower than the
  text column.

### SU-220 Headings belong to what follows
**Rule:** space above a heading is about 1.5–2× the space below it, in prose and in sections, so each
heading groups with its content (proximity, SU-22). Paragraph spacing ≈ the line height.
- ❌ `h2 { margin: 24px 0 24px }`: the heading floats between two blocks.
- ✅ `h2 { margin: 48px 0 16px }` (margin-top ≥ 1.5× margin-bottom).
- **Measure:** `audit.js` SU-220: warn on headings whose space below is ≥ the space above (measured from
  rendered boxes, so it also catches flex `gap`).

### SU-221 Code blocks read and copy cleanly
**Rule:** mono 13–14px at line-height 1.5–1.6 and `tab-size: 2`. Overflow scrolls inside the block (never
the page, SU-170) with `tabindex="0"` and a name. A "Copy code" button announces "Copied" (SU-146). Syntax
colors are ≥ 4.5:1 on the block's background in both schemes. Wrap only prose-like blocks; shell output
stays unwrapped.
- ❌ A `pre` that widens the page at 375px, comment tokens at 2.6:1.
- ✅ `pre { overflow-x: auto; tab-size: 2 }` with `tabindex="0" aria-label="Install command"`.
- **Measure:** `audit.js` text-contrast walker already covers spans in `pre` (≥ 4.5:1); warn on `pre`
  without overflow handling.
