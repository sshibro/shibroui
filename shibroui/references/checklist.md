# shibroUI checklist

Use it as the final self-check after building, and as the walk-through for reviews. Items marked
**[audit]** are measured by `scripts/audit.js` and **[map]** by `scripts/page-map.js`; the rest need your
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
- [ ] Easing by role (out to enter, in to exit, in-out to move); no `linear` movement **[audit]** (SU-82)
- [ ] Durations: micro ≤ 200ms, panels ≤ 350ms, nothing routine > 500ms **[audit]** (SU-85)
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
- [ ] Decoration (patterns, accents) quieter than content (SU-115, SU-116)
