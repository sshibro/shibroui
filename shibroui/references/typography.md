# Typography (SU-1 – SU-17)

Make type easy to scan, compare and read. Each rule: what it says, the bad and good versions with the
numbers that separate them, why, and how to implement it.

- [Typography & readability](#typography--readability) SU-1–11
- [Text wrapping](#text-wrapping) SU-12–14
- [Reading width](#reading-width) SU-15
- [Data alignment](#data-alignment) SU-16–17

## Typography & readability

### SU-1 Type scale
**Rule:** choose sizes from a small, deliberate scale and map each role to one step.
- ❌ Heading `18px`, body `20px`: the body outranks the title.
- ✅ Heading `~28px`, body `16px`.
- **Why:** a shared scale keeps components consistent. Useful hand-picked steps beat a strict
  mathematical ratio.
- **Do:** define rem tokens (`--text-xs … --text-2xl`) and assign roles to them. Avoid nested `em`
  sizes, which compound.

### SU-2 Readable fonts
**Rule:** the text face must stay legible at the size it's actually rendered.
- ❌ A script/display face (e.g. Snell Roundhand) on a receipt: invoice numbers and amounts are hard to read.
- ✅ A plain text face for the same content.
- **Why:** UI text needs open shapes, distinct characters and useful weights, not novelty. Keep
  display faces for display moments.
- **Do:** test the face with real names, numbers and look-alike characters (Il1 O0) at the real size.

### SU-3 Font smoothing
**Rule:** leave rasterization to the browser unless a tested, local override helps.
- ❌ `-webkit-font-smoothing: none` gives jagged edges.
- ✅ The default (`auto`). `antialiased` (grayscale) / `subpixel-antialiased` may look identical depending
  on browser and display, and Firefox ignores them.
- **Why:** smoothing changes edge rendering, not the font or its weight. These properties are
  non-standard macOS-only controls.
- **Don't:** apply a global override to "make it look thinner", or fake rendering with blur, shadows or
  lighter weights.

### SU-4 Baselines
**Rule:** align mixed text sizes on their shared baseline, not their centers.
- ❌ `$199` + `/month` with `align-items: center`: the small label floats high.
- ✅ `align-items: baseline`.
- **Why:** the eye follows the baseline, so sharing it ties different sizes together without
  manual nudges.
- **Do:** put both text elements in the same flex context: `.price { display:flex; align-items:baseline; gap:4px }`.

### SU-5 Line height
**Rule:** match leading to the font, size and line length.
- ❌ Too tight (lines collide) or too loose (the paragraph falls apart).
- ✅ Body ~1.5 (1.4–1.6) at 60–75ch. Large headings ~1.1–1.25.
- **Why:** small text and long lines need more leading to find the next line. Big short headings
  already have visual separation.
- **Do:** set heading and body leading separately. Raise body leading a little as the column widens.

### SU-6 Descriptive links
**Rule:** link text names its destination.
- ❌ Two links that both say "Click here" (or "Read more").
- ✅ "Pair fonts with confidence", "Typography guides".
- **Why:** people (and screen-reader link lists) choose without clicking to find out.
- **Do:** rewrite the link text, don't just add a `title`. Keep link styling and focus visible.

### SU-7 Text alignment
**Rule:** align prose to its reading direction and avoid justified gaps.
- ❌ A centered multi-line paragraph: every line starts somewhere new.
- ✅ Left-aligned (start-aligned) prose.
- **Why:** a fixed starting edge makes the next line easy to find. Justified text opens gaps unless
  it's hyphenated per language.
- **Do:** `text-align: start`. Centering is fine for one or two short lines (a hero subtitle, an empty
  state). For deliberate justification, use `hyphens: auto` with a correct `lang`, and test narrow widths.

### SU-8 Letter spacing
**Rule:** tighten large display text slightly and give short all-caps labels more room.
- ❌ Headline at `+1.28px` (drifts apart) and caps label at `−0.24px` (squeezed).
- ✅ Headline at `−0.7px` (~−0.02em) and caps label at `+0.53px` (~+0.05em).
- **Why:** default spacing is tuned for body sizes, so it looks loose when large. Capitals lack
  ascenders and descenders, so they need air.
- **Do:** `h1{letter-spacing:-0.02em} .eyebrow{text-transform:uppercase;letter-spacing:0.05em}`. Leave body text at `normal`.

### SU-9 Obvious links
**Rule:** links inside running text must look clickable without relying on color alone.
- ❌ Weight 400, no underline: it looks like plain text.
- ✅ An underline (medium weight optional).
- **Why:** an underline survives color-blindness and link colors that sit close to the body color.
- **Do:** `.prose a{text-decoration:underline;text-underline-offset:.2em;text-decoration-thickness:from-font}`.
  Only for content links; nav items and button-shaped links already have other cues. Keep focus styles.

### SU-10 Clear characters
**Rule:** make look-alike glyphs distinct in identifiers.
- ❌ `OI01-lI10` in default glyphs: I/l/1 and O/0 are confusable.
- ✅ Inter `ss02` + `slashed-zero` on the identifier only.
- **Why:** IDs, codes and keys need exact recognition, not fluent reading.
- **Do:** `.code-id{font-feature-settings:"ss02";font-variant-numeric:slashed-zero}` (feature names vary by
  font, so check yours supports them) or a monospace with distinct glyphs. Keep the underlying string unchanged
  so copy works. Don't apply this to paragraphs.

### SU-11 Contextual punctuation
**Rule:** let punctuation adapt to its neighbours.
- ❌ `font-feature-settings:"calt" 0`: the colon and dash in `09:30–17:45` sit at lowercase height.
- ✅ Contextual alternates on, so punctuation centers on the numerals.
- **Why:** it's a free refinement the font already ships.
- **Do:** keep `font-variant-ligatures: common-ligatures contextual` and remove stray `calt 0` overrides. Leave
  literal code exactly as written.

## Text wrapping

Shared rule: fix uneven wraps and keep complete strings inside their containers.

### SU-12 Headings
- ❌ Natural wrapping leaves a lopsided last line that can strand a single word, so the title looks broken.
- ✅ `text-wrap: balance`, giving lines of similar length.
- **Why:** the title keeps its shape and phrases stay together at every width.

### SU-13 Descriptions
- ❌ Natural wrap: 2 words on the last line, with stretched spacing.
- ✅ Balanced / pretty wrap: 6 words on the last line, normal spacing.
- **Do:** `text-wrap: pretty` for paragraphs. Use `balance` for short blurbs of 2–4 lines (browsers cap
  balancing at a few lines).

### SU-14 Long links
- ❌ A URL breaks with a few characters stranded on the last line. Worse, it overflows the box.
- ✅ An even break that stays inside the container.
- **Do:** `overflow-wrap: anywhere` on URLs and long tokens. Optionally `text-wrap: balance` for short
  ones. Never let `white-space: nowrap` push them out of the box.

## Reading width

### SU-15 Line length
**Rule:** long-form copy runs at about 60–75 characters per line.
- ❌ `30ch` (constant line breaks) and `92ch` (easy to lose your place on the return sweep).
- ✅ `65ch` ideal. `75ch` acceptable.
- **Do:** cap the text column, not the page: `.prose{max-width:65ch}`. Images and tables beside it
  can stay wide.

## Data alignment

### SU-16 Tabular numbers
**Rule:** numbers that change or get compared use equal-width (tabular) digits.
- ❌ Proportional digits: switching `111,111` → `888,888` changes the width, and the label next to it
  jumps.
- ✅ `font-variant-numeric: tabular-nums`: the width is fixed and nothing jitters.
- **Applies to:** counters, timers, prices, stats, table columns, anything live. Prose numbers can
  stay proportional.

### SU-17 Typographic alignment (tables)
**Rule:** names align to their reading edge (left), comparable amounts align right (or on the decimal),
and headings follow their column.
- ❌ Names centered, amounts left-aligned: both edges are ragged.
- ✅ Names `left`, amounts `right`, with the column heading aligned the same way.
- **Why:** text is read from a steady edge, while numbers are compared by place value, so the last digits or
  decimals must line up.
- **Do:** `td.num, th.num{text-align:right;font-variant-numeric:tabular-nums}`. Use the same precision and
  currency format in every row.
