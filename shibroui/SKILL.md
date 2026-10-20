---
name: shibroui
description: "Numeric UI rules (shibroUI, 265 rules) for building, reviewing and answering questions about web interfaces, from whole pages to single components. Use it when writing or changing HTML/CSS/Tailwind/React/Vue/Svelte UI or reviewing a UI screenshot; when a screen looks off, cluttered or amateur; for landing pages and long pages, data tables, menus, dialogs, tooltips, navigation, pricing, hover and selected states, shadows, gradients and icons; and for quick design-value questions: text width and line-height, type scale, contrast, tap targets, spacing, radius, shadow, animation timing, focus rings, dark mode, form errors, loading and empty states, responsive layout, RTL. Consult it before answering UI sizing, spacing, color or motion questions from memory: its numbers differ from generic advice. Chart construction belongs to the dataviz skill."
---

# shibroUI

Interface foundations at two levels. Each rule has an ID that decisions and findings can cite, and
most carry the numbers that separate bad from good.

- **Screen** (`SU-119`–`SU-136`, [references/composition.md](references/composition.md)) covers:
  - what reads first;
  - layout pattern, grid and alignment;
  - spacing rhythm;
  - one primary action;
  - the visual system's budgets for type, color, radius and shadow;
  - every state reviewed.

  This is where "cluttered", "looks off" and "amateur" come from.
- **Long pages and page patterns** (`SU-204`–`SU-221`, [long-pages.md](references/long-pages.md),
  [patterns.md](references/patterns.md)): a page read one screen-height band at a time, landing, pricing,
  docs and article pages.
- **Component** (`SU-1`–`SU-118`, plus `SU-137` centering and `SU-203` control rows) covers type, spacing,
  hierarchy, color, forms, targets, focus, motion, surfaces and product details.
- **Component specs and states** (`SU-222`–`SU-252`): tables, navigation, menus, tooltips, dialogs,
  drawers, toasts, inputs, avatars and chips, and the interaction-state matrix (hover, pressed, selected,
  disabled).
- **Craft** (`SU-253`–`SU-264`, [craft.md](references/craft.md)): what excellent looks like, with
  numbers: layered and tinted shadows, hairlines, gradients, icons, display type, imagery, finishes.
- **Behavior and access** (`SU-138`–`SU-202`) covers what the screen does and where it must work:
  semantics and keyboard, validation, loading/error/success states, theming and dark mode, responsive and
  touch, microcopy, charts, loading performance, and other languages and directions.

Work top-down. Fixing a button's contrast doesn't fix a screen whose layout and hierarchy are
wrong, and polishing components on a broken structure is the most common way to "help" without
helping.

## Pick the scope

- **Whole screen** (a page, dashboard, settings, form, or anything the user calls cluttered, off or
  hard to use): use the screen workflow. Most real requests are this, even when phrased small ("make
  this dashboard look better").
- **Long page** (3+ screens tall: a landing page, docs, an article, a catalog, a long settings page): the
  screen workflow in **band mode** (below). Never judge a long page from one screenshot.
- **Single component or tweak** (a button, a modal, one animation): use the component workflow.
- **Quick question**: answer from the defaults table, and cite the rule ID.
- **Screenshot only** (no code at hand): use the screenshot workflow below. Measure first, then judge.

## Screen workflow (build, redesign or review)

1. **Read the screen before touching it.**
   - Load the scripts instead of pasting them (see "Running the scripts"). With Playwright available,
     `node scripts/scan.mjs <url> --out <dir>` does this step's measuring in one call: both scripts at 1280 and
     375, with the scroll sweep, and one screenshot per band.
   - Render it and take screenshots at 1280×900 and 375 wide. Run `audit.js` once at 320×640 too:
     reflow (SU-170) is only measured at widths of 400px or less.
   - Run `scripts/page-map.js`, which returns a text wireframe of the regions, what reads first, loud
     buttons per region, the heading outline, the system in use (every font size, color, radius, shadow
     and spacing value) with budget flags, alignment and rhythm problems, card nesting, and hidden
     states.
   - Write a five-line **screen read**:
     - the job, in one sentence;
     - what reads 1st, 2nd and 3rd now;
     - the primary action;
     - the regions;
     - the states to visit: the hidden ones (tabs, menus, dialogs) and the data states of each region
       (empty, loading, error, success; SU-155).
   - When building from scratch, write the read for the screen you're about to build.
   - **Band mode (long pages).** Run both scripts with `prepare: true` (scroll reveals and lazy sections
     are invisible until scrolled; without it the run reports how much it couldn't see in
     `coverage.unseen`). Read page-map's `outline`, then take one screenshot per band (scroll to
     `bands[n].y`). Replace the screen read with a **page read**: the job; the story in band order, one
     line per band; the primary action and where it repeats; bands doing the same job (merge them); the
     states. With 8+ bands, up to 4 subagents may each review a range of bands with the same tokens and
     finding format, and you merge by root cause.
