# Targets, focus & status (SU-61 – SU-71)

## Touch & pointer targets

Shared rule: **aim for a 44 × 44px hit area or larger, and leave space between small controls.** The
visible control can stay small; only the clickable area grows.

```css
/* Grow the hit area without growing the icon */
.icon-btn { position: relative; inline-size: 24px; block-size: 24px; }
.icon-btn::before { content: ""; position: absolute; inset: -10px; } /* 24 + 2×10 = 44px */
```

### SU-61 Icon targets
- ❌ A `24×24` hit area, the same as the icon.
- ✅ `44px` minimum · `48px` comfortable · `52–56px` roomy. The icons stay `24px`.

### SU-62 Button targets
- ❌ The hit area equals the visible `104×40` button, so presses just past the edge miss.
- ✅ The hit area extends to ≥ `44px` tall (48 comfortable) while the button looks unchanged.

### SU-63 Target spacing
- ❌ `48px` buttons touching with a `0px` gap.
- ✅ ≥ `8px` minimum · `12px` comfortable · `16px` roomy · `20px` spacious (it needs a wider row).

### SU-64 Target coverage
- ❌ Only part of the button responds (e.g. only the label text is the link).
- ⚠️ The whole button works but nothing beyond its edge (the limit).
- ✅ The whole button plus an extra margin catching near-misses.
- **Do:** put the click handler or link on the full visible control, never on an inner `<span>`.

### SU-65 Close buttons
- ❌ A `16×16` hit area tucked `22px` from the corner.
- ✅ A `44×44` hit area (icon still `16px`) about `8px` from the edge.

### SU-66 Room to swipe
- ❌ The swipe zone sits on the card names, so your finger hides them.
- ✅ A `44px` swipe strip below the cards, so the names stay visible.

### SU-67 Touch visibility
- ❌ Color choices above the preview: your hand covers the result.
- ✅ Choices below the preview, result in view.
- **Why:** fingers arrive from below, so put controls under what they change.

### SU-68 Edge navigation
- ❌ A small `24px` arrow is the only way to change the image.
- ✅ Full-height edge zones `48px` wide (arrow still `16px`).

### SU-69 Room to click
- ❌ Cancel and Request look separate, but their padded hit areas overlap by `2px`.
- ✅ A `12px` gap between the hit areas.
- **Do:** inspect the full interactive bounds, including invisible padding and `::before` extensions. Each
  point should belong to exactly one action.

## Keyboard focus

### SU-70 Focus visibility
**Rule:** a focus ring at least `2px` wide with a visible offset.
- ❌ `outline: none` with no replacement: Tab gives no clue what Enter will activate.
- ✅ A `2px` ring with a `2px` gap.

```css
:focus-visible { outline: 2px solid var(--focus, #2563eb); outline-offset: 2px; }
/* If you remove the default, replace it in the same breath: */
button:focus { outline: none; } button:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
```
- The ring color needs ≥ 3:1 against the surface. Check that inputs inside wrappers show the ring
  (`:focus-within` on the wrapper is fine).

## Status communication

### SU-71 Status signals
**Rule:** status = color + icon + label.
- ❌ A colored dot alone ("is green connected or idle?").
- ✅ An icon and the word ("✓ Connected"), color as reinforcement.
- **Why:** color alone fails color-blind users and screen readers. Give the dot an accessible name if
  it must stay, but prefer visible text.
