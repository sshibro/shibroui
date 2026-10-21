# App patterns: onboarding and notifications (SU-335 – SU-340)

First run, product tours, permission prompts, notification bells and panels, and how relative time is
written.

### SU-335 Onboarding asks little and shows progress
**Rule:** Ask at most 3 first-run questions, each with a visible "Skip for now". A setup checklist has
  3-5 verb-object items with a time estimate each, starts with "Create your account" already checked,
  shows "2 of 5" plus a 6px bar, and can be hidden and resumed from Help. Label demo data "Sample" and
  offer one "Delete sample data" action.
- ❌ "Getting started" with 9 noun-phrase tasks ("Dashboard overview", "Billing overview"), nothing
  checked, no count, and no way to hide or resume it.
- ✅ "Set up Fieldnotes · 2 of 5 done": 5 verb-object items ("Invite a teammate · 1 min"), the account
  step already checked, a progress bar, "Hide checklist", and a Help entry that brings it back.
- **Numbers:** ≤3 questions; 3-5 checklist items; "2 of 5" + 6px bar; 1-2 min per item; 1 "Delete sample
  data"
- **Why:** Appcues' checklist guidance says checklists with more than five items see significantly lower
  completion rates and each item should be action-oriented ("Create your first project", not "Learn about
  projects"). NN/g's test of 4 iOS apps with 70 users found tutorial readers succeeded no more often (91%
  vs 94%, not significant) and rated tasks harder (4.92 vs 5.49 of 7), so keep first-run short and
  skippable. Time estimates, the pre-checked first item, the 6px bar and the "≤3 questions" cap are house
  defaults.
- **Do:** Tie each item to a real event (project created), not a page view. `<ul role="list">` of `<li>`
  with the state as text or a visually hidden "Done"/"To do", the count as text ("2 of 5 done") and
  `<progress value="2" max="5">`. Hiding saves a flag server-side and leaves a Help > "Setup guide" link;
  never trap people behind a full-screen wizard. Questions are `<fieldset>` cards (`radio` or `checkbox`)
  in one or two columns with "Skip for now" as a real button next to Continue. Sample data carries a
  "Sample" badge (SU-246) and one bulk "Delete sample data" in the banner above it. Empty states after a
  skip follow SU-117.
- **Where:** Most SaaS sign-up flows and many consumer apps; first-run screens that over-ask are the
  common failure.
- **Builds on:** SU-117
- **Measure:** manual (flow review). a planned  check: warn on a checklist-like list (`ul`/`[role=list]`
  with a checkbox-like marker per item and a "progress" label) of more than 5 items.
