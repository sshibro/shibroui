# Eval results

Runs used Claude Code subagents (Opus 5.5) with the skill installed. The prompts never name the skill,
so with-skill runs also test triggering. Triggering and correct use were read from the run transcripts
(Skill calls, reference files opened, script runs), not from the agents' own reports. Outputs were
graded with `shibroui/scripts/audit.js` at 1280×900 in each state (closed, modal or sheet open, toast)
plus code inspection. There was one run per configuration, so small deltas are noise.

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
