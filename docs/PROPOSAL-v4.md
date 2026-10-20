# shibroUI v4: big pages, components and craft

- **Status:** proposal; nothing implemented.
- **Date:** 2026-10-20.
- **Baseline:** shibroUI v0.3.0, commit `481b986` (203 rules, `audit.js` built from 37 sources,
  `page-map.js`, `measure-png.py`, `contrast.mjs`, 5 evals).
- **Builds on:** [PROPOSAL.md](PROPOSAL.md) (v3, G1–G19). Items still open there are referenced, not
  repeated: G6 (evals), G7 (`scan.mjs` and tiers), B8 (app-shell scroller), B9 (shadow DOM), B13
  (JS-driven motion). New items here are **H1–H12**; new rule IDs start at **SU-204**.

**How this was researched:**
- Read `SKILL.md`, all 18 reference files, both in-page scripts and the audit sources, `evals/` and the
  v3 proposal.
- **Ran the scripts on two big pages** at 1280×900: shibro.dev's `/ui/`
  library (15,603px) and a generated 32,026px landing page with scroll reveals and planted bugs (§2).
- Compared with the installed UI skills for the topics below (impeccable, design-taste-frontend,
  emil-design-eng, apple-design, high-end-visual-design, redesign-existing-projects, minimalist-ui,
  gpt-taste, stitch-design-taste, frontend-design, layers-*). Two symlinks are broken:
  `frontend-design` (the plugin copy was read instead) and `make-interfaces-feel-better` (not installed).
- Checked component numbers against Material 3, Carbon, Polaris, Primer, Atlassian, Apple HIG,
  GOV.UK, NN/g, WCAG 2.2 and MDN (§6).

---

## 1. Summary

shibroUI is excellent at **one app screen at a time**: it ships a consistent system, one focal point,
measured contrast, targets, focus and states, and it reports honestly what it checked. Three kinds of
work fall outside that:

1. **Big pages: the tools go blind without saying so.** On a long landing page with ordinary scroll
   reveals, the page map measured 8% of the page and reported 0 problems, and the audit missed a 1.49:1
   button, with nothing in `coverage`. The wireframe squeezes 223–458px into one ASCII row, the region cap
   drops whole sections, and the workflow (one screen read, one focal point, a 1280×900 screenshot) has no
   model of a page made of many screens. Each run also re-types a 153 KB script.
2. **Components: properties, not specs.** The rules say a component's contrast, radius, centering
   and hit area are right. They don't say what a good data table, menu, tooltip, dialog, drawer, toast,
   sidebar, tab bar, breadcrumb, command palette, switch, date or file input *is*: sizes, anatomy,
   placement, behavior. They also define data states (empty/loading/error) but not **interaction
   states** (hover, pressed, selected, disabled, read-only), which no script checks. The sibling-skill
   survey confirms no installed skill covers most of these either.
3. **Visuals: "not wrong" isn't "excellent".** Budgets and contrast stop bad screens. There is no
   positive spec for craft (layered and tinted shadows, hairlines, gradient color space, icon systems,
   display type, product imagery, the small finishes), and marketing/editorial pages get one line of
   guidance. The craft numbers that do exist are spread over sibling skills that disagree with each
   other and are not measured.

### Top recommendations

| # | Recommendation | Why first | Effort | Impact |
|---|---|---|---|---|
| 1 | **Load the scripts instead of re-typing them (H1)**: a 20-line local server and a one-line loader | The biggest cost of every screen review, and it multiplies with page size. Tested: same results, under 100 tokens per run instead of ~40k | S | **H** |
| 2 | **Make big pages measurable, and honest when they aren't (H2)**: a `prepare` scroll sweep, opacity-0 and lazy content reported in `coverage`, every cap reported | Today a long page can pass with 92% of it unmeasured. This is a correctness bug, not a feature | S–M | **H** |
| 3 | **Band mode (H3) + long-page rules (H4, SU-204–211)**: per-band wireframes, first reads and fingerprints; a page read; band screenshots; section variety, no false floor, sticky header and anchors, one repeated CTA, reveals that never hide | Turns "one screen" into "a page of screens", which is how long pages are designed and judged | M | **H** |
| 4 | **A component spec layer (H6, SU-222–247) and a spec-plus-specimen component workflow (H7)** | Product screens are made of these components, and nothing in shibroUI or its siblings specifies them | M–L | **H** |
| 5 | **Interaction-state matrix (H8, SU-248–252)** with CSSOM checks for hover/selected contrast, layout shift on select, and color-only selection | A whole class of real bugs (bold tabs that jump, hover that kills contrast) is invisible to every current check | M | **H** |
| 6 | **Craft and page patterns (H9 SU-253–264, H5 SU-212–221)** | Closes the gap between "passes" and "looks premium", with numbers the audit can measure | M | M–H |

**Quick wins** (under a day each): H1; H2's honest coverage and cap reporting; H10's SU-4 badge
exemption and root-cause grouping; the SU-220 heading-proximity check; the six SKILL.md default rows.

---

## 2. Evidence: what happens on a big page today

Two runs at 1280×900, with `page-map.js` and `audit.js` v0.3.0 loaded unmodified.

**A. shibro.dev `/ui/`** (15,603px tall, 1,157 elements, three long sections of tiles).
- Both scripts finish quickly: page map 0.5s / 18 KB of JSON, audit 1.6s / 12 KB.
- The wireframe is unreadable at this height. It keeps 70 rows for the whole document, so **one row is
  223px**: a 900px screen becomes four rows of ASCII.
- The 36-region cap is spent on the biggest boxes first. The "Illustrations" section (2,460px tall)
  is drawn as an **empty box**, and so is most of "Components".
- Budgets are page-wide: 9 font sizes, 5 weights and 5 radii are flagged for the whole page, without
  saying which section brings which value.

**B. A generated long landing page** (32,026px, 5,264 elements; a sticky header, a hero, 12 sections of
24 cards with a common scroll-reveal pattern — `opacity: 0` until an IntersectionObserver adds `.in` — and
bugs planted only in the last section: 15px and 17px text, a 3px edge miss, and white-on-`#c7d2fe`
buttons at 1.49:1).

| | Before scrolling | After scrolling the page once |
|---|---|---|
| Page map: elements measured | **424** (8%) | 4,968 |
| Page map: flags | **0** | 7 warns: the planted sizes (SU-126), the 3px edges (SU-124), off-scale spacing (SU-125) |
| Audit: the 1.49:1 buttons (SU-46) | **missed** | fail, 2 instances |
| Audit: says it was blind | **no** (`capsHit: []`; no check reports opacity-hidden content) | n/a |
| Audit: instances | 83 | 877, almost all from three root causes |
| Wireframe row height | 458px | 458px |

The cause is one line in both scripts: `isVisible()` treats `opacity: 0` as hidden, which is right
for a closed menu and wrong for content waiting for a scroll reveal. Nothing reports how much of the
page was skipped. The same blindness applies to lazy-mounted sections, `content-visibility: auto`
regions that never scrolled into view, and virtualized lists.

**Smaller defects found on the way:**
- **Silent caps.** `page-map.js` stops at 6,000 elements with no note (the audit reports its own
  caps). The baseline check stops at 300 rows, hidden states at 30, instances at 40 per finding, regions
  at 36, all silently. SKILL.md tells the agent to fix "every instance", which it can't see past 40.
- **Fragmented findings.** The audit's grouping key includes the measured detail, so one missing
  `::before` hit area on a 20px and a 22px icon becomes two findings. On the test page SU-62 came back
  as 7 findings and SU-63 as 8.
- **One root cause, hundreds of instances.** SU-70 ×295 (no global `:focus-visible` style), SU-145
  ×285 (no `scroll-padding-top` for the sticky header) and SU-4 ×198 (see the next item) are each one
  CSS fix.
- **SU-4 fires on badges.** A 16px link next to a 12px filled pill (`.tag` with a background) in a
  card footer is flagged as a baseline mismatch. A pill is a box, and boxes center by design; the rule
  is for bare mixed-size text like `$199 /month`.
- **The wireframe's minimum region area scales with the document** (0.4% of page area), so the
  longer the page, the fewer sections qualify as regions.
- **Cost.** `audit.js` is 153 KB, about 40k tokens. SKILL.md says to "pass the file contents to the
  JavaScript tool", so the model re-types it on every run. A big page needs runs × regions × states ×
  schemes × widths, easily 20+ runs. In this test the scripts were loaded with
  `fetch('http://127.0.0.1:4399/audit.js').then(r => r.text()).then(eval)` from a 15-line local server
  with CORS headers: the same results for under 100 tokens per run.
- Not re-tested here, still open from the v3 proposal: app shells where `main` scrolls instead of the
  window (B8), shadow DOM (B9) and JS-driven animation (B13). All three are common on big apps.

## 3. Backlog

