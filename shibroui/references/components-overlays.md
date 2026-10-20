# Overlay components: menus, tooltips, popovers, dialogs, drawers, toasts (SU-233 – SU-238)

Overlays sit on top of the work, so sizes, triggers and focus rules matter more than their looks. These
are starting specs; the project's design system wins. Values marked † were checked against the primary
source named in the *Why* line. Motion for opening and closing is in motion.md; elevation levels and
the modal scrim are in surfaces-images.md (SU-100, SU-103). Focus handling is SU-144; live regions are
SU-146; widget patterns are SU-147.

- [Menus and small overlays](#menus-and-small-overlays) SU-233–235
- [Dialogs, panels and toasts](#dialogs-panels-and-toasts) SU-236–238

## Menus and small overlays

### SU-233 Menus
**Rule:** items 32–40px tall with a pointer, 44–48px on touch; 160–288px wide. Icons on every item or on
none, in a fixed 16px column; shortcuts right-aligned and muted. Most important items first, groups split
by dividers, high-impact actions (delete) set apart by a divider and the danger color (conventionally
last). Context menus ≤ 12 items so they never scroll, otherwise group or add search. Submenus one level
deep and ≤ ~5 items.
- ❌ 24px items, icons on 3 of 7 items, "Delete" sitting between "Rename" and "Share".
- ✅ `36px` items, a `16px` icon column on all, "Delete" in the danger color below a divider.
- **Why:** † Carbon items 24–48px, 160–288px wide, ≤ 12; M3 48dp, 112–280dp; Apple: group items, keep
  submenus short, icons on all or none. "Destructive last" is a convention, not a rule.
- **Do:** `role="menu"` / `menuitem`, type-ahead, arrow keys, Escape (SU-147); open in the top layer with
  anchor positioning (SU-100). A destructive item that can't be undone asks for confirmation or offers
  Undo (SU-161).
- **Measure:** `audit.js` SU-233: warn on `menuitem`s under 32px tall (or 44px at ≤ 480px); info on a
  danger-styled item with no divider before it.

### SU-234 Tooltips label; they don't explain
**Rule:** short (≤ ~75 characters, max width 200–320px, 12–14px text). One show delay for the whole
product, and 0ms when moving between neighbouring tooltips; the 140ms fade is separate (SU-85). Shown on
focus too, dismissible with Escape, hoverable (WCAG 1.4.13), and absent on touch. Never essential
information, never interactive content (use a popover), never on a disabled button (it can't take
focus).
- ❌ A 220-character tooltip with a link inside, shown only on hover, on a `disabled` button.
- ✅ "Archive" (7 characters) on hover and focus, `~400ms` delay, Escape closes, hovering the tooltip
  keeps it open.
- **Why:** † Apple suggests 60–75 characters, Primer 250px, M3 200/320dp. **Systems disagree on the
  delay:** Radix 700ms (300ms to skip), Carbon 100ms, Primer 50ms, shadcn 0. shibroUI default: pick one
  value for the whole product, ~300–500ms, and 0 between neighbours.
- **Do:** `role="tooltip"` on the bubble and `aria-describedby` (or the name, for icon-only buttons) on the
  trigger. For a disabled action use `aria-disabled` with a reason that can take focus (SU-252).
- **Measure:** `audit.js` SU-234: warn on `[role=tooltip]` with focusable content or > ~80 characters;
  warn on tooltip triggers that are `disabled`.

### SU-235 Popovers hold interactive content
**Rule:** 240–360px wide, 12–16px padding, anchored and flipped at the edges (`popover` + anchor
positioning, SU-100). Focus moves in when they hold controls and returns to the trigger on close.
- ❌ A 120px floating box that holds a form and clips inside a card with `overflow: hidden`.
- ✅ A `320px` popover in the top layer, `16px` padding, flipped above the trigger near the bottom edge.
- **Why:** the top layer escapes clipping, and anchor positioning removes the hand-written flip logic.
- **Do:** `<button popovertarget="p">` and `<div id="p" popover>`; `aria-expanded` on the trigger; Escape
  and outside click close it. Informational one-liners are tooltips (SU-234), decisions are dialogs
  (SU-236).
- **Measure:** SU-144 focus checks.

## Dialogs, panels and toasts

### SU-236 Dialogs are for short decisions
**Rule:** sizes ~380–400px for confirmations, ~560–640px by default, ~960px for complex content; never a
horizontal scroll (go up a size, or to a page). Max height ~85–90vh with a fixed header and footer, a
scrolling body and a fade at its bottom edge. Title is the dialog's name; footer has Cancel and the verb
(SU-178), the primary at the end, three buttons at most; a 44–48px close target. One dialog at a time. On
phones: full screen or a bottom sheet.
- ❌ A modal with a 14-field form, a 1,100px width and a vertical scrollbar over the footer buttons.
- ✅ A `600px` dialog with 4 fields, `max-height: 88vh`, a scrolling body, and "Cancel" · "Invite
  teammate" fixed at the bottom.
- **Modal or not:** modal only for decisions the task can't continue without. Long forms (more than ~6
  fields), multi-step flows, nonessential content and anything people compare against the page go to a
  page or a non-modal side panel (SU-237).
- **Why:** † Polaris 380/620/980, Primer 296–640, M3 280–560dp, Carbon max height 48–96%. **Sizes differ by
  ±20%**; shibroUI takes Polaris-like steps. NN/g: modals interrupt, so use them sparingly; Apple: one
  sheet at a time.
- **Do:** native `<dialog>` with `showModal()` (SU-103 lists the behaviour that comes with it);
  `aria-labelledby` the title; the body is the scroll container.
- **Measure:** `audit.js` SU-236 (with the dialog open): warn on dialogs wider than 90vw at ≥ 768px or
  with body overflow but no internal scroll; info on dialogs holding > 6 fields.

### SU-237 Side panels and drawers
**Rule:** 320–480px by default, 640px for complex panels (detail panels 320–400px, SU-123), full width
under ~600px. A modal drawer has a scrim and traps focus; a non-modal side panel leaves the page usable
and doesn't trap. Sticky header with title and close; a detail panel's selection lives in the URL.
- ❌ A 700px drawer over a 1,024px screen that blocks the list it is showing details for.
- ✅ A `400px` non-modal panel beside the table, header fixed, `?row=INV-2041` in the URL.
- **Why:** † Carbon side panel 320/480/640; Primer overlays 320/480/640. Non-modal panels let people
  compare against the page, which a dialog forbids.
- **Do:** modal: `<dialog>` or `inert` on the page; non-modal: `role="complementary"` or a labelled
  `region`, focus moved in on open and returned on close (SU-144). Elevation level 4 (surfaces-images.md).
- **Measure:** SU-103 / SU-144 checks.

### SU-238 Toasts don't cover the work
**Rule:** one consistent corner for the whole product, above any bottom nav on phones, about 288–420px
wide and ≤ 2 lines. At most ~3 stacked, 8px apart, the newest nearest the edge; never over the primary
action. Whatever a toast links to is also reachable elsewhere. Timing and content are SU-161.
- ❌ A toast over the "Save" button on one page and top-left on another; a "View invoice" link that
  exists only in the toast.
- ✅ Bottom right, `360px`, 2 lines, 8px stack, clear of the bottom nav; "View invoice" also in the list.
- **Why:** † **Placement differs:** Carbon top right (288px, 8px stack, persistent by default), M3
  bottom (one at a time, 4s/10s). Polaris 5s, 10s with an action. shibroUI default: bottom right on
  desktop, bottom centre above the nav on phones, and a toast with an action doesn't auto-dismiss.
- **Do:** `role="status"` (SU-146); pause on hover and focus; never errors (SU-161); level 5 elevation
  (SU-102).
- **Measure:** `audit.js` SU-238: warn when a toast-like element overlaps a visible button or the bottom
  nav.
