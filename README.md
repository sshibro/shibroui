# shibroUI

A Claude Code skill of interface foundations at two levels:

- **Screen** (`SU-119`–`SU-136`): layout pattern, grid and alignment, spacing rhythm, a single focal
  point and primary action, hierarchy tiers, type/color/radius budgets, and reviewing every state.
- **Behavior and access** (`SU-138`–`SU-202`): semantics and keyboard, form validation, loading/error/
  success states, theming and dark mode, responsive and touch, microcopy, charts, loading performance, and
  other languages and directions. Most are measured by the audit.
- **Component** (`SU-1`–`SU-118`, `SU-137`, `SU-203`): rules distilled from bad-vs-good UI examples, each with the numbers
  that separate the two.
- **Long pages and page patterns** (`SU-204`–`SU-221`): a page read one screen-height band at a time, section
  variety, the false floor, sticky headers and anchors, scroll reveals that never hide content, hero, pricing,
  bento, FAQ, articles and code blocks.
- **Component specs and states** (`SU-222`–`SU-252`): tables, navigation, menus, tooltips, dialogs, drawers,
  toasts, inputs, avatars and chips, with numbers checked against Material 3, Carbon, Polaris, Primer, Apple,
  GOV.UK and NN/g; and the interaction-state matrix (hover, pressed, selected, disabled, read-only).
- **Craft** (`SU-253`–`SU-264`): layered and tinted shadows, hairlines, OKLCH gradients, one icon system,
  display type, crisp product imagery, balanced logos and the small finishes.
- **Across routes** (`SU-265`): one system on every screen.
- **Page types and their components** (`SU-266`–`SU-361`): commerce listings and product pages, cart and
  checkout, sign-in and recovery, account and billing, content, docs and help, display components and media,
  advanced inputs, feedback and system pages, app patterns (onboarding, notifications, chat, scheduling,
  files), search and navigation, and consent and trust. Each rule was drafted, rendered as a bad/good
  specimen and reviewed against its sources; house defaults are labelled. Most are checked by hand for
  now: their Measure lines name the planned audit check.

It comes with a checklist, a WCAG contrast tool, two in-page scripts and three helpers. The **page map** reads a
screen's structure and visual system, and on long pages splits it into bands. The **audit** measures every
element in every state. `serve.mjs` loads both scripts with one line instead of pasting them, `scan.mjs`
runs everything headless with a screenshot per band, and `compare-maps.mjs` checks several routes against
each other.

Claude uses it automatically when it builds, redesigns or reviews UI, including when you say a screen
"looks off", "feels cluttered" or "looks amateur". You can also type `/shibroui`. Quick one-line
questions only sometimes trigger it, so use `/shibroui` when you want its numbers specifically. Test
results are in [`evals/RESULTS.md`](evals/RESULTS.md).

## Install

```sh
git clone https://github.com/sshibro/shibroui.git ~/Developer/shibroui
ln -s ~/Developer/shibroui/shibroui ~/.claude/skills/shibroui
```

Only the `shibroui/` folder is the skill. The rest of the repo is tests and evals, kept out of the installed
skill so Claude never sees answer keys while working.

## How it works on a whole screen

1. **Read the screen.**
   - Take screenshots at 1280 and 375px wide.
   - Run `page-map.js` to get a text wireframe of the regions, what reads first, loud buttons per region,
     the heading outline, every font size, color, radius, shadow and spacing value in use, alignment and
     rhythm problems, card nesting, and hidden states.
   - Write a five-line screen read: the job, the 1st/2nd/3rd read, the primary action, the regions and
     the states.
2. **Plan the composition.** Pick a layout pattern, draw the target wireframe, and set the budgets
   (≤ 6 font sizes, one accent, 3–4 radii, a spacing scale with item/group/section tiers).
3. **Build top-down:** tokens → layout → rhythm → hierarchy → components → states.
4. **Verify.**
   - The page map should have no warnings, and the first read should answer the job.
   - Run the audit in **every** state it lists (tabs, menus, accordions, dialogs).
   - Fix every instance of every finding.
   - Compare the screenshots before and after.
