# Loading performance people can see (SU-192 – SU-196)

Layout shift, late fonts and slow hero images look like UI bugs. The audit flags the patterns behind
them. It can't measure field CLS, LCP or INP, so treat its findings as risks, not scores. Targets
(web.dev, 75th percentile): LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.

### SU-192 Reserve space; nothing jumps
**Rule:** images, video and embeds carry `width`/`height` attributes or an `aspect-ratio`. Async content
renders into a slot sized for it (a skeleton, SU-157). Banners never push content down after first paint.
- ❌ An `<img>` with no size: when it loads 1.2s later, the text being read drops by its height.
- ✅ `<img width="1600" height="900">`, or `aspect-ratio: 16 / 9` on the frame.
- **Measure:** `audit.js` SU-192: warn on media without dimensions or aspect-ratio.

### SU-193 Fonts load without shifting
**Rule:**
- Use at most 2 families (SU-126) and about 4 font files on first view.
- `font-display: swap` for body text, with a metric-matched fallback (`size-adjust`, `ascent-override`),
  or `font-display: optional`.
- Preload only the main WOFF2.
- **Measure:** `audit.js` SU-193: warn on `@font-face` without `font-display`.

### SU-194 Hero image first, the rest lazy
**Rule:** the largest image in the first screen is never `loading="lazy"`. Give it
`fetchpriority="high"` and a `srcset`/`sizes` that matches its rendered width. Images below the fold use
`loading="lazy" decoding="async"`.
- **Why:** lazy-loading the LCP image made p75 LCP about 21% worse in web.dev's data.
- **Measure:** `audit.js` SU-194: warn when the largest first-screen image is lazy.

### SU-195 Long lists and pages stay light
**Rule:** paginate or virtualize lists above about 200 rows. For long pages, use
`content-visibility: auto` with `contain-intrinsic-size: auto <estimate>`; without it, offscreen sections
collapse and the scrollbar jumps.
- **Measure:** `audit.js` SU-195: warn on `content-visibility: auto` with no intrinsic size.

### SU-196 Respond within 100ms; animate transform and opacity
**Rule:** every input gets visual feedback within 100ms (SU-72), even if the work continues. Animate
`transform` and `opacity`, not `width`, `height`, `top`, `left`, `margin` or `padding`, which re-run
layout every frame.
- **Measure:** `audit.js` SU-196: warn on transitions of layout properties.
