# Navigation components: sidebar, top nav, tabs, breadcrumbs, command palette (SU-228 – SU-232)

Navigation is where people form their map of the product, so its sizes and states must be boringly
consistent. These are starting specs; the project's design system wins. Values marked † were checked
against the primary source named in the *Why* line. Widths of the sidebar follow SU-123, the header
height follows SU-134, and widget keyboard patterns follow SU-147.

- [Persistent navigation](#persistent-navigation) SU-228–229
- [Local navigation](#local-navigation) SU-230–232

## Persistent navigation

### SU-228 Sidebar navigation
**Rule:** 220–280px wide (SU-123), items 32–40px tall with a pointer (44–56px on touch), 16–20px icons and
14px labels, group labels 12px muted, at most two levels. The current item has a tinted fill, full ink
and `aria-current="page"`. Collapsed, it becomes a 48–80px rail with a tooltip per item.
- ❌ 28px items with 11px labels, three nested levels, and an "active" item that is only a different
  text color with no `aria-current`.
- ✅ `256px` sidebar, `40px` items, `20px` icons, `14px` labels, a tinted fill on the current item, and a
  `56px` rail when collapsed.
- **Why:** † Carbon side nav is 256px (rail 48); M3 drawer is 360dp with 56dp items and a 80–96dp rail.
  Systems differ by density, not by idea.
- **Do:** `<nav aria-label="Main"><ul>` with `<a aria-current="page">`; the selected state is a fill plus
  weight or indicator, not color alone (SU-251) and never shifts neighbours (SU-249). The rail's
  tooltips are labels only (SU-234) and each item keeps its accessible name.
- **Measure:** `audit.js` SU-228: warn on nav lists where no link has `aria-current` while one is styled
  as active.

### SU-229 Top navigation and mega menus
**Rule:** header 56–64px (SU-134), ≤ ~7 items, the current section marked. Mega menus open on click, or
after ~0.5s of hover and then appear within 0.1s; they tolerate diagonal pointer paths, close ~0.5s after
the pointer leaves and on Escape, and group links under headings.
- ❌ A menu that opens at once on any pass of the pointer and closes the moment it drifts diagonally
  toward the panel; 11 top-level items.
- ✅ Hover intent of 0.5s, a panel that appears in 0.1s, a 0.5s grace period on leave, and headings
  over groups of links.
- **Why:** † NN/g mega-menu research: instant menus flicker open, impatient menus close under the
  pointer.
- **Do:** a `<button aria-expanded aria-controls>` trigger so keyboard and touch users get the same
  panel; Escape closes and returns focus to the trigger (SU-144). Hover is never the only way to open
  it (SU-174). Menu keyboard behaviour is SU-147.
- **Measure:** SU-147, SU-174 checks.

## Local navigation

### SU-230 Tabs switch views of one thing
**Rule:** 40–48px tall (64 with icon and label), a 2–3px indicator at least 24px wide, ≤ ~7 tabs before
they scroll (with arrow buttons and an edge fade; scrollable tabs ≥ 90px wide). Never tabs for sequential
steps, or for links to other pages (those are nav links with `aria-current`).
- ❌ Tabs that turn bold and push their neighbours 3px; "Step 1 / Step 2 / Step 3" as tabs; 12 tabs
  squeezed to 60px each.
- ✅ `48px` tabs, a `3px` indicator, the selected label reserving its bold width so nothing moves
  (SU-249), and a scroll container with arrows when tabs overflow.
- **Why:** † M3 tabs are 48dp (64 with icon and label) with a 3dp indicator. Tabs promise "same page,
  other view"; steps and page links break that promise.
- **Do:** `role="tablist"`, `role="tab"` with `aria-selected`, `role="tabpanel"` with `aria-labelledby`;
  arrow keys move, Home/End jump (SU-147). Selected differs by more than color (SU-251). Selected state
  tied to the URL when a view is worth sharing.
- **Measure:** SU-147, SU-203, SU-249 checks.

### SU-231 Breadcrumbs show where, not where you've been
**Rule:** only for hierarchies of 3+ levels. The current page is either the last crumb as plain text
with `aria-current="page"` (NN/g) or left out (GOV.UK), and never a link to itself. Separators are
`aria-hidden`; on phones show 1–2 levels (or the first and last); chevrons mirror in RTL (SU-198).
- ❌ "Home > Docs" on a two-level site, history-based crumbs, and a last crumb that links to the page
  you're on.
- ✅ `Home / Billing / Invoices / INV-2041` with the last crumb plain text and `aria-current="page"`.
- **Why:** † NN/g and GOV.UK disagree on the current page (shown as text vs omitted). Both agree that it
  must not be a self-link. shibroUI default: show it as plain text, so the trail ends on a label.
- **Do:** `<nav aria-label="Breadcrumb"><ol>`; separators in CSS (`li+li::before`) so they stay out of
  the accessibility tree; `transform: scaleX(-1)` on chevron icons under `[dir=rtl]`.
- **Measure:** `audit.js` SU-231: warn when the last crumb is a link to the current URL.

### SU-232 Command palette
**Rule:** ⌘K / Ctrl+K plus a visible button that shows the shortcut; optional scope prefixes (GitHub: `>`
commands, `#` issues, `@` people). 560–640px wide, ~15–20% from the top, a 48–56px input; grouped results
with headings, ≤ 10 visible on desktop (4–8 on phones), recent items when empty, matched characters
highlighted, shortcuts right-aligned.
- ❌ A palette only reachable by an undocumented shortcut, 25 ungrouped results, and a 300ms open
  animation on something used 50 times a day.
- ✅ A "Search ⌘K" button in the header, a `600px` dialog 18% from the top, a `52px` input, 8 results in
  3 labelled groups, no open/close animation.
- **Why:** † GitHub's palette uses ⌘/Ctrl+K and prefixes; Baymard finds ≤ 10 suggestions scan best;
  frequent actions shouldn't animate (emil-design-eng). Widths are convention.
- **Do:** the combobox pattern: `role="combobox"` input with `aria-activedescendant` pointing at the
  active `role="option"` in a `role="listbox"`; Escape closes and returns focus to the trigger
  (SU-144, SU-147). Show shortcuts in `<kbd>` (SU-247). Modal depth is SU-103; result counts are
  announced (SU-146). Long option lists use search, not scrolling (SU-54).
- **Measure:** SU-147 combobox checks.