5. **Report top-down.** Screen changes first, then component fixes by region, then a coverage table of
   every region and state, and what wasn't checked.

## What's inside

| Path | What it is |
|---|---|
| `shibroui/SKILL.md` | Scope picker, the screen and component workflows, finding format, defaults table, rule map |
| `shibroui/references/composition.md` | Screen-level rules SU-119–136 and layout patterns (dashboard, settings, list/detail, table, form, landing) with wireframes |
| `shibroui/references/*.md` | Rules by area: typography, layout & hierarchy, color, forms (incl. validation), accessibility, motion, surfaces & images, product, semantics, states, theming, responsive, content, charts, performance, international. Each has bad and good examples with numbers, the reason and how it's measured |
| `shibroui/references/checklist.md` | Screen-first self-check and review walk-through, with script-covered items marked |
| `shibroui/scripts/page-map.js` | In-page expression. Returns the wireframe, hierarchy tiers, loud buttons, heading outline, system inventory with budget flags, alignment, rows/rhythm, nesting and hidden states |
| `shibroui/scripts/audit.js` | In-page expression. Returns findings (fail / warn / info) with rule IDs and **every instance's CSS path**, plus `coverage`: what was checked, what was skipped and why, caps hit, and the hidden states still to audit |
| `shibroui/scripts/measure-png.py` | Screenshot measurer (Python stdlib) for when there's no DOM. Finds pills, buttons, chips and cards, measures the ink inside them, and reports off-center content (SU-137), item gaps (including "likely a mispositioned highlight") and ink contrast. JPEG-tolerant; `--crop`, `--scale` |
| `shibroui/references/commerce-*.md`, `auth.md`, `account-billing.md`, `content-help.md`, `display-components.md`, `inputs-advanced.md`, `feedback-system.md`, `app-*.md`, `search-navigation.md`, `consent-trust.md` | The v0.5 page-type layers (SU-266–361), one file per kind of page |
| `shibroui/references/long-pages.md`, `patterns.md`, `components-*.md`, `interaction.md`, `craft.md` | The v0.4 layers: long pages (SU-204–211), page patterns (SU-212–221), component specs (SU-222–247), interaction states (SU-248–252), craft (SU-253–264) |
| `shibroui/scripts/serve.mjs` | Serves `audit.js` and `page-map.js` on `127.0.0.1:4399` (CORS) so a browser tool loads them with `await fetch(…).then((r) => r.text()).then((s) => (0, eval)(s))` |
| `shibroui/scripts/scan.mjs` | Headless (Playwright) scan: both scripts at 1280 and 375 with the scroll sweep, JSON reports and one screenshot per band |
| `shibroui/scripts/compare-maps.mjs` | Compares saved page maps of several routes: values only one route uses, page headers built differently, the union against the budgets (SU-265) |
| `shibroui/scripts/contrast.mjs` | `node contrast.mjs <fg> <bg> [--fix] [--json] [--target 4.5]`: ratio, AA/AAA, and the nearest passing color in the same hue (OKLCH). Accepts hex, rgb, hsl, `oklch()`, `oklab()` and named colors; `--palette tokens.json` checks every declared pair in each scheme |
| `src/audit/*.js`, `src/page-map/*.js` | Sources of `audit.js` and `page-map.js`, one small file per check group or section. `npm run build` concatenates them into the single expressions the browser tools need; never edit the built scripts by hand |

### What the scripts measure

**Page map:**
- **Long pages:** `bands` and `outline` (one entry per top-level block: its own wireframe, first read,
  loud buttons, background, layout fingerprint and the values it adds); one lead per band, repeated layouts,
  section padding, the false floor, one CTA label, band backgrounds and the hero (SU-204–212).
- **Craft inventory:** control heights, avatar sizes, shadow layers and alpha, opaque gray borders, icon
  sizes and strokes (SU-239, 245, 253, 254, 256), glows and image frames per band.
