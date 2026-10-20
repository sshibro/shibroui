# shibroUI checklist

Use it as the final self-check after building, and as the walk-through for reviews. Items marked
**[audit]** are measured by `scripts/audit.js`, **[map]** by `scripts/page-map.js` and **[png]** by `scripts/measure-png.py` on screenshots; the rest need your
eyes. For a whole screen, start with the Screen section and do it first. Skip component sections that don't
apply.

## Screen (do this first for any whole page)
- [ ] One-sentence job written; the first read answers it **[map: hierarchy.firstRead]** (SU-119)
- [ ] Only one style (or one group of identical peers) in the top tier **[map]** (SU-119)
- [ ] One filled primary action per region, at most 2 loud buttons in the first screen; primary in the page header or next to its object **[map]** (SU-120, SU-121)
- [ ] Focal point and primary action inside the first screen at 1280×900 **[map]** (SU-120)
- [ ] Known layout pattern; fixed sidebar width; content max-width; consistent page margins and gutters (SU-122, SU-123)
- [ ] No near-miss edges; all main-column content on one left edge **[map]** (SU-124)
- [ ] Spacing only from the scale; equal gaps between sibling sections; section gap > group gap > item gap **[map]** (SU-125)
- [ ] ≤ 6 font sizes, ≤ 3 weights, ≤ 2 families, no near-duplicate sizes **[map]** (SU-126)
- [ ] Neutrals + one accent + semantic; no near-duplicate grays; no rainbow surfaces **[map]** (SU-127)
- [ ] ≤ 3–4 radii, shadows only at elevation levels, one border style **[map]** (SU-128)
- [ ] One h1, no skipped levels, deeper headings not larger, every region titled **[map]** (SU-129)
- [ ] No card in card in card; boxes only where grouping needs them **[map]** (SU-130)
- [ ] Three tiers: one loud, a consistent strong style for section titles, the rest quiet **[map]** (SU-131)
- [ ] Rows share tops and heights **[map]** (SU-132)
- [ ] Even density, no dead zones next to cramped corners (SU-133)
- [ ] Layout collapses in priority order at 375px; page-map and audit run at 375 too (SU-135)
- [ ] Every state opened and audited: tabs, menus, accordions, dialogs, empty, error, loading **[audit: coverage.hiddenStates]** (SU-136)
- [ ] Coverage table in the report: every region and state, what was checked and fixed, and what wasn't checked

## Readability
- [ ] Heading sizes clearly step down to body; no body/supporting text larger than its heading (SU-1)
- [ ] Reading text ≥ 14px (16px for paragraphs), line-height ~1.4–1.6 **[audit]** (SU-5, SU-25)
- [ ] Prose ≤ ~75 characters per line (65ch ideal) **[audit]** (SU-15)
- [ ] Multi-line prose left-aligned, not centered or unhyphenated-justified **[audit]** (SU-7)
- [ ] Headings `text-wrap: balance`; paragraphs `pretty`; URLs wrap inside their box (SU-12–14)
- [ ] Mixed-size text on one line uses baseline alignment (SU-4)
- [ ] Big display text slightly tightened; small caps labels tracked out (SU-8)
- [ ] Identifiers/codes use distinguishable glyphs (SU-10)

## Data
- [ ] Changing or compared numbers use `tabular-nums` **[audit]** (SU-16)
- [ ] Table text columns left; numeric columns right; headers match their column **[audit]** (SU-17)
- [ ] Same precision and currency format in every row (SU-17)
- [ ] Data that explains itself isn't prefixed with redundant labels; units sit with values (SU-27)

## Links & wording
- [ ] No "click here / read more / learn more" link texts **[audit]** (SU-6)
- [ ] Inline content links underlined (not color-only) **[audit]** (SU-9)
- [ ] One name per concept across nav, headings, buttons, toasts (SU-111)
- [ ] One tone across copy (SU-112)