2. **Plan the composition** with [references/composition.md](references/composition.md) open.
   - Pick the layout pattern.
   - Draw the target structure as an ASCII wireframe, regions in priority order.
   - Set the budgets as tokens before any component work:
     - a type scale of 6 sizes or fewer, 3 weights or fewer;
     - a palette of neutrals, one accent and semantic colors;
     - 3–4 radii, plus the elevation levels;
     - the spacing scale, with item, group and section tiers.
   - Decide the loud, strong and quiet tiers.
   - For a redesign, the before → after wireframe is the core of the change. Don't skip it to go
     straight to CSS tweaks.
3. **Build or restructure top-down:**
   1. tokens;
   2. layout (grid, regions, widths);
   3. rhythm (gaps by tier);
   4. hierarchy (demote first, then promote the focal element);
   5. components (`SU-1`–`118`, from the defaults table);
   6. states: empty, loading, error and success for each data region (references/states.md), plus open
      menus and dialogs. Build a way to show each data state (a `?state=` parameter or a dev toggle) so it
      can be audited.

   Keep every piece of content and every feature the user has. Restructure; don't delete.
4. **Verify like a reviewer, not an author.**
   - `page-map.js`: no `warn` flags, or each one is deliberate and explained. The first read must answer
     the job sentence.
   - `audit.js` in **every state**: the default view, then each entry in
     `coverage.hiddenStates` (open each tab, menu, accordion and dialog and run it again), each data
     state, and the other color scheme when `coverage.schemes.toAudit` lists one. Every `fail` is fixed,
     in **all** of its `instances`. Any `warn` is fixed or accepted in writing.
   - Keyboard pass: Tab through once, open and close each dialog, and note where focus lands (SU-143–145).
   - Compare the screenshots before and after. Squint at them: does one thing lead, and do regions
     separate without boxes?
   - Walk the "Screen" and relevant component sections of [references/checklist.md](references/checklist.md).
5. **Report top-down.**
   - Screen-level changes first: the before → after wireframe or a short list.
   - Then component fixes, grouped by region with rule IDs.
   - Then a **coverage table**: every region and every state, with what was checked, what was found
     and what was fixed.
   - An honest **Not checked** line (e.g. real screen reader, touch device). A review that silently
     skips regions is worse than one that says what it skipped.

## Component workflow (small scope)

1. **The user's explicit spec wins.** If they ask for 6 rows, ship 6 rows. The rules shape *how*, not
   *what*. Mention any trade-off in one line.
2. **Write the spec, then a specimen** for anything reusable (a button, select, tab bar, table, menu): the
   anatomy, sizes (SU-239), the state matrix (SU-248), content limits, the APG pattern, motion and tokens,
   then one page with every variant × size × state in both schemes plus long text and `dir="rtl"`. Force
   states with `data-state`/`aria-*` or `.is-hover`/`.is-active` mirror classes so the audit sees them.
   Specs for common components are in `references/components-*.md`.
3. **Apply the defaults below.** Open only the one to three reference files the work touches (a table →
   `typography.md`; a form → `forms.md` + `semantics.md`; a modal with motion →
   `surfaces-images.md` + `motion.md`; a dark theme → `theming.md`; a loading or error state →
   `states.md`).
4. **Fit the project's tokens.** The rules are relationships (label gap smaller than field gap, inner
   radius = outer − padding) that hold in any token set.
5. **Verify:** `node scripts/contrast.mjs <fg> <bg> [--fix]` for any doubtful color pair, plus
   `audit.js` on the specimen and once per state on the real screen, fix, then one confirming run. Don't
   loop the audit to chase info items.
6. **Name the rules behind key decisions** in one line of your final message.

