# Forms & controls (SU-50 – SU-60)

- [Forms & selection](#forms--selection) SU-50–57
- [Control alignment](#control-alignment) SU-58–60

## Forms & selection

### SU-50 Clickable labels
**Rule:** the whole radio/checkbox label row toggles the control.
- ❌ A `16px` click area: only the tiny box works, and clicking the words does nothing.
- ✅ A padded label row about `40px` tall that activates the control.
- **Why:** a bigger target for mouse and touch without enlarging the box itself.
- **Do:** `<label class="option"><input type="checkbox"> Include product news</label>` (or `for`/`id`),
  with `.option{display:flex;align-items:center;gap:8px;min-height:40px;padding-block:8px}`. Radio groups,
  keyboard input and neighbouring targets must keep working on their own.

### SU-51 Label selection
**Rule:** short option labels shouldn't select text when clicked or dragged.
- ❌ `user-select: text`: quick clicks highlight the words.
- ✅ `user-select: none` on radio/checkbox option labels. Clicking still toggles.
- **Scope:** only short control labels. Never body copy, inputs or text people need to copy. Don't
  change the box's border color on label hover either.

### SU-52 Recognizable buttons
**Rule:** the main form action has a familiar button shape and an explicit label.
- ❌ A round arrow icon button: it's unclear what pressing it does.
- ✅ A rectangular "Create account" button, `40px` tall, matching the `40px` input beside it.
- **Why:** the shape signals clickability and the verb names the outcome. Compact icon buttons are fine
  for familiar tools (search, close, more).
- **Do:** keep loading, validation, focus and double-submit protection.

### SU-53 Wrapped labels
**Rule:** a checkbox aligns with the *first line* of a long label.
- ❌ `align-items: center`: the box floats halfway down the paragraph.
- ✅ `align-items: flex-start` with the box centered on the first line.
- **Do:** `.option{display:flex;align-items:flex-start;gap:8px} .option input{margin-top:calc((1lh - 16px)/2)}`.
  Derive it from line-height (`1lh` or a calc), not a magic offset tuned to one label.

### SU-54 Search over scrolling
**Rule:** let people type to narrow long option lists.
- ❌ 24 countries you have to scroll through.
- ✅ A searchable picker: type "uni" and see the matches.
- **Do:** an accessible combobox with keyboard navigation, a no-results message, a clear button, and the
  full option set preserved. Short lists (under ~8–10 options) don't need search.

### SU-55 One-column choices
**Rule:** a short checkbox list goes in one column.
- ❌ Two columns: the eye zigzags across and down.
- ✅ One column with one left edge.
- **Why:** a single scan path and a clear reading order.

### SU-56 Value clarity
**Rule:** show a slider's current value where people can see it while adjusting.
- ❌ Only the `0` and `10` endpoint labels.
- ✅ A readout or tooltip that follows the thumb with the exact value (and unit).
- **Do:** update it on pointer, touch, keyboard and programmatic changes, and keep it inside the bounds at
  both ends. It's essential feedback, so don't hide it behind a "show values" toggle.

### SU-57 Comparable options
**Rule:** make familiar controls richer without losing their behavior.
- ❌ Plan radios with names only (Personal, Team).
- ✅ Option cards with price (`$9` and `$24 / month`), a one-line description and the limit (members).
- **Do:** native radios inside the cards, visible focus, and a selected state that isn't color-only
  (border + check icon).

## Control alignment

Shared rule: **an input is the same height as the button next to it, and every control in a row shares
one height.**

### SU-58 Search
- ❌ A `32px` input next to a `40px` button.
- ✅ Both `40px`.
- **Why:** mismatched heights break the pair.

### SU-59 Pagination
- ❌ Previous `40px`, numbers `32px`, Next `46px`.
- ✅ All `40px`.

### SU-60 Action toolbar
- ❌ Filled `40px`, outlined `32px`, icon `46px`.
- ✅ All `40px`, regardless of variant.
- **Do:** a shared control-height token (`--control-h: 40px`) used by inputs, selects and buttons. Icon
  buttons are square at that height.
