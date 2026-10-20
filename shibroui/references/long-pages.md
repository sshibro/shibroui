# Long pages (SU-204 – SU-211)

A page taller than about three viewports (landing, docs, article, catalog) is read one screen-height band at
a time, so judge it band by band, not as one image. Run the scripts with `window.__shibroPageMap = {
prepare: true }` and `window.__shibroAudit = { prepare: true }` so scroll reveals and lazy sections are
laid out and measured. page-map then returns `bands` (one wireframe, first read and layout fingerprint per
band) and `outline` (the bands in order, with fingerprint and height).

- [Read it a screen at a time](#read-it-a-screen-at-a-time) SU-204–206
- [Stay oriented](#stay-oriented) SU-207
- [Calls to action and reveals](#calls-to-action-and-reveals) SU-208–209
- [Backgrounds and speed](#backgrounds-and-speed) SU-210–211

## Read it a screen at a time

### SU-204 Each screen has a lead
**Rule:** every viewport-height band has one focal element (a heading, a visual or a number), and section
heads share one strong style. The page-wide focal point (SU-119) is the hero.
- ❌ A band with a 40px heading and a 40px stat in different styles tied for first, or a band with no
  clear lead.
- ✅ One top tier per band, and every section `h2` in one style.
- **Why:** readers scan a long page by its section heads, then stop where one band stands out.
- **Do:** in `outline`, the heading of each band is the same size and weight; the band's visual or number
  is the one thing larger.
- **Measure:** page-map `bands[].firstRead`: warn when two different top styles compete inside a band, and
  when section `h2`s lead their bands in more than one style; info when a band has no lead at all.

### SU-205 Vary the shape, keep the system
**Rule:** consecutive sections don't repeat the same layout fingerprint more than twice. Alternate dense
and airy bands, with one idea per band. Rhythm comes from one section padding token (e.g. 96px desktop,
64px phone), not from changing tokens.
- ❌ Five sections in a row of `h2 + p + grid 3×2 card(h3, p)`: the endless card grid.
- ✅ Feature grid, then a split band (text and product shot), then a number strip, then a grid.
- **Why:** identical bands read as one long list and lose the reader (design-taste-frontend: no more than
  2 zigzag sections in a row).
- **Do:** a repeated *list* (case studies) is fine when it reads as one list under one heading.
- **Measure:** page-map: warn on 3+ consecutive identical fingerprints; warn on section padding varying by
  more than one step.

### SU-206 No false floor
**Rule:** the first screen never looks finished. Something from band 2 peeks in within the first viewport
at 1280×800 and 375×667, and no full-width rule or large empty gap sits at the fold.
- ❌ Hero ends at y=800 with a full-width color change and 120px of empty space. 6 of 8 users didn't
  realise the page scrolled (NN/g).
- ✅ The next band's heading or image starts 40–120px above the fold, or there is a deliberate scroll cue.
- **Why:** 57% of viewing time is above the fold and 74% in the first two screens (NN/g 2018), so the
  fold has to invite scrolling.
- **Measure:** page-map: info when band 1 ends within 24px of the fold with a full-width color change there.

## Stay oriented

### SU-207 Stay oriented on long pages
**Rule:** a long page always shows where you are and how to get around.
- **Sticky header:** 56–64px in apps, up to 72px on marketing pages (48–56px on phones), opaque, with a
  content-to-header ratio of about 13:1 or more (NN/g calls 2:1 excessive). It casts a level-1 shadow only
  once the page has scrolled. If it hides on scroll-down, it slides back on scroll-up (300–400ms, NN/g).
- **Anchors:** targets set `scroll-margin-top` = header height + 16–24px.
- **Table of contents:** on long reading pages, sticky in a side rail from ~1200px wide; plain (not
  sticky) at the top of the article below that, because collapsed sticky TOCs on phones are often
  missed (NN/g). Mark the current section with `aria-current="true"`.
- **Back to top:** pages longer than 4 screens get a text "Back to top" link at the lower right (NN/g).
- ❌ A 96px opaque header, and a heading that lands under it after clicking `#pricing`.
- ✅ A 64px header and `section { scroll-margin-top: 80px }` (or `html { scroll-padding-top: 80px }`).
- **Do:** `html { scroll-padding-top: calc(var(--header-h) + 16px) }` covers every anchor at once.
- **Measure:** `audit.js` SU-207: warn when a sticky or fixed header exists and in-page anchor targets
  have `scroll-margin-top` (or `html` `scroll-padding-top`) smaller than its height; info on pages of
  4+ viewports of prose with no TOC (`nav` of in-page links).

## Calls to action and reveals

### SU-208 One call to action, repeated
**Rule:** the primary CTA keeps one label and one style everywhere it appears: the header, the hero, after
every 2–3 bands at a decision point, and the final band. Secondary CTAs stay secondary.
- ❌ "Get started", "Try it free", "Sign up" and "Start now" as four filled buttons on one page.
- ✅ "Start free trial" in the header, hero, mid-page and final band, always filled; "See pricing" is an
  outline button.
- **Why:** SU-121 applied to the whole page. A reader who has decided shouldn't have to find a new label.
- **Measure:** page-map: warn when filled accent buttons carry more than one distinct label (1 per page;
  per band for apps).

### SU-209 Scroll reveals enhance; they never hide
**Rule:** content is visible by default. The hidden start state applies only once JS has run
(`html.js .reveal`) and never to content already in view at load.
- **Motion:** reveal once, by 8–24px, over 200–400ms ease-out, with any stagger ≤ 300ms in total.
- **Under reduced motion:** no movement.
- **Never:** scroll-jacking (NN/g), or parallax on text.
- ❌ `.reveal { opacity: 0 }` in the stylesheet: with JS off or an observer that never fires, the section
  stays blank. Also a 60px slide-up over 900ms on every section.
- ✅ `html.js .reveal:not(.in) { opacity: 0; translate: 0 16px }` and `.reveal { transition: opacity .3s
  ease-out, translate .3s ease-out }`, plus a `prefers-reduced-motion` override.
- **Why:** impeccable: reveals must enhance an already-visible default. high-end-visual-design wants every
  element revealed over 800ms or more; shibroUI follows impeccable.
- **Measure:** `audit.js` SU-209: warn on CSS that sets `opacity: 0` on content containers at rest with a
  transition and no `.js`/`[data-*]` gate; with `prepare`, warn on reveals that start in the first
  viewport; the motion checks cover distance (≤ 24px) and duration (≤ 400ms).

## Backgrounds and speed

### SU-210 Band backgrounds band gently
**Rule:** alternating section backgrounds use the base surface and at most one or two neighbouring steps
(ΔL ≤ 0.04 in OKLCH), plus at most one full-bleed brand band per page. Boundaries come from space and
surface, not a stack of borders.
- ❌ White, light gray, pale blue, dark navy and a saturated purple band down one page, each with a
  border.
- ✅ `--surface` and `--surface-sunken` alternate; the final CTA is the one brand-color band.
- **Why:** more than three background colors reads as several pages stitched together (SU-127).
- **Measure:** page-map `bands[].background`: warn on more than 3 distinct band backgrounds or more than
  one saturated full-bleed band.

### SU-211 Long pages stay fast
**Rule:** bands below the second screen use `content-visibility: auto` with `contain-intrinsic-size: auto
<height>` (SU-195). Images below the fold are lazy (SU-194). Nothing below the fold blocks first paint.
- ❌ 32,000px of DOM rendered at load, and 40 eager images below the fold.
- ✅ `.band { content-visibility: auto; contain-intrinsic-size: auto 720px }` and `loading="lazy"` on
  below-fold images.
- **Why:** `content-visibility` made first render about 7× faster in web.dev's test; the intrinsic size
  stops the scrollbar from jumping.
- **Measure:** the existing SU-194/195 checks, run per band.