## Screenshot workflow (no code at hand)

Vision alone reliably misses offsets under about 8px. A pill drawn 6px off its label looks "fine" at a
glance and wrong to the user. So measure before you judge:

1. **If the code exists, get it and render it.** DOM truth beats pixels: run `page-map.js` and
   `audit.js` as usual.
2. **Otherwise measure the pixels.** Run `python3 scripts/measure-png.py shot.png [--crop x,y,w,h]
   [--scale 2]` (stdlib only). It:
   - finds filled containers (pills, buttons, chips, tracks, cards) and the ink inside each;
   - reports content that sits off-center (SU-137);
   - reports the gaps between items in a row, and says when a nested pill sits closer to one
     neighbour (a mispositioned highlight);
   - reports ink contrast against the fill.

   Crop to the component. Pass `--scale` for retina screenshots (usually 2 on a Mac) to get CSS px.
3. **Then do the visual read** (hierarchy, grouping, consistency) and cite the measured numbers.
   Redundant or confusing controls (e.g. chevrons *and* yesterday/tomorrow tabs doing the same job)
   are judgment calls the tools won't make, so look for them.

## Finding format (reviews)

```
**SU-45 Text contrast** — .kpi.yellow .label (+3 more: .kpi.green .label, …): #fff on #facc15 = 1.53:1 (needs ≥ 4.5:1).
Fix: dark text #422006 on a pale tint, or neutral KPI cards (see SU-127).
```

Each finding has the rule ID, **every** instance (the audit lists them in `instances`), the measured
value against the target, and a concrete fix. Screen-level findings cite the page-map flag and say
what to restructure.

## Defaults

Use these unless the project's system says otherwise. The "why" lives in the reference files.

