  // ---------- data viz: chart detection and text alternative (SU-189) ----------
  const VIZ_MIN = { width: 200, height: 120 };
  const VIZ_MIN_MARKS = 3;
  const VIZ_MARKS = 'path, line, polyline, rect, circle';
  const VIZ_TABLE_HINT = /view (as|the) table|data table|show table/i;
  const VIZ_NAMING_ANCESTOR = 'figure, [role=figure], [role=region], [role=group], section';
  let vizChartsCache = null;
  const isLabelled = (node) => {
    if ((node.getAttribute('aria-label') || '').trim()) return true;
    return (node.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
      .some((id) => { const target = document.getElementById(id); return !!target && !!target.textContent.trim(); });
  };
  const isDecorativeGraphic = (el) => el.getAttribute('aria-hidden') === 'true' || /^(presentation|none)$/.test(el.getAttribute('role') || '');
  // A chart: a visible svg of at least 200×120 with 3+ marks (not an icon in a control), or a visible canvas of that size.
  function vizCharts() {
    if (vizChartsCache) return vizChartsCache;
    const found = [];
    for (const svg of ROOT.querySelectorAll('svg')) {
      if ((svg.parentElement && svg.parentElement.closest('svg')) || svg.closest('button, a, [role=button], [role=link]')) continue;
      const rect = svg.getBoundingClientRect();
      if (rect.width < VIZ_MIN.width || rect.height < VIZ_MIN.height || !isVisible(svg)) continue;
      if (svg.querySelectorAll(VIZ_MARKS).length < VIZ_MIN_MARKS) continue;
      if (isDecorativeGraphic(svg)) { skipped('decorative svg chart (aria-hidden)'); continue; }
      found.push({ el: svg, kind: 'svg' });
    }
    for (const canvasEl of ROOT.querySelectorAll('canvas')) {
      const rect = canvasEl.getBoundingClientRect();
      if (rect.width < VIZ_MIN.width || rect.height < VIZ_MIN.height || !isVisible(canvasEl)) continue;
      found.push({ el: canvasEl, kind: 'canvas' });
    }
    vizChartsCache = found;
    return found;
  }
  // svg: aria-label/labelledby, a <title> child, or a labelled figure/region/section ancestor; canvas: label or fallback text.
  function vizHasName({ el, kind }) {
    if (isLabelled(el)) return true;
    if (kind === 'canvas') return !!el.textContent.trim();
    if ([...el.children].some((child) => child.tagName.toLowerCase() === 'title' && child.textContent.trim())) return true;
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      if (!node.matches(VIZ_NAMING_ANCESTOR)) continue;
      const caption = node.matches('figure') ? node.querySelector(':scope > figcaption') : null;
      if (isLabelled(node) || (caption && caption.textContent.trim())) return true;
    }
    return false;
  }
  function vizHasTable(el) {
    const container = el.closest('figure, section, article, [role=region], [class*=card]') || el.parentElement;
    return !!container && (!!container.querySelector('table, [role=table], [role=grid]') || VIZ_TABLE_HINT.test(container.textContent));
  }
  function checkChartAlternatives() {
    for (const chart of vizCharts()) {
      checked('charts');
      if (chart.kind === 'canvas') skipped('canvas chart (contents not measurable)');
      if (!vizHasName(chart)) {
        add('SU-189', 'fail', 'Chart text alternative', chart.el, 'chart has no text alternative',
          'role="img" with an aria-label stating the takeaway (or a <title>), plus the data as a table');
      }
      if (!vizHasTable(chart.el)) {
        add('SU-189', 'info', 'Chart text alternative', chart.el, 'no data table or "view as table" control near the chart',
          'Offer the data as a table: a visible <table> or a "View as table" toggle');
      }
    }
  }
  REGISTERED = [...REGISTERED, ['chart alternatives', checkChartAlternatives]];