| ID | Item | New rules | Script work | Effort | Impact | Priority |
|---|---|---|---|---|---|---|
| H1 | Script loader | none | `scripts/serve.mjs`; loader in SKILL.md | S | H | **P1** (first) |
| H2 | Big-page sweep and honest coverage | none | `prepare` option; opacity-0, `content-visibility` and lazy content in `coverage`; every cap reported; viewport-based region threshold | S–M | H | **P1** |
| H3 | Band mode and the page read | none | page-map `bands` and `outline` (wireframe, first read, loud buttons, new system values, layout fingerprint per band); audit `band` option | M | H | **P1** |
| H4 | Long-page rules | SU-204–211 (`long-pages.md`) | fingerprint monotony, band backgrounds, CTA labels, `scroll-margin-top`, reveal gating | M | H | **P1** |
| H5 | Page patterns: landing, pricing, docs | SU-212–221 (`patterns.md`) | heading proximity (SU-220), code blocks, pricing card checks | M | M–H | P2 |
| H6 | Component spec layer | SU-222–247 (`components-data.md`, `-navigation.md`, `-overlays.md`, `-inputs.md`) | about 15 targeted checks (menu item height, last-crumb link, tooltip content, dialog size, drop zone without input, …) | M–L | H | **P1** |
| H7 | Component workflow: spec and specimen | none (uses SU-239, SU-248) | none; workflow and report changes | S–M | H | **P1** |
| H8 | Interaction-state matrix | SU-248–252 (`interaction.md`) | CSSOM state pairs, selected vs sibling, bold shift, disabled hints | M | H | **P1** |
| H9 | Visual craft | SU-253–264 (`craft.md`) | icon inventory in page-map, shadow layers, gradient midpoint chroma, image sharpness, logo areas, finishes list | M | M–H | P2 |
| H10 | Root-cause grouping; false positives | none | finding key `(rule, signature)` with ranges; rule-level causes folded; SU-4 skips filled boxes | S | M | P2 (quick win) |
| H11 | Consistency across routes | SU-265 | `scripts/compare-maps.mjs`; read impeccable's `DESIGN.md` tokens when present | M | M | P3 |
| H12 | Evals for the new areas | none | 5 evals (long landing, docs, component-heavy admin, specimen, blind visual pairwise) | M | H | **P1** (with each item) |

All new IDs are contiguous by file (SU-204–265), so the rule map stays one row per file. Every new
file stays under about 200 lines; `components-*` is split four ways for that reason.

## 4. Item details

### H1. Load the scripts instead of re-typing them (P1 · S · H)

**Gap.** Every run pastes 153 KB (`audit.js`) or 37 KB (`page-map.js`) into a tool call. That is the
largest single cost of the screen workflow, and it grows with page size because big pages need more runs.

**Change.**
- Add `scripts/serve.mjs` (about 20 lines, Node stdlib): serves `scripts/` on `127.0.0.1:4399` with
  `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Private-Network: true` and `Cache-Control:
  no-store`. Run it in the background once per session.
- Make the one-line loader the documented default in "Running the scripts":
  ```js
  await fetch('http://127.0.0.1:4399/audit.js').then((r) => r.text()).then((src) => (0, eval)(src))
  ```
  Keep "paste the contents" as the fallback for pages with a strict CSP (`connect-src` or no
  `unsafe-eval`), and say how to tell: the loader throws a CSP error.
- Set options in the same call: `window.__shibroAudit = { root: '#pricing' }; await fetch(…)`.
- This is the small version of G7's `scan.mjs` (headless sweep of every state). Ship it first; it
  needs no Playwright.

**Test.** `tests/serve.test.mjs`: the server returns the file with the CORS headers and refuses paths
outside `scripts/`. Re-run eval 4 and compare tokens and time against `evals/RESULTS.md`.

### H2. Make big pages measurable, and say when they aren't (P1 · S–M · H)

**Gap.** Scroll reveals, lazy sections and `content-visibility` hide most of a long page from both
scripts, and nothing in the output says so (§2).

