# Advanced inputs and form controls (SU-316 – SU-325)

The inputs beyond a text field: keyboards on phones, counters, phone and address fields, steppers,
ratings, tags, inline edit and multi-step forms. They extend forms.md (SU-50-60, SU-148-154).

### SU-316 Every field gets the right type, inputmode and enterkeyhint
**Rule:** Set `type`, `inputmode`, `enterkeyhint` and `autocomplete` from what the field holds, so the
  phone opens the right keyboard with the right action key. Digit-only identifiers (verification codes,
  numeric postcodes, card and account numbers) use `inputmode="numeric"`, never `type="number"`.
- ❌ A 6-digit verification code in a default text field: the full letter keyboard opens, the action key
  says "return", and the SMS code is not offered.
- ✅ The same field with `inputmode="numeric"`, `autocomplete="one-time-code"` and `enterkeyhint="done"`:
  a digit pad with a "Done" key, and the SMS code offered above it.
- **Numbers:** email: type=email; phone: type=tel; codes and numeric postcodes: inputmode=numeric;
  decimals: inputmode=decimal; URL: type=url; search: type=search + enterkeyhint=search; chat:
  enterkeyhint=send; mid-form: enterkeyhint=next, last field: done or go; emails, usernames, codes:
  autocapitalize=off, autocorrect=off, spellcheck=false
- **Why:** `inputmode` picks the on-screen keyboard without changing validation, and `enterkeyhint`
  relabels the Enter key (MDN). GOV.UK says not to use `type="number"` unless research shows a need
  (scrolling changes the value, and bad input gets no feedback) and to set `inputmode="numeric"` for
  whole numbers instead (GOV.UK). The per-field list in `numbers` is a house default built from those
  attributes.
- **Do:** `email` -> `type="email" autocomplete="email"`; `phone` -> `type="tel" autocomplete="tel"`;
  one-time code -> `inputmode="numeric" autocomplete="one-time-code"`; postcode in numeric-only regions
  -> `inputmode="numeric" autocomplete="postal-code"` (alphanumeric postcodes stay text); decimals ->
  `inputmode="decimal"`, but if negatives are allowed use plain `type="text"` because some decimal
  keypads have no minus (GOV.UK); URL -> `type="url"`; search -> `type="search" enterkeyhint="search"`;
  chat or comment composer -> `enterkeyhint="send"`. Add `autocapitalize="off" autocorrect="off"
  spellcheck="false"` (`autocorrect` is a WebKit attribute) to usernames, emails and codes. `inputmode`
  does not validate, so keep `pattern` and server checks. Genuine quantities with steppers (SU-320) may
  keep `type="number"`.
- **Where:** every sign-up, login, checkout and search form on mobile; `type="number"` used for codes and
  IDs is a widespread bug
- **Builds on:** SU-153, SU-175
- **Measure:** manual for now. Planned check: audit.js: warn on `input[type=number]` whose name, id,
  label or autocomplete suggests a code, postcode, phone, card or account number; info on
  `input[type=search]` without `enterkeyhint`; info on text inputs with `autocomplete` of email, tel,
  postal-code or one-time-code and no matching `type` or `inputmode`.
