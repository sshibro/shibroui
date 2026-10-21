# Content, docs, help and legal pages (SU-296 – SU-305)

Blog indexes, articles, docs, help centers, contact pages, legal text and email signup: pages that are
read, scanned and returned to.

### SU-296 Blog index items show title, date, time and excerpt on one pattern
**Rule:** Every post card uses one thumbnail ratio (16:9 or 3:2) and the same slots in the same order: category, title (2-3 lines), 1-2 line excerpt, date and reading time. At most one featured post is
  larger. Show 9-12 posts per page with pagination or Load more, up to 8 category chips, and make the
  whole card one link.
- ❌ Thumbnails at 1:1, 16:9 and 4:3; one card has no date, another no excerpt or category.
- ✅ Every card is 3:2 with category, title, excerpt and "Oct 14 · 6 min read"; the whole card is one
  link.
- **Numbers:** one ratio (3:2 or 16:9); title 2-3 lines; excerpt 1-2 lines; 9-12 per page; up to 8 chips;
  "Oct 14 · 6 min read"
- **Why:** Equal slots in equal order let people scan by topic, date and length instead of decoding each
  card. Inclusive Components makes the heading the card's main link and warns that repeated "read more"
  links are unhelpful out of context and add tab stops. A Load more button keeps the footer reachable and
  reduces the problems of classic infinite scroll (NN/g). The 9-12 page size and the 8-chip cap are house
  defaults (9 or 12 fills a 3-up grid).
- **Do:** `<ul>` of `<li><article>`; `img { aspect-ratio: 3/2; object-fit: cover }` with width and height
  attributes (SU-192). Link the heading: `<h2><a href>` with `article { position: relative } a::after {
  content: ""; position: absolute; inset: 0 }` so the whole card is one target. The trade-off is that
  card text can no longer be selected; Inclusive Components notes people rarely need to, and offers a
  click handler if they do. Use `<time datetime>` for the date. Chips are a filter nav with
  `aria-current` on the active one (SU-246); beyond 8 put the rest under "More". Load more announces "12
  more posts loaded" (SU-146) and moves focus to the first new card.
- **Where:** Every blog, news, resources and case-study index; the default content page of most company
  sites.
- **Builds on:** SU-219 (the article these cards open), SU-106 (consistent frames), SU-226 (Load more vs
  pagination)
- **Measure:** manual for now. Planned check: audit.js: warn when sibling `article` cards in one list
  render thumbnails at aspect ratios more than 5% apart; info when a card holds two or more links to the
  same URL.
