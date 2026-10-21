# App patterns: messaging, scheduling and files (SU-341 – SU-348)

Chat threads, composers, comment threads, booking slots and confirmations, uploads, bulk selection and
reordering: the recurring screens of a product people use every day.

### SU-341 Chat threads group messages and anchor scroll
**Rule:** Group same-author messages sent within 5 minutes under one avatar, name and time. Bubbles max
  out at 70-75% of the thread width, and sent and received differ by alignment and fill, with text at
  4.5:1. Each sent message shows Sending, Sent, Read or Failed (with Retry). Stay pinned to the bottom
  only when the reader is within about 100px of it, otherwise show a "New messages" pill, and keep the
  visible message in place when older ones load.
- ❌ Every message repeats avatar, name and time, and every bubble is full width in one grey, so who said
  what is only in the tiny header.
- ✅ Two Maya messages share one header, bubbles stop at 72% of the thread, Priya's sit right in the
  accent fill with "Read 10:04", and "Today" heads the thread.
- **Numbers:** group ≤5 min; bubble max 70-75%; contrast 4.5:1; stay-pinned zone ~100px; statuses Sending
  / Sent / Read / Failed
- **Why:** MDN defines `role="log"` for chat logs: a polite live region where new items arrive at the
  end, so screen readers announce them without stealing focus. Browser scroll anchoring
  (`overflow-anchor`) keeps the view stable when content is inserted above it, which is what loading
  older messages needs. The 5-minute group window, 72% width, 100px threshold and status set are house
  defaults.
- **Do:** `<div role="log" aria-label="Chat with Maya" tabindex="0">` as the scroll container with
  `overflow-anchor: auto`; add messages with `append`, never re-render the list. On a new message, if
  `scrollHeight - scrollTop - clientHeight < 100` scroll to bottom, else show the pill with the unread
  count. Status text ("Read 10:04") sits under only the latest message of a run. Day separators ("Today")
  stick while scrolling. The typing indicator is three 6px dots on a loop of 1.2 s or less, and `@media
  (prefers-reduced-motion: reduce)` swaps it for a static "typing…" (WCAG 2.2.2 applies only to motion
  over 5 s, so this is a house default). Failed shows a text "Not sent. Retry" button (SU-160). Long
  threads virtualize (SU-195).
- **Where:** Support widgets, DMs, team chat, marketplaces and every messaging feature.
- **Builds on:** SU-195
- **Measure:** manual. a planned  check: info on a scroll container of messages with no `role=log`; a
  planned  check: warn on `animation-iteration-count: infinite` in a typing indicator without a
  reduced-motion override.
- **Sources:** [MDN, ARIA log
  role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/log_role), [MDN,
  overflow-anchor](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-anchor)

### SU-342 Composers grow, send and keep drafts
**Rule:** The message field starts at 1 line, grows to 5-6 lines, then scrolls. On desktop Enter sends
  and Shift+Enter inserts a newline, with the hint shown; on touch devices Enter inserts a newline and a
  44px Send button sends. Send stays visible and looks inactive when the field is empty. Drafts persist
  per thread, focus returns to the field after sending, and the bottom padding includes the safe area.
- ❌ A one-line field that clips the long reply to its first words, a 28px send icon, and the home
  indicator drawn over the controls.
- ✅ The field grows to 3 lines showing the whole reply, a 44px filled Send button, and 34px of bottom
  padding so the controls clear the home indicator.
- **Numbers:** 1 → 5-6 lines then scroll; Send 44px; desktop Enter sends, Shift+Enter newline; draft
  saved per thread; bottom inset = safe area
- **Why:** MDN documents `enterkeyhint` for virtual keyboards, including `send` and `enter` (newline),
  which lets the touch keyboard match what Enter will do. WCAG 2.5.8 sets a 24px minimum target and the
  44px Send follows SU-62. Growth limits, desktop Enter-to-send and per-thread drafts follow common chat
  behavior; the exact numbers are house defaults.
