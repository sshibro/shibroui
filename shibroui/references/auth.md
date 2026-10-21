# Sign-in, sign-up and recovery (SU-283 – SU-288)

Sign-in, sign-up, password reset, one-time codes, passkeys and expiring sessions. Security and clarity
pull the same way: say what happens, keep people's work, and never reveal who has an account.

### SU-283 Sign-in is one narrow column
**Rule:** Put sign-in in a centered column 360-400px wide: visible email and password labels, a Show
  button on the password, "Forgot password?" aligned right on the password label row, and one full-width
  primary button 44-48px tall. Failure messages never say which half was wrong, paste stays allowed, and
  focus starts in the first field.
- ❌ A 520px-wide form with a 36px auto-width Sign in button, a 36px Google button and the error "We have
  no account with that email address".
- ✅ A 360px column, a 48px full-width Sign in, a 48px Google button under an "or" divider, Show on the
  field and "Email or password is incorrect".
- **Numbers:** 360-400px column; 44-48px button and social buttons (one height); Show on the password; 1
  neutral error; "or" divider
- **Why:** Browsers and password managers fill a standard username plus current-password pair, and
  blocking paste or autofill fails WCAG 3.3.8. A message that names the wrong half lets attackers learn
  which emails have accounts (OWASP). GOV.UK hides passwords by default behind a Show button, and the
  360-400px width and 44-48px heights are house defaults.
- **Do:** Label with `<label for>` (tokens and paste per SU-153); `<input type="email" name="email"
  autocomplete="username" autofocus>` and `<input type="password" autocomplete="current-password">` in
  their own `<form>`; the toggle is `<button type="button" aria-pressed>` that swaps `type`. Never
  `autocomplete="off"` or a paste-blocking handler. Submit label is "Sign in", not "Submit". Show social
  buttons above the form only when they are the main path, with unmodified brand logos, and give both
  groups one height. Error text is `role="alert"` and identical for unknown email and wrong password,
  with the same status code and timing.
- **Where:** Nearly every app and many content sites have a sign-in page; wide layouts and message leaks
  repeat.
- **Builds on:** SU-153, SU-180
- **Measure:** manual for now. Planned check: audit.js: warn on `type=password` without `autocomplete`
  current-password/new-password; fail on `autocomplete="off"` there; warn on the primary submit button
  under 44px tall inside a form containing a password field. page-map: warn when the sign-in form column
  exceeds 480px.
