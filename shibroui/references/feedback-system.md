# Feedback, system states and error pages (SU-326 – SU-334)

Inline messages, banners, copy and share feedback, autosave, offline, 404 and 500 pages, maintenance and
rate limits. They extend states.md (SU-155-161).

### SU-326 Inline messages, banners and announcement bars have different jobs
**Rule:** Use an inline message next to the thing it is about (1-2 lines, icon + text, not
  auto-dismissed), one banner at a time under the header for account-level or loss-of-function problems
  (not dismissible while true), and a 1-line announcement bar for news (dismissible, remembered). Each of
  the four types (info, success, warning, error) has its own icon shape, and space is reserved so nothing
  is pushed down after load.
- ❌ Three same-blue full-width strips stacked under the header; the payment failure has a × and can be
  hidden while it is still true, and the card error shows in a banner far from its field.
- ✅ A 36px announcement bar with a ×, one non-dismissible warning banner with an "Update card" action,
  and a 1-line error with an error icon directly under the card field.
- **Numbers:** Inline: ≤ 2 lines, next to the item; banner: 1 at a time, no ×; announcement bar: 36-44px,
  1 line, × remembered; 4 icon shapes; role=status by default, role=alert only for urgent errors
- **Why:** Atlassian keeps banners for critical, site-wide problems, shows one at a time and does not
  make them dismissible; Carbon's inline notifications sit near the related item and leave the close
  button off when the message must be read or acted on; GOV.UK says people often miss banners, so use
  them sparingly and show one per page. The 36-44px bar height and the four icon shapes are house
  defaults. Screen readers need the right live role (WCAG 4.1.3), and assertive announcements are
  reserved for errors.
- **Do:** Inline: place it after the field and link it with `aria-describedby` (SU-151). Banner:
  `<section aria-label="Payment problem">`; add `role="status"` only if it appears after load, and keep
  it in flow so its space is reserved. Bar: `height:40px`, a labelled `<button aria-label="Dismiss">`,
  and store the dismissal id in `localStorage` (try/catch). Shapes: info = circle i, success = circle
  check, warning = triangle, error = octagon; always icon + text, never color alone (SU-71). If two
  banners compete, show the highest-priority one.
- **Where:** Every SaaS app, dashboard and e-commerce account area; the mix-up (promo and failure styled
  alike) is common on most of them.
- **Builds on:** SU-102, SU-146, SU-160, SU-71
- **Measure:** manual for banner count, dismissibility and icon shapes; audit.js SU-146 already warns on
  `role=alert` or `aria-live=assertive` holding non-error text.