## Layout & hierarchy
- [ ] Card padding ~24px (≥16); related text gaps smaller than section gaps (SU-18)
- [ ] Label→field gap smaller than field→field gap (8 / 24px) (SU-22)
- [ ] Inputs sized to their expected value, not stretched (SU-19)
- [ ] Fixed-content columns fixed/bounded; main area flexes (SU-20)
- [ ] Body text doesn't shrink with the container; heading and body scale independently (SU-21)
- [ ] Exactly one thing leads each view; siblings muted rather than hero enlarged (SU-24–26)
- [ ] Heading element chosen for structure, size chosen for role (SU-28)
- [ ] One primary action; destructive actions not loud outside their confirmation (SU-29)
- [ ] Dividers quiet (1px subtle), or replaced by spacing/surface contrast (SU-23, SU-118)
- [ ] Repeated actions in the same place and the same style (SU-110, SU-113)

## Optical
- [ ] Icon-side button padding reduced (~4px less) (SU-30)
- [ ] Asymmetric icons (play) nudged to look centered (SU-31)
- [ ] Mixed icon shapes balanced by area; solid icons lightened next to text (SU-32, SU-33)
- [ ] All-caps labels slightly smaller / optically centered (SU-35, SU-36)
- [ ] Labels centered in pills/buttons/chips (±2px); selection highlights centered on their item **[audit]** **[png]** (SU-137)

## Color & contrast
- [ ] Text ≥ 4.5:1 (large ≥ 3:1), including placeholders and muted text **[audit]** (SU-45)
- [ ] Button labels ≥ 4.5:1 on their fill **[audit]** (SU-46)
- [ ] Fields visibly differ from their surface (own shade + border) **[audit]** (SU-44)
- [ ] Secondary text on colored surfaces uses a tint of that hue, not gray (SU-47)
- [ ] Status badges: dark text on pale tint, with text labels (SU-48)
- [ ] Text over photos sits on a scrim (~75%) **[audit: flags text over images]** (SU-49)
- [ ] Palette = neutral + primary + semantic families; no one-off hex values (SU-40, SU-41)
- [ ] Charts distinguish series by label/pattern, not color alone (SU-43)

## Forms
- [ ] Every checkbox/radio has an associated label; whole row clickable (~40px) **[audit]** (SU-50)
- [ ] Option labels `user-select: none` **[audit: info]** (SU-51)
- [ ] Main form action is a labeled, recognizable button (SU-52)
- [ ] Checkbox aligned to the first line of wrapped labels (SU-53)
- [ ] Long option lists (>~10) are searchable (SU-54)
- [ ] Short checkbox lists in one column (SU-55)
- [ ] Sliders show their current value (SU-56)
- [ ] Inputs and adjacent buttons share one height; rows of controls share one height **[audit]** (SU-58–60)

## Targets, focus, status
- [ ] Hit areas ≥ 44×44px (≥ 24 hard floor) **[audit]** (SU-61, SU-62, SU-65)
- [ ] ≥ 8px between neighbouring targets; no overlapping hit areas **[audit]** (SU-63, SU-69)
- [ ] The whole visible control is clickable (SU-64)
- [ ] Gesture zones and controls don't put the finger over the content they affect (SU-66, SU-67)
- [ ] Visible `:focus-visible` ring ≥ 2px with offset on every focusable element **[audit]** (SU-70)
- [ ] Status = color + icon + text **[audit: flags lone dots]** (SU-71)

## Motion
- [ ] Press feedback scale 0.95–0.98, ~200ms **[audit]** (SU-72)
- [ ] Open/close transitions reverse mid-flight (transitions/springs, not one-shot keyframes) **[audit: info]** (SU-75)
- [ ] Easing by role (out to enter and for state changes, in-out to move, short exits); no `linear` movement, no ease-in on hover/press **[audit]** (SU-82)
- [ ] Durations: micro ≤ 200ms, UI transitions ≤ 300ms, panels/sheets/dialogs ≤ 500ms **[audit]** (SU-85)
- [ ] Error shake small (≈ ±4px) and once **[audit]** (SU-86)
- [ ] Similar actions animate the same way (SU-88)
- [ ] Drags follow the pointer immediately, commit on release, keep capture off-track (SU-89–91)
- [ ] Selection state changes instantly (SU-92)
- [ ] `prefers-reduced-motion` fallback exists **[audit]** (SU-78)