- **Do:** `<textarea rows="1" enterkeyhint="enter">` with `field-sizing: content; max-height: 6lh` where
  supported and a small scripted resize otherwise. Desktop `keydown`: Enter (when `!event.isComposing`)
  sends, Shift+Enter inserts a newline; show "Enter to send · Shift+Enter for a new line" as a `<kbd>`
  hint (SU-247). Coarse pointers: `@media (pointer: coarse)` makes Enter a newline. Keep Send
  `aria-disabled="true"` (not `disabled`) when empty so it stays focusable and explains itself (SU-252).
  Save the draft per thread key on `input` (debounced) and restore it; clear on send. `padding-bottom:
  calc(8px + env(safe-area-inset-bottom))` (SU-176).
- **Where:** Chat, comments, support widgets, AI assistants and any text-plus-send field.
- **Builds on:** SU-247, SU-176
- **Measure:** manual for now. Planned check: audit.js: warn on a send button under 44px in a form with a
  textarea; warn on a `textarea` with `resize: none` and no `field-sizing` or scripted growth. Otherwise
  manual.
- **Sources:** [MDN,
  enterkeyhint](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint),
  [WCAG 2.2 SC 2.5.8 Target Size
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

### SU-343 Comment threads nest two levels with visible actions
**Rule:** Indent replies 24-32px on phones (24-40px on desktop) for two levels only; deeper replies stay
  at level 2 and start with "@name". Reply, Like and a ⋯ menu (Report, Block) are always visible, "Hide 5
  replies" collapses a thread, and the list offers Sort: Top and Newest. Long comments clamp at 6 lines
  with "Show more"; load 10-20 top-level comments, then "Show more comments".
- ❌ Five levels at 32px each: the deepest reply is a ~180px column with 3-line wraps, and no Reply or
  Like is visible.
- ✅ Two levels, the third reply flattened with "@Tomás", "Hide 2 replies", visible Reply · Like 12 · ⋯,
  "Edited", Top/Newest sort and "Show 21 more comments".
- **Numbers:** 2 nesting levels; indent 24-40px; clamp 6 lines; 10-20 top-level per page; actions always
  visible
- **Why:** Indent eats the line: at 5 levels × 32px a phone comment keeps about half the column, so depth
  is capped and deeper replies point back with @name (house default; no primary spec fixes a depth). The
  W3C APG feed pattern supports loading more items with `aria-busy` and position/size attributes, and
  notes that an article in a feed may itself contain a feed of comments. WCAG 2.5.8 keeps Reply, Like and
  ⋯ at a 24px minimum target (44px on touch).
- **Do:** Render a flat list with `data-depth` (1-2) rather than infinitely nested elements; the thread
  is `<section aria-label="Comments">` with each comment an `<article>` (the APG feed uses
  `aria-posinset`/`aria-setsize`, and `aria-busy` while loading more). "Hide replies" is a `<button
  aria-expanded>` (SU-147). Actions are real buttons with names ("Reply to Maya Chen"); Reply opens an
  inline composer under the comment. Authors can edit ("Edited" shown) and delete; a deleted comment with
  replies shows "Comment deleted" and keeps its children. Clamp with `-webkit-line-clamp: 6` plus a "Show
  more" button (SU-200). Times use SU-340; Report and Block live in the ⋯ menu (SU-233).
- **Where:** Blogs, forums, docs, news, video and social apps.
- **Builds on:** SU-245
- **Measure:** manual for now. Planned check: audit.js: warn on comment containers nested deeper than 2
  levels (`[data-depth]` above 2 or `article article article`); info on comment rows without a visible
  Reply control. Otherwise manual.
- **Sources:** [W3C APG, Feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/), [WCAG 2.2 SC
  2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

### SU-344 Slot pickers show the viewer's time zone and the earliest times
**Rule:** A calendar plus a slot list. Slots are 44px-high buttons in 2-3 columns, with AM/PM or 24 h to
  match the locale. Times show in the viewer's zone with its name ("10:00 AM, Berlin (CEST)") and a zone
  selector in the main panel, not a footer. Preselect the earliest day with availability so its first
  slots are visible without scrolling. Past or full days are disabled with a reason, a waitlist is
  offered when none remain, and the duration is stated.
- ❌ 28px chips reading "9:00 9:30 10:00" with no AM/PM and no zone, so "10:00" could be anyone's.
- ✅ "Wed, Oct 21 · 30 min", "Times in Berlin (CEST) · Change", and six 44px slots in two columns with
  AM/PM.
- **Numbers:** slot buttons 44px high, 2-3 columns; zone named beside "Change"; earliest day preselected;
  duration stated
- **Why:** NN/g's date-input guidance says to make choices clear by disabling and graying out options
  that are not available. W3C Internationalization notes that a UTC offset is not a time zone and that
  future events need the zone, with exemplar cities to help people recognise theirs. 44px slots follow
  SU-62; the preselected earliest day, the zone placement and the 2-3 column grid are house defaults.
- **Do:** Slots are `<button>`s in a `role="group"` named with the day. Format with `new
  Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short" })`;
  store the IANA id (`Europe/Berlin`), not an offset. Detect the zone with
  `Intl.DateTimeFormat().resolvedOptions().timeZone` and show it as text next to a "Change" control.
  Disabled days use `aria-disabled` with the reason in the legend (SU-252). Selected is more than color
  (SU-251). Date typing rules are SU-242.
- **Where:** Booking and scheduling flows on service, healthcare, SaaS demo and consultancy sites.
- **Builds on:** SU-242
- **Measure:** manual for now. Planned check: audit.js: warn on slot-like buttons (time text in a
  `button`) under 44px tall, and on a list of times with no zone name or abbreviation nearby. Otherwise
  manual.
- **Sources:** [NN/g, Date-Input Form Fields](https://www.nngroup.com/articles/date-input/), [W3C,
  Working with time zones](https://www.w3.org/International/wiki/WorkingWithTimeZones)

### SU-345 Booking confirmations show both zones, a calendar link and a way out
**Rule:** The confirmation shows the date and time in both people's zones, the location or link, "Add to
  calendar" (Google, Outlook, .ics), and Reschedule and Cancel with the policy deadline. The email
  repeats all of it, and cancelling names the booking. If a slot is held first, show a mm:ss countdown
  (5-10 minutes), warn at 1 minute, say what happens at zero ("Your slot is released") and let the person
  extend.
- ❌ "You're booked! Wed 21 Oct, 10:00" with no zone, no calendar link, no place, and a single "Done"
  button.
- ✅ "Your time: Wed, Oct 21, 10:00 AM Berlin (CEST)", "Their time: 4:00 AM New York (EDT)", Add to
  calendar (Google, Outlook, .ics), and Reschedule · Cancel with "Free to change until Tue, Oct 20, 10:00
  AM".
- **Numbers:** hold 5-10 min; warn at 1:00; extend (≥10 times, ≥20 s to act); both zones; Google /
  Outlook / .ics
- **Why:** WCAG 2.2.1 requires a time limit to be adjustable, switchable off, or extendable: warn before
  it expires, give at least 20 seconds to extend with a simple action, and allow at least 10 extensions.
  iCalendar (RFC 5545) is the format behind .ics files. W3C notes that a future event needs its time
  zone, not just an offset. The 5-10 minute hold and the 1-minute warning are house defaults.
- **Do:** The countdown is text plus `role="timer"` that does not announce each second; announce at 1:00
  with a polite `role="status"` (SU-146) and put "Extend 5 minutes" in the warning. Generate an `.ics`
  (`BEGIN:VEVENT`, `DTSTART;TZID=Europe/Berlin`, `UID`, `SEQUENCE` bumped on reschedule) and
  Google/Outlook links from the same data. The confirmation uses a `<dl>`; Cancel opens a dialog naming
  the booking and any fee (SU-181).
- **Where:** Appointments, events, tickets, restaurants and travel bookings.
- **Builds on:** SU-181
- **Measure:** manual. a planned  check: warn on a countdown element (`[role=timer]`) with no extend
  control.
- **Sources:** [WCAG 2.2 SC 2.2.1 Timing
  Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), [IETF, RFC 5545
  iCalendar](https://datatracker.ietf.org/doc/html/rfc5545), [W3C, Working with time
  zones](https://www.w3.org/International/wiki/WorkingWithTimeZones)

### SU-346 Image and avatar uploads preview, crop and can be removed
**Rule:** State accepted types and the size limit before the person chooses. After choosing, show the
  image in a square or circular crop with drag and zoom, a live preview at the real size, Save and
  Cancel; later, offer Remove. Show the avatar at 96-128px on profile pages with an initials fallback
  (SU-245). Reject with the specific fix, such as "The selected file must be smaller than 5MB" or "The
  selected file must be a PNG or JPG".
- ❌ An automatic centre-crop that cuts the face in half, no zoom, no limits shown, and Save as the only
  choice.
- ✅ A draggable circle on the face with a zoom slider, a 96px preview, "PNG or JPG, up to 5 MB. Drag to
  reposition.", Save photo, Cancel and "Remove photo".
- **Numbers:** limits shown up front ("PNG or JPG, up to 5 MB"); crop with zoom; preview at 96px; profile
  avatar 96-128px; Save · Cancel · Remove
- **Why:** The GOV.UK file-upload guidance gives error templates that name the fix: "The selected file
  must be smaller than 2MB" and "The selected file must be a JPG, BMP, PNG, TIF or PDF". Showing the
  limits before the choice, the crop step, the 96-128px size and the 5 MB value are house defaults that
  avoid uploads failing after the fact.
- **Do:** `<input type="file" accept="image/png,image/jpeg">` behind a "Choose photo" button (SU-243);
  check type and size on the client and again on the server. Crop with a canvas: output a fixed 2× size
  (for example 256px for a 128px avatar), strip EXIF location data and apply EXIF orientation. The crop
  frame is keyboard operable (arrow keys move, +/- zoom) with a text alternative of the instructions.
  Errors are inline text linked with `aria-describedby` (SU-151). Remove restores the initials fallback
  and confirms with an Undo toast (SU-161).
- **Where:** Profile photos, team and company logos, product photos and cover images.
- **Builds on:** SU-243
- **Measure:** manual for now. Planned check: audit.js: warn on `input[type=file]` with no `accept` and
  no nearby text matching /(MB|KB)/; otherwise manual.
- **Sources:** [GOV.UK Design System, File
  upload](https://design-system.service.gov.uk/components/file-upload/)

### SU-347 Bulk selection shows a checkbox, a count and an action bar
**Rule:** Selectable items in a grid or list show a checkbox on hover and focus (always visible on
  touch), and a checkmark plus outline when selected, never a tint alone. Shift+click selects a range. Once anything is selected, a 40-48px action bar replaces the toolbar with "3 selected", the actions and
  a cancel, and row actions are disabled meanwhile. Remember the Grid / List choice per user.
- ❌ Selected files are a faint tint with no checkbox, no count, and the toolbar unchanged, so nothing
  says what Delete would hit.
- ✅ Checked tiles with an accent outline, a "3 selected" bar with Move · Download · Delete and a cancel
  (✕) replacing the toolbar, and a hover checkbox on the next tile.
- **Numbers:** checkbox on hover/focus, always on touch; Shift+click range; bulk bar 40-48px; "3
  selected"; Grid/List remembered
- **Why:** Carbon's data table puts batch actions in a bar that appears once an item is selected,
  disables per-row actions and overflow menus while it is active, and lets people leave with Cancel or by
  deselecting all. The ARIA listbox pattern gives the keyboard model for multi-select (Space toggles,
  Shift+Space selects a range, Ctrl+A selects all). Shift+click, the hover checkbox and the 40-48px bar
  height are house defaults taken from common file managers.
- **Do:** Each tile is `role="option"` in a `role="listbox" aria-multiselectable="true"` (or a grid) with
  `aria-selected`; selection is checkmark + outline, never tint alone (SU-251). The checkbox is shown
  with `:hover, :focus-within, [aria-selected=true]` and permanently under `(hover: none)` (SU-174). The
  bar uses `role="toolbar"` and announces "3 selected" politely (SU-146). Save the Grid/List choice per
  user and keep one thumbnail ratio; non-images get type icons. Delete follows SU-181.
- **Where:** File managers, media libraries, galleries, email and admin lists.
- **Builds on:** SU-224, SU-174
- **Measure:** manual. a planned  check: warn on `[aria-multiselectable]` lists with no element exposing
  the selected count; info on selection checkboxes that appear only on `:hover` with no `:focus-within`
  rule.
- **Sources:** [Carbon Design System, Data table
  usage](https://carbondesignsystem.com/components/data-table/usage/), [W3C APG, Listbox
  pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)

### SU-348 Reordering: drag handles, drop lines, keyboard and menu alternatives
**Rule:** A sortable list shows a 6-dot handle with a 44px hit area on the leading edge, a 2px accent
  drop line between items, a lifted preview with a shadow at about 0.9 opacity, and the original left in
  place dimmed to 0.4 so the layout does not jump. Pick-up, moves and drops are announced through an
  `aria-live` region ("Picked up Design review, position 2 of 5"). Keyboard: Space to pick up, arrows to
  move, Space to drop, Esc to cancel. Every drag also has a non-drag path: "Move up / Move down" in the
  row menu, or "Move to column" on a kanban card.
- ❌ Rows with no handle, no drop line, the dragged row removed so the list jumps up, nothing announced,
  and a row menu with only Edit, Duplicate and Delete.
- ✅ A `44px` 6-dot handle, a `2px` accent line between rows 3 and 4, a dimmed placeholder in row 2, a
  lifted preview with a shadow, an announcement, and "Move up / Move down" in the menu.
- **Numbers:** 44px handle; 2px drop line; preview ~0.9 opacity, origin 0.4; edge auto-scroll ~40px;
  kanban columns 280-320px; ≤3 facts per card; order saved with Undo
- **Why:** WCAG 2.5.7 requires dragging functions to work with a single pointer without dragging, and
  lists adjacent up/down controls for list items, arrow buttons for kanban cards and a pop-up menu for
  moving to another column as ways to meet it (WCAG 2.5.7). Atlassian specifies a 2px drop indicator
  stroke, the dragged original dimmed to 40% opacity, previews of at most three pieces of information,
  and move actions inside an existing more-actions menu (Atlassian). dnd kit documents Space or Enter to
  pick up, arrow keys to move, Space or Enter to drop and Escape to cancel, and recommends position-based
  announcements such as "position 2 of 5" (dnd kit). The 44px handle, the 0.9 lift opacity, the 40px
  auto-scroll band and the 280-320px column width are house defaults (Atlassian's own minimum handle
  target is 24px).
- **Do:** Handle is a real `<button aria-label="Reorder Design review" aria-describedby="reorder-help">`
  that is the keyboard drag source (`aria-roledescription="sortable"` is optional). While held:
  placeholder row `opacity:.4` plus dashed outline, preview `box-shadow:0 10px 24px rgb(24 24 27/.22)`,
  drop line `2px solid var(--accent)` placed in the middle of the gap with an 8px terminal (SU-249:
  nothing resizes). Live region text: "Picked up {name}, position {n} of {total}. Moved to position {m}
  of {total}. Dropped at position {m}." / "Reorder cancelled, back at position {n}." Esc returns the
  item. The row "⋯" menu has "Move up" and "Move down" (disabled at the ends, with the reason in the
  label), and a kanban card has "Move to column…". Auto-scroll the container when the pointer is within
  ~40px of its edge. Kanban: columns 280-320px with the count in the header ("In review · 4"; add the WIP
  limit only if one exists), horizontal scroll on the board only, cards show at most 3 facts. Update
  optimistically and offer Undo (SU-159, SU-161); on touch, the handle works with long press or a plain
  drag (SU-175).
- **Where:** Task boards, playlists, form builders, dashboard widgets, menus and image galleries; common
  in apps, rare on marketing sites.
- **Builds on:** SU-175, SU-249, SU-159, SU-161, SU-233
- **Measure:** manual for now. Planned check: audit.js: info on `[draggable=true]` or sortable lists with
  no `button` handle and no menu item matching /move (up|down|to)/i. Drop line, placeholder and
  announcement: manual.
- **Sources:** [W3C WCAG 2.2, Understanding SC 2.5.7 Dragging
  Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), [Atlassian Design
  System, Pragmatic drag and drop design
  guidelines](https://atlassian.design/components/pragmatic-drag-and-drop/design-guidelines), [dnd kit,
  Accessibility](https://dndkit.com/guides/accessibility)
