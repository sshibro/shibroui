  // ---------- visual system (SU-125, SU-126, SU-127, SU-128) ----------
  // The heading whose untouched browser default margin on `side` produced this gap between stacked blocks.
  function defaultMarginHeading(el, side, gap) {
    const em = DEFAULT_HEADING_MARGIN_EM[el.tagName];
    if (!em) return null;
    const margin = px(css(el)[`margin${side}`]);
    return Math.abs(margin - em * px(css(el).fontSize)) < 0.5 && Math.abs(margin - gap) <= 1 ? el : null;
  }
  const tally = (values) => [...values.reduce((map, v) => map.set(v, (map.get(v) || 0) + 1), new Map()).entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
  const nearPairs = (list, distance, threshold) => {
    const pairs = [];
    for (let i = 0; i < list.length; i += 1) for (let j = i + 1; j < list.length; j += 1) {
      const d = distance(list[i], list[j]);
      if (d > 0 && d <= threshold) pairs.push(`${list[i]} ≈ ${list[j]}`);
    }
    return pairs.slice(0, 10);
  };
  function system() {
    const fontSizes = tally(textOwners.map((el) => round(px(css(el).fontSize), 0.5)));
    const fontWeights = tally(textOwners.map((el) => px(css(el).fontWeight) || 400));
    const fontFamilies = tally(textOwners.map((el) => css(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase()));
    const textColors = tally(textOwners.map((el) => hex(parseColor(css(el).color))));
    // Translucent fills are tallied as seen, composited over their backdrop: a header at 82% of the page color
    // is that page color, not a near-duplicate of it (and #rrggbbaa can't round-trip through the canvas exactly).
    const backgrounds = tally(elements.map((el) => ({ el, fill: parseColor(css(el).backgroundColor) })).filter(({ fill }) => fill.a > 0.05)
      .map(({ el, fill }) => hex(fill.a >= 0.999 || !el.parentElement ? fill : over(fill, backdrop(el.parentElement)))));
    const borderColors = tally(elements.filter((el) => px(css(el).borderTopWidth) > 0 || px(css(el).borderBottomWidth) > 0)
      .map((el) => hex(parseColor(px(css(el).borderTopWidth) > 0 ? css(el).borderTopColor : css(el).borderBottomColor))));
    const radiusValues = [];
    for (const el of elements.filter((e) => hasBoundary(e) || /^(IMG|VIDEO)$/.test(e.tagName))) {
      const raw = css(el).borderTopLeftRadius;
      const r = el.getBoundingClientRect();
      const value = raw.includes('%') ? (px(raw) / 100) * r.width : px(raw);
      if (value <= 0) continue;
      radiusValues.push(value >= Math.min(r.width, r.height) / 2 - 1 ? 'pill' : round(value));
    }
    const radii = tally(radiusValues);
    const shadows = tally(elements.map((el) => css(el).boxShadow).filter((s) => s && s !== 'none'));
    const spacingValues = [];
    const defaultMargins = [];
    for (const el of elements) {
      const s = css(el);
      if (hasBoundary(el)) ['Top', 'Right', 'Bottom', 'Left'].forEach((side) => { const v = round(px(s[`padding${side}`])); if (v > 0) spacingValues.push(v); });
      if (/flex|grid/.test(s.display) && el.children.length > 1) [s.rowGap, s.columnGap].forEach((g) => { const v = round(px(g)); if (v > 0) spacingValues.push(v); });
      if (!/flex|grid/.test(s.display)) {
        const kids = [...el.children].filter((c) => isVisible(c) && /block|flex|grid|table|list-item/.test(css(c).display) && css(c).position !== 'absolute' && css(c).position !== 'fixed');
        for (let i = 1; i < kids.length; i += 1) {
          const gap = round(kids[i].getBoundingClientRect().top - kids[i - 1].getBoundingClientRect().bottom);
          if (gap <= 0) continue;
          spacingValues.push(gap);
          const heading = defaultMarginHeading(kids[i - 1], 'Bottom', gap) || defaultMarginHeading(kids[i], 'Top', gap);
          if (heading) defaultMargins.push({ gap, heading });
        }
      }
    }
    const spacing = tally(spacingValues);
    const offScale = spacing.filter(({ value }) => !SCALE.some((step) => Math.abs(step - value) <= 0.75)).map((entry) => {
      const tags = [...new Set(defaultMargins.filter((d) => d.gap === entry.value).map((d) => d.heading.tagName.toLowerCase()))];
      return tags.length ? { ...entry, defaultMarginOn: tags } : entry;
    });
    const offScaleDefaults = [...new Set(defaultMargins.filter((d) => offScale.some((entry) => entry.value === d.gap)).map((d) => d.heading))];

    const sizeList = fontSizes.map((f) => f.value).sort((a, b) => a - b);
    if (fontSizes.length > LIMITS.fontSizes) flag('SU-126', 'warn', 'Type budget', `${fontSizes.length} font sizes in use (${sizeList.join(', ')}px); aim for ≤ ${LIMITS.fontSizes}`);
    const nearSizes = nearPairs(sizeList, (a, b) => Math.abs(a - b), LIMITS.nearSize);
    if (nearSizes.length) flag('SU-126', 'warn', 'Type budget', `near-duplicate font sizes: ${nearSizes.join(', ')}`);
    if (fontWeights.length > LIMITS.weights) flag('SU-126', 'warn', 'Type budget', `${fontWeights.length} font weights (${fontWeights.map((w) => w.value).join(', ')}); aim for ≤ ${LIMITS.weights}`);
    if (fontFamilies.length > LIMITS.families) flag('SU-126', 'warn', 'Type budget', `${fontFamilies.length} font families (${fontFamilies.map((f) => f.value).join(', ')}); aim for ≤ ${LIMITS.families}`);
    if (textColors.length > LIMITS.textColors) flag('SU-127', 'warn', 'Color budget', `${textColors.length} text colors in use; aim for ≤ ${LIMITS.textColors} (2–3 neutrals, inverse, accent, a few semantic)`);
    const nearText = nearPairs(textColors.map((c) => c.value), (a, b) => labDistance(parseColor(a), parseColor(b)), LIMITS.nearColor);
    // Surfaces legitimately step in small increments (page → card → field), so only near-identical fills count.
    const nearBg = nearPairs(backgrounds.map((c) => c.value), (a, b) => labDistance(parseColor(a), parseColor(b)), LIMITS.nearBackground);
    if (nearText.length) flag('SU-127', 'warn', 'Color budget', `near-duplicate text colors: ${nearText.join(', ')}`);
    if (nearBg.length) flag('SU-127', 'warn', 'Color budget', `near-duplicate background colors: ${nearBg.join(', ')}`);
    const numericRadii = radii.filter((r) => r.value !== 'pill');
    if (numericRadii.length > LIMITS.radii) flag('SU-128', 'warn', 'Shape budget', `${numericRadii.length} corner radii (${numericRadii.map((r) => `${r.value}px`).join(', ')}) plus pills; aim for ≤ ${LIMITS.radii}`);
    const nearRadii = nearPairs(numericRadii.map((r) => r.value).sort((a, b) => a - b), (a, b) => Math.abs(a - b), LIMITS.nearRadius);
    if (nearRadii.length) flag('SU-128', 'warn', 'Shape budget', `near-duplicate radii: ${nearRadii.join(', ')}`);
    if (shadows.length > LIMITS.shadows) flag('SU-128', 'warn', 'Shape budget', `${shadows.length} different shadows; use your elevation levels only`);
    if (offScale.length) {
      const values = offScale.slice(0, 12).map((s) => `${s.value}px×${s.count}${s.defaultMarginOn ? ` (browser default margin on ${s.defaultMarginOn.join(', ')})` : ''}`);
      const hint = offScaleDefaults.length ? '; set heading margins yourself (e.g. h1–h6 { margin: 0 }) and space them with scale steps' : '';
      flag('SU-125', 'warn', 'Spacing scale', `off-scale spacing values: ${values.join(', ')}${hint}`, offScaleDefaults);
    }
    if (spacing.length > LIMITS.spacingValues) flag('SU-125', 'info', 'Spacing scale', `${spacing.length} distinct spacing values in use`);

    const saturated = elements.filter((el) => {
      const fill = parseColor(css(el).backgroundColor);
      const r = el.getBoundingClientRect();
      return fill.a >= 0.5 && r.width * r.height >= LIMITS.accentMinArea && oklab(fill).C >= LIMITS.accentChroma;
    });
    const accentArea = saturated.filter((el) => !saturated.some((o) => o !== el && o.contains(el))).reduce((sum, el) => { const r = el.getBoundingClientRect(); return sum + r.width * r.height; }, 0);
    const hues = [...new Set(saturated.map((el) => Math.round(oklab(parseColor(css(el).backgroundColor)).h / 30) % 12))];
    const accentShare = accentArea / (docWidth * docHeight);
    if (hues.length > LIMITS.accentHues) flag('SU-127', 'warn', 'Color budget', `${hues.length} different saturated hues on large surfaces ("rainbow"); keep one accent and use semantic colors only for status`, saturated);
    if (accentShare > LIMITS.accentShare) flag('SU-127', 'warn', 'Color budget', `saturated surfaces cover ${Math.round(accentShare * 100)}% of the page`, saturated);

    return { fontSizes, fontWeights, fontFamilies, textColors, backgrounds: backgrounds.slice(0, 16), borderColors: borderColors.slice(0, 10), radii, shadows: shadows.map((s) => ({ ...s, value: s.value.slice(0, 80) })), spacing: spacing.slice(0, 24), offScale, accent: { hues: hues.length, share: Math.round(accentShare * 100) / 100 } };
  }