- **Sources:** [GOV.UK Design System: Password
  input](https://design-system.service.gov.uk/components/password-input/), [web.dev: Sign-in form best
  practices](https://web.dev/articles/sign-in-form-best-practices), [OWASP Authentication Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### SU-284 Sign-up asks for the least and judges passwords by length
**Rule:** The first step is email plus password only. Accept at least 8 characters (15 when the password
  is the only factor) up to 64 or more, impose no composition rules, set no `maxlength` below 64, and
  check the password against a breached or common list. Feedback is live text, and a Show toggle replaces
  the confirm field.
- ❌ Uppercase/number/symbol rules, a 16-character cap, a color-only strength bar and a "Confirm password"
  field.
- ✅ No composition rules, 64+ characters accepted, "At least 8 characters" and "Not found in known
  breached passwords" as text, and a Hide/Show button instead of a confirm field.
- **Numbers:** min 8 (15 if sole factor); accept 64+; 0 composition rules; 0 confirm fields; text
  feedback, not a color bar
- **Why:** NIST SP 800-63B-4 sets a 15-character minimum for a sole factor (8 in MFA), asks verifiers to
  accept at least 64, forbids composition rules and requires a blocklist check. GOV.UK avoids `maxlength`
  because it silently truncates, and web.dev says not to make people type a password twice. A color-only
  bar fails WCAG 1.4.1. Email verification not blocking the first session is a house default.
- **Do:** `<input type="password" autocomplete="new-password" minlength="8">` with no `pattern` and no
  small `maxlength`; link the live requirements with `aria-describedby` and announce changes politely
  (SU-146). Reject known-bad values with a reason ("This password appears in a data breach. Choose
  another."). Label the field "Create a password" (GOV.UK). Ask for the name, company and the rest after
  the account exists, and land the person on a first-value step. Verify the email in the background
  without blocking the first session.
- **Where:** Every account product has sign-up; composition rules, caps and long first steps are the
  common failures.
- **Builds on:** SU-153
- **Measure:** manual for now. Planned check: audit.js: fail on `autocomplete="new-password"` fields with
  `maxlength` under 64 or a `pattern`; warn on two password fields in one sign-up form.
- **Sources:** [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), [GOV.UK Design
  System: Password input](https://design-system.service.gov.uk/components/password-input/), [web.dev:
  Sign-in form best practices](https://web.dev/articles/sign-in-form-best-practices)

### SU-285 Password reset leaks nothing and recovers fully
**Rule:** The request page has one field and answers identically whether or not the account exists ("If
  an account exists, we sent a link"), with matching response time. The token is single-use, lives 15-60
  minutes and only the newest works. An expired link says so and offers "Request a new link"; after a
  reset, end other sessions (or ask), email a notice and send the person to sign in.
- ❌ The response says "No account found" for unknown emails, and an old link shows "Invalid token" with
  no next step.
- ✅ The same "Check your email" text for every address with the 30-minute lifetime stated, and an expired
  page with a "Request a new link" button.
- **Numbers:** 1 field; 1 response text; token 15-60 min; newest only; 1 notice email
- **Why:** OWASP says to return one consistent message and response time for existing and unknown
  accounts, make tokens single use with an expiry, email a confirmation and not log the person in
  automatically. GOV.UK says to explain an expired or used link and let people resend. The 15-60 minute
  lifetime is a house default because OWASP gives no number.
- **Do:** Store a hashed token with an expiry and a counter; on a new request, invalidate the older
  token. Queue the email in the same code path for known and unknown addresses so timing matches. The
  new-password page reuses the sign-up policy (SU-284) with a Show toggle. After success: invalidate
  other sessions, send "Your password was changed" without the password, and redirect to sign-in.
  Throttle requests per address and per IP.
- **Where:** Every account system has reset; enumeration leaks and dead-end expired links are routine.
- **Builds on:** SU-180
- **Measure:** manual: needs server behavior (uniform message, timing, token invalidation). audit.js can
  only check that the reset page has one field and a resend path.
- **Sources:** [OWASP Forgot Password Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html), [GOV.UK Design
  System: Confirm an email
  address](https://design-system.service.gov.uk/patterns/confirm-an-email-address/)

### SU-286 One-time code screens state the expiry, a resend cooldown and a backup route
**Rule:** Paint the code as six boxes of at least 48x56px (one real input, or segmented boxes that accept
  a pasted code) and auto-submit on the last digit with a busy state; an error keeps focus and clears the
  boxes. State how long the code lives, show a 30-60s resend cooldown as a countdown, and offer "Use a
  backup code". Magic-link screens show the address, the expiry and Resend.
- ❌ Six 34x40px boxes, a separate Verify button, an always-on Resend link and no expiry or backup route.
- ✅ One input painted as 48x56px boxes that auto-submits, "Code expires in 5 minutes", "Resend code in
  0:42" and "Use a backup code".
- **Numbers:** 6 boxes of 48x56px; gap 8px; resend cooldown 30-60s; expiry stated (5-10 min); 1 backup
  route
- **Why:** MDN says one-time codes should expire in ideally 5 minutes or less, and OWASP asks for
  single-use codes, a newly generated code on every resend, strict attempt limits and single-use recovery
  codes. The field attributes (`one-time-code`, `inputmode`, paste) are SU-153. Box size and the 30-60s
  cooldown are house defaults.
- **Do:** Keep the real input as the only control when you can (letter-spacing or a background grid draws
  the boxes), so paste, autofill and screen readers behave; if you build six inputs, handle `paste` and
  `beforeinput`, give each an `aria-label` ("Digit 1 of 6") and move focus on delete. On a wrong code
  keep focus, set `aria-invalid`, announce "That code is not right" and clear. Disable Resend until the
  cooldown ends, with an `aria-live="polite"` countdown; say which address the code went to. Regenerate
  the code on resend and invalidate the old one.
- **Where:** 2FA, email verification and magic-link sign-in are on most modern apps.
- **Builds on:** SU-153, SU-156
- **Measure:** manual: expiry, cooldown and recovery are flow behavior. The field attributes are already
  checked by SU-153's audit.
- **Sources:** [MDN: One-time passwords
  (OTP)](https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/OTP), [OWASP Multifactor
  Authentication Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html),
  [web.dev: SMS OTP form best practices](https://web.dev/articles/sms-otp-form)

### SU-287 Passkeys are offered after sign-in and never replace the fallback
**Rule:** Give the email field `autocomplete="username webauthn"` so a saved passkey appears in autofill. After a successful password sign-in, show a dismissible "Create a passkey" card once with a one-line
  benefit and remember the dismissal for 30 or more days. In settings, name each passkey by device and
  source, let people delete it, and always keep a password or code path.
- ❌ A card that cannot be dismissed, passkeys listed as "Passkey (2)" with raw timestamps, and the
  password marked "Removed".
- ✅ "Sign in faster with a passkey" with "Not now", passkeys named "MacBook Pro - iCloud Keychain",
  Delete on each and the password still available.
- **Numbers:** `username webauthn` token; 1 prompt, then 30+ days quiet; 1 line of benefit; 2+ sign-in
  routes
- **Why:** web.dev puts `username webauthn` on the username field so passkeys appear in the autofill
  dialog, with `webauthn` as the last token. Google recommends prompting after sign-in or in security
  settings, showing each passkey's source, numbering duplicates and using "delete" in management UI. The
  30-day quiet period is a house default.
- **Do:** `<input type="text" name="email" autocomplete="username webauthn">` plus a pending
  `navigator.credentials.get({mediation:"conditional"})`; feature-detect first. Offer creation after
  authentication, trigger the OS dialog from a user gesture, confirm success, and on cancel point to
  Settings > Security. Store dismissal with a timestamp. Never ask again in the same session. Keep
  recovery (email, code) reachable.
- **Where:** Most large sign-in flows now offer passkeys, and many add dead ends or repeated nags.
- **Builds on:** SU-283
- **Measure:** manual: passkey support is not detectable from the DOM. audit.js can only info-flag a
  sign-in form with a password field whose username input lacks the `webauthn` token when the site ships
  passkeys.
- **Sources:** [web.dev: Passkey form autofill](https://web.dev/articles/passkey-form-autofill), [Google:
  Passkey user journeys](https://developers.google.com/identity/passkeys/ux/user-journeys), [MDN:
  autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)

### SU-288 Expiring sessions and lockouts preserve work and say how long
**Rule:** Warn at least 2 minutes before a timed session ends and offer "Stay signed in"; re-authenticate
  in place, or return to the same validated URL with the form data kept. Lockouts and rate limits state
  the wait ("Try again in 15 minutes") and a recovery link, using one counter and one message for every
  identifier so they do not reveal that an account exists.
- ❌ The session ends without warning, the draft is discarded, and the lockout says "Contact support" with
  no wait.
- ✅ A "Signed out in 2:00" dialog with Stay signed in and the draft kept, and "Too many attempts. Try
  again in 15 minutes, or reset your password."
- **Numbers:** warning 2+ min before expiry (WCAG minimum 20s); extend in 1 action; lockout wait stated
  (e.g. 15 min); 1 recovery link
- **Why:** WCAG 2.2.1 requires a warning with at least 20 seconds to extend a time limit, and 2.2.6 (AAA)
  asks you to warn how long inactivity takes before data is lost. OWASP gives 15-30 minutes idle timeout
  for low-risk apps and wants a generic failure message whether an account is wrong, locked or disabled,
  so keep lockout counters uniform. The 2-minute warning is a house default.
- **Do:** Show a `role="alertdialog"` with a live countdown and a button that pings a keep-alive.
  Autosave drafts to the server or `localStorage` before expiry. On re-auth, redirect with `?next=`
  validated against an allow-list of same-origin paths and restore the draft (WCAG 3.3.7). Count failures
  per identifier and per IP, including unknown ones, and keep a reset link available while locked.
- **Where:** Any app with login loses form data on expiry and shows unhelpful lockout errors.
- **Builds on:** SU-154
- **Measure:** manual: depends on server timers and flows.
- **Sources:** [WCAG 2.2: Timing Adjustable
  (2.2.1)](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), [WCAG 2.2: Timeouts
  (2.2.6)](https://www.w3.org/WAI/WCAG22/Understanding/timeouts.html), [OWASP Session Management Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