- **Sources:** [Atlassian Design System, Banner usage](https://atlassian.design/components/banner/usage),
  [Carbon Design System, Notification
  usage](https://carbondesignsystem.com/components/notification/usage/), [GOV.UK Design System,
  Notification banner](https://design-system.service.gov.uk/components/notification-banner/)

### SU-327 Copy and share actions confirm in place
**Rule:** A copy button changes its own label and icon to "Copied" for about 2 seconds at the same width,
  announces it politely, then reverts. If copying fails, select the text so Ctrl+C works. Secrets (API
  keys, tokens) get a one-time warning that they will not be shown again. Share uses `navigator.share()`
  on phones and a popover with a read-only URL field plus Copy elsewhere; no toast.
- ❌ The Copy button never changes and a "Link copied to clipboard" toast appears in the corner, away from
  the button.
- ✅ The 104px button reads "Copied" with a check for ~2s, then goes back to "Copy" at the same 104px.
- **Numbers:** ~2s "Copied" state; same button width in both states; 1 polite announcement; share popover
  320px with read-only URL + Copy
- **Why:** The thing the person just touched is where they look for the result, and WCAG 4.1.3 requires
  the result to be exposed to assistive tech without moving focus. `navigator.share()` needs a secure
  context and a user gesture, and `clipboard.writeText()` can reject with `NotAllowedError` (MDN). The
  2-second hold is a house default.
- **Do:** Reserve width: `min-inline-size` from the longest label ("Copied"). The visible text is the
  button's name (SU-140), so "Copied" replaces "Copy" in the name for those 2s; announce it through a
  persistent visually hidden `<span role="status">` that you write "Link copied" into. `try { await
  navigator.clipboard.writeText(url) } catch { input.select() }`. Share: `if (navigator.canShare?.(data))
  await navigator.share(data)` inside the click handler and ignore `AbortError`; otherwise open a
  `popover` with `<input readonly value=…>` and Copy (SU-235). Reset the label with a timer you cancel on
  a second click.
- **Where:** Every docs site, developer tool, share dialog, referral page and code sample.
- **Builds on:** SU-221, SU-146, SU-161, SU-158, SU-140
- **Measure:** manual for now. Planned check: audit.js: warn on buttons named "Copy…" when the page has
  no `role=status` or `aria-live` region (extends the SU-221 copy-button check); manual for width
  stability and the failure path.
- **Sources:** [MDN,
  Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share), [MDN,
  Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText), [WCAG 2.2
  Understanding SC 4.1.3 Status
  Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

### SU-328 Autosave shows state quietly and fails loudly
**Rule:** Save 500-1000ms after typing stops and on blur. Show status as 12-14px muted text: "Saving…"
  only if the save takes over 200ms (kept at least ~500ms, SU-156), then "Saved 2 min ago". A failed save
  becomes persistent and visible ("Could not save. Retrying…") with a Retry button and a local draft;
  warn before leaving with unsaved changes. Don't autosave submit-once or sensitive forms.
- ❌ A failed save is 11px grey text (2.5:1) in the header with no Retry, so the person keeps writing into
  a document that is not being saved.
- ✅ 13px "Not saved" in the warning color, plus a bar under the header: "Could not save. Retrying in 4s."
  with Retry and "A copy is kept on this device."
- **Numbers:** debounce 500-1000ms; status text 12-14px; "Saving…" after 200ms; backoff 1s, 2s, 4s;
  unsaved-changes warning on leave
- **Why:** Practitioner guidance (SaaS UI) agrees on the shape: show the current save state, keep the
  dirty state visible when a save fails, retry with visible backoff, and guard exits with a specific
  warning. MDN advises attaching `beforeunload` only while there are unsaved changes and says it is not
  reliably fired on mobile, so pair it with `visibilitychange`. The 500-1000ms debounce and the 200ms
  "Saving…" threshold (from SU-156) are house defaults.
- **Do:** One status slot in a stable place (`role="status"`), never a toast. Debounce input, flush on
  `blur` and `visibilitychange`. "Saved" means confirmed by the server, not buffered. On error keep the
  text, write a draft to IndexedDB/`localStorage`, show a persistent bar with Retry, and re-attempt at
  1s, 2s, 4s. Add `beforeunload` only while dirty and remove it after a successful save. If the server
  version changed, offer "Reload to see changes" instead of overwriting. Do not combine a visible Save
  button with silent autosave.
- **Where:** Docs and notes apps, page builders, settings screens and long forms.
- **Builds on:** SU-159, SU-160, SU-161, SU-146, SU-156
- **Measure:** manual: throttle the network to offline, type, and confirm the failure state, the draft
  and the exit warning.
- **Sources:** [MDN, beforeunload
  event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event), [SaaS UI, Autosave
  and save-state patterns](https://www.saasui.design/blog/saas-autosave-save-states-ux-patterns), [WCAG
  2.2 Understanding SC 4.1.3 Status
  Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

### SU-329 Offline states keep content and queue changes
**Rule:** When the connection drops, show a persistent top banner ("You are offline. Changes will sync
  when you are back.") in `role="status"`. Keep cached content visible, disable only the controls that
  need the network and say why, and queue writes with a visible "Pending sync" badge. On reconnect show
  "Back online" for ~3s and retry with backoff (1s, 2s, 4s). Never block with a modal.
- ❌ A "No internet connection" modal covers all 3 cached inspections and offers only Retry.
- ✅ A grey status banner, the list still readable, the edited row marked Pending sync, and "Upload
  photos" disabled with "Needs a connection" beside it.
- **Numbers:** 1 banner; "Back online" 3s; backoff 1s, 2s, 4s; pending badge per queued item; 0 blocking
  modals
- **Why:** web.dev advises telling people when the state changes, letting them keep working with queued
  tasks that sync later, and warns against full-screen blocking modals on unstable connections. Workbox
  Background Sync stores failed writes and retries them when connectivity returns. The 3-second "Back
  online" confirmation and the backoff steps are house defaults.
- **Do:** Listen to `online`/`offline` and treat failed fetches as the real signal (`navigator.onLine`
  can be wrong). Banner: `<div role="status">` mounted at load. Disabled controls use
  `aria-disabled="true"` with a visible reason (SU-252). Queue in IndexedDB or Workbox
  `BackgroundSyncPlugin`; show the badge on each queued item. Don't clear the queue until the server
  confirms. Retry with exponential backoff and a cap; a manual "Sync now" button is a good fallback.
- **Where:** Every mobile web app and PWA, field and delivery apps, and any app used on trains or in poor
  coverage.
- **Builds on:** SU-155, SU-156, SU-159, SU-252
- **Measure:** manual: DevTools Network > Offline. Content stays, only network controls disable, queued
  items show a badge, and no modal appears.
- **Sources:** [web.dev, Offline UX design
  guidelines](https://web.dev/articles/offline-ux-design-guidelines), [Chrome for Developers, Workbox
  Background Sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync)

### SU-330 404 pages say what happened and give a way out
**Rule:** Return a real 404 status (use 410 only if you removed the page on purpose), never a 200 "soft
  404". Use the plain headline "Page not found", a line saying the page cannot be found, the full site
  header and footer, 3-5 useful links (home, top sections, support), a search field only if the header
  has none, and the document title "Page not found".
- ❌ Status 200 with the shop's normal title, a 56px "Oops! 404" with no header or footer, and one "Go
  back" button.
- ✅ Status 404, title "Page not found", the site header and footer, and four labelled links to Home,
  Shop, Delivery and Support.
- **Numbers:** HTTP 404; 3-5 links; 1 headline; title "Page not found"; full header and footer; 0 jargon
  or jokes
- **Why:** Google describes a soft 404 as a 2xx response that shows an error, and treats real 4xx codes
  as "content does not exist" (Search Central). The CMS Design System says a 404 should keep the standard
  header and footer, give a clear way to a valid destination, and add search only if there is none.
  GOV.UK uses "Page not found" as the H1 and title and avoids "404" and "oops". Using 410 for deliberate
  removal is a house default, because Google treats 404 and 410 alike.
- **Do:** Server: `res.status(404)` for the template, not a redirect to `/404` with a 200. `<title>Page
  not found – Cedar & Co</title>`, one `<h1>`, links in a `<ul>`. Keep the layout shell so keyboard users
  get the same landmarks and skip link (SU-138). Focus the `h1` only on client-side route misses
  (SU-144). Log the missing URL, and redirect with 301 when you know the new location.
- **Where:** Every website, every domain; soft 404s are a frequent crawl report on SPAs and CMS themes.
- **Builds on:** SU-160, SU-138, SU-139, SU-180
- **Measure:** manual for now. Planned check: audit.js: when the title or h1 contains "not found", warn
  if there is no `header`/`nav` landmark or no link inside `main`; the status code is manual (`curl -I
  <bad-url>` must return 404).
- **Sources:** [CMS Design System, 404 page guidance](https://design.cms.gov/patterns/404-page-guidance),
  [GOV.UK Design System, Page not found
  pages](https://design-system.service.gov.uk/patterns/page-not-found-pages/), [Google Search Central,
  HTTP status codes and soft
  404s](https://developers.google.com/search/docs/crawling-indexing/http-network-errors)

### SU-331 Server errors and maintenance pages are honest and carry a reference
**Rule:** A 500 page says once, in plain words, that the problem is on our side, says what happened to
  the person's work, gives Try again and a status-page link, and shows a copyable request ID with a
  timestamp for support. Never show a stack trace. A maintenance page returns 503 with `Retry-After`,
  states the return time in the viewer's time zone, and says what still works; announce planned work with
  a banner 24 hours ahead.
- ❌ "Oops! Something went wrong." with no next step and a stack trace listing file paths.
- ✅ "Something went wrong on our side", the cart-is-saved reassurance, Try again and Status page, and a
  "req_8f3a1c92 · 20 Oct 2026, 14:07 UTC" box with Copy ID.
- **Numbers:** 1 plain statement of cause; 1 request ID + UTC time; Retry + status link; 503 +
  `Retry-After`; planned work announced 24h ahead
- **Why:** GOV.UK's problem pages say what happened to the person's answers and avoid "500", "technical
  difficulties" and red warning text, and its service-unavailable page says to state when the service
  returns (GOV.UK opens with one "Sorry"; shibroUI keeps to SU-180 and leaves the apology out). MDN
  documents 503 with `Retry-After` for planned downtime; Google slows crawling on 5xx and eventually
  drops URLs that keep erroring, so a 200 maintenance page is worse. The 24-hour notice and UTC ID format
  are house defaults.
- **Do:** Send `HTTP/1.1 503` and `Retry-After: <seconds or HTTP-date>` for maintenance. Generate an ID
  per request, log it with the error, and show it in `<code>` with a Copy button (SU-327). Print the
  return time with the zone (`Intl.DateTimeFormat` with `timeZoneName:"short"`). Say what the person
  saved, or that they must start again. Keep stack traces in logs only. Link a status page that works
  when the app is down.
- **Where:** Every service has outages; the missing reference ID shows up on most consumer apps.
- **Builds on:** SU-160, SU-180, SU-327
- **Measure:** manual for now. Planned check: audit.js: on a page whose title or h1 says error or "went
  wrong", warn when `main` contains a stack-trace pattern (`at .+\(.+:\d+:\d+\)`); manual for the 503
  status and `Retry-After` header.
- **Sources:** [GOV.UK Design System, Problem with the service
  pages](https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/), [GOV.UK Design
  System, Service unavailable
  pages](https://design-system.service.gov.uk/patterns/service-unavailable-pages/), [MDN, Retry-After
  header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After)

### SU-332 Access errors (401, 403, 429) say how to get in
**Rule:** 401: "Sign in to view this" with a button that returns to the same URL after login. 403: say
  access is missing, name the owner or offer "Request access", and show which account is signed in; don't
  reveal private resources to anonymous people. 429: state the wait from `Retry-After`, never auto-retry
  in a loop, and keep whatever was typed.
- ❌ A bare "403 Forbidden" with no owner, no way to ask, and no sign of which account is signed in.
- ✅ "You do not have access to this document", the owner named, a Request access button with an optional
  note, Switch account, and "Signed in as maya@northwind.co".
- **Numbers:** 1 primary action per error; account shown on 403; wait time from `Retry-After`; 0
  automatic retry loops
- **Why:** RFC 9110 defines 401 as a missing or invalid credential that can be retried with new ones, and
  403 as understood but refused, so the same credentials should not be repeated; a server may answer 404
  to hide that a resource exists. MDN documents 429 as rate limiting with an optional `Retry-After`.
  Return-to-URL and the request flow are house defaults.
- **Do:** 401: `/login?next=/doc/123`; validate `next` as a same-origin path. 403: confirm the viewer may
  know the resource exists, otherwise show the 404 page (SU-330); the button posts a request to the owner
  and then says "Request sent". 429: `Retry-After` seconds become "Try again in 14 minutes"; disable the
  action until then, keep form input, and use backoff in scripted clients. Use `role="alert"` only when
  the error replaces content in place.
- **Where:** Any app with accounts, sharing, an admin area or a public API.
- **Builds on:** SU-180, SU-160, SU-330
- **Measure:** manual: `curl -I` a protected URL anonymously and as a signed-in user without access;
  check status, `Retry-After` and the page copy.
- **Sources:** [RFC 9110, HTTP Semantics (401, 403)](https://www.rfc-editor.org/rfc/rfc9110.html), [MDN,
  429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429), [MDN,
  Retry-After header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After)

### SU-333 Live data shows how fresh it is and updates without jumping
**Rule:** Show "Updated 2 min ago" with a Refresh button near the data, pause polling in background tabs,
  and let new items arrive behind a "3 new" pill instead of moving the list while someone reads it. Live
  regions announce summaries, not every tick.
- ❌ A new order is inserted live: the row being read moves down 48px, and nothing says how old the data
  is.
- ✅ "Updated 2 min ago" with a Refresh button, and a "3 new orders" pill; the list stays still until it
  is clicked.
- **Numbers:** freshness text next to the data; 0px shift under the reader; poll paused when
  `document.hidden`; announce a summary at most every ~30s
- **Why:** WCAG 2.2.2 requires a way to pause, stop, hide or control the frequency of auto-updating
  content that starts automatically and sits alongside other content, with no 5-second exception. Status
  updates must reach assistive technology without stealing focus (WCAG 4.1.3). MDN's Page Visibility API
  is the standard way to stop polling when the tab is hidden. The pill and the 30s announcement cap are
  house defaults.
- **Do:** Keep `lastUpdatedAt` in state and render a relative time with `<time datetime>`; refresh the
  text every minute, not every second. Poll with `visibilitychange`: stop on hidden, fetch once on
  visible. Buffer incoming items and show `<button>3 new orders</button>`; insert them only on click.
  Announce "3 new orders" in a `role="status"` region, not each row. Offer a Pause for streams that
  update more than once every few seconds.
- **Where:** Dashboards, order and ticket queues, feeds, chats and status boards.
- **Builds on:** SU-156, SU-146, SU-192
- **Measure:** manual: scroll mid-list, trigger an update, and confirm the row under the pointer does not
  move; check polling stops in a hidden tab.
- **Sources:** [WCAG 2.2 Understanding SC 2.2.2 Pause, Stop,
  Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [WCAG 2.2 Understanding SC
  4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [MDN, Page
  Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)

### SU-334 Surveys and feedback prompts appear once, late and small
**Rule:** Ask right after a completed task, never on load or in a first session. Start with one question,
  in a bottom-left card 320-360px wide with a 44px dismiss, and remember a dismissal for 90 days. Don't
  cover CTAs, consent banners or open forms. Use a thumbs or 5-point scale first and show free text only
  after the rating.
- ❌ A centered modal on load with a 0-10 scale, a text box and a 12px close, dimming the report and its
  Export button.
- ✅ After the export finishes, a 340px bottom-left card asks "How easy was exporting this report?" with a
  5-point scale of 44px buttons and a 44px dismiss.
- **Numbers:** 1 question first; card 320-360px; dismiss target 44px; dismissal remembered 90 days; ≤ 1
  prompt per session
- **Why:** Google's search guidance prefers small banners that take up a small fraction of the screen
  over overlays that cover content. Feedback-pattern guidance (SaaS UI) is to trigger on a completed
  event rather than a timer or page load, start with a single interaction, make the prompt easy to close
  and remember "no". The 90-day memory and 320-360px width are house defaults.
- **Do:** Trigger on a success event and wait 5-10s. A non-modal card is not a modal dialog: use `<aside
  aria-label="Feedback">`, don't set `aria-modal`, and keep focus where it was. Dismiss button 44x44 with
  `aria-label="Dismiss"`; store the choice with a date (try/catch). Reveal the comment field only after a
  rating. Don't show it over a consent banner or when a form is dirty. Cap at one per session.
- **Where:** NPS, CSAT and feedback widgets on most SaaS products and many content sites.
- **Builds on:** SU-235, SU-238, SU-161
- **Measure:** manual; a planned  check: info on a fixed element that overlaps a visible primary button
  (shares the SU-238 check).
- **Sources:** [Google Search Central, Intrusive
  interstitials](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials),
  [SaaS UI, Feedback survey patterns](https://www.saasui.design/blog/saas-feedback-survey-ux-patterns)