**Change.**
- **`prepare` option** (both scripts, opt-in: `window.__shibroAudit = { prepare: true }`): scroll the
  scroller (window or the app shell's `main`, see B8) from top to bottom one viewport at a time, wait
  ~100ms per step for observers and lazy mounts, return to the top, then finish running transitions and
  animations as the scripts already do. Report `coverage.prepared: { steps, msWaited, elementsBefore,
  elementsAfter }`.
- **Honest coverage without `prepare`:** count elements that are laid out (non-zero box, in the
  document flow) but hidden only by `opacity: 0` on themselves or an ancestor, and report them:
  `coverage.skipped["laid out but opacity 0 (likely scroll reveals): 4,544 elements in 13 sections"]`
  plus a `notes` line telling the agent to re-run with `prepare: true`. Do the same for
  `content-visibility: auto` subtrees that are still skipped (`el.checkVisibility({ contentVisibilityAuto:
  true })`).
- **Every cap reports itself.** `page-map.js` gets `coverage.capsHit` like the audit. Each `slice(0,
  N)` and `maxRows` in either script pushes a line when it bites, and each finding carries `count` next
  to its (capped) `instances`, with SKILL.md saying "fix the pattern; `instances` is a sample when
  `count` > 40".
- **Region area threshold** in the wireframe uses the viewport area (0.4% of `innerWidth ×
  innerHeight` × a small factor), not the document area.

**Test.** `tests/fixtures/longpage-reveal.html` (the generated page from §2, shortened to 6 sections):
without `prepare` the audit must report the opacity-0 skip; with it, SU-46 must fail twice and SU-124/126
must flag. A twin without the reveal must give the same results with and without `prepare`.

### H3. Band mode: read a long page one screen at a time (P1 · M · H)

**Gap.** The screen workflow assumes one screen: a five-line screen read, one focal point, screenshots
at 1280×900 and 375. On a page taller than about three viewports:
- one screenshot shows only the first band, and a full-page screenshot is downscaled until text is
  unreadable (a 15,600px page shrinks roughly 8–10× in a vision model);
- page-map's single wireframe, single focal point and page-wide budgets blur sections together (§2).

**Change.**
- **Page map `bands`.** Split the document at top-level section boundaries (falling back to one
  viewport height). For each band report:
  - its own small wireframe (same 96 columns, rows sized so one row ≈ 24–32px);
  - its first read (the top visual-weight tier inside the band);
  - its loud buttons;
  - the values it adds to the system (font sizes, colors, radii that appear only in this band);
  - a **layout fingerprint**: heading level and size, column count, child count, the repeated child
    shape (e.g. `h2 40px + p + grid 4×6 card(h3,p,ul,footer)`), background color and padding.
  - Top-level `outline`: the list of bands with their fingerprint and height, which is the "page read"
    in one glance.
- **Page read** (replaces the screen read when the page is ≥ 3 viewports): the job; the story in band
  order, one line per band (*what this band is for*); the primary action and where it repeats; the bands
  that do the same job (merge candidates); the states to visit.
- **Band screenshots.** Scroll to each band and take a viewport screenshot at 1280 and 375. Never judge
  a long page from one full-page image.
- **Fan-out for very long pages** (≥ 8 bands, or a review with several routes): the main agent sets the
  tokens and owns the page-wide checks (budgets, outline, repeated CTA, consistency); up to 4 subagents
  (per the user's limit) each review a range of bands with the same tokens and the same finding format;
  the main agent merges findings by root cause (H10).
- **Audit per band.** The `root` option already exists. Add `window.__shibroAudit = { band: 3 }` that
  scopes to page-map's band 3 so the two scripts agree on boundaries.

**Test.** On the `/ui/` page: band mode must draw the "Illustrations" tiles, and the outline must list
every section. Unit test for the fingerprint on `rhythm-good.html`.

### H4. Long-page rules (P1 · M · H) — new `references/long-pages.md`, SU-204–211

| ID | Rule (draft) | Numbers / pass condition | Measure |
|---|---|---|---|
| SU-204 | **Each screen has a lead.** On a long page, every viewport-height band has one focal element (a heading, a visual or a number), and section heads share one strong style. The page-wide focal point (SU-119) is the hero | one top tier per band; section `h2`s share one style | page-map `bands[].firstRead`; warn when a band has two different top styles or none |
| SU-205 | **Vary the shape, keep the system.** Consecutive sections don't repeat the same layout fingerprint more than twice; alternate dense and airy bands; one idea per band. Rhythm comes from consistent section padding, not from changing tokens | ≤ 2 identical fingerprints in a row; section padding one token (e.g. 96px desktop, 64px phone) | page-map: warn on 3+ consecutive identical fingerprints (the "endless card grid" generated-UI tell); warn on section padding varying by more than one step |
| SU-206 | **No false floor.** The first screen never looks finished: the next band peeks in within the first viewport at 1280×800 and 375×667, and no full-width rule or large empty gap sits at the fold. It matters because 57% of viewing time is spent above the fold and 74% in the first two screens (NN/g 2018), and in NN/g's false-floor study 6 of 8 users didn't realise the page scrolled | something from band 2 visible above the fold, or a deliberate scroll cue | page-map: info when band 1 ends within 24px of the fold with a full-width color change there |
| SU-207 | **Stay oriented on long pages.** A sticky header stays 56–64px in apps, up to 72px on marketing pages (48–56 on phones), is opaque, keeps a content-to-header ratio of about 13:1 or more (NN/g calls 2:1 excessive), and casts a level-1 shadow only once the page has scrolled; if it hides on scroll-down it slides back on scroll-up (NN/g: 300–400ms). Anchor targets set `scroll-margin-top` = header height + 16–24px. Long reading pages get an in-page table of contents, sticky in a side rail from ~1200px wide and plain (not sticky) at the top of the article below that (NN/g: collapsed sticky TOCs on mobile are often missed), with the current section marked (`aria-current="true"`). Pages longer than 4 screens get a text "Back to top" link at the lower right (NN/g) | header ≤ 64px app / 72px marketing; `scroll-margin-top` ≥ header height | audit: warn when a sticky/fixed header exists and in-page anchors' targets have `scroll-margin-top` (or `html` `scroll-padding-top`) smaller than it; info on pages ≥ 4 viewports of prose with no TOC (`nav` of in-page links) |
| SU-208 | **One call to action, repeated.** The primary CTA keeps the same label and style everywhere it appears: the header, the hero, after every 2–3 bands where the story reaches a decision point, and the final band. Secondary CTAs stay secondary | 1 distinct primary label per page | page-map: warn when filled accent buttons on the page carry more than one distinct label (SU-121 applied page-wide, per band for apps) |
| SU-209 | **Scroll reveals enhance; they never hide.** Content is visible by default; the hidden start state only applies once JS has run (`html.js .reveal`) and never to content already in view at load. Reveal once, by 8–24px and 200–400ms ease-out, with any stagger ≤ 300ms in total. Under reduced motion, no movement. No scroll-jacking (NN/g), and no parallax on text | start state never `opacity: 0` without a JS-set class; distance ≤ 24px; ≤ 400ms | audit: warn on CSS that sets `opacity: 0` on content containers at rest with a transition and no `.js`/`[data-*]` gate; with `prepare`, warn on reveals that start in the first viewport; reuse the motion checks for distance and duration |
| SU-210 | **Band backgrounds band gently.** Alternating section backgrounds use the base surface and at most one or two neighbouring steps (ΔL ≤ 0.04 in OKLCH), plus at most one full-bleed brand band per page. Boundaries come from space and surface, not a stack of borders | ≤ 3 distinct band backgrounds | page-map `bands[].background`: warn on more than 3 distinct band backgrounds or more than one saturated full-bleed band |
| SU-211 | **Long pages stay fast.** Bands below the second screen use `content-visibility: auto` with `contain-intrinsic-size: auto <height>` (SU-195); images below the fold are lazy (SU-194); nothing below the fold blocks first paint | n/a | existing SU-194/195 checks, run per band |

**Agreement with siblings.** SU-205 matches design-taste-frontend (no more than 2 zigzag sections in a row; 8 sections need at least 4 layout families). SU-209 matches impeccable ("reveals must enhance an already-visible default"; fade-on-scroll on every section is a generated-UI tell) and contradicts high-end-visual-design, which wants every element revealed over 800ms or more. Keep shibroUI with impeccable and say so in the routing notes.

**Risks.** Fingerprints can call deliberately repeated sections (a list of case studies) monotonous;
keep SU-205 at warn and explain in the finding that a repeated *list* is fine when it reads as one list
(one heading over it). The TOC heuristic needs a prose threshold so app pages aren't flagged.

### H5. Page patterns beyond the app: landing, pricing, docs (P2 · M · M–H) — new `references/patterns.md`, SU-212–221

**Gap.** `composition.md` gives six patterns. Five are app screens; "Landing" is one line (hero → proof
→ features → testimonial → CTA, 64–128px apart). Marketing, pricing and docs pages are where a design is
judged on looks first, and where the generated-UI tells (identical card grids, gradient blobs, vague
headlines) live. Move the six existing patterns to `patterns.md` with these, and keep a pointer in
`composition.md`.

| ID | Rule (draft) | Numbers | Measure |
|---|---|---|---|
| SU-212 | **The hero says one thing and shows the product.** A headline of about 10 words or fewer that names the outcome, on at most 2 lines at desktop (3 on phones; 10–20ch measure, `balance`), a subhead of ≤ ~20 words at 18–22px and ≤ 60ch, one primary CTA plus at most one secondary of the same height (labels ≤ 3 words), and a visual that is the product (a real screenshot, demo or output), not an abstract shape. Headline, subhead and CTA all fit the first screen at 1280×800 and at 375×667 | headline ≤ ~10 words, ≤ 2 lines; subhead ≤ ~20 words; CTA ≤ 2; all in the first viewport | page-map band 1: words in the `h1`, loud buttons, `aboveFold` at both widths. (No primary source gives hero numbers; these follow design-taste-frontend:236–245) |
| SU-213 | **Proof is specific.** Logos (SU-260) or 2–4 numbers with units and a source; testimonials with a real name, role, company and photo, quoted in ≤ ~40 words (hanging quotes, SU-38). Proof sits right after the hero or right before a CTA | n/a | manual; SU-184 already flags John Doe and round numbers |
| SU-214 | **Features are benefits with evidence.** 3–6 features. Each band or card leads with the benefit as its heading ("Ship previews on every PR"), then one sentence, then the proof (a screenshot crop, a code sample, a number). Alternate media left/right in split bands; keep icon-only feature grids to a single band | ≤ 6 features per band; media in split bands alternates | page-map fingerprints (SU-205) |
| SU-215 | **Bento grids have one hero cell and one gap.** A 12- or 6-column grid with spans, one gap equal to the gutter, at most two cell sizes besides the hero cell, one message per cell, text inset equal in every cell, and cells in one row sharing height (SU-132). Not every cell gets a picture | one gap; ≤ 3 cell sizes | page-map: rows (SU-132) and equal gaps (SU-203 logic applied to grids) |
| SU-216 | **Pricing compares at a glance.** 3–4 plans in one row (stacked on phones, recommended plan first); every card the same height with feature lists starting at the same line and CTAs pinned to the bottom; the recommended plan marked by a text badge ("Most popular") *and* a border or accent, never by color alone and never by making it taller; prices with `tabular-nums`, the period baseline-aligned (SU-4), the same billing unit on every plan; a monthly/annual switch that states the saving; the same features in the same order on every card, then a comparison table that isolates what differs between tiers (sticky header, ✓ and ✕ icons with text for screen readers; missing features shown with ✕, not in low-contrast gray, per NN/g); a range when there's no exact price. One CTA style per card, the recommended one filled | 3–4 plans (3 preferred); 1 filled CTA; equal card heights | audit: SU-4, SU-16, SU-121 per band; info when plan cards' feature lists differ in order |
| SU-217 | **FAQ answers objections.** 5–10 real questions in `<details>`/`<summary>` (or the APG accordion), the whole header row as the target (NN/g), a caret or plus at the end, several open at once, and every answer reachable by in-page search (`hidden="until-found"` where supported) | 5–10 items | audit: existing SU-147 checks; info on FAQ items hidden with `display: none` (not findable) |
| SU-218 | **The footer is quiet and complete, not a link farm.** Only the links people look for (product, company, support, legal), grouped under short headings at 14px muted (≥ 4.5:1), the legal row last, the primary CTA once more above it (SU-208) | ≤ ~4 short groups | contrast checks already cover it |
| SU-219 | **Article layout: one reading column, wider media.** Prose at 60–75ch; figures, tables and code may break out to ~80–100ch (or full bleed for images); captions 14px muted directly under their figure; a sticky TOC beside the column from ~1200px (SU-207); headings with anchor links that appear on hover *and* focus | prose 60–75ch | SU-15 already measures; info when figures are narrower than the text column |
| SU-220 | **Headings belong to what follows.** Space above a heading is about 1.5–2× the space below it, in prose and in sections, so each heading groups with its content (proximity, SU-22). Paragraph spacing ≈ the line height | margin-top ≥ 1.5× margin-bottom | audit: warn on headings whose space below is ≥ the space above (measured from rendered boxes, so it also catches flex `gap`) |
| SU-221 | **Code blocks read and copy cleanly.** Mono 13–14px at line-height 1.5–1.6, `tab-size: 2`, horizontal scroll inside the block (never page overflow, SU-170) with `tabindex="0"` and a name, a "Copy code" button that announces "Copied" (SU-146), syntax colors ≥ 4.5:1 on the block's background in both schemes, and line wrapping only for prose-like blocks (shell output stays unwrapped) | token colors ≥ 4.5:1 | audit: the text-contrast walker already covers spans in `pre`; warn on `pre` without overflow handling |

**Risks.** Marketing rules are where brand teams most often disagree, and the installed skills disagree too:
- **FAQ:** redesign-existing-projects says avoid accordion FAQs; minimalist-ui specs a boxless one. SU-217 keeps native `<details>` because it's findable, keyboard-ready and needs no JS.
- **Tiers:** impeccable caps pricing at 3 tiers (`reference/critique.md:350`); SU-216 allows 4 for products with an enterprise tier.
- **Hero:** design-taste-frontend allows a secondary CTA, stitch-design-taste allows one CTA only. SU-212 follows the former.

Keep the numbers as starting values; the user's own brand system wins (component workflow step 1).

### H6. A component spec layer (P1 · M–L · H) — four new files, SU-222–247

**Gap.** The component rules (SU-1–118) are *properties* (contrast, radius, centering, hit areas) plus a
handful of controls (checkbox, slider, search pair, pagination heights). Most of what product screens are
built from has no spec: data tables beyond alignment, navigation, menus, tooltips, popovers, dialog
sizes, drawers, toast placement, switches, date and file inputs, avatars, chips, command palettes. On a
component-heavy screen the skill can say a menu's contrast is fine but not that its items are 24px
tall, its destructive item sits in the middle, or that the "modal" is a 14-field form that should be a
page. These are the components where top-tier and average products differ most.

Each rule below is a starting spec; the project's design system wins (component workflow step 3). Values
marked † were checked against the primary sources in §6; unmarked ones are common practice or come
from sibling skills.

**`components-data.md` (SU-222–227): tables, lists, filters**

| ID | Rule (draft) | Numbers | Measure |
|---|---|---|---|
| SU-222 | **One density per table.** Rows 32 (compact) · 40 (default) · 48 (comfortable); 64 only for two-line rows. The header row matches the row height, cell inline padding 12–16px. Offer a density switch only in tools people live in | 32/40/48 † (Carbon 24/32/40/48/64, header = row; Primer padding 8/12/16) | audit: row heights per table; warn on mixed row heights in one `tbody` (not caused by wrapping) |
| SU-223 | **Columns are sized by their content.** Fixed widths for selection (40–48px), status, dates and amounts; the name/description column flexes. Text cells truncate with the full value on hover *and* focus (SU-200); numbers and IDs never truncate. Headers stick when the table is taller than the screen; the first column, which holds the human-readable identifier, sticks when the table scrolls sideways, with a subtle shadow on the frozen edge (NN/g) | frozen header + first column when the table outgrows the screen † (NN/g) | audit: warn on truncated numeric cells; warn on a horizontally scrolling table with no sticky first column and no edge cue |
| SU-224 | **Sort and select are visible state.** The header label is a `<button>` inside the `th`; only the sorted column carries `aria-sort` and shows its icon; a sortable table starts sorted by one column. A selection column has a header checkbox (indeterminate when some rows are selected). Selecting a row swaps the toolbar for a batch bar at row height: "3 selected", the bulk actions, Cancel at the far end; row actions are disabled meanwhile. Offer "Select all 1,240" when the page is all selected | † APG sortable table; Carbon batch actions; Primer default sort | audit: fail when header buttons inside `th` show a sort icon but no `th` in the table has `aria-sort`; warn on a checkbox column without a header checkbox |
| SU-225 | **Row actions sit at the end and are always visible.** One or two actions in the last column plus "⋯" for the rest, named per row ("Actions for INV-2041"), never revealed only on hover (SU-174). Make the whole row open its detail only when the row has no other controls, otherwise link the name cell. Empty cells show "—" with an accessible "None" | ≤ 2 visible row actions | SU-174 check; audit: info on rows with `onclick` that also contain buttons |
| SU-226 | **Paginate tables and search results; scroll feeds.** Tables show the range and total ("1–50 of 1,240"), pagination below the table at row height, page size in a menu, and the page in the URL. Infinite scroll only for aimless browsing of similar items; never for finding, comparing, or when the footer matters — use "Load more" there. Keep the position on back | † NN/g, Carbon; page sizes (25/50/100) are convention | manual |
| SU-227 | **Filters show what's applied.** Search plus 2–3 visible filters; the rest behind "Filters". Applied filters appear as removable chips with "Clear all"; the result count updates in a `role="status"` region; filters live in the URL. Zero results says what's filtered and offers "Clear filters" (SU-117) | ≤ 3 visible filters | SU-146 check for the count; manual otherwise |

**`components-navigation.md` (SU-228–232)**

| ID | Rule (draft) | Numbers | Measure |
|---|---|---|---|
| SU-228 | **Sidebar navigation.** 220–280px (SU-123), items 32–40px tall with a pointer (44–56px on touch) with 16–20px icons and 14px labels, group labels 12px muted, at most two levels. The current item has a tinted fill, full ink and `aria-current="page"`. Collapsed, it becomes a 48–80px rail with a tooltip per item | † Carbon side nav 256 / rail 48; M3 drawer 360dp with 56dp items, rail 80–96dp | audit: warn on nav lists where no link has `aria-current` while one is styled as active |
| SU-229 | **Top navigation and mega menus.** Header 56–64px (SU-134), ≤ ~7 items, the current section marked. Mega menus open on click, or after ~0.5s of hover and then within 0.1s, tolerate diagonal pointer paths, close ~0.5s after the pointer leaves and on Escape, and group links under headings | † NN/g mega menus | SU-147, SU-174 checks |
| SU-230 | **Tabs switch views of one thing.** 40–48px tall (64 with icon and label), a 2–3px indicator at least 24px wide, ≤ ~7 tabs before they scroll (with arrow buttons and an edge fade; scrollable tabs ≥ 90px wide). Never tabs for sequential steps or for links to other pages (those are nav links with `aria-current`). Selecting a tab doesn't move its neighbours (SU-249) | † M3 tabs 48/64dp, 3dp indicator | SU-147, SU-203, SU-249 checks |
| SU-231 | **Breadcrumbs show where, not where you've been.** Only for hierarchies of 3+ levels. The current page is either the last crumb as plain text with `aria-current="page"` (NN/g) or left out (GOV.UK), and never a link to itself; separators `aria-hidden`; on phones show 1–2 levels (or the first and last); chevrons mirror in RTL (SU-198) | † NN/g, GOV.UK (they disagree on the current page) | audit: warn when the last crumb is a link to the current URL |
| SU-232 | **Command palette.** ⌘K / Ctrl+K plus a visible button that shows the shortcut; optional scope prefixes (GitHub: `>` commands, `#` issues, `@` people); 560–640px wide, ~15–20% from the top; a 48–56px input; grouped results with headings, ≤ 10 visible on desktop (4–8 on phones), recent items when empty, matched characters highlighted, shortcuts right-aligned; the combobox pattern with `aria-activedescendant`; Escape closes and returns focus; no open/close animation for something used this often (emil-design-eng) | † GitHub palette; Baymard ≤ 10 suggestions; widths are convention | SU-147 combobox checks |

**`components-overlays.md` (SU-233–238)**

| ID | Rule (draft) | Numbers | Measure |
|---|---|---|---|
| SU-233 | **Menus.** Items 32–40px with a pointer, 44–48px on touch; 160–288px wide; icons on every item or none, in a fixed 16px column; shortcuts right-aligned and muted; most important items first, groups split by dividers, high-impact actions (delete) set apart by a divider and the danger color (conventionally last); context menus of ≤ 12 items so they never scroll, otherwise group or add search; submenus one level deep and ≤ ~5 items. Type-ahead, arrow keys, Escape | † Carbon 24–48 items, 160–288 wide, ≤ 12; M3 48dp, 112–280dp; Apple grouping and submenus | audit: warn on `menuitem`s under 32px tall (or 44px at ≤ 480px); info on a danger-styled item with no divider before it |
| SU-234 | **Tooltips label; they don't explain.** Short (≤ ~75 characters, max width 200–320px, 12–14px); one show delay for the whole product (systems range from 50–100ms to 700ms; ~300–500ms is the middle) and 0ms when moving between neighbouring tooltips; the 140ms fade is separate (SU-85). Shown on focus too, dismissible with Escape, hoverable (WCAG 1.4.13), and absent on touch. Never essential information, never interactive content (use a popover), never on a disabled button (it can't take focus) | † Apple 60–75 chars; Primer 250px; M3 200/320dp; Radix 700/300ms, Carbon 100ms, Primer 50ms (they disagree) | audit: warn on `[role=tooltip]` with focusable content or > ~80 characters; warn on tooltip triggers that are `disabled` |
| SU-235 | **Popovers hold interactive content.** 240–360px wide, 12–16px padding, anchored and flipped at edges (`popover` + anchor positioning, SU-100), focus moved in when they hold controls and back on close | 240–360px | SU-144 focus checks |
| SU-236 | **Dialogs are for short decisions.** Sizes: ~380–400px for confirmations, ~560–640px by default, ~960px for complex content; never a horizontal scroll (go up a size, or to a page). Max height ~85–90vh with a fixed header and footer, a scrolling body and a fade at its bottom edge. Title as the dialog's name; footer with Cancel and the verb (SU-178), the primary at the end, three buttons at most; a 44–48px close target. Modal only for decisions the task can't continue without; long forms (more than ~6 fields), multi-step flows, nonessential content and anything people need to compare against the page go to a page or a non-modal side panel. One dialog at a time. On phones, full screen or a bottom sheet | † Polaris 380/620/980, Primer 296–640, M3 280–560dp, Carbon max height 48–96%; NN/g modal vs nonmodal; Apple one sheet at a time | audit (with the dialog open): warn on dialogs wider than 90vw at ≥ 768px or with body overflow but no internal scroll; info on dialogs holding > 6 fields |
| SU-237 | **Side panels and drawers.** 320–480px by default, 640px for complex panels (detail panels 320–400px, SU-123), full width under ~600px. A modal drawer has a scrim and traps focus; a non-modal side panel leaves the page usable and doesn't trap. Sticky header with title and close; a detail panel's selection lives in the URL | † Carbon side panel 320/480/640; Primer overlays 320/480/640 | SU-103/144 checks |
| SU-238 | **Toasts don't cover the work.** One consistent corner for the whole product (Carbon: top right; M3: bottom), above any bottom nav on phones, about 288–420px wide and ≤ 2 lines, at most ~3 stacked 8px apart with the newest nearest the edge (M3 shows one at a time), and never over the primary action. Whatever a toast links to is also reachable elsewhere. Timing and content are SU-161 (a toast with an action doesn't auto-dismiss: M3, Carbon) | † Carbon 288px, 8px stack; M3 4s/10s, one at a time; Polaris 5s, 10s with an action | audit: warn when a toast-like element overlaps a visible button or the bottom nav |

