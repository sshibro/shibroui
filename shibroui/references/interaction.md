# Interaction states (SU-248 – SU-252)

States.md covers *data* states (empty, loading, error). These rules cover a component's *interaction*
states: hover, pressed, focus-visible, selected, disabled, read-only. The scripts can't hover or press, but
they can read the CSSOM for state rules (as the hover-only check in `51-touch-and-hover.js` does) and
compare the selected item with its siblings. Otherwise force each state in a specimen sheet (attributes
like `aria-selected`, `disabled`, `data-state`, or a `.is-hover` class that mirrors `:hover`) and audit that.

- [The state matrix](#the-state-matrix) SU-248
- [States change paint, not layout](#states-change-paint-not-layout) SU-249
- [Contrast and cues](#contrast-and-cues) SU-250–252

## The state matrix

### SU-248 Every interactive component specifies its state matrix
**Rule:** list the states that apply (default, hover, pressed, focus-visible, selected/checked, disabled,
read-only, loading, error), design each one, and show them all in a specimen. No state is identical to
default, except where the platform has none (no hover on touch).
- ❌ A button with a default style and a hover color; pressed, focus and loading are browser defaults or
  missing.
- ✅ Every cell below is decided, with its own value for the properties in the row.
- **Why:** a state nobody designed gets the browser default or, worse, a style that breaks contrast or
  layout (SU-249, SU-250).
- **Do:** write the matrix in the spec, then render variant × size × state × scheme on one page.

| Component | Default | Hover | Pressed | Focus-visible | Selected | Disabled | Read-only | Loading | Error |
|---|---|---|---|---|---|---|---|---|---|
| Button | fill | +4–8% shift | +10%, `scale(.98)` | 2px ring, 2px offset | `aria-pressed`: fill | 38% content | — | spinner, same width | — |
| Text field | 1px border | border darker | — | ring + border accent | — | 12% fill, hint | full ink, no ring | inline spinner | red border + text |
| Checkbox, radio, switch | outline | +4–8% layer | +10% layer | ring | check, dot, thumb right | 38% content | static, full ink | — | red outline + text |
| Tab, segment | muted ink | layer | +10% layer | ring | ink + indicator | 38% content | — | — | — |
| Nav item | muted ink | layer | +10% layer | ring | tint + `aria-current` | 38% content | — | — | — |
| Menu item | ink | layer | +10% layer | ring (inset) | check icon | 38% content | — | — | danger ink |
| Table row | plain | layer | — | ring on the row control | tinted fill + check | greyed actions | — | skeleton row | inline message |

- **Measure:** workflow: the specimen sheet; checklist row.

## States change paint, not layout

### SU-249 States change paint, not layout
**Rule:** hover, pressed and selected change color, background, shadow or transform. They never change
padding, border width, font size or the width of the label. A label that turns bold when selected reserves
the bold width, or uses a grade axis (`font-variation-settings: "GRAD" …`) that doesn't change width.
- ❌ A selected tab goes from weight 400 to 600 and its neighbours move 3px. A hover rule adds a 2px
  border to a 1px-bordered button.
- ✅ Neighbours stay put (0px shift); border width is constant, and the hover border uses `box-shadow: inset`
  or a transparent border at rest.
- **Why:** a moving neighbour is the SU-137/203 class of bug: the row stops reading as one rhythm.
- **Do:** reserve the bold width with a hidden bold copy of the label.
  ```css
  .tab { display: inline-flex; flex-direction: column; align-items: center; }
  .tab::after {
    content: attr(data-label); /* same text as the label */
    display: block; font-weight: 600; visibility: hidden; height: 0; overflow: hidden;
  }
  .tab[aria-selected="true"] { font-weight: 600; }
  ```
- **Measure:** `audit.js` SU-249: for `[aria-selected=true]`, `[aria-current]`, `[aria-pressed=true]`,
  `.is-active`, compare box metrics with unselected siblings of the same component (font-weight differs
  and the text width of the same string would differ by > 1px: warn). CSSOM: warn on `:hover`/`:active`
  rules that set `padding`, `border-width`, `font-size` or `font-weight` without a width reservation.

## Contrast and cues

### SU-250 Every state keeps its contrast
**Rule:** hover, pressed and selected text stays ≥ 4.5:1 on its own background, and focus rings ≥ 3:1.
Hover layers are a small, consistent shift: about 4–8% toward the text color on light (M3 state layers:
hover 8%, focus and pressed 10%), and lighter on dark. Hover styles sit behind `@media (hover: hover) and
(pointer: fine)` so taps don't leave sticky hover (emil-design-eng).
- ❌ A row hover that sets `#f3f4f6` behind `#9ca3af` text: 2.3:1. A hover that darkens the background
  25%.
- ✅ `@media (hover: hover) and (pointer: fine) { .row:hover { background: color-mix(in oklch,
  var(--surface), var(--text) 6%) } }` with text still ≥ 4.5:1.
- **Why:** contrast is otherwise measured only in the rendered state, so a state style that drops a label
  to 2:1 passes.
- **Measure:** `audit.js` SU-250: resolve `:hover`, `:active`, `[aria-selected=true]` and `[data-state=*]`
  rules that set `color` and/or `background-color` (with `var()` resolved from the element) and compute
  the pair for matching elements. `:has()`-driven states are skipped and listed in `coverage.skipped`.

### SU-251 Selected is obvious without color
**Rule:** a selected option, tab or nav item differs from its siblings by a non-color cue: weight plus
indicator, a check icon, or a fill change of ≥ 3:1 against the unselected fill.
- ❌ Selected tab: the text turns from `#6b7280` to `#4b5563`, and nothing else changes.
- ✅ Selected tab: ink color, a 2–3px indicator and `aria-selected="true"`; selected radio: filled dot.
- **Why:** color alone fails people who can't tell the shades apart (WCAG 1.4.1).
- **Measure:** `audit.js` SU-251: in tablists, radiogroups, segmented controls and `nav` lists, compare
  the selected item with a sibling; warn when only `color` or `background-color` differs and by less than
  3:1.

### SU-252 Disabled means "not now", and says why
**Rule:** prefer hiding what someone can never do, and explain what they can't do yet.
- **Reason:** an inline hint, or `aria-disabled` with a reason in a tooltip that can be focused (a
  `disabled` button can't take focus).
- **Look:** disabled controls are exempt from contrast (WCAG 1.4.3) but must still read as controls:
  content about 38% and container about 12% opacity (M3), never so faint the shape disappears.
- **Read-only is not disabled:** full-contrast text, selectable, with a visible "read-only" cue.
- ❌ A gray "Submit" with no explanation; a read-only field styled exactly like `:disabled`.
- ✅ "Submit" disabled with "Complete the 2 required fields" beneath it (`aria-describedby`).
- **Why:** Carbon separates disabled (temporary; say how to enable), read-only and hidden.
- **Measure:** `audit.js` SU-252: info on `disabled` buttons with no adjacent hint text or
  `aria-describedby`; warn on `[readonly]` fields styled like `:disabled`.