- **Sources:** [Appcues, Checklist best practices](https://docs.appcues.com/checklist-best-practices),
  [NN/g, Mobile Tutorials: skip or read?](https://www.nngroup.com/articles/mobile-tutorials/)

### SU-336 Product tours are short, anchored and skippable
**Rule:** A tour has 3-5 steps (7 at most), shows "Step 2 of 4" and "Skip tour" on every step, and closes
  on Esc. Each step lights up the real control with a ~60% scrim and a 280-320px popover anchored to it,
  never covering it. It starts after the person has context (not at first paint), never replays after
  dismissal, and can be reopened from Help.
- ❌ A 400px popover floating mid-screen over an ~88% dark scrim with no cut-out, "Step 2 of 11", and Next
  as the only button.
- ✅ A 300px popover with an arrow under the lit-up Invite button, "Step 2 of 4", "Skip tour", Back and
  Next, over a 60% scrim.
- **Numbers:** 3-5 steps (max 7); popover 280-320px; scrim ~60%; "Step 2 of 4"; Skip on every step; Esc
  closes
- **Why:** NN/g found that reading an up-front tutorial in 4 iOS apps did not raise success (91% vs 94%)
  and made tasks feel harder (4.92 vs 5.49 of 7), so tours should be short, optional and tied to the
  screen. Ant Design's Tour models this pattern (target-anchored steps, mask on by default, close and
  finish callbacks) but gives no step count, so the 3-5 limit, 300px popover and 60% scrim are house
  defaults.
- **Do:** Anchor with `popover` and anchor positioning (SU-235) or a positioned element; cut the
  spotlight with `box-shadow: 0 0 0 100vmax rgb(24 24 27 / .6)` on a rounded wrapper around the target.
  The popover is `role="dialog"` with `aria-labelledby` and the step count as text; trap focus inside
  while open (SU-144), Esc and "Skip tour" both end it, and focus returns to the control that was focused
  before. Store `tourDismissedAt` and never autoplay again; add "Take the tour" to Help. Respect
  `prefers-reduced-motion` (SU-85). If the target is missing or off-screen, skip that step instead of
  pointing at nothing.
- **Where:** Most SaaS products ship a first-run tour; "it shows every time" is the usual complaint.
- **Builds on:** SU-235, SU-144
- **Measure:** manual. a planned  check: warn on `[role=dialog]` with text matching /step \d+ of (\d+)/
  where the total exceeds 7 or no button named "Skip" or "Close" exists.
- **Sources:** [NN/g, Mobile Tutorials: skip or
  read?](https://www.nngroup.com/articles/mobile-tutorials/), [Ant Design,
  Tour](https://ant.design/components/tour)

### SU-337 Ask for permissions after context, with a pre-prompt
**Rule:** Request notifications, location or camera only after a user gesture that needs it, and put a
  one-sentence in-page pre-prompt first: the benefit, "Allow" and "Not now". Call the browser prompt only
  after a yes. After "Not now" or a denial, wait 30 days or more, then offer again from a setting that
  explains how to re-enable. Never ask on page load.
- ❌ The browser's "wants to show notifications" prompt appears at 0 s on page load, over the page, with
  Block next to Allow.
- ✅ After the reader taps "Follow Ferries", a card says "Get ferry delays as they happen? One
  notification a day at most" with "Allow notifications" and "Not now".
- **Numbers:** 0 requests on load; 1-sentence benefit; 2 buttons (Allow / Not now); 30+ day wait; Chrome
  desktop permission prompts allowed 12% without intent vs 30% after an interaction
- **Why:** web.dev reports that in Chrome desktop 77% of permission prompts were shown without a signal
  of user intent and only 12% of those were allowed, against 30% after a user interaction; it advises a
  pre-prompt that explains what will happen and why, and triggering the native prompt only when people
  react affirmatively. MDN adds that notification consent should be requested only in response to a user
  gesture. The 30-day wait is a house default.
- **Do:** Gate on `Notification.permission === "default"` (and `navigator.permissions.query`) and call
  `Notification.requestPermission()` or `getUserMedia()` inside the click handler of "Allow". "Not now"
  stores a timestamp and closes the card; a `denied` state shows the steps to re-enable in browser
  settings instead of a dead button. State the single benefit and frequency ("at most once a day"). Do
  not use the pre-prompt as a modal wall; keep the page usable (SU-236).
- **Where:** News, e-commerce, social and web-app sites that request push, location or camera; cold
  prompts are the norm.
- **Builds on:** SU-144
- **Measure:** manual. a planned  check: warn when `Notification.requestPermission`,
  `geolocation.getCurrentPosition` or `getUserMedia` is called before any user activation
  (`navigator.userActivation.hasBeenActive` false at call time).
- **Sources:** [web.dev, Permissions best
  practices](https://web.dev/articles/permissions-best-practices), [MDN, Using the Notifications
  API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)

### SU-338 Notification bells cap and name their counts
**Rule:** Put the 24px bell in a 44px button. The badge is at least 16px tall (20px reads better), a
  circle for one digit and a pill after that, hangs off the icon corner without covering the glyph, uses
  tabular figures, is hidden at zero and caps at "99+". Name the button "Notifications, 3 unread",
  announce count changes politely at most once a minute, and mirror the count in the document title as
  "(3)".
- ❌ A 28px button, a 14px badge sitting on top of the bell, "127" spilling out of it, a "0" badge, and no
  accessible name.
- ✅ A 44px button, a 24px bell, a 20px badge offset by -7px so the glyph stays visible, "99+" for 127,
  nothing at zero, and aria-label "Notifications, 3 unread".
- **Numbers:** 24px icon in a 44px button; badge ≥16px (20px); hidden at 0; cap 99+; 1 announcement/min;
  title "(3)"
- **Why:** PatternFly advises showing the unread state only when notifications can be marked read and are
  not almost always present, and says a count is useful in most cases. WCAG 4.1.3 requires status
  messages to be exposed without moving focus, and WCAG 2.5.8 sets a 24px minimum target, so the 44px
  button is comfortably above it. The 99+ cap, 16px badge floor, 44px button and once-a-minute
  announcements are house defaults.
- **Do:** `<button aria-label="Notifications, 3 unread">` with the number in a `<span
  aria-hidden="true">` and `font-variant-numeric: tabular-nums`; zero renders no badge and the label
  drops to "Notifications". Position with `inset: -7px -7px auto auto` and a 2px ring in the surface
  color. Update a polite `role="status"` region at most once a minute, not on every event, and set
  `document.title = "(3) " + base` while count > 0. Do not rely on red alone: the number is the signal
  (SU-71).
- **Where:** The header of most SaaS, social and e-commerce apps.
- **Builds on:** SU-246
- **Measure:** manual for now. Planned check: audit.js: warn on an icon-only button with a badge child
  whose accessible name lacks the count; warn on a badge text of "0" or longer than 3 characters; warn on
  bell buttons under 44px (SU-62).
- **Sources:** [PatternFly, Notification
  badge](https://www.patternfly.org/components/notification-badge/design-guidelines), [WCAG 2.2 SC 4.1.3
  Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [WCAG 2.2 SC 2.5.8
  Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

### SU-339 The notification panel groups, marks and links onward
**Rule:** A 360-420px popover, at most 70vh tall. The header holds the title, "Mark all as read" and a
  settings link; tabs split All / Unread (and Mentions where relevant). Each item has a 32-40px actor
  avatar, a one-sentence summary naming who did what, relative time (SU-340), an unread dot plus tint,
  and opening it marks it read. Group by Today / Earlier, show "You are all caught up" when empty, load
  20 at a time, and end with "View all" to a full inbox with filters and bulk mark/archive.
- ❌ Four rows that all read "New comment on a document you follow": grey placeholder icons, no actor, no
  time, and read looks the same as unread.
- ✅ "Maya Chen mentioned you in Q4 roadmap · 5 min ago" with her avatar, an unread dot and tint, Today
  and Earlier groups, "Mark all as read", All/Unread/Mentions tabs and "View all notifications".
- **Numbers:** width 360-420px; max-height 70vh; avatar 32-40px; 20 per batch; groups Today / Earlier;
  "View all"
- **Why:** GitHub's inbox is the reference for triage: built-in filters (assigned, participating, review
  requests, @mentions), bulk selection with a triage menu, and a Done state kept for 3 months. A panel is
  the quick view of that inbox, so it carries the same read and filter vocabulary. The pixel widths,
  70vh, avatar size and 20-per-batch are house defaults (popover width follows SU-235).
- **Do:** A `popover` with `aria-labelledby` and a focus order of header controls, tabs, list, "View all"
  (SU-144, SU-235). Tabs follow the ARIA tabs pattern (SU-230); items are `<a>` links with a visually
  hidden "Unread" prefix next to the dot, so unread is not color alone (SU-251). Mark read on open and on
  "Mark all as read" with an Undo toast (SU-161). Load in 20-item batches but stop at "View all" so the
  panel never becomes the inbox. Empty state: "You are all caught up" plus a link to settings (SU-117).
- **Where:** Most SaaS, social, e-commerce and collaboration apps.
- **Builds on:** SU-235
- **Measure:** manual. a planned  check: warn on a popover or dialog titled "Notifications" with no
  "Mark all" control, or list items without a `<time>` child (SU-340).
- **Sources:** [GitHub Docs, Managing notifications from your
  inbox](https://docs.github.com/en/subscriptions-and-notifications/how-tos/viewing-and-triaging-notifications/managing-notifications-from-your-inbox),
  [PatternFly, Notification
  badge](https://www.patternfly.org/components/notification-badge/design-guidelines)

### SU-340 Relative time follows one ladder
**Rule:** Use one product-wide ladder: "Just now" under 1 minute, "5 min ago" under an hour, "3 h ago"
  under a day, "Yesterday", the weekday for 2-6 days, then a short date ("Oct 12", with the year when it
  is not the current one) from 7 days on. Always render a `time` element with `datetime` and the full
  local timestamp in `title`; tick only while the page is visible; build strings with
  `Intl.RelativeTimeFormat`, never by concatenation.
- ❌ "0 seconds ago", "1 minutes ago", "180 minutes ago", "1 days ago" and a raw "2026-10-12T14:03:22Z" in
  one feed.
- ✅ Just now, 5 min ago, 3 h ago, Yesterday, Sat, Oct 12; hovering the date shows "Mon, Oct 12, 2026 at
  2:03 PM".
- **Numbers:** <1 min Just now; <60 min; <24 h; 1 day Yesterday; 2-6 days weekday; 7+ days "Oct 12"; tick
  only while visible
- **Why:** Primer's RelativeTime renders relative text within a threshold (default P30D, 30 days) and a
  date beyond it, with a `title` attribute by default. shibroUI shortens the window to 7 days for feeds
  because past a week a weekday becomes ambiguous and "12 days ago" is harder to scan than a date (house
  default). `Intl.RelativeTimeFormat` pluralizes per locale and, with `numeric: "auto"`, yields
  "yesterday", so "1 minutes" and "1 days" bugs go away (MDN).
- **Do:** `<time datetime="2026-10-12T14:03:22Z" title="Mon, Oct 12, 2026 at 2:03 PM">Oct 12</time>`
  (MDN: `datetime` is the machine-readable value). `new Intl.RelativeTimeFormat(locale, { numeric:
  "auto", style: "short" })` for the middle rungs; in English it prints "5 min. ago" and "3 hr. ago", and
  abbreviations differ by locale, so take its output rather than hard-coding "min" or "h". "Just now" is
  a localized string of your own. Re-render on a 60 s timer only while `document.visibilityState ===
  "visible"`, and keep the width stable with `font-variant-numeric: tabular-nums` (SU-16). Dates use
  SU-182 and SU-202.
- **Where:** Every feed, comment list, message thread, activity log and notification list.
- **Builds on:** SU-202
- **Measure:** manual for now. Planned check: audit.js: warn on text matching /\b0
  (seconds?|minutes?|hours?|days?) ago\b/ or /\b1 (seconds|minutes|hours|days) ago\b/; warn on a visible
  ISO-8601 timestamp; info on a relative time not inside `<time datetime>`.
- **Sources:** [Primer, RelativeTime](https://primer.style/components/relative-time), [MDN,
  Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat),
  [MDN, the time element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time)