**`components-inputs.md` (SU-239–247): inputs and small display pieces**

| ID | Rule (draft) | Numbers | Measure |
|---|---|---|---|
| SU-239 | **One control size scale.** sm 32 · md 40 · lg 48px tall, with text 13–14 / 14–16 / 16px, icons 16 / 16–20 / 20–24px and inline padding 12 / 16 / 20px. Mixed sizes never share a row (SU-58–60). On touch, md with a 44px hit area (SU-62) and 16px field text (SU-175) | 32/40/48 | page-map: info listing control heights in use; warn on > 3 |
| SU-240 | **Switch for "now", checkbox for "on save".** A switch applies its effect immediately (settings); a checkbox is a choice submitted with a form. The label names the setting, not the state. `role="switch"` with `aria-checked`; the state shown by thumb position and a shape cue, not color alone. Apple on macOS prefers a checkbox even for a single setting; follow the platform | † NN/g; M3 track 52×32dp; Apple toggles | audit: info on switches inside a form that also has a submit button |
| SU-241 | **Pick the control by option count.** 2–5 options that all fit → radios (or a segmented control when it switches a view or mode); 6–15 → a select; more → a searchable combobox (SU-54). Multi-select up to ~7 → checkboxes; more → a combobox with chips | 2–5 / 6–15 / > 15 | audit: info on `select`s with ≤ 3 options and radio groups with > 7 |
| SU-242 | **Dates people know are typed.** Distant, known dates (a birthday) are typed: three numeric fields (day and month 2 characters wide, year 4, `inputmode="numeric"`, `autocomplete="bday-*"`, no auto-tab) or one field with the format shown. Dates within about a year get a calendar *and* a typed input; ranges get presets ("Last 7 days"); ≤ ~10 possible dates can be a list. No split dropdowns. Accept any separator and month names, start the week by locale (`Intl`), explain unavailable dates, and report errors in order: missing, impossible, other | † NN/g date input; GOV.UK date input | manual |
| SU-243 | **File upload works without dragging.** A button plus a drop zone; accepted types and the size limit stated before choosing; one row per file with name (long names end in an ellipsis with the full name on focus), size, its own status (uploading, done, error with the fix and Retry) and Remove; errors about the whole upload sit in an inline notification above the list | † Carbon file uploader | audit: warn on a drop zone with no `input[type=file]` or button inside |
| SU-244 | **Search fields fit the query.** Wide enough to show a typical query (27+ characters), a visible box rather than a link, a visible label or `aria-label`, a clear button, Enter submits, ≤ 10 suggestions on desktop and 4–8 on phones with the match highlighted, recent searches on focus | † USWDS 27 characters; Baymard suggestion counts; NN/g visible box | audit: info on `type=search` fields narrower than ~20ch |
| SU-245 | **Avatars.** Sizes from one scale (Primer: 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64); circles for people, rounded squares for organizations, teams and bots; `alt` with the name unless it's printed beside it; a fallback of initials (1–2 letters, on a tint chosen from the name, ≥ 4.5:1) or a default image; stacks overlap with a 2px ring in the surface color and "+N" after 3–5 | † Primer avatar and stack; Atlassian uses a default image | page-map: info on > 4 avatar sizes |
| SU-246 | **Badges and chips.** Badges and tags 18–24px tall with 12px text for status and counts (SU-48, SU-71), with a max width and truncation (Carbon: 208px); chips 32px for filters and tokens, their remove button named ("Remove filter: Paid") with a ≥ 24px target; counts cap at "99+" | † Carbon tags 18/24/32; M3 chips 32dp | SU-61/140 checks |
| SU-247 | **Shortcuts are shown and platform-aware.** `<kbd>` in menus, tooltips and the command palette; ⌘ on Apple platforms, Ctrl elsewhere; single-key shortcuts can be turned off or remapped (WCAG 2.1.4) | n/a | manual |

