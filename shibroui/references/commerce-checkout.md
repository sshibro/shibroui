# Commerce: cart, checkout and confirmation (SU-274 – SU-282)

From "Add to cart" to the order confirmation. Every rule here removes a reason to abandon: hidden costs,
surprise fields, lost input or an unclear next step.

### SU-274 Cart lines carry the whole decision
**Rule:** Each cart line shows a 72-96px image, a linked title, the variant, unit price, a quantity
  stepper and a right-aligned line total in tabular figures. Remove is a text button that offers Undo for
  8 seconds, and Save for later sits beside it. Price changes and stock problems are flagged on the
  affected line with the fix already applied.
- ❌ A 40px thumbnail, a bare quantity box, a 16px "×" that deletes the line at once and no variant text,
  so two sizes look identical.
- ✅ An `80px` image, "Slate / Men's 10", a `−` `1` `+` stepper, a right-aligned `$129.00`, text "Remove"
  and "Save for later", and an 8s "Removed. Undo" bar.
- **Numbers:** 72-96px image; 16-24px between lines; 8s Undo; stepper buttons 36-44px; hairline dividers
- **Why:** Size, colour and quantity are what shoppers re-check before paying, so every fact that defines
  the line belongs on it (house default). A one-click delete with no way back loses items; Undo beats a
  confirm dialog (SU-161). The 8s window and 72-96px image range are house defaults, the 5s floor comes
  from SU-161; a 16-24px icon is below the 44px target (SU-62) and at or under the WCAG 2.2 SC 2.5.8
  minimum unless spacing makes up the gap.
- **Do:** `<article>` per line with `<a>` title, `<output>` for the line total (it announces on change),
  `<button>Remove<span class="sr-only"> Trail Runner 2</span></button>`. On Remove, hide the row, show
  `role="status"` text "Removed Trail Runner 2. Undo" and restore on Undo; delete server-side only after
  the timer (or keep a soft delete). Use `font-variant-numeric: tabular-nums` and `text-align: end` on
  totals (SU-16). Stock/price flags are text with an icon, not colour alone (SU-71).
- **Where:** Every online shop, food-ordering app and booking basket. Removal-with-undo is missing on a
  large share of small-store carts.
- **Builds on:** SU-161, SU-16, SU-61
- **Measure:** manual for now. Planned check: audit.js: cart-like list items (`[class*=cart] li`,
  `article`) with a `button` named only "×"/"Remove" without the product name in its accessible name;
  `img` under 64px inside a cart line. page-map: line total column right-aligned. Undo and stock flags
  are manual.