| Area | Default |
|---|---|
| Screen structure | One job, one focal point, one filled primary action per view. Page header = title + primary action. Chrome quieter than content (SU-119–121, SU-134) |
| Layout | A known pattern (dashboard, settings, list/detail, table, form, landing). 12-col grid, 24px gutters (16 on mobile), 24–32px page margins, content max 1200–1320px, sidebar 220–280px fixed (SU-122–123) |
| Alignment | Few shared edges; no 1–3px near-misses. Cards in a row share top and height (SU-124, SU-132) |
| Spacing | Scale 4·8·12·16·24·32·48·64. Tiers: item 4–12, group 16–24, section 32–48 (64–128 marketing). Equal gaps between siblings (SU-125) |
| Budgets | ≤ 6 font sizes, ≤ 3 weights, ≤ 2 families. Neutrals + 1 accent + semantic. ≤ 3–4 radii. Shadows only at elevation levels (SU-126–128) |
| Containers | Group with space and headings first, dividers second, cards last. Never card in card in card (SU-130) |
| Headings | One h1. No skipped levels. Deeper headings never larger. Every titled region has a real heading (SU-129) |
| Type scale | Steps mapped to roles (e.g. 12/14/16/20/28). Heading clearly larger than body (SU-1) |
| Body text | 16px, line-height ~1.5 (1.4–1.6). Headings 1.1–1.25 (SU-5) |
| Reading width | Prose `max-width: 65ch` (60–75ch OK) (SU-15) |
| Alignment in text | Prose left. Table text left, numbers right, headers match their column (SU-7, SU-17) |
| Numbers | `font-variant-numeric: tabular-nums` for anything that changes or is compared (SU-16) |
| Wrapping | Headings `text-wrap: balance`, paragraphs `pretty`, URLs `overflow-wrap: anywhere` (SU-12–14) |
| Links | Inline content links underlined. Link text names the destination (SU-6, SU-9) |
| Card spacing | 24px padding, 12px between related text. 16px is the padding floor (SU-18) |
| Grouping | Label → field 8px. Field → field 24px (SU-22) |
| Hierarchy | Demote siblings before enlarging the hero. Keep sizes in a modest range (SU-24–26, SU-131) |
| Actions | Secondary is outline/neutral. Destructive is tertiary in normal screens and primary-danger only inside its confirmation (SU-29) |
| Contrast | Text ≥ 4.5:1 (large ≥ 3:1). Button labels ≥ 4.5:1 on their fill. Fields differ from their surface (SU-44–46) |
| Color | Secondary text on colored surfaces = a light tint of that hue. Status badges = dark text on a pale tint (SU-47–48) |
| Status | Color + icon + text, never color alone (SU-71) |
| Controls | Input and adjacent button share one height (40px default). One height per row (SU-58–60) |
| Targets | Hit area ≥ 44×44 (extend with `::before`; mind the border, see SU-61). ≥ 8px between neighbours (SU-61–69) |
| Focus | `:focus-visible { outline: 2px solid <accent>; outline-offset: 2px }` (SU-70) |
| Press | `:active { transform: scale(0.97) }` about 200ms (SU-72) |
| Motion | Micro 100–200ms, UI transitions ≤ 300ms, panels and dialogs ≤ 500ms. Ease-out to enter and for state changes, short exits, never ease-in on hover or press. Stagger 30–80ms. Interruptible transitions. Reduced-motion fallback (SU-75–85) |
| Centering | Labels centered in pills, buttons and chips (±2px; icon side ~4px less). Selection highlights take position and width from the selected item (SU-137) |
| Control rows | Equal gaps (±1px), symmetric flanking chevrons, the selected pill inset equally on all sides; mixed text sizes share a baseline (SU-203, SU-4) |
| Nested corners | inner radius = max(0, outer − padding) (SU-93) |
| Elevation | Base 0 · dropdown 2 · raised card 3 · toast/modal 5 + scrim. z-index tokens 0/100/200/300/400/500/600, or the top layer (SU-99–103) |
| Images | Fixed `aspect-ratio` + `object-fit: cover`. 1px inner outline at ~10% (SU-106–107) |
| Empty states | Why it's empty, plus one first action (SU-117) |
| Semantics | Native elements first. Every control named (icon buttons get `aria-label`). One `main`, `lang`, a real `<title>`. Focus moves into dialogs and back; sticky bars never cover it (SU-138–147) |
| Forms | Label above every field, hints outside it. Validate on blur or submit, never while typing. Error = icon + text by the field, linked with `aria-describedby`; summary on submit. Submit stays enabled. Right `autocomplete` (SU-148–154) |
| States | Each data region designs empty, loading, error and success. Nothing under 200ms; skeleton that matches the layout for 1–10s. Errors say what and what next, with Retry, in place. Toasts ~5s, never errors (SU-155–161) |
| Copy | Buttons are verb + object, sentence case. Errors say what happened and how to fix it. Confirmations name the action and consequence (SU-178–184) |
| Theme | Semantic tokens only. Dark base ~#121212–#1c1c1e, lighter surfaces for elevation, every pair ≥ target in both schemes, `color-scheme` set, borders/outlines that survive forced colors (SU-162–169) |
| Responsive | No sideways scroll at 320px. Zoom never blocked. Nothing hover-only. Fields ≥ 16px on phones. `100dvh`. Bottom bar of 3–5 labeled items (SU-170–177) |
| Charts | Title states the takeaway. Series ≥ 3:1 and not color-only. Text ≥ 12px. Named, with a table view. Construction → dataviz skill (SU-185–191) |
| Loading | Media sized (width/height or aspect-ratio), `font-display` set, hero image not lazy, only transform/opacity animate (SU-192–196) |
| Languages | Logical properties and `dir`. Labels grow (+40%, short strings ×2–3). Truncation always revealable, never on actions or errors. `Intl` formatting (SU-197–202) |
| Long pages | One lead per band; ≤ 2 identical section layouts in a row; one primary CTA label, repeated; sticky header ≤ 64px (72 marketing) with `scroll-margin-top`; TOC on long reads, "Back to top" past 4 screens; reveals never hide content (SU-204–211) |
| Page patterns | Hero: ≤ ~10-word headline, ≤ 2 CTAs, the product in view. Pricing: 3–4 equal-height plans, recommended marked by text and border. Space above a heading ≈ 1.5–2× below (SU-212–221) |
| Control sizes | sm 32 · md 40 · lg 48px tall; text 13–14 / 14–16 / 16; icons 16 / 16–20 / 20–24; inline padding 12 / 16 / 20 (SU-239) |
| Components | Page header: title + primary + ≤ 2 secondary, the rest in "More". Table rows 32/40/48, sticky header and first column, stacked rows on phones; menus 32–40px items, 160–288px wide, ≤ 12 items; tooltips ≤ ~75 chars, never on disabled; dialogs ~400/600/960px, ≤ 90vh; side panels 320–480; toasts in one corner, ≤ 3 (SU-222–247) |
| Interaction states | Design every state; states change paint, not layout (reserve bold width); every state keeps 4.5:1; selected is obvious without color; disabled says why (SU-248–252) |
| Craft | Layered, tinted shadows (black ≤ 0.25); alpha hairlines; gradients `in oklch`; one icon family and stroke, icons 1–1.25× text; display type −0.02 to −0.04em, leading 1.0–1.1; crisp 2× product shots (SU-253–264) |
| Across routes | One page-header pattern, one set of tokens, no value used on only one route (SU-265) |