### H7. The component workflow gets a spec and a specimen (P1 · S–M · H)

**Gap.** The component workflow is "apply the defaults, fit the tokens, audit". That catches bad values
in the one state that is rendered. It doesn't make anyone design the states, sizes and content limits,
and the audit can't hover or press.

**Change.**
- **Spec first** (5–10 lines in the working notes): anatomy (named parts), variants, sizes (SU-239),
  the state matrix (SU-248), content limits (shortest and longest label, wrap or truncate), the APG
  pattern and keyboard map, motion (SU-72–92), and the tokens it uses.
- **Specimen sheet.** Render every variant × size × state in one page, in both schemes, plus
  long-text (×2.5, SU-199), empty, and `dir="rtl"`. Force states with attributes the component already
  supports (`data-state`, `aria-pressed`, `aria-selected`, `disabled`) or a `.is-hover`/`.is-active`
  class that mirrors the `:hover`/`:active` rules, so the audit can see them. Run `audit.js` on the
  specimen, then on the real screen.
- **Libraries:** with shadcn/Radix/MUI/Chakra, map their size and variant props onto SU-239 and the
  state matrix rather than restyling primitives (this is where G12's adapters would plug in).
- **Report:** the specimen screenshot goes in the report, with the state × size grid checked off.

**Test.** Eval 4 in H12.

### H8. Interaction states are a matrix, not an afterthought (P1 · M · H) — SU-248–252

**Gap.** `states.md` covers *data* states (empty, loading, error). Nothing defines a component's
*interaction* states (hover, pressed, selected, disabled, read-only) or checks them:
- contrast is measured only in the rendered state, so a hover or selected style that drops a label to
  2:1 passes;
- a selected tab that turns bold and pushes its neighbours 3px is the SU-137/203 class of bug, but
  nothing catches it;
- "disabled" is used both for "not now" and "not allowed", with no rule.

The scripts can't hover, but they can read the CSSOM (as the hover-only check in
`51-touch-and-hover.js` already does) and they can compare the selected item with its siblings.

