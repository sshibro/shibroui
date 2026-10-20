# shibroUI v3: gap proposal

- **Status:** partly implemented in v0.3.0 (uncommitted working tree, 2026-10-20).
  - **Shipped:** the rule text for G1–G5, G9, G10, G13, G14, G18 and SU-203, plus `audit.js` checks for most of them (37 source files in `src/audit/`, built into `audit.js`).
  - **Also shipped:** `oklch()`, `oklab()` and named colors plus `--palette` in `contrast.mjs`, the headless fixture runner, and the G18 conflict fixes.
  - **Not yet built:**
    - the eval harness (G6), beyond the fixture runner;
    - `scan.mjs` and the depth tiers (G7);
    - the trigger hook and trigger evals (G8), though the description was rewritten;
    - script robustness (G11): shadow DOM, scroll containers;
    - the framework adapters (G12) and `stress.js` (G14);
    - native adapters and heuristic lenses (G16, G17);
    - the G19 extras: the every-state indicator sweep, `::before` indicators, ink-aware centering and `measure-png.py` parity.
- **Date:** 2026-10-20.
- **Baseline:** shibroUI v0.2.0, commit `7343b7f` (2026-10-20). That version has 136 rules, `audit.js`, `page-map.js`, `contrast.mjs`, and 5 evals. File and line references point at that commit.
- **Concurrent work (main session):** commit `96cfd7b` ("catch off-center labels and highlights") landed while this was being written. It adds:
  - **SU-137** (centered content, `layout-hierarchy.md`);
  - an `audit.js` centering check;
  - `scripts/measure-png.py` (screenshot measurer);
  - a screenshot workflow in `SKILL.md`;
  - segmented-control fixtures.

  New IDs in this proposal therefore start at **SU-138**, and line numbers after `96cfd7b` differ. G19 covers what is still missing around that work.

**How this was researched:**
- Read the whole skill: `SKILL.md`, every `references/*.md`, and all three scripts.
- Read `evals/`, `tests/` and `README.md`.
- Compared it with 13 installed UI skills.
- Added G19 after the main session reported a segmented-control miss (a selected pill 6px off its label in a screenshot-only review).
- Checked WCAG 2.2 Understanding docs, Apple HIG, Material 3, Polaris, Carbon, GOV.UK, NN/g, Laws of UX, MDN, web.dev and Anthropic's skill and eval docs.

Sources are linked inline. Claims marked *(unverified)* could not be confirmed against a primary source.

---

## 1. Executive summary

v2 fixed the screen level. It reliably ships one consistent visual system with one focal point and one primary action. What it still misses falls into four groups:

- **What the screen means to non-visual users:** semantics, keyboard use and assistive tech.
- **What the screen does over time:** validation, loading, errors, success and empty data.
- **The environments the screen must survive:** dark mode, forced colors, 320px reflow, 200% zoom, text spacing, RTL, long strings.
- **Whether the evals can tell better from merely compliant:** the grader is the skill's own scripts, every cell has n=1, and there is no no-skill arm for v2.

### Top 5 recommendations

