# Commerce: listings and product pages (SU-266 – SU-273)

Catalog grids, filters, prices, variant pickers, galleries and reviews: the pages where a shopper
decides. Most numbers come from Baymard Institute's large-scale usability testing; house defaults are
marked.

### SU-266 Catalog lists have a count, a sort and a filter rail
**Rule:** The list header shows the result count ("31 results") and a sort select aligned right. Name the
  default sort "Featured" or "Relevance", never "Popular", and make sure every product type above 10% of
  the catalog appears in the first ~20 items on desktop and ~10 on mobile. Filters sit in a 240-280px
  left rail from 1024px up, each option with its count and a zero-result option disabled, and in a bottom
  sheet below that whose apply button shows the count ("Show 31 results"). Applied-filter chips follow
  SU-227.
- ❌ No result count, sort named "Popular", a 7-option brand group with no counts and no "Show more".
- ✅ "31 results", sort "Featured", a count per option, a 0-result option disabled, "Show more" after 5
  options.
- **Numbers:** rail 240-280px at 1024px+; bottom sheet below; count beside each option; groups collapse
  after 5 options + "Show more"; type >10% of catalog in first ~20 (desktop) / ~10 (mobile); count on the
  apply button
- **Why:** Baymard recommends a diversity-based "Relevance" default, found testers read "Popular" as
  "Best Selling", and gives the 10%-of-catalog / first 20 (about 10 on mobile) rule; 24% of desktop
  benchmark sites fail to show the range of products in the default sort (Baymard). Showing the number of
  matching products beside each option is called one of the single highest-impact improvements to a
  filter UI, mobile filters use an explicit results button whose count updates, and combinations that
  return nothing should be prevented or given a recovery path (Baymard). The 240-280px rail width and the
  5-option collapse are house defaults.
- **Do:** `<p role="status">31 results</p>` updates on every change (SU-146). Keep filter state in the
  URL (`?brand=osprey`). Disabled options: `aria-disabled="true"` plus the 0 count, so they stay
  focusable and announced. Mobile: a sticky "Filters (2)" button opens a `dialog` sheet (SU-76, SU-236)
  whose primary button reads "Show 31 results" and updates live. Rail:
  `.rail{width:clamp(240px,22vw,280px);position:sticky;top:16px}` inside `@media (min-width:1024px)`
  (SU-173). Chips, "Clear all" and zero-result recovery are SU-227.
- **Where:** every catalog, directory, job board, marketplace and search-results page
- **Builds on:** SU-227
- **Measure:** manual for now. Planned check: audit.js: a list/grid region with no element near its top
  containing a number plus "result(s)/item(s)/product(s)" (info). Default-sort name, option counts and
  the first-20 mix are manual.
