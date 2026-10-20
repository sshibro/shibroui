# Languages, direction & long strings (SU-197 – SU-202)

A layout tuned to English strings breaks first in German, Finnish and Arabic. Design for expansion and
direction from the start: logical properties cost nothing, and retrofitting them costs a lot.

### SU-197 Direction-agnostic CSS
**Rule:** use logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`,
`border-inline-start`, `text-align: start`) and set `dir` on `<html>`. Use `dir="auto"` on containers of
user-written text. Rows flip by themselves with flex and grid.
- ❌ `margin-left: 8px` on an icon and `left: 0` on a progress fill: both stay put in Arabic.
- ✅ `margin-inline-end: 8px` and `inset-inline-start: 0`.
- **Measure:** `audit.js` SU-197: warn when an RTL page uses physical properties, with a count.

### SU-198 Mirror what has direction, and nothing else
**Rule:**
- **Mirror in RTL:** back/forward arrows, chevrons in lists and breadcrumbs, sliders, linear progress
  (Hebrew is an exception), send/reply and other motion icons.
- **Don't mirror:** logos, checkmarks, clocks, circular progress and refresh, media controls,
  real-world objects, or the digits inside numbers.
- **Do:** `:dir(rtl) .icon-directional { transform: scaleX(-1) }`.
- **Measure:** manual: render once with `dir="rtl"`.

### SU-199 Labels have room to grow
**Rule:** containers that hold UI strings grow with them. No fixed widths on buttons, tabs, labels or
table headers. Budget by English length (IBM, via W3C):
| English length | Expansion |
|---|---|
| ≤ 10 characters | ×2–3 |
| 11–20 | ×1.8–2 |
| 21–30 | ×1.6–1.8 |
| 31–50 | ×1.4–1.6 |
| > 70 | ×1.3 |
- ❌ A 120px button reading "Änderungen spei…".
- ✅ The button sizes to its content and the row wraps.
- **Measure:** render with long translations, or pseudo-localized text, and re-run the audit. SU-200
  catches the truncation.

### SU-200 Truncate only where it's safe, and always reveal the rest
**Rule:** wrap by default. Truncate only in dense single-line slots (table cells, chips, tabs), and then
expose the full text with `title`, a tooltip on focus, or an expand control. Never truncate buttons,
error messages, prices or headings. Use multi-line clamps for previews.
- **Measure:** `audit.js` SU-200: warn on truncated text with no way to read it; fail when the truncated
  text is a button, label or error.

### SU-201 Script-aware typography
**Rule:**
- Set `lang` on mixed-language spans: it picks fonts, hyphenation and the screen-reader voice.
- No letter-spacing on Arabic, Persian or Urdu, because it breaks letter joining.
- CJK needs a taller line-height (test at 1.5 or more; about 1.7 is common practice) and no italics.
- Thai and Devanagari need taller line boxes.
- Font stacks include fallbacks for each script.
- **Measure:** `audit.js` SU-201: warn on letter-spacing on Arabic-script text.

### SU-202 Locale-aware formatting and messages
**Rule:** format numbers, currencies, dates, relative times and plurals with `Intl.NumberFormat`,
`DateTimeFormat`, `RelativeTimeFormat`, `PluralRules` or ICU messages. Never build sentences from
fragments ("You have " + n + " items"), and never hard-code "MM/DD" or "$".
- **Measure:** manual (code review).
