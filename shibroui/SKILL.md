---
name: shibroui
description: "shibroUI: this user's UI standard. 118 concrete foundation rules with real numbers, a review checklist and a browser audit script. Covers type scale, line height and length, wrapping, tabular numbers and table alignment, spacing and grouping, hierarchy, optical alignment, palettes and WCAG contrast, form controls and control heights, 44px targets, focus rings, status signals, press feedback, easing, timing, interruptible motion, nested radius, elevation, image framing, empty states and naming. Use it whenever you create, change, polish or review UI code (HTML/CSS, Tailwind, React, Vue, Svelte): components, pages, dashboards, tables, forms, modals, menus, toasts or animations, and whenever the user wants a UI/UX review or an interface to look or feel better, even if shibroUI is not named. Its numbers can differ from generic advice, so also consult it before answering quick UI questions such as what contrast, line length, spacing, hit size, radius or animation duration to use."
---

# shibroUI

A set of interface foundations distilled from 118 bad-vs-good examples. Every rule has an ID
(`SU-1` … `SU-118`) so decisions and review findings can cite it, and most rules carry the actual
numbers that separate "bad" from "good". The aim is interfaces that are readable, scannable, easy to
hit, honest about state and calm in motion, without anyone having to re-argue the basics each time.

## Two ways to use it

### When building or changing UI

1. **The user's explicit spec wins.** If they ask for 6 rows, ship 6 rows. If they name a color, use
   it. The rules shape *how* you build what was asked, not *what* gets built. When a rule conflicts with
   the request, follow the request and mention the trade-off in one line.
2. **Apply the defaults below while you write.** They settle most decisions without opening anything
   else.
3. **Open only the one to three reference files the work touches** (see the map). A data table needs
   `typography.md` and maybe `forms.md`. A modal with animation needs `surfaces-images.md` and
   `motion.md`. A form needs `forms.md` and `accessibility.md`. Don't read all of them: the defaults
   table already summarizes them, and every extra file is context you pay for on every later step.
4. **Fit the rules to the project.** If the project has tokens or a design system, express each rule
   with its existing tokens instead of inventing new values. The rules describe relationships (label gap
   smaller than field gap, inner radius = outer − padding), and those hold in any token set.
5. **Verify before you say you're done.**
   - Unsure about a color pair? `node scripts/contrast.mjs <fg> <bg>`. Add `--fix` to get the nearest
     passing color in the same hue.
   - If you can render the page in any browser tool, evaluate `scripts/audit.js` in it (see
     "Running the audit"). Budget it: one run per state (default, plus each open menu or modal), fix
     everything it reports, then one confirming run per state. Fix every `fail`, and fix or
     consciously accept each `warn`. If the confirming run still shows something, fix it and stop. Don't
     loop the audit to chase info items.
   - Walk the part of `references/checklist.md` that matches what you built.