| # | Recommendation | Why first | Effort | Impact |
|---|---|---|---|---|
| 1 | **Add a semantics and assistive-tech layer** (`references/semantics.md`, SU-138–147) and teach `audit.js` names, labels, landmarks, placeholder and non-text contrast, focus-not-obscured and live regions | Today a page with unnamed icon buttons, placeholder-only inputs and no `main` passes the audit with 0 fails. Those are WCAG Level A failures, and the most common ones on real sites | M | **H** |
| 2 | **Add a state layer: validation, loading, error, success and empty** (`references/states.md` plus a `forms.md` extension, SU-148–161), with a required state matrix in the screen workflow | SU-136 says "review every state", but no rule says what a good error, loading or success state *is*. The scripts can only find DOM-hidden states, not data states | M | **H** |
| 3 | **Make theming and dark mode first-class** (`references/theming.md`, SU-162–169): token tiers, OKLCH ramps, dark surfaces, both schemes passing, forced colors. Add a scheme sweep to the scripts and a palette mode to `contrast.mjs` (which today can't parse `oklch()`) | Dark mode is one sentence in the skill (`surfaces-images.md:38`), yet most products ship it. Contrast passes in light routinely fail in dark | M | **H** |
| 4 | **Add a responsive, zoom and reflow layer** (`references/responsive.md`, SU-170–177) and a `reflow`/`textSpacing` probe in `audit.js` | Only SU-135 covers small screens, and nothing measures horizontal overflow at 320px, `user-scalable=no`, hover-only actions, iOS input zoom or `100vh` traps. The reflow check is about 30 lines and very reliable | S–M | **H** |
| 5 | **Rebuild the evals so they can be trusted, and cut the workflow cost with them** (`evals/` v3): 3 runs per cell, a no-skill arm, independent graders (axe-core and a blind pairwise judge), held-out screens, a trigger set with rates, cost per run. Pair this with a one-call `scan` runner and quick/standard/deep tiers | Every item above adds checks, and so adds cost and contamination. Without independent grading, v3 can't show it is better rather than just more self-consistent. The "40% slower" figure is itself unreliable, because both v1 runs hit the 600s cap | M | **H** (enabler) |

**Close runners-up** (P2, in the table below):
- **Pixel-level alignment around SU-137 (G19):** control-row rhythm, the indicator checked in every state, after font load and in RTL, pseudo-element highlights, ink-aware centering and baselines. This responds to the segmented-control miss the user found. The main session's `96cfd7b` covers the current-state centering check and the screenshot measurer (S–M effort, M–H impact).
- Trigger tuning: rewrite the description and add an optional `UserPromptSubmit` hook (S effort, M impact).
- Microcopy rules (S, M).
- Data-viz rules and SVG chart checks (M, M).
- Framework adapters for Tailwind v4 and shadcn, plus a class linter (M, M).
- Script robustness: shadow DOM, scroll containers, large pages (M, M).

### Quick wins (under a day each, before anything else)
- **Fix five contradictions with sibling skills (G18):**
  - SU-115's 4px side stripe is impeccable's top banned pattern;
  - SU-82's ease-in exits conflict with emil and review-animations;
  - bounce (SU-78);
  - stagger (SU-80);
  - `audit.js` warns at 500ms while its own fix text says "≤ 300ms".
- **Rewrite the description (G8).** Put the use case first, name the nouns users type ("max-width", "line-height"), add routing to `dataviz` and `apple-design`, and drop the inventory.
- **Make `contrast.mjs` parse `oklch()`/`oklab()`/`lab()`/`color()`/named colors (B14).**
- **Add a headless fixture runner (B15)** so every later change is test-first.

### Open decisions for the owner

The sources disagree on these, so the drafts below pick a default that you should confirm:

| Decision | Options (sources) | Draft default |
|---|---|---|
| Validation timing | On submit only (GOV.UK) vs on blur once touched (NN/g, Carbon, Apple for email) | Blur-after-touch plus submit; never per keystroke (SU-150) |
| Disabled submit | Never (GOV.UK) vs allowed on short forms (Carbon) | Warn on long forms, info on short (SU-150) |
| Sticky form actions on mobile | "Don't pin" (Carbon) vs reachable bottom actions (M3, Apple) | Sticky only at compact width, with `scroll-padding` and the safe-area inset (SU-176) |
| Touch target | 24px floor (WCAG AA), 44pt (Apple, house rule), 48dp (M3) | Keep 44 as the goal, 24 as the fail floor; 48 for Android-first products (SU-61, SU-175) |
| Exit easing and bounce | ease-in exits and squash (shibroUI today) vs never ease-in, no bounce (emil, review-animations, impeccable) | Align with siblings (G18) |
| Optional vs required marking | Mark the minority (Carbon) vs always mark required (NN/g) | Mark the minority; the marker is text ≥ 4.5:1 (SU-149) |

### Recommended order of work
1. **Eval harness first** (item 5's graders, trigger set and headless fixture runner). It is the TDD "red" step for everything else.
2. **Semantics (1).**
3. **Responsive and reflow (4).** The cheap checks land early.
4. **States (2).**
5. **Theming (3).**
6. **Cost tiers.** Re-measure after each step, since every step adds checks.
7. **P2 items**, in table order.

Ship each as its own `feat(...)` PR under 400 lines, with fixtures first.

---

## 2. Prioritized backlog

Impact is how much it improves real UI output or review quality. Effort covers rules, script work, fixtures and evals. **P1** means high impact; **P2** means medium impact, or high impact at high effort; **P3** means low impact or a niche.

| ID | Item | Area | New rules | Script work | Effort | Impact | Priority |
|---|---|---|---|---|---|---|---|
| G1 | Semantics and assistive tech | a11y | SU-138–147 | audit: names, labels, landmarks, lang/title, alt, ARIA sanity, placeholder and non-text contrast, focus-not-obscured, live regions | M | H | **P1** |
| G2 | Forms: validation, errors, success | states | SU-148–154 | audit: `aria-invalid` linkage, placeholder-as-label, autocomplete, disabled submit, `:invalid` styling | M | H | **P1** |
| G3 | Loading, skeleton, optimistic, error, empty | states | SU-155–161 | workflow state matrix; audit: `aria-busy`, toast roles, button width stability | M | H | **P1** |
| G4 | Theming, dark mode, forced colors | color | SU-162–169 | `coverage.schemes`; `contrast.mjs` CSS Color 4 parsing and `--palette`; off-token colors in page-map | M | H | **P1** |
| G5 | Responsive, zoom, reflow, touch | layout | SU-170–177 | audit: reflow at 320, viewport meta, text-spacing probe, hover-only reveal, input font size | S–M | H | **P1** |
| G6 | Eval v3 and headless fixture tests | evals | none | `tests/run-fixtures.mjs` (Playwright), `evals/triggers.json`, axe grader, blind judge | M | H | **P1** |
| G7 | Workflow cost: tiers plus one-call scan | workflow | none | `scripts/scan.mjs` state sweep; compact output | M | H | **P1** |
| G8 | Trigger reliability | workflow | none | description rewrite; optional hook; trigger evals | S | M | P2 |
| G9 | Microcopy and content design | content | SU-178–184 | audit: vague button labels in dialogs, generic errors, Title Case info | S | M | P2 |
| G10 | Data visualization | color/data | SU-185–191 | audit: SVG text contrast, mark contrast at 3:1, chart names; canvas info | M | M | P2 |
| G11 | Script blind spots (shadow DOM, iframes, scroll containers, large pages, hover) | scripts | none | traversal, scroller-aware fold, time budget, style cache | M | M | P2 |
| G12 | Framework adapters (Tailwind v4, shadcn/ui, React) | adapters | none | `scripts/lint-classes.mjs` (static) | M | M | P2 |
| G13 | Performance-related UI (CLS, fonts, images) | perf | SU-192–196 | audit: unsized media, lazy above-the-fold image, `@font-face` without `font-display`, layout-property transitions | S | M | P2 |
| G14 | RTL, i18n, long strings | i18n | SU-197–202 | `scripts/stress.js` (pseudo-locale with IBM expansion factors, RTL) then rerun; truncation check; physical-property count | M | M | P2 |
| G15 | Modern platform primitives (popover, anchor, dialog `closedby`, view transitions, container queries, `@starting-style`) | platform | folded into G3/G5/G4 and motion | audit: info note listing limited-status features in use (e.g. `base-select`, `animation-timeline`) | S | M | P2 |
| G16 | Native adapters (SwiftUI, Compose) | adapters | none | checklist only; no in-page scripts | M | L | P3 |
| G17 | Laws of UX and heuristics as review lenses | review | none (mapped onto existing IDs) | none | S | L | P3 |
| G18 | Coherence with sibling skills (5 contradictions, routing, z-index scale, accepted findings) | rules | edits to SU-78/80/82/85/115 | `audit.js` limit/text mismatch; `ignore` option | S | M | **P1** (quick win) |
| G19 | Pixel-level alignment around SU-137: control-row rhythm, indicator in every state, pseudo-element highlights, ink-aware centering, baselines, `measure-png.py` parity | optical | SU-203; extends SU-4/31/36/137 | audit: row rhythm, track inset, flanks, `::before` indicators, canvas text ink, SVG ink, baseline probe; `scan.mjs` every-option sweep; `measure-png.py` extensions | S–M | M–H | P2 (first) |

Rule IDs are contiguous and grouped by file, so the rule map stays one row per file. All new IDs fall in SU-138–203, because SU-137 is taken by the main session's centering rule (`96cfd7b`). SU-203 (G19) was added last, so it sits in `layout-hierarchy.md` next to SU-137 rather than in a new file.

---

## 3. Inventory: what v0.2.0 measures, and where it is blind

### 3.1 What exists

| Layer | Content | Measured by |
|---|---|---|
| Screen | SU-119–136: focal point, reading order, one primary action, pattern, grid, edges, spacing tiers, type/color/shape budgets, headings, nesting, rows, chrome, density, collapse order, every state | `page-map.js` (flags for 119–132, 136); SU-122, 133, 134 and 135 are judgment only |
| Component | SU-1–118: type, spacing, hierarchy, optical, color, forms (choice controls only), targets, focus, status, motion, radius, elevation, images, product | `audit.js` covers about 35 of the 118 rules; the rest are checklist items |
| Tools | `contrast.mjs` (WCAG 2 ratio, AA/AAA, nearest passing OKLCH shade); `audit.js`; `page-map.js`; *landed in `96cfd7b`:* `measure-png.py` (centering, gaps and contrast from a screenshot, stdlib Python) and the SU-137 centering check | `node:test` covers `contrast.mjs` and `measure-png`. The script fixtures run by hand in a browser (`tests/audit.html`) |

### 3.2 Script blind spots, found by reading the code

These are concrete. Each one names the code it comes from.

| # | Blind spot | Where | Consequence |
|---|---|---|---|
| B1 | **No accessible-name checks.** Only checkbox/radio labels are checked (`checkChoices`). Text inputs, icon buttons, links, images and `svg[role=img]` are never asked for a name | `audit.js` §10 | An icon-only button with no `aria-label`, or a placeholder-only input, gets 0 findings |
| B2 | **Placeholder contrast not measured.** The text walker only sees text nodes, so `::placeholder` is invisible to it, though SU-45 says "placeholder text counts too" | `audit.js` `checkTextContrast` | The commonest contrast failure on forms is missed |
| B3 | **SVG text and marks excluded.** The text walker skips `svg`, page-map drops `svg`/`path`, and `canvas` counts as an image | `audit.js:169`, `page-map.js:133` | Chart axes, legends and icon contrast are never checked |
| B4 | **No non-text contrast (1.4.11).** Field boundaries use a 1.06:1 threshold (SU-44's minimum), focus rings are checked for width but not color contrast, and icons and control borders aren't checked | `audit.js` `checkFields`, `checkFocus` | Pale-gray input borders and low-contrast focus rings pass |
| B5 | **Hover-only affordances not detected.** `isVisible` treats `opacity:0` as hidden, and `hiddenStates` only lists `display:none`/`hidden` | both scripts | Row actions revealed only on `:hover` are neither audited nor flagged, though touch and keyboard users can't find them |
| B6 | **One color scheme per run.** `pageCanvas()` guesses `#121212` for dark, and nothing lists the other scheme as a state to audit | `audit.js:115` | Dark-mode contrast is never checked unless the agent toggles it by hand |
| B7 | **No reflow, zoom or text-spacing probe.** Neither script checks horizontal overflow, the viewport meta, or what happens to text at WCAG 1.4.12 spacing | n/a | 1.4.10, 1.4.4 and 1.4.12 failures pass, as does `user-scalable=no` |
| B8 | **The window is assumed to be the scroller.** Page-map uses `scrollX/Y` and `innerHeight` for "first screen" and page coordinates | `page-map.js:57,183,188` | In app shells (`body{overflow:hidden}` plus a scrolling `main`), the fold and focal-position flags are wrong |
| B9 | **No shadow DOM or iframe traversal.** `querySelectorAll` and `TreeWalker` don't pierce shadow roots, and iframes aren't entered or even counted | both | Web-component UIs (Shoelace, Ionic, Lit, Salesforce LWC) are silently skipped, and `coverage` doesn't say so |
| B10 | **English-only heuristics.** The vague-link regex `VAGUE` and the status-word regex `STATUS_WORD` only know English | `audit.js:542,597` | False "color-only dot" warnings and missed vague links in other languages |
| B11 | **Fixed spacing scale.** `SCALE` is hard-coded, not read from the project's tokens | `page-map.js:22` | False off-scale flags on 5px- or 6px-based systems, which conflicts with "fit the project's tokens" in the component workflow |
| B12 | **Large pages are slow.** `audit.js` has no style cache (page-map does), the target-pair loop is O(n²), it walks `querySelectorAll('*')` several times, and there's no time budget | `audit.js` §3, §7 | Pages near the 6,000-element cap can take seconds per run, and virtualized lists only show what's rendered |
| B13 | **Motion is read from CSS only.** Durations come from stylesheet rules, so JS-driven animation (WAAPI, Motion, GSAP) is invisible except as "running animations finished", and cross-origin sheets are skipped | `audit.js` §12 | Framer Motion and GSAP pages show "no motion problems" |
| B14 | **`contrast.mjs` can't parse modern colors.** It knows hex, `rgb()`, `hsl()` and three named colors only, so `oklch()`, `oklab()`, `lab()`, `color-mix()` and most named colors throw | `contrast.mjs:43` | The skill recommends OKLCH (SU-42, SU-47), but its own CLI rejects OKLCH tokens |
| B15 | **Fixture tests are manual.** `tests/audit.html` needs a browser opened by hand, and `npm test` covers only `contrast.mjs` | `package.json` | Script changes have no automated red/green loop, which goes against the TDD rule |
| B16 | **Eval inputs double as fixtures.** `evals/files/dashboard.html` and `settings.html` are both eval inputs and script fixtures | `tests/fixtures/expected.json` | Tuning the scripts on them overfits the evals |

### 3.3 Compared with the installed UI skills

Thirteen skills were read: impeccable, emil-design-eng, apple-design, review-animations, improve-animations, taste-skill, design-taste-frontend, redesign-existing-projects, frontend-design (plugin), high-end-visual-design, minimalist-ui, layers-surface and dataviz. make-interfaces-feel-better is a broken symlink.

**What shibroUI has that none of the others do:**
- **Citable rule IDs and a strict finding format:** ID, every instance, measured value against target, fix.
- **In-page measurement of the whole screen.** Page-map's focal point, loud buttons, budgets, near-miss edges, rhythm and nesting have no equivalent. impeccable's 46-rule detector touches this area only through `monotonous-spacing`, `flat-type-hierarchy` and `nested-cards`.
- **Contrast composited through opacity and the real backdrop**, plus `--fix` suggestions.
- **Measured hit areas**, including `::before` extensions.
- **Optical corrections and nested-radius math.**
- **A coverage table and an honest "Not checked" line.**

**What they cover that shibroUI doesn't**, ranked by how many skills cover it, with the best file to borrow from:

| Topic | Skills covering it | Best source | Proposal item |
|---|---|---|---|
| Loading, error, success and disabled states | 7 | `impeccable/reference/interaction-design.md:3-50` | G3, G2 |
| Microcopy (error formula, CTA verbs, confirmations, sentence case) | 7 | `impeccable/reference/clarify.md`; `frontend-design` SKILL.md:61-71 | G9 |
| AI-tell / anti-pattern catalog (automated in impeccable) | 7 | `impeccable/scripts/detector/registry/antipatterns.mjs` | Route to impeccable (G18), don't duplicate |
| Performance UI (Core Web Vitals, transform/opacity only, image sizing) | 7 | `impeccable/reference/optimize.md:190-218`; emil SKILL.md:482-528 | G13 |
| Responsive and mobile (breakpoints, container queries, `dvh`, safe area, thumb zone) | 6 | `impeccable/reference/adapt.md:130-178`; design-taste-frontend :234-261 | G5 |
| Dark mode and theme tokens | 5 | design-taste-frontend :572-593; impeccable `audit.md:34-43`; dataviz `color-formula.md` | G4 |
| Semantic z-index scale | 5 | impeccable SKILL.md:48 | G18 |
| Motion craft (frequency gate, hover gating, `transform-origin`, no `scale(0)`, no `transition: all`) | 4 | `review-animations/STANDARDS.md`; emil SKILL.md:66-124 | G18 plus motion.md edits |
| Semantic accessibility (skip link, live regions, `inert`, roving tabindex, forced colors) | 5, shallow | impeccable `interaction-design.md:51-176`, `harden.md:250` | G1, G4 |
| Framework conventions (Tailwind v3 vs v4, Server Components, Radix origin variables) | 5 | taste-skill SKILL.md:15-33; design-taste-frontend :983-1110 | G12 |
| Realistic content (no lorem, "John Doe", 99.99%) | 4 | redesign-existing-projects SKILL.md:77-90 | G9 (SU-184) |
| Design-token drift checks against a DESIGN.md | 2 | impeccable `reference/document.md`, `design-system-*` detector rules | G4 (off-token colors), G11 (token-aware scale) |
| i18n, RTL and long strings | 1, deep | `impeccable/reference/harden.md:37-138` | G14 |
| Data visualization with a palette validator | 1, complete | `dataviz` references + `validate_palette.js` | G10 (route, then measure) |
| Native iOS/Android | 1 | impeccable `reference/ios.md`, `android.md` | G16 |
| Scored heuristic critique | 1 | impeccable `critique.md:390` | G17 |

**Workflow ideas worth borrowing:**
- **Effort tiers with caps:** improve-animations' quick/standard/deep (G7).
- **Load-once context:** impeccable's `context.mjs`, "if you've already seen its output, do not re-run" (G7).
- **Visual judgment before the deterministic detector** (G18).
- **A post-edit hook** that runs a static detector subset (G12's `lint-classes.mjs` is the natural candidate, G8).
- **Fix plans written for cheaper models**, from improve-animations' `PLAN-TEMPLATE.md`. Optional for the deep-tier review report.

---

## 4. Item details

Every item follows the same shape:
- **Gap**
- **Evidence**
- **Change:** files, rule IDs and script checks, with what each check measures and how
- **Effort / impact**
- **Risks:** false positives and maintenance
- **Test:** fixture plus eval

Rule text is a draft in shibroUI's voice: a rule, ❌/✅ with numbers, and a "Measure" line. Final wording belongs in the implementing PR.

### G1. Semantics, keyboard and assistive tech (P1 · M · H)

**Gap.**
- shibroUI's accessibility layer is visual: contrast, 44px targets, focus *rings* and color-only status.
- It has no rules for:
  - accessible names;
  - landmarks and bypass;
  - page language and title;
  - text-field labels (only checkbox/radio, SU-50);
  - focus *order* and focus *management*;
  - live regions;
  - ARIA validity;
  - focus not obscured.
- The audit can't see these failures (B1, B2, B4).
- SU-103 lists modal behavior requirements in one sentence, but nothing measures them.
- The evals checked "Escape closes and focus returns" by reading code by hand (evals 1 and 3), which shows the gap.

**Evidence.**
- **Name, Role, Value (4.1.2, Level A):** failures F68 (no name), F89 (icon-only link), F111 (visible label not in name) and F59 (div controls without role) ([Understanding 4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)).
- **Labels:**
  - 3.3.2 Labels or Instructions (A): a placeholder is not a label ([3.3.2](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html)).
  - 1.3.1 Info and Relationships (A): tables without headers, `fieldset` without `legend`, fake headings ([1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)).
- **Page structure:** 2.4.1 Bypass Blocks (A), 2.4.2 Page Titled (A), and 2.4.3 Focus Order (A). For focus order, F44 covers positive `tabindex`, and CSS `order`/`*-reverse`/grid placement can break the sequence ([2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)).
- **2.4.11 Focus Not Obscured, Minimum (AA, new in 2.2):** a focused element must not be *entirely* hidden by author content such as sticky headers or footers, cookie banners and chat widgets (F110) ([2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)).
- **1.4.11 Non-text Contrast (AA):** 3:1 for the boundaries needed to identify controls, for state indicators including custom focus rings (F78), and for meaningful graphics. 2.999:1 fails, with no rounding ([1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).
- **4.1.3 Status Messages (AA):** use `role=status`/`alert`/`aria-live`. The live region must already be in the DOM before its text changes (F103) ([4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)).
- **Keyboard and focus patterns** for tabs, menus, disclosure, combobox and dialog come from the [ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/).
- **Installed skills:**
  - impeccable covers parts of this in prose: skip links, roving tabindex, `inert` modals and errors linked by `aria-describedby` (`impeccable/reference/interaction-design.md:43-176`, `harden.md:250`), but its detector doesn't measure names or focus.
  - No installed skill measures semantics in the page, so shibroUI can own this.

**Change.** Add a new file, `references/semantics.md` (SU-138–147), and a new defaults row: "Semantics: native elements, every control named, one `main`, focus managed on every change (SU-138–147)".

| ID | Rule (draft) | Numbers / pass condition | WCAG | `audit.js` check (new "semantics" section) |
|---|---|---|---|---|
| SU-138 | **Landmarks and a skip link.** One `main`, plus `header`/`nav`/`footer` where they exist. With 5 or more focusables before `main`, a skip link is the first focusable and becomes visible on focus | exactly 1 `main`; skip target exists and is focusable | 2.4.1, 1.3.1 | fail: 0 or more than 1 `main`; warn: no skip link with ≥ 5 focusables before `main`; warn: the skip link's `href` target is missing |
| SU-139 | **Language and title.** `<html lang>` is set and valid. `<title>` reads "Page – Product" and changes on client-side routes | `lang` non-empty BCP 47; title non-empty and not "Document"/"Untitled"/"React App"/"Vite + React" | 3.1.1, 2.4.2 | fail: missing `lang` or empty title; warn: generic title |
| SU-140 | **Every control has an accessible name, and it contains the visible label.** Icon buttons get `aria-label`, and visible text is reused, not paraphrased | name length > 0; the normalized visible text is a substring of the name | 4.1.2, 2.5.3 | Simplified accname: `aria-labelledby` → `aria-label` → `labels` → `alt` → `title` → text → `placeholder` (counts for the name, but see SU-148). fail: empty name on a button, link, input, `[role=*]` widget or `iframe[title]`; warn: label not in name |
| SU-141 | **Non-text content.** Meaningful images and icons have alternatives. Decorative ones are hidden. Meaningful icons and control boundaries reach 3:1 | `img` has an `alt` attribute; `svg` is either `role=img` with a name or `aria-hidden`; icon ink ≥ 3:1; field boundary ≥ 3:1 when it is the only cue | 1.1.1, 1.4.11 | fail: `img` without `alt`; warn: `svg` in an interactive element with neither a name nor `aria-hidden`; warn: icon stroke/fill under 3:1 vs its backdrop (reusing `backdropAt`); SU-44 escalates to warn when the boundary is under 3:1 and the fill matches the surface |
| SU-142 | **Native first, and ARIA that doesn't lie.** Use `<button>`/`<a>`/`<input>` before roles. No positive `tabindex`, no `aria-hidden` on or around focusables, no dangling ID references, no duplicate IDs | 0 of each | 4.1.2, 2.4.3 | fail: `tabindex > 0`; fail: focusable inside `[aria-hidden=true]`; fail: `aria-controls/labelledby/describedby` pointing at missing IDs; warn: duplicate IDs; warn: `div/span` with `cursor:pointer` and an `onclick` attribute or `tabindex=0` but no role |
| SU-143 | **Keyboard order follows reading order, and everything is operable by keyboard.** Frequent actions in tools may have shortcuts, documented and remappable | no backward jump of more than 1 viewport row in tab order vs visual order | 2.4.3, 2.1.1, 2.1.4 | warn: tab sequence (DOM order plus `tabindex`) where the next element is above the previous by more than its height while in the same column (a "reading-order inversion"); info: containers using `order`, `flex-direction:*-reverse` or explicit grid placement that hold focusables |
| SU-144 | **Focus is managed on every change.** Opening a dialog or sheet moves focus in. Closing it returns focus to the trigger. Deleting a row moves focus to the next row or the list heading. A client-side route change focuses `h1` or announces. An error summary takes focus. Focus never falls to `body` | after any state change, `document.activeElement !== body` | 2.4.3, 3.2.1 | In `scan.mjs` (G7): after each `opensWith` click, assert focus is inside the opened state; after Escape, assert focus returns to the trigger. In-page: info listing dialogs without `autofocus` or an initial focus target |
| SU-145 | **Focus stays visible, and a ring that is visible but covered doesn't count.** Sticky headers and footers set `scroll-padding-block` to their height. The ring has ≥ 3:1 contrast against its background and is drawn with `outline` (it survives forced colors) | focused element not *entirely* covered; ring ≥ 3:1; sticky bars ≤ 25% of viewport height | 2.4.11, 1.4.11, 2.4.13 (AAA ref) | For each focusable (capped): focus it, `scrollIntoView`, sample 5 points with `elementsFromPoint`; fail if every point hits a `fixed`/`sticky` element that isn't an ancestor or descendant. Ring contrast: `outline-color` vs `backdropAt` at the ring position, fail under 3:1. warn: focus drawn by `box-shadow` only (disappears in forced colors, SU-168) |
| SU-146 | **Status messages are announced.** Toasts, "Saved", result counts and progress live in `role=status`/`aria-live=polite`, mounted at load. `role=alert` only for errors that need attention now | live region exists before its content changes | 4.1.3 | warn: toast-like elements (fixed, level-4+ shadow, under 140 characters of text, or class `toast\|snackbar\|notification`) without `role=status\|alert` or `aria-live`; warn: `aria-live=assertive`/`role=alert` on non-error text |
| SU-147 | **Widgets follow the APG pattern.** Tabs: `tablist`/`tab`/`tabpanel`, arrow keys, `aria-selected`, roving tabindex. Disclosure: `aria-expanded`. Menus: arrows, Escape. Combobox: `aria-expanded` and `aria-activedescendant` or focus. Prefer native `<details>`, `<dialog>` and `popover` | required child roles and states present | 4.1.2, 2.1.1 | fail: `role=tab` without `aria-selected`; fail: `[aria-haspopup]`/disclosure trigger without `aria-expanded`; warn: more than one `tab` with `tabindex=0` in a tablist; warn: `role=menu` with no `menuitem*` children |

Also extend existing checks:
- **SU-45** measures `::placeholder` via `getComputedStyle(input, '::placeholder').color` (B2).
- **The text walker** includes `svg text` (B3).
- **The table check** adds `th`/`scope` presence and `caption`/`aria-label` for data tables (1.3.1), reported under SU-17's section as **SU-17b**. Alternatively, keep that inside SU-142 to avoid sub-IDs.

**What stays manual** (the checklist gets a "Screen reader / keyboard pass" section):
- a real screen-reader pass (VoiceOver plus Safari, NVDA plus Firefox);
- whether names are *descriptive*;
- whether announcements make sense.

The report's "Not checked" line must name these.

**Effort / impact.** M (rules ½ day; checks about 300 lines across 2–3 days with fixtures) / **H**. These are the most frequent real-world WCAG failures, and plain Claude often misses icon-button names and focus return.

**Risks.**
- **False positives:**
  - the accname approximation (CSS-generated content, `aria-labelledby` chains), so keep it simplified and conservative;
  - the reading-order heuristic in multi-column layouts, so keep it at warn and same-column only;
  - toast detection by class name.
- **Maintenance:** ARIA 1.3 changes (e.g. `aria-description`) need small updates.
- **Size:** `audit.js` is 786 lines. Put semantics in a separate `scripts/semantics.js` loaded the same way, or have the bundle step in G7 concatenate files, to respect the small-files rule.

**Test.**
- Red fixture `tests/fixtures/semantics-bad.html` must fail each of SU-138–147 once, with one planted instance each:
  - an icon button with no name;
  - a placeholder-only email field;
  - `tabindex=3`;
  - a focusable inside `aria-hidden`;
  - a missing `main`;
  - a sticky footer covering the last focused link;
  - a 2.2:1 focus ring;
  - a toast without a role;
  - tabs without `aria-selected`.
- Green twin `semantics-good.html` must return 0 fails and 0 warns.
- Eval: "build a sign-up dialog with email, password and a success toast", graded independently by axe (with `target-size` on) and by the scan's focus assertions.

### G2. Forms: validation, errors and success (P1 · M · H)

**Gap.**
- `forms.md` covers choice controls and control heights (SU-50–60).
- It says nothing about:
  - text-field labels;
  - required/optional marking;
  - *when* to validate;
  - where errors go and how they're worded and linked;
  - error summaries;
  - autofill and paste;
  - success feedback;
  - preserving input.
- SU-52 says "keep loading, validation, focus and double-submit protection" in one line.
- Forms are where users fail tasks, and where WCAG 3.3.x applies.

**Evidence.**
- **WCAG** ([3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [3.3.3](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html), [3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html), [3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html), [3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html), [1.3.5](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html)):
  - 3.3.1: errors identified in text, not color or icon alone. Native browser bubbles are not enough: they vanish and show one at a time.
  - 3.3.3: suggest the fix when it's known.
  - 3.3.4: reversible, checked or confirmed for legal, financial and data-deleting submits.
  - 3.3.7 (new in 2.2): don't re-ask within a process.
  - 3.3.8 (new in 2.2): no cognitive tests at login. Paste and password managers must work, and split OTP boxes must accept paste.
  - 1.3.5: valid `autocomplete` tokens on personal-data fields.
- **Platform:** `:user-invalid`/`:user-valid` are widely Baseline, so error styling can wait for interaction without JS.
- **GOV.UK Design System:**
  - the error summary at the top lists links to each field and takes focus on submit ([error summary](https://design-system.service.gov.uk/components/error-summary/));
  - inline messages sit between the label/hint and the input ([error message](https://design-system.service.gov.uk/components/error-message/));
  - validate on submit ([validation pattern](https://design-system.service.gov.uk/patterns/validation/));
  - avoid disabled buttons ([button](https://design-system.service.gov.uk/components/button/)).
- **Validation timing:** NN/g recommends inline validation after the user leaves a field, never before they finish typing ([errors in forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/)).
- **Further design-system guidance:**
  - **GOV.UK:**
    - shows the summary for *any* error;
    - puts "Error: " in `<title>`;
    - never clears input;
    - bans "valid/invalid", "please", "sorry" and "This field is required";
    - confirms success on a confirmation page, or a single success banner mid-journey ([notification banner](https://design-system.service.gov.uk/components/notification-banner/), [confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/)).
  - **Carbon** ([forms pattern](https://carbondesignsystem.com/patterns/forms-pattern/)):
    - validates on blur;
    - marks the minority ("(optional)" when most are required);
    - lets *short* forms disable the primary until valid, but not long forms;
    - uses 1–3 word sentence-case labels, 40px inputs, 32px between fields;
    - says "don't pin" form buttons.
  - **Polaris:** error banners state the fix ("To save this product, make 2 changes"), not "There are 2 errors" ([error messages](https://polaris.shopify.com/content/error-messages), now redirected to shopify.dev).
  - **Apple:** "Choose a password with at least 8 characters" beats "That password is too short" ([writing](https://developer.apple.com/design/human-interface-guidelines/writing)).
  - **NN/g:** marking optional fields reduces load, and required markers must be ≥ 4.5:1 ([required fields](https://www.nngroup.com/articles/required-fields/)).
  - **Sources conflict on timing.** GOV.UK validates on submit only; NN/g and Carbon validate on blur. The draft below picks blur-after-touch plus submit. This is an open decision (§1).
- **Installed skills:** impeccable's `interaction-design.md:43` covers validate on blur with `aria-describedby`; `harden.md:220` covers input validation. Neither measures anything.

**Change.** Extend `references/forms.md` with a new "Validation and feedback" section (SU-148–154) and add a defaults row: "Forms: visible label above every field, hint text outside, validate on blur/submit, error = text + icon + red border linked by `aria-describedby`, summary on submit for 2+ errors, never disable submit (SU-148–154)".

| ID | Rule (draft) | Numbers | Check |
|---|---|---|---|
| SU-148 | **Every field has a visible, persistent label.** Use a label above the field. Hints and format examples sit between label and field (linked with `aria-describedby`), never in the placeholder. Floating labels only if they stay visible and ≥ 12px | label → field 8px (SU-22) | fail: text field whose only name is `placeholder`; fail: no name at all (shared with SU-140); warn: `aria-label`-only field with no visible text |
| SU-149 | **Mark the exception.** If most fields are required, mark optional ones "(optional)" in the label. Otherwise mark required ones with text or an asterisk explained once. Use `required`/`aria-required` in code either way | n/a | warn: a form with a mix of `required` and non-required fields where neither the optional nor the required ones carry a visible marker (label text contains no "(optional)", "*" or "required") |
| SU-150 | **Validate at the right moment.** Validate on blur once a field has been touched, and on submit always. Re-validate on input only to *clear* an error. Never show errors on untouched fields or while typing the first time. Style with `:user-invalid`, not `:invalid`. **Don't disable the submit button** to signal invalid input: let it submit and explain | n/a | warn: CSS rules styling `:invalid` with a border or color change (static scan) that aren't scoped to `:user-invalid`, `[aria-invalid]` or a "submitted" class; `button[type=submit]:disabled` inside a form with empty required fields at rest is a warn when the form is taller than the viewport (the error and the button can't both be seen) and info for short forms (Carbon allows it there; GOV.UK avoids it) |
| SU-151 | **Inline errors are text, next to the field, and linked.** The message sits between label and field (or directly under it). It uses an icon plus text, in the danger color at ≥ 4.5:1. The field gets `aria-invalid="true"` and `aria-describedby` → the message id, and a 2px danger border (≥ 3:1). The message says what's wrong and how to fix it (SU-180) | border ≥ 3:1; text ≥ 4.5:1 | fail: `[aria-invalid=true]` field without `aria-describedby`/`aria-errormessage` pointing at visible text; warn: error-styled text (danger color, near a field) not referenced by the field; warn: generic message text (`/^(invalid( input)?\|error\|required\|this field is required)\.?$/i`) |
| SU-152 | **An error summary on submit.** On a multi-field form, any error on submit shows a summary above the form (GOV.UK: "There is a problem"; Polaris style: "To save this product, make 2 changes"). It lists each error as a link to its field, using the same text as the inline messages. Move focus to it and prefix the page title with "Error: ". A single-field form just focuses the field | n/a | `scan.mjs` deep tier: submit the form empty and assert that focus lands on an element containing links to the invalid fields (or on the first invalid field for single-field forms) |
| SU-153 | **Help the browser help the user.** Use the right `type`/`inputmode`/`autocomplete` tokens (`email`, `tel`, `given-name`, `postal-code`, `current-password`, `new-password`, `one-time-code`). Never block paste. Split OTP boxes accept a pasted code. Offer a show-password toggle | n/a | warn: fields whose name, id or label matches name/email/phone/address/postcode/birthday/username/password without a valid `autocomplete` token; fail: `autocomplete="off"` on password fields; fail: a synthetic `paste` event on a password or OTP field is `defaultPrevented`; warn: 4–8 adjacent `maxlength=1` inputs |
| SU-154 | **Keep what the user typed, and don't ask twice.** Errors never clear valid fields. Multi-step forms show progress (step *n* of *m*) and prefill earlier answers ("Same as shipping address"). High-stakes submits (payment, legal, deletion) get a review step or undo | n/a | warn: two field groups in one page sharing `autocomplete` section tokens (`shipping`/`billing`) without a "same as" checkbox; manual otherwise |

**Effort / impact.** M (rules ½ day; checks about 200 lines; the invalid-submit flow lives in `scan.mjs`) / **H**. Forms are in most product screens, and the rules are well-evidenced and mostly measurable.

**Risks.**
- Required-marker detection is language-specific (B10), so use the same per-language word maps.
- The generic-message regex is English-only.
- Some flows legitimately disable submit (e.g. while a request is in flight), so only flag a disabled submit *at rest* with empty required fields.
- Synthetic paste checks can miss listeners attached on `document`. Fine: false negatives only.

**Test.**
- `forms-bad.html`:
  - a placeholder-only email;
  - an `:invalid` red border at rest;
  - a disabled submit;
  - `aria-invalid` without `describedby`;
  - "Invalid input";
  - `autocomplete=off` on a password;
  - a paste-blocking OTP;
  - unmarked optional fields.
- `forms-good.html`: the GOV.UK-style pattern.
- Eval 6 (§5): sign-up and sign-in with an invalid submit.

### G3. Loading, skeleton, optimistic, error and empty states (P1 · M · H)

**Gap.**
- SU-136 says to *review* empty, loading and error states, and SU-117 defines a good empty state. Nothing defines a good loading, error, partial, optimistic or success state.
- The scripts can only find DOM-hidden states (closed tabs, dialogs). Data states (loading, error, empty) don't exist in the DOM until the app is put in them, so today they are reviewed only when the agent happens to build a toggle.

**Evidence.**
- **Response-time limits:** 0.1s feels instant, 1s keeps flow, 10s keeps attention ([NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/)).
- **Indicators:** progress indicators for waits over about 1s, looped indicators for 2–10s, percent-done past 10s ([NN/g progress indicators](https://www.nngroup.com/articles/progress-indicators/)). Skeleton screens suit full-page or region loads with a known layout ([NN/g skeleton screens](https://www.nngroup.com/articles/skeleton-screens/)).
- **WCAG:** 4.1.3 (status messages announced) and 2.2.1 (time limits, which applies to auto-dismissing toasts that carry actions).
- **CLS:** content-shaped placeholders prevent layout shift (G13).
- **Further design-system guidance:**
  - **M3 progress indicators:** no indicator under 200ms, a loading indicator for 200ms–5s, a determinate progress indicator over 5s, one indicator per group ([M3 progress](https://m3.material.io/components/progress-indicators/guidelines)).
  - **NN/g skeletons:** nothing under 1s. For 1–10s, a spinner for a single module or a skeleton for a whole page. Over 10s, a progress bar. No frame-only skeletons, and pulsing can be an accessibility problem ([NN/g skeleton screens](https://www.nngroup.com/articles/skeleton-screens/)).
  - **Carbon** ([loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/)):
    - skeletons on containers, tables and cards only (not buttons, inputs, toasts or modals);
    - progressive loading;
    - screen readers told about busy, stuck and failed states.
  - **Polaris:** the skeleton page mimics the real layout and keeps static titles as real text ([skeleton page](https://polaris.shopify.com/components/feedback-indicators/skeleton-page)).
  - **Apple:** show something as soon as possible; prefer determinate progress, offer Cancel, and don't switch styles mid-task ([loading](https://developer.apple.com/design/human-interface-guidelines/loading)).
  - **Toasts:**
    - NN/g: never errors in toasts. A user missed a ~5s error toast and waited 5 minutes ([indicators, validations, notifications](https://www.nngroup.com/articles/indicators-validations-notifications/)).
    - Carbon: toasts persist by default and auto-dismiss at ~5s is optional; actionable notifications never auto-dismiss ([notification usage](https://carbondesignsystem.com/components/notification/usage/)).
  - **Optimistic UI, offline and partial failure:** no design system specifies these, so the draft rule is practice *(unverified against a primary source)*.
- **Installed skills:** impeccable's eight-state table and "skeletons over spinners, optimistic UI, undo instead of confirm" (`interaction-design.md:3-50,153`); layers-surface's feedback inventory for every action (`SKILL.md:50`).

**Change.**
- **New `references/states.md` (SU-155–161).** SU-117 moves next to these by cross-reference, keeping its ID.
- **Screen workflow, step 1:** the screen read's 5th line, "the states to visit", becomes a **state matrix**: rows are data regions; columns are ideal, empty (first-use / no-results / cleared), loading, partial, error, offline/permission.
- **Step 3:** "build a way to show each state (a `?state=` param, a dev toggle, or fixture data) so it can be audited".
- **Report:** the coverage table gets the matrix.

| ID | Rule (draft) | Numbers | Check |
|---|---|---|---|
| SU-155 | **Every data region has a state matrix**, and each state is designed, not left to a default: ideal, empty (3 kinds, SU-117), loading, partial, error, and offline/no-permission where relevant | all cells filled or marked "n/a" | workflow (no script); page-map adds `states.dataRegions` (regions containing tables, lists, charts or KPI groups) so the matrix rows are listed for the agent |
| SU-156 | **Feedback matches the wait.** The input itself always responds within 100ms (pressed state, SU-72). Under 200ms: no loading indicator. 200ms–1s: an inline busy state, no full spinner flash (*practice:* once shown, keep it ≥ 500ms). 1–10s: a skeleton for a whole page or region with a known layout, or a spinner for a single module. Over about 5–10s: determinate progress, an estimate and Cancel | 0.1s / 0.2s / 1s / 10s (NN/g, M3) | info: spinners (`[role=progressbar]`, `.spinner`, `[aria-busy=true]`) present at rest; the motion scan already exempts loaders from SU-85 |
| SU-157 | **Skeletons match the final layout** in size and rhythm, so nothing shifts on load. Use quiet shapes (one neutral tint), an optional shimmer ≥ 1.5s per cycle, and none under reduced motion. Mark the region `aria-busy="true"`. No skeletons for loads under about 1s or for tiny elements | CLS from skeleton → content ≤ 0.1 | `scan.mjs`: when a `?state=loading` toggle exists, screenshot and capture rects in both states, then compare region heights (warn when Δ > 8px); in-page: warn on a shimmer animation without a reduced-motion override (extends SU-78) |
| SU-158 | **Busy buttons keep their shape.** Width stays fixed (no jump). A spinner replaces or precedes the label ("Saving…"). The button is guarded against double submit (`aria-disabled` + ignore clicks, or `disabled` for the duration only). Focus stays on it | width Δ = 0 | `scan.mjs`: click the primary submit with network throttled, then compare widths before and during; in-page: info for buttons with `[aria-busy]` or a spinner child and no fixed `min-inline-size` |
| SU-159 | **Optimistic updates only when safe.** Use them for frequent, reversible, high-success actions (toggle, like, reorder, rename): update instantly, reconcile, and on failure revert *visibly* with an inline message and Retry. Never for payments, irreversible deletes or anything with side effects others see immediately | n/a | manual (checklist); `react.md` adapter points to `useOptimistic` |
| SU-160 | **Errors explain and recover, in place.** Say what failed, why if known, and what to do, with a Retry. Keep the user's data. Isolate partial failure: one failed widget shows its own error while the rest of the dashboard works. Never toast-only for errors that block the task. Use `role=alert` only for the blocking ones | n/a | warn: an error-styled region (danger color, or the text "error", "failed" or "couldn't") without a button or link in it; info: error text inside a toast-like container |
| SU-161 | **Success is confirmed where it happened, and reversible actions offer Undo instead of a confirm dialog.** Use inline "Saved" (`role=status`) for in-place edits, and a confirmation panel or page for completed flows. Toasts are for non-critical, non-blocking news: about 5s if auto-dismissed (Carbon), pausable on hover or focus, dismissible, one at a time, **never errors** (NN/g), and never auto-dismissed if they hold an action (Carbon; WCAG 2.2.1) | toast ~5s; *practice:* undo window ≥ 5s | audit: toast-like elements without `role=status`/`aria-live` (SU-146); static scan: `setTimeout` dismissals under 4,000ms near toast code (lint, info); manual: undo vs confirm |

**Effort / impact.** M (rules 1 day; state-matrix workflow ½ day; `scan.mjs` state hooks with G7) / **H**. Every real screen has these states, and v1/v2 evals never graded them. Eval 7 measures it.

**Risks.**
- Thresholds such as the 300ms spinner delay and 500ms minimum are practice, not standard *(confirm with the design-system sources)*. Present them as defaults.
- Data states need app cooperation (a toggle or fixtures). When none exists, the workflow must say "not checked" rather than pretend.
- The error-region heuristic can misfire on red decorative text. Cap it and keep it at warn.

**Test.**
- `tests/fixtures/states.html` with a `?state=loading|empty|error|ideal` switch, planting:
  - a spinner flash;
  - a skeleton taller than the content;
  - an error without Retry;
  - a 2s toast without a role;
  - a button that grows while busy.

  The fixture runner visits each state. The good twin passes all.
- Eval 7 (§5).

### G4. Theming, dark mode and forced colors (P1 · M · H)

**Gap.**
- Dark mode is one sentence: "pair elevation with a slightly lighter surface" (`surfaces-images.md:38`).
- There are no rules on:
  - token architecture;
  - how dark surfaces should be;
  - re-tuning accents and status tints for dark;
  - `color-scheme`;
  - toggles;
  - forced colors or `prefers-contrast`.
- The scripts audit one scheme per run and guess `#121212` as the canvas (B6).
- `contrast.mjs` rejects `oklch()` even though SU-42 and SU-47 recommend OKLCH (B14).
- page-map counts colors but can't tell an *off-token* color from a token. Budgets are the screen-level proxy for "uses the system", and a token check is the direct one.

**Evidence.**
- **Platform (Baseline, Oct 2026):**
  - `oklch()`/`oklab()` widely (2025-11);
  - relative color syntax newly (2024-09);
  - two-color `color-mix()` widely;
  - `light-dark()` newly (2024-05), requiring `color-scheme: light dark`;
  - `color-scheme` widely (it makes form controls and scrollbars match);
  - `contrast-color()` newly (2026-04) but black or white only and **not guaranteed AA**;
  - `prefers-contrast` widely;
  - `forced-colors` widely;
  - `prefers-reduced-transparency` **Chromium only**.

  ([MDN oklch](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch), [light-dark](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark), [contrast-color](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color), [forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors), [prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency).)
- **Forced colors:** `box-shadow` and `text-shadow` become `none`, non-URL `background-image` becomes `none`, and colors are replaced by system colors. Focus drawn with `box-shadow`, or affordances drawn with backgrounds or gradients, disappear. Use `outline` and `border` (transparent is fine), and `forced-color-adjust: none` only for color swatches.
- **Dark surfaces:** Material's dark theme uses a `#121212` base with lighter surfaces for elevation and desaturated accents ([M2 dark theme](https://m2.material.io/design/color/dark-theme.html)). web.dev's example avoids pure white text ([prefers-color-scheme](https://web.dev/articles/prefers-color-scheme)).
- **Design systems:**
  - **M3:**
    - three token classes, `md.ref` (palette) → `md.sys` (roles) → `md.comp`, with every role paired with an `on-` partner ([tokens](https://m3.material.io/foundations/design-tokens/overview));
    - five surface-container roles (lowest → highest) with tonal elevation rather than shadows ([color roles](https://m3.material.io/styles/color/roles));
    - standard, medium and high (7:1) contrast schemes ([color contrast](https://m3.material.io/foundations/designing/color-contrast)).
  - **Carbon:**
    - `$background → $layer-01 → $layer-02 → $layer-03`, with matching `$field-0n` and `$border-*-0n` tokens;
    - roles fixed across White, g10, g90 and g100, with only values changing;
    - component tokens never used outside their component ([tokens](https://carbondesignsystem.com/elements/color/tokens/));
    - g100 uses Gray 100 for background and Gray 10 for text, not `#000`/`#fff` ([themes](https://carbondesignsystem.com/elements/themes/overview/)).
  - **Polaris dark:** surfaces lighter than the page, with the same semantic keys overridden per theme ([dark.ts](https://github.com/Shopify/polaris/blob/main/polaris-tokens/src/themes/dark.ts)).
  - **Apple:**
    - "base" and "elevated" background sets, where elevated advances for popovers and sheets;
    - contrast ≥ 4.5:1 and aim for 7:1 for small custom-color text in dark;
    - test with Increase Contrast and Reduce Transparency, alone and together ([dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
  - **"Never pure black or white"** is common practice (M2 `#121212`, Carbon g100) rather than a universal standard. Apple doesn't state it. It is kept as a default, not a fail.
- **Installed skills:**
  - design-taste-frontend (`SKILL.md:531-593`): token strategy, no pure `#000`/`#fff`, test both modes, one theme per page.
  - dataviz: dark is "chosen, not auto-flipped".
  - apple-design (`SKILL.md:199-217`): honor `prefers-contrast: more` and reduced transparency; ease the theme switch.

**Change.** Add `references/theming.md` (SU-162–169). Add a defaults row: "Theme: semantic tokens only; dark surfaces ~#121212–#1c1c1e with lighter elevation, text ~87–92% L, accents lightened/desaturated; every pair passes in both schemes; `color-scheme` set (SU-162–169)".

| ID | Rule (draft) | Numbers | Check |
|---|---|---|---|
| SU-162 | **Three token tiers.** Primitive ramps (`--blue-600`) → semantic roles (`--surface`, `--surface-raised`, `--text`, `--text-muted`, `--border`, `--accent`, `--on-accent`, `--success/-warning/-danger` + `-surface`/`-text`, `--focus`) → optional component tokens. Components reference **only** semantic tokens. A scheme switch remaps semantic → primitive | 0 primitive or raw values in component CSS | page-map: read `:root` (and `[data-theme]`, `.dark`) custom properties; report `system.offTokenColors` = computed text, background and border colors that match no token value (ΔE OKLab < 0.02) → warn when more than 3 |
| SU-163 | **OKLCH ramps.** Build ramps in OKLCH with fixed lightness steps per index (e.g. 50 → L 0.97 … 900 → L 0.25). The same step then has similar contrast across hues. Re-tune chroma at the ends (SU-42). Gamut-map; hex fallbacks are optional now | text step vs surface step ≥ 4.5:1 across every hue at the same index pair | `contrast.mjs --palette tokens.json` (new): checks declared pairs (`text/surface`, `text-muted/surface`, `on-accent/accent`, `status-text/status-surface`, `border/surface` at 3:1, `focus/surface` at 3:1) in every scheme and prints a matrix |
| SU-164 | **Dark surfaces are dark gray, and elevation gets lighter.** Base about `#121212`–`#1c1c1e` (OKLCH L ≈ 0.16–0.22), never `#000` for app chrome (OLED-black is fine for media viewers). Each elevation level is a lighter surface (+0.03–0.05 L), because shadows read weakly. Body text ~87–92% L, not `#fff`. Muted text still ≥ 4.5:1 | base L 0.16–0.22; +0.03–0.05 L per level | page-map in dark: warn when the `body`/main surface is `#000` or when raised surfaces (dropdown, modal) are not lighter than base; audit: same contrast rules |
| SU-165 | **Every pair passes in both schemes, and status and accents are re-tuned for dark.** Light-scheme status badges (dark text on pale tint, SU-48) flip to light text on a deep, low-chroma tint. Accents get lighter and less chromatic (a dark-mode accent around L 0.70–0.80). Charts use their dark palette (dataviz). Apple: aim for 7:1 on small custom-color text in dark | all SU-45/46/141/145 thresholds in each scheme | `coverage.schemes`: the audit detects dark styles (`prefers-color-scheme` media rules, `[data-theme]`/`.dark` selectors, `light-dark(` in CSS) and lists the other scheme as an unaudited state, like `hiddenStates`; `scan.mjs` runs both via `emulateMedia` |
| SU-166 | **Scheme switching.** Default to the system preference. Offer a 3-state control (System / Light / Dark) and store only explicit overrides. Set `color-scheme` on `:root` (and `<meta name="color-scheme">`) so native controls match. Prevent the flash of wrong theme with a tiny inline head script. Use `light-dark()` for simple token pairs | n/a | warn: dark styles exist but the computed `color-scheme` is `normal` (native inputs and scrollbars stay light); info: the toggle has only 2 states |
| SU-167 | **Media in dark.** Logos and illustrations have dark variants (`<picture>` + `media="(prefers-color-scheme: dark)"`, or `currentColor` SVG). Photos are optionally dimmed slightly. Use no white-background images on dark surfaces | n/a | info: `img` whose average edge color is near white (canvas sample, same-origin only) on a dark surface |
| SU-168 | **Forced colors and increased contrast.** Boundaries and focus use `border`/`outline` (transparent is fine), never `box-shadow` or background alone. Icons use `currentColor`. Selected and checked states need a non-color cue. Use `forced-color-adjust: none` only for swatches. Under `prefers-contrast: more`, raise borders to 3:1+ and muted text to 7:1 | n/a | warn: focus indicated only by `box-shadow` (shared with SU-145); warn: buttons and inputs whose only boundary is background or shadow (no border or outline, even transparent); info: `forced-color-adjust: none` on large containers. Deep tier: Chromium `emulateMedia({ forcedColors: 'active' })` screenshot plus a focus walk |
| SU-169 | **Translucency has a solid fallback.** Glass and blur surfaces keep text ≥ 4.5:1 against the *worst* backdrop, and switch to solid under `prefers-reduced-transparency: reduce` (Chromium only) and forced colors | n/a | info: `backdrop-filter` surfaces containing text; the audit measures against the backdrop color, so the scrim must carry the contrast (SU-49) |

**Script changes in detail.**
- **`contrast.mjs`:**
  - parse CSS Color 4 (`oklch()`, `oklab()`, `lab()`, `lch()`, `color(srgb|display-p3 …)`, `hwb()`, the 148 named colors);
  - out-of-gamut values are gamut-mapped to sRGB for the ratio, with a note;
  - new `--palette <file.json|.css>` reads tokens (a JSON map, or `:root{}` and `[data-theme=dark]{}` blocks) and checks a declared pair list;
  - new `--scheme both`.
- **`audit.js`:**
  - `pageCanvas()` reads the computed `background-color` of `html`/`body` first and only guesses if transparent;
  - new `coverage.schemes: { current: 'light', other: 'dark', otherDetected: true }`.
- **page-map:** `system.tokens` (count of color tokens, `offTokenColors`, top off-token values with paths).

**Effort / impact.** M (rules 1 day; `contrast.mjs` parsing plus palette about 1 day, test-first; scheme coverage and off-token detection about 1 day) / **H**. Dark mode is where Claude-built UIs most often regress: badges, muted text and borders that pass in light fail in dark.

**Risks.**
- Off-token detection depends on how tokens are named and on resolving `var()` chains. Compare *values*, not names, to stay framework-agnostic.
- Sites without a token layer will see many off-token warnings, so cap them and make the flag `info` when no tokens exist.
- `emulateMedia` needs Playwright, so the in-page path only lists the other scheme as a to-do.
- Forced-colors emulation is Chromium-only.

**Test.**
- `tests/contrast.test.mjs`: new cases for `oklch(0.62 0.19 260)`, `color(display-p3 1 0 0)`, named colors, `--palette` with one failing dark pair. Write them first. They fail today with "Unknown color".
- Fixture `theming-bad.html` (dark rules present):
  - `#000` base;
  - a muted text at 3.2:1 in dark only;
  - a status badge that passes in light and fails in dark;
  - no `color-scheme`;
  - box-shadow-only focus.

  Expected: `coverage.schemes.otherDetected = true`, plus the listed findings when run in dark.
- Eval 8 (§5).

### G5. Responsive, zoom, reflow and touch (P1 · S–M · H)

**Gap.**
- Responsive behavior is one rule, SU-135, and its "measure" is "run the scripts at 375px too".
- Nothing detects:
  - horizontal page overflow;
  - zoom blocking;
  - text that clips at user text spacing;
  - hover-only affordances (B5);
  - iOS input zoom;
  - `100vh` traps on mobile;
  - drag-only interactions.
- There is no guidance on breakpoints, container queries or mobile navigation patterns.

**Evidence.**
- **1.4.10 Reflow (AA):** no two-dimensional scrolling at 320 CSS px wide. Exceptions are maps, diagrams, video, games, data tables (as a whole) and editing toolbars ([1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)).
- **1.4.4 Resize Text (AA):** 200% with no loss. Failures are `user-scalable=no`, `maximum-scale < 2` and viewport-unit-only font sizes ([1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)).
- **1.4.12 Text Spacing (AA):** no loss at line-height 1.5, paragraph spacing 2em, letter 0.12em and word 0.16em. The test is to inject those values and look for clipping ([1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)).
- **1.4.13 Content on Hover or Focus (AA):** content must be dismissible, hoverable and persistent ([1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)).
- **2.5.7 Dragging Movements (AA, new in 2.2):** a single-pointer alternative for every drag. Keyboard support alone doesn't satisfy it ([2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)).
- **2.5.8 Target Size (AA):** a 24px floor. The house 44px goal matches 2.5.5 (AAA) and Apple's 44pt. Material uses 48dp. Reports should say "fails 2.5.8 (< 24)" vs "below house 44" ([2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
- **Platform (Baseline per web-features, Oct 2026):**
  - `dvh/svh/lvh` widely available (2025-06);
  - size container queries and `cqi` widely available (2025-08);
  - container style queries newly available (2026-05);
  - scroll-state queries Chromium-only;
  - `field-sizing: content` newly available (2026-06).
- **Breakpoints:**
  - **M3 window classes:** compact < 600, medium 600–839, expanded 840–1199, large 1200–1599, XL ≥ 1600. One pane at compact and medium, two at expanded and up. Keep text at 40–60 characters per line at every size ([window size classes](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)).
  - **Carbon:** 320 / 672 / 1056 / 1312 / 1584 ([2x grid](https://carbondesignsystem.com/elements/2x-grid/overview/)).
  - **Polaris:** 490 / 768 / 1040 / 1440.
- **Navigation:**
  - **M3 nav bar:** 3–5 destinations, always icon plus label ([navigation bar](https://m3.material.io/components/navigation-bar/guidelines)).
  - **Apple tab bars:** label every tab and avoid "More" ([tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)).
  - **NN/g:** hidden (hamburger) navigation cut discoverability by more than 20% and made tasks 39% slower on desktop ([hamburger menus](https://www.nngroup.com/articles/hamburger-menus/)).
- **Targets:** Apple iOS 44pt; M3 48dp with 8dp between; NN/g about 1cm.
- **Inputs:** GOV.UK uses `inputmode="numeric"` instead of `type="number"`, and `spellcheck="false"` for names, emails and references ([text input](https://design-system.service.gov.uk/components/text-input/)).
- **Pinned form buttons conflict:** Carbon says don't pin form buttons, while M3 and Apple favor reachable bottom actions on mobile. The draft allows a sticky bar only on mobile, with `scroll-padding` and the safe-area inset.

**Change.** Add a new file, `references/responsive.md` (SU-170–177). SU-135 remains the summary rule and points to it.

| ID | Rule (draft) | Numbers | WCAG | Check |
|---|---|---|---|---|
| SU-170 | **Reflow at 320.** No horizontal page scroll at 320 CSS px wide (= 1280 at 400% zoom). Wide tables, code, maps and charts scroll inside their own container, with a visible edge or shadow cue and `tabindex=0` plus a name so keyboard users can scroll them | `scrollWidth ≤ clientWidth + 1` at 320 | 1.4.10 | New `reflow` check, active when `innerWidth ≤ 400` (the scan runs a 320×640 pass): fail if the document overflows; list the offenders (rect right > `innerWidth`, not inside an `overflow-x:auto/scroll` ancestor, excluding `table, pre, canvas, video, svg, [role=img], [role=application]`); warn: a scrollable region without `tabindex`/name |
| SU-171 | **Zoom and text resize.** Never block zoom. Font sizes in `rem`. No fixed `height` on text containers. Nothing clips at 200% | viewport meta has no `user-scalable=no` and `maximum-scale ≥ 2`; root font size not px-locked | 1.4.4 | fail: blocking viewport meta (`document.querySelector('meta[name=viewport]')`); warn: `html{font-size}` in px or `vw`-only font sizes (static CSS scan); deep tier: set root `font-size: 200%` and rerun the clipping scan |
| SU-172 | **Text spacing tolerance.** Text boxes grow with content, and truncation always has a way to reveal the full text | no clipping with the 1.4.12 stylesheet injected | 1.4.12 | `window.__shibroAudit = { textSpacing: true }` injects the WCAG stylesheet, then flags text elements with `scrollHeight > clientHeight + 2` under `overflow: hidden/clip`, or newly truncated (`text-overflow: ellipsis`). The stylesheet is removed afterwards (pure: restores state) |
| SU-173 | **Breakpoints by window class, components by container.** Layout switches at window classes. Components respond to their *container* with `@container` + `container-type: inline-size`, not the viewport. Fluid type uses `clamp()` within ±25% of base and never shrinks body text below 16px | compact < 600, medium 600–839, expanded 840–1199, large ≥ 1200 (M3 classes, see evidence) | n/a | info (page-map): the media-query breakpoints in use (from `CSSMediaRule` `min-width`/`max-width`); warn when there are more than 5 distinct breakpoints, or near-duplicates (767/768) |
| SU-174 | **No hover-only affordances.** Anything revealed on hover is also revealed on `:focus-within`, and is always visible on `(hover: none)` devices. Hover and focus popups are dismissible with Escape, hoverable and persistent | 0 hover-only reveals | 1.4.13, 2.1.1 | G11's hover-reveal detection → warn; in `scan.mjs`: hover the trigger, press Escape, assert the popup hides |
| SU-175 | **Touch input.** Text inputs ≥ 16px font, or iOS zooms on focus. Use the right `type`/`inputmode`/`enterkeyhint`: `inputmode="numeric"` rather than `type="number"`, and `spellcheck="false"` on names, emails and codes (GOV.UK). Every drag (sort, reorder, swipe-to-delete, slider) has a tap or click alternative | input `font-size ≥ 16px` on touch layouts | 2.5.7, 2.5.8 | warn at ≤ 480px: text inputs under 16px; info: `[draggable=true]` or `touch-action` handlers with no sibling button or menu offering "Move", "Delete" or "Set value" |
| SU-176 | **Mobile viewport.** Full-height layouts use `100dvh` (or `svh` for minimums), not `100vh`. Fixed bars respect `env(safe-area-inset-*)` with `viewport-fit=cover`. Sticky bottom action bars stay ≤ 25% of height and set `scroll-padding-bottom` to their height | n/a | 2.4.11 | info: `100vh` on full-height containers (static CSS); warn: fixed bottom bar with no `padding-bottom: env(safe-area-inset-bottom)` when `viewport-fit=cover` is set |
| SU-177 | **Mobile navigation pattern.** 3–5 top-level destinations go in a bottom bar, always icon plus label (M3, Apple), and more go in a drawer or "More". Never hide primary navigation behind a hamburger on desktop (NN/g: more than 20% less discoverable). The primary action sits in the thumb zone (bottom half). A side panel becomes a sheet or drawer, never a squeezed column | bottom bar ≤ 5 items, 48–56px tall plus safe area | n/a | page-map at ≤ 480px: info when the primary action (SU-121) is in the top 15% and there is no bottom bar; warn: a bottom nav with more than 5 items |

**`SKILL.md` changes.**
- Step 1 of the screen workflow becomes "screenshots at 1280×900 and 375×812, *plus* the 320 reflow probe (no screenshot)".
- The defaults table gains: "Responsive: no horizontal scroll at 320; zoom never blocked; hover reveals also on focus and touch; inputs ≥ 16px on mobile; `100dvh` (SU-170–177)".

**Effort / impact.** S–M:
- The reflow, viewport-meta and input-size checks are about 60 lines.
- Text spacing is about 50.
- Hover reveal falls under G11.

Impact **H**: reflow is the most common failure on Claude-built layouts with fixed-width tables or toolbars *(judgment, from the eval screenshots and common practice)*, and the check is near-zero false-positive.

**Risks.**
- Allowed 2-D exceptions (data tables, maps) need human judgment, so the check lists them under `info`.
- `100vh` is fine on desktop-only apps, so keep it at info.
- Breakpoint numbers differ between systems. State them as defaults and say "fit the project's" (component workflow, step 3).

**Test.**
- `tests/fixtures/responsive-bad.html`:
  - a `min-width: 900px` toolbar;
  - `user-scalable=no`;
  - a 14px input;
  - `height: 40px` on a paragraph box;
  - hover-only row actions;
  - `100vh` hero.
- The fixture runner loads it at 320×640 and 1280×900. The good twin passes both.
- Eval: "make this dashboard work on phones" (dashboard input) and "build a mobile settings screen with a bottom nav", graded by the 320 reflow check, axe and the blind judge at 375.

### G6. Eval v3 and headless fixture tests (P1 · M · H, enabler)

**Gap.**
- **Single runs:** every cell is n=1.
- **No baseline for v2:** v2 was compared only with v1, with no no-skill arm. Iteration 1 showed plain Claude already at about 96%.
- **Self-graded:** the grader is the skill's own `page-map.js`/`audit.js`, whose budgets *are* the rules. `RESULTS.md` says so itself.
- **Censored timing:** both v1 runs stopped at the 600s cap, so "v2 is 40% slower" compares against a truncated number. The settings eval alone is 704s vs 599s (+17%).
- **Assertions that never discriminate:** "audit 0 fails" passed in every arm.
- **No held-out screens and no trigger set:** only 4 hand probes.
- **One model:** everything ran on Opus 5.5.

**Evidence.**
- Anthropic's [Demystifying evals for AI agents](https://anthropic.com/engineering/demystifying-evals-for-ai-agents) recommends:
  - several trials per task, reporting pass@k and pass^k (a 75% per-trial rate gives about 42% pass^3);
  - balanced should/shouldn't sets;
  - grading outcomes, not paths;
  - LLM judges with an "Unknown" option, calibrated against humans;
  - tracking cost and latency.
- [agentskills.io: evaluating skills](https://agentskills.io/skill-creation/evaluating-skills) recommends:
  - with and without the skill, or against the old snapshot;
  - dropping assertions that pass in every configuration;
  - code graders for mechanical checks and an LLM only for the rest;
  - blind comparison for holistic quality.
- The installed skill-creator already ships the tooling:
  - `scripts/aggregate_benchmark.py` (mean ± stddev of pass rate, time and tokens);
  - `agents/comparator.md` (a blind A/B judge);
  - `agents/grader.md`;
  - `eval-viewer/generate_review.py` (human review);
  - `scripts/run_loop.py` (description optimization on a 60/40 train/held-out split, 3 runs per query).
- [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals) runs each case 3× with and without the plugin and reports Δ and cost per case. Using it requires packaging shibroUI as a plugin.
- On independent graders, axe-core (≈105 rules, [rule list](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)) covers:
  - contrast, labels, link-in-text-block, table header association, heading order, landmarks and `region`;
  - `target-size` for WCAG 2.2, which is **off by default**.

  Deque reports automated axe testing finds about 57% of issues by volume ([press release](https://www.businesswire.com/news/home/20210310005156/en)). That is vendor-reported and by volume, not by success criterion. It says nothing about design quality: budgets, hierarchy, rhythm.

**Change.**
1. **`tests/run-fixtures.mjs`** (new, with Playwright as a devDependency):
   - Loads each `tests/fixtures/expected.json` entry headless at 1280×900 and, where marked, at 375×812.
   - Opens the listed state, injects the script and asserts `mustFail`, `mustFlag` and `maxFails`.
   - Wire it as `npm run test:fixtures`, and run it in `npm test` when Playwright is installed.
   - This is the red/green loop for every script change below.
   - Keep `tests/audit.html` for manual debugging.
2. **Split fixtures from eval inputs.** Copy `evals/files/*.html` into `tests/fixtures/` (B16), and from then on change only the fixture copies when testing checks. Eval inputs stay frozen.
3. **`evals/triggers.json`** (new), in skill-creator format: 12 should-trigger and 12 near-miss should-not prompts.
   - Should-trigger includes quick questions ("what max-width and line-height for blog body text?", "is 14px ok for button text?"), builds, reviews and "looks off" phrasings, in formal and casual voice.
   - Near-miss negatives include a Tailwind config error, a React state bug, a canvas game loop, CSS-in-JS library choice, API design and hex→rgb.
   - Run 3× each. Report the trigger rate and pass^3.
4. **`evals/evals.json` v3:**
   - Three arms (`with_skill`, `old_skill` = v2 snapshot, `without_skill`), 3 runs each.
   - `runs_per_configuration: 3` and a raised time cap (1,200s). Record "hit cap" as its own outcome rather than a time.
   - Demote non-discriminating assertions to a `regression: true` group that isn't counted in the headline delta.
   - Add evals that exercise G1–G5: a sign-up form with validation states, a dark-mode toggle task, a responsive nav at 320/375, a data-table loading/empty/error task, and an RTL variant.
   - Add 2–3 quick-question evals graded on the answer (the numbers plus the SU ID), with `skill-triggered` tracked separately.
5. **Independent graders**, which live in `evals/graders/`, are never shipped in `shibroui/`, and never run by the skill:
   - **`axe.mjs`:** axe-core with `target-size` enabled, run per state. It reports violations by rule and is used as a floor ("no mechanical regressions"), not as a quality claim.
   - **`judge.md`:** a blind pairwise prompt adapted from skill-creator's `comparator.md`.
     - A/B order is randomized.
     - The rubric covers hierarchy and focal point, primary action, consistency, state handling and polish.
     - It allows an "Unknown" verdict.
     - It uses a different model from the builder, and is never shown page-map output.
   - **Human review:** 10 minutes per eval using `generate_review.py`, with feedback saved to `evals/feedback.json`. Calibrate the judge against it once.
   - **Optional second engine:** IBM Equal Access `accessibility-checker` or pa11y *(coverage unverified)*. Lighthouse's accessibility score is reportedly axe-based *(unverified)*, so it adds little independence.
6. **Held-out set** in `evals/heldout/`: 3–4 screens nobody tunes against (login, pricing, data table plus filters, mobile nav). Run once per release.
7. **Report format** in `RESULTS.md`: per arm, mean ± sd of pass rate, time and tokens; pass^3 for triggers and quick answers; axe violations; judge win rate with a 95% interval; a "hit cap" count; and the model.

**Effort / impact.** M (1–2 days, mostly harness) / H. Every later item needs this to show a real gain.

**Risks.**
- **Cost:** 3 arms × 3 runs × about 10 evals is about 90 agent runs per release, roughly 20M tokens at today's averages. Keep the full matrix for releases, and use 1 run of the changed evals per PR.
- **Judge bias:** judges prefer longer or more decorated pages. Randomize the order and calibrate against humans.

**Test.** The harness is the test. Sanity-check it on v2 first:
- The v2 vs no-skill delta on evals 4–5 should reproduce the direction of iteration 3.
- If v2 doesn't beat the no-skill arm under the blind judge, that is the most important finding of v3.

### G7. Workflow cost: tiers plus a one-call scan (P1 · M · H)

**Gap.**
- The v2 screen workflow took 847s vs 599s (+40%, censored, see G6) and 248k vs 210k tokens (+18%).
- Time grew more than tokens, which points to sequential browser round-trips *(inferred)*: one page-map run, one audit, then open each hidden state by hand and audit again.
- G1–G5 add more probes (schemes, reflow, text spacing), so without a change v3 would be slower still.

**Evidence.** Anthropic's skill guidance:
- Only script *output* costs tokens, so run scripts rather than reading them, and keep outputs compact ([best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)).
- `context: fork` keeps intermediate output out of the main thread ([skills docs](https://code.claude.com/docs/en/skills)).
- After compaction only the first 5k tokens of an invoked skill survive, so essentials go first.
- Iteration 2 already showed that budgets work: tool calls went from 70 to 35 and time from 417s to 222s.

**Change.**
1. **`scripts/scan.mjs`** (new, Node with Playwright, the same dependency as G6). This is optional: the in-page scripts stay the fallback. One Bash call does all of this:
   - opens the URL at 1280×900 and 375×812, and at 320×640 for the reflow probe;
   - runs page-map and audit;
   - clicks each `coverage.hiddenStates[].opensWith` and audits that state;
   - repeats in the other color scheme (`emulateMedia({ colorScheme })`) when dark rules exist (G4);
   - takes screenshots;
   - writes `scan-report.json` and prints a **compact summary**: one line per rule with ID, level, count and worst value, then states covered and not covered, then budgets.

   It also stops depending on a working browser MCP (Playwright MCP failed to connect in this very session).
2. **Compact output mode for the in-page scripts.** Set `window.__shibroAudit = { compact: true }` to get `{ id, level, count, worst, firstPath }` per rule plus `coverage`. The full report stays in `window.__shibroAuditResult` for drilling into one rule.
3. **Depth tiers in `SKILL.md`**, replacing "Pick the scope":

   | Tier | When | Does |
   |---|---|---|
   | Quick | Factual question | Answer from the defaults table with the rule ID; no browser |
   | Component | One component or tweak | 1 audit per state plus 1 confirming run |
   | Screen: standard (default) | Build, redesign or review | Screen read, then page-map, then audit of default plus key states, all in one `scan` call. 1280 plus the 320 reflow probe. At most 2 fix→verify cycles |
   | Screen: deep | "Make it perfect", releases, audits, or the user asks | Every state × both schemes × 1280/375/320, plus the text-spacing probe, plus the coverage table |

4. **Move the screen workflow body** (about 3.5k tokens) into `references/screen-workflow.md`, leaving a 5-line pointer, so quick and component runs don't load it. Measure this, because it costs one extra Read on screen tasks.
5. **Fork experiment.** Try `context: fork` for the deep tier's per-state audits only if the compact output isn't enough. Forks add startup overhead and don't see the conversation.

**Effort / impact.** M / H. The target is v3 standard tier ≤ v2 time with v3's extra checks included, on the median of 3 runs.

**Risks.**
- Playwright is a heavy dependency for a skill. Keep it optional, and keep the in-page scripts working without it.
- Auto-clicking `opensWith` triggers can cause side effects on real apps (submitting, deleting). Only click elements matching `[aria-expanded], [role=tab], summary, [aria-haspopup], [popovertarget], [commandfor]`, never inside a `form`'s submit path, and only on `localhost` or `file` origins unless the user passes `--allow-remote`.

**Test.** Fixture: `scan.mjs` on the dashboard fixture must reach every state listed in `expected.json` (`minHiddenStates`) and reproduce the per-state `mustFail` sets. Eval: time and tokens per tier on evals 4–5, 3 runs each, against the v2 snapshot.

### G8. Trigger reliability (P2 · S · M)

**Gap.** Quick factual questions trigger only sometimes. The blog-width probe missed twice, though the answers "matched the rules anyway".

**Evidence.**
- **Description wording:** the description is the trigger, and the docs say to put the key use case first, in words users say ([skills docs](https://code.claude.com/docs/en/skills), [best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)). The current description is 1,017 characters, near the 1,024-character API limit. It opens with the brand name and "this user's UI standard", and spends characters on inventory (rule counts, script names).
- **A ceiling on simple queries:** skill-creator notes Claude consults skills mainly for tasks it can't easily do itself, so simple queries may not trigger "even if the description matches perfectly". Wording alone has a ceiling for quick questions.
- **Hooks:** one community measurement (22 prompts × 2 runs, Sonnet 4.5) found 50–55% activation without a hook and 100% with a forced-eval `UserPromptSubmit` hook, with 0 false positives on 5 negatives ([Spence 2025](https://scottspence.com/posts/measuring-claude-code-skill-activation-with-sandboxed-evals)). It is small and directional.
- **Hook placement:** hooks in skill frontmatter only register after the skill is invoked, so they can't help the first prompt.

**Change.**
1. **Rewrite the `SKILL.md` description** in the third person, use case first, about 750 characters, naming the nouns from the failing probe:
   > Numeric UI design rules (shibroUI) for building, reviewing and answering questions about web interfaces. Use when writing or changing HTML/CSS/Tailwind/React/Vue/Svelte UI; when a screen looks off, cluttered or amateur; and for quick design-value questions such as body text max-width and line-height, line length, type scale, contrast ratio, button or tap target size, padding and spacing, border radius, shadow, animation duration, focus ring, dark mode colors, form errors, loading states, table or form layout. Check this before answering any UI sizing, spacing, color or motion question from memory, because its numbers differ from generic advice. Includes page-map and audit scripts.

   Keep the inventory in the body. `when_to_use` is Claude-Code-only and is a hard error in claude.ai uploads, so avoid it if the skill should also work there.
2. **Optional `UserPromptSubmit` hook**, shipped as `hooks/shibroui-hint.sh` with install notes. Never install it automatically.
   - It regex-matches the prompt for UI nouns (`max-width|line-height|font-size|contrast|padding|spacing|radius|shadow|tap target|modal|dashboard|tailwind|dark mode|…`).
   - It returns `additionalContext` with one factual sentence ("UI values in this environment come from the shibroui skill; its numbers differ from generic defaults").
   - A heavier variant injects the 37-line defaults table itself, so quick answers are right even without a Skill call.
   - The docs warn that imperative injected text can trip prompt-injection defenses, so phrase it factually.
3. **Don't set `paths`**, which would block file-less questions, or `disable-model-invocation`, which removes the description from context.
4. **Split into a `shibroui-defaults` skill** only if items 1 and 2 miss the target. It means two listing entries and a risk of double triggering.

**Effort / impact.** S / M. The target is ≥ 90% trigger (pass^3 ≥ 75%) on the should-trigger set, and ≤ 10% on near-misses.

**Risks.** An over-broad description or hook pulls the skill into non-UI work (false positives cost about 3.5k tokens each), and the hook keyword list needs upkeep. Measure both arms in `evals/triggers.json`.

**Test.** `evals/triggers.json` × 3 runs in four configurations: current, rewritten, rewritten plus hook, rewritten plus a CLAUDE.md pointer. Also run Sonnet and Haiku, since trigger behavior is model-specific. Use skill-creator's `run_loop.py` for the wording, then confirm on the real install with a `claude -p` stream check, because `run_eval.py` registers the description as a temporary command rather than the real skill.

### G9. Microcopy and content design (P2 · S · M)

**Gap.**
- Copy rules today are SU-6 (descriptive links), SU-111 (consistent names) and SU-112 (one tone).
- There is no guidance on:
  - button labels;
  - error wording;
  - confirmation dialogs;
  - capitalization;
  - numbers and dates;
  - placeholder misuse;
  - the fake content Claude tends to seed (lorem, "John Doe", 99.99% uptime, "Oops!").
- Seven of the thirteen installed skills cover microcopy, which makes it one of the most widely covered gaps.

**Evidence.**
- **Installed skills:**
  - impeccable `clarify.md` covers errors, labels, CTAs, help, success, loading and confirmations.
  - frontend-design (`SKILL.md:61-71`): verb CTAs, "Publish" → "Published", errors that don't apologize.
  - redesign-existing-projects (`SKILL.md:77-90`): realistic content, sentence case, no "Oops!".
- **Error wording:** NN/g error-message guidelines say errors should be visible, explicit, human-readable, polite, precise and constructive ([NN/g](https://www.nngroup.com/articles/error-message-guidelines/)). GOV.UK error messages are specific and instructive ("Enter a date of birth in the past"), with no "please", "sorry" or "invalid" ([GOV.UK error message](https://design-system.service.gov.uk/components/error-message/)).
- **Further design-system guidance:**
  - **Polaris** ([fundamentals](https://polaris.shopify.com/content/fundamentals), [grammar and mechanics](https://polaris.shopify.com/content/grammar-and-mechanics), now on shopify.dev):
    - sentence case;
    - about 7th-grade reading level;
    - verb-first, "Create order" over "New order";
    - numerals with thousands separators, en-dash ranges;
    - relative timestamps ("13 minutes ago" → "Yesterday at 10:30 am" → "Aug 14, 2016").
  - **Apple alerts** ([alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)):
    - title ≤ 2 lines, never "Error";
    - 1–2 word verb buttons;
    - no "OK" except informational, no Yes/No;
    - Cancel is never the default for destructive actions.
  - **M3:** sentence case everywhere; no "please", "sorry" or "thank you" in errors ([UX writing](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices)).
  - **GOV.UK style:** check sentences over 25 words; "4 June 2017"; no "please"; front-load link text ([A–Z style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)).
  - **Carbon empty states:** three types (no data, user action, error), with a positive, action-led title ([empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/)).

**Change.** Add `references/content.md` (SU-178–184) and a defaults row: "Copy: buttons = verb + object; sentence case; errors say what happened + how to fix; dialogs name the action; real-looking sample data (SU-178–184)".

| ID | Rule (draft) | Check |
|---|---|---|
| SU-178 | **Buttons name the outcome: verb + object** ("Create invoice", "Delete 3 files"). Dialog buttons repeat the title's verb. Avoid OK, Yes/No, Submit, Confirm and Click here. A destructive button never says only "Delete" when the object is ambiguous | warn: buttons inside `dialog`/`[role=dialog]` with text in {OK, Yes, No, Submit, Confirm, Continue} *(English list, B10)*; info: page-wide `Submit` |
| SU-179 | **Sentence case, front-loaded, short.** Headings and buttons use sentence case, with the key word first. Labels ≤ 3–4 words, headings ≤ about 8, buttons ≤ 3 words that never wrap | info: headings and buttons in Title Case (3+ words, all capitalized, not proper-noun lists); warn: a button label wrapping to 2 lines |
| SU-180 | **Error formula: what happened, and how to fix it**, in the user's terms, without blame, codes alone or "invalid". Put field errors next to the field (SU-151) and system errors next to the region (SU-160) | warn: generic error text (shared regex with SU-151); info: error text containing only a code (`/^(error )?[A-Z0-9_-]{3,}$/`) |
| SU-181 | **Confirmation dialogs.** The title is the question with its object ("Delete project 'Atlas'?"), the body gives the consequence ("This removes 24 invoices. You can't undo this."), and the primary button repeats the verb. Prefer Undo (SU-161) for reversible actions. Type-to-confirm only for irreversible, high-blast-radius actions | warn: an `alertdialog`/`dialog` whose title doesn't end in "?" and whose buttons are OK/Cancel |
| SU-182 | **Numbers, dates and units are consistent.** One format per screen. Relative time for under about 7 days, with the absolute date in `title` or a tooltip. Units sit with values (SU-27), joined by a non-breaking space. Round to the precision people use | manual; the SU-16/17 checks stay |
| SU-183 | **Plain language, with instructions outside the input.** Aim for about 7th-grade reading level (Polaris) and split sentences over 25 words (GOV.UK). Avoid internal jargon (match SU-111's audience term). Placeholders hold examples at most, never instructions or labels (SU-148) | info: placeholder text starting with an imperative verb ("Enter…", "Type…") |
| SU-184 | **Real-looking content in builds and demos.** Use plausible names, numbers and dates that vary in length (they also stress-test layout). No lorem, "John Doe" or round 99.99%/1,234 values, no "Oops!". The user's spec still wins (SU's component workflow, step 1) | info: `lorem ipsum`, `John Doe`, `Jane Doe`, `foo@bar`, `example@example.com` found in visible text |

**Effort / impact.** S (rules and about 60 lines of checks) / M. Copy is a large part of perceived quality, and most of it isn't measurable, so the rules carry most of the weight.

**Risks.**
- Everything text-based is language-specific.
- Title Case detection misfires on product names. Keep it `info`.
- Copy style is partly brand. Note "unless the project's style guide says otherwise".

**Test.**
- `content-bad.html`:
  - an "OK/Cancel" delete dialog;
  - "Invalid input";
  - Title Case buttons;
  - an "Enter your email" placeholder-as-instruction;
  - "John Doe".
- Plus a good twin.
- The judge rubric in §5 has a "copy" dimension. Eval 6 asserts error texts follow SU-180 (graded by the judge with the formula).

### G10. Data visualization (P2 · M · M)

**Gap.**
- Dashboards are a core shibroUI use case (eval 4, the dashboard pattern), but charts get one rule, SU-43 (direct labels and patterns).
- The scripts skip SVG text and marks and treat `canvas` as an image (B3). Axis-label contrast, mark contrast and chart names are never checked.

**Evidence.**
- **The bundled `dataviz` skill already covers this.** It covers chart-form choice, color by job (categorical, sequential, diverging, status), mark specs (bars ≤ 24px with a 4px data-end radius, 2px lines, 1px recessive grid), table views, dark mode and an anti-pattern catalog. It also ships `validate_palette.js`, which checks:
  - OKLCH L band 0.43–0.77 (light) or 0.48–0.67 (dark);
  - C ≥ 0.10;
  - CVD ΔE ≥ 8 (floor 6);
  - marks ≥ 3:1.

  Its description triggers on "chart", "dashboard", "KPI" and "stat tile". *(Source: installed skill, `dataviz/references/*.md`, read for this proposal.)*
- **WCAG:** 1.4.11 requires 3:1 for graphical objects needed to understand content (chart lines, meaningful icons), and 1.4.1 forbids color-only meaning.
- **Design systems:**
  - **Carbon data viz** ([color palettes](https://carbondesignsystem.com/data-visualization/color-palettes/), [axes and labels](https://carbondesignsystem.com/data-visualization/axes-and-labels/), [legends](https://carbondesignsystem.com/data-visualization/legends/), [dashboards](https://carbondesignsystem.com/data-visualization/dashboards/)):
    - categorical colors in a fixed order;
    - bar and area charts start at zero;
    - never interpolate across gaps;
    - label directly and avoid legends (a legend stays ≤ 30% of chart height);
    - pie slices under 3° need callouts;
    - on dashboards, the same color per data set throughout, and the most important data largest and highest-contrast.
  - **Apple:** the title states what the chart shows, with accessibility labels for values; a list or table when people only need lookup; color meaning is cultural ([charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data)).

**Change.**
- **Don't duplicate dataviz. Route to it, and own only what dataviz can't do: in-page measurement and the screen-level fit.**
- **`SKILL.md` rule map:** "Charts: follow the `dataviz` skill for chart form, palette and marks. shibroUI checks the chart's fit in the screen (SU-119/127 budgets) and measures it (SU-185–191)."
- **`references/dataviz.md`** (short, SU-185–191) holds only the rules the audit can measure or that tie charts into the screen system:

| ID | Rule (draft) | Check |
|---|---|---|
| SU-185 | **The chart answers the screen's job.** A KPI with a delta and sparkline when one number matters; one primary chart per dashboard (SU-119) | page-map: more than 2 charts with equal top-tier visual weight → SU-119 flag already fires; add `charts` to the wireframe labels (svg/canvas over 200×120 = `[chart]`) |
| SU-186 | **Honest scales.** Bars start at zero, small multiples share a scale, no dual axes | manual (checklist) |
| SU-187 | **Series colors come from a validated palette and stay in the color budget.** Chart hues are exempt from SU-127's "one accent" only when they come from the chart tokens (`--chart-1…n`) | page-map: saturated SVG fills/strokes not in `--chart-*` tokens count against SU-127; info pointing to `dataviz/scripts/validate_palette.js` |
| SU-188 | **Marks are visible: series ≥ 3:1 against the plot background, and adjacent series distinguishable without color** (pattern, dash, direct label, SU-43) | audit: SVG `path/rect/circle/line` with a stroke or fill, grouped by color, each color vs `backdropAt` → warn under 3:1 (1.4.11) |
| SU-189 | **Chart text is real, readable text.** Axis and labels ≥ 12px and ≥ 4.5:1, tabular figures, units in labels | audit: include `svg text` in the contrast and size walker (B3); SU-16 check on tick labels |
| SU-190 | **Every chart has a text alternative.** `role=img` + `aria-label` stating the takeaway, *plus* a data table or "View as table", tooltips reachable by focus and dismissible (1.4.13) | audit: fail when an SVG or canvas chart (≥ 10 marks or over 200×120) has no accessible name; warn when no `table` or "table" toggle is nearby; info for `canvas` ("contents not measurable") |
| SU-191 | **Chart states:** loading (axis skeleton), empty for the period, error with retry, sparse data (one point). Fewer ticks below 480px | part of SU-155's state matrix |

**Effort / impact.** M (SVG mark contrast is the hard part, about 150 lines) / M. Medium because dataviz already guides construction; shibroUI adds verification.

**Risks.**
- SVG mark grouping in chart libraries (Recharts, ECharts SVG, D3) varies, so stay heuristic (`warn`) and cap instances.
- Canvas charts (Chart.js, ECharts canvas) remain unmeasurable. Say so in `coverage.skipped`.
- Two skills might give conflicting chart color advice, so name dataviz as the authority for palette.

**Test.**
- `tests/fixtures/chart-bad.html`:
  - an inline SVG line chart with a 2:1 series;
  - 10px axis text at 3:1;
  - no `aria-label`;
  - no table.
- Plus a good twin, and a canvas chart that must appear in `coverage.skipped`.
- Eval: the dashboard redesign (eval 4) gains assertions: "chart has a name and table alternative"; "no SU-188/189 warns".

### G11. Script robustness: shadow DOM, iframes, scroll containers, large pages, hover, JS motion (P2 · M · M)

**Gap.** Blind spots B5, B8, B9, B10, B11, B12 and B13 from §3.2.

**Change.** No new rules. `audit.js` and `page-map.js` would each get the following:

| Fix | How | Output |
|---|---|---|
| **Shadow DOM** | A `deepQuery(root, sel)` helper that recurses into `el.shadowRoot` (open roots only), used by every collector | `coverage.checked.shadowRoots: n`; `coverage.skipped['closed shadow root']` (count of custom elements with no open root) |
| **Iframes** | Same-origin: run the same checks on `frame.contentDocument` with its offset. Cross-origin: list it | `coverage.skipped['cross-origin iframe']` with `src` |
| **Scroll containers** | Find the primary scroller: the largest element with `overflow-y: auto/scroll` and `scrollHeight > clientHeight + 50`, covering ≥ 50% of the viewport. Use it for "first screen", `pageRect` and `aboveFold` | `viewport.scroller: path` in both reports |
| **Hover-only reveal** | Collect CSS rules whose selector contains `:hover` and that set `opacity` above 0, `visibility: visible` or a `display` other than `none` on a descendant that is `opacity:0` or `visibility:hidden` at rest. Flag the descendant if no matching `:focus-within`/`:focus-visible` rule and no `@media (hover: none)` override exists. Also list it in `hiddenStates` with `kind: 'hover reveal'` | New SU-174 finding (G5) |
| **JS motion** | Read `document.getAnimations()` *before* finishing them, and report duration, easing and target for finite ones. Optional `window.__shibroAudit.watchMotion = 1000` records animations started in the next 1s after the agent triggers a state | Extends SU-82/85 to WAAPI, Motion and GSAP (when GSAP uses WAAPI or CSS; pure-rAF tweens stay invisible, so add a note) |
| **i18n heuristics** | `VAGUE` and `STATUS_WORD` become per-language maps keyed by `document.documentElement.lang`, with an `__shibroAudit.words` override. Unknown language: skip the check and record it in `coverage.skipped` | Fewer false warnings outside English |
| **Token-aware scale** | Read `:root` custom properties matching `/^--(space\|spacing\|size\|gap)-/` (and Tailwind v4's `--spacing`). When present, they replace `SCALE` | `system.spacing.scaleSource: 'tokens' \| 'default'` |
| **Large pages** | Shared `getComputedStyle` cache (as page-map has); a spatial grid for the target-pair loop (O(n) neighbours); a `maxMs` budget (default 4,000ms) after which remaining checks are listed in `capsHit`; auto-suggest `root` scoping when there are more than 3,000 elements | `ms` per check in `coverage.timing` |
| **Virtualized lists** | Detect `[aria-rowcount]` greater than the rendered rows, or a scroller containing many same-height absolutely positioned rows | `notes`: "virtualized list: only N of M rows rendered" |

**Effort / impact.** M (2–3 days) / M. Shadow DOM and the scroll container are the two with real-world impact. The rest is hygiene.

**Risks.**
- Deep traversal can double-count slotted content. Dedupe by node identity.
- Hover-rule parsing is heuristic. Keep it at `warn` and cap instances.
- More checks mean slower runs, so the `maxMs` budget is a must.

**Test.**
- New `tests/fixtures/edge-cases.html` containing:
  - a custom element with an open shadow root holding a 1.5:1 text (must fail SU-45);
  - a same-origin iframe with an unnamed button (must fail SU-140);
  - an app shell with `main` as the scroller and the CTA 1,200px down inside it (must flag SU-120);
  - a `.row:hover .actions{opacity:1}` pattern (must flag SU-174);
  - `lang="de"` with "Mehr erfahren" links (must flag SU-6);
  - a WAAPI animation of 900ms (must flag SU-85).
- Performance fixture: a generated 5,000-element page, where the audit must finish in under 4s or report `capsHit`.

### G12. Framework adapters: Tailwind v4, shadcn/ui, React (P2 · M · M)

**Gap.**
- The description says "HTML/CSS, Tailwind, React, Vue, Svelte", but every rule is written in raw CSS.
- Most real output from Claude is Tailwind and React, often shadcn/ui. There the mistakes look different:
  - `p-[13px]` arbitrary values;
  - `outline-none` with no ring;
  - `h-screen`;
  - `opacity-0 group-hover:opacity-100` row actions;
  - 36px `size="icon"` buttons.
- These can be caught **statically, before any browser exists**, which is also the cheapest check there is.

**Evidence.**
- **Tailwind v4 (2025) is CSS-first.** Tokens live in `@theme` (`--spacing`, `--text-*`, `--radius-*`, `--shadow-*`, `--color-*`), and the default palette is OKLCH ([Tailwind v4 docs](https://tailwindcss.com/docs/theme)).
- **`outline-none` changed meaning in v4.** It now sets `outline-style: none`. The old transparent-outline behavior, which survives forced colors, was renamed `outline-hidden` ([upgrade guide](https://tailwindcss.com/docs/upgrade-guide)).
- **shadcn/ui defaults:**
  - It theme-maps through CSS variables (`--background`, `--foreground`, `--primary`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--radius`, `--chart-1…5`), with OKLCH values in its v4 themes ([theming](https://ui.shadcn.com/docs/theming)).
  - Its default button is `h-9` (36px) and icon buttons are `size-9` *(verify against the current registry)*. That passes WCAG 2.5.8's 24px floor but misses SU-61's 44px goal.
- **Radix primitives (under shadcn)** already implement the APG keyboard and focus behavior for Dialog, DropdownMenu, Tabs and Popover. The skill should say "use them, don't re-implement".

**Change.**
- **`references/adapters/tailwind.md`:**
  - Map every shibroUI token to `@theme`: `--spacing: 4px` so `p-1` is 4 … `p-16` is 64 (SU-125); 6 `--text-*` steps (SU-126); `--radius-control/surface` (SU-128); elevation `--shadow-1…5` (SU-99–103); and `dark:` set up with `@custom-variant dark` for class or attribute toggles (SU-166).
  - Add a table of v4 utilities for the defaults: `focus-visible:outline-2 focus-visible:outline-offset-2`, `tabular-nums`, `text-balance`/`text-pretty`, `h-dvh`, `size-11` for 44px, `motion-safe:`/`motion-reduce:`, and `forced-colors:`.
- **`references/adapters/shadcn.md`:**
  - Map shadcn's variables to SU roles.
  - List known pitfalls: check `--muted-foreground` on `--muted` in both themes (SU-45, SU-165); give icon buttons a `::before` hit-area extension or `size-11` on touch layouts (SU-61); use only `--chart-*` for series (SU-187).
  - Note that the Dialog, Sheet, DropdownMenu and Tabs primitives satisfy SU-144 and SU-147 when used unmodified.
- **`references/adapters/react.md`:**
  - `useId` for label, hint and error linkage (SU-151).
  - Focus `h1` or announce on client-side route change (SU-144). Next.js App Router has a built-in route announcer *(verify)*.
  - Suspense fallbacks as layout-matched skeletons (SU-157).
  - `useFormStatus` pending for button busy state (SU-158).
  - `useOptimistic` (SU-159).
  - Error boundaries per region, so partial failure is isolated (SU-160).
  - One live region mounted at the root (SU-146).
- **`scripts/lint-classes.mjs`** (new, Node, no deps). It scans `**/*.{html,jsx,tsx,vue,svelte,astro}` class strings and `@apply`, then prints SU-tagged findings with `file:line`:

  | Pattern | Rule | Level |
  |---|---|---|
  | Arbitrary spacing, size, radius or text values (`p-[13px]`, `gap-[22px]`, `text-[15px]`, `rounded-[10px]`) | SU-125/126/128 | warn |
  | More than 6 distinct `text-*` sizes or more than 3 `font-*` weights across the project | SU-126 | warn |
  | `outline-none` or `focus:outline-none` with no `focus-visible:` outline or ring on the same element | SU-70 | fail |
  | `h-screen` or `min-h-screen` on a full-height layout | SU-176 | info |
  | `opacity-0`/`invisible` plus `group-hover:`/`hover:` reveal with no matching `group-focus-within:`/`focus-visible:` | SU-174 | warn |
  | Muted text classes known to fail on white (`text-gray-400`, `text-zinc-400`, `text-slate-400`, ≈2.5:1) | SU-45 | warn |
  | Saturated `bg-{hue}-500/600` from 3 or more hues on large containers | SU-127 | info |
  | `size-6`, `size-7`, `h-6 w-6` buttons with no hit-area extension | SU-61 | info |

- **`SKILL.md`:** in the component workflow, "If the project uses Tailwind, run `node scripts/lint-classes.mjs <src>` first (no browser needed)."

**Effort / impact.** M (adapters about 1 day, linter about 1 day with tests) / M. It catches design-system drift in the source, where the fix happens, and works when no browser is available.

**Risks.**
- Tailwind class detection in template literals and `cn()`/`clsx()` calls is heuristic. Arbitrary values are sometimes legitimate (one-off illustrations), so keep them `warn` and allow `/* shibroui-ignore SU-125 */`.
- Maintenance: Tailwind or shadcn renames (the v3→v4 `outline-none` change is the example) need a version note in each adapter file.

**Test.**
- `tests/lint-classes.test.mjs` (`node:test`), with fixtures `tests/fixtures/tw-bad.tsx` and `tw-good.tsx`. Each pattern above needs one positive and one negative case. Write them first.
- Eval: a "build a pricing table with React and Tailwind, shadcn installed" task, graded by the linter (as an independent check, it isn't used by the builder in the without-skill arm), axe, and the blind judge.

### G13. Performance-related UI (P2 · S · M)

**Gap.**
- Layout shift and font and image loading show up as UI quality problems: a jumping page, flashes, a slow hero.
- shibroUI touches this in one sentence ("reserve the aspect ratio before load", `surfaces-images.md:68`).
- Nothing checks unsized media, a lazy-loaded hero image, missing `font-display`, or transitions on layout properties.

**Evidence.**
- **Core Web Vitals "good" thresholds** (p75): LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 ([web.dev/vitals](https://web.dev/articles/vitals)).
- **CLS fixes** ([optimize CLS](https://web.dev/articles/optimize-cls)):
  - `width`/`height` or `aspect-ratio` on media;
  - reserved space for embeds;
  - no injection above existing content;
  - animate `transform`, not `top`/`left`.
- **LCP image:** never lazy-load it. Lazy-loading it is linked to about 21% worse p75 LCP ([LCP lazy loading](https://web.dev/articles/lcp-lazy-loading)). Mark it `fetchpriority="high"` ([fetch priority](https://web.dev/articles/fetch-priority)).
- **Fonts** ([font best practices](https://web.dev/articles/font-best-practices), [size-adjust](https://web.dev/articles/css-size-adjust)):
  - `font-display: optional` avoids shifts, while `swap` can cause them;
  - metric-matched fallbacks via `size-adjust`/`ascent-override` (no Safari support yet);
  - preload only the critical WOFF2.
- **Long pages:** `content-visibility: auto` is newly Baseline (2025-09). It needs `contain-intrinsic-size: auto <estimate>` or offscreen chunks collapse ([content-visibility](https://web.dev/articles/content-visibility)).

**Change.** Add `references/performance.md` (SU-192–196), or a section of `surfaces-images.md` if file count matters.

| ID | Rule (draft) | Numbers | Check |
|---|---|---|---|
| SU-192 | **Reserve space; nothing jumps.** Media and embeds carry `width`/`height` or `aspect-ratio`. Async content renders into a slot sized for it (skeleton, SU-157). Banners overlay or push from the top only before first paint | CLS ≤ 0.1 | warn: `img/video/iframe` without `width`+`height` attributes and without CSS `aspect-ratio` (rendered height ≠ 0); info: a `PerformanceObserver('layout-shift')` buffered reading when supported (Chromium), reported with the shifted nodes |
| SU-193 | **Fonts load without shifting.** ≤ 2 families (SU-126) and ≤ 4 font files on first view. `font-display: swap` for body with a metric-matched fallback, or `optional`. Preload the main WOFF2 only | ≤ 4 files | warn: `@font-face` without `font-display` (CSSFontFaceRule, same-origin sheets); info: `document.fonts.size` above 4 loaded faces |
| SU-194 | **Hero image first, the rest lazy.** The largest above-the-fold image is not `loading=lazy`, has `fetchpriority=high` and a `srcset`/`sizes` matching its rendered width (at most 2× DPR). Images below the fold are `loading=lazy decoding=async` | intrinsic width ≤ 2.5× rendered width | warn: the largest first-viewport `img` has `loading=lazy`; info: no `fetchpriority`; warn: intrinsic width above 2.5× rendered (wasted bytes); info: offscreen images without `loading=lazy` |
| SU-195 | **Long lists and pages stay light.** Paginate or virtualize lists above about 200 rows, or use `content-visibility: auto` with `contain-intrinsic-size` on long sections | n/a | warn: `content-visibility:auto` without `contain-intrinsic-size`; info: more than 500 list rows rendered |
| SU-196 | **Fast to respond.** Visual feedback within 100ms of input (SU-72) even if work continues, and INP ≤ 200ms. Animate `transform`/`opacity`, not layout properties | n/a | Extends SU-85's motion scan: warn on transitions of `width/height/top/left/margin/padding` (the `moves` regex already exists); info: long animation frames over 50ms when the `long-animation-frame` API is available |

**Effort / impact.** S (about 120 lines of checks) / M. These are cheap, objective and mostly zero false-positive.

**Risks.**
- Lab checks in a static page can't measure field CLS or INP, so present them as "risk indicators", not scores.
- Detecting the "largest above-the-fold image" is approximate when the hero is a CSS background.

**Test.**
- `tests/fixtures/perf-bad.html`:
  - an unsized img;
  - a lazy hero;
  - `@font-face` without `font-display`;
  - a transition on `width`;
  - `content-visibility` without intrinsic size.
- Plus a good twin.
- No separate eval. Fold into G6's builds and add one assertion each: "no SU-192/194 warns".

### G14. RTL, i18n and long strings (P2 · M · M)

**Gap.**
- There are no rules for direction, text expansion, truncation or script-specific typography.
- All CSS examples use physical properties (`margin-left`, `text-align: left` in SU-7/17).
- Both scripts' word heuristics are English-only (B10).
- Layouts tuned to English strings break first in German, Finnish and Arabic. The cheapest place to catch that is a stress pass before review.

**Evidence.**
- **Logical properties** are widely Baseline (2024-03) and `:dir()` is widely Baseline (2026-06), so there is no reason left for physical properties in new code ([MDN logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)).
- **impeccable's `harden` reference** budgets 30–40% expansion and covers logical properties, `Intl` and plurals (`impeccable/reference/harden.md:37-138`).
- **Text expansion:**
  - The W3C-published IBM table gives expansion by English source length: ≤ 10 characters 200–300%, 11–20 180–200%, 21–30 160–180%, 31–50 140–160%, over 70 about 130% ([W3C text size](https://www.w3.org/International/articles/article-text-size)).
  - Polaris: "up to 50% longer on average", labels up to 300% ([internationalization](https://polaris.shopify.com/foundations/internationalization)).
  - M3: about 1.5× on average.
- **Strings:** never concatenate or build sentences from fragments (Polaris, M3).
- **Mirroring:**
  - Apple: flip back/forward, progress, sliders and motion icons. Don't flip logos, checkmarks, clocks or real-world objects, and never reverse digits ([right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left)).
  - M3: mirror layouts, app bars, rails and directional icons. Media controls stay LTR, circular progress and clocks are not mirrored, and linear progress runs right-to-left (except Hebrew) ([bidirectionality](https://m3.material.io/foundations/layout/bidirectionality-rtl)).
- **CJK line height:** no authoritative number was found (JLREQ and CLREQ are the places to check), so the draft keeps it as practice.

**Change.** Add `references/international.md` (SU-197–202) and `scripts/stress.js`.

| ID | Rule (draft) | Numbers | Check |
|---|---|---|---|
| SU-197 | **Direction-agnostic CSS.** Use logical properties (`margin-inline-start`, `inset-inline-end`, `padding-block`, `text-align: start`) and `dir` on `<html>`. Use `dir="auto"` on user-generated text containers. Rewrite SU-7 and SU-17's examples as `start`/`end` | 0 physical properties in new code | static CSS scan: count of physical vs logical declarations (`margin-left`, `padding-right`, `left:`, `text-align: left/right`, `border-left`) → info with the ratio; warn when the page is `dir=rtl` and physical properties are present |
| SU-198 | **Mirror what has direction, nothing else.** Mirror back/forward arrows, chevrons in lists and breadcrumbs, progress and sliders, and "reply" or "undo" icons. Don't mirror media play/pause, clocks, checkmarks, logos, numbers, or charts' time axes in most locales | n/a | stress pass: in `dir=rtl`, report icons inside `[aria-label*=back i], [aria-label*=next i]` etc. whose computed transform has no `scaleX(-1)` and whose SVG has no RTL variant → info |
| SU-199 | **Budget for expansion.** Containers holding UI strings grow: no fixed widths on buttons, tabs, labels or table headers. Short strings can triple | by English length (IBM/W3C): ≤ 10 characters ×2–3, 11–20 ×1.8–2, 21–30 ×1.6–1.8, 31–50 ×1.4–1.6, over 70 ×1.3 | `stress.js`: pseudo-localize text nodes using the IBM factors (lower bound by default, upper with `max: true`), plus accented glyphs and `⟦…⟧` brackets, then rerun the audit. New findings: text clipped (`scrollWidth > clientWidth` with `overflow: hidden`), overlapping siblings, wrapped single-line controls, row height changes in toolbars (SU-60) |
| SU-200 | **Truncation policy.** Wrap by default. Truncate only in dense single-line slots (table cells, chips, tabs) and then always expose the full text (`title`, tooltip on focus, expand). Never truncate buttons, error messages or headings. Use multi-line clamps for previews | n/a | warn: elements currently truncated (`text-overflow: ellipsis` and `scrollWidth > clientWidth`, or `-webkit-line-clamp` cutting text) with no `title`, `aria-label` or `aria-describedby` exposing the full text; fail when the truncated element is a button or error message |
| SU-201 | **Script-aware typography.** Set `lang` on mixed-language spans (fonts, hyphenation, screen-reader voice). CJK body line-height ≈ 1.7 with no italics, Arabic with no letter-spacing (it breaks joining), Thai/Devanagari need taller line boxes. Font stacks include script fallbacks | CJK line-height ~1.7 *(practice; confirm per system)* | warn: `letter-spacing ≠ 0` on text where `:lang(ar), :lang(fa), :lang(ur)` matches; info: `font-style: italic` on `:lang(zh/ja/ko)` |
| SU-202 | **Locale-aware formatting and messages.** Use `Intl.NumberFormat`/`DateTimeFormat`/`RelativeTimeFormat`/`PluralRules` or ICU messages. Never concatenate sentence fragments ("You have " + n + " items"). Currencies and units follow the locale | n/a | manual (checklist); `lint-classes.mjs` can't see this, but a grep for `toFixed(2)` next to `$`/`€` literals in components → info |

**`scripts/stress.js`** (new, in-page, same one-expression contract as `audit.js`):
- **Options:** `window.__shibroStress = { pseudo: 1.4, rtl: true, longWords: true }`.
- **What it does:** mutates the page in place, so run it in a throwaway tab or reload after. It records a restore function on `window.__shibroStress.restore` and returns `{ applied, overflowing:[paths], clipped:[paths], wrappedControls:[paths] }`.
- **Workflow:** listed in the deep tier only. Standard runs once only when the user mentions locales.

**Effort / impact.** M (rules ½ day; `stress.js` about 150 lines plus fixture) / M. Impact depends on whether the user ships non-English UIs. It is high for SaaS, low for a personal site.

**Risks.**
- Pseudo-localization flags legitimately fixed-width elements (icons, avatars), so ignore elements without text.
- Physical-property counting is noisy on legacy CSS, so keep it info-only unless `dir=rtl`.
- Mirroring heuristics are weak, so manual review stays in the checklist.

**Test.**
- `tests/fixtures/i18n-bad.html`:
  - `width: 120px` buttons;
  - `margin-left` icons;
  - an ellipsized error message;
  - letter-spaced Arabic.
- The fixture runner applies `stress.js` and expects SU-199/200/201 findings. The good twin uses logical properties and wrapping.
- Eval 10 (§5).

### G15–G17. Platform primitives, native adapters, review lenses

**G15. Modern platform primitives (P2 · S · M).** No new IDs. These belong inside the rules they serve, so the skill recommends the built-in path first. Statuses are Baseline per web-features / webstatus.dev on 2026-10-20 (data can lag 1–2 months):

| Primitive | Status | Recommend for | Pitfalls to write down | Lands in |
|---|---|---|---|---|
| `<dialog>` + `showModal()` | widely | every modal (inert background, Escape, top layer) | no `tabindex` on the dialog; a visible close button; `closedby` is *limited* (no Safari) | SU-103, SU-144 |
| Popover API (`popover`, `popovertarget`, `:popover-open`) | newly (2025-01) | menus, non-modal pickers, toasts | non-modal (use `<dialog>` for modal); `display` on `[popover]` overrides hidden; `popover=hint` is limited | SU-75–77, SU-146 |
| Invoker commands (`command`/`commandfor`) | newly (2025-12) | declarative open and close without JS | a mistyped id fails silently, so the audit warns on dangling `commandfor` (SU-142) | SU-142 |
| Anchor positioning (`position-anchor`, `position-area`, `position-try-fallbacks`) | core newly (2026-01); `position-visibility` limited | tooltips and menus with popover | unique anchor names (`anchor-scope`); fallbacks only on overflow | SU-100, SU-174 |
| `@starting-style` + `transition-behavior: allow-discrete` | newly (2024-08) | interruptible enter and exit of popover, dialog, `display` | none major; pairs with SU-75's "transitions, not keyframes" | SU-75–77 |
| View Transitions, same-document | newly (2025-10); cross-document limited (no Firefox) | list↔detail and tab changes | unique `view-transition-name`; reduced motion → `skipTransition()` or no animation; focus and live regions during the overlap | `motion.md` new subsection under SU-80 |
| Container queries (size), `cqi` | widely (2025-08); style queries newly (2026-05); scroll-state limited | component responsiveness | `container-type` blocks sizing from children | SU-173 |
| `text-box: trim-both cap alphabetic` | newly (2026-08, per web.dev) | optically centered button labels and headings | not inherited; shifts layout | SU-36 (replaces manual padding nudges) |
| `text-wrap: balance` / `pretty` | balance newly; **pretty limited (no Firefox)** | headings / paragraphs | none (pretty is progressive) | SU-12–13 (add the status note) |
| `field-sizing: content` | newly (2026-06) | auto-growing textareas | none major | SU-19 |
| `:user-invalid` / `:user-valid` | widely | error styling only after interaction | avoid `:invalid` styling at rest | SU-150 |
| `scrollbar-gutter: stable` | newly | no shift when scrollbars appear | n/a | SU-192 |
| `light-dark()`, `color-scheme`, relative colors, `color-mix()` | light-dark newly; color-scheme widely; relative newly; two-color mix widely | theming | `light-dark()` needs `color-scheme: light dark` | SU-162–166 |
| `contrast-color()` | newly (2026-04) | quick on-color text | returns black or white only, **not** guaranteed AA on mid-tones, so verify with the audit | SU-46 |
| Customizable `<select>` (`appearance: base-select`) | limited | progressive enhancement only | SSR hydration; option text is the value | SU-54 |
| `if()`, `@function`, scroll-driven animations, `interpolate-size` | limited (Chromium-first) | don't rely on them in a standard; enhancement only, with `@supports` | content must be visible if the animation doesn't run | motion.md note |

Add one audit info check: for each limited-status feature used in same-origin CSS (`appearance: base-select`, `animation-timeline`, `interpolate-size`, `if(`), list it in `notes` with "progressive enhancement: verify the fallback". It's cheap and keeps output honest.

- **Effort / impact:** S / M.
- **Risks:** the status table goes stale, so date it and re-check twice a year.
- **Test:**
  - `platform-good.html` builds a menu with `popover` plus anchor positioning, and a dialog with `showModal()` and `@starting-style`. It must produce 0 fails, and `hiddenStates` must list the closed popover and dialog with their `popovertarget`/`commandfor` triggers.
  - A variant using `appearance: base-select` must produce the progressive-enhancement note.

**G16. Native adapters: SwiftUI and Jetpack Compose (P3 · M · L).**
- **Gap:** the rules are web-only and the scripts can't run natively. There is no evidence the user builds native UI (every eval is HTML), so this is low priority.
- **Change:** `references/adapters/swiftui.md` and `compose.md`. These are checklist-only mappings, with no in-page scripts.

  | Concern | SwiftUI | Compose | SU |
  |---|---|---|---|
  | Hit area | 44×44pt ([HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)); `.contentShape(Rectangle())` and `.frame(minWidth:44, minHeight:44)` | 48×48dp; `Modifier.minimumInteractiveComponentSize()` | SU-61 |
  | Text scaling | Dynamic Type text styles (`.body` = 17pt default), no fixed frames on text | `sp` units; test at fontScale 2.0 (Android 14 non-linear scaling to 200%) | SU-171 |
  | Color | Semantic colors (`Color.primary`, `.secondary`, `Color(.systemBackground)`) handle dark and increased contrast | `MaterialTheme.colorScheme` roles (`surfaceContainer*`, `onSurfaceVariant`) | SU-162–165 |
  | Names | `.accessibilityLabel`, `.accessibilityHint`, `.accessibilityElement(children:)` | `Modifier.semantics { contentDescription }`, `mergeDescendants` | SU-140 |
  | Motion | `@Environment(\.accessibilityReduceMotion)` | `Settings.Global.ANIMATOR_DURATION_SCALE` / `LocalReduceMotion` *(verify API)* | SU-78 |

- **Graders:** Xcode Accessibility Inspector audits; Android Accessibility Scanner; Compose UI-test accessibility checks *(verify current API name)*.
- **Risks:** platform guidance moves every WWDC and I/O, so maintenance is high relative to use. Do this only once a native project appears.
- **Test:** none until there's a native eval.

**G17. Laws of UX and Nielsen's heuristics as review lenses (P3 · S · L).**
- **Gap:** the evidence base is implicit. Most laws already map onto existing rules, so the gain is a second review pass that catches what rule-by-rule checking misses: user control, flexibility and accelerators, recovery.
- **Change:** add a "Heuristic pass" table at the end of `references/checklist.md`. No new IDs; each row points at existing or new ones.

  | Lens | Testable check | Maps to |
  |---|---|---|
  | Visibility of system status (Nielsen #1), Doherty threshold (400ms) | Every action shows feedback within 100ms and progress past about 1s | SU-72, SU-146, SU-156–158 |
  | Match the real world (#2) | User's words, not system terms; one name per concept | SU-111, SU-178–183 |
  | User control and freedom (#3) | Undo for reversible destructive actions; every dialog, sheet and gesture cancelable | SU-90, SU-161, SU-181 |
  | Consistency, Jakob's law (#4) | A known pattern; the same action in the same place and style | SU-110, SU-113, SU-122 |
  | Error prevention (#5) | Constrain inputs, confirm only high-stakes actions, validate before submit | SU-150–154 |
  | Recognition over recall (#6), Miller/chunking | Visible options, searchable long lists, grouped fields | SU-22, SU-54, SU-125 |
  | Flexibility and efficiency (#7) | Keyboard shortcuts for frequent actions in tools (documented, not single-key unless remappable, per WCAG 2.1.4) | *gap:* add as a note to SU-143 |
  | Aesthetic and minimalist (#8), von Restorff, aesthetic-usability | One focal point; budgets met | SU-119, SU-121, SU-126–128 |
  | Recover from errors (#9) | Errors say what happened and how to fix, next to the field | SU-151, SU-160, SU-180 |
  | Help (#10) | Empty states teach; hint text sits outside the field | SU-117, SU-148 |
  | Fitts's law | Large, close targets for frequent actions; edges and corners on desktop | SU-61–69 |
  | Hick's law | One primary action; navigation of 7 items or fewer; progressive disclosure | SU-121, SU-134 |
  | Goal gradient, peak-end | Progress shown in multi-step flows; a clear success moment | SU-154, SU-161 |

- **Sources:** [Laws of UX](https://lawsofux.com/), [NN/g 10 heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).
- **Effort / impact:** S / L.
- **Risks:** none. Keep it to one table, because each lens is already covered.
- **Test:** eval 2 (settings review) should mention at least one heuristic-only finding, e.g. no undo after delete.

### G18. Coherence with sibling skills: contradictions, routing, quick fixes (P1 · S · M)

**Gap.**
- Thirteen other UI skills are installed, and impeccable claims almost the same territory ("UX review, hierarchy, layout…").
- When two trigger on one prompt, contradictory numbers produce inconsistent output.
- shibroUI has no "Not for" clause and doesn't route charts, gestures or aesthetics to the skills that do them better.

**Evidence.** These were found by reading the installed skills and shibroUI side by side:

| Conflict | shibroUI | Others | Proposed resolution |
|---|---|---|---|
| Accent edge on notices | SU-115 recommends a `4px` blue edge on one side (`product.md:54-57`) | impeccable's first "absolute ban" is exactly this side-stripe, and its detector flags it (`impeccable/SKILL.md:82`, rules `side-tab`, `border-accent-on-rounded`) | Default SU-115 to "quiet tinted surface + icon + text". Allow the edge only on square-cornered inline callouts in prose, never on rounded cards |
| Exit easing | SU-82 and the starter tokens use `--ease-in` for exits (`motion.md:69,135`) | emil (`SKILL.md:116`) and review-animations (`STANDARDS.md`) say never use ease-in on UI, because it feels sluggish at the start | Exits use a short ease-out, or an accelerate curve only for elements leaving the screen, at ≤ 150–200ms. Never ease-in for hover, press or state changes. Update the tokens and the SU-82 audit text |
| Bounce and squash | SU-78 allows squash and stretch as "spice" | impeccable: "No bounce, no elastic". apple-design: overshoot only after momentum-carrying gestures | SU-78: squash and overshoot only on direct-manipulation release and celebratory moments; never on routine UI |
| Routine duration | `audit.js` `LIMITS.routineMs = 500`, but its fix text says "≤ 300ms" (`audit.js:666`); SU-85 says nothing routine over 500ms | emil and review-animations: UI under 300ms | Set warn above 300ms for UI transitions; keep 500 as the fail-free ceiling for large panels and page transitions. Make the code and the text agree |
| Stagger | SU-80: 30–60ms | emil and review-animations: 30–80ms | Adopt 30–80ms, with total stagger ≤ 300ms |

**Change.**
1. **Fix the five conflicts above** (one `fix(rules)` PR, each change with its fixture update).
2. **Add routing to `SKILL.md`**, in a "Not for / hand off" section and in the description's last sentence:
   - chart form and palette → `dataviz`;
   - gesture physics, springs and materials → `apple-design`;
   - aesthetic direction and brand look → `frontend-design`;
   - anti-pattern and "AI tell" sweeps → `impeccable` (its `detect.mjs` has 46 rules).

   shibroUI stays the *numbers and measurement* authority.
3. **Add a semantic z-index scale** to the elevation table in `surfaces-images.md` (no new ID; it extends SU-99–103): base 0, sticky 100, dropdown 200, overlay/scrim 300, modal 400, toast 500, tooltip 600. Add an audit info for `z-index` above 1000 ("9999 stacking"). Note that the top layer (`<dialog>`, `popover`) makes most of this unnecessary (G15).
4. **Write the screen read before reading script output** (from impeccable's critique invariant). Step 1 of the screen workflow becomes: screenshot → 5-line screen read from the screenshot → *then* page-map, so the scripts check the judgment instead of anchoring it.
5. **Accepted findings:**
   - `window.__shibroAudit = { ignore: ['SU-115@.callout'] }`;
   - a documented `.shibroui/accepted.md` convention in the project, so accepted `warn`s are not re-reported every run (impeccable keeps `.impeccable/critique/ignore.md`).

**Effort / impact.** S (½–1 day) / M. These are cheap to fix and remove visible inconsistency when skills co-trigger.

**Risks.** The routing text costs description characters (keep it to one clause). Some of the conflicts are taste, so record the decision and its reason in the rule.

**Test.**
- Update the motion fixtures: `ease-in` on a hover transition now warns, and a 400ms dropdown now warns.
- Trigger eval: add two prompts where impeccable and shibroUI both apply, and check that the output doesn't contain both a side-stripe recommendation and a ban.

### G19. Pixel-level alignment around SU-137: control rows, indicators in every state, ink-aware centering (P2, first in P2 · S–M · M–H)

**The case.**
- **The defect:** in a day picker (‹ Вчера [Сегодня] Завтра › 📅), the white selected pill sat 6px right of its label. Pixel-measured, there was 12px of space left of the text and 24px right. The labels themselves were evenly spaced (57 / 56px).
- **Why it was missed:** the review only had a screenshot, and vision misses offsets of about 6px in a 139px pill. Even with a DOM, nothing checked centering or indicator alignment.

**In progress (main session), first part landed in `96cfd7b`.** Not re-proposed here:
- SU-137, "Centered content", with labels centered in pills, buttons and chips (±2px) and selection highlights taking position and width from the selected item.
- An `audit.js` centering check:
  - (a) label/icon content box vs pill-like controls, horizontally and vertically, plus SU-30 icon-side padding;
  - (b) a separately drawn, absolutely positioned, text-less highlight vs the interactive item it overlaps most.
- `scripts/measure-png.py` (stdlib):
  - filled containers and their ink;
  - off-center content;
  - gaps between items in a row;
  - a "nested pill closer to one neighbour" hint;
  - ink contrast;
  - `--crop`/`--scale`.
- A screenshot workflow in `SKILL.md` ("measure before you judge"), segmented-picker broken and fixed fixtures, and node tests for the measurer.

**Still missing.** Each gap below names the reason it matters and the proposed check.

1. **SU-203 "Control rows keep one rhythm"** (new rule, `layout-hierarchy.md` next to SU-137).

   SU-125 already says "equal gaps between siblings of the same kind", but its only measurement is page-map's *vertical* section rhythm. Horizontal control rows have no check: segmented controls, tab bars, toolbars, pagination, chip rows, steppers. In the day picker, the flanking chevrons and calendar button are part of the same row.

   *Rule:*
   - Siblings in a control row are either equal-width with centered labels, or content-hugging with equal inline padding. Never a mix.
   - Box gaps between siblings are equal (±1px).
   - Flanking controls (‹ ›, a trailing icon button) sit at equal distance from the group on both sides and share its height (SU-58–60).
   - The selected pill's inset from its track is the same on all four sides (±1px). A 2px inset on top and bottom with 4px left and 6px right reads as "slid off".

   *Check (`audit.js`):*
   - **Rows:** a parent with 3 or more visible interactive children that overlap vertically by more than half their height.
   - **Gaps:** compute box gaps; warn when the spread is over 2px.
   - **Width policy:** warn when segment widths differ by more than 2px *and* inline paddings differ by more than 2px (neither policy holds).
   - **Track inset:** take the indicator rect (from SU-137's matcher, or the selected child's background) vs the track's padding box. Warn when the left/right insets differ by more than 2px, or the left/right inset differs from the top/bottom inset by more than 2px.
   - **Flanks:** the gap from the previous sibling outside the group vs the gap to the next one. Warn when they differ by more than 2px.
   - *measure-png.py:* add track inset symmetry and flank symmetry. It already reports item gaps.

2. **Indicator alignment in every state, not only the current one** (extends the SU-137 check, no new ID). Off-center indicators often appear only for some options or only after something changes:
   - measured before the web font loaded, so fallback-font widths are used;
   - fixed per-index offsets (`translateX(calc(var(--i) * 100%))`) with unequal segment widths;
   - the gap or padding forgotten in the offset;
   - no resize handling;
   - physical `translateX` in RTL.

   *Check (`scan.mjs`, G7):* for each `tablist`, `radiogroup` and SU-203 row with an indicator:
   - select every option in turn and wait for `transitionend` or for animations to finish;
   - run the SU-137 indicator measurement for each;
   - repeat once after `await document.fonts.ready`;
   - repeat after resizing the viewport by about 15%;
   - repeat in `dir=rtl` and with `stress.js` long labels (G14).

   *In-page fallback:* the audit notes "indicator verified for the selected option only; N other options not checked" in `coverage.skipped`.

3. **Pseudo-element indicators are invisible to the check.** A common implementation draws the highlight as `.track::before` and moves it with `transform: translateX(…)` or `left: calc(…)`. Pseudo-elements aren't in `querySelectorAll`, so SU-137's matcher never sees them.

   *Check:* for each SU-203 track, read `getComputedStyle(track, '::before' | '::after')`. If `content ≠ none`, the position is `absolute` and it paints a background or shadow, rebuild its rect from the computed `left/top/width/height` plus the transform `DOMMatrix`, relative to the track's padding box. Then compare it with the selected item.

   Highlights drawn by `background-position` or gradients go to `coverage.skipped` ("indicator not measurable").

4. **Prevention, not just detection** (edit SU-137's "Do"). Derive the indicator's position from the item *by construction*:
   - **(a) Anchor positioning** (core Baseline 2026-01, G15): `[aria-selected=true]{anchor-name:--sel}` and `.indicator{position:absolute; position-anchor:--sel; left:anchor(left); width:anchor-size(width)}`, so a transition animates the slide.
   - **(b) No separate element:** the highlight is the selected item's own background, and the slide uses a View Transition or FLIP.
   - **(c) JS measurement:** measure the item's `offsetLeft/offsetWidth` (logical inline-start in RTL) after `document.fonts.ready` and in a `ResizeObserver` on the track. Never compute from the index.

   *(`anchor-size()` support: confirm in the implementing PR; it shipped with anchor positioning in Chromium and Safari 26.)*
5. **Ink-aware centering** (extends the checks for SU-31, SU-36 and SU-137).
   - *Text:* DOM text rects are *line boxes*, so vertical centering judged on them misses cap-height offsets. A label can be centered by line box and still look low. Use canvas `measureText()` with the element's computed font (after `document.fonts.ready`), take `actualBoundingBoxAscent/Descent` for the label's actual glyphs, place the ink box on the baseline (see 6), and compare top vs bottom space, warning above 1.5px. Suggest `text-box: trim-both cap alphabetic` (newly Baseline) as the fix.
   - *Icons:* the `svg` box isn't the ink. Many icons sit off-center inside their viewBox, and SU-31 wants asymmetric glyphs such as play triangles nudged *toward* optical center. Use `getBBox()` of the drawn geometry vs the viewBox for bounds. For asymmetric icons, compute the alpha-weighted centroid: serialize the inline SVG, draw it to an offscreen canvas and read the pixels. Compare that with the container center: warn when the bounds are off by more than 1.5px, info when the centroid is off by more than 8% of the width.
6. **Baselines across a row** (SU-4, prose only today). Mixed-size text in one row (a KPI value with its unit, chips with counters, label/value pairs, a price with "/ month") should share a baseline within 1px, but `align-items: center` with mixed font sizes breaks it.

   *Check:* insert a zero-size `inline-block` probe (`vertical-align: baseline`) at the start of each text item in a row, read `rect.top` (the baseline), then remove it. Warn when the spread is over 1px and the row isn't `align-items: baseline` or `last baseline`.
7. **Pixel-side parity** (`measure-png.py` extensions, for screenshot-only reviews). Port the DOM checks above so a screenshot gets the same coverage:
   - track inset and flank symmetry (1);
   - text-ink bottoms aligned across a row (6);
   - icon ink centroid vs container (5);
   - same-kind containers (all chips, all segments) with equal heights ±1px;
   - near-miss left edges from a vertical projection of container edges (the SU-124 equivalent);
   - a `--diff before.png after.png` mode that confirms a fix moved only what it should.
8. **Workflow detail for screenshots** (`SKILL.md` screenshot workflow). Add three steps:
   - Measure *every* instance of a repeated control and every state the user provides, not just the one in question.
   - When the screenshot comes from a repo you have, grep for a visible label (e.g. "Сегодня") to find the component and switch to the DOM path.
   - State the measurement tolerance in the finding ("±1px at `--scale 2`").

**Evidence.**
- **The case itself** (above), with the main session's commit message.
- **Vision limits:** the new screenshot workflow states that vision alone misses offsets under about 8px.
- **Why centering is judged on ink:** WCAG doesn't cover it, but every installed motion and polish skill treats optical alignment as a quality bar: emil-design-eng on popover origin and polish, impeccable `layout.md:133` on optical corrections. The platform answer for text is `text-box-trim`, newly Baseline per web.dev (Aug 2026).
- **Why indicators drift:** web fonts swap after first paint (`font-display: swap`, see G13), so any JS measurement taken before `document.fonts.ready` uses fallback metrics. Physical `translateX` doesn't flip in RTL (MDN logical properties, G14).

**Effort / impact.** S–M:
- row rhythm, inset and flank checks: about 120 lines;
- pseudo-element indicators: about 60;
- every-option sweep in `scan.mjs`: about 50;
- ink-aware text centering: about 60;
- icon bounds and centroid: about 80;
- baseline probe: about 50;
- `measure-png.py` extensions: about 150 plus node tests.

Impact M–H:
- These are exactly the defects that make a UI feel "slightly off" without anyone knowing why.
- The user hit one in real use, and Claude-built controls with sliding indicators are common.
- The checks are mostly zero-judgment geometry.

**Risks.**
- **Intentional asymmetry:** segments with leading icons, chips with remove (×) buttons and split buttons. Exempt rows whose children differ in structure, and keep everything at `warn`.
- **Sub-pixel rounding** at fractional DPR: use ±1.5px for computed and ±1px for integer-snapped layouts.
- **Approximate pseudo-element geometry:** percent-based transforms resolve against the pseudo's own box. Use `DOMMatrix` from the computed `transform`, which is already resolved to px.
- **Font loading:** canvas text metrics need the font loaded, so always await `document.fonts.ready`. Without it, report "not measured".
- **SVG rasterization:** works only for inline or same-origin SVG.
- **Maintenance:** the DOM and pixel paths must agree, so share the tolerances in one constants block per script and test them with the same fixtures.

**Test.**
- **DOM fixture:** extend the main session's segmented fixtures with `controls-rhythm-bad.html`:
  - gaps of 8 / 12 / 8px;
  - chevrons 12px from the group on the left and 20px on the right;
  - a 2 / 6 / 2 / 4px track inset;
  - a `::before` indicator 6px off;
  - an indicator positioned by index with unequal segment widths;
  - an indicator measured before a delayed web font (the fixture runner serves the font with a 500ms delay);
  - a `translateX` indicator under `dir=rtl`;
  - a value and unit misaligned by 3px on the baseline;
  - a geometrically centered play icon.
- **Good twin:** uses anchor positioning and `align-items: baseline`.
- **Cross-validation:** the fixture runner screenshots both pages at `--scale 2` and runs `measure-png.py` on the PNGs. The DOM and pixel paths must report the same planted defects (within tolerance). That keeps the two measurers honest against each other.
- **Eval:** a new "screenshot-only review" eval (§5, eval 12).
  - Inputs: 3 PNGs — the day picker, a toolbar with uneven gaps, and a chip row with a baseline mismatch.
  - Assertions: each planted offset is reported with its measured px and rule ID (author key). There are no false "looks fine" claims on the clean control image.
  - A build eval: "segmented control with a sliding indicator, a web font and an RTL mode", graded by the `scan.mjs` every-option sweep.

*Environment notes found while researching (not shibroUI, so not proposed here):*
- `~/.claude/skills/make-interfaces-feel-better` and `~/.claude/skills/frontend-design` are broken symlinks.
- `taste-skill/SKILL.md` declares `name: design-taste-frontend`, which collides with the real `design-taste-frontend`.

---

## 5. Eval plan for v3

### 5.1 Goals

v3 must show three things, each with its own measurement:
1. **Better output than plain Claude and than v2**, judged by graders the skill doesn't ship.
2. **No higher cost than v2** at the standard tier.
3. **Reliable triggering** on quick questions without false triggers.

"Meets its own budgets" is reported, but it is never the headline.

### 5.2 Arms, runs and models

| Arm | What |
|---|---|
| `v3` | the new skill installed |
| `v2` | snapshot of `7343b7f` (via `skillOverrides` or a copied folder) |
| `none` | the skill turned off (`skillOverrides: { shibroui: "off" }`), with the prompt saying nothing about it |

- **Runs:** 3 per arm per eval, in a clean temporary directory per run. Report mean ± sd and pass^3.
- **Time cap:** 1,200s. "Hit cap" is reported as an outcome, never as a time.
- **Models:**
  - builder: the session default (Opus 5.5);
  - trigger set: also Sonnet 5.5 and Haiku 5.5;
  - judge: a different model from the builder (Sonnet 5.5 if Opus builds).

### 5.3 Eval set

**Capability evals** (the headline numbers):

| # | Eval | New in v3 | Exercises | Key graders |
|---|---|---|---|---|
| 1 | Invoices card build | | components, table, modal | axe, audit, judge |
| 2 | Settings review + fix | | review coverage, fixes | planted-issue recall (author key), axe on the fix |
| 3 | Share sheet + toast | | motion, focus, live region | `scan.mjs` focus assertions, axe |
| 4 | Dashboard redesign | | screen level, charts | judge, axe, page-map (reported, not headline) |
| 5 | Settings screen build | | screen level, dialog | judge, axe, `scan.mjs` |
| 6 | **Sign-up + sign-in form with validation** | ✓ | G1, G2, G9 | axe; scripted invalid submit: error summary focused, `aria-invalid` + `describedby`, no paste-block, `autocomplete` tokens; judge on copy |
| 7 | **Orders table: loading → empty → error → data** | ✓ | G3 | scripted state toggles (`?state=`); CLS < 0.1 across transitions (PerformanceObserver); live-region announcements present; judge |
| 8 | **Add dark mode to `settings.html`** | ✓ | G4 | axe in both schemes; contrast pairs in both; `color-scheme` set; no flash (screenshot at first paint); judge |
| 9 | **Make the dashboard work on phones** | ✓ | G5 | 320 reflow (no 2-D scroll), 375 screenshots, axe `target-size`, judge at 375 |
| 10 | **Arabic (RTL) + German variant of the settings screen** | ✓ | G14 | `dir=rtl` mirrored correctly (logical properties), no clipping under pseudo-locale ×1.4, judge |
| 11 | **React + Tailwind v4 + shadcn pricing page** | ✓ | G12 | `lint-classes.mjs` (as an independent grader), axe, judge |
| 12 | **Screenshot-only review** (day picker, toolbar, chip row PNGs with planted 3–6px offsets, plus one clean image) and **build a segmented control with a sliding indicator, a web font and RTL** | ✓ | SU-137, G19 | author key (each offset reported with measured px and rule ID; no "looks fine" on planted defects); `scan.mjs` every-option indicator sweep |

**Quick-answer evals** (graded on the answer text):
- 6 questions, e.g. "what max-width and line-height for blog body text?", "how dark should dark-mode surfaces be?", "how long should a toast stay?".
- Assertions: the numbers match the rule, and the SU ID is cited.
- `skill-triggered` is tracked separately.

**Trigger set** (`evals/triggers.json`): 24 prompts (12 should, 12 near-miss should-not) × 3 runs × 3 models. Targets:
- ≥ 90% trigger on should-trigger, with pass^3 ≥ 75%;
- ≤ 10% on near-misses.

Test configurations: description only, then description + hook, then description + CLAUDE.md pointer (G8).

**Held-out set** (`evals/heldout/`, never opened while tuning): login, pricing, data table with filters, mobile navigation. Run once per release with the full grader stack.

**Regression set:** v2's non-discriminating assertions (audit 0 fails, etc.) plus the fixture runner (`npm run test:fixtures`). These must stay at 100% and aren't counted in deltas.

### 5.4 Graders: independence ladder

| Grader | Independent of the skill? | Measures | Use |
|---|---|---|---|
| Author answer keys (planted issues, required features, content kept) | yes (written before the run) | recall of known problems, spec fidelity | headline |
| **axe-core** (`target-size` on), per state and scheme | yes | WCAG-mechanical violations | headline floor (should be 0 in v3 and v2; `none` likely > 0) |
| **Scripted behavior** (`scan.mjs` focus/Escape/route assertions, CLS observer, invalid-submit flow) | partly (written by us, but not shipped to the builder) | dynamic behavior | headline for evals 3, 6, 7 |
| **Blind pairwise judge** (skill-creator `comparator.md`, randomized A/B, "Unknown" allowed, rubric: hierarchy/focal, primary action, consistency, states, copy, polish) | yes | holistic quality | headline: win rate v3 vs `none` and v3 vs v2 |
| **Human review** (`generate_review.py`, 10 min/eval, `feedback.json`) | yes | ground truth for judge calibration | once per release; calibrate the judge (agreement ≥ 80% or rework the rubric) |
| shibroUI `audit.js` / `page-map.js` | **no** | own budgets and rules | reported as "self-consistency", never headline |

### 5.5 Cost and process metrics

Record these per run:
- wall time, tokens and tool calls;
- browser round-trips;
- reference files opened;
- audit runs per state;
- whether the run hit the cap.

Targets:
- standard tier median time ≤ v2 median;
- tokens ≤ v2 + 10%;
- component-tier runs open ≤ 3 reference files.

### 5.6 Report format (`evals/RESULTS.md`, v3 section)

Per eval and arm:
- pass rate (mean ± sd);
- pass^3;
- axe violations;
- judge win rate vs the other arms, with a 95% CI;
- time and tokens (median, range);
- "hit cap" count;
- the model.

One paragraph of caveats: n, judge model, contamination notes. Keep iteration 1–3 tables as history.

### 5.7 Sequencing and budget

1. **Build the harness**, the fixture runner and the trigger set, then run them on **v2 vs none** first.
   - This produces a baseline for the v3 comparison.
   - It also answers the open question from iteration 3: does v2 beat plain Claude under an independent judge?
2. **Per feature PR:** add the fixture (red), implement, and keep the fixture green. Then run only the affected eval(s), 1 run each, as a smoke test.
3. **Per release:** the full matrix of 12 evals × 3 arms × 3 runs, which is about 110 runs or roughly 25–28M tokens at v2's averages, plus the held-out set and human review.

---

## 6. Implementation notes

- **Rule count and context cost.** This proposal adds 66 rules (SU-138–203), taking the total from 137 (including the main session's SU-137) to 203. To keep the token cost flat:
  - New rules go in **new reference files**, opened only when relevant. The rule map gets 7 rows: semantics, states, theming, responsive, content, dataviz, international, plus performance or adapters as needed.
  - `SKILL.md` grows only by about 8 defaults rows, the routing clause, the tier table and the state-matrix line.
  - The screen workflow body moves to `references/screen-workflow.md` (G7), so `SKILL.md` shrinks overall.
  - Target: `SKILL.md` ≤ 200 lines, every reference file ≤ 250 lines (the global small-files rule).
- **Script size.** `audit.js` (786 lines) and `page-map.js` (478) are already above the ~200-line guideline. Proposed structure:
  - split the source into `scripts/src/audit/*.js` modules: contrast, targets, focus, semantics, forms, reflow, motion, report;
  - add a tiny `npm run build` that concatenates them into the single-expression `scripts/audit.js` the browser tools need;
  - keep the built file committed so the skill works without a build step.

  The same applies to page-map. Pure helpers (color math, accname, path) get `node:test` unit tests. DOM checks get fixture tests (G6).
- **Immutability.** Checks return finding arrays that are merged at the end instead of pushing into shared `findings`/`flags` maps. That matches the global coding style and makes per-check unit tests trivial.
- **Probes restore the page.** Probes that change the page (text spacing, stress, focus walks) are written as pure runs: they record what they change and restore it in a `finally`.
- **Versioning.** v0.3.0 = quick wins plus G6 harness. v0.4.0 = G1 plus G5. v0.5.0 = G2 plus G3. v0.6.0 = G4. Each release has its own `RESULTS.md` section.
- **Commits and PRs.** Conventional commits, one concern per PR, under 400 lines, fixtures first. For example: `test(audit): add semantics fixtures`, `feat(audit): check accessible names`, `feat(rules): add semantics reference`.
- **Non-goals:**
  - no aesthetic direction (stay the numbers authority and route taste elsewhere);
  - no AI-tell catalog (impeccable owns it);
  - no chart construction rules (dataviz owns them);
  - no APCA as a normative check, since WCAG 3 is still a Working Draft (2026-03) with its contrast method undecided ([W3C WCAG 3](https://www.w3.org/WAI/WCAG3/)). It may be added later as advisory output in `contrast.mjs`.

## Appendix A. Rule-ID allocation

| Range | File | Item |
|---|---|---|
| SU-138–147 | `references/semantics.md` (new) | G1 Semantics, keyboard, assistive tech |
| SU-148–154 | `references/forms.md` (new section "Validation and feedback") | G2 Forms |
| SU-155–161 | `references/states.md` (new) | G3 States |
| SU-162–169 | `references/theming.md` (new) | G4 Theming, dark mode, forced colors |
| SU-170–177 | `references/responsive.md` (new) | G5 Responsive, zoom, reflow, touch |
| SU-178–184 | `references/content.md` (new) | G9 Microcopy |
| SU-185–191 | `references/dataviz.md` (new, short; routes to `dataviz`) | G10 Data visualization |
| SU-192–196 | `references/performance.md` (new) | G13 Performance-related UI |
| SU-197–202 | `references/international.md` (new) | G14 RTL, i18n, long strings |
| SU-203 | `references/layout-hierarchy.md` (next to SU-137) | G19 Control rows keep one rhythm |
| edits | SU-4/31/36 (ink-aware checks), SU-137 (prevention "Do": anchor positioning; every-state check), SU-17 (table headers), SU-44 (3:1 boundary), SU-45 (placeholder), SU-78/80/82/85/115 (G18), SU-99–103 (z-index column), SU-117 (empty-state variants), SU-135 (points to responsive.md) | |

## Appendix B. New and changed scripts

| Script | Status | Runs where | Purpose | Item |
|---|---|---|---|---|
| `scripts/audit.js` | changed | in-page | new checks: semantics, forms, reflow/zoom/text-spacing, hover reveal, placeholder and non-text contrast, SVG charts, perf hints, control-row rhythm, `::before` indicators, ink-aware centering, baseline probe; `coverage.schemes`; shadow DOM and iframes; compact mode; `ignore` | G1–G5, G10, G11, G13, G18, G19 |
| `scripts/page-map.js` | changed | in-page | scroller-aware fold; token-aware scale; `offTokenColors`; breakpoints inventory; data regions; chart labels | G4, G5, G10, G11 |
| `scripts/contrast.mjs` | changed | Node | CSS Color 4 parsing; `--palette`; `--scheme both` | G4 |
| `scripts/measure-png.py` | changed (landed in `96cfd7b`) | Python stdlib | add track inset and flank symmetry, row baselines from ink, icon centroid, same-kind size consistency, near-miss edges, `--diff` | G19 |
| `scripts/stress.js` | new | in-page | pseudo-locale ×1.4, RTL, long words, then clipping report | G14 |
| `scripts/scan.mjs` | new, optional (Playwright) | Node | one-call sweep: viewports × states × schemes, focus assertions, every-option indicator sweep (after fonts, resize, RTL), compact summary | G7, G1, G3, G4, G19 |
| `scripts/lint-classes.mjs` | new | Node, no deps | static Tailwind/JSX class lint | G12 |
| `tests/run-fixtures.mjs` | new (dev only) | Node + Playwright | headless fixture runner for `npm test` | G6 |
| `evals/graders/axe.mjs`, `evals/graders/judge.md` | new (never shipped in `shibroui/`) | Node / agent | independent graders | G6 |
| `hooks/shibroui-hint.sh` | new, optional, user-installed | hook | trigger hint for quick UI questions | G8 |