- **Coverage:** content hidden at opacity 0 (scroll reveals), every cap it hit, and `prepare: true` to scroll
  the page first.
- **Focal point:** competing first reads, measured by visual weight from size, weight, contrast and
  colored surfaces.
- **Hierarchy:** too many loud styles, and loud (filled, high-contrast) buttons per region and in the
  first screen.
- **Outline:** the heading outline.
- **Budgets:** type, color (including near-duplicate grays and "rainbow" surfaces), radius and shadow.
- **Spacing:** off-scale values and uneven section rhythm.
- **Layout:** near-miss alignment edges, misaligned or uneven rows, and card-in-card nesting.
- **States:** hidden states and the controls that open them.

**Audit:**
- **Big pages:** `prepare: true` scroll sweep, `band: n` scope, `coverage.unseen` for opacity-0 and
  content-visibility content, root-cause findings (one fix for hundreds of instances) and sampled instances.
- **Components:** table rows, numeric truncation, sticky columns, sort semantics, header checkboxes, nav
  `aria-current`, breadcrumbs, menu item heights, tooltips, dialog size and fields, toasts over actions,
  switches, select vs radio, drop zones, search width (SU-222–244).
- **Interaction states:** layout shift on hover/selection, state contrast from the CSSOM, color-only
  selection, disabled and read-only (SU-249–252).
- **Long pages and craft:** sticky header vs anchors, TOC, ungated reveals, heading proximity, `pre`
  overflow, gradient midpoints, gradient text, display tracking, blurry images, logo rows, finishes
  (SU-207–221, SU-255–263).
- **Contrast:** text and button contrast, including gradients, and flagging text over images.
- **Fields:** field visibility.
- **Targets:** hit areas (44px goal, 24px floor with the WCAG spacing exception), plus target spacing
  and overlap.
- **Focus:** focus rings, painted when the page has focus and read from CSS when it doesn't.
- **Tables:** numeric column alignment and tabular figures.
- **Layout details:** control heights, nested radius, and centered content (labels in pills, and selection highlights centered on their item).
- **Text:** line length in `ch`, centered or justified prose, line height, and vague or
  non-underlined links.
- **Forms:** unlabeled checkboxes, including inside hidden states.
- **Status and images:** color-only status dots and stretched images.
- **Modals:** elevation and backdrop.
- **Motion:** CSS durations, easing, press scale and shake amplitude, and missing reduced-motion.

## Tests

```sh
npm run build                 # rebuild audit.js and page-map.js from src/audit/ and src/page-map/
npm test                      # unit tests: contrast.mjs, measure-png.py, serve.mjs, compare-maps.mjs, build freshness
npm run test:fixtures         # headless: every fixture in every state, viewport and scheme
python3 -m http.server 4399   # or open http://localhost:4399/tests/audit.html in a browser
```

`npm run test:fixtures` needs Playwright (`npm i -D playwright-core`, or
`PLAYWRIGHT_CORE=/path/to/playwright-core`). It runs every fixture listed in
`tests/fixtures/expected.json` and `tests/fixtures/expected/*.json`, at its own viewport (320×640 for
reflow) and color scheme. `tests/audit.html` runs the original fixtures in a hidden 1280×900 frame. Two broken pages (a settings page and a complex dashboard) must trip
their planted rules in each opened state. Their clean counterparts must come back with zero fails and
zero warnings from both scripts.

`evals/` holds the skill-level evals (`evals.json`, inputs in `evals/files/`): building an invoices
card, reviewing and fixing a settings page, an animated share sheet, redesigning the complex dashboard,
and building a full settings screen.

## Credits

The component rules were distilled and paraphrased from the public examples in TypeUI's
[UI Foundations configurator](https://www.typeui.sh/ui-foundations/configurator). The screen-level
rules, implementation notes, code, scripts and starter values are this repo's own.

## License

[MIT](LICENSE)
