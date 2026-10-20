# Surfaces, depth & images (SU-93 – SU-107)

## Nested corners

### SU-93 – SU-98 Card + image · input + button · dropdown + header · nav + highlight · alert + badge · tabs + selection
**Rule:** inner radius = max(0, outer radius − padding).
- ❌ The inner element reuses the outer `20px` radius inside `8px` of padding, so the gap pinches at the
  corners.
- ✅ `20 − 8 = 12px`.

| Outer radius | Padding | Inner radius |
|---|---|---|
| 20px | 4px | 16px |
| 20px | 8px | 12px |
| 28px | 8px | 20px |
| 20px | 12px | 8px |
| 20px | ≥ 20px | 0 (square) |

- **Why:** concentric curves keep the space around the corner even.
- **Do:** compute it: `--inner-r: max(0px, calc(var(--outer-r) - var(--pad)))`. For pills (`9999px`)
  the inner element is a pill too. For an active highlight inset inside a nav panel, use `max(0, panel
  radius − inset)`.

## Layering & elevation

**Rule:** shadow strength tells you which layer is on top. Use a consistent light direction, and pair a
soft, broad shadow with a tight edge shadow.

| Level | Use | Starter shadow (light theme) |
|---|---|---|
| 0 | Resting cards, base surface | `none` (border or tint only) |
| 1 | Subtle lift (hovered card) | `0 1px 2px rgb(0 0 0 / .06)` |
| 2 | Dropdowns, popovers, menus | `0 1px 2px rgb(0 0 0 / .06), 0 4px 12px rgb(0 0 0 / .08)` |
| 3 | Raised cards, sticky bars | `0 1px 3px rgb(0 0 0 / .08), 0 8px 24px rgb(0 0 0 / .10)` |
| 4 | Drawers, sheets | `0 2px 4px rgb(0 0 0 / .08), 0 16px 32px rgb(0 0 0 / .14)` |
| 5 | Toasts, notifications, modals | `0 2px 6px rgb(0 0 0 / .10), 0 24px 48px rgb(0 0 0 / .18)` |

On dark themes, shadows read weakly, so pair elevation with a slightly lighter surface for each level. See SU-164.

Resting and raised cards use a border **or** a short shadow, not a hairline plus a large blur; floating
layers (menus, popovers, dialogs, toasts) may combine both. Shadow craft (layers, tint, alpha) is SU-253.

**Stacking order** follows the same levels: base `0` · sticky `100` · dropdown `200` · scrim `300` · modal `400` ·
toast `500` · tooltip `600`. Keep these as tokens and never reach for `9999`. Overlays in the top layer
(`<dialog>` with `showModal()`, `popover`) need no `z-index` at all.

### SU-99 Base surface
- ❌ Resting cards at level 4: heavy shadows make everything compete.
- ✅ Level 0, a flat quiet grid that leaves higher layers free to stand out.

### SU-100 Dropdown layer
- ❌ A level 0 menu that looks like part of the page.
- ✅ Level 2.
- A menu inside a card with `overflow: hidden` gets clipped. Open it in the top layer (`popover`) and place it
  with anchor positioning (`position-anchor`, `position-try-fallbacks: flip-block`) so it flips near
  edges.

### SU-101 Raised card
- ❌ Level 0 even though the card belongs above its surroundings.
- ✅ Level 3: a soft broad shadow plus a tighter edge shadow.

### SU-102 Floating notification
- ❌ Level 1, so it looks like an ordinary card.
- ✅ Level 5, above all content.

### SU-103 Modal depth
- ❌ Level 1 with no backdrop: the page competes with the dialog.
- ✅ Level 5 plus a viewport-wide scrim dimming the page (e.g. `rgb(0 0 0 / .5)`), with the dialog undimmed on top.
- **Also required (behavior, not depth):** move focus into the dialog, trap it, make the background
  inert, close on Escape, restore focus to the trigger, and give the dialog an accessible title. The
  native `<dialog>` with `showModal()` and `::backdrop` gives most of this.

## Image quality & framing

### SU-104 Photo quality
- ❌ A blurry, washed-out photo.
- ✅ A sharp, well-exposed, relevant photo with a considered crop.
- Framing can't rescue a poor source. Reserve the aspect ratio before load (no layout shift) and serve
  sizes via `srcset`.

### SU-105 Intended size
- ❌ A small icon blown up huge, so it looks chunky and dominates the message.
- ✅ The icon near its drawn size inside a larger frame or badge.
- Crop detailed screenshots or simplify them for small slots instead of shrinking them until unreadable.

### SU-106 Consistent frames (user images)
- ❌ Stretched photos at uneven heights (`100px` vs `125px`).
- ✅ Fixed frames (`140px`, same aspect ratio) with `object-fit: cover`.
- Uploads are unpredictable, and fixed frames protect the layout. Never let `object-fit: fill` distort them.

### SU-107 Image outline
**Rule:** a faint inner outline gives every image a consistent edge.

| Outline opacity | Verdict |
|---|---|
| 0 | ❌ the edge blends into the background |
| .08 | good |
| **.10** | ✅ ideal |
| .12 | acceptable |
| .16 | borderline, too heavy |
| .20 | ❌ draws attention from the photo |

```css
img.framed { outline: 1px solid rgb(0 0 0 / .10); outline-offset: -1px; } /* follows border-radius, takes no space */
@media (prefers-color-scheme: dark) { img.framed { outline-color: rgb(255 255 255 / .10); } }
```
