# Semantics, keyboard & assistive tech (SU-138 – SU-147)

The visual rules make a screen readable. These make it *usable* without sight, without a mouse and with
assistive tech. Most are WCAG Level A or AA, and they are the most common failures on real sites: an icon
button with no name, a placeholder used as a label, focus lost behind a sticky bar. `audit.js` measures
everything marked **Measure**. A real screen-reader pass (VoiceOver + Safari, NVDA + Firefox) still goes
in the report's "Not checked" line.

- [Page structure](#page-structure) SU-138–139
- [Names and alternatives](#names-and-alternatives) SU-140–142
- [Keyboard and focus](#keyboard-and-focus) SU-143–145
- [Announcements and widgets](#announcements-and-widgets) SU-146–147

## Page structure

### SU-138 Landmarks and a skip link
**Rule:** one `main`, plus `header`/`nav`/`footer` where they exist. When repeated navigation comes before
the content, a skip link is the first focusable element and becomes visible on focus.
- ❌ Every region is a `div`. Keyboard users tab through 14 nav links on every page.
- ✅ `<a class="skip" href="#main">Skip to content</a>` first, then `<header>`, `<nav>`, `<main id="main">`.
- **Why:** landmarks let screen-reader users jump between regions, and the skip link does the same for
  keyboard users (WCAG 2.4.1, 1.3.1).
- **Do:** `.skip { position: absolute; transform: translateY(-120%) } .skip:focus { transform: none }`.
- **Measure:** `audit.js` SU-138: fail when there isn't exactly one `main`; warn when 5+ focusable
  elements come before `main` and the first one isn't a skip link.

### SU-139 Language and title
**Rule:** `<html lang>` is set, and `<title>` names the page ("Billing – Acme"), changing on client-side
routes.
- ❌ No `lang`, and every route is titled "React App".
- ✅ `<html lang="en">` and `<title>Invoices – Acme</title>`.
- **Why:** `lang` picks the screen-reader voice, hyphenation and fonts. The title is the first thing
  announced and the tab label (WCAG 3.1.1, 2.4.2).
- **Measure:** `audit.js` SU-139: fail on missing `lang` or an empty title; warn on a generic title
  (Document, Untitled, React App, Vite + …, Home).

## Names and alternatives

### SU-140 Every control has a name that contains its label
**Rule:** every button, link and widget has an accessible name. Icon-only buttons get `aria-label`.
When a control shows text, that text is part of its name.
- ❌ Three icon buttons a screen reader announces as "button, button, button".
- ❌ A "Send" button with `aria-label="Submit form"`: voice users say "click Send" and nothing happens.
- ✅ `<button aria-label="Delete invoice"><svg aria-hidden="true">…</svg></button>`.
- **Why:** WCAG 4.1.2 (name, role, value) and 2.5.3 (label in name).
- **Do:** reuse the visible words; mark decorative icons `aria-hidden="true"`.
- **Measure:** `audit.js` SU-140: fail on an empty name (aria-labelledby → aria-label → label → alt/title
  → text); warn when the visible text isn't inside the `aria-label`.

### SU-141 Images and icons have alternatives
**Rule:** meaningful images have `alt` text that says what matters; decorative ones have `alt=""`.
`svg role="img"` has a name. Meaningful icons and control boundaries reach 3:1 against their background.
- ❌ `<img src="chart.png">` with no `alt`, so the file name gets read out.
- ✅ `alt="Revenue up 12% since June"` for a chart image, `alt=""` for a decorative photo.
- **Why:** WCAG 1.1.1 and 1.4.11 (non-text contrast).
- **Measure:** `audit.js` SU-141: fail on `img` without an `alt` attribute; warn on `svg[role=img]`
  without a name. Field boundaries are SU-44.

### SU-142 Native first, and ARIA that doesn't lie
**Rule:** use `<button>`, `<a>` and `<input>` before roles. No positive `tabindex`, nothing focusable
inside `aria-hidden`, no ARIA reference pointing at a missing `id`, no duplicate ids.
- ❌ `tabindex="3"` reordering the page; a focusable link inside a hidden-from-AT drawer;
  `aria-describedby="hint"` with no `#hint`.
- ✅ DOM order is the tab order; `inert` on closed drawers; every referenced id exists once.
- **Why:** broken ARIA is worse than none: it announces things that aren't there (WCAG 4.1.2, 2.4.3).
- **Measure:** `audit.js` SU-142: fail on `tabindex > 0`, focusables inside `aria-hidden="true"`, and
  dangling `aria-labelledby/describedby/controls/errormessage/owns`; warn on duplicate ids.

## Keyboard and focus

### SU-143 Keyboard order follows reading order
**Rule:** Tab moves through the screen in reading order, and everything a pointer can do, a keyboard can
do. Frequent actions in tools may have documented shortcuts that don't fire on a single key unless they
can be turned off or remapped (WCAG 2.1.4).
- ❌ CSS `order` or `flex-direction: row-reverse` puts the primary button first visually but last in tab
  order.
- ✅ The DOM order matches the visual order; layout tricks don't reorder focusable elements.
- **Measure:** manual. Tab through the screen once and note where focus jumps backwards.

### SU-144 Focus is managed on every change
**Rule:** focus moves with the task and never falls to `body`.
- Opening a dialog or sheet moves focus inside; closing returns it to the trigger.
- Deleting a row moves focus to the next row, or the list heading when it was the last.
- A client-side route change focuses the new `h1` (`tabindex="-1"`) or announces the page.
- Submitting a form with errors focuses the error summary (SU-152).
- **Why:** when focus is lost, keyboard and screen-reader users lose their place (WCAG 2.4.3).
- **Do:** `<dialog>` with `showModal()` handles open, trap, Escape and return. Radix/shadcn primitives do
  too; don't re-implement them.
- **Measure:** open each hidden state, press Escape, and check where focus lands. Report it in the
  coverage table.

### SU-145 Focus stays visible, and a covered ring doesn't count
**Rule:** sticky headers, footers, cookie bars and chat widgets never fully hide the focused element.
Set `scroll-padding-block` to their height. Focus rings reach 3:1 against the background (SU-70).
- ❌ Tabbing to "Notifications" puts it under a 96px cookie banner.
- ✅ `html { scroll-padding-bottom: 96px }`, so the focused link scrolls into view above the banner.
- **Why:** WCAG 2.4.11 (Focus Not Obscured, new in 2.2).
- **Measure:** `audit.js` SU-145: when fixed or sticky elements exist, focuses each control and fails
  when every sample point lands on an unrelated fixed/sticky element.

## Announcements and widgets

### SU-146 Status messages are announced
**Rule:** toasts, "Saved", result counts and progress live in `role="status"` (or `aria-live="polite"`)
regions that exist before their text changes. `role="alert"` only for errors that need attention now.
- ❌ A toast appears in a plain `div`: sighted users see "Saved", screen-reader users hear nothing.
- ✅ One `<div role="status">` mounted at load; the app writes "Saved" into it.
- **Why:** WCAG 4.1.3 (status messages). Assertive announcements interrupt, so save them for errors.
- **Measure:** `audit.js` SU-146: warn on toast-like elements with no live role; warn on
  `role=alert`/`aria-live=assertive` holding non-error text.

### SU-147 Widgets follow the ARIA pattern
**Rule:** custom widgets follow the [APG](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern, or use
the native element.
- **Tabs:** `tablist`/`tab`/`tabpanel`, `aria-selected`, arrow keys, one tab in the Tab order (roving
  `tabindex`).
- **Disclosure, menu button:** `aria-expanded` on the trigger; menus close on Escape.
- **Combobox:** `aria-expanded` plus `aria-activedescendant` or moving focus.
- **Prefer native:** `<details>`, `<dialog>`, `popover` and `<select>` bring the behavior for free.
- **Measure:** `audit.js` SU-147: fail on `role=tab` without `aria-selected` and on popup or disclosure
  triggers without `aria-expanded`; warn on a tablist with more than one tab in the Tab order.
