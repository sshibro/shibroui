# Theming, dark mode & contrast modes (SU-162 – SU-169)

A theme is a set of *roles* whose values change, not a second stylesheet. Build tokens in tiers, check
every text/surface pair in each scheme, and make sure controls survive forced colors. `contrast.mjs`
accepts `oklch()`/`oklab()` and checks a whole palette with `--palette`.

### SU-162 Three token tiers
**Rule:**
- **Primitive ramps:** `--blue-600`.
- **Semantic roles:** `--surface`, `--surface-raised`, `--text`, `--text-muted`, `--border`, `--accent`,
  `--on-accent`, `--success/-warning/-danger` with `-surface`/`-text`, and `--focus`.
- **Component tokens (optional):** `--button-bg`.

Components reference **only** semantic tokens, and a scheme switch remaps semantic to primitive.
Every background role has an `on-` partner (M3).
- ❌ `color: #6b7280` in a card component; a dark theme written as a second set of component rules.
- ✅ `.card { background: var(--surface-raised); color: var(--text) }`; `[data-theme=dark]` only
  redefines roles.
- **Why:** M3 (ref → sys → comp), Carbon (core → component) and Polaris all work this way. One edit at
  the role level re-themes everything.

### SU-163 Build ramps in OKLCH
**Rule:** build color ramps in OKLCH with fixed lightness per step (e.g. 50 → L 0.97 … 900 → L 0.25),
so the same step has similar contrast across hues. Re-tune chroma at the ends (SU-42). Out-of-gamut
values are gamut-mapped by the browser. `oklch()` is Baseline widely available.
- **Do:** derive states with relative colors, `oklch(from var(--accent) calc(l - 0.08) c h)`, or
  `color-mix(in oklch, …)`.
- **Measure:** `node scripts/contrast.mjs 'oklch(0.62 0.19 260)' '#fff'`, and
  `node scripts/contrast.mjs --palette tokens.json` for every declared pair in each scheme.

### SU-164 Dark surfaces are dark gray, and elevation gets lighter
**Rule:**
- **Base:** about `#121212`–`#1c1c1e` (OKLCH L ≈ 0.16–0.22). Never `#000` for app chrome; black is fine
  for media viewers.
- **Elevation:** each level is a lighter surface (+0.03–0.05 L), because shadows barely show on dark.
- **Text:** body text about 87–92% lightness, not pure white. Muted text still ≥ 4.5:1.
- ❌ A `#000` page with `#000` cards and a shadow nobody can see.
- ✅ A `#121214` page and `#1c1c20` cards with a 1px border.
- **Why:** M3 uses tonal surface containers instead of shadows; Apple's elevated backgrounds advance;
  Carbon g100 uses Gray 100, not black.
- **Measure:** `audit.js` SU-164: warn on a pure-black base, and on raised surfaces that aren't lighter
  than the base in dark.

### SU-165 Every pair passes in both schemes
**Rule:** every text, icon, border and focus pair meets its target in light **and** dark. Status badges
are re-tuned for dark: light text on a deep, low-chroma tint, not the light theme's pale tint. Accents
get lighter and less saturated in dark (L ≈ 0.70–0.80). Apple: aim for 7:1 on small text in custom
colors in dark.
- ❌ `#555` muted text on black (2.8:1); a `#dcfce7` badge glaring on a dark card.
- ✅ `#a1a1aa` on `#1c1c20` (6.6:1); `#6ee7a8` on `#0f2a1c` (10.0:1) with a check icon.
- **Measure:** `audit.js` reports `coverage.schemes`. When dark styles exist, re-run the audit in the
  other scheme (emulate `prefers-color-scheme`, or set the theme attribute) and fix both.

### SU-166 Scheme switching
**Rule:**
- Default to the system preference, and offer System / Light / Dark. Store only an explicit choice.
- Set `color-scheme` on `:root` (and `<meta name="color-scheme" content="light dark">`) so form
  controls and scrollbars match.
- Prevent the flash of the wrong theme with a small inline script in `<head>`.
- `light-dark()` handles simple token pairs.
- **Measure:** `audit.js` SU-166: warn when dark styles exist but `color-scheme` is `normal`.

### SU-167 Media in dark
**Rule:** logos and illustrations have dark variants (`<picture>` with
`media="(prefers-color-scheme: dark)"`, or `currentColor` SVG). No white-background images on dark
surfaces. Dim photos only if needed. Charts use their dark palette (dataviz skill).

### SU-168 Controls keep their edges in forced colors
**Rule:** draw boundaries and focus with `border` and `outline` (transparent is fine: forced colors turn
them into system colors), never with `box-shadow` or background alone. Icons use `currentColor`. Selected
and checked states need a non-color cue. Use `forced-color-adjust: none` only for color swatches.
- **Why:** forced colors (Windows contrast themes) remove shadows, background images and author colors.
  A button drawn with a shadow becomes floating text, and a shadow focus ring vanishes.
- **Do:** `.btn { border: 1px solid transparent } :focus-visible { outline: 2px solid var(--focus) }`.
- **Measure:** `audit.js` SU-168: warn when a `:focus` rule removes the outline and relies on
  `box-shadow`.

### SU-169 More contrast, less transparency
**Rule:** under `prefers-contrast: more`, raise borders to 3:1+ and muted text toward 7:1. Glass and
blur surfaces keep text ≥ 4.5:1 against the *worst* backdrop, and turn solid under
`prefers-reduced-transparency: reduce` (Chromium only for now) and in forced colors.
- **Measure:** `audit.js` SU-169 (info) lists translucent surfaces that hold text.
