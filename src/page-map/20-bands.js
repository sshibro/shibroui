  // ---------- bands: a long page, one top-level block at a time (H3, SU-204–212, SU-259, SU-261, SU-262) ----------
  // The same algorithm as audit.js's `band` option: top-level blocks in reading order, with tall wrappers
  // that only stack full-width blocks opened up, and short blocks (a lone heading) joined to the next one.
  const BAND = { minHeight: 24, mergeBelow: 160, openAbove: 1.5, fullWidth: 0.9, maxDepth: 4, max: 24, regionCap: 14 };
  const LONG_PAGE_SCREENS = 3;
  const isLongPage = () => OPTIONS.bands === true || (OPTIONS.bands === 'auto' && docHeight >= innerHeight * LONG_PAGE_SCREENS);
  function pageBands() {
    const blocks = (parent) => [...parent.children].filter((el) => !/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|LINK|META)$/.test(el.tagName)
      && !/absolute|fixed/.test(css(el).position) && el.getBoundingClientRect().height >= BAND.minHeight && isVisible(el));
    const open = (el, depth) => {
      const r = el.getBoundingClientRect();
      const s = css(el);
      const inner = r.width - px(s.paddingLeft) - px(s.paddingRight) - px(s.borderLeftWidth) - px(s.borderRightWidth);
      const kids = blocks(el);
      const stacks = kids.length >= 2 && kids.every((k) => k.getBoundingClientRect().width >= inner * BAND.fullWidth);
      return depth < BAND.maxDepth && r.height > innerHeight * BAND.openAbove && stacks ? kids.flatMap((k) => open(k, depth + 1)) : [el];
    };
    const flat = blocks(document.body).flatMap((el) => open(el, 0));
    return flat.reduce((bands, el) => {
      const last = bands[bands.length - 1];
      if (last && last.pending) return [...bands.slice(0, -1), { el, parts: [...last.parts, el], pending: el.getBoundingClientRect().height < BAND.mergeBelow }];
      return [...bands, { el, parts: [el], pending: el.getBoundingClientRect().height < BAND.mergeBelow && el.tagName !== 'HEADER' }];
    }, []).map(({ el, parts }) => ({ el: parts.length > 1 && parts.every((p) => p.parentElement === parts[0].parentElement) && blocks(parts[0].parentElement).length === parts.length ? parts[0].parentElement : el, parts }));
  }
  // A band's layout in one comparable string: its heading, then its repeated group (a grid of one shape), a
  // two-column split, or a plain stack.
  const shapeOf = (el) => `${el.tagName.toLowerCase()}${el.classList[0] ? `.${el.classList[0]}` : ''}(${[...el.children].filter(isVisible).slice(0, 5).map((c) => c.tagName.toLowerCase()).join(',')})`;
  function fingerprint(parts) {
    const heading = parts.map((p) => (p.matches('h1, h2, h3') ? p : p.querySelector('h1, h2, h3'))).find((h) => h && isVisible(h));
    const head = heading ? `${heading.tagName.toLowerCase()} ${Math.round(px(css(heading).fontSize))}px` : 'no heading';
    let best = null;
    for (const node of parts.flatMap((p) => [p, ...p.querySelectorAll('*')]).slice(0, 3000)) {
      const kids = [...node.children].filter(isVisible);
      if (kids.length < 3) continue;
      const [top] = tally(kids.map(shapeOf));
      if (top.count >= 3 && (!best || top.count > best.count)) {
        best = { count: top.count, shape: top.value, cols: new Set(kids.map((k) => Math.round(k.getBoundingClientRect().left / 8))).size };
      }
    }
    if (best) return { heading, key: `${head.split(' ')[0]}|grid ${best.cols} ${best.shape}`, text: `${head} + grid ${best.cols}×${Math.ceil(best.count / best.cols)} ${best.shape}` };
    const split = parts.flatMap((p) => [p, ...p.querySelectorAll('*')]).slice(0, 3000).find((node) => {
      const kids = [...node.children].filter(isVisible);
      const width = node.getBoundingClientRect().width;
      return kids.length === 2 && width >= innerWidth * 0.5 && kids.every((k) => k.getBoundingClientRect().width >= width * 0.3)
        && Math.abs(kids[0].getBoundingClientRect().top - kids[1].getBoundingClientRect().top) < 40;
    });
    if (split) {
      const media = [...split.children].findIndex((k) => k.matches('img, video, canvas, picture, svg') || k.querySelector('img, video, canvas, picture'));
      return { heading, key: `${head.split(' ')[0]}|split`, text: `${head} + split${media === 0 ? ' (media left)' : media === 1 ? ' (media right)' : ''}` };
    }
    return { heading, key: `${head.split(' ')[0]}|stack`, text: `${head} + stack` };
  }
  const bandKind = (el) => (el.matches('header, [role=banner]') ? 'header' : el.matches('footer, [role=contentinfo]') ? 'footer' : el.matches('nav') ? 'nav' : 'content');
  const isDecoration = (el) => {
    const s = css(el);
    const r = el.getBoundingClientRect();
    const blurred = /blur\((\d+(\.\d+)?)px\)/.exec(s.filter);
    return el.textContent.trim().length === 0 && r.width * r.height >= 40000
      && ((blurred && parseFloat(blurred[1]) >= 24) || /radial-gradient/.test(s.backgroundImage));
  };
  function bandsSection() {
    const all = pageBands();
    if (all.length > BAND.max) COVERAGE.capsHit.push(`bands: analysed the first ${BAND.max} of ${all.length}`);
    const long = isLongPage();
    const loud = loudButtonList();
    const seen = { sizes: new Set(), colors: new Set(), radii: new Set() };
    const bands = all.slice(0, BAND.max).map((band, i) => {
      const inBand = (el) => band.parts.some((p) => p === el || p.contains(el));
      const rects = band.parts.map(pageRect);
      const area = { x: 0, y: Math.min(...rects.map((r) => r.y)), w: docWidth, h: Math.max(...rects.map((r) => r.y + r.h)) - Math.min(...rects.map((r) => r.y)) };
      const owners = textOwners.filter(inBand);
      const groups = textGroups(owners);
      const top = groups[0];
      const sizeOf = (g) => g.style.split('/')[0];
      const rivals = top ? groups.filter((g) => g !== top && g.score >= top.score * LIMITS.peerTier && sizeOf(g) !== sizeOf(top)) : [];
      const fresh = (set, values) => [...new Set(values)].filter((v) => !set.has(v) && set.add(v));
      const newValues = {
        fontSizes: fresh(seen.sizes, owners.map((el) => round(px(css(el).fontSize), 0.5))),
        textColors: fresh(seen.colors, owners.map((el) => hex(parseColor(css(el).color)))),
        radii: fresh(seen.radii, elements.filter((el) => inBand(el) && (hasBoundary(el) || el.tagName === 'IMG')).map((el) => round(px(css(el).borderTopLeftRadius))).filter((v) => v > 0)),
      };
      const style = css(band.el);
      const firstChild = [...band.el.children].find(isVisible);
      const print = fingerprint(band.parts);
      const entry = {
        n: i + 1, kind: bandKind(band.el), label: label(band.el), path: path(band.el), y: Math.round(area.y), height: Math.round(area.h),
        background: hex(backdrop(band.el)), fullBleed: band.el.getBoundingClientRect().width >= innerWidth * 0.95,
        paddingTop: Math.round(firstChild ? firstChild.getBoundingClientRect().top - band.el.getBoundingClientRect().top : px(style.paddingTop)),
        fingerprint: print.text, layoutKey: print.key, hasH1: band.parts.some((p) => p.matches('h1') || !!p.querySelector('h1')),
        sectionHeading: print.heading && print.heading.tagName === 'H2' ? `${round(px(css(print.heading).fontSize), 0.5)}px/${px(css(print.heading).fontWeight) || 400}/${hex(parseColor(css(print.heading).color))}` : null,
        firstRead: top ? { style: top.style, text: top.samples[0] } : null, rivals: rivals.map((g) => `${g.style} "${g.samples[0]}"`),
        loudButtons: [...new Set(loud.filter((b) => inBand(b.el)).map((b) => b.label))],
        newValues,
        images: elements.filter((el) => inBand(el) && el.tagName === 'IMG' && el.getBoundingClientRect().width >= 64),
        decorations: elements.filter((el) => inBand(el) && isDecoration(el)).length,
      };
      if (long && OPTIONS.bandMaps !== false) {
        const { regions } = pickRegions(elements.filter(inBand), innerWidth * innerHeight * 0.004, BAND.regionCap);
        entry.wireframe = drawMap(regions, area, OPTIONS.bandCols, OPTIONS.bandRows).map;
      }
      return entry;
    });
    if (long) longPageFlags(bands);
    const outline = bands.map((b) => `${b.n}. ${b.kind} ${b.label} · ${b.height}px · ${b.fingerprint} · ${b.background}${b.firstRead ? ` · reads "${b.firstRead.text}"` : ''}`);
    return { outline, bands: bands.map(({ images, ...b }) => b) };
  }
  // SU-204–212 and the per-band craft notes, from the band list.
  function longPageFlags(bands) {
    const content = bands.filter((b) => b.kind === 'content');
    for (const b of content) {
      if (b.rivals.length) flag('SU-204', 'warn', 'Each screen has a lead', `band ${b.n} (${b.label}): ${b.rivals.length + 1} different styles compete for its first read: ${b.firstRead.style} "${b.firstRead.text}" · ${b.rivals.join(' · ')}`);
      if (b.firstRead && px(b.firstRead.style) <= 18 && !b.images.some((img) => img.getBoundingClientRect().height >= b.height * 0.25)) flag('SU-204', 'info', 'Each screen has a lead', `band ${b.n} (${b.label}) has no lead: its loudest text is ${b.firstRead.style} and there is no large visual`);
    }
    const sectionHeads = new Set(content.map((b) => b.sectionHeading).filter(Boolean));
    if (sectionHeads.size > 1) flag('SU-204', 'warn', 'Each screen has a lead', `section headings lead their bands in ${sectionHeads.size} different styles (${[...sectionHeads].join(', ')}); give every section h2 one strong style`);
    // SU-205: three or more identical layouts in a row read as a template; padding should be one token.
    for (let i = 0; i + 2 < content.length; i += 1) {
      const run = [content[i]];
      for (let j = i + 1; j < content.length && content[j].layoutKey === content[i].layoutKey; j += 1) run.push(content[j]);
      if (run.length >= 3) {
        flag('SU-205', 'warn', 'Vary the shape, keep the system', `bands ${run.map((b) => b.n).join(', ')} repeat one layout (${run[0].fingerprint}); change the shape of the middle one (a split, a single large visual, a quote) or make them one list under one heading`);
        i += run.length - 1;
      }
    }
    const paddings = content.slice(1).map((b) => round(b.paddingTop, 8)).filter((v) => v > 0);
    const distinctPadding = [...new Set(paddings)];
    if (distinctPadding.length >= 3 && Math.max(...distinctPadding) - Math.min(...distinctPadding) >= 24) flag('SU-205', 'warn', 'Vary the shape, keep the system', `section padding varies across bands (${distinctPadding.sort((a, b) => a - b).join(', ')}px); use one section-padding token`);
    // SU-206: a band boundary that coincides with the fold, with a color change, looks like the end of the page.
    const first = content[0];
    const next = first && bands[bands.indexOf(first) + 1];
    if (first && next && Math.abs(first.y + first.height - innerHeight) <= 24 && labDistance(parseColor(first.background), parseColor(next.background)) > 0.02) flag('SU-206', 'info', 'No false floor', `band ${first.n} ends exactly at the fold (${first.y + first.height}px of ${innerHeight}px) with a color change below it; let the next band peek into the first screen`);
    // SU-208: one primary call to action, repeated with the same words.
    const labels = [...new Set(bands.flatMap((b) => b.loudButtons).map((l) => l.trim().toLowerCase()))];
    if (labels.length > 1) flag('SU-208', 'warn', 'One call to action, repeated', `${labels.length} different labels on loud (filled) buttons across the page: ${labels.join(', ')}; repeat one primary label and make the rest secondary (a form with a different job may keep its own)`);
    // SU-210: gentle banding.
    const backgrounds = [...new Set(bands.map((b) => b.background))].filter((value, i, list) => !list.slice(0, i).some((other) => labDistance(parseColor(other), parseColor(value)) < LIMITS.nearBackground));
    if (backgrounds.length > 3) flag('SU-210', 'warn', 'Band backgrounds band gently', `${backgrounds.length} different band backgrounds (${backgrounds.join(', ')}); alternate the base surface with one or two neighbouring steps`);
    const brandBands = bands.filter((b) => b.fullBleed && oklab(parseColor(b.background)).C >= LIMITS.accentChroma);
    if (brandBands.length > 1) flag('SU-210', 'warn', 'Band backgrounds band gently', `${brandBands.length} saturated full-bleed bands (${brandBands.map((b) => b.n).join(', ')}); keep at most one`);
    // SU-212: the hero says one thing.
    const hero = bands.find((b) => b.hasH1);
    const h1 = document.querySelector('h1');
    if (hero && h1 && isVisible(h1)) {
      const words = h1.textContent.trim().split(/\s+/).filter(Boolean).length;
      if (words > 12) flag('SU-212', 'warn', 'The hero says one thing', `the h1 has ${words} words; aim for about 10 or fewer on at most two lines`, [h1]);
      const cta = loudButtonList().find((b) => hero.loudButtons.includes(b.label));
      if (cta && pageRect(cta.el).y + pageRect(cta.el).h > innerHeight) flag('SU-212', 'warn', 'The hero says one thing', `the hero's call to action "${cta.label}" sits below the first screen`, [cta.el]);
    }
    // Craft per band: SU-259 (one frame per band), SU-261 (one glow), SU-262 (marketing whitespace).
    for (const b of content) {
      const radii = new Set(b.images.filter((img) => { const r = img.getBoundingClientRect(); return Math.abs(r.width - r.height) > 2 || px(css(img).borderTopLeftRadius) < r.width / 2 - 1; }).map((img) => round(px(css(img).borderTopLeftRadius))));
      if (radii.size > 1) flag('SU-259', 'info', 'Product imagery is framed one way', `band ${b.n} frames its images with ${radii.size} different radii (${[...radii].join(', ')}px)`);
      if (b.decorations > 1) flag('SU-261', 'info', 'Depth effects are rare and earned', `band ${b.n} has ${b.decorations} large blurred or radial-gradient decorations; keep one, behind the focal element`);
    }
    const display = h1 && isVisible(h1) && px(css(h1).fontSize) >= 48;
    const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
    const padding = content.slice(1).map((b) => b.paddingTop).filter((v) => v > 0);
    if (display && content.length >= 3 && padding.length && median(padding) < 64) flag('SU-262', 'info', 'Whitespace scales with the medium', `a marketing page (a ${Math.round(px(css(h1).fontSize))}px h1) with app-tier section padding (median ${median(padding)}px); use 96–160px on desktop`);
  }

