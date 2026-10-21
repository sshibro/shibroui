# Account settings and billing (SU-289 – SU-295)

Settings pages, danger zones, notification preferences, sessions and API keys, plan toggles, the billing
page and cancellation.

### SU-289 Settings save per section, and unsaved edits are marked
**Rule:** Each group of text fields has its own Save button that stays enabled, plus Discard, an "Unsaved
  changes" marker and a warning before leaving with unsaved edits. Switches apply immediately and show a
  brief "Saved". Never mix the two models in one form. Layout follows the Settings pattern: 220-260px
  nav, content capped at 640-720px, and below 768px the nav becomes a list that drills into sections.
- ❌ One Save at the bottom covers a text field and a switch, looks disabled after an edit, and nothing
  marks the unsaved name.
- ✅ Display name has Save changes, Discard and an "Unsaved changes" chip; the digest switch saves on
  toggle and says "Saved".
- **Numbers:** 1 save model per control group; Save never disabled; 1 "Unsaved changes" marker; nav
  220-260px; content 640-720px; drill-in under 768px
- **Why:** Primer says to keep the save button enabled, never to mix explicit and automatic saving within
  one form, to use automatic saving for toggle switches and to show whether a change saved. MDN notes
  `beforeunload` can warn about unsaved changes but browsers show only a generic message. The nav and
  content widths are house defaults.
- **Do:** Wrap each text group in its own `<form>` with its own submit; keep the button enabled and
  validate on submit (SU-150). Switches follow SU-240 and show "Saved" in an `aria-live="polite"` region
  (SU-146). Set `beforeunload` only while a form is dirty. On a long page add a sticky save bar. Keep
  `<h2>` text identical to the nav label (SU-129).
- **Where:** Every app has a settings area; teams mix autosave and Save buttons inside one page.
- **Builds on:** SU-240, SU-150
- **Measure:** manual for now. Planned check: audit.js: info on a `disabled` submit button named
  Save/Update at load; info on `role="switch"` inside a form with a submit button (SU-240).
- **Sources:** [Primer: Saving pattern](https://primer.style/product/ui-patterns/saving/), [MDN:
  beforeunload event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)

### SU-290 Destructive account actions live in a danger zone with proportionate friction
**Rule:** Put destructive actions in the last section, set apart by a 1px danger-tone border and a
  heading that names the action. State the consequences and link a data export first. Reversible actions
  use a plain confirm; irreversible ones require typing the account or workspace name; account deletion
  re-authenticates, offers a 14-30 day recovery window and sends a confirmation email. A sole owner must
  transfer ownership first.
- ❌ A red "Delete" beside Save in General, confirmed with "Are you sure? Cancel / OK".
- ✅ A bordered "Delete workspace" section listing 24 projects and 6 members, a restore window, an export
  link and a field that asks for "acme-studio".
- **Numbers:** last section; 1px danger border; 14-30 day recovery; type the name for irreversible;
  button names the object
- **Why:** GitHub puts delete in a Danger Zone, makes you type the repository name and can restore some
  repositories within 90 days. GDPR Art. 17 gives people a right to have personal data erased without
  undue delay, so deletion must be findable. Re-authentication, the recovery window length and the
  ownership transfer are house defaults.