- **Sources:** [Inclusive Components: Cards](https://inclusive-components.design/cards/), [NN/g: Infinite
  scrolling tips](https://www.nngroup.com/articles/infinite-scrolling-tips/)

### SU-297 The article byline block is complete and compact
**Rule:** Directly under the title: an optional one-line deck, then one byline row with a 32-40px avatar,
  a linked author name, the published date, an "Updated" date only when the change is material, and
  reading time. Sharing is a compact inline row (copy link plus 2-3 targets), never a floating bar over
  the text.
- ❌ Plain "By Maya Okafor" with the date tucked into the first paragraph and a floating share stack
  covering the edge of the text.
- ✅ A 36px avatar, linked name and "Oct 14, 2026 · Updated Oct 21 · 6 min read" in one row, with an
  inline share row.
- **Numbers:** one byline row; avatar 32-40px; "Updated" only for material changes; share = copy link +
  2-3 targets; deck 1 line
- **Why:** Google's helpful-content questions ask for bylines that link to background about the author,
  and warn against changing dates to look fresh when the content has not substantially changed. NN/g
  advises a byline when credentials or a personal view support credibility and says to link the name to a
  bio page, not an email address. The 32-40px avatar fits the avatar scale (SU-245); the share-row size
  and count are house defaults.
- **Do:** `<a rel="author" href="/authors/maya">Maya Okafor</a>`, `<time datetime="2026-10-14">`, and
  `<time datetime="2026-10-21">` after "Updated". Output `Article` JSON-LD with every shown author in
  `author` (Person, with `url`), plus `datePublished` and `dateModified`, kept in step with the visible
  dates. Share targets are real links with names ("Share on X"); copy link announces "Link copied"
  (SU-146). Captions and alt text follow SU-219 and SU-141.
- **Where:** Every article, news item, case study and changelog post.
- **Builds on:** SU-219 (article layout), SU-245 (avatars)
- **Measure:** manual for now. Planned check: audit.js: info when an `article` has an `h1` but no
  `time[datetime]` and no link with `rel="author"` near the title. Floating share bars covering text:
  page-map or manual (the controls are hard to identify reliably).
- **Sources:** [Google: creating helpful content (who, how,
  why)](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [NN/g: Bylines
  for web articles](https://www.nngroup.com/articles/bylines-for-web-articles/), [Google: Article
  structured data](https://developers.google.com/search/docs/appearance/structured-data/article)

### SU-298 The end of an article hands the reader on
**Rule:** After the body, in this order: a 2-line author bio, one call to action that matches the topic,
  and 3 related items in the same card pattern as the blog index (3-up on desktop, stacked on mobile). Series get previous/next links with titles. A newsletter sign-up is a single email field in the flow,
  never a popup over the text. Comments come last.
- ❌ No bio, a newsletter popup covering the last paragraph, and eight tiny grey "you may also like" text
  links.
- ✅ A 2-line bio, one inline "Get the checklist" CTA with a single email field, and 3 related cards.
- **Numbers:** bio 2 lines; 1 CTA; 3 related items; email field only; no popup over the text
- **Why:** NN/g puts a brief bio at the bottom of the article. A promotional overlay that blocks the
  content is also a search-quality problem, and Google says its advice on intrusive interstitials applies
  to all kinds of promotional dialogs, newsletter sign-ups included. Three related items, 2-line bios,
  and not showing a prompt again for 30 days are house defaults: enough choice to continue, few enough to
  compare at a glance.
- **Do:** Same card markup as SU-296 for related items, chosen by shared topic rather than recency.
  `<aside aria-labelledby="more">` for the related block with `<h2 id="more">Keep reading</h2>`. CTA copy
  names the outcome (SU-178); the email field has a visible label (SU-148). Previous/next use the page
  titles ("Next: Parallel jobs without the flakes"), not "Next". Any prompt is shown after the content,
  is dismissible and is not shown again for 30 days.
- **Where:** Almost every blog, magazine and documentation site; dead-end article ends are common.
- **Builds on:** SU-208 (one call to action), SU-296 (card pattern)
- **Measure:** manual for now. Planned check: page-map: info when the last 600px of an `article` page has
  no link to another page on the site. Popups over the text: manual (timing is not reliably checkable).
- **Sources:** [NN/g: Bylines for web
  articles](https://www.nngroup.com/articles/bylines-for-web-articles/), [Google: avoid intrusive
  interstitials](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials)

### SU-299 The docs shell is three columns with a versioned header
**Rule:** Sidebar 240-280px, content 680-760px (up to 75ch), on-page contents 200-240px. The header
  search shows its shortcut (`/` or Cmd K) and a version selector shows the current version and "latest". Under 1024px the contents column collapses into an "On this page" list at the top; under 768px the
  sidebar becomes a drawer. Old versions show a banner linking to current. Each page ends with
  Previous/Next links that carry page titles, Edit this page and a last-updated date.
- ❌ Two columns with ~1000px of text (about 140 characters per line), no version, no shortcut hint, no
  Previous/Next.
- ✅ 260 / 720 / 220px columns, a "v3.2 latest" selector, a `/` shortcut hint, Previous/Next with titles
  and a last-updated date.
- **Numbers:** sidebar 240-280px; content 680-760px; contents 200-240px; collapse at 1024px; drawer at
  768px; Previous/Next with titles
- **Why:** Line length stays at 75ch or less (SU-15). Docusaurus ships a version dropdown and an
  "unmaintained" banner option for old versions; the "latest" label and the banner link to the current
  page are house practice. GOV.UK says link labels can name the neighbouring pages in previous/next
  pagination and stacks the two links. The column and breakpoint numbers are house defaults in line with
  common docs layouts, not a standard.
- **Do:** Grid: `grid-template-columns: 260px minmax(0, 720px) 220px`. Sidebar items, current item and
  `aria-current` follow SU-228 and SU-251; the contents rail follows SU-207. `<kbd>` in the search button
  (SU-247). Version selector is a labelled `select` or menu; the banner reads "You are viewing v2. See
  the latest version" and links to the same page in the latest version when it exists. `<nav
  aria-label="Pager">` with two links, each with a "Previous"/"Next" label and the title.
- **Where:** Every developer product and most SaaS help and knowledge sites.
- **Builds on:** SU-228 (sidebar), SU-207 (contents rail), SU-247 (shortcuts), SU-15 (line length)
- **Measure:** manual for now. Planned check: page-map: column widths at 1280px and the collapse points
  at 1024px and 768px. Prose width is covered by SU-15 (audit.js). Other parts: manual.
- **Sources:** [Docusaurus: versioning](https://docusaurus.io/docs/versioning), [GOV.UK Design System:
  Pagination](https://design-system.service.gov.uk/components/pagination/)

### SU-300 Callouts come in four types and stay short
**Rule:** Allow Note, Tip, Warning and Danger only. Each has a distinct icon shape, a text label, a tint
  with text at 4.5:1, a left rule of 3-4px, and 3 sentences at most. No nesting, and use them sparingly: one or two per screen of text. Use `role="note"`, not `alert`, because the content is static. Warning
  text in forms and policies is bold, with an icon and a visually hidden "Warning".
- ❌ Four callouts with the same info icon, no labels, told apart by blue, green, amber and red only, one
  of them four sentences long.
- ✅ Note, Tip, Warning, Danger: each with its own icon shape, a bold label, a 4px rule and one or two
  sentences.
- **Numbers:** 4 types; left rule 3-4px; text 4.5:1; max 3 sentences; 1-2 per screen of text; role="note"
- **Why:** Colour alone fails WCAG 1.4.1, and text needs 4.5:1 (1.4.3). GOV.UK builds warning text as an
  aria-hidden icon, bold text and a visually hidden "Warning" label. Docusaurus ships five types (note,
  tip, info, warning, danger) and teams add more, so this caps them at four with distinct meanings. The
  3-sentence limit and the 1-2 per screen are house defaults; the four callouts are shown together only
  so the types can be compared.
- **Do:** `<aside class="callout warning" role="note"><svg
  aria-hidden="true">...</svg><p><strong>Warning</strong> ...</p></aside>`. Reserve Danger for data loss
  or irreversible action. Keep the label in the DOM even if the design hides it visually (use
  `visually-hidden`). Dark mode re-tints the surface and keeps the text at 4.5:1 (SU-165). Status in UI
  states uses SU-71, not a callout.
- **Where:** Docs, help articles, forms, policies and release notes.
- **Builds on:** SU-71 (status signals), SU-165 (contrast in both schemes), SU-146 (live regions are for
  changes, not static notes)
- **Measure:** manual: count the callout types and check that each has a label and a distinct icon. Text
  contrast is covered by the existing audit.
- **Sources:** [GOV.UK Design System: Warning
  text](https://design-system.service.gov.uk/components/warning-text/), [Docusaurus:
  Admonitions](https://docusaurus.io/docs/markdown-features/admonitions), [WCAG 2.2 Understanding 1.4.1
  Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)

### SU-301 Help articles end with feedback and an escalation
**Rule:** At the foot of each article: "Was this helpful?" with Yes and No buttons; on No, a labelled
  free-text field that opens in place; the last-updated date; up to 5 related articles; and a "Contact
  support" link that carries the article title into the form. The help link sits in the same place on
  every page. Submitting feedback keeps the reader's scroll position.
- ❌ Two 22px grey thumbs, no follow-up, no related articles, and a small grey "Support" link in the
  footer with no context.
- ✅ Yes/No buttons, a "What were you trying to do?" field after No, last-updated date, 3 related articles
  and a "Contact support" row that names the article.
- **Numbers:** Yes/No buttons (not 22px icons); 1 follow-up field; up to 5 related articles; contact link
  passes the article title
- **Why:** WCAG 3.2.6 (Consistent Help, Level A) requires help mechanisms such as contact details, a
  contact form or a self-help page that repeat across pages to stay in the same relative order. NN/g's
  hub-and-spoke model has spoke pages link back to the hubs in the body of the page, not only in global
  navigation. A free-text answer tells you why an article failed, which a thumb cannot. The 5-article cap
  is a house default.
- **Do:** `<form>` with `<fieldset><legend>Was this helpful?</legend>` and two `<button type="button"
  aria-pressed>`; reveal the textarea with `hidden` removed and move focus to it. Submit with `fetch` and
  replace the form with "Thanks, we read every reply" in a `role="status"` region (SU-146); do not reload
  or scroll. Contact link: `/contact?article=change-billing-email`, which pre-fills the subject. Put the
  date in `<time datetime>`.
- **Where:** Every help center, knowledge base and docs site.
- **Builds on:** SU-217 (FAQ), SU-146 (announce feedback), SU-161 (confirm where it happened)
- **Measure:** manual for now. Planned check: page-map: info when an article page has no element matching
  "helpful" and no link to a contact route in its last 800px. Order of the Help/Contact link across pages
  (WCAG 3.2.6): manual on a sample of pages.
- **Sources:** [WCAG 2.2 Understanding 3.2.6 Consistent
  Help](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html), [NN/g: Customer-service
  hub-and-spoke model](https://www.nngroup.com/articles/customer-service-model/)

### SU-302 The help center home is search, categories and a fallback
**Rule:** Top to bottom: a heading and one search field, full width up to a 560-720px container; 6-8
  category cards (icon, name, one-line description, article count); 5-8 popular articles; and a "Contact
  us" card at the bottom with hours and expected response time. No second search box if the header
  already has one.
- ❌ A 220px search, twelve bare category links in three columns, no popular articles, no way to reach a
  person.
- ✅ A full-width search, six cards with description and count, five popular articles, and a contact card
  with hours and "replies in about 4 hours".
- **Numbers:** search 560px+ on desktop (full width below); 6-8 categories; 5-8 popular articles; 1
  contact card with hours and response time
- **Why:** NN/g's hub-and-spoke model makes one customer-service page the hub, with Contact Us and FAQ
  presented at the same level and spokes linking back. NN/g's Contact Us guidance adds stating hours with
  time zones and a response window. The 560px search width, 6-8 categories and 5-8 popular articles are
  house defaults.
- **Do:** One `<form role="search">` with a visible label or `aria-label`; the `type="search"` input is
  at least 44px tall (SU-244). Categories are a list of links (`<ul>` of `<a>`, whole card one target,
  SU-296 technique). Popular articles come from real traffic, not editor taste; refresh monthly. Contact
  card shows what a person can help with, hours with the time zone, and the typical reply time.
- **Where:** Most products with customers; every Zendesk, Intercom or Help Scout style help center.
- **Builds on:** SU-217 (FAQ), SU-244 (search fields), SU-58 (search)
- **Measure:** manual for now. Planned check: page-map: info when the page has more than one
  `[role=search]`, or when no link to a contact route sits in the last 600px. Everything else: manual.
- **Sources:** [NN/g: Customer-service hub-and-spoke
  model](https://www.nngroup.com/articles/customer-service-model/), [NN/g: Contact Us page
  guidelines](https://www.nngroup.com/articles/contact-us-pages/)

### SU-303 The contact page offers a short form and real alternatives
**Rule:** Form: name, email and message, plus a topic select only if it routes the message (3-5 fields at
  most). State the response time above the button and show a confirmation that repeats the email address
  used. Beside the form: email, phone with opening hours and time zone, and the postal address. Chat
  launchers are 56-60px, sit bottom-right and are offset above sticky bars and consent banners.
- ❌ Seven fields with a required phone, no response time, no alternatives, and a 40px chat launcher
  sitting on the cookie banner's Accept button.
- ✅ Three fields, "We reply within 1 business day", email, phone with hours and an address, and a 56px
  chat launcher clear of the banner.
- **Numbers:** 3-5 fields; response time stated; chat launcher 56-60px; offset above banners; phone with
  hours and time zone
- **Why:** NN/g: limit the contact form to 3-5 fields; list hours with time zones; most users expect an
  email or form reply within 24 hours, so state a real window; forms and chat supplement phone and email
  rather than replace them; and chat should not pop up uninvited. Baymard's survey found 14% of online
  shoppers would never give a store their phone number, and recommends an inline reason for the field or
  marking it optional. The 56-60px launcher size is a house default.
- **Do:** `autocomplete="name"` and `autocomplete="email"` with `type="email"`; mark optional fields, not
  required ones, when most are required (SU-149). Confirmation: "Thanks. We sent a copy to
  maya@brightline.example and will reply within 1 business day." in a `role="status"` region (SU-146),
  and keep what was typed on error (SU-154). `<a href="tel:+15550142290">`. Chat launcher: `position:
  fixed; right: 16px; bottom: calc(var(--banner-h, 0px) + 16px)`; it never covers focus (SU-145).
- **Where:** Most company sites have one; nearly all ask for too much or give no reply expectation.
- **Builds on:** SU-148 (labels), SU-149 (mark the exception), SU-145 (focus not covered), SU-153
  (autocomplete)
- **Measure:** manual for now. Planned check: audit.js: info on a contact form with more than 5 visible
  fields or a required `input[type=tel]`; info when a fixed launcher overlaps another fixed element's
  box. Response-time wording: manual.
- **Sources:** [NN/g: Contact Us page guidelines](https://www.nngroup.com/articles/contact-us-pages/),
  [Baymard: Explain why the phone field is required](https://baymard.com/blog/explain-phone-number-field)

### SU-304 Legal pages are readable documents with dates and summaries
**Rule:** Use the article layout: one column at most 75ch, a table of contents, "Effective" and "Last
  updated" dates, a 4-6 line plain-language summary at the top, numbered sections with stable anchors,
  and a link to the previous version when terms change materially. Footer links to Terms, Privacy and
  cookie settings stay on every page.
- ❌ A 12px wall of text with no dates, no summary, no contents and no section numbers.
- ✅ Effective and updated dates with a previous-version link, a 4-line summary, a two-column contents
  list, numbered sections, and the legal links in the footer.
- **Numbers:** column up to 75ch; summary 4-6 lines; 2 dates; numbered sections; stable anchors
- **Why:** GDPR Art. 12 requires privacy information in a concise, transparent, intelligible and easily
  accessible form, in clear and plain language; the same writing suits Terms. NN/g says a contents list
  helps people reach sections low on a long page. The 4-6 line summary is a house default; label it as a
  summary, not the contract.
- **Do:** Same markup as SU-219, with the contents list from SU-207. Numbered sections use descriptive
  ids (`<h2 id="fees-and-refunds">1. Fees</h2>`) so anchors survive renumbering; never change an existing
  id, add new ones. Show `<time datetime>` for both dates and archive the previous version at a stable
  URL. The summary sits in an `aside` labelled "In short" and says it is not the contract. The footer
  legal row is the same on every page (SU-218); cookie settings reopens the consent dialog.
- **Where:** Every site with accounts, payments or tracking.
- **Builds on:** SU-219 (article layout), SU-207 (contents), SU-218 (footer legal row)
- **Measure:** manual for now. Planned check: audit.js: info on a page whose `h1` matches
  /terms|privacy|policy/ and has no `time` element; info when it has no in-page `nav` list. Prose width
  is covered by SU-15.
- **Sources:** [GDPR Art. 12: Transparent information](https://gdpr-info.eu/art-12-gdpr/), [NN/g: Table
  of contents](https://www.nngroup.com/articles/table-of-contents/)

### SU-305 Email signup says what, how often, and what happens next
**Rule:** Put one email field and its button on the same row, both 44px tall (40-48px), stacking below
  480px. The button names the outcome ("Get the weekly digest"), and the lines under the field state the
  frequency, what you send and a privacy link. After submit, replace the form with a message that says
  what to do next ("Check your inbox"). Consent wording and the unticked box follow SU-360. Demo-request
  and lead-gen forms follow the same pattern with at most 4 fields, each non-obvious one (work email,
  company size) with its reason beside it.
- ❌ A `32px` "Email address" field with a "Submit" button, no frequency or promise, and a bare "Thanks!"
  afterwards that says nothing about confirming.
- ✅ A `44px` field and a "Get the weekly digest" button, "One email every Friday" plus a privacy link
  underneath, and "Check your inbox" naming the address and the next click.
- **Numbers:** 40-48px field and button; stack under 480px; 1 frequency line + 1 privacy link; next step
  named after submit; ≤4 lead-gen fields
- **Why:** Baymard surveyed 2,473 US online shoppers: 59% say they get too many newsletters and emails in
  general and 51% say emails come too often from a specific retailer, which is why stating frequency
  before signup matters (Baymard). GOV.UK says to make clear why you ask for an address and to use
  `type="email"` with `autocomplete="email"` and `spellcheck="false"` (GOV.UK). The ICO says pre-ticked
  boxes and silence are not consent (ICO). Showing a duplicate address the same message as a new signup
  stops the form from revealing who is subscribed (OWASP account-enumeration guidance). The 44px size,
  the 4-field cap, the stack point and the outcome-button wording are house defaults.
- **Do:** Use `<input type="email" name="email" autocomplete="email" inputmode="email" spellcheck="false"
  required>` with a real `<label>` (visually hidden is fine in a footer). Lay the row out as
  `display:flex;gap:8px;flex-wrap:wrap` with `.field{flex:1 1 220px}` so it stacks on its own. Keep the
  footer version to one row and put the frequency and privacy lines below it. Three states: success
  replaces the form in a `role="status"` region ("Check your inbox. We sent a confirmation link to
  maya@studio.co"); a recoverable error sits beside the field and is linked with `aria-describedby`
  ("Enter an email address like name@example.com", SU-151); a duplicate address shows the success message
  too ("If this address is new, we sent a confirmation link"). Keep the typed address on error (SU-154).
  Consent wording and the unticked box: SU-360. No popup on first view (SU-359). For B2B demo requests,
  ask for work email, name and one qualifier, and say why: "Work email: so we send the demo link to the
  right inbox".
- **Where:** Most content and marketing sites (footer, article end, blog sidebar); usually built as a
  bare input and button.
- **Builds on:** SU-153, SU-154, SU-178, SU-151, SU-360
- **Measure:** manual for now. Planned check: audit.js: warn on a form with one `input[type=email]` whose
  submit text is Submit, Go, Send or OK; warn when the field or button is under 40px tall or the input
  lacks `autocomplete="email"`. Frequency copy and the success and duplicate states: manual.
- **Sources:** [Baymard, Newsletter frequency](https://baymard.com/blog/newsletter-frequency), [GOV.UK
  Design System, Email addresses](https://design-system.service.gov.uk/patterns/email-addresses/), [ICO,
  What is valid
  consent?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/what-is-valid-consent/)