- **Sources:** [WCAG 2.2 Understanding SC 2.5.8 Target Size
  (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [WCAG 2.2
  Understanding SC 4.1.3 Status
  Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

### SU-275 The cart summary shows the real total before checkout starts
**Rule:** The summary lists subtotal, shipping (an estimate, or a progress bar toward the free-shipping
  threshold), tax estimate and total. The promo field hides behind an "Add a code" link. Express wallets
  sit above one full-width Checkout button, both 48-56px tall, separated by an "or" divider. At desktop
  widths the summary is a sticky 320-400px right column.
- ❌ "Subtotal $197.00, shipping and taxes calculated at checkout", an open promo input, and a 36px
  Checkout button.
- ✅ Subtotal, `$6.95` shipping, "You are $12.00 away from free shipping" with a bar, tax, total, an "Add
  a code" link, three `48px` wallets, "or", then a `52px` Checkout.
- **Numbers:** 48-56px buttons; 320-400px sticky column; threshold bar 4-8px; 3 wallets max
- **Why:** Extra costs too high is the top reason shoppers who were not just browsing abandon at checkout
  (40%), and 12% leave because the total cost was not visible up front (Baymard); a hidden total forces
  them to start checkout to learn it. Hiding the promo field behind a link so people do not leave to hunt
  for codes is common practice, but treat it as a house default. Threshold bar, wallet count and sizes
  are house defaults.
- **Do:** `<aside aria-labelledby>` with a `<dl>` or table of rows; the bar is `<progress value max>`
  plus text (the text carries the meaning). Wallet buttons use each provider's official button at the
  shared height; show a wallet only where it is supported (SU-280). `position: sticky; top: 16px` on the
  aside; below 900px the summary moves under the lines, with Checkout fixed to the bottom edge only if it
  never covers content (SU-176).
- **Where:** Every shop cart page and drawer. Hidden shipping and tax is still the default on most small
  stores.
- **Builds on:** SU-121, SU-62
- **Measure:** manual for now. Planned check: audit.js: on cart-like pages, warn when the text
  "calculated at checkout" is the only shipping/tax content; warn when the primary checkout button is
  under 44px tall. page-map: loud buttons in the summary (SU-121). Threshold copy is manual.
- **Sources:** [Baymard: reasons for checkout
  abandonment](https://baymard.com/lists/cart-abandonment-rate), [Apple HIG: Apple
  Pay](https://developer.apple.com/design/human-interface-guidelines/apple-pay)

### SU-276 The mini-cart drawer confirms the add
**Rule:** After Add to cart, open a 400-440px drawer with the just-added item highlighted, up to 5 lines
  visible before it scrolls, a subtotal, "View cart" as secondary and "Checkout" as primary. Focus moves
  in and returns to the trigger on close; Esc closes it. The header count updates and is announced. Never
  auto-close while hovered or focused.
- ❌ A 260px popover with no highlight or subtotal, two equal filled buttons, a 3s auto-close and a header
  count that still says 2.
- ✅ A `420px` drawer: "Added to cart", the new beanie highlighted, subtotal `$197.00`, "View cart"
  outline and "Checkout" filled, header badge `3`.
- **Numbers:** 400-440px wide; 5 lines visible; 48px Checkout; scrim .4-.5; count announced
- **Why:** The shopper needs proof the add worked and a clear next step; Baymard finds that added-to-cart
  overlays lacking item details cost confidence, and unclear paths in the confirmation slow people down.
  A drawer that traps focus follows the modal dialog pattern (W3C APG). WCAG 2.2.1 only allows a timed
  close when there is an alternative, so do not time it out under the pointer or focus. Width and line
  count are house defaults extending SU-237.
- **Do:** `<dialog>` with `showModal()` (or a non-modal `role="complementary"` panel if the page stays
  usable) and `aria-labelledby`; move focus to the heading or Checkout, restore to the Add button. Update
  the badge text and an `aria-live="polite"` region ("Wool beanie added. Cart has 3 items"). Pause any
  timer on `:hover` and `:focus-within`, or skip the timer. Full-width under ~600px (SU-237).
- **Where:** Most Shopify-style themes and many headless stores; the other common patterns are a toast or
  a hard jump to the cart page.
- **Builds on:** SU-237, SU-144, SU-146
- **Measure:** manual for now. Planned check: audit.js: warn when `[role=dialog]` cart panels have no
  `aria-label(ledby)`; warn on a cart-count element outside any live region. Behaviour (focus return, no
  auto-close on hover) is manual.
- **Sources:** [Baymard: added-to-cart confirmation
  examples](https://baymard.com/ecommerce-design-examples/added-to-cart-confirmation), [W3C APG: modal
  dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [WCAG 2.2 Understanding SC
  2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)

### SU-277 Checkout is one short path with guest first
**Rule:** Make guest checkout the most prominent option and put sign-in in a text link above the form. Budget about 12 form elements in total: no confirm-email field, phone optional with a stated reason, no
  forced password. Use 3-4 steps (Contact, Delivery, Payment, Review) labelled "Step 2 of 4", or one
  page. Finished steps collapse to a summary with an Edit link, and Back keeps everything typed.
- ❌ "Create an account to check out" with 6 fields (confirm email, confirm password, required phone) and
  a 12px grey "Continue as guest".
- ✅ "Checkout as guest" with `Step 1 of 4`, one email field, a "Sign in" text link and "You can create
  one after you order".
- **Numbers:** ≈12 form elements (7-8 fields); 3-4 steps; 0 forced accounts; 1 field for email
- **Why:** The average US checkout shows 23.48 form elements by default; Baymard considers 12-14 ideal,
  and 18% of shoppers who were not just browsing abandoned because the site required account creation
  (Baymard). Collapsing finished steps into summaries lets people verify without reopening them (Baymard
  accordion checkout). Re-asking for data already given fails WCAG 3.3.7. (Baymard also found 42% of
  sites ask for an account at the start of checkout or before placing the order.)
- **Do:** Order steps as `<ol>` with `aria-current="step"` and visible text "Step 1 of 4". Remove
  duplicate-entry fields (`email` confirm, `password` confirm); show the password with a toggle if one is
  asked. State why the phone is needed or drop it. Keep state in the session so Back and reloads restore
  values (SU-154). Accordion steps: collapsed summary text plus `<a>Edit</a>`, not just a heading.
- **Where:** Every checkout and booking flow. Baymard finds large shares of sites still ask for an
  account early and bury guest checkout.
- **Builds on:** SU-154, SU-149
- **Measure:** manual for now. Planned check: audit.js: on checkout pages, count visible `input, select,
  textarea` and info above ~20; warn on two inputs whose labels match "confirm email" / "confirm
  password"; info on a `required` phone. Guest prominence and step copy are manual.
- **Sources:** [Baymard: reasons for checkout
  abandonment](https://baymard.com/lists/cart-abandonment-rate), [Baymard: accordion checkout
  usability](https://baymard.com/blog/accordion-checkout-usability), [WCAG 2.2 Understanding SC 3.3.7
  Redundant Entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)

### SU-278 The order summary stays in view and the total never changes silently
**Rule:** On desktop keep a 320-400px sticky right column with thumbnails, quantities, discounts,
  shipping, tax and total. On mobile show a collapsed bar at the top ("Show order summary, $84.20") that
  expands in place. Editing items links back to the cart. When shipping or tax changes the total,
  highlight the changed row and announce it politely.
- ❌ A delivery step with no summary: the total appears only on the last page, so choosing Express changes
  it with no sign.
- ✅ A `48px` bar "Hide order summary, $84.20" expanded in place, the Shipping row `$9.95` highlighted,
  and "Shipping changed: total is now $84.20".
- **Numbers:** 320-400px sticky column; 48px summary bar; row highlight ~1.5s; `aria-live="polite"`
- **Why:** Extra costs too high (40%) and a total not visible up front (12%) are leading abandonment
  reasons (Baymard), and a number that changes without notice reads as a trick. Status messages must be
  programmatically announced without taking focus (WCAG 2.2 SC 4.1.3). Column width, bar height and
  highlight time are house defaults.
- **Do:** Summary is a `<section aria-labelledby>`; the mobile toggle is a `<button aria-expanded
  aria-controls>` whose label includes the total. Put the changed amount in `<div role="status">`;
  highlight with a background that fades over about 1.5s and is also text, so colour is not the only cue
  (SU-71). Disable the fade under `prefers-reduced-motion`. Show discounts as negative lines with the
  code name.
- **Where:** Every multi-step checkout, booking and subscription flow.
- **Builds on:** SU-182, SU-146, SU-177
- **Measure:** manual for now. Planned check: audit.js: warn when a checkout page has no element with a
  currency total outside the form region; warn when the summary toggle lacks `aria-expanded`. Live-region
  announcements are manual.
- **Sources:** [Baymard: reasons for checkout
  abandonment](https://baymard.com/lists/cart-abandonment-rate), [WCAG 2.2 Understanding SC 4.1.3 Status
  Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

### SU-279 Shipping options show arrival date and cost together
**Rule:** List options in one column of radio cards (SU-55). Each shows the method name, an arrival range
  as dates ("Fri 23 - Tue 27 Oct") and the cost right-aligned, with "Free" in plain text. Order by speed
  and preselect the cheapest. Choosing an option updates the order summary at once. Format dates in the
  viewer's locale and state a cutoff time when it matters.
- ❌ "Express 1-2 business days" in a random order, with the price in accent colour and no dates, so
  shoppers count days themselves.
- ✅ Cards ordered slow to fast: "Standard, Fri 23 - Tue 27 Oct, Free", "Express, Wed 21 - Thu 22 Oct,
  $14.95", "order by 2:00 pm" on next-day.
- **Numbers:** 1 column; 44-72px cards; dates not day counts; cost right-aligned; cheapest preselected
- **Why:** Baymard found that shoppers shown only a shipping speed stopped to count days or open a
  calendar, and read an arrival date as a promise, so it has to be accurate; participants also hesitated
  when a date window was wider than about 5-7 days. 41% of sites in its benchmark show no delivery date
  in the shipping step. Delivery too slow is the second reason for abandonment (20%, Baymard).
  Preselecting the cheapest option is a house default.
- **Do:** `<fieldset><legend>Shipping method</legend>` with a `<label>` wrapping each radio card. Compute
  dates server-side from warehouse cutoff and carrier calendar; render with `Intl.DateTimeFormat`
  (SU-202). Put the cost in the same label so it is announced. `aria-live` the summary total when the
  selection changes (SU-278). Show "Free" as text, not a green badge.
- **Where:** Every physical-goods checkout.
- **Builds on:** SU-55, SU-182, SU-202
- **Measure:** manual for now. Planned check: audit.js: warn on radio groups in a shipping fieldset whose
  labels contain "business days" but no date pattern; info on price outside the radio label. Date
  accuracy is manual.
- **Sources:** [Baymard: shipping speed vs delivery
  date](https://baymard.com/blog/shipping-speed-vs-delivery-date), [Baymard: reasons for checkout
  abandonment](https://baymard.com/lists/cart-abandonment-rate)

### SU-280 Payment fields match the physical card
**Rule:** Methods form a one-column radio list with 24px-high logos; wallets come first only on devices
  that support them, and the selected method expands inline. Card number uses `autocomplete="cc-number"`
  and `inputmode="numeric"`, accepts pasted spaces and groups digits 4-4-4-4 (Amex 4-6-5) with a brand
  icon. Expiry is one "MM / YY" field with an automatic slash. CVC has a hint. Never `type="number"`. Entered values survive a server error, and hosted (iframe) fields match the height of your other
  inputs.
- ❌ "4242424242424242" with "Digits only, no spaces", Month and Year dropdowns, and a bare CVC field.
- ✅ `4242 4242 4242 4242` with a brand icon, one `03 / 27` field showing "MM / YY, as on the card", and
  CVC "3 digits, back of card".
- **Numbers:** 24px logos; 4-4-4-4 / 4-6-5; "MM / YY"; `cc-number`, `cc-exp`, `cc-csc`
- **Why:** 72% of sites in Baymard's benchmark did not match the expiry field to the format printed on
  the card, and Baymard recommends accepting typed spaces and auto-formatting them; on more than a third
  of test sites, form errors cleared the typed card data. web.dev says `type="number"` adds increment
  arrows that make no sense for card numbers and recommends `type="text"` with `inputmode="numeric"`.
  Logo size is a house default.
- **Do:** `<input type="text" inputmode="numeric" autocomplete="cc-number" spellcheck="false">`, expiry
  `autocomplete="cc-exp"` with `placeholder="MM / YY"`, CVC `cc-csc`. Strip spaces on submit, do not set
  `maxlength` below 19 (digits only) or 23 (with spaces), since cards run 13-19 digits. Accept "3" and
  "03" as months, reject "13". With Stripe Elements or similar, style the iframe to the same height,
  border and focus ring as your own inputs (SU-70). Retain values after errors (SU-154).
- **Where:** Every paid product, subscription and donation form that takes cards.
- **Builds on:** SU-153, SU-154, SU-148
- **Measure:** manual for now. Planned check: audit.js: fail on payment inputs with `type=number`; warn
  on card inputs without `cc-*` tokens; warn on `maxlength` under 19 on a `cc-number` field. Grouping and
  hosted-field styling are manual.
- **Sources:** [Baymard: auto-format spaces in card
  numbers](https://baymard.com/blog/credit-card-field-auto-format-spaces), [Baymard: expiration date
  fields](https://baymard.com/blog/how-to-format-expiration-date-fields), [web.dev: payment and address
  form best practices](https://web.dev/articles/payment-and-address-form-best-practices)

### SU-281 Placing the order is protected and final
**Rule:** The final button names the amount ("Pay $84.20"), keeps its width while busy (SU-158) and
  blocks a second submit with an idempotency key. If the response takes over 30 seconds, say so and offer
  a safe check of order status. The review step shows contact, address, method and items, each with Edit. Terms sit as a line under the button unless a checkbox is legally required. One lock icon with plain
  security text sits by the button, not a wall of badges.
- ❌ "Place order" collapses to a 52px spinner, review rows have no Edit, four badges ("SSL", "100%
  SECURE") and a terms checkbox.
- ✅ A full-width "Paying $84.20…" button, "Edit" on every review group, one line "Card details are
  encrypted. Don't close this page."
- **Numbers:** 52px button; 30s slow-response notice; 1 idempotency key per attempt; Edit on every review
  group
- **Why:** Distrust of the site with card details drives 19% of abandonments (Baymard), and double
  charges are the costliest failure; Stripe saves the status code and body of the first request for a key
  and returns it on retries, so a second click cannot create a second charge. Financial submissions need
  a way to check, confirm or reverse them (WCAG 3.3.4). The 30s threshold, badge and terms guidance are
  house defaults.
- **Do:** Generate one UUID per checkout attempt and send it as `Idempotency-Key`. Set
  `aria-disabled="true"` rather than removing the button, keep focus, keep the label ("Paying $84.20…").
  After 30s show a `role="status"` message and a "Check order status" button that queries by key. Review
  rows: group by meaning with the Edit link next to each group, returning to that step with data intact.
  Skip the terms checkbox unless required by law; link terms under the button.
- **Where:** Every checkout, booking and subscription payment step.
- **Builds on:** SU-158, SU-159, SU-154
- **Measure:** manual for now. Planned check: audit.js: warn when a form with a card field has a submit
  button without a currency amount or name; warn on `required` checkboxes whose label starts "I agree"
  inside a checkout. Idempotency and slow-response handling are manual.
- **Sources:** [Stripe: idempotent requests](https://docs.stripe.com/api/idempotent_requests), [Baymard:
  reasons for checkout abandonment](https://baymard.com/lists/cart-abandonment-rate), [WCAG 2.2
  Understanding SC 3.3.4 Error
  Prevention](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)

### SU-282 Order confirmation answers "did it work"
**Rule:** Lead with the name and order number ("Thanks, Sam. Order A-10293 is confirmed"), then items,
  total, last 4 digits of the card, address, delivery estimate and "Confirmation sent to s***@mail.com". Give one primary action (Track order) and one text link (Continue shopping). Offer account creation
  here with the email prefilled and one password field. Reloading is safe, creates no second order and
  the page does not auto-clear.
- ❌ A check icon, "Thank you!", "Your order has been received", and two equal buttons, with no order
  number, total or email notice.
- ✅ Panel "Thanks, Sam. Order A-10293 is confirmed", items, Visa ending `4242`, delivery estimate, a
  filled "Track order", a text "Continue shopping" and a one-field "Save details".
- **Numbers:** 1 primary action; 1 field (password); order number in the heading; email masked
- **Why:** GOV.UK confirmation pages carry the reference number in a panel, say what happens next and
  expect some people to bookmark them as a receipt. Baymard recommends offering account creation on the
  confirmation page, when only a password is missing, and listing 3-5 benefits. The masked email and
  single action are house defaults.
- **Do:** Make the confirmation panel the page `<h1>` (GOV.UK does the same; no toast, no live region
  needed on a full page load) with no links or buttons inside it. Render from a stored order ID, so `GET
  /orders/A-10293/confirmation` is idempotent and survives reload and bookmark. Show the account email as
  read-only text and use `autocomplete="new-password"` on the single password field. Send the receipt
  email and offer a PDF copy. Do not clear cart state until the order exists server-side.
- **Where:** Every purchase, booking and sign-up; most are a bare thank-you page.
- **Builds on:** SU-161, SU-146, SU-153
- **Measure:** manual: reload the confirmation URL and confirm no second order and the same content. a
  planned  check: warn when a page whose title contains "confirmation/thank you" has no element matching
  an order-number pattern.
- **Sources:** [GOV.UK Design System: confirmation
  pages](https://design-system.service.gov.uk/patterns/confirmation-pages/), [Baymard: delayed account
  creation](https://baymard.com/blog/delayed-account-creation)