| ID | Rule (draft) | Numbers | Measure |
|---|---|---|---|
| SU-248 | **Every interactive component specifies its state matrix** — default, hover, pressed, focus-visible, selected/checked, disabled, read-only, loading, error (those that apply) — and shows it in a specimen (H7) | all applicable states designed; none identical to default except where the platform has none (no hover on touch) | workflow: the specimen sheet; checklist row |
| SU-249 | **States change paint, not layout.** Hover, pressed and selected change color, background, shadow or transform. They never change padding, border width, font size or the width of the label. A label that turns bold when selected reserves the bold width (a hidden bold copy via `::after { content: attr(data-label); font-weight: 600; visibility: hidden; height: 0 }`) or uses a grade axis (`font-variation-settings: "GRAD"`) that doesn't change width | 0px shift of neighbours | audit: for `[aria-selected=true]`, `[aria-current]`, `[aria-pressed=true]`, `.is-active`: compare box metrics with unselected siblings of the same component (font-weight differs and the text width of the same string would differ by > 1px → warn). CSSOM: warn on `:hover`/`:active` rules that set `padding`, `border-width`, `font-size` or `font-weight` without a width reservation |
| SU-250 | **Every state keeps its contrast.** Hover, pressed and selected text stays ≥ 4.5:1 on its own background, and focus rings ≥ 3:1. Hover layers are a small, consistent shift: about 4–8% toward the text color on light (M3's state layers: hover 8%, focus and pressed 10%), and lighter on dark. Hover styles sit behind `@media (hover: hover) and (pointer: fine)` so taps don't leave sticky hover (emil-design-eng) | text ≥ 4.5:1 in every state | audit: resolve `:hover`, `:active`, `[aria-selected=true]` and `[data-state=*]` rules that set `color` and/or `background-color` (with `var()` resolved from the element) and compute the pair for matching elements |
| SU-251 | **Selected is obvious without color.** A selected option, tab or nav item differs from its siblings by a non-color cue (weight plus indicator, check icon, fill change of ≥ 3:1 against unselected) | selected vs unselected: a shape/weight/icon cue, or ≥ 3:1 between their fills | audit: in tablists, radiogroups, segmented controls and `nav` lists, compare the selected item with a sibling; warn when only `color` or `background-color` differs and by less than 3:1 |
| SU-252 | **Disabled means "not now", and says why.** Prefer hiding what someone can never do, and explaining what they can't do yet (an inline hint, or `aria-disabled` with a reason in a tooltip that can be focused, since a `disabled` button can't be). Disabled controls are exempt from contrast (WCAG 1.4.3), but must still be recognizable as controls: content about 38% and container about 12% opacity (M3), never below the point where the shape disappears. Read-only is not disabled: full-contrast text, selectable, with a visible "read-only" cue | n/a | audit: info on `disabled` buttons with no adjacent hint text or `aria-describedby`; warn on `[readonly]` fields styled like `:disabled` |

**Risks.** CSSOM resolution of hover pairs misses styles from JS-in-CSS that inject later (fine: false
negatives) and can't see `:has()`-driven states reliably (skip them, and list in `coverage.skipped`).

### H9. Visual craft: say what excellent looks like, with numbers (P2 · M · M–H) — new `references/craft.md`, SU-253–264

**Gap.** shibroUI is very good at *not ugly*: budgets, contrast, alignment, nesting. It has almost
nothing on *excellent*. Aesthetic direction is handed to `frontend-design`, which has no numbers, and
`high-end-visual-design`/`design-taste-frontend` give numbers without measurement. The result is screens
that pass every check and still look generic. These are the craft details that separate a premium
interface from a compliant one, and most of them are measurable.

