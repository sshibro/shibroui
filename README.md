# shibroUI

A Claude Code skill of interface foundations: 118 rules distilled from bad-vs-good UI examples, each
with the numbers that separate the two. It comes with a review checklist, a WCAG contrast tool and an
in-page audit script that measures the rules in a rendered page.

Claude uses it automatically when it builds or reviews UI (pages, components, tables, forms, modals,
animations), or when you type `/shibroui`. Quick one-line questions ("what line-height should this
be?") only sometimes trigger it, so use `/shibroui` when you want its numbers specifically. Test
results are in [`evals/RESULTS.md`](evals/RESULTS.md).

## Install

```sh
git clone <this repo> ~/Developer/shibroui
ln -s ~/Developer/shibroui/shibroui ~/.claude/skills/shibroui
```

Only the `shibroui/` folder is the skill. The rest of the repo is tests and evals, kept out of the installed
skill so Claude never sees answer keys while working.

## What's inside

| Path | What it is |
|---|---|
| `shibroui/SKILL.md` | When to use it, the build and review workflows, the defaults table, and the rule map |
| `shibroui/references/*.md` | The rules by area: typography, layout & hierarchy, color, forms, accessibility, motion, surfaces & images, product. Each rule has an ID (`SU-1` … `SU-118`), bad and good examples with numbers, the reason, and how to implement it |
| `shibroui/references/checklist.md` | The final self-check and review walk-through, with audit-covered items marked |
| `shibroui/scripts/contrast.mjs` | `node contrast.mjs <fg> <bg> [--fix] [--json] [--target 4.5]`: ratio, AA/AAA, and the nearest passing color in the same hue (OKLCH) |
| `shibroui/scripts/audit.js` | One JavaScript expression to evaluate in a page. Returns JSON findings (fail / warn / info) with rule IDs |

### What the audit measures

Text and button contrast (including gradients, and flagging text over images), field visibility, hit
areas (44px goal, 24px floor with the WCAG spacing exception), target spacing and overlap, focus rings
(painted styles when the page has focus, CSS rules when it doesn't), numeric column alignment and
tabular figures, control-height mismatches, nested-radius errors, line length in `ch`, centered or
unhyphenated-justified prose, line height, vague and non-underlined links, unlabeled checkboxes,
color-only status dots, stretched images, modal elevation and backdrop, and CSS motion (long
durations, linear movement, press scale and duration, shake amplitude, missing reduced-motion).

It only sees the current state. Open menus and dialogs and run it again. Taste, hierarchy and wording
are left to the checklist.

## Tests

```sh
npm test                      # contrast.mjs unit tests (node:test)
python3 -m http.server 4399   # then open http://localhost:4399/tests/audit.html
```

`tests/audit.html` audits two fixtures in a hidden 1280×900 frame and checks them against
`tests/fixtures/expected.json`. The broken settings page must trip the planted rules, and the clean page
must come back with zero fails.

`evals/` holds the skill-level evals: three realistic prompts (build an invoices card, review and fix a
settings page, add an animated share sheet) with assertions, run with and without the skill.

## Credits

The rules were distilled and paraphrased from the public examples in TypeUI's
[UI Foundations configurator](https://www.typeui.sh/ui-foundations/configurator). Implementation notes,
code, scripts and starter values are this repo's own.
