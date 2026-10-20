  // ---------- data viz: chart text and series marks (SU-187, SU-188) ----------
  const VIZ_MIN_TEXT_PX = 12;
  const VIZ_MARK_RATIO = 3;
  const VIZ_MIN_STROKE_PX = 1.5;
  const VIZ_MIN_FILL_AREA = 40;
  const VIZ_BACKGROUND_SHARE = 0.5;
  const VIZ_AXIS_SPAN = 0.8;
  const VIZ_LINE_THICKNESS_PX = 1.5;
  const VIZ_TEXT_CAP = 300;
  const VIZ_MARK_CAP = 600;
  const VIZ_BACKDROP_INSET = 3;
  const VIZ_SERIES_MARKS = 'path, line, polyline, rect, circle';
  const VIZ_NON_RENDERED = 'defs, clipPath, mask, marker, pattern, symbol';
  // Screen pixels per svg user unit, so a viewBox-scaled chart is judged at the size people actually see.
  function vizScale(node) {
    try { const matrix = node.getScreenCTM(); return matrix ? Math.hypot(matrix.a, matrix.b) || 1 : 1; } catch { return 1; }
  }
  function vizVisible(node) {
    if (node.closest(VIZ_NON_RENDERED)) return false;
    const rect = node.getBoundingClientRect();
    if (rect.width < 1 && rect.height < 1) return false;
    for (let el = node; el && el.nodeType === 1; el = el.parentElement) {
      const style = css(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    }
    return true;
  }
  // The paint of an svg shape as a color with opacity applied, null for none, 'unmeasurable' for gradients and patterns.
  function vizPaint(node, property) {
    const style = css(node);
    const value = style[property];
    if (!value || value === 'none') return null;
    if (/^url\(/.test(value)) return 'unmeasurable';
    const color = parseColor(value);
    const alpha = color.a * (px(style[`${property}Opacity`]) || (style[`${property}Opacity`] === '0' ? 0 : 1)) * effectiveOpacity(node);
    return alpha > 0 ? { ...color, a: alpha } : null;
  }
  // Backdrop surfaces behind a point in a chart: the page backdrop plus any svg rect/circle drawn under it.
  function vizBackdrop(svg, x, y, mark, minShare) {
    const base = backdropAt(svg, x, y);
    if (base.covered || base.image) return base;
    const svgRect = svg.getBoundingClientRect();
    let surfaces = base.stops || [base.color];
    for (const shape of svg.querySelectorAll('rect, circle, ellipse')) {
      if (shape === mark || !(shape.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING) || shape.contains(mark) || !vizVisible(shape)) continue;
      const box = shape.getBoundingClientRect();
      const inside = x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
      const share = (box.width * box.height) / (svgRect.width * svgRect.height);
      const paint = inside && share >= minShare ? vizPaint(shape, 'fill') : null;
      if (paint && paint !== 'unmeasurable') surfaces = surfaces.map((surface) => over(paint, surface));
    }
    return { surfaces };
  }
  const worstRatio = (paint, surfaces) => Math.min(...surfaces.map((surface) => ratio(over(paint, surface), surface)));
  // Findings that must collapse to one per color: add() once, then fold the other instances into it.
  function vizAddGroup(id, level, rule, elements, detail, fix) {
    add(id, level, rule, elements[0], detail, fix);
    const finding = [...findings.values()].find((f) => f.id === id && f.detail === detail);
    if (!finding || elements.length < 2) return;
    finding.count += elements.length - 1;
    elements.slice(1).forEach((el) => { if (finding.instances.length < LIMITS.maxInstances) finding.instances.push(path(el)); });
  }
  function checkChartText({ el: svg }) {
    let seen = 0;
    for (const text of svg.querySelectorAll('text')) {
      if (seen >= VIZ_TEXT_CAP) { COVERAGE.capsHit.push(`chart text checked for the first ${VIZ_TEXT_CAP} labels only`); return; }
      if (!text.textContent.trim() || !vizVisible(text)) continue;
      seen += 1;
      checked('chart text');
      const size = px(css(text).fontSize) * vizScale(text);
      if (size < VIZ_MIN_TEXT_PX) add('SU-188', 'warn', 'Chart text', text, `chart text ${Math.round(size * 10) / 10}px (under ${VIZ_MIN_TEXT_PX}px)`, 'Axis and label text at 12px or larger');
      const paint = vizPaint(text, 'fill');
      if (!paint) continue;
      if (paint === 'unmeasurable') { skipped('chart text with gradient fill'); continue; }
      const box = text.getBoundingClientRect();
      const backdrop = vizBackdrop(svg, box.left + box.width / 2, box.top + box.height / 2, text, 0);
      if (backdrop.covered) { skipped('chart text covered by an overlay'); continue; }
      if (backdrop.image) { skipped('chart text over an image (contrast not measurable)'); continue; }
      const needed = size >= LIMITS.largePx ? LIMITS.textLarge : LIMITS.textAA;
      const value = worstRatio(paint, backdrop.surfaces);
      if (value >= needed) continue;
      const background = backdrop.surfaces[0];
      add('SU-188', 'fail', 'Chart text', text, `chart text ${hex(paint)} on ${hex(background)} = ${value.toFixed(2)}:1 (needs ≥ ${needed}:1)`,
        `node scripts/contrast.mjs '${hex(paint)}' '${hex(background)}' --fix`);
    }
  }
  // Gridlines and axes: straight horizontal or vertical lines spanning most of the chart are not series.
  function vizIsAxis(box, svgRect) {
    const flat = box.height < VIZ_LINE_THICKNESS_PX && box.width >= svgRect.width * VIZ_AXIS_SPAN;
    const upright = box.width < VIZ_LINE_THICKNESS_PX && box.height >= svgRect.height * VIZ_AXIS_SPAN;
    return flat || upright;
  }
  function checkChartMarks({ el: svg }) {
    const svgRect = svg.getBoundingClientRect();
    const svgArea = svgRect.width * svgRect.height;
    const backdrop = vizBackdrop(svg, svgRect.left + VIZ_BACKDROP_INSET, svgRect.top + VIZ_BACKDROP_INSET, svg.lastElementChild || svg, VIZ_BACKGROUND_SHARE);
    if (backdrop.covered) { skipped('chart covered by an overlay'); return; }
    if (backdrop.image) { skipped('chart over an image (contrast not measurable)'); return; }
    const groups = new Map();
    const marks = [...svg.querySelectorAll(VIZ_SERIES_MARKS)];
    if (marks.length > VIZ_MARK_CAP) COVERAGE.capsHit.push(`chart marks checked for the first ${VIZ_MARK_CAP} of ${marks.length}`);
    for (const mark of marks.slice(0, VIZ_MARK_CAP)) {
      if (!vizVisible(mark)) continue;
      const box = mark.getBoundingClientRect();
      const strokePaint = vizPaint(mark, 'stroke');
      const strokePx = px(css(mark).strokeWidth) * vizScale(mark);
      const fillPaint = mark.matches('line') ? null : vizPaint(mark, 'fill');
      const filled = fillPaint && box.width * box.height >= VIZ_MIN_FILL_AREA && box.width * box.height < svgArea * VIZ_BACKGROUND_SHARE;
      const stroked = strokePaint && strokePx >= VIZ_MIN_STROKE_PX && !vizIsAxis(box, svgRect);
      for (const paint of [stroked ? strokePaint : null, filled ? fillPaint : null]) {
        if (!paint) continue;
        if (paint === 'unmeasurable') { skipped('chart marks with gradient or pattern paint'); continue; }
        const key = `${hex(paint)}@${paint.a.toFixed(2)}`;
        groups.set(key, { paint, elements: [...(groups.get(key) ? groups.get(key).elements : []), mark] });
      }
    }
    checked('chart series colors', groups.size);
    for (const { paint, elements } of groups.values()) {
      const value = worstRatio(paint, backdrop.surfaces);
      if (value >= VIZ_MARK_RATIO) continue;
      vizAddGroup('SU-187', 'warn', 'Series marks', elements,
        `series color ${hex(paint)} on ${hex(backdrop.surfaces[0])} = ${value.toFixed(2)}:1 (needs ${VIZ_MARK_RATIO}:1)`,
        'Series and chart marks need 3:1 against the plot background (WCAG 1.4.11); darken the color or add a direct label');
    }
  }
  REGISTERED = [...REGISTERED, ['chart marks', () => {
    for (const chart of vizCharts()) {
      if (chart.kind !== 'svg') continue;
      reveal(chart.el);
      checkChartText(chart);
      checkChartMarks(chart);
    }
  }]];
