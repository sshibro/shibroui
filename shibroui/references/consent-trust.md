# Consent and trust (SU-356 – SU-361)

Cookie consent, preference centres, dark patterns, popups and interstitials, consent at sign-up, and
links that leave the page. Much of it is also law in the EU and UK; the rules state the design, not legal
advice.

### SU-356 Consent banners give reject the same weight as accept
**Rule:** The first layer offers Accept, Reject and Manage as buttons of the same size, weight and
  contrast, with no pre-ticked boxes and no cookie wall. Scrolling or closing is not consent. Prefer an
  in-flow banner at the top of the page; a fixed bottom bar stays under about 25% of the viewport height
  and the page gets `scroll-padding-bottom` (SU-145). Put it in the DOM before the skip link, the one
  exception to SU-138's "skip link first", so keyboard users meet it first. No non-essential scripts load
  before consent. Remember the choice for up to 12 months.
- ❌ A filled "Accept all" with "Reject all" and "Manage" as 12px grey links at 2.5:1.
- ✅ Reject all, Manage and Accept all as equal 40px bordered buttons, in one row at the same weight and
  contrast.
- **Numbers:** 3 equal buttons (40-44px); fixed bar ≤ ~25vh; choice kept ≤ 12 months; 0 non-essential
  scripts pre-consent
- **Why:** CNIL ordered banners changed where refusing was harder than accepting, including a reject
  offered as a link styled far less prominently than the accept button. The EDPB cookie banner taskforce
  records a majority of authorities treating a consent button with no Reject all on the same layer as not
  valid consent. GOV.UK puts the banner before the skip link, says not to make it fixed (it can cover
  focused content, WCAG 2.4.11) and saves the choice for 1 year. The 25vh figure is a house default.
- **Do:** `<div role="region" aria-label="Cookies">` right after `<body>`, before the skip link; three
  `<button>`s with one class. Label by outcome ("Reject all cookies"). Do not set analytics or ad
  cookies, or load their scripts, until accepted. After a choice, hide the banner and confirm it with a
  `role="status"` message. For a fixed bar, add `scroll-padding-bottom` equal to its height.
- **Where:** Nearly every site with EU or UK visitors; unequal buttons are a recurring regulator finding.
- **Builds on:** SU-145
- **Measure:** manual for now. Planned check: audit.js: warn when a region labelled cookie, consent or
  privacy has an accept button and the reject control is an `a` or a smaller or lower-contrast button;
  warn on `position:fixed` regions taller than 30vh. Script loading is manual.