- **Sources:** [Baymard: default sort type](https://baymard.com/blog/default-sort-type), [Baymard:
  ecommerce filter UI](https://baymard.com/learn/ecommerce-filter-ui)

### SU-267 Load more beats infinite scroll for catalogs
**Rule:** Product and result grids end in a "Load more" button (or numbered pages) with a count line
  ("Showing 48 of 128") and a thin progress bar; page size 24-48. The footer stays reachable, page,
  filters and sort live in the URL, Back restores the loaded count and scroll position, and focus moves
  to the first newly loaded item while the addition is announced politely.
- ❌ Endless scroll: no count, the URL never changes, the footer keeps moving away, Back lands at the top.
- ✅ "Showing 48 of 128", a progress bar, a 44px "Load 24 more" button, `?page=2&sort=featured` in the
  URL, the footer in reach.
- **Numbers:** page size 24-48; count line "Showing N of M"; 4px progress bar; 44px button; URL carries
  ?page=; focus to first new item
- **Why:** Over 90% of benchmarked "Load more" sites get the Back button wrong, infinite scroll
  effectively prevents reaching the footer, and it should never be used for search results (Baymard via
  Smashing Magazine). Baymard suggests 10-30 products per batch on category pages, 25-75 for search and
  15-30 on mobile; 24-48 is a house default that fills a 2, 3, 4 or 6 column grid evenly. The progress
  bar and focus move are house defaults.
- **Do:** `<button>` (or an `<a href="?page=2">` progressively enhanced) that fetches and appends; after
  each load call `history.replaceState(null,"","?page=2")` so the URL always names the last loaded page,
  and restore up to that page on Back (`history.scrollRestoration = "manual"` plus your own restore,
  SU-226). Move focus to the first new card link (`tabindex="-1"` then `.focus()`), and keep `<p
  role="status" aria-live="polite">Showing 48 of 128</p>`. Reserve card space so appended rows do not
  shift (SU-192). Never auto-trigger on scroll without the button as a fallback.
- **Where:** every shop theme, marketplace and search results grid; "infinite" is the default in many
  page builders
- **Builds on:** SU-226
- **Measure:** manual (needs a browser session: Back restoration, focus move). a planned audit.js check
  could  on a scroll-triggered list with no `button`/`a[rel=next]` and no `[role=status]` count (info).
- **Sources:** [Smashing Magazine / Baymard: pagination, infinite scroll or Load
  more](https://www.smashingmagazine.com/2016/03/pagination-infinite-scrolling-load-more-buttons/)

### SU-268 Prices read in one glance
**Rule:** The current price is the largest, boldest figure; the original price is struck through after it
  in a muted color that still passes 4.5:1. Show one saving (percent or amount, not both). A product with
  variants shows "From $19" instead of a range, figures are tabular and use one number format per list,
  tax or VAT is stated where the region needs it ("incl. VAT"), and bulk items show a per-unit price. Screen readers get "Now $96, was $120", not two bare numbers.
- ❌ The struck $120 is bigger than the $96 and both sit under 3:1 (2.6:1, 2.8:1), two savings ("-20%" and
  "Save $24"), a "$19 - $39" range, no VAT or unit price.
- ✅ $96 at 22px bold, $120 struck at 4.8:1, one "Save 20%", "From $19", "incl. VAT", "$1.20 each".
- **Numbers:** current 20-24px/700; original 14px struck, >= 4.5:1 (e.g. #71717a on white = 4.8:1); sale
  color >= 4.5:1; 1 saving; "From $19"; tabular-nums
- **Why:** Price is one of the five essential attributes of a list item and must stay easy to read
  (Baymard). Muted and sale-colored text still needs 4.5:1 (WCAG SC 1.4.3). A `<del>` price is not
  reliably announced, so "was" needs hidden text. One saving, "From" pricing, per-unit price and VAT
  wording are house defaults.
- **Do:** Format with `new Intl.NumberFormat(locale,{style:"currency",currency})` so symbol, separators
  and position follow the locale (SU-202); keep the same fraction digits on every price in a list, and
  strip ".00" only when all of them are whole. Markup: `<p class="price"><span class="now"><span
  class="sr-only">Now </span>$96</span> <del><span class="sr-only">, was </span>$120</del></p>` and a
  "Save 20%" badge whose text is the only saving. `font-variant-numeric:tabular-nums` (SU-16). Variants:
  "From $19"; bulk: "$24 / pack of 20" with "$1.20 each". Put "incl. VAT" in `.sub` text at 12px+ in a
  muted color that passes 4.5:1.
- **Where:** every storefront, pricing page and invoice; mixed sale, range and unit styles are the most
  common price inconsistency
- **Builds on:** SU-16
- **Measure:** manual for now. Planned check: audit.js: `del`/`s`/`line-through` text with contrast under
  4.5:1; a struck element rendered with a larger computed font-size than its sibling price. Two savings
  in one price block, ranges and unit prices are manual.
- **Sources:** [Baymard: product listing
  information](https://baymard.com/research-articles/product-listing-information), [WCAG 2.2
  Understanding SC 1.4.3 Contrast
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [MDN:
  Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

### SU-269 Variant selectors show what is chosen and what is unavailable
**Rule:** Swatches are 32-40px visuals with a 44px hit area; the selected one gets a 2px ring plus a
  check (not color alone) and the label reads "Color: Navy". Sizes are text buttons at least 48px wide in
  a wrapping grid (up to about 14), not a select. Unavailable options stay visible, dimmed with a
  diagonal strike and named as sold out, with the return date or a backorder where stock allows. Nothing
  is preselected for size: pressing Add without one shows "Select a size" beside the sizes and moves
  focus there. Choosing a variant swaps image and price in place with no layout shift.
- ❌ 22px swatches, selection shown by a pale ring (1.5:1), no color name, Black and XL removed from the
  options, M preselected.
- ✅ 36px swatches with a ring and check, "Color: Navy", Black and XL shown struck and focusable with a
  return date, no size preselected, "Select a size" under the sizes.
- **Numbers:** swatch 32-40px, hit area 44px; size button >= 48 x 44px; ring 2px + check; sizes as
  buttons up to ~14; selected label "Color: Navy"; 0 preselected sizes
- **Why:** Baymard finds size buttons beat drop-downs (71% of benchmark sites use buttons; L.L.Bean shows
  13 shoe sizes without overwhelming), and selected, unselected and unavailable states must look distinct
  (H&M's small ring on the selected size was too subtle) (Baymard). 30% of users who are only told a
  product is out of stock are likely to abandon (Baymard), so show the option, say when it returns and,
  where stock allows, let people order it. The ring needs 3:1 against the page (WCAG SC 1.4.11) and the
  check carries the state beyond color (WCAG SC 1.4.1). No preselected size is a house default: nothing
  is added to the cart unreviewed.
- **Do:** `<fieldset><legend>Color: <span id="c">Navy</span></legend>` with radio inputs visually styled
  as swatches (`aria-label="Navy"`), selected `:checked + span{outline:2px solid
  var(--ink);outline-offset:2px}` plus a check glyph (SU-251). Unavailable: `aria-disabled="true"` (not
  `disabled`) so it stays focusable, strike via `linear-gradient`, text "Sold out, back Nov 12"; prefer
  backorder with a delivery date and keep "Notify me" as the secondary link (Baymard). Keep Add enabled;
  on press without a size, show the error beside the sizes and focus the group (SU-150, SU-151). Give the
  media and price a fixed block size so a swap causes no shift (SU-192). Over ~14 options, group by type
  (Regular/Tall) before reaching for a select.
- **Where:** every product with color, size or plan options; hidden unavailable options and color-only
  selection are common
- **Builds on:** SU-251
- **Measure:** manual for now. Planned check: audit.js: swatch/option controls under 24px (error) or 44px
  (info); a variant `fieldset` whose checked state differs only by color (SU-251). A preselected size on
  a multi-size product and hidden unavailable options are manual.
- **Sources:** [Baymard: always use buttons for size
  selection](https://baymard.com/blog/use-buttons-for-size-selection), [Baymard: let users purchase
  temporarily out-of-stock products](https://baymard.com/blog/handling-out-of-stock-products), [WCAG 2.2
  Understanding SC 1.4.11 Non-text
  Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

### SU-270 One product gallery with a visible thumbnail strip
**Rule:** All product images live in one gallery. On desktop show a main image with a rail or row of
  64-80px thumbnails: show every thumbnail up to about 10; with more, cut the last visible one off
  (optionally labelled "+N") so the rest is signposted. On mobile the main image swipes with a "3 / 14"
  counter (dots only for 5 or fewer). The main image has a fixed ratio, zoom reaches at least 2x native
  (source 2000px or more), video is a thumbnail with a play badge, and thumbnails are buttons with
  `aria-current`.
- ❌ 14 images, but the rail stops after 4 thumbnails with no sign of the rest, and the video thumbnail
  looks like a still.
- ✅ The 5th thumbnail is cut off and says "+10", the video has a play badge, the current image is ringed.
- **Numbers:** thumbnails 64-80px; all shown up to ~10, else partial last + optional "+N"; mobile counter
  "3 / 14"; dots only <= 5; zoom source >= 2000px (2x)
- **Why:** For up to 10-14 thumbnails Baymard calls showing them all the safest desktop design; a cut-off
  last thumbnail was effective on desktop and mobile, and about a third of desktop sites use a "+N" final
  thumbnail, while some test participants missed images that were not signposted (Baymard). The 64-80px
  size, the "3 / 14" counter and dots-only-up-to-5 are house defaults.
- **Do:** `<div role="group" aria-label="Product images"><button aria-current="true" aria-label="Image 1
  of 14">...</button>` for each thumbnail; the main image is `<img width height
  style="aspect-ratio:1/1">` so it does not shift (SU-192). Rail: `max-height:calc(4.5*72px +
  4*8px);overflow:hidden` shows a half thumbnail by design. Mobile: `scroll-snap-type:x mandatory` on the
  track and a `<p aria-live="polite">3 / 14</p>`; arrows as real buttons (see APG carousel). Zoom: serve
  a 2000px+ source via `srcset`, open on tap into a dialog (SU-236); video thumbnails carry a play badge
  and `aria-label="Play video"`.
- **Where:** every product page, listing detail, real-estate or portfolio item
- **Builds on:** SU-259
- **Measure:** manual for now. Planned check: audit.js: gallery `img` whose `naturalWidth` is under 2x
  its rendered width at DPR 2 (SU-259); thumbnail buttons without accessible names or `aria-current`.
  Truncation signal is manual.
- **Sources:** [Baymard: truncating product gallery
  thumbnails](https://baymard.com/blog/truncating-product-gallery-thumbnails), [W3C APG: Carousel
  pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)

### SU-271 The buy box answers the purchase questions above the fold
**Rule:** Order inside the box: title, rating, price, variant, quantity, one primary Add to cart button
  (48-56px, full width in the box), the secondary save/wishlist, then three one-line facts with icons: delivery date, shipping cost or free-shipping threshold, and a returns-policy link. Stock text appears
  only when it is real and low ("3 left"). At 1280x720 the whole box is visible without scrolling; at
  390x844 the price and Add to cart are, with the facts directly beneath.
- ❌ A 40px inline button and no delivery, shipping or returns facts above the fold; they hide in a
  collapsed accordion below it.
- ✅ A 52px full-width button, then "Delivery by Thu, Oct 29", "Free shipping over $75" and "Free returns
  within 30 days · Returns policy", all above the fold.
- **Numbers:** button 48-56px, full width of the box; 3 facts (delivery date, shipping cost/threshold,
  returns link); box inside 1280x720; price + Add inside 390x844
- **Why:** In Baymard testing 64% of test subjects looked for shipping costs on the product page before
  adding to the cart, yet 43% of sites showed no shipping cost or calculator there; pages with a shipping
  estimate somewhere consistently outperformed those without (Baymard). The 48-56px button, the
  three-fact set, the fold targets and the "only when real" stock rule are house defaults.
- **Do:** Put the facts in a `<ul>` under the button, each `<li>` an icon (`aria-hidden="true"`) plus
  text; estimate shipping from location and label it ("to Berlin", with a change link). The primary
  button is the single filled action (SU-121); keep it `width:100%` inside the box and `min-height:48px`.
  Stock: render "3 left" only from real inventory and never as a permanent urgency line. Check at
  1280x720 and 390x844 (SU-120).
- **Where:** every product detail page; the most common gap is shipping cost and returns missing from the
  box
- **Builds on:** SU-121
- **Measure:** manual for now. Planned check: page-map: SU-120 flags a page whose primary action sits
  below the first screen. The three facts and the fold check at both viewport sizes are manual.
- **Sources:** [Baymard: show shipping costs on product
  pages](https://baymard.com/research-articles/show-shipping-costs-on-product-pages)

### SU-272 The mobile add-to-cart bar appears only after the main button leaves
**Rule:** A bottom bar at least 56px tall plus `safe-area-inset-bottom` shows a 40px thumbnail, the price
  with a variant summary, and the same button label. It appears only once the in-page button has scrolled
  out of view above the viewport, sits below sheets and never over the consent banner or a focused field,
  and if no variant is chosen its tap opens the variant sheet. It slides in with a 200ms transform.
- ❌ The bar is on from load, duplicating the in-page button 100px above it, and its 56px has no safe-area
  padding so it sits under the home indicator.
- ✅ The bar appears only after the button scrolls away: 40px thumbnail, "$96", "Navy · M", the same
  button, 56px plus the 34px safe area.
- **Numbers:** bar >= 56px + safe-area inset; thumbnail 40px; slides in over 200ms (transform); shown
  only after the in-page button scrolls off the top; <= 25% of screen height
- **Why:** A fixed bar that covers a focused control fails WCAG SC 2.4.11 unless the page scrolls it into
  view; WCAG names sticky footers as a typical overlap and CSS scroll-padding as a sufficient technique
  (WCAG 2.4.11, C43). A persistent bar that repeats the visible button also eats space. The 56px height,
  the appear-on-scroll-out trigger and the 200ms slide are house defaults.
- **Do:** Observe the in-page button: `new
  IntersectionObserver(([e])=>bar.toggleAttribute("data-show",!e.isIntersecting&&e.boundingClientRect.top<0)).observe(btn)`
  (shown only when the button is above the viewport, not below). `.bar{position:fixed;inset:auto 0
  0;min-height:calc(56px +
  env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);transform:translateY(100%);visibility:hidden;transition:transform
  200ms ease-out,visibility 0s 200ms}
  .bar[data-show]{transform:none;visibility:visible;transition-delay:0s}` and
  `html{scroll-padding-bottom:calc(56px + env(safe-area-inset-bottom))}` (SU-145, SU-176). Stack below
  sheets and the consent banner; hide while the on-screen keyboard is open (`visualViewport`); honor
  `prefers-reduced-motion` (SU-85).
- **Where:** almost every mobile product page and long landing page with a sticky call to action
- **Builds on:** SU-176
- **Measure:** manual for now. Planned check: audit.js: info when a bottom `position:fixed` element has
  no `env(safe-area-inset-bottom)` padding or takes over 25% of the viewport (SU-176). The
  show-on-scroll-out timing is manual.
- **Sources:** [WCAG 2.2 Understanding SC 2.4.11 Focus Not Obscured
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [WCAG 2.2
  Technique C43: CSS scroll-padding](https://www.w3.org/WAI/WCAG22/Techniques/css/C43)

### SU-273 Review summaries filter, sort and show proof
**Rule:** The summary shows the average to one decimal with stars and the count ("4.6 (1,284)") and a
  5-to-1 histogram whose bars are filter buttons, expanded by default. Below it: a sort select (Most
  helpful by default, then Newest, Highest, Lowest) and a customer-photos strip. Each review shows stars,
  a title, date, a verified badge, a 3-5 line clamp with "Read more", and a Helpful button. The rating
  beside the product title links to this block.
- ❌ "4.6 from 1,284 ratings" and one anonymous review: no distribution, no filter, no sort, no verified
  badge, no Helpful.
- ✅ A 5-to-1 histogram of filter buttons (4-star selected), a sort select, 86 customer photos, and a
  review with title, date, "Verified purchase", a 3-line clamp and "Helpful (24)".
- **Numbers:** average to 1 decimal; 5 histogram rows as buttons; one rating filter at a time; default
  sort "Most helpful"; review text clamped to 3-5 lines; hide the histogram at <= 5 ratings
- **Why:** 95% of test users relied on reviews, yet 43% of the 60 top-grossing sites had no ratings
  distribution; 90% of subjects who wanted a specific rating tried clicking the distribution, but only
  61% of sites with a summary made it clickable, and when the filter was hidden or collapsed only 7-11%
  used it. Baymard also recommends hiding the summary at five or fewer ratings (Baymard). "Most helpful"
  as the default sort and the 3-5 line clamp are house defaults.
- **Do:** `<button class="hr" aria-pressed="false" aria-label="Show 4-star reviews, 230">` for each bar;
  behave like radios (selecting one replaces the previous) and show "Showing 4-star reviews" with a clear
  control. Stars as `<span role="img" aria-label="4 out of 5 stars">`. Rating near the title: `<a
  href="#reviews">4.6 (1,284)</a>`. Clamp with `-webkit-line-clamp:3` and a real `<button aria-expanded>`
  for "Read more". Keep the histogram expanded; a collapsed one is hardly used (Baymard).
- **Where:** most product, app, course and service pages with reviews
- **Builds on:** SU-213
- **Measure:** manual for now. Planned check: audit.js: on a page with a rating count, a histogram (3+
  sibling bars with numbers) whose bars are not `button`/`a`; `aria-expanded="false"` wrapping the
  summary (info). Sort default and proof content are manual.
- **Sources:** [Baymard: ratings distribution
  summary](https://baymard.com/blog/user-ratings-distribution-summary)