- **Do:** Confirm in a dialog (SU-181, SU-236) whose primary button repeats the verb and object ("Delete
  workspace"); keep it disabled until the typed name matches exactly, with an `aria-describedby` hint.
  Soft-delete for the recovery window and say the date data is purged. Send the confirmation email with
  an undo link. Block deletion while the person is the sole owner and link to transfer.
- **Where:** Any product with accounts needs delete and leave flows, and erasure is a legal expectation
  in many regions.
- **Builds on:** SU-181
- **Measure:** manual: friction depends on server flow. a planned  check: info when a danger-styled
  button sits in a section that is not the last on the page.
- **Sources:** [GitHub Docs: Deleting a
  repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository),
  [GDPR Art. 17: Right to erasure](https://gdpr-info.eu/art-17-gdpr/)

### SU-291 Notification preferences are a topics-by-channels matrix
**Rule:** Rows are topics with a one-line description; columns are at most four channels (Email, Push,
  In-app, SMS) with sticky headers, and each cell is a switch that saves immediately. Group topics under
  headings, add a master "Pause all", and lock security and receipt notices on with a stated reason. On
  mobile each row stacks with its channel switches beneath. Every marketing email ends with one-click
  unsubscribe.
- ❌ Nine flat switches that each repeat "Email me about..." with no grouping and no pause.
- ✅ Comments, Assignments and Weekly digest by Email, Push and In-app, a Pause all switch and a locked
  Security alerts row with its reason.
- **Numbers:** <= 4 channel columns; 1 row per topic; 1 master pause; locked rows show a reason; mobile
  stacks rows
- **Why:** RFC 8058 defines one-click unsubscribe (a `List-Unsubscribe-Post` header and a single HTTPS
  POST), and Google requires it, plus a visible link, for marketing mail from bulk senders (5,000+
  messages a day to Gmail). GitHub lets you choose delivery channels per kind of activity. The matrix
  shape and the column cap are house defaults.
- **Do:** `<table>` with `<th scope="col">` channels and `<th scope="row">` topics; each switch is
  `role="switch"` named "Comments, Email" via `aria-labelledby` row plus column ids. Locked cells use
  `aria-disabled` with the reason as text, not a tooltip (SU-252). Save per toggle with "Saved" feedback
  (SU-289). Add `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers plus a
  visible footer link.
- **Where:** Any app that sends notifications needs preferences, and flat toggle lists become
  unmanageable.
- **Builds on:** SU-240
- **Measure:** manual for now. Planned check: audit.js: warn on switch cells whose accessible name lacks
  the topic (only "Email"); info on more than 4 channel columns.
- **Sources:** [RFC 8058: One-click unsubscribe](https://www.rfc-editor.org/rfc/rfc8058), [Google: Email
  sender guidelines](https://support.google.com/a/answer/81126), [GitHub Docs: Configuring
  notifications](https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/configuring-notifications)

### SU-292 Sessions and API keys are lists you can audit and revoke
**Rule:** A session row shows device and browser, approximate location and relative last-active, tags the
  current one "This device" and lists it first, with Sign out per row and "Sign out of all other
  sessions". An API key row shows its name, a masked key (prefix plus last 4), created, last used and
  scope. The full secret appears once at creation in a read-only field with Copy, a warning and an "I
  have copied it" step, and revoke buttons name the key.
- ❌ Unnamed "Chrome" sessions with raw ISO times, and full secret keys visible in the list with a bare
  "Revoke".
- ✅ "MacBook - Chrome - This device", a location and "17 days ago", "CI deploy" with "fn_live_...4f2a",
  and a show-once Copy panel.
- **Numbers:** 1 "This device" row first; key masked to prefix + last 4; secret shown once; revoke names
  the key
- **Why:** OWASP recommends letting users check their active sessions and terminate them remotely. GitHub
  lets you revoke each web session individually. Stripe shows a live secret key you create once, says you
  cannot retrieve it later, and lets you name, expire and rotate keys. The masking format and the "I have
  copied it" step are house defaults.
- **Do:** Return the secret once from the create call and never again; store only a hash. Reveal in
  `<input readonly>` with a Copy button that announces "Copied" (SU-161) and keep the dialog open until
  the person confirms. Name destructive buttons per row ("Revoke CI deploy", SU-225). Ask for recent
  re-authentication before creating or revoking keys. Format last-used with `Intl.RelativeTimeFormat`
  (SU-182).
- **Where:** Any developer-facing or account-secure product lists sessions or tokens.
- **Builds on:** SU-225
- **Measure:** manual: needs the data model. audit.js can only info-flag table cells whose text matches a
  well-known live-key prefix (for example `sk_live_`).
- **Sources:** [OWASP Session Management Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Stripe
  Docs: API keys](https://docs.stripe.com/keys), [GitHub Docs: Viewing and managing your
  sessions](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/viewing-and-managing-your-sessions)

### SU-293 The billing toggle states the saving and keeps both prices
**Rule:** Use a two-option segmented control, "Monthly" and "Annual", with the saving inside it ("Annual,
  save 20%"). Cards show the per-month equivalent and the billed amount ("$8/mo, billed $96 yearly"), the
  monthly price stays visible, prices change in place with no layout shift and the change is announced
  politely. State currency and tax once.
- ❌ An on/off switch between bare Monthly and Yearly labels, and cards that show "$8/mo" with no billed
  total, no saving and no monthly price.
- ✅ A segmented "Monthly / Annual, save 20%", "$8/mo" beside a struck "$10", "Billed $96 yearly" and a
  "USD, excluding tax" note.
- **Numbers:** 2 options; saving in the label; per-month price + billed total; 0px layout shift; 1
  currency/tax note
- **Why:** ROSCA requires a seller to disclose all material terms clearly before taking billing
  information (15 U.S.C. 8403), and a per-month price beside a larger yearly charge is exactly such a
  term. Stripe's pricing table separates prices by billing interval, up to four products per interval. A
  switch means "on now" while a period choice is a mode, so use a segmented control (SU-241). The wording
  and the 20% figure are house defaults.
- **Do:** `<div role="group" aria-label="Billing period">` of two `<button aria-pressed>` or radio
  inputs; update prices with `font-variant-numeric: tabular-nums` and fixed-height price rows; announce
  "Annual prices shown" in `role="status"` (WCAG 4.1.3). Compute the saving from real prices and keep it
  in the label even when Annual is selected. Mirror the same period and total on the checkout page.
- **Where:** Most SaaS pricing pages have a billing-period switch, and many misstate the actual charge.
- **Builds on:** SU-216, SU-241
- **Measure:** manual: needs interaction to detect shifts. a planned  check: info on a `role=switch`
  used to select a billing period.
- **Sources:** [15 U.S.C. 8403 (ROSCA)](https://www.law.cornell.edu/uscode/text/15/8403), [Stripe Docs:
  Pricing table](https://docs.stripe.com/payments/checkout/pricing-table)

### SU-294 The billing page shows plan, next charge, payment method and invoices
**Rule:** The top card shows the plan, price and interval, the next charge date and amount, and the
  payment method (brand plus last 4) with Update. Usage meters read "8 of 10 seats", warn from 80% and
  offer an upgrade at 100%. The invoice table has date, number, amount, a status badge and a PDF link. Plan changes show a proration preview ("Charged $12.40 today") before confirming, and a failed payment
  shows a persistent banner with Update card and the deadline.
- ❌ A plan name with "Manage", a grey seat meter, invoices with no status or PDF, and nothing about the
  failed charge.
- ✅ Team plan, "Next attempt $240.00 on Oct 17 - Visa ending 4242", an amber 8 of 10 seats meter, status
  badges and a failed-payment banner.
- **Numbers:** 1 summary card; meter warns at 80%, upgrade at 100%; invoice columns: date, number,
  amount, status, PDF; banner until paid
- **Why:** Stripe's customer portal groups payment methods, invoices to view or download, plan changes
  and cancellation in one place, and prorations can be previewed before applying with a preview invoice.
  Stripe's recommended retry default is 8 tries within 2 weeks, so the banner should state the deadline.
  The 80% warning is a house default.
- **Do:** Table markup with `<th scope>` and right-aligned tabular amounts (SU-17). Status badges carry
  text, not just color (SU-48). Meter is `<meter>` or `role="progressbar"` with the text value. Plan
  change dialog lists the credit, the new charge and the date; confirm button repeats the verb (SU-178).
  Banner is `role="alert"` on load, and stays until payment succeeds.
- **Where:** Every paid product needs a billing page; unclear next charges and unpaid-state handling
  cause churn and disputes.
- **Builds on:** SU-182
- **Measure:** manual: content depends on billing data. a planned  check: info when an invoice table
  lacks a status column.
- **Sources:** [Stripe Docs: Customer portal](https://docs.stripe.com/customer-management), [Stripe Docs:
  Prorations](https://docs.stripe.com/billing/subscriptions/prorations), [Stripe Docs: Automate payment
  retries](https://docs.stripe.com/billing/revenue-recovery/smart-retries)

### SU-295 Cancelling is as easy as signing up, and trials disclose their end
**Rule:** Cancel is within 2 clicks of the billing page. One screen holds an optional, skippable reason,
  at most one retention offer (pause or discount), and "Keep plan" and "Cancel plan" as equal-size
  buttons. The confirmation states the access end date and what is lost, links a data export and offers a
  way to resubscribe. Trials show the end date and the price after it before any card is taken, and a
  reminder email goes out 3-7 days before the first charge.
- ❌ Step 1 of 4, a 52px "Keep my plan" beside an 11px grey "continue cancelling" link, and no access end
  date.
- ✅ One screen with an optional reason, one "Pause plan" offer, equal "Keep plan" and "Cancel plan"
  buttons, and "access until Nov 14, 2026" with an export link.
- **Numbers:** <= 2 clicks to cancel; 1 screen; 1 offer; equal 44px buttons; end date shown; trial
  reminder 3-7 days before charge
- **Why:** ROSCA (15 U.S.C. 8403) makes online subscription charges unlawful unless the seller clearly
  discloses all material terms before taking billing information, gets express informed consent, and
  provides simple mechanisms to stop recurring charges. The FTC's 2024 click-to-cancel rule was vacated
  by the Eighth Circuit on 8 July 2025, so ROSCA and state auto-renewal laws are what apply; check
  current law. Stripe sends a hosted reminder 7 days before a trial ends (with a cancellation link) and
  its `trial_will_end` event fires 3 days before. The 2-click limit and equal buttons are house defaults.
- **Do:** Put "Cancel plan" in Billing, not behind support. Cancel at period end by default, and show the
  date. Keep the reason a skippable `<select>`. Show one offer inline, not a wizard. Confirm by email and
  show a Resubscribe button on the billing page. For trials, print "Free until Nov 3, then $24/month"
  next to the card field and let people cancel from the reminder email.
- **Where:** Subscriptions are everywhere and regulators target hard-to-cancel flows.
- **Builds on:** SU-236
- **Measure:** manual: flow-level. audit.js can only check that button pairs in a cancel dialog have
  equal height and a visible Cancel label.
- **Sources:** [15 U.S.C. 8403 (ROSCA)](https://www.law.cornell.edu/uscode/text/15/8403), [Latham: Eighth
  Circuit vacates FTC click-to-cancel
  rule](https://www.lw.com/en/insights/eighth-circuit-vacates-ftc-click-to-cancel-rule), [Stripe Docs:
  Trial compliance](https://docs.stripe.com/billing/subscriptions/trials/manage-trial-compliance)
