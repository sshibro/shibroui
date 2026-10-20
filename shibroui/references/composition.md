# Screen composition (SU-119 – SU-136, SU-265)

Component rules (SU-1–118) make each piece right. These rules make the *screen* right: what reads
first, how regions are laid out, how space separates groups, and whether the whole thing looks like one
system. Most "it looks off / cluttered / amateur" complaints are screen-level, so fix these before
polishing components. `scripts/page-map.js` measures most of them.

- [Read the screen first](#read-the-screen-first) SU-119–121
- [Layout structure](#layout-structure) SU-122–124
- [Space and rhythm](#space-and-rhythm) SU-125
- [Hierarchy across the screen](#hierarchy-across-the-screen) SU-129, SU-131
- [One visual system](#one-visual-system) SU-126–128
- [Containers, rows and chrome](#containers-rows-and-chrome) SU-130, SU-132, SU-134
- [Responsive and states](#responsive-and-states) SU-133, SU-135, SU-136
- [Layout patterns](#layout-patterns): in [patterns.md](patterns.md)
- [Across screens](#across-screens) SU-265

## Read the screen first

### SU-119 One job, one focal point
**Rule:** every screen has one job, and one element (or one group of peers) reads first.
- ❌ A promo banner, a page title and four rainbow KPI tiles all shout at the same volume. The eye
  bounces and nothing leads.
- ✅ The thing that serves the job (the key metric, the form, the list) is the loudest. Everything
  else steps down.
- **Measure:** page-map `hierarchy.top`: the top style tier should be a single element or a single
  group of identical peers (e.g. 4 KPI numbers). Two *different* styles tied for first is a conflict.
- **Do:** write the job in one sentence ("see this month's revenue and act on overdue invoices"). The
  loudest element should be the answer to that sentence.

### SU-120 Reading order matches importance
**Rule:** the most important content comes first in visual order (top-left in LTR), and chrome stays
quieter than content.
- ❌ Filters, banners and toolbars push the main content below the fold. The primary action is a small
  link at the bottom.
- ✅ Page header (title + primary action) → key content → secondary content → details. The primary
  action sits in the page header or next to what it acts on.
- **Measure:** page-map `aboveFold`. Is the focal point plus the primary action inside the first
  viewport?

### SU-121 One primary action per view
**Rule:** one filled, high-contrast button per view or region. Everything else is secondary (outline or
neutral) or tertiary (text).
- ❌ Five filled accent buttons in a toolbar (Filter, Export, Share, Refresh, Create).
- ✅ "Create report" filled. Export and Share secondary. Refresh is an icon button.
- **Measure:** page-map `hierarchy.loudButtons` per region. More than one distinct loud label in a
  region is a flag. A repeated row action (e.g. "Pay" on every row) counts once.

## Layout structure

### SU-122 Pick the layout pattern for the task
**Rule:** start from a known pattern (see [patterns.md](patterns.md)), then adapt it. Don't
invent a structure per screen.
- **Why:** patterns encode reading order and density that users already know. A dashboard, a
  settings page and a landing page have different jobs and different shapes.

### SU-123 Grid, margins and content width
**Rule:** content sits on a consistent grid: page margins, column gutters and a max content width.
- **Defaults:**
  - **Grid:** 12 columns.
  - **Gutters:** 24px on desktop, 16px under 768px.
  - **Page margins:** 24–32px on desktop, 16px on mobile.
  - **App content:** `max-width` 1200–1320px.
  - **Prose:** 65ch.
  - **Forms:** 480–640px.
- **Sidebars:**
  - App navigation is fixed at 220–280px, never a percentage (SU-20).
  - Detail panels are 320–400px.
- **Card grids:** `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` with the gutter as `gap`.
- **Measure:** page-map `system.spacing` (gutters and margins), `alignment.edges`.

### SU-124 Shared edges
**Rule:** every block aligns to something. Few alignment lines, and no near-misses.
- ❌ Section titles at x=24, cards at x=26, the table at x=28. The page looks sloppy without anyone
  knowing why.
- ✅ All main-column content shares one left edge, and columns share their own edges.
- **Measure:** page-map `alignment.nearMisses`. Edges 1–3px apart are almost always mistakes.
- **Do:** give every section the same horizontal padding (one token) and avoid one-off margins.

## Space and rhythm

### SU-125 Spacing scale and three-tier rhythm
**Rule:** every spacing value comes from one scale, and space grows with the size of the boundary it marks.

| Tier | Separates | App UI | Marketing |
|---|---|---|---|
| Item | label↔field, icon↔text, lines in a group | 4–12px | 8–16px |
| Group | fields, cards, list rows, blocks inside a section | 16–24px | 24–32px |
| Section | page sections, major regions | 32–48px | 64–128px |

- **Scale:** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128.
- ❌ Gaps of 9, 13, 22 and 40px between sibling sections, and a section gap smaller than the gap inside
  it.
- ✅ Equal gaps between siblings of the same kind, and each tier at least ~1.5× the tier below.
- **Measure:** page-map `system.spacing.offScale` (values off the scale) and `rhythm` (uneven sibling
  gaps).

## Hierarchy across the screen

### SU-131 Three tiers, no more
**Rule:** visible emphasis has three tiers:
- **Loud:** one focal element or peer group.
- **Strong:** section titles and key labels.
- **Quiet:** body, metadata and chrome.

Use size for tier 1, weight and ink color for tier 2, and muted color for tier 3.
- ❌ Seven different "loud" styles (big gradient banner, 30px numbers, 26px title, colored tiles, bold
  red alerts, filled buttons, 20px card titles) all compete.
- ✅ One loud tier, a consistent strong style for every section title, and everything else quiet.
- **Measure:** page-map `hierarchy.loudTier`. Flagged when 4 or more different styles sit within 50%
  of the top visual weight.
- **Do:** demote before you promote (SU-26). Mute chrome and metadata, unify section titles, and only
  then size up the focal element if it still doesn't lead.

### SU-129 Heading outline mirrors the layout
**Rule:** one `h1`, no skipped levels, deeper headings never render larger than shallower ones, and
every titled region has a real heading.
- ❌ `h1` 18px, section titles as `h3` (skipping `h2`), a card `h2` at 24px (bigger than the `h1`),
  and three panels with no heading at all.
- ✅ `h1` page title. `h2` per section at one shared style. `h3` for card titles inside sections.
- **Measure:** page-map `headings.flags`.

## One visual system

The "overall look" mostly comes from how *few* distinct values a screen uses. Every extra size,
color, radius or shadow is a small inconsistency the eye registers as clutter.

### SU-126 Type budget
**Rule:**
- At most **6 font sizes** (e.g. 12 · 14 · 16 · 20 · 24 · 32) and **3 weights** (e.g. 400 · 500 · 600).
- At most **2 families** (one UI face, plus optionally a mono or display face).
- No near-duplicate sizes (14 and 15px).
- **Measure:** page-map `system.fontSizes`, `fontWeights`, `fontFamilies` and their flags.

### SU-127 Color budget
**Rule:**
- **Palette:** neutrals (about 4–6 text/surface/border steps), **one** accent, and semantic colors only
  for status. Text colors in use stay at about 8 or fewer: 2–3 neutrals, inverse, accent, and a few
  semantic ones.
- **No near-duplicates:** grays like `#333`, `#343434` and `#3a3a3a` should not coexist.
- **Accent area:** keep accent-colored surfaces to a small share of the screen. Colored KPI tiles
  in four hues are "rainbow" (and usually fail contrast).
- **Measure:** page-map `system.textColors`, `backgrounds`, `nearDuplicateColors`, `accentHues`.

### SU-128 Shape and depth budget
**Rule:**
- **Radii:** at most 3–4 values: control (6–8px), surface (12–16px), pill (999px), plus nested
  values from SU-93.
- **Shadows:** at most the elevation levels in use (usually 2–3 on one screen).
- **Borders:** one width (1px) and 1–2 colors.
- **Icons:** one style, at 16/20/24px.
- **Measure:** page-map `system.radii`, `shadows`, `borderColors`.

## Containers, rows and chrome

### SU-130 Group with space before boxes
**Rule:** separate groups with space and a heading first, a divider second, and a card only when the
group is independent or interactive. Never nest cards three deep.
- ❌ Panel → card → inner card → bordered list item. Four boundaries say the same thing, and the
  content shrinks inside the padding.
- ✅ A section with a heading and rows separated by space or dividers. Cards only for repeated,
  independent items.
- **Measure:** page-map `containers.deepNesting` (a surface inside two or more surfaces), and
  `containers.cardShare`.

### SU-132 Rows align
**Rule:** items in a row share a top edge and height, and their internal parts line up (titles with
titles, numbers with numbers, actions with actions).
- ❌ KPI tiles 3px out of line, and card heights of 172, 188 and 160px in one row.
- ✅ `align-items: stretch` on the row, with each card's footer pinned to the bottom (`margin-top: auto`).
- **Measure:** page-map `rows`.

### SU-134 Quiet chrome, clear location
**Rule:** navigation, toolbars and filters are quieter than content.
- **Location:** the current location is always marked (SU-26).
- **Primary nav:** shows at most about 7 items.
- **Overflow:** rare actions move into a "More" menu. A page header shows the title, the primary action and
  at most two secondary actions; Export, Print and other occasional actions go in "More" (`⋯`, named).
- **Measure (header actions):** `audit.js` SU-134 (info): a page-header row with the `h1` and more than 3 buttons.
- **Header height:** 56–64px for app headers. Don't stack banner + toolbar + filter bar above the content.

## Responsive and states

### SU-133 Density fits the task, and whitespace is distributed
**Rule:** data tools can be dense, but the density must be even. Avoid dead zones next to cramped
corners. Balance column heights, and don't leave one column half-empty while the other overflows.

### SU-135 The layout collapses in priority order
**Rule:** on narrow screens the focal point and primary action come first.
- **Sidebar:** becomes a top bar or a drawer.
- **Multi-column grids:** stack in reading order.
- **Wide tables:** become stacked rows or scroll inside their own container.
- **Measure:** run page-map and audit at 375px as well as 1280px.

### SU-136 Every state is reviewed
**Rule:** a screen isn't reviewed until its hidden states are. That means tabs, menus, accordions,
dialogs, sheets, empty, loading and error states.
- **Measure:** `audit.js` `coverage.hiddenStates` and page-map `states` list containers that weren't
  visible. Open each, re-run, and say explicitly which ones you couldn't reach.

## Layout patterns

The starting patterns (dashboard, settings, list/detail, data table admin, form, landing) and the page
patterns for marketing, pricing and docs live in [patterns.md](patterns.md).

## Across screens

### SU-265 One system across screens
**Rule:** the same role looks the same on every route. One page-header pattern, one set of tokens, and no
value (font size, color, radius, shadow, control height) that only one route uses: promote it to a token
or remove it.
- ❌ Billing has a second button style and a 13px size; Reports builds its page header as a split while
  every other route stacks title and action.
- ✅ Every route's page header has the same fingerprint, and the union of values across routes stays in
  the SU-126–128 budgets.
- **Why:** budgets are checked per screen, but products drift *between* screens, one exception at a
  time.
- **Measure:** save each route's page map (or `scripts/scan.mjs` output) and run
  `node scripts/compare-maps.mjs a.json b.json …`: it lists values used on only one route, page headers
  built differently, and the union against the budgets.
