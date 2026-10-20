# Forms & controls (SU-50 – SU-60, SU-148 – SU-154)

- [Forms & selection](#forms--selection) SU-50–57
- [Control alignment](#control-alignment) SU-58–60
- [Validation and feedback](#validation-and-feedback) SU-148–154

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

## Validation and feedback

Sources disagree on timing: GOV.UK validates on submit only, while NN/g and Carbon validate when a field
loses focus. shibroUI uses blur-after-touch plus submit, and never validates on every keystroke.

### SU-148 Every field has a visible, persistent label
**Rule:** a label sits above each field. Hints and format examples sit between the label and the field,
linked with `aria-describedby`. The placeholder holds an example at most, never the label.
- ❌ A field whose only label is the placeholder "Email": it disappears once someone types.
- ✅ "Email" above, the hint "We'll send receipts here." under it, then the field.
- **Why:** WCAG 3.3.2 and 1.3.1. People check what they typed against the label.
- **Measure:** `audit.js` SU-148: fail on a text field named only by its placeholder, or not named at
  all. Placeholder contrast counts as text (SU-45).

### SU-149 Mark the exception
**Rule:** when most fields are required, mark the optional ones "(optional)". Otherwise mark the
required ones with text, or an asterisk explained once. Use `required` in code either way. The marker is
text at ≥ 4.5:1.
- **Measure:** `audit.js` SU-149: warn on a form that mixes required and optional fields with no visible
  marker in any label.

### SU-150 Validate when the person is done, and keep submit enabled
**Rule:** validate a field on blur once it's been touched, and always on submit. On input, re-validate
only to *clear* an error. Never show errors on untouched fields or while someone is still typing. Style
errors with `:user-invalid` or `[aria-invalid="true"]`, never bare `:invalid`. Don't disable the submit
button to signal invalid input. Let it submit, then explain.
- ❌ "Invalid email" after two keystrokes, and a gray "Create account" that does nothing.
- ✅ A neutral field while typing, an error after blur, and an enabled button that reports problems
  when pressed.
- **Why:** early errors read as scolding, and a disabled button explains nothing (and fails contrast).
  Carbon allows a disabled submit on short forms; GOV.UK avoids it everywhere.
- **Measure:** `audit.js` SU-150: warn on CSS that styles `:invalid`. A disabled submit at rest with
  empty required fields is a warn on forms taller than the screen and info on short ones.

### SU-151 Inline errors are text, next to the field, and linked
**Rule:** the message sits between the label and the field, or directly under the field. It uses an
icon plus text in the danger color (≥ 4.5:1). The field gets a 2px danger border (≥ 3:1),
`aria-invalid="true"` and `aria-describedby` pointing at the message. The message says what's wrong and
how to fix it (SU-180).
- ❌ A red border and an "Invalid input" toast.
- ✅ "Enter an email address like name@company.com" under the label, linked to the field.
- **Why:** WCAG 3.3.1 and 3.3.3. Color alone and disappearing toasts both fail.
- **Measure:** `audit.js` SU-151: fail on `aria-invalid="true"` without a linked, visible message.

### SU-152 An error summary on submit
**Rule:** on a multi-field form, any error on submit shows a summary above the form ("There is a
problem", or Polaris-style "To save this product, make 2 changes"). It lists each error as a link to its
field, in the same words as the inline message. Focus moves to it, and the page title gets an "Error: "
prefix. A single-field form just focuses the field.
- **Measure:** submit the form empty and check where focus lands (SU-144).

### SU-153 Help the browser help the person
**Rule:** use the right `type`, `inputmode` and `autocomplete` token (`email`, `tel`, `given-name`,
`postal-code`, `current-password`, `new-password`, `one-time-code`). Never block paste or password
managers. Split code boxes accept a pasted code. Use `inputmode="numeric"` rather than `type="number"`,
and `spellcheck="false"` on names, emails and codes.
- **Why:** WCAG 1.3.5 (input purpose) and 3.3.8 (accessible authentication).
- **Measure:** `audit.js` SU-153: warn on personal-data fields without a valid `autocomplete` token;
  fail on `type=password` with `autocomplete="off"`; warn on 4–8 single-character boxes.

### SU-154 Keep what people typed, and don't ask twice
**Rule:**
- An error never clears valid fields.
- Multi-step forms show progress (step *n* of *m*) and prefill earlier answers ("Same as shipping
  address").
- High-stakes submits (payment, legal, deletion) get a review step or Undo (WCAG 3.3.4, 3.3.7).
- **Measure:** manual.
