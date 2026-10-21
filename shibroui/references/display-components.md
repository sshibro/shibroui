# Display components and media (SU-306 – SU-315)

Carousels, accordions, galleries, lightboxes, video, avatars, steppers, timelines and dashboard tiles:
the display pieces most sites reach for, with the numbers that keep them usable.

### SU-306 Carousels rotate only with a pause control and few slides
**Rule:** Use at most 5 slides, and never auto-rotate on phones or under `prefers-reduced-motion`. A
  carousel that does rotate has a pause button as its first tab stop, shows each slide for 5s or more,
  stops on hover and focus, loops instead of ending, and sets `aria-live` to off while rotating and
  polite when paused. Label each slide by name, or "2 of 5" when it has none.
- ❌ Nine slides rotating every 3s, no pause button, 6px dots, and no sign of position.
- ✅ Five slides at 5s, a pause button first in tab order, "Slide 2 of 5", and rotation that stops on
  hover and focus.
- **Numbers:** ≤ 5 slides; ≥ 5s per slide (3 words per second); pause button first in tab order;
  aria-live off while rotating, polite when paused; no autoplay on phones
- **Why:** WCAG 2.2.2 requires a way to pause, stop or hide content that moves automatically for more
  than 5 seconds. The W3C APG carousel puts the rotation control first in tab order, stops rotation on
  focus and hover, and switches `aria-live` between off (rotating) and polite (not rotating); its "2 of
  5" slide labels are the fallback when slides have no names. NN/g advises 5 or fewer frames, no
  auto-forwarding on mobile, about 3 words per second for timing, and cycling instead of stopping on the
  last frame. In NN/g's Siemens example a panel that auto-rotated every 5 seconds showed a £100 offer
  only about 20% of the time. The 5s minimum per slide is a house default.
- **Do:** `<section aria-roledescription="carousel" aria-label="Autumn offers">` with a `<button>` first
  inside it (its label toggles "Pause rotation" / "Start rotation"). Slides are `role="group"
  aria-roledescription="slide" aria-label="2 of 5"`; put `aria-live="off"` on the slide wrapper while
  rotating and `"polite"` when paused or focused. Skip the timer when
  `matchMedia("(prefers-reduced-motion: reduce)")` matches and below ~600px. Keep anything essential on a
  static part of the page too (NN/g).
- **Where:** Home page heroes, testimonial strips and promo banners on a large share of marketing and
  retail sites.
- **Measure:** manual for now. Planned check: audit.js: warn on `[aria-roledescription=carousel]` whose
  first focusable child is not a button, and info on more than 5 slides. Timing and live-region state are
  manual.