| ID | Rule (draft) | Numbers | Measure |
|---|---|---|---|
| SU-253 | **Shadows are layered and tinted.** Each elevation is 2–3 layers (contact + key + ambient, as in the SU-99 table). On a colored or tinted background, the shadow takes that hue at low chroma instead of pure black. No single shadow with alpha above ~0.25 or blur above ~64px | ≥ 2 layers above level 1; black alpha ≤ 0.25 | page-map `system.shadows`: warn on single-layer shadows above level 1 and on `rgb(0 0 0 / > .25)`; info on pure-black shadows over surfaces with chroma > 0.04 |
| SU-254 | **Edges are hairlines with alpha.** Borders and dividers are 1px in a translucent ink (`rgb(0 0 0 / .08–.12)` on light, `rgb(255 255 255 / .08–.12)` on dark) so one token works on every surface. On dark, raised surfaces add a 1px top highlight (`inset 0 1px 0 rgb(255 255 255 / .04–.08)`) instead of a heavier shadow | 1px; alpha 0.06–0.14 | page-map `borderColors`: info when opaque gray borders sit on 3+ different surface colors |
| SU-255 | **Gradients interpolate in OKLCH and stay within one family.** `linear-gradient(in oklch, …)`, 2–3 stops, neighbouring hues (distant hues mixed in sRGB pass through a muddy gray middle). Against banding on large dark gradients, add a stop or lighten the dark end first; dither (≤ 2% noise, invisible as texture) only if banding remains. No gradient text (impeccable bans it as a generated-UI tell); if a brand requires it, display sizes only, with contrast measured at the weakest stop | ≤ 3 stops; the sRGB midpoint keeps ≥ 60% of the stops' chroma | audit: for gradients without `in oklch`/`in oklab`, compute the sRGB midpoint of each stop pair and warn when its OKLCH chroma is under 60% of the stops' mean; the contrast check already samples gradient stops |
| SU-256 | **One icon family, one stroke, sized to the text.** One set, one style (outline or filled; filled reserved for the selected state in nav), one stroke width (1.5px at 20px, scaled with size; match it to the text weight beside it). Inline icons are 1–1.25× the font size (16px icon with 14px text, 20px with 16px) and centered on the text's cap height, not its line box (SF Symbols scale against the cap height). With variable icon fonts, match the icon's weight and grade to the text, and drop the grade (about −25) for light icons on dark (Material Symbols) | ≤ 3 icon sizes; one stroke width per size | page-map: add icons to `system` (inline `svg` and icon-font glyphs: rendered size, `stroke-width`, fill vs stroke). Warn on > 3 sizes, mixed stroke widths at one size, and mixed filled/outline in one row |
| SU-257 | **Neutrals carry a trace of the brand.** Gray ramps take the accent's hue at chroma ~0.005–0.02 (OKLCH), so the page reads as one palette instead of the accent sitting on dead gray. Accent covers about 10% of the area or less | neutral chroma 0.005–0.02 | `contrast.mjs --palette`: info listing neutrals at chroma 0 next to a chromatic accent |
| SU-258 | **Display type is set, not scaled.** Display sizes (48–96px desktop, clamped to 32–44px on phones) get tracking −0.02 to −0.04em, line-height 1.0–1.1, a measure of about 10–20ch and `text-wrap: balance`. Use the font's optical size (`font-optical-sizing: auto`, or the display cut). Light text on dark gets +0.05–0.1 line-height (impeccable `reference/brand.md`). Display sizes are their own tier and count as one entry each in the SU-126 budget | tracking ≤ −0.02em at ≥ 48px; leading ≤ 1.15 | audit: warn on text ≥ 48px with `letter-spacing: normal` and line-height > 1.2 (extends SU-8 and SU-5) |
| SU-259 | **Product imagery is crisp and framed one way.** Screenshots in marketing are rendered at 2× device pixel ratio, cropped to the part that matters (no full-window shots at 40% scale where text is unreadable, SU-105), and framed consistently: the surface radius, a 1px alpha border (SU-107) and one elevation level. One image style per page (photo, illustration or 3D), one color grade | `naturalWidth ≥ 2 × rendered width`; one frame style | audit: warn on `img` whose `naturalWidth` < 1.5× its rendered width at DPR ≥ 2 (blurry); page-map: info on mixed image radii in one band |
| SU-260 | **Logos are balanced by area, not width.** Logo walls show 5–8 marks, monochrome (one ink at ~60–70% of text contrast), each scaled so its *area* matches (wide wordmarks shorter, square marks taller), on one baseline row | 5–8 logos; ± 15% area | audit: info on logo rows (≥ 4 sibling images/SVGs in a row in one band) whose rendered areas differ by more than 40% |
| SU-261 | **Depth effects are rare and earned.** At most one glow or spotlight per screen, behind the focal element. Glass panels: 12–24px blur, a 60–80% opaque fill and a 1px border, text ≥ 4.5:1 against the worst backdrop (SU-169). Decorative texture ≤ 5% opacity (SU-116) | ≤ 1 glow per band | page-map: info on more than one large blurred radial gradient or `filter: blur()` decoration per band |
| SU-262 | **Whitespace scales with the medium.** Marketing and editorial pages run larger: body 17–20px at line-height 1.55–1.7, section padding 96–160px desktop (64–96px phone), and one idea per band. App screens stay at SU-125's app tier | n/a | page-map: info when a page with marketing bands (hero + display type) uses the app tier for section gaps |
| SU-263 | **The small finishes are on.** `scrollbar-gutter: stable` on scrolling app layouts (no shift when a dialog locks scroll); `overscroll-behavior: contain` on dialogs, drawers and inner scroll panels; `::selection` in an accent tint that keeps text ≥ 4.5:1; `accent-color` and `caret-color` set to the accent; `-webkit-tap-highlight-color: transparent` only when a pressed state replaces it; `touch-action: manipulation` on controls | n/a | audit: info list of which finishes are missing (one line, not per element) |
| SU-264 | **Squint and compare.** Before handing off, compare the screen with a reference of the same kind that the team admires (or the product's best existing screen) at the same width, band by band: spacing density, type contrast, image quality, how much is on screen. Say what's still behind | n/a | workflow: one line in the report naming the reference and the remaining gap |

**Risks.**
- These are taste with numbers, so keep them at warn/info and let the project's brand win (SU-112).
- Don't duplicate impeccable's generated-UI tells; link to them (routing already exists).
- **An existing conflict to settle first.** impeccable bans a 1px border combined with a shadow
  blurred 16px or more (`impeccable/SKILL.md:93`). shibroUI's own elevation table uses 24–48px blur at
  levels 3–5, and SU-164 pairs dark cards with a 1px border. Proposed resolution: floating layers
  (menus, popovers, dialogs, toasts) may combine a hairline with a large blur; resting and raised cards
  use a border *or* a short shadow (blur ≤ 8px), not both.
- **Grain:** high-end-visual-design wants a 3% grain layer; impeccable bans decorative grain. SU-255
  only allows invisible dithering against banding.

### H10. Group findings by root cause, and fix two false-positive classes (P2 · S · M)

**Change.**
- **Root-cause grouping.** Key findings by `(rule, component signature)` and report the measured
  range (`hit area 20–22px`) instead of one finding per distinct detail. Then fold findings that share a
  single CSS cause into one: the audit already knows the rule-level cause for several checks (no
  `:focus-visible` rule anywhere → one SU-70 finding "no global focus style"; a sticky header with no
  `scroll-padding-top` → one SU-145 finding with the header's height as the fix). Keep `count` and a
  sample of `instances`.
- **SU-4:** skip children that paint a box (non-transparent background, a border, or padding with a
  background) — badges, chips and buttons center optically. Keep the check for bare text.
- **Wireframe threshold:** see H2.

**Test.** The §2 page must come back with one SU-70, one SU-145 and no SU-4 on the card footers; the
existing SU-4 fixtures (`rhythm-bad.html`) must still fail.

### H11. Consistency across routes (P3 · M · M)

**Gap.** Budgets are per page. Big products drift *between* pages: a second button style on the
billing page, a 13px size that only the reports page uses, a different page header on settings.

**Change.** `scripts/compare-maps.mjs` (Node, no browser): takes several saved page-map JSONs and
reports values used on only one route (sizes, colors, radii, shadows, spacing), page headers with
different fingerprints (H3), and the union against the budgets. New rule **SU-265 One system across
screens**: the same role looks the same on every route; one-off values are either promoted to a token or
removed. Add a defaults row: "Across routes: one page-header pattern, one set of tokens, no value used on
only one route (SU-265)".

### H12. Evals for what's new (P1 with each item · M · H)

Every eval today is one app screen (invoices card, settings ×2, share sheet, dashboard). Add, each with
a no-skill arm and 3 runs per cell (G6):
1. **Long landing page** (≥ 10 bands, scroll reveals, pricing, FAQ). Graded with `prepare` on, per band:
   SU-204–210, the pricing rules, contrast in every band, CTA consistency.
2. **Docs/article page** with TOC, code blocks and callouts: SU-207, the docs rules, prose rhythm.
3. **Component-heavy admin screen**: data table with bulk actions and filters, a command palette, a
   menu, a confirmation dialog, a side panel. Graded against the component specs and the state matrix.
4. **Component specimen**: "build a segmented control and a select in sm/md/lg with every state, light
   and dark, RTL". Graded on SU-248–252 and SU-137/203.
5. **Blind visual comparison** (pairwise judge, screenshots only): with skill vs without, on evals 1 and 3,
   because craft (H9) is the area most at risk of passing checks while looking generic.

## 5. SKILL.md changes

SKILL.md is always loaded, so it gets routing and a few defaults, and the numbers live in the new
reference files.

- **Scope picker:** add a fifth scope.
  - **Long page** (≥ 3 viewports: landing, docs, article, long settings, a catalog): the screen
    workflow in band mode (H3), with `prepare` on (H2).
  - The component scope points at the component workflow with a specimen (H7).
- **Screen workflow, step 1:** load the scripts with the loader (H1); on long pages, write the page
  read and take band screenshots.
- **Component workflow, step 2:** "Write the component spec (anatomy, sizes, states, content limits,
  pattern) and build a specimen of every size × state × scheme, plus long text and RTL. Audit the
  specimen."
- **Defaults table:** six new rows, each pointing at its file:

  | Area | Default |
  |---|---|
  | Long pages | One lead per screen-height band; ≤ 2 identical section layouts in a row; one primary CTA label repeated; sticky header ≤ 64px with `scroll-margin-top`; reveals never hide content (SU-204–211) |
  | Page patterns | Hero ≤ ~10-word headline + one CTA + the product; pricing 3–4 plans, recommended marked by text and border; headings sit closer to what follows (SU-212–221) |
  | Control sizes | sm 32 · md 40 · lg 48 px tall, with text 13/14/16, icons 16/16–20/20–24, inline padding 12/16/20 (SU-239) |
  | Components | Tables, menus, tooltips, dialogs, drawers, toasts, navigation and inputs have numeric specs in `components-*.md` (SU-222–247) |
  | Interaction states | Every state designed; states change paint, not layout; every state keeps contrast; selected is obvious without color (SU-248–252) |
  | Craft | Layered, tinted shadows; alpha hairlines; OKLCH gradients; one icon family and stroke; display type tracked tight; crisp 2× product shots (SU-253–264) |

- **Rule map:** one row per new file (`long-pages.md`, `patterns.md`, `components-data.md`,
  `components-navigation.md`, `components-overlays.md`, `components-inputs.md`, `interaction.md`,
  `craft.md`).
- **Description:** it is 950 of 1,024 characters, so adding nouns needs room. Drop the inventory
  sentence ("Ships a page map, an in-page audit … and a screenshot measurer"), which doesn't help
  triggering, and add "landing pages and long pages, data tables, menus, dialogs, navigation, pricing,
  hover and selected states, shadows and icons".
- **Hand-off:** keep "aesthetic direction → frontend-design", and add "shibroUI still owns the craft
  numbers (SU-253–264) and measures them".

## 6. Component numbers and sources

Read from the primary page or from the design system's own source during this research (2026-10-20).
m3.material.io renders client-side, so M3 values come from the Jetpack Compose Material 3 token files
(`androidx/compose/material3/…/tokens/*.kt`). polaris.shopify.com now redirects, so Polaris values come
from `Shopify/polaris` `polaris-react/src`. *(unverified)* marks what couldn't be confirmed.

| Topic | Values | Source | Systems disagree? |
|---|---|---|---|
| Table rows | Carbon xs 24 · sm 32 · md 40 (default) · lg 48 · xl 64 (2-line only); header = row height; 16px cell padding | [Carbon data table style](https://carbondesignsystem.com/components/data-table/style/) | — |
| Table padding | Primer condensed 4/8 · normal 8/12 · spacious 12/16 px (block/inline); a sortable table always has one sorted column | `primer/react` `DataTable/Table.module.css` | — |
| Batch actions | Bar at row height; per-row actions disabled; Cancel at the far right; 3-state sort; only the sorted column shows its icon | [Carbon data table usage](https://carbondesignsystem.com/components/data-table/usage/) | — |
| Sort semantics | `aria-sort` only on the sorted `th`; the label is a `<button>` | [APG sortable table](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/) | — |
| Big tables | Freeze header and first column (a readable identifier), subtle shadow, zebra or hover | [NN/g data tables](https://www.nngroup.com/articles/data-tables/) | — |
| Paging | No single best; infinite scroll for aimless browsing; "Load more" keeps the footer | [NN/g infinite scrolling](https://www.nngroup.com/articles/infinite-scrolling-tips/) | Page sizes *(unverified)* |
| Dialog width | Polaris 380 · 620 · 980; Primer 296 · 320 · 480 · 640; M3 280–560dp; Carbon by % of viewport (md 48% at ≥ 1312px) | Polaris `Dialog.module.css`; Primer `Dialog.module.css`; Compose `AlertDialog.kt`; [Carbon modal](https://carbondesignsystem.com/components/modal/style/) | Yes, by ±20%; SU-236 takes Polaris-like steps |
| Dialog height | Carbon max xs 48 · sm 72 · md 84 · lg 96%; Polaris `100vh − 60px`; fixed header and footer, fade at the bottom; ≤ 3 buttons; 48px close | Carbon modal; Polaris | — |
| Modal or not | Modal only for what's needed to continue; never for nonessential content or decisions needing the hidden context | [NN/g modal vs nonmodal](https://www.nngroup.com/articles/modal-nonmodal-dialog/); [Apple sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) (one at a time) | — |
| Side panels | Carbon 256 · 320 · 480 (default) · 640 · 1040 · 1280; Primer overlays 192 · 320 · 480 · 640 · 960 | `ibm-products` `SidePanel/constants.js`; `@primer/primitives` `size.css` | — |
| Nav widths | Carbon side nav 256 / rail 48; M3 drawer 360dp with 56dp items; M3 rail 96dp (80 "narrow"), nav bar 64dp (80 "tall") after M3 Expressive | Carbon `_side-nav.scss`; Compose `NavigationDrawerTokens`, `NavigationRail*Tokens`, `NavigationBarTokens` | M3 changed in 2025 |
| Menus | Carbon items 24/32/40/48, 160–288px wide, ≤ 12 items (no scroll), dividers before high-impact actions; M3 48dp, 112–280dp; Apple: groups, submenus ≤ ~5, icons on all or none | [Carbon menu](https://carbondesignsystem.com/components/menu/usage/); Compose `Menu.kt`; [Apple menus](https://developer.apple.com/design/human-interface-guidelines/menus) | "Destructive last" *(unverified convention)* |
| Control heights | Primer 24 · 28 · 32 · 40 · 48; min target 44px on coarse pointers | `@primer/primitives` | — |
| Tooltip delay | Radix 700ms (300ms skip); shadcn overrides to 0; Carbon 100 in / 300 out; Primer 50ms default | [Radix tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip); `shadcn-ui/ui`; Carbon `Tooltip.tsx`; [Primer tooltip](https://primer.style/components/tooltip) | **Yes, 0–700ms**; SU-234 asks for one product-wide value |
| Tooltip size | Primer 250px; M3 plain 200dp, rich 320dp; Apple ≤ 60–75 characters | Primer `TooltipV2`; Compose `Tooltip.kt`; [Apple offering help](https://developer.apple.com/design/human-interface-guidelines/offering-help) | — |
| Tooltip rules | No essential info, no interactive content, on focus too, none on touch; WCAG 1.4.13 dismissible/hoverable/persistent | [NN/g tooltips](https://www.nngroup.com/articles/tooltip-guidelines/); [Primer alternatives](https://primer.style/accessibility/tooltip-alternatives); [WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) | — |
| Toasts | M3 4s / 10s / indefinite (default with an action), one at a time, ≤ 600dp; Polaris 5s, 10s with an action; Carbon top right, newest on top, 8px apart, 288px, persistent by default | Compose `SnackbarHost.kt`; Polaris `Toast.tsx`; [Carbon notification](https://carbondesignsystem.com/components/notification/usage/) | **Yes**: placement and action-toast timing |
| Tabs | M3 48dp (64 with icon + label), 3dp indicator ≥ 24dp, scrollable tabs ≥ 90dp | Compose `PrimaryNavigationTabTokens`, `TabRow.kt` | — |
| Breadcrumbs | NN/g: current page last, not a link; skip on sites 1–2 levels deep. GOV.UK: omit the current page | [NN/g](https://www.nngroup.com/articles/breadcrumbs/); [GOV.UK](https://design-system.service.gov.uk/components/breadcrumbs/) | **Yes**, on the current page |
| Mega menus | Open after 0.5s hover, appear within 0.1s, close 0.5s after leaving, diagonal paths | [NN/g mega menus](https://www.nngroup.com/articles/mega-menus-work-well/) | — |
| Sticky headers | As small as possible; content-to-header ~13:1 fine, 2:1 excessive; opaque; reappear on scroll-up over 300–400ms | [NN/g sticky headers](https://www.nngroup.com/articles/sticky-headers/) | — |
| TOC, back to top | TOC sticky in a side rail, current section marked, collapsed sticky TOCs on mobile missed; "Back to top" only on pages > 4 screens, lower right, text label | [NN/g TOC](https://www.nngroup.com/articles/table-of-contents/); [NN/g back to top](https://www.nngroup.com/articles/back-to-top/) | — |
| Attention | 57% of viewing time above the fold, 74% in the first two screens (2018; 80% above the fold in 2010) | [NN/g scrolling and attention](https://www.nngroup.com/articles/scrolling-and-attention/) | — |
| False floor | Let content peek above the fold; avoid full-width lines and big gaps at it | [NN/g illusion of completeness](https://www.nngroup.com/articles/illusion-of-completeness/) | — |
| Scroll mechanics | Avoid scroll-jacking; `scroll-margin-top` ≈ header height (Baseline since 2021); `content-visibility` 7× faster first render with `contain-intrinsic-size` | [NN/g scrolljacking](https://www.nngroup.com/articles/scrolljacking-101/); [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top); [web.dev](https://web.dev/articles/content-visibility) | — |
| Pricing | Explain tiers; comparison table with ✓/✕; label "Most popular"; isolate what differs; no low-contrast text for missing features | [NN/g B2B trust](https://www.nngroup.com/articles/b2b-trust-from-b2c/); [NN/g phone plans](https://www.nngroup.com/articles/phone-plan-ux/) | Hero and CTA numbers *(unverified; no primary source)* |
| FAQ | Several open at once; the whole header clickable, caret or plus | [NN/g accordions](https://www.nngroup.com/articles/accordions-on-desktop/) | — |
| Chips, switch | M3 chips 32dp, icon 18dp; switch track 52×32dp; Carbon tags 18 · 24 · 32, max 208px | Compose `FilterChipTokens`, `SwitchTokens`; Carbon `_tag.scss` | — |
| Switch or checkbox | Switch = immediate effect, else checkbox (NN/g); Apple macOS prefers a checkbox for a single setting | [NN/g toggles](https://www.nngroup.com/articles/toggle-switch-guidelines/); [Apple toggles](https://developer.apple.com/design/human-interface-guidelines/toggles) | **Yes**, for single settings on macOS |
| Avatars | Primer 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64, circles for people, squares for orgs and bots; Atlassian 16 · 24 · 32 · 40 · 96 · 128 with a default-image fallback | [Primer avatar](https://primer.style/components/avatar); `@atlaskit/avatar` | Fallback: initials vs image |
| State layers | M3 hover 0.08, focus 0.10, pressed 0.10, dragged 0.16; disabled content 0.38, container 0.12 | Compose `StateTokens.kt`, chip and switch tokens | — |
| Disabled | WCAG 1.4.3 and 1.4.11 exempt inactive components; Carbon separates disabled (temporary, say how to enable), read-only and hidden | [WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [Carbon disabled states](https://carbondesignsystem.com/patterns/disabled-states/) (from a search summary) | — |
| Search | 27-character minimum box (USWDS; Nielsen); ≤ 10 suggestions on desktop, 4–8 on mobile; a visible box, top right on homepages | [USWDS search](https://designsystem.digital.gov/components/search/); [Baymard](https://baymard.com/blog/autocomplete-design); [NN/g](https://www.nngroup.com/articles/search-visible-and-simple/) | — |
| Command palette | ⌘/Ctrl+K; prefixes `>` `#` `!` `@` `/` `?` | [GitHub command palette](https://docs.github.com/en/get-started/accessibility/github-command-palette) | Widths *(unverified)* |
| Dates | Typed for distant dates, calendar within ~1 year, no split dropdowns, any separator; GOV.UK 2/2/4-wide numeric fields, no auto-tab, `bday-*`, error order | [NN/g date input](https://www.nngroup.com/articles/date-input/); [GOV.UK date input](https://design-system.service.gov.uk/components/date-input/) | — |
| File upload | Limits stated up front; per-file status; ellipsis + tooltip on long names; heights 32/40/48; whole-uploader errors inline | [Carbon file uploader](https://carbondesignsystem.com/components/file-uploader/usage/) | — |
| Icons | Material Symbols optical size 20–48, grade matched to text (−25 for light on dark); SF Symbols scale against the cap height and match font weight | [Material Symbols](https://developers.google.com/fonts/docs/material_symbols); [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols) | — |

## 7. Order of work

Each step is its own `feat(...)` PR under 400 lines, fixtures first (red, then green), and re-measured
against the evals.

1. **H1 loader**, then re-run eval 4 to get a new cost baseline.
2. **H2 honest coverage and caps**, with `longpage-reveal.html` as the red fixture. **H10** in the same
   pass, since both touch reporting.
3. **H3 band mode**, then **H4** long-page rules on top of its fingerprints.
4. **H8 interaction states** and **H7 specimen workflow** together. The specimen is how H8 gets
   tested.
5. **H6 component specs**, one file per PR: overlays, then data, then inputs, then navigation.
6. **H5 page patterns**, then **H9 craft**. Settle the shadow conflict with impeccable first.
7. **H11** cross-route consistency.
8. **H12 evals**: add each eval with the item it grades, not at the end.

**Open decisions for the owner:**

| Decision | Options | Draft default |
|---|---|---|
| Resting card edges | border *and* large-blur shadow (shibroUI's table today) vs border *or* short shadow (impeccable) | Floating layers may combine; resting cards pick one (H9) |
| Scroll reveals | allowed per section with gating (SU-209) vs a generated-UI tell (impeccable) vs everything reveals (high-end-visual-design) | Allowed, gated, and never on every section |
| Pricing tiers | 3 max (impeccable) vs 3–4 | 3 preferred, 4 with an enterprise tier |
| Component numbers | one house spec vs per-design-system tables | One house spec, with the M3/Carbon/Polaris values in §6 as alternatives |
| Where component specs live | four `components-*.md` files vs one large file | Four files, each under 200 lines |
