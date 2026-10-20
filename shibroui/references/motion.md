# Motion & response (SU-72 – SU-92)

- [Press feedback](#press-feedback) SU-72–74
- [Interruptible transitions](#interruptible-transitions) SU-75–77
- [Animation principles](#animation-principles) SU-78–88
- [Interaction details](#interaction-details) SU-89–92
- [Starter tokens](#starter-tokens)

Every motion rule assumes a `prefers-reduced-motion: reduce` fallback: an instant state change or an
opacity-only fade, with the static end state still clear.

## Press feedback

### SU-72 / SU-73 / SU-74 Action, toggle and selection feedback
**Rule:** pressed scale `0.95–0.98` for about `200ms` (buttons, bookmark toggles, chips).
- ❌ Scale `0.84` over `700ms`: too big and too slow, so the press feels clumsy.
- ✅ Scale `0.97` over `200ms`.
- **Why:** a small, quick response acknowledges the press. A big, slow one makes the UI feel laggy.

```css
.btn { transition: transform 200ms var(--ease-out); }
.btn:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) { .btn { transition: none; } .btn:active { transform: none; } }
```

## Interruptible transitions

### SU-75 / SU-76 / SU-77 Sidebar, bottom sheet, popover
**Rule:** reversible motion follows the current visible state.
- ❌ "Keeps opening": clicking Close mid-open waits for the open animation to finish.
- ✅ "Turns back": it reverses immediately from wherever it is.
- **Why:** people change their minds mid-animation. One-shot `@keyframes` can't reverse from the middle.
- **Do:** drive open/close with a state attribute plus CSS `transition` (which retargets from the current
  value), the Web Animations API (`animation.reverse()`), or a spring library. Avoid `animationend`
  gates that block the next state. Keep the element interactive during the transition.

```css
.sheet { transform: translateY(100%); transition: transform 300ms var(--ease-in); }
.sheet[data-open] { transform: translateY(0); transition: transform 300ms var(--ease-out); }
```

## Animation principles

Classic animation principles, scoped to UI. Each one is a tool for clarity, not a default to add everywhere.

### SU-78 Squash & stretch
- ❌ A rigid button (`1 × 1`): the press has no visible response.
- ✅ A brief squeeze to `1.058 × 0.945` over `220ms`, then back.
- Keep the label readable and the hit area still, and give reduced motion a static pressed state.
- **Scope:** squash and overshoot only on direct manipulation (a drag released with momentum) and rare
  celebratory moments. Never on routine UI such as menus, dialogs or toasts. Other installed skills
  (impeccable, apple-design) take the same line.

### SU-79 Anticipation
- ❌ Pull-to-refresh with no cue for when letting go will refresh.
- ✅ An icon plus "Release to refresh" appears once the pull passes the real threshold.
- Show the outcome before commit. Don't add wind-up delays to ordinary buttons.

### SU-80 Clear motion paths (key poses)
- ❌ The task card tilts `−8° → +7°` and wanders on its way to Done.
- ✅ A clean `0% → 50% → 100%` path over `340ms`.
- Plan meaningful start, middle and end states and remove arbitrary detours.

### SU-81 Follow through & overlap
- ❌ The files snap in (`0ms`) while the folder is still opening.
- ✅ Folder `240ms`; rows settle at `340–460ms`, staggered just after it.
- Use it only when it shows how parts belong together. Stagger steps of 30–80ms, with the whole stagger
  ≤ 300ms.

### SU-82 Slow in & slow out (easing)
- ❌ `240ms linear`: the indicator starts and stops abruptly.
- ✅ `240ms cubic-bezier(.645,.045,.355,1)`.
- **Entering and state changes** (hover, press, toggle, open): ease-out.
- **Moving between positions:** ease-in-out.
- **Exiting:** a short ease-out, or an accelerate curve (`--ease-in`) only for elements leaving the
  screen, at ≤ 150–200ms.
- **Never ease-in on hover, press or state changes:** it feels sluggish at the start. `audit.js` warns on
  it, and emil-design-eng and review-animations agree.
- **Linear:** keep it for continuous motion (spinners, marquees) and real progress values.

### SU-83 Arcs
- ❌ The item flies in a rigid straight line from "Add to bag" to the bag.
- ✅ A small arc over `360ms`.
- Straight paths are often clearest, so use an arc only when it makes the journey easier to follow. Keep
  both endpoints anchored to the real elements.

### SU-84 Feedback without distraction (secondary action)
- ❌ An `80px` check over `650ms` covers the message you just sent.
- ✅ A `16px` check next to the message over `240ms`, then it settles.
- Supporting feedback stays smaller than the action, and confirms only real outcomes (wait for success).

### SU-85 Timing
- ❌ A tooltip at `600ms` in and `600ms` out: a simple check feels slow.
- ✅ `140ms` in and `100ms` out.
- Frequent interactions need short durations. Keep the hover-intent delay separate from the animation
  duration. Rough budget: micro feedback 100–200ms, small UI 150–250ms, panels and sheets 250–350ms.
  `audit.js` warns above 300ms for UI transitions, and above 500ms for panels, sheets, dialogs and page
  transitions.

### SU-86 Noticeable errors (exaggeration)
- ❌ A `±36px` shake over `700ms`: the error becomes hard to read.
- ✅ A `±4px` shake over `240ms`, once.
- The message carries the meaning. Don't repeat the shake, keep the field editable and focused, and skip the
  travel for reduced motion.

### SU-87 Readable flips (solid drawing)
- ❌ A flat flip shows mirrored text on the back.
- ✅ A 3D turn with `perspective`, `transform-style: preserve-3d` and `backface-visibility: hidden`, so each
  face reads correctly.
- Hide the back face from pointer events and assistive tech (`inert`/`aria-hidden`).

### SU-88 Consistent feedback (appeal)
- ❌ Each checkbox reacts differently: spin, slow fade, snap.
- ✅ Every checkbox shares the same small, quick response.
- The same action should get the same response. Reuse motion tokens per role.

## Interaction details

### SU-89 Responsive gesture
- ❌ The swipe handle ignores the first `80px`, then jumps to catch up.
- ✅ It follows the pointer immediately from the grab point.
- Once a drag is recognized, there are no dead zones. Keep the original grab offset, constraints and
  keyboard alternative.

### SU-90 Cancelable gesture
- ❌ The notification is dismissed mid-drag, before you let go.
- ✅ It's dismissed on release past the threshold, and pulling back cancels.
- Separate live feedback from commitment, and commit on `pointerup`.

### SU-91 Continuous gesture
- ❌ The slider stops tracking when your held pointer drifts off the track.
- ✅ The drag continues anywhere until release.
- **Do:** `el.setPointerCapture(e.pointerId)` on `pointerdown`, and release on `pointerup` or `pointercancel`.

### SU-92 Responsive feedback (instant selection)
- ❌ The selection highlight slides and trails behind fast clicks.
- ✅ The highlight changes instantly (or animates in under ~100ms without delaying the state).
- The selected value, visual state and `aria-selected`/`aria-checked` change together, immediately.

## Starter tokens

```css
:root {
  --ease-out: cubic-bezier(.22, 1, .36, 1);     /* entering */
  --ease-in: cubic-bezier(.55, 0, 1, .45);      /* leaving the screen only, ≤ 200ms */
  --ease-in-out: cubic-bezier(.645, .045, .355, 1); /* moving */
  --dur-micro: 140ms; --dur-small: 200ms; --dur-panel: 300ms;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important;
    transition-duration: 1ms !important; scroll-behavior: auto !important; }
}
```
The blanket reduced-motion rule is a safety net. Better still, swap movement for an opacity change
per component.