6. **In your final message, name the rules behind the key decisions in one line** (for example "amounts
   right-aligned with tabular figures (SU-16/17), 44px hit areas (SU-61)"). This lets the user see the
   reasoning and push back. Don't write an essay.

### When reviewing or auditing UI

1. Read the code and render it if you can. Run `scripts/audit.js` for the measurable issues.
2. Walk `references/checklist.md` for everything a script can't judge: hierarchy, wording,
   consistency, motion feel.
3. Report findings ordered by impact: readability and accessibility blockers first, then
   hierarchy and layout, then polish. Use this shape for each finding:

   ```
   **SU-45 Text contrast**: `.hint` #9CA3AF on #FFFFFF is 2.54:1 (needs ≥ 4.5:1).
   Fix: #6B7280 (4.83:1).
   ```

   Every finding gives the rule ID, where the problem is (selector or element), the measured value
   against the target, and a concrete fix. A finding with no fix or no measurement is just a vibe.
4. If asked to fix: make the changes, rerun the audit, and list the changes by rule ID.

## Defaults

Use these unless the project's system says otherwise. The "why" for each lives in the reference files.

| Area | Default |
|---|---|
| Type scale | A few rem steps mapped to roles (e.g. 12/14/16/20/24/32). Heading clearly larger than body; body text never smaller than supporting text (SU-1) |
| Body text | 16px, line-height ~1.5 (1.4–1.6). Headings 1.1–1.25 (SU-5) |
| Reading width | Prose `max-width: 65ch` (60–75 OK, never ~30 or 90+) (SU-15) |
| Alignment | Prose left-aligned. Table text left, comparable numbers right, headers aligned with their column (SU-7, SU-17) |
| Numbers | `font-variant-numeric: tabular-nums` for anything that changes or is compared (SU-16) |
| Wrapping | Headings `text-wrap: balance`, paragraphs `text-wrap: pretty`, URLs `overflow-wrap: anywhere` (SU-12–14) |
| Tracking | Large display −0.01 to −0.02em. Small uppercase labels +0.04 to +0.08em. Body untouched (SU-8) |
| Links | Inline content links underlined. Link text names the destination ("Billing settings", never "Click here") (SU-6, SU-9) |
| Spacing | Compact card: 24px padding, 24px between sections, 12px between related text. 16px is the floor for padding (SU-18) |
| Grouping | Label → field gap 8px; field → next field 24px (SU-22) |
| Hierarchy | One loud thing per view. Mute siblings (color/weight) before enlarging the hero. Keep sizes within a modest range (SU-24–26) |
| Actions | One primary per view. Secondary is quieter. Destructive is tertiary in normal screens and primary-danger only inside its confirmation (SU-29) |
| Contrast | Text ≥ 4.5:1 (aim 7:1). Large text (≥24px, or ≥18.66px bold) ≥ 3:1. Button labels ≥ 4.5:1 on their fill. Fields must differ from their surface (SU-44–46) |
| Color | Neutral + primary + semantic families with shade steps. Secondary text on a colored surface uses a light tint of that hue, not gray (SU-40–42, SU-47) |
| Status | Color + icon + text, never color alone. Badges: dark text on a pale tint (SU-48, SU-71) |
| Controls | An input and its adjacent button share one height (40px is a good default). All buttons in a row share a height (SU-58–60) |
| Targets | Hit area ≥ 44×44px (extend with padding or `::before` so the icon stays small). ≥ 8px between neighbours. Never overlapping (SU-61–69) |
| Focus | `:focus-visible { outline: 2px solid <accent>; outline-offset: 2px }`. Never `outline: none` without a replacement (SU-70) |
| Press feedback | `:active { transform: scale(0.97) }`, about 200ms (keep within 0.95–0.98) (SU-72) |
| Motion timing | Tooltips ~140ms in / 100ms out. Small UI 150–250ms. Panels and sheets 250–350ms. Nothing routine over 500ms (SU-85) |
| Easing | Enter: ease-out. Exit: ease-in. Move: ease-in-out `cubic-bezier(.645,.045,.355,1)`. `linear` only for progress and spinners (SU-82) |
| Interruptible | Open/close with transitions (or springs/WAAPI) that reverse from the current state, not one-shot keyframes (SU-75–77) |
| Reduced motion | Every animation has a `prefers-reduced-motion: reduce` fallback (an instant change or opacity only) (SU-78) |
| Nested corners | inner radius = max(0, outer radius − padding) (SU-93–98) |
| Elevation | Base cards 0 · dropdowns/popovers 2 · raised cards 3 · toasts/notifications 5 · modals 5 plus a dimming scrim (SU-99–103) |
| Images | Fixed `aspect-ratio` + `object-fit: cover`. A 1px inner outline at ~10% opacity (black on light, white on dark) (SU-106–107) |
| Empty states | Say why it's empty plus one clear first action. Hide filters and tabs until there's content (SU-117) |

## Rule map

| Area | Rules | Open when you're touching… |
|---|---|---|
| [references/typography.md](references/typography.md) | SU-1–17 | type sizes, fonts, line height, links, wrapping, paragraphs, numbers, tables |
| [references/layout-hierarchy.md](references/layout-hierarchy.md) | SU-18–39 | spacing, widths, sidebars, responsive sizing, grouping, emphasis, buttons, icon/text optical fixes |
| [references/color.md](references/color.md) | SU-40–49 | palettes, shades, tints, charts, contrast, badges, text over images |
| [references/forms.md](references/forms.md) | SU-50–60 | checkboxes, radios, labels, form buttons, selects, sliders, option cards, control heights |
| [references/accessibility.md](references/accessibility.md) | SU-61–71 | hit areas, icon buttons, close buttons, carousels, focus rings, status indicators |
| [references/motion.md](references/motion.md) | SU-72–92 | press states, transitions, easing, timing, drag/swipe gestures, feedback animations |
| [references/surfaces-images.md](references/surfaces-images.md) | SU-93–107 | nested radius, shadows, dropdown/card/toast/modal layering, photos, icons, user uploads |
| [references/product.md](references/product.md) | SU-108–118 | starting a new screen, naming, consistency, tone, list markers, accents, backgrounds, empty states, borders |
| [references/checklist.md](references/checklist.md) | all | final self-check and reviews |

## Running the audit

`scripts/audit.js` is one JavaScript expression. Evaluated in a rendered page, it returns a JSON
report of measurable violations: text contrast, field visibility, hit-area size and spacing, focus
rings, table number alignment and tabular figures, control-height mismatches, nested-radius errors,
line length, centered paragraphs, line height, vague or invisible links, distorted images, unlabeled
checkboxes, modal elevation and backdrop, and CSS motion (long durations, linear easing, press scale,
shake amplitude, missing reduced-motion).

- **Built-in browser / Chrome tools:** pass the file's contents to the JavaScript tool as-is.
- **Playwright MCP:** `browser_evaluate` with `() => <file contents>`.
- **Options:** set `window.__shibroAudit = { root: 'main' }` first to scope it to a part of the page.
- **Serve it, size it, own the tab.** Most browser tools refuse `file://` pages, so serve the folder
  over a local HTTP server. Use a real viewport. A hidden pane reports 0×0, and the audit returns an
  `error` telling you to set a size (e.g. 1280×900). Open your own tab rather than navigating one you
  didn't open, because other agents may be using the same browser.
- **States:** with a modal open, it audits only the modal (the page behind it is inert). Audit the
  closed page and each open state separately.

Treat its output as evidence, not a verdict. `fail` means a rule is clearly broken. `warn` means
likely, so check it. `info` means look at it yourself. It can't judge hierarchy, tone, motion feel or
anything not currently visible, so pair it with the checklist. If no browser is available, say so and
rely on the checklist plus `contrast.mjs`. Don't claim the audit passed if you didn't run it.

## Judgment notes

- **Ranges, not single points.** Many rules came from sliders where both ends are wrong: 30ch and 92ch
  are bad, while 65ch is ideal and 75ch acceptable. Aim for "ideal", accept "acceptable", and never ship
  either extreme.
- **Don't over-apply.** Underlines are for inline content links, not navigation or buttons.
  `user-select: none` is for option labels, not content. Arcs, overlap and squash are spice for
  moments that need clarity, not defaults for every transition. Search is for long lists, not five
  options.
- **Optical beats geometric when they disagree** (SU-30–39). Start with the measured value, look at it,
  then nudge (icon-side padding, play-icon offset, cap-height labels).
- **Accessibility rules don't trade off.** Contrast, focus visibility, target size, non-color status
  and reduced motion aren't style choices. If a requested design breaks one, keep the look and fix
  the mechanism (e.g. an invisible `::before` hit area, a tint instead of gray).