- **Sources:** [WCAG 2.2 Understanding SC 2.2.2 Pause, Stop,
  Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [W3C APG Carousel
  pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/), [NN/g Designing Effective
  Carousels](https://www.nngroup.com/articles/designing-effective-carousels/), [NN/g Auto-forwarding
  carousels and accordions](https://www.nngroup.com/articles/auto-forwarding/)

### SU-307 Carousel controls signal more content and are big enough
**Rule:** Arrows are 44px, vertically centered on the media, and the previous arrow is disabled on the
  first slide unless the carousel loops. Dots are 8-10px inside 24px minimum targets and become an "n /
  total" counter above 7 slides. A content row peeks the next item by 10-20% and scrolls natively
  (`overflow-x: auto` plus `scroll-snap-type`) with 8-16px gaps; it never captures vertical scrolling.
- ❌ Three cards fill the row exactly, 24px arrows with "previous" live on slide 1, and twelve 6px dots.
- ✅ A 14% sliver of the fourth card, 44px arrows with "previous" disabled, and a "1 / 12" counter.
- **Numbers:** 44px arrows; 8-10px dots in 24px targets; counter above 7 slides; 10-20% peek; 8-16px gaps
- **Why:** NN/g says to show how many frames exist and where you are, make controls large enough to
  click, and use a bleed effect (part of the next frame cut off) so people know there is more. WCAG 2.5.8
  sets the 24px target floor; 44px arrows are the house touch goal (SU-61). The 7-slide counter switch,
  the 10-20% peek and the disabled Previous arrow at the start are house defaults.
- **Do:** `.row{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x
  mandatory;overscroll-behavior-x:contain}` and `.card{flex:0 0 calc((100% - 36px) /
  3.14);scroll-snap-align:start}` leaves a 14% peek of the fourth card. Arrows are `<button
  aria-label="Next products">` with `disabled` at the ends; dots are 24px buttons with an 8px `::before`.
  Keep arrows next to the media, not off-screen below it (NN/g).
- **Where:** Product rows, "related items", logo strips and photo galleries on most shops and content
  sites.
- **Builds on:** SU-61
- **Measure:** manual for now. Planned check: audit.js: warn on prev/next buttons under 44px or pager
  buttons under 24px inside a carousel. page-map: info on a horizontal scroll row whose last visible item
  ends exactly at the container edge.
- **Sources:** [NN/g Designing Effective
  Carousels](https://www.nngroup.com/articles/designing-effective-carousels/), [WCAG 2.2 Understanding SC
  2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  [MDN CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap)

### SU-308 Accordion headers are 48px headings over padded panels
**Rule:** Each header is a button that is the only child of a heading, spans the full row (SU-217) and is
  at least 48px tall, over a panel with 16-24px of padding. One level only: never put an accordion inside
  a panel. A URL hash opens its panel, and content everyone needs is not hidden. Add `role="region"` to
  panels only when about 6 or fewer can be open at once.
- ❌ A 34px header row, 6px of panel padding, and an accordion nested inside the open panel.
- ✅ A 52px header row inside an `h3`, a panel with 20px of padding, and no nesting.
- **Numbers:** header in a heading; row ≥ 48px, full width; 16-24px panel padding; 1 level; hash opens
  its panel
- **Why:** The W3C APG accordion puts the header button alone inside a heading with `aria-expanded` and
  `aria-controls`, and advises against `role="region"` once many panels can be open at once (about 6).
  GOV.UK says not to put accordions within accordions because it makes content hard to find. SU-217
  covers the full-row target and trailing caret (NN/g found people tap the label as often as the icon).
  The 48px row and 16-24px padding are house defaults (WCAG 2.5.8 only requires 24px).
- **Do:** `<h3><button aria-expanded="false" aria-controls="p1">Returns and refunds <svg
  aria-hidden="true">…</svg></button></h3><div id="p1" hidden="until-found">…</div>`, or native
  `<details><summary>`. `button{width:100%;min-height:48px;display:flex;justify-content:space-between}`
  and `.panel{padding:16px 16px 20px}`. On load, open the panel that contains `location.hash`;
  `hidden="until-found"` lets in-page search and fragments open it.
- **Where:** Settings pages, mobile filters and footers, and product detail sections (shipping, specs) in
  most apps and shops.
- **Builds on:** SU-217
- **Measure:** manual for now. Planned check: audit.js: info on a `button[aria-expanded]` inside a
  heading that is under 44px tall. Nesting and hash handling are manual.
- **Sources:** [W3C APG Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), [GOV.UK
  Design System Accordion](https://design-system.service.gov.uk/components/accordion/), [NN/g Which icon
  signals an accordion](https://www.nngroup.com/articles/accordion-icons/)

### SU-309 Key-value summaries use a description list with row actions
**Rule:** Use `dl`: a fixed 160-240px label column in muted 14px, a fluid value column in the primary
  text color, hairline dividers between rows, and a "Change" link at the far right with hidden context
  ("Change email"). Stack the label above the value below 640px. An empty value reads "Not provided" with
  an Add action. Keep labels only where the value needs one (SU-27); not for tabular data.
- ❌ Bold "Label:" prefixes run into the value, four identical "Edit" links float at different x
  positions, and the empty phone row is blank.
- ✅ A 180px label column, hairline rows, "Change" at the far right with hidden context, and "Not
  provided" with Add.
- **Numbers:** 160-240px label column; 14px muted labels; hairline dividers; action at the far right;
  stack below 640px
- **Why:** The GOV.UK summary list is a `dl` with a key, value and optional actions per row, and each
  "Change" link carries visually hidden text naming what it changes, so screen reader users know which
  value it edits (WCAG 1.3.1 and 2.4.4). GOV.UK points a missing value at the page that collects it; "Not
  provided" with an Add link is the shibroUI wording. The 160-240px column range and the 640px stack
  point are house defaults.
- **Do:** `<dl><div class="row"><dt>Email address</dt><dd>priya@example.com</dd><dd><a
  href="/account/email">Change<span class="sr-only"> email</span></a></dd></div>…</dl>` with
  `.row{display:grid;grid-template-columns:200px 1fr auto;gap:16px;padding:12px 0;border-top:1px solid
  var(--line)}`. Below 640px (a container query) use `grid-template-columns:1fr auto` and let `dt` span
  the row. Empty: `<dd class="muted">Not provided</dd>` and an "Add phone" link.
- **Where:** Order and confirmation pages, account and profile pages, and admin detail views.
- **Builds on:** SU-27
- **Measure:** manual for now. Planned check: audit.js: warn when two or more links in one `dl` share the
  same accessible name ("Edit") (extends SU-140). Layout is manual.
- **Sources:** [GOV.UK Design System Summary
  list](https://design-system.service.gov.uk/components/summary-list/), [MDN The Description List
  element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl), [WCAG 2.2 Understanding SC
  1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

### SU-310 Ratings read as text and enter with large targets
**Rule:** Display stars at 16-20px with partial fill, and always next to text ("4.6 out of 5" plus the
  review count). The star fill must reach 3:1 against both the empty track and the page. For input, use
  five stars with 44px hit areas, a hover preview, arrow-key support, and let a second click on the
  current star clear it. Half stars are optional.
- ❌ 12px yellow stars at 1.7:1 on white (1.4:1 on the track) with only "(1,284)", and a 20px input row
  with no word for the choice.
- ✅ 18px amber stars at 5.0:1 on white and 4.0:1 on the track, "4.6 out of 5 (1,284 reviews)", and 44px
  input targets with the chosen value in words.
- **Numbers:** 16-20px display stars; text "4.6 out of 5"; fill ≥ 3:1 vs track and page; 44px input
  targets; click current star to clear
- **Why:** WCAG 1.4.11 asks for 3:1 on graphics needed to understand content and 1.4.1 forbids conveying
  information by color alone, so the number must be in text. Ant Design Rate supports half stars and
  clearing by clicking the current value. Native radios give the APG arrow-key behavior for free. The
  44px target is the house touch goal (WCAG 2.5.8 floor is 24px).
- **Do:** Display: `<span class="stars" aria-hidden="true">…</span><span>4.6 out of 5</span>`; partial
  star `background:linear-gradient(90deg,var(--fill) 60%,var(--track) 60%)` with a star `clip-path`.
  Input: `<fieldset><legend>Rate this product</legend>` with five `<input type="radio">` inside 44px
  `<label>`s, `:focus-visible` rings, hover preview with `label:has(~ label:hover)`, and the chosen word
  ("Good") written out beside the stars.
- **Where:** Product pages, app and course listings, review forms and feedback widgets.
- **Builds on:** SU-61, SU-251
- **Measure:** manual (stars are usually images or masks, so contrast and text pairing are not reliably
  checkable).
- **Sources:** [WCAG 2.2 Understanding SC 1.4.11 Non-text
  Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [WCAG 2.2 Understanding
  SC 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [Ant Design
  Rate](https://ant.design/components/rate)

### SU-311 Timelines and activity feeds group by day and age their timestamps
**Rule:** Draw a 1-2px rail with 8-12px dots or 24px icons by event type. Each entry reads actor, verb,
  object, then a relative time for the first 7 days and an absolute date after that, in a `time` element
  whose `title` holds the full date. Day headings group entries, newest first, 20-50 per batch with a
  "Load earlier" button. Status uses an icon as well as color.
- ❌ Colored dots with no icon, a full timestamp with seconds on every row, and no day grouping.
- ✅ Day headings, 24px icons with a check or cross, "12 minutes ago" with the full date on hover, and
  "Load earlier activity".
- **Numbers:** 1-2px rail; 8-12px dots or 24px icons; relative time up to 7 days (SU-182); 20-50 entries
  per batch; day headings
- **Why:** Primer RelativeTime switches from relative to absolute text at a threshold and adds a `title`
  with the full date by default; its default threshold is 30 days, but this skill keeps SU-182's 7 days
  so the whole product agrees. WCAG 1.4.1 rules out color-only status. The 20-50 batch size is a house
  default.
- **Do:** `<h3>Today</h3><ul><li><span class="dot" aria-hidden="true">✓</span><span
  class="sr-only">Merged: </span><strong>Maya Chen</strong> merged <a href="/pull/482">pull request
  #482</a> <time datetime="2026-10-20T14:48:00Z" title="Oct 20, 2026, 2:48 PM">12 minutes
  ago</time></li></ul>`. Format with `Intl.RelativeTimeFormat` (SU-202) and refresh the text each minute.
  Use `role="feed"` only for an infinite stream; a "Load earlier" button keeps keyboard users in control.
- **Where:** Order tracking, audit logs, comment threads, CRM and project activity in most SaaS apps.
- **Builds on:** SU-182
- **Measure:** manual for now. Planned check: audit.js: warn on `time` without a `datetime` attribute;
  info on relative text in a `time` without a `title`.
- **Sources:** [Primer RelativeTime](https://primer.style/components/relative-time), [WCAG 2.2
  Understanding SC 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html),
  [MDN The Time element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time)

### SU-312 Count badges hide at zero and avatar stacks end in a +N button
**Rule:** Count badges are at least 16px tall, use tabular figures, cap at "99+", disappear at zero, and
  put the count in the control's name ("Cart, 99+ items"). Avatar stacks (SU-245) overlap 25-30% with a
  2px ring in the surface color, show at most 5 of one size (24, 32 or 40px), then a "+N" button that
  opens the full list. Names appear in tooltips and accessible names.
- ❌ Eight faces overlapping 50% with no ring, a badge reading "0", and "142" stretching its pill.
- ✅ Five faces at 32px with a 2px ring, "+3" as a button, no badge at zero, and "99+" in a fixed pill.
- **Numbers:** badge ≥ 16px, hidden at 0, capped at 99+, tabular figures; stack: 25-30% overlap, 2px
  ring, ≤ 5 shown then "+N" button
- **Why:** A badge that reads "0" or an unbounded number gives people nothing to act on. Primer's
  AvatarStack overlaps avatars and caps the stack (4 avatars at most) so it stays legible, and WCAG 4.1.2
  needs the count and the "+N" control to have names. SU-245 and SU-246 already set the ring and the 99+
  cap; the 25-30% overlap, 5-avatar limit, hide-at-zero and 16px minimum are house defaults.
- **Do:** `.stack > * + *{margin-inline-start:-9px}` on 32px avatars with `box-shadow:0 0 0 2px
  var(--surface)`. The overflow is `<button aria-label="3 more reviewers">+3</button>` opening a popover
  list (SU-235). Badge:
  `min-width:16px;height:16px;padding-inline:5px;border-radius:999px;font-variant-numeric:tabular-nums`,
  text `n > 99 ? "99+" : n`, omitted when `n === 0`; add the count to the control's name ("Cart, 99+
  items").
- **Where:** Team and assignee rows, cart and notification icons, and tabs with counts on most apps.
- **Builds on:** SU-245, SU-246
- **Measure:** manual (badges have no standard markup). SU-61 and SU-140 checks cover the "+N" button's
  size and name.
- **Sources:** [Primer Avatar stack](https://primer.style/components/avatar-stack), [WCAG 2.2
  Understanding SC 4.1.2 Name, Role,
  Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

### SU-313 Lightboxes are dialogs with a counter, zoom and neighbor preloading
**Rule:** Open from a thumbnail with a 200-300ms transition into a scrim of at least 85% black. Esc,
  arrow keys and swipe navigate; close is a 44px button at the top right; focus is trapped and returns to
  the thumbnail. Show a "3 / 12" counter and a caption, fit the image with 16-24px margins, support pinch
  or double-tap zoom, preload the neighbors, and give every image alt text.
- ❌ A 45% scrim that lets the page grid compete, the image flush to the edges, a 20px close, and no
  counter or caption.
- ✅ An 88% scrim, an inset image with caption, "3 / 12", and 44px close and arrow buttons.
- **Numbers:** ≥ 85% black scrim; 200-300ms open; 44px close and arrows; 16-24px image margin; "3 / 12"
  counter; preload ±1 image
- **Why:** The W3C APG modal dialog pattern traps focus, closes on Escape and returns focus to the
  trigger. PhotoSwipe, a widely used lightbox, ships a "1 / 10" counter, zoom, swipe, arrow-key
  navigation and preloading of nearby slides; its default backdrop is 80% opaque, so the 85% floor here
  is a house default (SU-103 covers the standard modal scrim). The margins and 44px controls are house
  defaults too.
- **Do:** `<dialog aria-label="Photo 3 of 12">` opened with `showModal()`,
  `dialog::backdrop{background:rgb(0 0 0 / .88)}`, `<button aria-label="Close">` at 44px, arrows
  `aria-label="Previous photo"`. `img{max-width:calc(100vw - 48px);max-height:calc(100dvh -
  160px);object-fit:contain}` inside a `<figure>` with `<figcaption>`. On navigate, `new Image().src =
  next.dataset.full` for the neighbors. Under `prefers-reduced-motion`, skip the grow-from-thumbnail
  transition.
- **Where:** Product galleries, portfolios, screenshots in docs and real-estate or travel listings.
- **Builds on:** SU-236, SU-103, SU-65
- **Measure:** manual (open state and zoom are script-driven). a planned  check: warn on a `dialog`
  whose close button is under 44px.
- **Sources:** [W3C APG Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
  [PhotoSwipe options](https://photoswipe.com/options/)

### SU-314 Video players keep controls reachable and never autoplay with sound
**Rule:** Reserve the aspect ratio and show a poster with a duration badge. Autoplay only muted, looping,
  decorative video, with a pause control when it runs over 5s, and honor `prefers-reduced-motion`. Controls are play, a seek bar with a 24px-high target, time, captions, volume and fullscreen, at 44px
  on touch. Space or K plays, arrows seek 5s, F, M and C toggle. Speech has captions, and heavy embeds
  load as a click-to-load poster.
- ❌ Autoplay with sound, a 3px seek bar, 14px icons and no captions button.
- ✅ A poster with a 2:41 badge, a 24px seek target, a CC button, 32px controls, and sound only after a
  click.
- **Numbers:** poster + duration badge; autoplay muted only; 24px seek target (44px touch); arrows = 5s;
  captions on speech; embeds as facades
- **Why:** WCAG 1.4.2 requires a pause or independent volume control for audio that autoplays over 3
  seconds, 2.2.2 does the same for motion over 5 seconds, and 1.2.2 requires captions on prerecorded
  speech. The shortcut set follows YouTube's player: K play, arrows 5s, J/L 10s, F, M and C. web.dev
  notes that many popular embeds include over 100 KB of JavaScript and recommends facades such as
  lite-youtube-embed. The 24px seek height is a house default.
- **Do:** `<video poster="demo.jpg" preload="none" playsinline controls width="1280" height="720"><track
  kind="captions" srclang="en" src="demo.en.vtt"></video>`. Decorative loops: `autoplay muted loop
  playsinline` plus a pause button, and drop `autoplay` when `prefers-reduced-motion` matches. Embeds: a
  `<button>` with the poster that swaps in the `<iframe>` on click, and `loading="lazy"` for anything
  below the fold.
- **Where:** Hero videos, product demos, tutorials and help-center pages on a large share of sites.
- **Builds on:** SU-192
- **Measure:** manual for now. Planned check: audit.js: warn on `video[autoplay]` without `muted`, and on
  `video` without dimensions or aspect-ratio (SU-192); info on a `video` with sound and no
  `track[kind=captions]`. Facades are manual.
- **Sources:** [WCAG 2.2 Understanding SC 1.4.2 Audio
  Control](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html), [WCAG 2.2 Understanding SC
  1.2.2 Captions (Prerecorded)](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html),
  [web.dev Best practices for using third-party embeds](https://web.dev/articles/embed-best-practices)

### SU-315 Dashboard overview: KPI tiles, named comparisons and range presets
**Rule:** A KPI tile has a label, a value in tabular numerals, a delta against a named period ("▲ +12.4%
  vs previous 30 days") and an optional sparkline; all tiles in a row are the same height. The delta
  carries a sign, an arrow and a color together, and the color follows whether the change is good for
  that metric (churn down is green). Lay tiles out 3-4 across on desktop, 2 on tablet, 1 on phone. The
  date control sits top right with presets (Today, 7d, 30d, 90d, Custom), and the selected range plus
  time zone is repeated under the page title. Order the page: headline KPIs, trend chart, breakdown
  table, recent activity.
- ❌ Three tiles showing "12.4%", "3.1%" and "0.4%" in green and red only, no sign, arrow or comparison
  period, and a single "Filter by date" dropdown with no range stated.
- ✅ Equal-height tiles with "▲ +12.4% vs previous 30 days", "▼ −0.4 pts" in green for churn, a sparkline
  each, 7d/30d/90d presets and "Mar 20 – Apr 18, 2026 · Europe/London" under the title.
- **Numbers:** 3-4 tiles across (2 tablet, 1 phone); ≤6 headline tiles; sign + arrow + color + "vs
  previous 30 days"; 5 presets; 1 range subtitle with time zone
- **Why:** Carbon says status indicators should rely on at least two of color, shape or symbol, and that
  a differential indicator needs a +/- sign, caret or arrow, with color optional (Carbon status
  indicators). WCAG 1.4.1 forbids color as the only way to convey information (WCAG Understanding Use of
  Color). Carbon's dashboard guidance puts the most important data at the top of the page, limits the
  number of metrics and uses white space (Carbon dashboards); it gives no tile count or comparison
  period, so the tile counts, the 5 presets, the stated time zone and the section order are house
  defaults.
- **Do:** One `<article>` per tile: `<h3 class="l">Revenue</h3><p class="v">$48,210</p><p class="d"><span
  aria-hidden="true">▲</span><span class="visually-hidden">Up </span>+12.4% <span class="bs">vs previous
  30 days</span></p>`. `.v,.d{font-variant-numeric:tabular-nums}`, value at the display tier of the scale
  (SU-1). Store `goodDirection: up|down` per metric: the arrow follows the sign, the color follows good
  or bad, and a flat change shows "0.0%" in neutral grey. Grid: `repeat(auto-fit,minmax(200px,1fr))` with
  `align-items:stretch`. Presets are a labelled group of buttons (`aria-pressed`), the active one filled,
  and "Custom" opens the range calendar (SU-322). Every tile has loading, empty and stale states
  (SU-155). Leave chart construction to the dataviz skill; the trend chart title states the takeaway
  (SU-185).
- **Where:** Most SaaS and admin apps open on a dashboard or overview; a KPI row is one of the most
  copied admin components.
- **Builds on:** SU-185, SU-27, SU-251, SU-155, SU-16, SU-1
- **Measure:** manual for now. Planned check: audit.js: info on elements named delta, change or trend
  whose text has no +, − or arrow and no "vs" basis; info on numeric tiles without `tabular-nums`. Equal
  tile height (page-map), range presets and comparison basis: manual.
- **Sources:** [Carbon Design System,
  Dashboards](https://carbondesignsystem.com/data-visualization/dashboards/), [Carbon Design System,
  Status indicators](https://carbondesignsystem.com/patterns/status-indicator-pattern/), [W3C WCAG 2.2,
  Understanding SC 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
