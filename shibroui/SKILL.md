---
name: shibroui
description: "shibroUI: this user's UI standard, from whole-screen layout down to single components. 136 rules with real numbers, a checklist and two in-page scripts: a page map (layout wireframe, focal point, hierarchy, type/color/spacing system, alignment, hidden states) and an audit (contrast, targets, focus, tables, forms, motion, every element and state). Covers layout patterns, grids, spacing rhythm, hierarchy, type scale, color and contrast, controls, 44px targets, focus, motion, radius, elevation, images and empty states. Use it whenever you create, change, polish or review UI code (HTML/CSS, Tailwind, React, Vue, Svelte): whole pages, dashboards, settings, forms, tables, modals or animations, and whenever the user wants a UI/UX review, says a screen looks off, cluttered or amateur, or wants better layout, hierarchy or overall look, even if shibroUI is not named. Its numbers can differ from generic advice, so also consult it for quick UI questions (contrast, line length, spacing, hit size, radius, duration)."
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
- **Component** (`SU-1`–`SU-118`) covers type, spacing, hierarchy, color, forms, targets, focus, motion,
  surfaces and product details.

Work top-down. Fixing a button's contrast doesn't fix a screen whose layout and hierarchy are
wrong, and polishing components on a broken structure is the most common way to "help" without
helping.

## Pick the scope

- **Whole screen** (a page, dashboard, settings, form, or anything the user calls cluttered, off or
  hard to use): use the screen workflow. Most real requests are this, even when phrased small ("make
  this dashboard look better").
- **Single component or tweak** (a button, a modal, one animation): use the component workflow.
- **Quick question**: answer from the defaults table, and cite the rule ID.

## Screen workflow (build, redesign or review)

1. **Read the screen before touching it.**
   - Render it and take screenshots at 1280×900 and 375 wide.
   - Run `scripts/page-map.js`, which returns a text wireframe of the regions, what reads first, loud
     buttons per region, the heading outline, the system in use (every font size, color, radius, shadow
     and spacing value) with budget flags, alignment and rhythm problems, card nesting, and hidden
     states.
   - Write a five-line **screen read**:
     - the job, in one sentence;
     - what reads 1st, 2nd and 3rd now;
     - the primary action;
     - the regions;
     - the states to visit.
   - When building from scratch, write the read for the screen you're about to build.
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
   6. states (empty, error, loading, open menus and dialogs).

   Keep every piece of content and every feature the user has. Restructure; don't delete.
4. **Verify like a reviewer, not an author.**
   - `page-map.js`: no `warn` flags, or each one is deliberate and explained. The first read must answer
     the job sentence.
   - `audit.js` in **every state**: the default view, then each entry in
     `coverage.hiddenStates` (open each tab, menu, accordion and dialog and run it again). Every
     `fail` is fixed, in **all** of its `instances`. Any `warn` is fixed or accepted in writing.
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
2. **Apply the defaults below.** Open only the one to three reference files the work touches (a table →
   `typography.md`; a form → `forms.md` + `accessibility.md`; a modal with motion →
   `surfaces-images.md` + `motion.md`).
3. **Fit the project's tokens.** The rules are relationships (label gap smaller than field gap, inner
   radius = outer − padding) that hold in any token set.
4. **Verify:** `node scripts/contrast.mjs <fg> <bg> [--fix]` for any doubtful color pair, plus
   `audit.js` once per state, fix, then one confirming run. Don't loop the audit to chase info items.
5. **Name the rules behind key decisions** in one line of your final message.

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
| Motion | Micro 100–200ms, panels 250–350ms, nothing routine over 500ms. Ease-out enter, ease-in exit. Interruptible transitions. Reduced-motion fallback (SU-75–85) |
| Nested corners | inner radius = max(0, outer − padding) (SU-93) |
| Elevation | Base 0 · dropdown 2 · raised card 3 · toast/modal 5 + scrim (SU-99–103) |
| Images | Fixed `aspect-ratio` + `object-fit: cover`. 1px inner outline at ~10% (SU-106–107) |
| Empty states | Why it's empty, plus one first action (SU-117) |

## Rule map

| File | Rules | Open when… |
|---|---|---|
| [references/composition.md](references/composition.md) | SU-119–136 | any whole screen: layout, grid, alignment, rhythm, hierarchy, system budgets, patterns, states |
| [references/typography.md](references/typography.md) | SU-1–17 | type sizes, fonts, line height, links, wrapping, numbers, tables |
| [references/layout-hierarchy.md](references/layout-hierarchy.md) | SU-18–39 | component spacing, widths, grouping, emphasis, buttons, optical fixes |
| [references/color.md](references/color.md) | SU-40–49 | palettes, shades, tints, charts, contrast, badges, text over images |
| [references/forms.md](references/forms.md) | SU-50–60 | checkboxes, labels, form buttons, selects, sliders, control heights |
| [references/accessibility.md](references/accessibility.md) | SU-61–71 | hit areas, icon/close buttons, focus rings, status |
| [references/motion.md](references/motion.md) | SU-72–92 | press, transitions, easing, timing, gestures |
| [references/surfaces-images.md](references/surfaces-images.md) | SU-93–107 | nested radius, elevation, modals, images |
| [references/product.md](references/product.md) | SU-108–118 | task-first, naming, consistency, empty states, borders |
| [references/checklist.md](references/checklist.md) | all | final self-check and reviews |

## Running the scripts

Both scripts are single JavaScript expressions to evaluate in the rendered page. Each returns JSON and
also sets `window.__shibroAuditResult` / `window.__shibroPageMapResult`.

- **Built-in or Chrome browser tools:** pass the file contents to the JavaScript tool. **Playwright MCP:**
  `browser_evaluate` with `() => <file contents>`.
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
- `fail` = clearly broken. `warn` = likely, so check it. `info` = look yourself. Never claim a script
  passed if you didn't run it. If no browser is available, say so and use the checklist plus
  `contrast.mjs`.

## Judgment notes

- **Structure before polish.** If page-map flags the focal point, primary actions, budgets, alignment or
  nesting, the screen needs restructuring. Recoloring a few buttons won't fix it.
- **Ranges, not points.** Aim for "ideal", accept "acceptable", never ship either extreme (30ch and 92ch
  are both wrong).
- **Don't over-apply.** Underlines are for inline content links. `user-select: none` is for option
  labels. Arcs and squash are spice. Search is for long lists.
- **Optical beats geometric** when they disagree (SU-30–39).
- **Accessibility doesn't trade off.** Keep the look and fix the mechanism (invisible hit areas, tints
  instead of gray).
