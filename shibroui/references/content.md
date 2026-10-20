# Content & microcopy (SU-178 – SU-184)

Words are interface. These rules cover buttons, errors, confirmations, numbers and sample content.
SU-6 (descriptive links), SU-111 (one name per concept) and SU-112 (one tone) still apply. The project's
own style guide wins where it disagrees. Text checks in `audit.js` know English; for other languages,
judge by eye.

### SU-178 Buttons name the outcome: verb + object
**Rule:** "Create invoice", "Delete 3 files", "Save changes". Dialog buttons repeat the title's verb.
Avoid OK, Yes/No, Submit, Confirm and Click here. Labels run 1–3 words and never wrap.
- ❌ A delete dialog with "OK" and "Cancel".
- ✅ "Cancel" and "Delete project".
- **Why:** people read the button, not the dialog body (Apple, Polaris, Carbon, GOV.UK all agree).
- **Measure:** `audit.js` SU-178: warn on OK/Yes/No/Submit/Confirm/Continue inside dialogs; info on
  "Submit" anywhere.

### SU-179 Sentence case, key word first
**Rule:** headings, buttons, tabs and labels use sentence case ("Save changes"), with the key word first.
Labels run 1–4 words and headings about 8 or fewer. Proper nouns keep their capitals.
- **Measure:** `audit.js` SU-179 (info): headings and buttons in Title Case.

### SU-180 Errors say what happened and how to fix it
**Rule:** in the person's terms, without blame, apology or a bare code. Field errors go next to the field
(SU-151) and system errors next to the region (SU-160). Write instructions for empty fields ("Enter your
name") and constraints for invalid ones ("Name must be 35 characters or less"). Avoid "invalid",
"please", "sorry", "oops" and "this field is required".
- ❌ "Invalid input", "Error 500", "Oops! Something went wrong."
- ✅ "Enter an email address like name@company.com"; "Couldn't load invoices. Check your connection,
  then try again."
- **Measure:** `audit.js` SU-180: warn on generic error text in alerts, live regions, toasts and field
  messages.

### SU-181 Confirmations name the action and its consequence
**Rule:** the title asks about the specific action and object ("Delete project "Atlas"?"). The body
states the consequence ("This removes 24 invoices and 3 members' access. You can't undo this."). The
primary button repeats the verb, and Cancel is never the default for a destructive action. Prefer Undo
(SU-161) for anything reversible. Type-to-confirm only for irreversible, wide-reaching actions.
- **Measure:** `audit.js` SU-181: warn on dialogs titled "Are you sure?" or "Confirm".

### SU-182 Numbers, dates and units are consistent
**Rule:**
- One format per screen, with thousands separators.
- Relative time for under about 7 days ("13 minutes ago", "Yesterday at 10:30"), with the full date in a
  tooltip or `title`.
- Units sit with their values (SU-27), joined by a non-breaking space.
- Round to the precision people use.
- Format through `Intl` (SU-202).

### SU-183 Plain language; instructions outside the field
**Rule:**
- Aim for about a 7th-grade reading level (Polaris) and split sentences over 25 words (GOV.UK).
- Use the audience's words, not internal jargon (SU-111).
- Placeholders hold an example ("name@company.com") at most, never an instruction or a label (SU-148).
- **Measure:** `audit.js` SU-183 (info): placeholders that start with "Enter", "Type" or "Please".

### SU-184 Real-looking content in builds and demos
**Rule:** use plausible names, amounts and dates that vary in length; they also stress-test the layout.
No lorem ipsum, "John Doe", round 99.99% / 1,234 values, or "Oops!". The user's own spec and data
always win.
- **Measure:** `audit.js` SU-184 (info): lorem ipsum, John/Jane Doe and placeholder emails in visible
  text.
