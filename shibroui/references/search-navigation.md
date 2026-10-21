# Search and navigation extras (SU-349 – SU-355)

Search results, no-results pages, autocomplete, pagination, back links, language and region switchers and
the account menu.

### SU-349 Search results pages restate the query and the count
**Rule:** The results page says what ran: a heading with the count and the query ("128 results for
  “jacket”"), the query kept in the field, and the page title carrying it too. Offer up to 5 scope chips
  with counts, and mark matched terms with bold or `<mark>`, never color alone. When the engine corrects
  the query, say "Showing results for X" with a link to search for the original. Count, sort and filter
  placement follow SU-266.
- ❌ An h1 of "Search results", an empty field, no count, and 60 results that look the same as any list.
- ✅ "128 results for “jacket”", “jacket” still in the field, chips All 128 · Men 64 · Women 51 · Kids 13,
  matches in bold.
- **Numbers:** Count + query in the h1; ≤ 5 scope chips; matched terms bold, not just colored; form
  `role="search"`
- **Why:** People rarely refine a failed search: success falls from 51% on the first query to 18% on the
  third (NN/g), so the page must show plainly what was searched and let them narrow it. Color-only
  highlights fail WCAG 1.4.1. Restating and the chip limit are house defaults.
- **Do:** `<form role="search"><input type="search" value="jacket" aria-label="Search the shop"></form>`
  (or `<search>`); `<h1>128 results for “jacket”</h1>`; `<title>jacket – 128 results –
  Trailhead</title>`; wrap matches in `<mark>` with `font-weight:700` and a transparent or light
  background; announce count changes in a `role="status"` region (SU-146). Put the count in the page, not
  only in the tab.
- **Where:** Every site with search and more than a few dozen pages: shops, docs, help centres,
  intranets.
- **Builds on:** SU-266
- **Measure:** manual for now. Planned check: audit.js: warn on a page with `input[type=search]` whose
  form has no `role="search"` or `<search>` ancestor; info when the h1 and title contain no value of the
  search field. Match highlighting is manual.
- **Sources:** [NN/g: Search: Visible and
  Simple](https://www.nngroup.com/articles/search-visible-and-simple/), [W3C APG: Search landmark
  example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html), [WCAG 2.2
  Understanding SC 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)

### SU-350 No-results pages recover instead of apologizing
**Rule:** Say plainly that nothing matched, keep the query editable in the field, then offer ways
  forward: a spelling suggestion, a broader query, 3-6 categories and a few popular items. Generic tips
  on their own are not a recovery. Keep it a normal page (a `200` with `noindex`), not a 404: the URL is
  a search, not a missing page (SU-330).
- ❌ "No results found" plus three tips (check spelling, use general words, fewer keywords) and nothing to
  click.
- ✅ "No results for “rain jaket”", "Did you mean rain jacket?", a 214-result broader search, 4 category
  chips and 3 popular products.
- **Numbers:** 1 plain statement; query kept; 1 spelling or broader query; 3-6 categories; 3-6 popular
  items
- **Why:** About half of e-commerce sites handle zero-result searches in ways that frustrate shoppers,
  and tips alone are not enough because users rarely read or apply them (Baymard). The route back should
  be a click, not advice. The status code and the 3-6 counts are house defaults.
- **Do:** Heading names the query (`No results for “rain jaket”`); suggestion links rerun the search with
  one click; category chips show counts and hide empty categories; popular items are real, in-stock
  products. Do not joke or blame. Point to help or chat last, for stores where staff can answer. Send
  `noindex` so empty search URLs stay out of the index.
- **Where:** Every search feature has zero-result cases; most e-commerce, docs and help sites.
- **Builds on:** SU-117
- **Measure:** manual: needs a query that returns nothing. a planned  check: a no-results view with zero
  links besides the header and footer is a dead end.
- **Sources:** [Baymard: No results pages](https://baymard.com/research-articles/no-results-page), [NN/g:
  Search: Visible and Simple](https://www.nngroup.com/articles/search-visible-and-simple/)

### SU-351 Autocomplete emphasizes the predicted text and never scrolls
**Rule:** Bold the predicted remainder, not what the person typed. Show the list at its natural height
  with no inner scrollbar (rows 34-44px, at most 10 on desktop and 4-8 on phones, as in SU-244). Arrow
  keys move through the list and copy the highlighted suggestion into the field; Enter submits it. On
  focus with an empty field, show recent searches with a Clear control at 44px or more.
- ❌ A list capped at 6 visible rows that scrolls, with the typed "run" in bold and the useful part plain.
- ✅ 8 rows at 34px, no scrollbar, "ning shoes" bold, and the highlighted row copied into the field.
- **Numbers:** predicted text bold; no scrollbar; rows 34-44px; ≤ 10 desktop · 4-8 mobile; 44px Clear
- **Why:** Autocomplete is on 80% of e-commerce sites but only 19% get all the details right; Baymard
  says to avoid scrollbars in favor of the list expanding to its natural size, to emphasize the predicted
  portion, and to copy the suggestion into the field on keyboard focus. The combobox pattern keeps focus
  in the field while a suggestion is announced (W3C APG). Row height and the 44px Clear are house
  defaults.
- **Do:** `<input role="combobox" aria-expanded="true" aria-controls="sugg" aria-autocomplete="list"
  aria-activedescendant="s2">` with `<ul role="listbox" id="sugg">` and `role="option"` rows (SU-147).
  Wrap the predicted part in `<b>`. Let the list grow to its natural height (no `overflow:auto`). On
  phones dim the page behind with a scrim and keep the list above the keyboard. Escape closes; "Clear
  recent searches" is a real button.
- **Where:** Search boxes on most shops, travel sites, docs and apps (80% of e-commerce sites per
  Baymard).
- **Builds on:** SU-244
- **Measure:** manual for now. Planned check: audit.js: warn when a `[role=listbox]` controlled by a
  search or `aria-autocomplete` combobox scrolls (`scrollHeight` over `clientHeight`); warn on
  `role=combobox` without `aria-controls`. Emphasis is manual.
- **Sources:** [Baymard: Autocomplete design](https://baymard.com/blog/autocomplete-design), [W3C APG:
  Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

### SU-352 Pagination controls never end in an ellipsis and say where you are
**Rule:** Show the first page, the last page, the current page and one or two neighbours, with an
  ellipsis only between numbers. Mark the current page with a fill and `aria-current="page"`, keep
  Previous and Next at both ends, and put the page in the page title ("Page 5 of 20"). On phones collapse
  to Previous, "Page 5 of 20" and Next at 44px.
- ❌ Pages 1-9 then a trailing "…", no Next, and page 5 marked only by a darker blue at 32px.
- ✅ ‹ Previous · 1 … 4 [5] 6 … 20 · Next ›, 40px controls, page 5 filled, and "Page 5 of 20" under the
  row.
- **Numbers:** 1 + current ±1-2 + last; ellipsis only between; 40px controls (44px on touch);
  `aria-current="page"`
- **Why:** GOV.UK shows the current page, first and last pages and ellipses for skipped ranges, with
  `aria-current` and the page number in the title; Carbon says never to put the ellipsis at the start or
  end of the series. The mobile compact form and the 44px size are house defaults (WCAG 2.5.5).
- **Do:** `<nav aria-label="Pagination"><ul>…<li><a aria-current="page"
  href="?page=5">5</a></li>…</ul></nav>`; ellipses are `aria-hidden` text; `<title>Orders (page 5 of
  20)</title>`. Hide Previous on page 1 and Next on the last page. A page past the end redirects to the
  last page. After a change, scroll to the list top and move focus to its heading (SU-144). Row height
  and count text are SU-59 and SU-226.
- **Where:** Search results, tables, blogs, shops and admin lists: nearly every site with a list over ~25
  items.
- **Builds on:** SU-59
- **Measure:** manual for now. Planned check: audit.js: warn on a pagination `nav` whose last visible
  item is an ellipsis; warn when no link has `aria-current="page"`. Control heights are SU-59's check.
- **Sources:** [GOV.UK Design System:
  Pagination](https://design-system.service.gov.uk/components/pagination/), [Carbon: Pagination
  usage](https://carbondesignsystem.com/components/pagination/usage/)

### SU-353 Back links name their destination and restore state
**Rule:** Put the back link at the top left, before the main content, labelled with where it goes ("Back
  to Orders", not "Back"). It returns to the previous page as the person last saw it, with the same
  filters, page and scroll. Do not combine it with breadcrumbs. On phone detail screens it is the primary
  way out, with a 44px target.
- ❌ Breadcrumbs plus a 12px grey "Back" at the top right: two exits, and the second does not say where it
  goes.
- ✅ "← Back to Orders" at the top left, 44px tall, filters and scroll restored on return, no breadcrumbs.
- **Numbers:** Label names the destination; top-left, before `<main>`; 44px target; never with
  breadcrumbs
- **Why:** GOV.UK: place it at the top before `main`, send people back to the page in the state they last
  saw it, never pair it with breadcrumbs, and use a specific label such as "Go back to [page]" where a
  bare "Back" is unclear (it allows plain "Back" on simple journeys; shibroUI defaults to naming the
  destination). The 44px target is a house default (WCAG 2.5.5).
- **Do:** `<a class="back" href="/orders?status=open&page=2">Back to Orders</a>` placed before `<main>`;
  keep the filters in the URL so the link restores them (SU-226); restore scroll with
  `history.scrollRestoration`. Use plain links to a known URL, not `history.back()` alone, so a deep link
  still has a safe destination. Mirror the arrow in RTL (SU-198).
- **Where:** Detail pages, checkout and form flows, and mobile app screens; most apps with a drill-down.
- **Builds on:** SU-231, SU-226
- **Measure:** manual for now. Planned check: audit.js: info on a link whose text is only "Back" in a
  page that also has `nav[aria-label=Breadcrumb]`; warn on back links under 32px tall. Restoring state is
  manual.
- **Sources:** [GOV.UK Design System: Back
  link](https://design-system.service.gov.uk/components/back-link/), [WCAG 2.2 Understanding SC 2.5.5
  Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)

### SU-354 Language and region switchers use native names and keep your place
**Rule:** List each language in its own language ("Deutsch", "日本語"), without flags, with `lang` and
  `hreflang` on each link and `aria-current` on the active one. Keep it in one place (header or footer). Switching opens the same page translated, keeps form data, and remembers the choice. Suggest a locale
  from the browser or IP; never force it. Region and currency are a separate control.
- ❌ A menu of country flags with English names ("German", "French"), where one flag stands for a whole
  language.
- ✅ English · Deutsch · Français · 日本語 with the current marked, and "Shipping to Germany · EUR €" set
  separately.
- **Numbers:** Native names; no flags for languages; `lang` + `hreflang` on each link; 1 fixed location;
  region separate
- **Why:** Flags represent countries, not languages (W3C), and many countries share a language or have
  several. WCAG 3.1.2 shows the same pattern: each link text is the language's name in that language,
  with `lang` on the link so screen readers pronounce it. Keeping the page, remembering the choice and a
  separate region control are house defaults.
- **Do:** `<a href="/de/preise" lang="de" hreflang="de">Deutsch</a>`; `aria-current="true"` on the active
  language; a `<button aria-expanded>` that opens the list, 40px+ rows. Map each URL to its translation
  (`<link rel="alternate" hreflang>`), fall back to the locale home only when no translation exists.
  Store the choice (cookie or account), and show a dismissible "View in Deutsch?" suggestion instead of
  redirecting.
- **Where:** Every multilingual site and app; global shops, SaaS and public-sector services.
- **Builds on:** SU-202
- **Measure:** manual for now. Planned check: audit.js: warn on language links with no `lang` attribute;
  warn on flag-only buttons with no text name. Translation parity is manual.
- **Sources:** [W3C: Indicating the language of a link
  destination](https://www.w3.org/International/questions/qa-link-lang.en.html), [WCAG 2.2 Understanding
  SC 3.1.2 Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html)

### SU-355 The account menu is a fixed anatomy at the end of the header
**Rule:** The avatar button sits at the far right, after search and notifications, 32-40px with a 44px
  hit area. The menu is 240-280px wide: a name-and-email header, then Profile, Settings, Billing, Help,
  and Sign out last after a divider. A workspace switcher is a separate control. Signed out, the header
  shows a "Sign in" text link and one primary "Sign up".
- ❌ A 24px avatar placed before the icons, a 170px menu with Sign out first, and no hint of who is signed
  in.
- ✅ A 32px avatar at the far right and a 260px menu: Maya Reyes · maya@acmestudio.co, then Profile,
  Settings, Billing, Help, Sign out.
- **Numbers:** Avatar 32-40px (44px hit); menu 240-280px; Sign out last, after a divider; 1 primary "Sign
  up"
- **Why:** Showing the signed-in identity prevents wrong-account mistakes, and a fixed order lets people
  find Sign out by position. The order, widths and avatar size are house defaults for SaaS headers; the
  menu button follows the W3C APG pattern and the hit area follows WCAG 2.5.5.
- **Do:** `<button aria-haspopup="menu" aria-expanded="false" aria-label="Account menu"><img alt=""
  …></button>`, then the menu pattern (SU-233): `role="menu"`, 36-40px items, Escape returns focus to the
  button. Keep the position the same on every page, including settings screens. Signed out: `Sign in` as
  a text link and `Sign up` as the only filled button.
- **Where:** Every app and logged-in site header; most SaaS and community products.
- **Builds on:** SU-233, SU-245
- **Measure:** manual for now. Planned check: audit.js: warn on an avatar button with no accessible name;
  warn on menu items under 32px. Order and placement are manual or page-map.
- **Sources:** [W3C APG: Menu button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/),
  [WCAG 2.2 Understanding SC 2.5.5 Target Size
  (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
