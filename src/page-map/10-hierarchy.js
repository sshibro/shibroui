  // ---------- hierarchy (SU-119, SU-120, SU-121, SU-131) ----------
  // Text grouped by style and ranked by visual weight, loudest first (used page-wide and per band).
  function textGroups(owners) {
    const groups = new Map();
    for (const el of owners) {
      const s = css(el);
      const size = px(s.fontSize);
      const weight = px(s.fontWeight) || 400;
      const fg = parseColor(s.color);
      const bg = backdrop(el);
      // Salience: how far the text stands from its surface (lightness and chroma), and a saturated
      // surface (a colored tile or banner) reads loud on its own even when its text is low-contrast.
      const textSalience = Math.min(1, labDistance(over(fg, bg), bg) / 0.5);
      const surfaceSalience = oklab(bg).C >= LIMITS.accentChroma ? 0.9 : 0;
      const score = size * size * (0.75 + 0.25 * (weight / 400)) * Math.max(0.15, textSalience, surfaceSalience);
      const key = `${round(size, 0.5)}px/${weight}/${hex(fg)}${s.textTransform === 'uppercase' ? '/caps' : ''}`;
      const group = groups.get(key) || { style: key, score: 0, count: 0, samples: [], elements: [] };
      groups.set(key, { ...group, score: Math.max(group.score, score), count: group.count + 1,
        samples: group.samples.length < 3 ? [...group.samples, ownText(el).slice(0, 28)] : group.samples, elements: [...group.elements, el] });
    }
    return [...groups.values()].sort((a, b) => b.score - a.score);
  }
  // Filled, high-contrast buttons and links: the loud ones (SU-121, SU-208).
  function loudButtonList() {
    const list = [];
    for (const el of elements.filter((e) => e.matches('button, [role=button], input[type=submit], input[type=button], a[href]'))) {
      const s = css(el);
      const fill = parseColor(s.backgroundColor);
      const box = pageRect(el);
      if (fill.a < 0.8 || !el.parentElement || box.y + box.h <= 0 || box.x + box.w <= 0) continue; // off-screen (e.g. an unfocused skip link)
      if (ratio(over(fill, backdrop(el.parentElement)), backdrop(el.parentElement)) < LIMITS.loudButtonContrast) continue;
      const region = el.closest('section, article, form, aside, header, nav, dialog, [role=region], [role=dialog], main') || document.body;
      list.push({ el, label: snippet(el, 24), region });
    }
    return list;
  }
  function hierarchy() {
    const ranked = textGroups(textOwners);
    const top = ranked[0];
    if (!top) return { tiers: [] };
    const peers = ranked.filter((g) => g.score >= top.score * LIMITS.peerTier);
    const loud = ranked.filter((g) => g.score >= top.score * LIMITS.loudTier);
    if (peers.length > 1) flag('SU-119', 'warn', 'One focal point', `${peers.length} different styles compete for first read: ${peers.map((g) => `${g.style} "${g.samples[0]}"`).join(' · ')}`, peers.map((g) => g.elements[0]));
    if (loud.length >= LIMITS.loudStyles) flag('SU-131', 'warn', 'Three tiers', `${loud.length} distinct loud styles (within 50% of the top weight); aim for one loud tier, one strong tier, the rest quiet`, loud.map((g) => g.elements[0]));
    if (top.count > 6) flag('SU-131', 'info', 'Three tiers', `${top.count} elements share the loudest style (${top.style}); that many equal peers dilute the focal point`, top.elements);

    const loudButtons = loudButtonList();
    const byRegion = new Map();
    for (const b of loudButtons) byRegion.set(b.region, [...(byRegion.get(b.region) || []), b]);
    const regionSummary = [...byRegion.entries()].map(([region, list]) => ({ region: path(region), labels: [...new Set(list.map((b) => b.label))] }));
    for (const entry of regionSummary) {
      if (entry.labels.length > 1) flag('SU-121', 'warn', 'One primary action per view', `${entry.labels.length} loud (filled, high-contrast) buttons in ${entry.region}: ${entry.labels.join(', ')}`, loudButtons.filter((b) => path(b.region) === entry.region).map((b) => b.el));
    }
    const firstScreen = loudButtons.filter((b) => pageRect(b.el).y < innerHeight);
    const firstLabels = [...new Set(firstScreen.map((b) => b.label))];
    if (firstLabels.length > 2) flag('SU-121', 'warn', 'One primary action per view', `${firstLabels.length} loud buttons in the first screen: ${firstLabels.join(', ')}`, firstScreen.map((b) => b.el));
    if (loudButtons.length && !firstScreen.length) flag('SU-120', 'info', 'Reading order', 'no loud (primary-looking) action in the first screen; the primary action sits below the fold', [loudButtons[0].el]);
    const focal = top.elements[0];
    const focalY = pageRect(focal).y;
    if (focalY > innerHeight) flag('SU-120', 'warn', 'Reading order', `the first read ("${top.samples[0]}") starts ${Math.round(focalY)}px down, below the first screen`, [focal]);

    return {
      firstRead: { style: top.style, text: top.samples[0], element: path(focal), y: Math.round(focalY) },
      tiers: ranked.slice(0, 8).map((g) => ({ style: g.style, relativeWeight: Math.round((g.score / top.score) * 100) / 100, count: g.count, samples: g.samples })),
      loudButtons: regionSummary,
    };
  }

