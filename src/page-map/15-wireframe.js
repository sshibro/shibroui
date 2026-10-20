  // ---------- wireframe ----------
  const LANDMARK = 'header, nav, main, aside, footer, section, article, form, table, dialog[open], [role=banner], [role=navigation], [role=main], [role=complementary], [role=contentinfo], [role=region], [role=tablist], [role=toolbar], [role=dialog]';
  function label(el) {
    const heading = el.querySelector('h1, h2, h3, h4, h5, h6, [role=heading], legend, caption');
    const text = (heading && heading.textContent) || el.getAttribute('aria-label') || '';
    const clean = text.trim().replace(/\s+/g, ' ');
    const tag = el.tagName.toLowerCase();
    return clean ? `${tag} "${clean.slice(0, 26)}"` : `${tag}${el.classList[0] ? `.${el.classList[0]}` : ''}`;
  }
  // Landmarks and surfaces from `pool` big enough to draw, minus wrappers with the same box, biggest `cap` first.
  function pickRegions(pool, minArea, cap) {
    let candidates = pool.filter((el) => (el.matches(LANDMARK) || isSurface(el)) && (el.matches(LANDMARK) || pageRect(el).w * pageRect(el).h >= minArea));
    candidates = candidates.filter((el) => {
      const parent = candidates.find((p) => p !== el && p.contains(el) && !candidates.some((q) => q !== p && q !== el && p.contains(q) && q.contains(el)));
      if (!parent) return true;
      const [a, b] = [pageRect(el), pageRect(parent)];
      return !(Math.abs(a.x - b.x) < 4 && Math.abs(a.y - b.y) < 4 && Math.abs(a.w - b.w) < 4 && Math.abs(a.h - b.h) < 4);
    });
    const depthOf = (el) => candidates.filter((p) => p !== el && p.contains(el)).length;
    const drawable = candidates.map((el) => ({ el, depth: depthOf(el), rect: pageRect(el) })).filter((r) => r.depth <= 2);
    const regions = [...drawable].sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h).slice(0, cap)
      .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)
      .map((r, i) => ({ ...r, n: i + 1 }));
    return { regions, total: drawable.length };
  }
  // ASCII boxes for `regions` inside `area` (page coordinates), at most `maxRows` rows.
  function drawMap(regions, area, cols, maxRows) {
    const cellW = area.w / cols;
    const cellH = Math.max(cellW * 2, area.h / maxRows);
    const rows = Math.max(2, Math.min(maxRows, Math.ceil(area.h / cellH)));
    const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
    const put = (y, x, ch) => { if (y >= 0 && y < rows && x >= 0 && x < cols) grid[y][x] = ch; };
    for (const region of [...regions].sort((a, b) => a.depth - b.depth)) {
      const x0 = Math.max(0, Math.floor((region.rect.x - area.x) / cellW));
      const x1 = Math.min(cols - 1, Math.max(x0 + 1, Math.ceil((region.rect.x - area.x + region.rect.w) / cellW) - 1));
      const y0 = Math.max(0, Math.floor((region.rect.y - area.y) / cellH));
      const y1 = Math.min(rows - 1, Math.max(y0 + 1, Math.ceil((region.rect.y - area.y + region.rect.h) / cellH) - 1));
      for (let x = x0; x <= x1; x += 1) { put(y0, x, '-'); put(y1, x, '-'); }
      for (let y = y0; y <= y1; y += 1) { put(y, x0, '|'); put(y, x1, '|'); }
      [[y0, x0], [y0, x1], [y1, x0], [y1, x1]].forEach(([y, x]) => put(y, x, '+'));
      const text = `${region.n} ${label(region.el)}`.slice(0, Math.max(0, x1 - x0 - 1));
      const ty = y1 - y0 >= 2 ? y0 + 1 : y0;
      [...text].forEach((ch, i) => put(ty, x0 + 1 + i, ch));
    }
    return { map: grid.map((row) => row.join('').replace(/\s+$/, '')).join('\n'), scale: `1 column ≈ ${Math.round(cellW)}px, 1 row ≈ ${Math.round(cellH)}px` };
  }
  const describeRegion = (r) => ({
    n: r.n, label: label(r.el), path: path(r.el), depth: r.depth,
    box: `${Math.round(r.rect.x)},${Math.round(r.rect.y)} ${Math.round(r.rect.w)}×${Math.round(r.rect.h)}`,
    interactive: r.el.querySelectorAll(INTERACTIVE).length, textChars: r.el.textContent.trim().length,
  });
  function wireframe() {
    // The threshold comes from the viewport, not the document, so the sections of a long page still qualify.
    const minArea = Math.min(docWidth * docHeight, innerWidth * innerHeight * 3) * 0.004;
    const { regions, total } = pickRegions(elements, minArea, LIMITS.maxRegions);
    if (total > LIMITS.maxRegions) COVERAGE.capsHit.push(`the wireframe draws the ${LIMITS.maxRegions} largest of ${total} regions${isLongPage() ? '; bands[].wireframe draws each band in detail' : ''}`);
    return { ...drawMap(regions, { x: 0, y: 0, w: docWidth, h: docHeight }, OPTIONS.cols, OPTIONS.maxRows), regions: regions.map(describeRegion) };
  }