## Surfaces & images
- [ ] Nested radius = outer − padding **[audit]** (SU-93–98)
- [ ] Elevation matches layer: base 0, dropdown 2, raised card 3, toast/modal 5 (SU-99–102)
- [ ] Modals: elevation + dimming scrim + focus management **[audit: open it first]** (SU-103)
- [ ] Images fixed aspect + `object-fit: cover`, never distorted **[audit]** (SU-106)
- [ ] Faint inner outline on images (~10% opacity) (SU-107)
- [ ] Icons near their intended size (SU-105)

## Product
- [ ] The task works before the chrome; layout judged before decoration (SU-108, SU-109)
- [ ] Empty states explain + offer one action; no useless filters (SU-117)
- [ ] Decoration (patterns, accents) quieter than content; notices are tinted surfaces, not side stripes (SU-115, SU-116)

## Semantics & keyboard (references/semantics.md)
- [ ] Exactly one `main`; skip link first when repeated navigation precedes it **[audit]** (SU-138)
- [ ] `<html lang>` set; specific `<title>` that changes per route **[audit]** (SU-139)
- [ ] Every control has an accessible name containing its visible label **[audit]** (SU-140)
- [ ] Images have `alt` (empty when decorative); `svg role=img` is named **[audit]** (SU-141)
- [ ] No positive `tabindex`, no focusables in `aria-hidden`, no dangling ARIA ids **[audit]** (SU-142)
- [ ] Tab order follows reading order (SU-143)
- [ ] Focus moves into dialogs, returns on close, survives deletes and route changes (SU-144)
- [ ] Sticky bars never cover the focused element (`scroll-padding`) **[audit]** (SU-145)
- [ ] Toasts and "Saved" messages live in `role=status`; `role=alert` only for errors **[audit]** (SU-146)
- [ ] Tabs, menus and disclosures follow the APG pattern (`aria-selected`, `aria-expanded`) **[audit]** (SU-147)
- [ ] "Not checked" names the real screen-reader pass if you didn't do one

## Validation & feedback (references/forms.md)
- [ ] Visible label above every field; hints outside the field; placeholders only as examples **[audit]** (SU-148)
- [ ] Optional (or required) fields marked as text **[audit]** (SU-149)
- [ ] Errors after blur or submit, never while typing; `:user-invalid`, not `:invalid`; submit stays enabled **[audit]** (SU-150)
- [ ] Inline error = icon + text next to the field, linked with `aria-describedby`, `aria-invalid` set **[audit]** (SU-151)
- [ ] Error summary on submit that takes focus; "Error: " in the title (SU-152)
- [ ] Right `type`/`inputmode`/`autocomplete`; paste allowed; OTP boxes accept paste **[audit]** (SU-153)
- [ ] Input kept after errors; no repeated questions; review or Undo for high-stakes submits (SU-154)

## States (references/states.md)
- [ ] State matrix per data region: ideal, empty, loading, partial, error, offline/permission (SU-155)
- [ ] Feedback matches the wait (none < 200ms, skeleton/spinner 1–10s, progress + Cancel beyond) (SU-156)
- [ ] Skeleton matches the final layout; shimmer off under reduced motion (SU-157)
- [ ] Busy buttons keep their width and label ("Saving…") (SU-158)
- [ ] Optimistic updates only for reversible actions, with visible rollback (SU-159)
- [ ] Errors say what and what next, offer Retry, keep data, stay in place **[audit]** (SU-160)
- [ ] Success confirmed in place; toasts ~5s, pausable, never errors; Undo over "Are you sure?" (SU-161)

