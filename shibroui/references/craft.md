# Visual craft (SU-253 – SU-264)

Budgets and contrast keep a screen from being bad. These rules say what a premium one looks like: layered
and tinted shadows, alpha hairlines, gradient color space, one icon system, display type, crisp product
imagery and the small finishes. They are taste with numbers, so audit findings stay at warn or info, and
the project's brand wins (SU-112). Generated-UI tells are impeccable's; this file gives the measurable
craft numbers.

- [Surfaces and gradients](#surfaces-and-gradients) SU-253–255
- [Icons, color and type](#icons-color-and-type) SU-256–258
- [Imagery and effects](#imagery-and-effects) SU-259–261
- [Medium, finishes and review](#medium-finishes-and-review) SU-262–264

## Surfaces and gradients

### SU-253 Shadows are layered and tinted
**Rule:** each elevation is 2–3 layers: contact, key and ambient (the elevation table in
surfaces-images.md). On a colored or tinted background the shadow takes that hue at low chroma instead of
pure black. Levels above 1 have ≥ 2 layers; no single shadow has alpha above ~0.25 or blur above ~64px.
- ❌ `box-shadow: 0 20px 40px rgb(0 0 0 / .4)` on a blue-tinted surface.
- ✅ `0 1px 2px oklch(0.25 0.03 260 / .08), 0 8px 24px oklch(0.25 0.03 260 / .12)`.
- **Relation to the elevation table:** the table sets the levels (surfaces-images.md SU-99–103); this rule
  sets how a level is built. Conflict with impeccable, which bans a 1px border combined with a shadow
  blurred 16px or more, resolved like this:
  - **Floating layers** (menus, popovers, dialogs, toasts; levels 2, 4 and 5) may combine a hairline
    border with a large-blur shadow.
  - **Resting and raised cards** use a border *or* a short shadow (blur ≤ 8px), not both. Large-blur
    level-3 layers belong to sticky bars and anything that floats. SU-164 dark cards keep their 1px
    border and no large shadow.
- **Measure:** page-map `system.shadows`: warn on single-layer shadows above level 1 and on `rgb(0 0 0 /
  > .25)`; info on pure-black shadows over surfaces with chroma > 0.04.

### SU-254 Edges are hairlines with alpha
**Rule:** borders and dividers are 1px in a translucent ink, so one token works on every surface.
- **Light:** `rgb(0 0 0 / .08–.12)`. **Dark:** `rgb(255 255 255 / .08–.12)`. Alpha stays within 0.06–0.14.
- **Dark raised surfaces:** a 1px top highlight, `inset 0 1px 0 rgb(255 255 255 / .04–.08)`, instead of a
  heavier shadow.
- ❌ `border: 1px solid #e5e7eb` on a card, a tinted panel and a gray sidebar: a different edge on each.
- ✅ `--border: rgb(0 0 0 / .1)` on all three.
- **Measure:** page-map `borderColors`: info when opaque gray borders sit on 3+ different surface colors.

### SU-255 Gradients interpolate in OKLCH and stay in one family
**Rule:** `linear-gradient(in oklch, …)` with 2–3 stops of neighbouring hues. Distant hues mixed in sRGB
pass through a muddy gray middle.
- **Banding:** on large dark gradients, add a stop or lighten the dark end first. Dither only if banding
  remains, at ≤ 2% noise, invisible as texture. Grain as decoration is not allowed (impeccable bans it;
  high-end-visual-design wants 3%).
- **No gradient text** (impeccable bans it as a generated-UI tell). If a brand requires it: display sizes
  only, with contrast measured at the weakest stop.
- ❌ `linear-gradient(90deg, #ff0080, #00c2ff)` in sRGB: the middle is a dull gray-purple.
- ✅ `linear-gradient(in oklch, oklch(0.7 0.18 250), oklch(0.75 0.16 300))`.
- **Measure:** `audit.js` SU-255: for gradients without `in oklch`/`in oklab`, compute the sRGB midpoint of
  each stop pair and warn when its OKLCH chroma is under 60% of the stops' mean (≤ 3 stops); the contrast
  check already samples gradient stops.

## Icons, color and type

### SU-256 One icon family, one stroke, sized to the text
**Rule:** one set in one style (outline or filled; filled is reserved for the selected state in nav) with
one stroke width (1.5px at 20px, scaled with size and matched to the text weight beside it).
- **Size:** inline icons are 1–1.25× the font size (16px icon with 14px text, 20px with 16px), centered on
  the text's cap height, not its line box (SF Symbols scale against the cap height).
- **Icon fonts:** match the icon's weight and grade to the text. Drop the grade (about −25) for light icons
  on dark (Material Symbols).
- ❌ Outline icons at 1.5px next to filled ones, and 14, 16, 18, 22 and 28px sizes on one screen.
- ✅ ≤ 3 icon sizes, one stroke width per size.
- **Measure:** page-map adds icons to `system.icons` (inline `svg` of 10–48px: rendered size, stroke width
  scaled by the viewBox, fill vs stroke): warn on > 3 sizes and on mixed stroke widths at one size; info on
  filled and outline icons mixed in one nav, list, toolbar or tab bar (filled only on the selected item is
  fine). Icon-font glyphs aren't measured.

### SU-257 Neutrals carry a trace of the brand
**Rule:** gray ramps take the accent's hue at chroma ~0.005–0.02 (OKLCH), so the page reads as one palette
instead of an accent on dead gray. The accent covers about 10% of the area or less.
- ❌ `#6b7280` grays (chroma 0) beside a saturated indigo accent.
- ✅ `oklch(0.55 0.012 265)` for muted text, `oklch(0.97 0.006 265)` for the page.
- **Measure:** `contrast.mjs --palette`: info listing neutrals at chroma 0 next to a chromatic accent.

### SU-258 Display type is set, not scaled
**Rule:** display sizes (48–96px desktop, clamped to 32–44px on phones) get tracking −0.02 to −0.04em,
line-height 1.0–1.1, a measure of about 10–20ch and `text-wrap: balance`. Use the font's optical size
(`font-optical-sizing: auto`, or the display cut). Light text on dark gets +0.05–0.1 line-height
(impeccable `reference/brand.md`). Display sizes are their own tier and count as one entry each in the
SU-126 budget.
- ❌ 72px at `letter-spacing: normal` and `line-height: 1.4`: loose and ragged.
- ✅ `font-size: clamp(2.25rem, 6vw, 4.5rem); letter-spacing: -0.03em; line-height: 1.05; text-wrap:
  balance`.
- **Measure:** `audit.js` SU-258: warn on text ≥ 48px with `letter-spacing: normal` and line-height > 1.2
  (extends SU-8 and SU-5); tracking ≤ −0.02em and leading ≤ 1.15 at ≥ 48px.

## Imagery and effects

### SU-259 Product imagery is crisp and framed one way
**Rule:** marketing screenshots are rendered at 2× device pixel ratio (`naturalWidth ≥ 2 × rendered
width`) and cropped to the part that matters, not a full window at 40% scale with unreadable text
(SU-105). They share one frame: the surface radius, a 1px alpha border (SU-107) and one elevation level.
One image style per page (photo, illustration or 3D) and one color grade.
- ❌ A 900px-wide PNG shown at 900px on a 2× display, and rounded, square and shadowed frames in one band.
- ✅ A 1800px source in a 900px slot, 16px radius, 1px `rgb(0 0 0 / .1)` outline on all.
- **Measure:** `audit.js` SU-259: warn on `img` whose `naturalWidth` < 1.5× its rendered width at
  DPR ≥ 2 (blurry); page-map: info on mixed image radii in one band.

### SU-260 Logos are balanced by area, not width
**Rule:** logo walls show 5–8 marks in one ink (monochrome, ~60–70% of text contrast), each scaled so its
*area* matches (wide wordmarks shorter, square marks taller), on one baseline row. Areas stay within ±15%.
- ❌ A 160×24 wordmark beside a 48×48 mark at the same width: the square mark looks twice as heavy.
- ✅ Wordmarks 20–24px tall, square marks 36–40px tall, same gray.
- **Measure:** `audit.js` SU-260: info on logo rows (≥ 4 sibling images/SVGs in a row in one band) whose
  rendered areas differ by more than 40%.

### SU-261 Depth effects are rare and earned
**Rule:** at most one glow or spotlight per screen (≤ 1 per band), behind the focal element. Glass panels:
12–24px blur, a 60–80% opaque fill and a 1px border, with text ≥ 4.5:1 against the worst backdrop
(SU-169). Decorative texture stays ≤ 5% opacity (SU-116).
- ❌ Three blurred radial blobs, a glass card at 30% opacity over a busy photo.
- ✅ One soft glow behind the hero product shot; cards at 70% with `backdrop-filter: blur(16px)`.
- **Measure:** page-map: info on more than one large blurred radial gradient or `filter: blur()`
  decoration per band.

## Medium, finishes and review

### SU-262 Whitespace scales with the medium
**Rule:** marketing and editorial pages run larger than apps: body 17–20px at line-height 1.55–1.7,
section padding 96–160px desktop (64–96px phone), one idea per band. App screens stay at SU-125's app tier.
- ❌ A landing page with 32px section gaps and 14px body text.
- ✅ 120px section padding, 18px body at 1.6.
- **Measure:** page-map: info when a page with marketing bands (hero + display type) uses the app tier for
  section gaps.

### SU-263 The small finishes are on
**Rule:** these one-liners are set:
- `scrollbar-gutter: stable` on scrolling app layouts (no shift when a dialog locks scroll).
- `overscroll-behavior: contain` on dialogs, drawers and inner scroll panels.
- `::selection` in an accent tint that keeps text ≥ 4.5:1.
- `accent-color` and `caret-color` set to the accent.
- `-webkit-tap-highlight-color: transparent` only when a pressed state replaces it.
- `touch-action: manipulation` on controls.
- **Measure:** `audit.js` SU-263: info list of which finishes are missing (one line, not per element).

### SU-264 Squint and compare
**Rule:** before handing off, compare the screen with a reference of the same kind that the team admires
(or the product's best existing screen) at the same width, band by band: spacing density, type contrast,
image quality, how much is on screen. Say what is still behind.
- **Do:** one line in the report naming the reference and the remaining gap.
- **Measure:** manual: workflow line in the report.
