# Eval results

Runs used Claude Code subagents (Opus 5.5) with the skill installed. Triggering and correct use were read
from the run transcripts (Skill calls, reference files opened, script runs), not from the agents' own
reports. There was one run per configuration, so small deltas are noise.

## After v2: a missed segmented-control bug (SU-137)

**The miss.** The user showed a day picker whose selected pill sat 6px right of its label. The skill
missed it for two reasons:
- There was no check for content centering, or for a selection highlight vs its item.
- With only a screenshot there is no DOM, so the model eyeballed it, and vision misses offsets that
  small.

**The fixes:**
- **`audit.js` SU-137:** content vs its container, and the highlight vs the selected item.
- **`measure-png.py`:** screenshot measurement, stdlib only.
- **`SKILL.md`:** a screenshot workflow.

**Red/green.**
- Before the fix, the audit reported 0 issues on a reproduction fixture (`tests/fixtures/segmented-bad.html`).
- After it:
  - The audit reports "selection highlight is 6.0px off-center (left 18px vs right 30px)" and
    "label is 8.0px off-center" for a lopsided chip.
  - The fixed fixture comes back clean.
  - On the user's actual screenshot, `measure-png.py` reports "left 12px, right 25px → −6.5px FAIL, sits
    6px closer to its right neighbour (44px vs 31px): likely a mispositioned highlight".
  - The fixture screenshots pass through JPEG compression with the right answer (−5.6px vs a true 6px).

## Iteration 3: v2 (screen layer) vs v1

**Why v2:** on complex screens v1 didn't check everything, and it only made component-level fixes, not
layout, hierarchy or overall look. v2 adds:
- the screen rules SU-119–136 and `page-map.js`;
- a top-down screen workflow;
- audit coverage: every instance's path, checked/skipped counts, hidden states, and settling
  animations before measuring.

**Setup:**
- Both configurations were told which version to use (v2 installed, v1 from a snapshot).
- Grading used the latest `page-map.js` and `audit.js` at 1280×900 in every state: each settings panel,
  plus the menu, tab, accordion and dialog.

| Eval | v2 | v1 | Time v2 / v1 | Tokens v2 / v1 |
|---|---|---|---|---|
| Redesign the cluttered 100+ element dashboard (`files/dashboard.html`) | **16/16** | 9/16 | 989s / 599s | 258k / 212k |
| Build a full settings screen (6 sections, tables, dialog) | **12/12** | 7/12 | 704s / 599s | 239k / 209k |
| **Mean** | **100%** | **57%** | 847s / 599s | 248k / 210k |

**Results:**
- **Audit:** 0 fails in every state for both versions. v1 already handled contrast, targets, focus and
  tables.
- **Every difference is screen-level:**
  - **v1 dashboard:** 4 font weights, 9 text colors, near-duplicate backgrounds, off-scale 10/14px
    spacing, 1–3px edge misses. It made "Export" the primary and moved "Create report" to the sidebar.
  - **v1 settings:** 4–5 weights, 12 text colors in one panel, 8/10/12px near-duplicate radii, off-scale
    10/18px spacing, a 1px edge miss.
  - **v2:** 0 page-map warnings on every panel and state.
- **Review coverage:** the v2 review has a before → after wireframe, measured screen-level findings and a
  per-region/state coverage table with a "not checked" list. The v1 review missed the type-system chaos
  and had no region coverage.
- **Looks:** both redesigns are clean ([input](screens/1-input-dashboard.jpg),
  [v1](screens/2-old-skill-redesign.jpg), [v2](screens/3-new-skill-redesign.jpg)), so the visual gap is
  smaller than the scores suggest. v2's edge is a consistent system and the right primary action.

**Caveats:**
- `page-map.js` is v2's own tool, so v2 runs could check themselves against the grader. Its budgets are
  standard design-system practice, but read the delta as "v2 reliably ships a consistent system".
- Both v1 runs stopped at ~600s (subagent time limit).
- v2 costs ~40% more time and ~18% more tokens, because it checks more states.

**Audit and page-map fixes found during this round:**
- Entrance animations frozen in a background tab hid whole panels. Running animations are now finished
  before measuring.
- Targets under an open dropdown were scored as tiny. They're now skipped or treated as unknown.
- A one-off grouping gap was flagged as uneven rhythm. Rhythm now needs 3 or more distinct gaps to flag.
- Off-screen skip links counted as loud buttons. Fixed.
- Nav links counted as inline prose links. Fixed.
- The `::before` hit area was mis-sized with a 1px border. Documented in SU-61.

## Iteration 1 (2026-10-20)

| Eval | With skill | Without skill | Time with / without | Tokens with / without |
|---|---|---|---|---|
| Invoices card build | 14/15 | 14/15 | 417s / 142s | 171k / 108k |
| Settings review + fix | 20/20 | 19/20 | 467s / 148s | 163k / 107k |
| Share sheet + toast motion | 10/10 | 10/10 | 235s / 175s | 124k / 103k |
| **Mean** | **97.8%** | **96.1%** | 373s / 155s | 153k / 106k |

- **Triggering:** 3/3 with-skill runs called `shibroui` on their own. 0/3 baselines did (they were told not to).
- **Correct use:**
  - The review walked `checklist.md`.
  - The motion task opened `motion.md` + `surfaces-images.md`.
  - All three ran `audit.js` and `contrast.mjs` and cited rule IDs with measured values.
  - The invoices run over-read (all 9 references) and looped the audit 18 times.
- **What separated the two:**
  - The skill hit the 44px/8px target goal (0 audit warnings vs 5) and verified contrast with tools.
  - The baseline kept the "6 invoices" spec, while the skill run seeded 14.
  - Everything else passed in both. Plain Claude already avoids the big mistakes on these tasks.

## Iteration 2 (after SKILL.md fixes)

The fixes were: the user's spec wins, open only 1–3 references, budget the audit, and serve the page
with a real viewport in your own browser tab.

| Invoices card build | Iteration 1 | Iteration 2 |
|---|---|---|
| Pass rate | 14/15 | 15/15 |
| Tool calls | 70 | 35 |
| Time | 417s | 222s |
| Tokens | 171k | 129k |
| Invoices (spec: 6) | 14 | 6 |
| Audit (closed / modal) | 0·0·0 / 0·0·0 | 0·0·0 / 0·0·0 |

It now opens no reference files and relies on the defaults table. That was enough here.

## Trigger probes

| Prompt | Should trigger | Triggered |
|---|---|---|
| Card image radius + close-button hit area (quick question) | yes | yes (answered 16 − 12 = 4px, 44×44 hit area, citing SU-93/SU-61) |
| Blog body max-width, line-height, alignment, meta color (quick question) | yes | no, twice (the answer matched the rules anyway) |
| Node script converting hex colors to rgb | no | no |
| Express route returning 500 on a missing `limit` param | no | no |

Quick factual UI questions only sometimes trigger, because Claude answers simple questions without
consulting skills. Type `/shibroui` to force it.

## Audit fixes found by testing

- **Viewport:** a hidden-pane 0×0 viewport guard.
- **Focus:** focus rings are judged from CSS when the page has no focus.
- **Hit areas:**
  - Circle sampling so rounded corners don't fail.
  - The WCAG 24px spacing exception.
  - Off-screen targets (skip links) are skipped.
- **Line length:** measured in `ch`.
- **Labels:** checkboxes with labels are left to SU-50.
- **Modals:** the audit scopes to an open modal only when it is visible and on screen. Closed sheets often keep `aria-modal`.
- **Radius:** clipped flush children are skipped, and the radius rule is limited to nested surfaces.
