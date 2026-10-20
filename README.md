# shibroUI

A Claude Code skill of interface foundations at two levels:

- **Screen** (`SU-119`–`SU-136`): layout pattern, grid and alignment, spacing rhythm, a single focal
  point and primary action, hierarchy tiers, type/color/radius budgets, and reviewing every state.
- **Component** (`SU-1`–`SU-118`): rules distilled from bad-vs-good UI examples, each with the numbers
  that separate the two.

It comes with a checklist, a WCAG contrast tool and two in-page scripts. The **page map** reads a
screen's structure and visual system. The **audit** measures every element in every state.

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
| `shibroui/references/*.md` | Component rules by area: typography, layout & hierarchy, color, forms, accessibility, motion, surfaces & images, product. Each has bad and good examples with numbers, the reason and the implementation |
| `shibroui/references/checklist.md` | Screen-first self-check and review walk-through, with script-covered items marked |
| `shibroui/scripts/page-map.js` | In-page expression. Returns the wireframe, hierarchy tiers, loud buttons, heading outline, system inventory with budget flags, alignment, rows/rhythm, nesting and hidden states |
| `shibroui/scripts/audit.js` | In-page expression. Returns findings (fail / warn / info) with rule IDs and **every instance's CSS path**, plus `coverage`: what was checked, what was skipped and why, caps hit, and the hidden states still to audit |
| `shibroui/scripts/measure-png.py` | Screenshot measurer (Python stdlib) for when there's no DOM. Finds pills, buttons, chips and cards, measures the ink inside them, and reports off-center content (SU-137), item gaps (including "likely a mispositioned highlight") and ink contrast. JPEG-tolerant; `--crop`, `--scale` |
| `shibroui/scripts/contrast.mjs` | `node contrast.mjs <fg> <bg> [--fix] [--json] [--target 4.5]`: ratio, AA/AAA, and the nearest passing color in the same hue (OKLCH) |

### What the scripts measure

**Page map:**
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
npm test                      # contrast.mjs + measure-png.py unit tests (node:test)
python3 -m http.server 4399   # then open http://localhost:4399/tests/audit.html
```

`tests/audit.html` runs 12 fixture checks in a hidden 1280×900 frame against
`tests/fixtures/expected.json`. Two broken pages (a settings page and a complex dashboard) must trip
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
