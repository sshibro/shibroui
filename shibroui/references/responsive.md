# Responsive, zoom & touch (SU-170 – SU-177)

SU-135 says the layout collapses in priority order. These rules add the measurable parts: no sideways
scrolling at 320px, zoom that works, text spacing that doesn't clip, and nothing that needs a mouse.
Run `audit.js` at 320×640 once (the reflow check only runs at widths ≤ 400) as well as at 1280×900.

### SU-170 Nothing scrolls sideways at 320px
**Rule:** at 320 CSS px wide (1280 at 400% zoom) the page never scrolls horizontally. Toolbars collapse
to one primary action plus "More", and tables become stacked rows. Wide content that really needs two
dimensions (data tables, code, maps, charts) scrolls inside its own container, which has `tabindex="0"`
and a name so keyboard users can scroll it.
- ❌ A `white-space: nowrap` toolbar of four buttons makes the page 540px wide on a 320px phone.
- ✅ Title + "New" + a More menu; rows show name, date and status stacked, with the amount on the
  right.
- **Why:** WCAG 1.4.10 (reflow).
- **Measure:** `audit.js` SU-170 at ≤ 400px: fail when the document overflows (lists the outermost
  offenders); warn on a scroll container that keyboard users can't reach.

### SU-171 Zoom always works
**Rule:** never block zoom (`user-scalable=no`, `maximum-scale` below 2). Set font sizes in `rem`, keep
the root at 100%, and give text containers no fixed `height`. Nothing clips at 200% text size.
- **Why:** WCAG 1.4.4 (resize text).
- **Measure:** `audit.js` SU-171: fail on a viewport meta that blocks zoom; warn on a px-locked root
  font under 16px or `vw`-only font sizes.

### SU-172 Text spacing doesn't clip
**Rule:** text boxes grow with their content. With line-height 1.5, paragraph spacing 2em, letter
spacing 0.12em and word spacing 0.16em applied, nothing clips or overlaps. Truncated text always has a
way to show in full (SU-200).
- **Why:** WCAG 1.4.12; people with dyslexia use stylesheets like this.
- **Measure:** `window.__shibroAudit = { textSpacing: true }`, then run `audit.js`: it injects the WCAG
  spacing, flags clipped text and removes the style again.

### SU-173 Breakpoints by window size, components by container
**Rule:** switch page layout at window size classes, and let components respond to their *container*
with `@container` (`container-type: inline-size`), not the viewport. Fluid type uses `clamp()` within
±25% of the base and never shrinks body text below 16px. Keep 40–75 characters per line at every size.
- **Defaults:** compact < 600, medium 600–839, expanded 840–1199, large ≥ 1200 (M3). Polaris
  (490/768/1040/1440) and Carbon (320/672/1056/1312/1584) also work; pick one set.
- **Measure:** manual; avoid near-duplicate breakpoints (767 and 768).

### SU-174 No actions that only appear on hover
**Rule:** anything revealed on hover is also revealed on `:focus-within`, and is always visible on touch
screens (`@media (hover: none)`). Popups opened on hover or focus can be dismissed with Escape, can be
hovered without closing, and stay until dismissed.
- ❌ Row actions at `opacity: 0` until `.row:hover`: they don't exist on a phone or for keyboard users.
- ✅ A visible "⋯" menu button on every row, named "Actions for Ana Petrova".
- **Why:** WCAG 1.4.13 and 2.1.1; touch has no hover.
- **Measure:** `audit.js` SU-174: warn on CSS that reveals an element only under `:hover`, with no
  focus or `(hover: none)` counterpart.

### SU-175 Touch input
**Rule:**
- Text fields are at least 16px on phones, or iOS zooms the page on focus.
- Use the right `type`, `inputmode` and `enterkeyhint` (SU-153).
- Every drag (sorting, reordering, swipe-to-delete, sliders) has a tap or click alternative (WCAG 2.5.7).
- Targets: 44px goal, 24px floor (SU-61), 48dp on Android-first products.
- **Measure:** `audit.js` SU-175 at ≤ 480px: warn on fields under 16px; info on `[draggable=true]`.

### SU-176 Mobile viewport units and safe areas
**Rule:** full-height layouts use `100dvh` (or `svh` for minimums), not `100vh`, so browser bars don't
cut content. Fixed bars add `env(safe-area-inset-*)` (with `viewport-fit=cover`). Sticky bottom bars
stay under about 25% of the screen and set `scroll-padding-bottom` to their height (SU-145).
- **Measure:** `audit.js` SU-176 (info) lists `100vh` heights.

### SU-177 Mobile navigation
**Rule:** 3–5 top-level destinations go in a bottom bar, always with icon + label. More than that goes
in a drawer or "More". The primary action sits within thumb reach. A side panel becomes a sheet or drawer,
never a squeezed column. Never hide primary navigation behind a hamburger on desktop (NN/g: more than
20% less discoverable).
- **Measure:** `audit.js` SU-177 at ≤ 480px: warn on a fixed bottom bar with more than 5 items.
