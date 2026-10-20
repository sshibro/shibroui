# Layout & hierarchy (SU-18 – SU-39, SU-137, SU-203)

- [Spacing & sizing](#spacing--sizing) SU-18–23
- [Visual hierarchy](#visual-hierarchy) SU-24–29
- [Optical balance](#optical-balance) SU-30–39, SU-137, SU-203

## Spacing & sizing

### SU-18 Breathing room
**Rule:** start spacious, then tighten until related content feels connected.
Graded on a compact card:

| Padding / section gap / text gap | Verdict |
|---|---|
| 8 / 8 / 4px | ❌ forbidden: cramped, hard to scan |
| 16 / 16 / 8px | acceptable |
| **24 / 24 / 12px** | ✅ ideal |
| 32 / 32 / 16px | avoid: near the limit for a compact card |
| 40 / 40 / 20px | ❌ forbidden: related parts drift apart |

- **Why:** starting from minimal gaps produces cramped UI. Starting generous and reducing finds the
  right density.
- **Do:** change padding and gaps together through spacing tokens. Dense tools (tables, IDEs) can
  stay dense where density helps the task.

### SU-19 Input width
**Rule:** size each field for the value people type, not the space available.

| Email input width | Verdict |
|---|---|
| 240px | ❌ too narrow for an address |
| 340px | acceptable |
| **380px** | ✅ ideal |
| 680px | ❌ much wider than the value |

- **Do:** `width:100%; max-width:380px` for email so it can shrink on mobile. Size other fields for their
  own values (postcode ~8ch, phone ~16ch, CVC ~5ch). Don't apply one width to every field.

### SU-20 Content-sized columns
**Rule:** size fixed-content columns by what they hold, then let the main area flex.
- ❌ A percentage sidebar (~311px at this width) squeezes the main list.
- ✅ A fixed `168px` sidebar, with the list taking the rest.
- **Why:** percentage columns change size even when their content doesn't.
- **Do:** `grid-template-columns: 168px 1fr` (or `minmax(160px, 220px) 1fr`). Stack before the main
  content stops fitting.

### SU-21 Scale by role
**Rule:** heading, body and padding scale independently, never as one zoomed unit.
- ❌ The card scales everything proportionally: heading `23px`, body `10px` (unreadable).
- ✅ Heading `28px`, body stays `16px`.
- **Why:** big text can shrink a lot, but small body text can't shrink at all.
- **Do:** `h2{font-size:clamp(1.375rem,1rem+1.5vw,1.75rem)} p{font-size:1rem}`. Choose padding per
  breakpoint separately. Never `transform: scale()` a whole component to make it fit.

### SU-22 Clear groups (proximity)
**Rule:** related items sit closer together than separate groups.

| Label gap / between fields | Verdict |
|---|---|
| 16 / 16px | ❌ forbidden: labels float between fields |
| 8 / 20px | acceptable |
| **8 / 24px** | ✅ ideal |
| 10 / 32px | avoid: close to the limit |
| 20 / 48px | ❌ forbidden: the form scatters |

- **Why:** proximity shows relationships before anyone reads. A bigger gap between groups removes
  ambiguity without extra borders.
- **Do:** keep real `<label for>` associations. The gaps only change appearance.

### SU-23 Section separators
**Rule:** use a quiet divider when adjacent sections need a visible boundary.
- ❌ No divider: the sections run together. ⚠️ A dark `2px` divider: it works but outshouts the content.
- ✅ `border-top: 1px solid var(--border-subtle)`.
- **Why:** the separator should mark the boundary, not become the loudest element in the card.

## Visual hierarchy

### SU-24 Importance
**Rule:** important information gets more emphasis than supporting details.
- ❌ Label, main number and supporting text are all `20px / 600 / #E4E4E7`, so nothing leads.
- ✅ Number `36px / 700`. Label `400` muted (`#A1A1AA`). Supporting text `14px` muted.
- **Why:** people scan before reading. Clear primary, secondary and tertiary levels tell their eyes where
  to start.

### SU-25 Beyond size
**Rule:** keep a restrained size range and show importance with weight and color.
- ❌ Title `42px` over body `12px` and supporting text `11px`: a giant title and unreadable details.
- ✅ Title `20px / 600`, body `16px`, supporting text `16px` in a muted color.
- **Why:** extreme size jumps hurt readability. Weight and tone create hierarchy within a compact range.
- **Do:** keep reading text ≥ 14px (16px for paragraphs). Step down with color before size.

### SU-26 Action focus (de-emphasize)
**Rule:** quiet the competing elements before making the main one louder.
- ❌ Active and inactive nav items are the same color, so the current page is hard to find.
- ✅ The active item stays strong (weight 650, full ink). Inactive items are muted (`#949497` on dark).
- **Why:** lowering the contrast of siblings lets the current item lead without a bigger font or a bright
  pill. Keep inactive items readable (≥ 4.5:1).

### SU-27 Labels & data
**Rule:** let self-explanatory data stand alone, and keep labels that are needed.
- ❌ "Name:", "Email:", "Address:" in front of values that already identify themselves.
- ✅ Just the values.
- **Keep labels for:** technical specs, numbers without context, and anything people scan *for* by
  field name. Form controls always need accessible names. Put units with values ("12 GB", not
  "Storage (GB): 12").

### SU-28 Heading roles
**Rule:** the element sets structure and the class sets size.
- ❌ A settings section `<h2>` at `40px` pulls attention from the settings.
- ✅ The same `<h2>` at `18px / 600`.
- **Why:** heading level is for assistive tech and document outline, and doesn't require a huge font.
- **Do:** keep heading order (h1 → h2 → h3) and style by role (`.section-title`).

### SU-29 Action priority
**Rule:** style actions by importance in this context, not by their meaning.
- ❌ Publish, Save draft and Delete all equally loud.
- ✅ Publish primary (filled), Save draft secondary (outline/neutral), Delete tertiary (text, possibly red).
- **Why:** a destructive action that's secondary on this screen shouldn't dominate it. In the
  confirmation dialog, Delete *is* the primary decision and gets the strong danger style.
- **Do:** one primary per view, and confirm destructive actions.

## Optical balance

Shared rule: **start geometrically, then correct what looks off.** Numbers are from the demos.

### SU-30 Button padding with an icon
- ❌ `18px` / `18px` with a leading icon: the content looks shifted right.
- ✅ `14px` on the icon side, `18px` on the text side.
- **Why:** icons carry empty space inside their bounding box.

### SU-31 Icon balance (play triangle)
- ❌ A geometrically centered triangle looks left-heavy.
- ✅ Nudged `~1.5px` toward the point on a 24px icon (`translateX(6%)`).
- **Why:** the triangle's visual mass sits toward its wide side.

### SU-32 Icon area
- ❌ A square and a circle both `48px`: the square looks bigger.
- ✅ Square `43px`, circle `48px` (~10% smaller).
- **Why:** perceived size follows filled area.

### SU-33 Color weight
- ❌ Solid icons and text both at 100% ink: the icons look heavier than the words.
- ✅ Icons at ~82% strength, text at 100%.
- **Why:** solid shapes carry more ink than thin strokes. Lighten them so labels lead.

### SU-34 Glyph overshoot
- ❌ Round shapes exactly the height of flat ones look short.
- ✅ Round shapes overshoot ~1px top and bottom (at ~40px).
- **Why:** curves touch the line at a single point. Apply this to custom-drawn marks, numerals and
  logos.

### SU-35 Case scale
- ❌ `DESIGN` and `Design` both `44px`: the caps look bigger.
- ✅ Caps `40px` vs mixed case `44px` (~90%).
- **Why:** every capital fills the full cap height.

### SU-36 Button label vertical centering
- ❌ Geometric centering: an ALL-CAPS label looks high, a label with descenders looks low.
- ✅ Caps label `1px` down, descender-heavy label `1px` up (at ~14px).
- **Why:** the line box includes empty ascender and descender space.
- **Do:** where supported, use `text-box: trim-both cap alphabetic` and then center. Otherwise use
  small padding nudges.

### SU-37 Letter alignment (overhang)
- ❌ A round "G" and a pointed "T" exactly on the margin look indented.
- ✅ Both overhang the edge by `~2px` at display sizes.
- **Why:** curved and diagonal edges touch the margin at only one point.

### SU-38 Hanging marks
- ❌ An opening quote inside the text block pushes the first word inward.
- ✅ The quote hangs fully outside, so the words align on every line.
- **Do:** `hanging-punctuation: first` (Safari) or a negative `text-indent` equal to the quote's width.

### SU-39 Weight colour
- ❌ Thin and bold text in the same color: the thin text looks faint.
- ✅ Thin text ~10% darker (on light surfaces) than the bold.
- **Why:** thin strokes show less color, so compensate for equal emphasis.

### SU-137 Centered content (labels in pills, highlights behind labels)
**Rule:** content meant to be centered in a control is centered to within about 2px. A separately drawn
selection highlight (a segmented-control or tab pill) is centered on the item it marks.
- ❌ A selected-day pill drawn 6px right of "Today": 12px of space on the left, 24px on the right.
- ❌ A chip with 12px / 28px inline padding and no icon.
- ✅ Equal space on both sides, ±2px. The icon side gets about 4px less (SU-30).
- ✅ The highlight takes its position and width from the selected item's own box.
- **Why:** the eye compares the two sides of a short label instantly. A few pixels of imbalance read as
  "broken", especially next to evenly spaced neighbours. It's also below what you'll reliably notice in
  a screenshot by eye, so measure it.
- **Do:**
  - Use symmetric `padding-inline`.
  - Position indicators from the item: `left = item.offsetLeft`, `width = item.offsetWidth`, or let the
    selected item carry the background itself.
  - Never add the container's gap or padding twice.
  - Re-measure after the font loads (a bold selected label is wider than a regular one).
- **Measure:**
  - `audit.js`: SU-137 checks content vs container, and highlight vs selected item.
  - `scripts/measure-png.py`: checks screenshots, and flags "likely a mispositioned highlight" when a pill
    sits closer to one neighbour.

### SU-203 Control rows keep one rhythm
**Rule:** items in a control row (segmented controls, tab bars, toolbars, pagination, chip rows) have
equal gaps between them, to ±1px. Segments are either equal-width with centered labels, or content-hugging
with equal padding, never a mix. Flanking controls (‹ › chevrons, a trailing icon) sit at the same
distance from the group on both sides. A selected pill has the same inset from its track on every side.
- ❌ Chevrons 12px from the group on the left and 20px on the right; a pill inset 2px at the top and 4px
  at the bottom.
- ✅ 12px and 12px; the same inset all round.
- **Why:** rows are read as one rhythm, so one odd gap looks like a bug even when nobody can say why.
- **Do:** one `gap` on the row, no per-item margins, and the indicator positioned from the selected item
  (SU-137), ideally with anchor positioning: `position-anchor` plus `anchor()` and `anchor-size()`.
- **Measure:** `audit.js` SU-203 flags uneven gaps (when gaps differ by more than 2px but less than 2×,
  so deliberate grouping isn't flagged) and an off-center selected item in its track.
  `measure-png.py` reports row gaps in screenshots.