- **Sources:** [GOV.UK Design System: Cookie
  banner](https://design-system.service.gov.uk/components/cookie-banner/), [CNIL: Dark patterns in cookie
  banners, formal
  notice](https://www.cnil.fr/en/dark-patterns-cookie-banners-cnil-issues-formal-notice-website-publishers),
  [EDPB: Report of the work of the Cookie Banner
  Taskforce](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf)

### SU-357 The preference centre is granular and can be reopened
**Rule:** List the categories (Necessary locked on, Analytics, Marketing, Personalisation) as unticked
  checkboxes, each with a one- or two-sentence description and a vendor list link. Save choices, Accept
  all and Reject all are equal buttons. A permanent "Cookie settings" link in the footer reopens the
  centre. Saved changes apply at once, and withdrawing is as easy as agreeing.
- ❌ Analytics and Marketing pre-ticked with no descriptions, only "Accept all" and a small "Save", and no
  way back after closing.
- ✅ Unticked boxes with a sentence each, Reject all · Save choices · Accept all, and "Cookie settings" in
  every footer.
- **Numbers:** 3-4 categories; unticked by default (Necessary locked); 3 equal buttons; 1 footer link on
  every page
- **Why:** GDPR Art. 7(3) says it must be as easy to withdraw consent as to give it, Recital 32 says
  pre-ticked boxes are not consent, and the ICO asks for granular options to consent separately to
  separate purposes. Checkboxes fit because the choices apply on Save (SU-240). Four categories and the
  footer link are common practice, a house default.
- **Do:** `<input type="checkbox" id="analytics">` with a visible label and the description in
  `aria-describedby`; the locked category is `checked disabled` with a visible "Always on". Footer: `<a
  href="#cookie-settings">Cookie settings</a>` that opens the same dialog (SU-236) with the current
  state. On save, update the stored choice and stop or start the scripts without a reload where possible.
- **Where:** The same sites as the banner: most sites with analytics or advertising and EU or UK
  visitors.
- **Builds on:** SU-236, SU-240
- **Measure:** manual for now. Planned check: audit.js: warn on consent checkboxes (in a region or dialog
  labelled cookie, consent or privacy) that are checked on first load, apart from a disabled Necessary;
  warn when no link or button named like "cookie settings" or "privacy settings" exists in the footer.
- **Sources:** [GDPR Art. 7: Conditions for consent](https://gdpr-info.eu/art-7-gdpr/), [GDPR Recital 32:
  Conditions for consent](https://gdpr-info.eu/recitals/no-32/), [ICO: What is valid
  consent?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/what-is-valid-consent/)

### SU-358 No dark patterns in choices, urgency or pricing
**Rule:** Pass these checks: decline options use neutral wording ("No thanks"), never shame; countdowns
  and scarcity ("Only 2 left") come from real data; nothing is pre-selected that costs money; mandatory
  fees are in the first price shown; there are no double negatives; the decline control has 4.5:1
  contrast and at least 44px height; advertising is labelled.
- ❌ A pre-ticked $19.99 add-on, a $6 fee in 11px type, and "No, I’d rather risk losing my jacket" in 11px
  grey at 2.1:1.
- ✅ An unticked add-on, one $25.99 total including the fee, and "No thanks" as an equal 44px button.
- **Numbers:** "No thanks", not shaming; decline ≥ 4.5:1 and ≥ 44px; fees in the first price; 0
  pre-ticked paid add-ons
- **Why:** The FTC's dark patterns report covers fake urgency and scarcity and hidden fees, and
  deceptive.design catalogues confirmshaming and preselection. The EU Digital Services Act Art. 25 bars
  online platforms from designing interfaces that deceive or manipulate, including giving more prominence
  to certain choices. The contrast and size figures are house defaults tied to WCAG.
- **Do:** Decline and accept share one button component. Compute the total in code, including mandatory
  fees, and show it where the price first appears. Timers read a server deadline that actually ends the
  offer; stock counts come from inventory. Paid options start unchecked; add "Ad" or "Sponsored" to paid
  placements. Write choices as positive statements ("Send me offers"), never "Don’t not send".
- **Where:** A large share of e-commerce, subscription and booking flows; regulated in the EU, UK and US.
- **Builds on:** SU-29
- **Measure:** manual for now. Planned check: audit.js: info on pre-checked checkboxes whose label
  contains a price; info on decline links under 4.5:1 or 24px high. Wording, timers and fee honesty are
  manual.
- **Sources:** [FTC: Bringing Dark Patterns to Light
  (2022)](https://www.ftc.gov/reports/bringing-dark-patterns-light), [EU Digital Services Act, Art.
  25](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_25.html), [deceptive.design:
  Types of deceptive pattern](https://www.deceptive.design/types)

### SU-359 Popups, interstitials and widgets wait and stay clear of the task
**Rule:** No full-screen interstitial or app-install wall before content, and no popup in the first 5
  seconds. Trigger after engagement (about 50% scroll or desktop exit intent), at most once per session,
  as a 320-360px corner card (like SU-334) with a 44px visible close and Escape, and remember the
  dismissal 7-30 days. A chat widget is 56-60px at a 16-24px inset, kept clear of sticky bars and the
  consent banner. App banners are one line, dismissible and not shown on the first visit.
- ❌ A full-page email modal on load with a 12px ×, and a 40px chat bubble sitting on the shipping bar.
- ✅ After 50% scroll, a 320px corner card with a 44px close; a 56px chat bubble 16px above the bar.
- **Numbers:** 0 popups in the first 5s; trigger at ~50% scroll; 1 per session; card 320-360px; 44px
  close; remember 7-30 days; chat 56-60px at 16-24px inset
- **Why:** Google treats intrusive interstitials and dialogs that cover content as harmful to users and
  prefers small banners; it exempts legally required ones such as age gates. NN/g says to wait until a
  popup is relevant, show only one at a time and favor nonmodal overlays at the bottom or side. The
  timings, durations and widget sizes are house defaults.
- **Do:** Corner card: `role="dialog"` (non-modal, `aria-modal` unset), Escape closes, focus returns to
  the page. Store dismissal in `localStorage` with an expiry date and check it before showing. Position
  fixed widgets with `bottom: calc(var(--bar-h) + 16px)` so they clear sticky bars (SU-238); inset
  follows `env(safe-area-inset-bottom)` (SU-176). Age gates and legally required notices are the
  exception.
- **Where:** Newsletter popups, chat bubbles and app banners on most marketing and shop sites.
- **Builds on:** SU-238
- **Measure:** manual for now. Planned check: page-map: a fixed overlay covering over 50% of the viewport
  within 5 seconds of load; audit.js: warn on fixed widgets that overlap a visible fixed bar.
- **Sources:** [Google Search Central: Avoid intrusive interstitials and
  dialogs](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials), [NN/g:
  Popups: 10 Problematic Trends and Alternatives](https://www.nngroup.com/articles/popups/)

### SU-360 Consent at sign-up is separate, unticked and linked
**Rule:** Terms are accepted by a line of text next to the button ("By creating an account you agree to
  the Terms of Service and Privacy Policy") with both linked, or by an unticked checkbox. Marketing
  opt-in is its own unticked, optional checkbox. A newsletter form is one email field with the consent
  text beneath, double opt-in and a "Check your inbox" confirmation.
- ❌ One pre-ticked box: "I agree to the terms, to receive marketing emails and to share my data with
  partners", with no links.
- ✅ Terms and Privacy linked under the button, and "Email me product news and offers (optional)" as its
  own unticked box.
- **Numbers:** 2 separate consents; 0 pre-ticked; Terms + Privacy linked; 1-field newsletter; double
  opt-in
- **Why:** Consent must be distinguishable from other matters (GDPR Art. 7(2)), pre-ticked boxes are not
  consent (Recital 32), and the ICO asks for consent to be unbundled from terms and conditions. Double
  opt-in is a house default. Typed birth dates and age gates belong to SU-242.
- **Do:** `<input type="checkbox" name="marketing">` unchecked with a visible label; terms text in a
  `<p>` with real `<a>` links; do not block the account on marketing. Newsletter: `<input type="email"
  autocomplete="email">`, a consent line, then a confirmation email and a success message.
- **Where:** Every sign-up and newsletter form; bundled or pre-ticked consent is a common GDPR complaint.
- **Builds on:** SU-240
- **Measure:** manual for now. Planned check: audit.js: warn on a checked checkbox in a form with a
  password field whose label mentions marketing, offers, news or partners; info on a label that says
  "terms" with no link. Double opt-in is manual.
- **Sources:** [GDPR Art. 7: Conditions for consent](https://gdpr-info.eu/art-7-gdpr/), [GDPR Recital 32:
  Conditions for consent](https://gdpr-info.eu/recitals/no-32/), [ICO: What is valid
  consent?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/what-is-valid-consent/)

### SU-361 Links that leave, download, call or write say so
**Rule:** A link that opens a new tab shows an icon after the text, carries visually hidden "opens in a
  new tab", and has `rel="noopener"`; use `target="_blank"` only when leaving would lose work (a form or
  checkout) or the page is a reference to compare against. A download link puts the file type and size in
  or beside the text ("Annual report 2025 (PDF, 2.4 MB)"). `mailto:` and `tel:` links show the address or
  number as the link text, and `tel:` is a link on phones only.
- ❌ "Annual report 2025" with no file type, "Partner directory" that opens a new tab without warning,
  "Email our press team" and "Call support" with no address or number to read or copy.
- ✅ "Annual report 2025 (PDF, 2.4 MB)", "Partner directory" with a `1em` icon and hidden "opens in a new
  tab", and the visible address `press@fieldnotes.co` and number `+44 20 7946 0321`.
- **Numbers:** icon 1em after the text; file type + size in the text; tel: link on touch devices only
- **Why:** GOV.UK says to avoid opening links in a new tab and, when one is needed, to put "opens in new
  tab" in the link text (GOV.UK). WCAG technique G201 advises warning before a link opens a new window,
  either in the label or with an icon plus an accessible description; it is advisory, not a required
  success criterion (WCAG G201). NN/g says to default to the same tab, to tell people before the click
  with an icon and descriptive text when a new one is used, and to prefer an HTML gateway page that
  summarises a PDF (NN/g). The 1em icon, putting the size in the text, showing the address as link text
  and the phone-only `tel:` rule are house defaults.
- **Do:** `<a href="https://partners.example" target="_blank" rel="noopener">Partner directory <svg
  class="ext" aria-hidden="true" width="1em" height="1em">…</svg><span class="visually-hidden">(opens in
  a new tab)</span></a>`, with
  `.visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`.
  Modern browsers already imply `noopener` for `target="_blank"`; keep it for older ones. Icon after the
  text, never instead of it, at the text size (SU-256); mirror it in RTL with `[dir=rtl]
  .ext{transform:scaleX(-1)}` (SU-198). Files: `Annual report 2025 (PDF, 2.4 MB)`; prefer a short HTML
  page that summarises the document and offers the download; for very large files (house default: 50 MB
  and up) state the size before the click. `mailto:` text is the address (`press@fieldnotes.co`); on
  desktop show a `tel:` number as plain text or with a Copy button (SU-327), and link it only under
  `(pointer: coarse)`. Anchors under a sticky header: SU-207.
- **Where:** Every site with documents, partner links or a contact section; external and file links are
  usually unmarked.
- **Builds on:** SU-6, SU-9, SU-14, SU-256, SU-198
- **Measure:** manual for now. Planned check: audit.js: info on `a[target=_blank]` with no icon
  (`svg`/`img`) and no "new tab" or "new window" text; warn on `a[href$=".pdf" i]` (also .docx, .xlsx,
  .pptx, .zip) whose text has no file type and size; info on `mailto:` links whose text has no "@" and
  `tel:` links whose text has no digits.
- **Sources:** [GOV.UK Design System, Links](https://design-system.service.gov.uk/styles/links/), [W3C
  WCAG 2.2, G201: Giving users advanced warning when opening a new
  window](https://www.w3.org/WAI/WCAG22/Techniques/general/G201), [NN/g, Opening Links in New Browser
  Windows and Tabs](https://www.nngroup.com/articles/new-browser-windows-and-tabs/)