## Rule map

| File | Rules | Open when… |
|---|---|---|
| [references/composition.md](references/composition.md) | SU-119–136, 265 | any whole screen: layout, grid, alignment, rhythm, hierarchy, system budgets, states, consistency across routes |
| [references/long-pages.md](references/long-pages.md) | SU-204–211 | pages of 3+ screens: bands, section variety, false floor, sticky header and anchors, repeated CTA, scroll reveals |
| [references/patterns.md](references/patterns.md) | SU-212–221 | layout patterns (dashboard, settings, list/detail, table, form, landing), hero, proof, features, bento, pricing, FAQ, footer, articles, code blocks |
| [references/typography.md](references/typography.md) | SU-1–17 | type sizes, fonts, line height, links, wrapping, numbers, tables |
| [references/layout-hierarchy.md](references/layout-hierarchy.md) | SU-18–39, 137, 203 | component spacing, widths, grouping, emphasis, buttons, optical fixes, centering, highlights, control rows |
| [references/color.md](references/color.md) | SU-40–49 | palettes, shades, tints, charts, contrast, badges, text over images |
| [references/forms.md](references/forms.md) | SU-50–60, 148–154 | checkboxes, labels, form buttons, selects, sliders, control heights, validation, errors, autofill |
| [references/accessibility.md](references/accessibility.md) | SU-61–71 | hit areas, icon/close buttons, focus rings, status |
| [references/motion.md](references/motion.md) | SU-72–92 | press, transitions, easing, timing, gestures |
| [references/surfaces-images.md](references/surfaces-images.md) | SU-93–107 | nested radius, elevation, modals, images |
| [references/product.md](references/product.md) | SU-108–118 | task-first, naming, consistency, empty states, borders |
| [references/semantics.md](references/semantics.md) | SU-138–147 | landmarks, names, alt text, ARIA, keyboard order, focus management, live regions, widget patterns |
| [references/states.md](references/states.md) | SU-155–161 | loading, skeletons, busy buttons, optimistic updates, errors, success, toasts |
| [references/theming.md](references/theming.md) | SU-162–169 | tokens, OKLCH, dark mode, both schemes, forced colors, contrast/transparency preferences |
| [references/responsive.md](references/responsive.md) | SU-170–177 | reflow at 320, zoom, text spacing, breakpoints, container queries, hover-only, touch, mobile nav |
| [references/content.md](references/content.md) | SU-178–184 | button labels, sentence case, error wording, confirmations, numbers/dates, sample content |
| [references/dataviz.md](references/dataviz.md) | SU-185–191 | charts inside a screen: takeaway titles, honest scales, mark contrast, chart text, text alternatives |
| [references/performance.md](references/performance.md) | SU-192–196 | layout shift, fonts, hero images, long lists, layout-property animation |
| [references/international.md](references/international.md) | SU-197–202 | RTL, mirroring, text expansion, truncation, script-aware type, Intl formatting |
| [references/components-data.md](references/components-data.md) | SU-222–227 | data tables, row actions, pagination, filters |
| [references/components-navigation.md](references/components-navigation.md) | SU-228–232 | sidebar, top nav and mega menus, tabs, breadcrumbs, command palette |
| [references/components-overlays.md](references/components-overlays.md) | SU-233–238 | menus, tooltips, popovers, dialogs, side panels, toasts |
| [references/components-inputs.md](references/components-inputs.md) | SU-239–247 | control sizes, the component spec and specimen, switches, choosing a control, dates, upload, search, avatars, chips, shortcuts |
| [references/interaction.md](references/interaction.md) | SU-248–252 | hover, pressed, selected, disabled and read-only states |
| [references/craft.md](references/craft.md) | SU-253–264 | shadows, hairlines, gradients, icons, neutrals, display type, imagery, logos, glows, whitespace, finishes |
| [references/checklist.md](references/checklist.md) | all | final self-check and reviews |

