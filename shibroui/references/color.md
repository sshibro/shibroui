# Color & contrast (SU-40 – SU-49)

Check any pair with `node scripts/contrast.mjs <fg> <bg>`. Add `--fix` to get the nearest passing
shade of the same hue.

## Color systems

### SU-40 Palette roles
**Rule:** build neutral, primary and semantic families, not isolated swatches.
- ❌ The primary color floods the card, so the action and the "saved" status blend into the background.
- ✅ Neutral surfaces, primary color only on the action, green only for success.
- **Why:** a UI needs text, surfaces, borders, focus and status colors. A handful of unrelated swatches
  can't cover those roles.
- **Do:** define role tokens (`--surface`, `--text`, `--text-muted`, `--border`, `--accent`,
  `--success`, `--warning`, `--danger`) that point at shade steps.

### SU-41 Shade scale
**Rule:** choose a base, a lightest and a darkest shade, then fill the steps (e.g. 50/100…900).
- ❌ Text and background picked from neighbouring steps, so the text disappears.
- ✅ Light steps (50–200) for surfaces, dark steps (700–900) for text on them.
- **Why:** predefined shades stop one-off hex values piling up. Check every step inside real
  components, not just as swatches.

### SU-42 Rich tints
**Rule:** re-tune saturation (and maybe a small hue shift) at the light and dark ends.
- ❌ A pale purple made only by raising lightness looks gray.
- ✅ Raise saturation (chroma) in the tint so it stays clearly purple.
- **Why:** the same HSL saturation looks duller near white and black. Small hue shifts are fine (e.g. warmer
  yellows as they darken); big ones change the family. Working in OKLCH makes this predictable.

### SU-43 Visual distinction (charts)
**Rule:** distinguish chart series with direct labels and stroke patterns, not color alone.
- ❌ Two similar blue lines that only a color legend separates.
- ✅ A solid line and a dashed line, each with a direct label at its end (Online / Retail).
- **Why:** color-only coding fails for color-blind users, in grayscale, and where lines cross.
- **Do:** also provide an accessible summary (a table or text) and test crossings in grayscale.

## Color contrast

### SU-44 Input contrast
**Rule:** the field surface must differ visibly from the surface it sits on.
- ❌ Field background `1.00:1` and border `1.03:1` against the card: it's invisible until clicked.
- ✅ Field background `≥ 1.1:1` and a clearer border (the demo: `1.14:1` background, `1.08:1` border).
- **Why:** people need to find where to type before interacting.
- **Do:** give the field its own shade *and* a border. For a stronger guarantee, aim for a 3:1 boundary
  (WCAG non-text contrast).

### SU-45 Text contrast
**Rule:** normal text ≥ `4.5:1`, aiming for `7:1`. Large text (≥24px, or ≥18.66px bold) ≥ `3:1`.
- ❌ `2.52:1`, below AA.
- ✅ `8.06:1` (AAA).
- **Common trap:** muted gray on white. `#9CA3AF` on `#FFF` is 2.54:1 and fails, while `#6B7280` is
  4.83:1 and passes. Placeholder text counts too.

### SU-46 Button contrast
**Rule:** the label must reach ≥ `4.5:1` against the button fill.
- ❌ A pale label on `#FFD000` yellow: `1.07:1` in the demo. Even pure white only reaches `1.47:1`.
- ✅ A dark label: `9.12:1` in the demo (`#1A1A1A` on `#FFD000` is `11.83:1`).
- **Why:** if you can't read the label, you don't know what the button does. Bright fills (yellow,
  lime, cyan, light orange) need dark text.

### SU-47 Text on color
**Rule:** secondary text on a colored surface uses an opaque, lighter tint of that surface's hue.
- ❌ Gray `#B6B6B6` on the colored card: it passes (6.85:1 in the demo) but looks dull and muddy.
- ✅ A tint of the card's own hue (`#C2C2FA` in the demo, 8.20:1).
- **Why:** a related tint lowers emphasis while keeping the colors in harmony. A solid color avoids
  textures showing through, unlike `opacity`.
- **Do:** derive it, e.g. `color-mix(in oklch, var(--card) 25%, white)`, then check the ratio.

### SU-48 Readable color (status badges)
**Rule:** when a solid fill is too loud or fails contrast, flip it: dark text on a pale tint of the
same hue.
- ❌ White text on bright green/amber/red badges at `2.13` / `1.49` / `3.14:1`. All fail.
- ✅ Dark semantic text on a pale same-hue background at `8.4–8.9:1`. All AAA.
- **Why:** darkening the fill would fix contrast but make every badge shout. Flipped contrast keeps
  the status readable while the table data stays primary.
- **Do:** e.g. green `#14532D` on `#DCFCE7` (8.30:1), amber `#78350F` on `#FEF3C7` (8.15:1), red `#7F1D1D` on
  `#FEE2E2` (8.20:1). Always keep the text label (SU-71).

### SU-49 Text over images
**Rule:** control the image behind the text, not just the text color.

| Overlay (dark scrim) | Verdict |
|---|---|
| 0% | ❌ white words lost in the photo |
| 65% | good |
| **75%** | ✅ ideal: readable, photo still visible |
| 80% | darker than needed, hides more of the photo |
| 95% | ❌ the photo is basically gone |

- **Why:** photos have unpredictable light and dark regions, and a scrim makes contrast predictable.
- **Do:** a scrim layer (`linear-gradient(rgb(0 0 0 / .75), rgb(0 0 0 / .55))` or a gradient focused where the
  text sits). Test the brightest spot under the text at every responsive crop.