## Theming (references/theming.md)
- [ ] Components use semantic tokens only; every surface has an `on-` color (SU-162)
- [ ] Ramps built in OKLCH; palette pairs checked with `contrast.mjs --palette` (SU-163)
- [ ] Dark base is dark gray, not `#000`; raised surfaces get lighter **[audit]** (SU-164)
- [ ] Audit re-run in the other scheme; every pair passes in both **[audit: coverage.schemes]** (SU-165)
- [ ] `color-scheme` set; System/Light/Dark choice; no flash of the wrong theme **[audit]** (SU-166)
- [ ] Logos, illustrations and charts have dark variants (SU-167)
- [ ] Borders and outlines (not shadows) draw controls and focus, so they survive forced colors **[audit]** (SU-168)
- [ ] Translucent surfaces readable against the worst backdrop; solid fallback **[audit: info]** (SU-169)

## Responsive & touch (references/responsive.md)
- [ ] No horizontal scroll at 320px; wide tables scroll in a focusable container **[audit at ≤ 400px]** (SU-170)
- [ ] Zoom never blocked; rem font sizes **[audit]** (SU-171)
- [ ] Nothing clips under WCAG text spacing **[audit: textSpacing]** (SU-172)
- [ ] Breakpoints by window class; components use container queries (SU-173)
- [ ] Nothing revealed only on hover **[audit]** (SU-174)
- [ ] Fields ≥ 16px on phones; drags have a tap alternative **[audit at ≤ 480px]** (SU-175)
- [ ] `100dvh`, safe-area insets, sticky bars ≤ 25% of the screen **[audit: info]** (SU-176)
- [ ] Bottom bar with 3–5 labeled destinations **[audit at ≤ 480px]** (SU-177)

## Content (references/content.md)
- [ ] Buttons are verb + object; no OK/Yes/Submit in dialogs **[audit]** (SU-178)
- [ ] Sentence case, key word first **[audit: info]** (SU-179)
- [ ] Errors say what happened and how to fix it **[audit]** (SU-180)
- [ ] Confirmations name the action, object and consequence **[audit]** (SU-181)
- [ ] One format for numbers, dates and units (SU-182)
- [ ] Plain language; instructions outside the field **[audit: info]** (SU-183)
- [ ] Real-looking sample content; no lorem or John Doe **[audit: info]** (SU-184)

## Charts (references/dataviz.md; construction → dataviz skill)
- [ ] One primary chart; the title states the takeaway (SU-185)
- [ ] Bars and areas start at zero; no dual axes (SU-186)
- [ ] Series ≥ 3:1 and told apart by more than color **[audit]** (SU-187)
- [ ] Chart text ≥ 12px and ≥ 4.5:1 **[audit]** (SU-188)
- [ ] Chart has a name stating the takeaway and a table view **[audit]** (SU-189)
- [ ] Chart states in the matrix; direct labels over legends (SU-190, SU-191)

## Performance (references/performance.md)
- [ ] Media has width/height or aspect-ratio **[audit]** (SU-192)
- [ ] `font-display` on every `@font-face`; ≤ 2 families **[audit]** (SU-193)
- [ ] Hero image not lazy; `fetchpriority=high` **[audit]** (SU-194)
- [ ] Long lists paginated or virtualized; `contain-intrinsic-size` with `content-visibility` **[audit]** (SU-195)
- [ ] Only transform/opacity animate **[audit]** (SU-196)

## International (references/international.md)
- [ ] Logical properties; `dir` set; RTL renders correctly **[audit on RTL pages]** (SU-197, SU-198)
- [ ] Labels grow with translations (no fixed-width buttons or tabs) (SU-199)
- [ ] Truncated text always revealable; actions and errors never truncated **[audit]** (SU-200)
- [ ] `lang` on mixed-language text; no letter-spacing on Arabic script **[audit]** (SU-201)
- [ ] `Intl` for numbers, dates and plurals; no sentence fragments (SU-202)

## Pixel alignment
- [ ] Control rows: equal gaps, symmetric flanks, selected pill inset equally **[audit]** **[png: gaps]** (SU-203)
- [ ] Mixed-size text in a row shares a baseline **[audit]** (SU-4)