## Running the scripts

Both scripts are single JavaScript expressions to evaluate in the rendered page. Each returns JSON and
also sets `window.__shibroAuditResult` / `window.__shibroPageMapResult`.

- **Load them; don't paste them.** `audit.js` is about 40k tokens. Start `node scripts/serve.mjs` once
  in the background, then run one line in the page:
  `await fetch('http://127.0.0.1:4399/audit.js').then((r) => r.text()).then((s) => (0, eval)(s))` (same for
  `page-map.js`). Set options in the same call: `window.__shibroAudit = { prepare: true }; await fetch(…)`.
  Paste the file contents only when the page's CSP blocks the fetch or `eval` (the loader throws a CSP
  error). **Playwright MCP:** `browser_evaluate` with the same async function.
- **Headless:** `node scripts/scan.mjs <url> [--widths 1280,375] [--out dir]` runs both scripts with the
  sweep and saves `band-NN.png` screenshots and the JSON per width (needs `playwright-core`).
- **`prepare: true`** (both scripts) scrolls the page once before measuring and makes the result a
  Promise. Use it on every long page; `coverage.unseen` says what was still hidden.
- **`band: n`** (audit) scopes to page-map's band `n`. **Root-cause findings** (`rootCause: true`) are one
  fix for every group listed in `groups`. When `instancesSampled` is set, `instances` is a sample of
  `count`: fix the pattern.
- **Across routes:** save each route's page map and run `node scripts/compare-maps.mjs a.json b.json …`
  for values used on only one route (SU-265).
- **Serve the page over local HTTP** (tools refuse `file://`), **use a real viewport** (a hidden pane
  is 0×0, and both scripts return an `error` saying so), and **open your own tab** (other agents may share
  the browser).
- **`page-map.js`**: run it before planning and after building. Read `wireframe.map` together with the
  screenshot. `flags` are evidence for judgment. `hierarchy.firstRead` should answer the job.
  `states` lists everything hidden.
- **`audit.js`**: `findings[].instances` lists every element with that problem, so fix them all.
  `coverage.checked` / `skipped` / `capsHit` show what was and wasn't measured. `coverage.hiddenStates`
  is your to-do list of states to open and re-run. With a modal open it audits only the modal. On
  very large pages, scope with `window.__shibroAudit = { root: '<region selector>' }` and run per region.
  `coverage.schemes` says whether dark styles exist and which scheme still needs a run. Set
  `window.__shibroAudit = { textSpacing: true }` once to test WCAG text spacing (SU-172). Run once at
  320×640 for reflow (SU-170).
- **`measure-png.py`**: for screenshots when there's no DOM (see the screenshot workflow). It measures
  pixels rather than CSS, so pass `--scale` and crop to the component.
- `fail` = clearly broken. `warn` = likely, so check it. `info` = look yourself. Never claim a script
  passed if you didn't run it. If no browser is available, say so and use the checklist plus
  `contrast.mjs`.

## Hand off to other skills

shibroUI is the numbers and measurement authority. For these, follow the specialist skill and keep
shibroUI's checks:
- chart form, palette and marks → **dataviz**;
- gesture physics, springs and materials → **apple-design**;
- aesthetic direction and brand look → **frontend-design** (shibroUI still owns the craft numbers,
  SU-253–264, and measures them);
- a sweep for generated-UI tells → **impeccable**.

## Judgment notes

- **Structure before polish.** If page-map flags the focal point, primary actions, budgets, alignment or
  nesting, the screen needs restructuring. Recoloring a few buttons won't fix it.
- **A long page is many screens.** Each band needs a lead and a reason to exist; three identical bands in
  a row are a template, not a story. Read the outline before any band.
- **Ranges, not points.** Aim for "ideal", accept "acceptable", never ship either extreme (30ch and 92ch
  are both wrong).
- **Don't over-apply.** Underlines are for inline content links. `user-select: none` is for option
  labels. Arcs and squash are spice. Search is for long lists.
- **Optical beats geometric** when they disagree (SU-30–39).
- **Accessibility doesn't trade off.** Keep the look and fix the mechanism (invisible hit areas, tints
  instead of gray).
