# Input components and small display pieces (SU-239 – SU-247)

Control sizes, switches, dates, uploads, search, avatars, badges and shortcuts: the small parts every
screen reuses and few teams specify. These are starting specs; the project's design system wins. Values
marked † were checked against the primary source named in the *Why* line.

> **Component spec and specimen** (component workflow)
> - **Spec first**, 5–10 lines in the working notes: anatomy (named parts), variants, sizes (SU-239), the
>   state matrix (interaction.md SU-248), content limits (shortest and longest label, wrap or truncate),
>   the APG pattern and keyboard map, motion (SU-72–92) and the tokens it uses.
> - **Then a specimen sheet:** every variant × size × state on one page, in both schemes, plus long text
>   (×2.5, SU-199), empty, and `dir="rtl"`.
> - **Force states** with attributes the component already supports (`data-state`, `aria-pressed`,
>   `aria-selected`, `disabled`) or `.is-hover` / `.is-active` classes that mirror the `:hover` /
>   `:active` rules, so `audit.js` can see them. Audit the specimen, then the real screen.
> - With shadcn / Radix / MUI / Chakra, map their size and variant props onto SU-239 rather than
>   restyling primitives.

- [Controls](#controls) SU-239–241
- [Dates, files and search](#dates-files-and-search) SU-242–244
- [Display pieces](#display-pieces) SU-245–247

## Controls

### SU-239 One control size scale
**Rule:** three heights for every control, and mixed sizes never share a row (SU-58–60).

| Size | Height | Text | Icon | Inline padding |
|---|---|---|---|---|
| sm | 32px | 13–14px | 16px | 12px |
| md | 40px | 14–16px | 16–20px | 16px |
| lg | 48px | 16px | 20–24px | 20px |

- ❌ A `34px` select next to a `42px` button, plus 5 other heights elsewhere on the page.
- ✅ Everything in the toolbar is `md` (`40px`); dense tables use `sm`.
- **Why:** † Primer 24/28/32/40/48 with a 44px minimum on coarse pointers. A short scale makes rows align
  by construction (SU-203).
- **Do:** `--control-h: 40px` tokens per size; on touch, keep `md` with a 44px hit area (SU-62) and 16px
  field text so iOS doesn't zoom (SU-175).
- **Measure:** page-map: info listing control heights in use; warn on > 3.

### SU-240 Switch for "now", checkbox for "on save"
**Rule:** a switch applies its effect immediately (settings); a checkbox is a choice submitted with a
form. The label names the setting, not the state. `role="switch"` with `aria-checked`; the state is shown
by thumb position and a shape cue, not color alone.
- ❌ A switch labelled "Enabled / Disabled" inside a form that needs "Save" to take effect.
- ✅ A switch labelled "Email notifications" that saves on toggle; a checkbox for "I agree" in a form.
- **Why:** † NN/g: a switch is for immediate effect. M3 switch track is 52×32dp. **Apple disagrees:** on
  macOS it prefers a checkbox even for a single setting. shibroUI default: switch for immediate
  settings; follow the platform when the product is a native-feeling Mac app.
- **Do:** `<input type="checkbox" role="switch">` keeps keyboard and form behaviour; thumb plus an
  on/off glyph or fill change ≥ 3:1 (SU-251).
- **Measure:** `audit.js` SU-240: info on switches inside a form that also has a submit button.

### SU-241 Pick the control by option count
**Rule:** 2–5 options that all fit → radios (or a segmented control when it switches a view or mode);
6–15 → a select; more → a searchable combobox (SU-54). Multi-select up to ~7 → checkboxes; more → a
combobox with chips.
- ❌ A `select` with 2 options; 9 radios stacked in a form; a 40-item `select` with no search.
- ✅ 3 radios for plan; a `select` for 12 time zones; a combobox for 190 countries.
- **Why:** radios show every option at once and cost one click; a select hides them and costs two;
  beyond ~15, scanning loses to typing.
- **Do:** one-column choices (SU-55); the combobox follows the APG pattern (SU-147).
- **Measure:** `audit.js` SU-241: info on `select`s with ≤ 3 options and radio groups with > 7.

## Dates, files and search

### SU-242 Dates people know are typed
**Rule:** distant, known dates (a birthday) are typed: three numeric fields (day and month 2 characters
wide, year 4, `inputmode="numeric"`, `autocomplete="bday-*"`, no auto-tab) or one field with the format
shown. Dates within about a year get a calendar *and* a typed input; ranges get presets ("Last 7
days"); ≤ ~10 possible dates can be a list. No split dropdowns.
- ❌ Three dropdowns for date of birth, a calendar scrolled back 400 months, "Invalid date".
- ✅ Day `2ch`, Month `2ch`, Year `4ch`, labelled, with the hint "For example, 27 3 1987".
- **Why:** † NN/g date input and GOV.UK date input agree: typing is faster for dates people know.
- **Do:** accept any separator and month names; start the week by locale (`Intl`); explain unavailable
  dates; report errors in order: missing, impossible, other (SU-148–154).
- **Measure:** manual.

### SU-243 File upload works without dragging
**Rule:** a button plus a drop zone; accepted types and the size limit stated before choosing. One row
per file with name (long names end in an ellipsis with the full name on focus, SU-200), size, its own
status (uploading, done, error with the fix and Retry) and Remove. Errors about the whole upload sit in an
inline notification above the list.
- ❌ A dashed box that only accepts drops, with limits revealed after a failed upload.
- ✅ "Choose file" button inside the zone, "PNG or PDF, up to 10 MB" above it, and a row per file with
  "Uploading 42%", "Retry", "Remove".
- **Why:** † Carbon file uploader: limits up front, per-file status, heights 32/40/48.
- **Do:** a real `<input type="file">` (visually hidden) behind the button; progress as
  `<progress>` or `role="progressbar"`; status changes announced (SU-146).
- **Measure:** `audit.js` SU-243: warn on a drop zone with no `input[type=file]` or button inside.

### SU-244 Search fields fit the query
**Rule:** wide enough to show a typical query (27+ characters), a visible box rather than a link, a
visible label or `aria-label`, a clear button, Enter submits. ≤ 10 suggestions on desktop and 4–8 on
phones with the match highlighted; recent searches on focus.
- ❌ A 120px search icon that expands on click, no label, 14 suggestions.
- ✅ A `~28ch` box (`inline-size: 28ch`), a "Search" name, a clear button, 8 highlighted suggestions.
- **Why:** † USWDS 27 characters; Baymard suggestion counts; NN/g: a visible box beats an icon.
- **Do:** `<input type="search">`; paired height with its button (SU-58); combobox pattern for
  suggestions (SU-147); long option lists search instead of scroll (SU-54).
- **Measure:** `audit.js` SU-244: info on `type=search` fields narrower than ~20ch.

## Display pieces

### SU-245 Avatars
**Rule:** sizes from one scale (Primer: 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64). Circles for people,
rounded squares for organizations, teams and bots. `alt` with the name unless it's printed beside it. A
fallback of initials (1–2 letters, on a tint chosen from the name, ≥ 4.5:1) or a default image. Stacks
overlap with a 2px ring in the surface color and "+N" after 3–5.
- ❌ Seven avatar sizes on one page, broken images, and a stack of 12 faces.
- ✅ `32px` circles, "AK" initials on a tinted fill, a stack of 4 plus "+8".
- **Why:** † Primer avatar and stack. **Fallback differs:** Atlassian uses a default image, others use
  initials; shibroUI default: initials, which carry information.
- **Do:** `<img alt="Aisha Khan">` or `alt=""` when the name is beside it; `border-radius: 50%`;
  `box-shadow: 0 0 0 2px var(--surface)` for the stack ring.
- **Measure:** page-map: info on > 4 avatar sizes.

### SU-246 Badges and chips
**Rule:** badges and tags 18–24px tall with 12px text for status and counts (SU-48, SU-71), with a max
width and truncation (Carbon: 208px). Chips are 32px for filters and tokens; their remove button is
named ("Remove filter: Paid") with a ≥ 24px target. Counts cap at "99+".
- ❌ A `14px` badge, an unbounded tag that pushes the row wide, an unnamed "×" at `12px`.
- ✅ A `20px` status badge, text + dot (not color alone), chips at `32px` with a `24px` named remove.
- **Why:** † Carbon tags 18/24/32; M3 chips 32dp.
- **Do:** `max-inline-size: 208px; overflow: hidden; text-overflow: ellipsis` with the full text on
  hover/focus (SU-200). Chip remove buttons keep a 24px minimum target (SU-61).
- **Measure:** SU-61 / SU-140 checks.

### SU-247 Shortcuts are shown and platform-aware
**Rule:** `<kbd>` in menus, tooltips and the command palette; ⌘ on Apple platforms, Ctrl elsewhere;
single-key shortcuts can be turned off or remapped (WCAG 2.1.4).
- ❌ "Ctrl+K" shown to Mac users, and a bare `g` shortcut that can't be disabled.
- ✅ `<kbd>⌘</kbd><kbd>K</kbd>` on macOS and iOS, `<kbd>Ctrl</kbd><kbd>K</kbd>` elsewhere.
- **Why:** a shortcut nobody sees is never used; single-key shortcuts fire while typing in assistive
  tech (WCAG 2.1.4).
- **Do:** pick the glyph from `navigator.userAgentData?.platform` or `navigator.platform`; shortcuts
  right-aligned and muted in menus (SU-233).
- **Measure:** manual.