- **Sources:** [MDN:
  inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode),
  [MDN:
  enterkeyhint](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint),
  [GOV.UK Design System: text input
  (numbers)](https://design-system.service.gov.uk/components/text-input/)

### SU-317 The keyboard never hides the focused field or the submit button
**Rule:** When the on-screen keyboard opens, the focused field stays visible with a gap above the
  keyboard, and the submit action stays reachable on top of it instead of underneath. Field text stays at
  16px or larger (SU-175) so iOS Safari does not zoom in on focus.
- ❌ The keyboard covers the bottom of the focused Card number field and the whole fixed "Pay $48.00" bar.
- ✅ The layout scrolls so Card number sits 16px above the Pay bar, and the Pay bar rides directly on top
  of the keyboard.
- **Numbers:** focused field at least 16px clear of a sticky bar (scroll-padding-bottom = bar height +
  16px); fixed bars follow the keyboard (interactive-widget=resizes-content on Chrome Android,
  visualViewport on iOS); 16px minimum field text; 100dvh, never 100vh
- **Why:** WCAG 2.4.11 fails when sticky content entirely hides a focused control, and CSS scroll-padding
  is a listed sufficient technique (WCAG 2.4.11, C43). `interactive-widget=resizes-content` makes the
  keyboard resize the viewport, but it is a Chrome feature (108+) and is not supported in Safari or any
  iOS browser, so iOS needs a visual-viewport fallback (Chrome for Developers, Can I use). iOS Safari
  zooms into inputs rendered under 16px (West Wind write-up of the WebKit behaviour). The 16px gap is a
  house default.
- **Do:** `<meta name="viewport" content="width=device-width, initial-scale=1,
  interactive-widget=resizes-content">` makes Chrome Android shrink the layout viewport and viewport
  units. For iOS, listen to `visualViewport` `resize` and `scroll` and set `--kb: innerHeight -
  visualViewport.height - visualViewport.offsetTop`, then `.bar{bottom:var(--kb,0px)}`. Keep focus clear
  of the bar with `html{scroll-padding-bottom:calc(var(--bar-h) + 16px)}` and
  `input{scroll-margin-block:16px}`. Field text `input,select,textarea{font-size:max(16px,1em)}`. Never
  use `maximum-scale=1` or `user-scalable=no` to stop the zoom: it blocks pinch-zoom for low-vision
  users. Form pages use `min-height:100dvh` (SU-176).
- **Where:** every mobile form with a fixed "Continue" or "Pay" bar: checkout, onboarding, chat composers
- **Builds on:** SU-175, SU-176
- **Measure:** manual for now. Planned check: audit.js: info on bottom-fixed or sticky bars when the
  scroller has no `scroll-padding-bottom` (SU-176 covers the 16px field size). Keyboard overlap itself is
  manual: test on a real phone.
- **Sources:** [WCAG 2.2: Understanding SC 2.4.11 Focus Not Obscured
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [Chrome for
  Developers: viewport resize behavior
  (interactive-widget)](https://developer.chrome.com/blog/viewport-resize-behavior), [West Wind:
  preventing iOS textbox
  auto-zoom](https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing)

### SU-318 Character counters count and never block
**Rule:** Put a counter at the bottom right of the field in 14px muted text ("0/280" or "120 characters
  remaining"), shown from 75% of the limit when the limit is long. Never stop typing or paste with
  `maxlength`: over the limit, the counter turns to the error color with an icon and says "You have 7
  characters too many", and the pasted text is kept.
- ❌ A 287-character paste into a `maxlength="280"` textarea: 7 characters vanish mid-sentence, and the
  counter reads a calm grey "280/280".
- ✅ The whole paste is kept, the overflow is tinted, the border and counter turn red with an icon, and
  the counter says "You have 7 characters too many" until the person trims it.
- **Numbers:** counter 14px, bottom right; appears at 75% of the limit (long limits); error: icon + "You
  have N characters too many" at 4.5:1; screen reader update after a 1s pause or at thresholds, never per
  keystroke; textarea starts at 3-5 rows and grows to about 10
- **Why:** GOV.UK's character count "does not restrict the user from entering information", tells people
  when they have too many characters, can show the count from a threshold percentage (its example is 75)
  and announces it to screen readers when they stop typing (GOV.UK). The 1s pause, the row counts and the
  14px size are house defaults.
- **Do:** No `maxlength` on the `<textarea>`. Give it `aria-describedby` pointing at the counter. The
  visible counter updates on every keystroke but is not itself live; a visually hidden `<div
  role="status">` is updated about 1s after typing stops and at thresholds ("20 characters remaining"),
  per WCAG 4.1.3. Over the limit: `aria-invalid="true"`, 2px danger border, icon + text, and on submit
  block with the same message (SU-151, SU-152; GOV.UK pattern: "Review must be 280 characters or less").
  Count the way the server counts (UTF-16 length vs `Intl.Segmenter` graphemes). Start at `rows="4"` and
  grow with `field-sizing:content` where supported (cap with `max-height:10lh`), or a small resize
  script.
- **Where:** reviews, bios, comments, support messages, tweet-style composers, product descriptions
- **Builds on:** SU-151, SU-150
- **Measure:** manual for now. Planned check: audit.js: warn on a `textarea` or `input` with `maxlength`
  and a nearby element whose text matches `\d+\s*/\s*\d+` or "characters" (a counter next to a hard limit
  means typing is probably blocked). Otherwise manual.
- **Sources:** [GOV.UK Design System: character
  count](https://design-system.service.gov.uk/components/character-count/), [WCAG 2.2: Understanding SC
  4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

### SU-319 Phone fields accept what people type and explain the request
**Rule:** Use `type="tel"` with `autocomplete="tel"` and accept spaces, hyphens, brackets and a leading
  "+"; never mask while typing. Put a searchable country picker (name plus dial code, defaulted from the
  locale) to the left of the number, validate with a phone library on blur, and say why the number is
  wanted or make it optional. Width about 20ch.
- ❌ A US-style mask `(___) ___-____` with no country picker: pasting "+44 7700 900982" turns into "(440)
  770-0900" and fails with "Enter a valid phone number".
- ✅ A "GB +44" country picker and a free 20ch field holding "07700 900982" as typed, with the hint "We
  only text you about delivery. Optional."
- **Numbers:** type=tel; ~20ch wide; country picker left of the number (SU-54 search); no mask; validate
  on blur; reason in the label or hint; 44px field height on touch
- **Why:** GOV.UK asks for `type="tel"`, `autocomplete="tel"`, extra spaces, hyphens, dashes and brackets
  to be allowed, and says to avoid input masking and not to reformat what was typed; it also recommends
  validating with libphonenumber (GOV.UK). Baymard found 39% of benchmarked ecommerce sites require a
  phone number without any explanation, and some testers entered false numbers or abandoned checkout
  (Baymard).
- **Do:** `<input type="tel" autocomplete="tel">`, plus a combobox (SU-54) for the country with the dial
  code inside the option text ("United Kingdom +44"), the default coming from `navigator.language` or the
  shipping country. Store the E.164 value (`+447700900982`) and keep the typed format in the field; parse
  with libphonenumber on blur and show an example message ("Enter a phone number, like 01632 960 001 or
  +44 808 157 0192"). Do not reformat what the person typed. Put the reason in the hint, not a tooltip
  ("We only call if there is a problem with delivery").
- **Where:** checkout, sign-up, contact and booking forms; most SaaS sign-up flows ask for one
- **Builds on:** SU-153, SU-54, SU-149
- **Measure:** manual for now. Planned check: audit.js: warn on `input[type=tel]` with a `pattern` or a
  masking attribute (`data-mask`, `data-inputmask`) and on phone fields with `maxlength` under 15; info
  when a required phone field has no hint text. Otherwise manual.
- **Sources:** [GOV.UK Design System: telephone
  numbers](https://design-system.service.gov.uk/patterns/telephone-numbers/), [Baymard: explain the phone
  number field](https://baymard.com/blog/explain-phone-number-field)

### SU-320 Number steppers are for small counts with a sensible default
**Rule:** Use a stepper only when one value is the usual answer and changes are small (cart quantity,
  guests, nights). Minus on the left, plus on the right, each 44px; the value is a typeable field wide
  enough for the maximum digits; a button disables at the minimum or maximum and says why. Large or
  continuous ranges use a plain number field.
- ❌ Two 28px buttons around a static number; "−" and "+" look active at 1 and at the 10-item cap and
  silently do nothing.
- ✅ 44px buttons around a typeable value; "−" is greyed at 1 ("Minimum 1"), "+" is greyed at 10 ("Max 10
  per order").
- **Numbers:** default = most common value (usually 1); buttons 44px (WCAG floor 24px); value field about
  3ch for 1-99; hold repeats after 400ms at about 100ms; Up/Down arrows step; disabled at min and max
  with a reason; beyond about 20 steps use a text field or slider
- **Why:** NN/g: use steppers for fields with a clear most frequently chosen value, make the buttons
  large, pair them with a text field, show the range limits and allow long-press for faster change
  (NN/g). Carbon: numeric input should always have a default and is a poor fit when large changes are
  expected (Carbon). The 44px size, 400ms/100ms repeat and 3ch width are house defaults; WCAG 2.5.8 only
  requires 24px.
- **Do:** `<input type="number" inputmode="numeric" min="1" max="10" step="1" id="qty">` between two
  `<button type="button">` with `aria-label="Decrease quantity"` / `"Increase quantity"` and
  `aria-controls="qty"`. Use `disabled` (or `aria-disabled` with a visible reason in `aria-describedby`)
  at the limits; the helper reads "Max 10 per order". Value field `inline-size:3ch` plus padding,
  `text-align:center`, `font-variant-numeric:tabular-nums` (SU-16). Hold-to-repeat: `pointerdown` starts
  a 400ms timer, then repeats every 100ms; clear on `pointerup`, `pointerleave` and `blur`. Announce the
  new value through the input itself (it is focusable and already a spinbutton).
- **Where:** every cart and booking flow; guests, rooms, seats and ticket counts
- **Builds on:** SU-241, SU-61
- **Measure:** manual for now. Planned check: audit.js: info on stepper-like button pairs (text "+" and
  "−" or "-") smaller than 44px (fail under 24px); warn when the value between them is not an input.
  Limits and defaults: manual.
- **Sources:** [NN/g: input steppers](https://www.nngroup.com/articles/input-steppers/), [Carbon Design
  System: number input](https://carbondesignsystem.com/components/number-input/usage/), [WCAG 2.2:
  Understanding SC 2.5.8 Target Size
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

### SU-321 Sliders show their value and pair with a number input when precise
**Rule:** Label above, the current value always visible, min and max labels at the ends, and a track of
  about 4px with a visible thumb of 20-24px inside a 44px hit area. Ranges (a price filter) use two
  thumbs plus min and max number inputs and a minimum gap between thumbs. Ranges as wide as 1-1000, or as
  narrow as 1-3, do not use a slider.
- ❌ A price slider with two 12px thumbs and only "$0" and "$500" at the ends: the selected range cannot
  be read or typed.
- ✅ Two 24px thumbs (44px hit areas), live "$40 – $220" in two number inputs above the track, "$0" and
  "$500" at the ends.
- **Numbers:** track 4px; thumb 20-24px visible, 44px hit area; value readout always shown; min and max
  labels; two thumbs + two number inputs for ranges; keyboard: arrows 1 step, PageUp/PageDown about 10%
  of the range, Home/End
- **Why:** Carbon: label above the slider, min and max text, a number input beside it so people can type
  exact values, two inputs plus two handles for a range, and avoid ranges like 1-1000 or 1-3 (Carbon).
  The APG slider defines arrow, Page Up/Down, Home and End keys and `aria-valuetext` (W3C APG), and in
  many two-thumb sliders the thumbs may not pass each other (W3C APG multi-thumb). Drags need a tap or
  typed alternative (WCAG 2.5.7, SU-175). The 4px track, 24/44px sizes and 10% Page step are house
  defaults.
- **Do:** Native `<input type="range" min max step>` per thumb, or `role="slider"` with `aria-valuemin`,
  `aria-valuemax`, `aria-valuenow` and `aria-valuetext="$40"`. For a range, update each thumb's
  `aria-valuemin`/`aria-valuemax` from the other thumb's value and enforce a gap of at least one step.
  Pair with `<input type="number" inputmode="numeric">` boxes (SU-316) that move the thumbs on change,
  and let a click on the track move the nearest thumb. Hit area via `padding` or `::before{inset:-10px}`
  on a 24px thumb. Show the value in a tooltip while dragging and keep it in the fields at rest (SU-56).
  `touch-action:pan-y` on horizontal tracks.
- **Where:** price and distance filters, volume, brightness, settings and configurators
- **Builds on:** SU-56, SU-241, SU-175
- **Measure:** manual for now. Planned check: audit.js: warn on `input[type=range]` and `[role=slider]`
  with no adjacent output, `aria-valuetext` or number input; info when `max - min` over `step` is greater
  than 500 or less than 4. Thumb size and hit area: manual.
- **Sources:** [Carbon Design System: slider](https://carbondesignsystem.com/components/slider/usage/),
  [W3C APG: slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/), [W3C APG: multi-thumb
  slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/)

### SU-322 Range calendars read as one band on 40px cells, with unavailable days explained
**Rule:** A range calendar fills the days between start and end as one continuous band with filled end
  days, on 40-44px day cells and 36-44px month buttons. Unavailable days are dimmed and struck through
  (not colour alone) and the reason is stated. Show two months at 768px and wider and one below. Typed
  fields and presets (SU-242) sit beside it.
- ❌ A 28px-cell calendar where each chosen day is a separate dot and booked 9-10 Dec look the same as
  open days, with 24px month buttons.
- ✅ A continuous band from 17 to 22 Dec on 40px cells with filled end days, 9-10 Dec struck through with
  "fully booked", and 36px month buttons.
- **Numbers:** day cells 40-44px; prev/next buttons 36-44px; two months at 768px+, one below; band = 1
  continuous fill with 20px end radius; unavailable: dimmed + line-through + a stated reason; presets:
  Today, Last 7 days, Last 30 days, This month; week start from Intl.Locale; time steps 15 or 30 min
- **Why:** Carbon: a calendar picker lets people type the date or pick it, and range inputs need start
  and end labels (Carbon). `Intl.Locale.getWeekInfo()` returns the locale's first day of the week (MDN).
  Sources differ on layout: Carbon shows one month at a time, so two months at 768px+, the 40-44px cells,
  the continuous band and the 15/30 minute time step are house defaults. Typed input and presets are
  SU-242.
- **Do:** A calendar built as a `role="grid"` with arrow-key navigation, `PageUp`/`PageDown` for months
  and `Esc` to close and return focus to the field; the band is one continuous background on the cells,
  the end days are filled circles and the row ends get `border-radius`. Unavailable days get
  `aria-disabled="true"`, a strike-through or hatch (not color alone, SU-251) and a legend or tooltip
  with the reason. Preset buttons set both fields at once. Week start from `new
  Intl.Locale(navigator.language).getWeekInfo().firstDay` (fall back to a small table where unsupported).
  Time picks: a `<select>` or listbox in 15 or 30 minute steps with the zone shown ("15:00 CET") and the
  locale's 12/24h clock. Below 768px show one month in a full-width sheet (SU-76).
- **Where:** hotel, flight and rental booking, analytics dashboards, reports, scheduling and filter bars
- **Builds on:** SU-242, SU-251, SU-76
- **Measure:** manual. audit.js could only flag a date picker whose `input` is `readonly`: warn on
  readonly inputs that open a calendar.
- **Sources:** [Carbon Design System: date
  picker](https://carbondesignsystem.com/components/date-picker/usage/), [GOV.UK Design System: date
  input](https://design-system.service.gov.uk/components/date-input/), [MDN:
  Intl.Locale.getWeekInfo()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo)

### SU-323 Token inputs behave like text
**Rule:** Chips are 32px tall with 8px gaps and wrap onto new lines instead of scrolling sideways. Each
  remove button has a 24px minimum target and a name. Enter or comma adds a token, paste splits on commas
  and whitespace, Backspace on an empty input highlights then removes the last token, duplicates are
  refused with a message, and limits are stated ("4 of 5").
- ❌ One clipped line of 24px chips with 12px "×" targets, a duplicate address accepted twice, and the
  typing area pushed out of view.
- ✅ Four 32px chips wrapping onto two lines, 24px remove buttons, the text cursor beside them,
  "priya@halden.co is already added" and "4 of 5 recipients".
- **Numbers:** chips 32px high, 8px gap; remove target 24px minimum; wrap, no horizontal scroll; Enter,
  comma and paste add; limit shown as "4 of 5"; suggestions in a list under the input
- **Why:** Carbon spaces grouped tags 8px apart, keeps titles on one line and truncates with the full
  text on hover or focus (Carbon). WCAG 2.5.8 sets 24px as the minimum pointer target (WCAG 2.5.8). The
  32px height, paste splitting and Backspace behaviour are house defaults that match how people use email
  recipient fields.
- **Do:** Container `display:flex;flex-wrap:wrap;gap:8px` with a real `<input>` last and
  `flex:1;min-inline-size:12ch`. Each chip is `<span class="chip">ana@morrow.app<button type="button"
  aria-label="Remove ana@morrow.app">` (SU-246). Keep a visually hidden `role="status"` for added and
  removed announcements (SU-146). On `paste`, split on `/[,\s;]+/` and add each valid token; on `keydown`
  Backspace with an empty input, first mark the last chip selected, then remove it on the second press.
  Truncate long tokens with an ellipsis and the full text in `title` or a focus tooltip (SU-200).
  Suggestions: combobox listbox under the field (SU-147).
- **Where:** email recipients, tags and labels, skills and interests, search filters, allowlists
- **Builds on:** SU-241, SU-246, SU-147
- **Measure:** manual for now. Planned check: audit.js: warn on chip remove buttons under 24px (fail
  under 16px) and on a token container with `overflow-x:auto|hidden` and `flex-wrap:nowrap`; info on
  remove buttons without an accessible name. Behaviour: manual.
- **Sources:** [Carbon Design System: tag](https://carbondesignsystem.com/components/tag/usage/), [WCAG
  2.2: Understanding SC 2.5.8 Target Size
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

### SU-324 Inline editing looks like text and edits like a field
**Rule:** The read state shows the value with a visible edit control (never hover-only). The edit state
  keeps the same font size, weight and position, so nothing shifts. Enter saves and Esc cancels; short
  single-line text can save on blur, while long text stays open with Save and Cancel. A 32px tick and
  cross sit at the field end, saving shows a small spinner, and an error keeps the field open.
- ❌ The title has a pencil only on hover; clicking swaps it for a default 14px input with the text
  shifted and nothing to confirm or cancel.
- ✅ A visible 32px pencil; editing keeps the 22px title exactly in place with a 2px ring, and a tick and
  cross follow the field.
- **Numbers:** edit control visible at rest, 32px target; same size, weight and position in both states;
  Enter saves, Esc cancels; tick and cross buttons 32px at the field end; long text (multi-line) does not
  save on blur
- **Why:** Atlassian's inline edit shows a read view that switches to an edit view with confirm and
  cancel buttons, saves when the person leaves the field, and recommends keeping the edit view open on
  blur for larger text areas so unfinished work is not lost (Atlassian). PatternFly keeps save and cancel
  actions in the editing state and requires an accessible name on the edit toggle (PatternFly).
  Hover-only controls fail touch users (SU-174). The 32px size is a house default.
- **Do:** Read state: `<h1 class="title">Q4 launch plan</h1><button aria-label="Edit title">`; edit
  state: an `<input>` styled with the heading's `font:inherit` and the same padding, with a transparent
  2px border in the read state so the ring does not move anything (SU-249). `keydown` Enter -> save,
  Escape -> cancel and return focus to the edit button. One-line values: save on `blur` (and also offer
  the tick); text areas: stay open on blur (in Atlassian's component, `keepEditViewOpenOnBlur`) with Save
  and Cancel visible. While saving disable the field, show a 16px spinner at the end and keep the width
  (SU-158); on error keep the field open with the message (SU-151) and keep the typed value (SU-154).
  Announce "Title saved" (SU-146).
- **Where:** titles, names and cells in SaaS tools, tables, boards, profile pages and admin panels
- **Builds on:** SU-249, SU-174, SU-158
- **Measure:** manual for now. Planned check: audit.js: warn on edit buttons that are
  `display:none`/`opacity:0` until `:hover` (SU-174 hover check). Same-size editing and behaviour:
  manual.
- **Sources:** [Atlassian Forge: inline
  edit](https://developer.atlassian.com/platform/forge/ui-kit/components/inline-edit/), [PatternFly:
  inline edit](https://www.patternfly.org/components/inline-edit)

### SU-325 Rich-text toolbars are real toolbars
**Rule:** The container is `role="toolbar"` with a roving tabindex (one tab stop, arrow keys move). Buttons are 32-36px (44px on touch), grouped by hairlines (text style, lists, insert), and toggles use
  `aria-pressed`. Show at most 8-12 controls and put the rest under "More". The toolbar stays at the top
  of the editor, the editing area is at least 160px tall, and pasting offers plain text.
- ❌ Eighteen ungrouped 24px icon buttons in one dense strip, no pressed state on Bold, and nothing to
  tell the groups apart.
- ✅ Eight 36px buttons in three hairline-divided groups (style, lists, insert) plus a "More" button, with
  Bold shown as pressed.
- **Numbers:** buttons 32-36px (44px on touch); 8-12 visible, rest under More; groups divided by 1px
  hairlines; one tab stop, arrow keys move; editor min-height 160px; tooltips show shortcuts
- **Why:** The W3C APG toolbar pattern uses `role="toolbar"` so the whole bar is one tab stop with
  arrow-key movement, requires an accessible name, and says to use it only for groups of 3 or more
  controls (W3C APG). WCAG 2.5.8 sets the 24px pointer-target floor (WCAG 2.5.8). The 32-36px size, 8-12
  visible limit and 160px editor are house defaults.
- **Do:** `<div role="toolbar" aria-label="Formatting">` with `tabindex="0"` on the active button and
  `tabindex="-1"` on the others; Left/Right (and Home/End) move focus. Toggles: `<button
  aria-pressed="true" aria-label="Bold">` with a tooltip "Bold (⌘B)" (SU-247). Groups: `<span
  role="group" aria-label="Lists">` separated by `border-inline-start:1px solid var(--line)` with 8px
  margin. Overflow: a "More" menu button (`aria-haspopup="menu"`, SU-233) for strikethrough, table and so
  on. Make the toolbar `position:sticky;top:0` inside the editor; give the editing surface
  `min-height:160px` and a visible focus ring (SU-70). Intercept paste to offer "Paste as plain text"
  (⌘⇧V) and strip unknown styles.
- **Where:** comments, CMS and blog editors, email composers, issue trackers, docs and notes
- **Builds on:** SU-247, SU-233, SU-147
- **Measure:** manual for now. Planned check: audit.js: info on a container holding 6 or more adjacent
  icon-only buttons that is not `role="toolbar"`, and on toolbars with more than 12 buttons or buttons
  under 24px. Pressed states and paste: manual.
- **Sources:** [W3C APG: toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/), [WCAG 2.2:
  Understanding SC 2.5.8 Target Size
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
