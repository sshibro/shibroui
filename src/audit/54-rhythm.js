  // ---------- Pixel rhythm: control rows and baselines (SU-203, SU-4) ----------
  const LAYOUT_RHYTHM = { gapSpread: 2, groupingRatio: 2, insetSpread: 2, minRowItems: 3, minTrackItems: 2, baselineSpread: 2, sizeRatio: 1.25, maxRows: 300 };
  const SELECTED_ATTRIBUTE = '[aria-selected="true"], [aria-checked="true"], [aria-pressed="true"], [aria-current="true"]';
  const SELECTED_CLASS = /\b(active|selected|is-active)\b/;
  const PROBE_STYLE = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  const TEXT_CONTAINER_DISPLAY = /^(block|inline-block|flow-root|list-item)$/;

  const layoutIsFlexRow = (style) => /flex/.test(style.display) && /^row/.test(style.flexDirection);
  const layoutHasControl = (el) => el.matches(INTERACTIVE) || !!el.querySelector(INTERACTIVE);
  const layoutOverlapsVertically = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > Math.min(a.height, b.height) / 2;
  // Visible children of a flex row, minus non-control children at either end (a title beside a toolbar).
  function layoutControlItems(row) {
    let items = [...row.children].filter(isVisible);
    while (items.length && !layoutHasControl(items[0])) items = items.slice(1);
    while (items.length && !layoutHasControl(items[items.length - 1])) items = items.slice(0, -1);
    return items.every(layoutHasControl) ? items : [];
  }
  function layoutUnevenGaps(items) {
    const rects = items.map((item) => item.getBoundingClientRect()).sort((a, b) => a.left - b.left);
    if (!rects.slice(1).every((rect, i) => layoutOverlapsVertically(rects[i], rect))) return null;
    const gaps = rects.slice(1).map((rect, i) => Math.round((rect.left - rects[i].right) * 10) / 10);
    const [smallest, largest] = [Math.min(...gaps), Math.max(...gaps)];
    // Larger jumps are deliberate grouping; only near-equal gaps that are not equal are a defect.
    return largest - smallest > LAYOUT_RHYTHM.gapSpread && largest < LAYOUT_RHYTHM.groupingRatio * smallest ? gaps : null;
  }
  function layoutSelectedInset(row, items) {
    const selected = items.find((item) => (item.matches(SELECTED_ATTRIBUTE) || SELECTED_CLASS.test(item.getAttribute('class') || '')) && parseColor(css(item).backgroundColor).a > 0.05);
    if (!selected) return null;
    const [rowRect, itemRect, s] = [row.getBoundingClientRect(), selected.getBoundingClientRect(), css(row)];
    const top = itemRect.top - (rowRect.top + px(s.borderTopWidth));
    const bottom = rowRect.bottom - px(s.borderBottomWidth) - itemRect.bottom;
    return Math.abs(top - bottom) > LAYOUT_RHYTHM.insetSpread ? Math.abs(top - bottom) / 2 : null;
  }
  function checkControlRows() {
    let rows = 0;
    for (const row of LAYOUT_ALL_ELEMENTS()) {
      if (row.childElementCount < LAYOUT_RHYTHM.minTrackItems || rows >= LAYOUT_RHYTHM.maxRows) continue;
      if (!layoutIsFlexRow(css(row)) || !isVisible(row)) continue;
      const items = layoutControlItems(row);
      if (items.length < LAYOUT_RHYTHM.minTrackItems) continue;
      rows += 1;
      checked('control rows');
      const gaps = items.length >= LAYOUT_RHYTHM.minRowItems ? layoutUnevenGaps(items) : null;
      if (gaps) add('SU-203', 'warn', 'Control rows keep one rhythm', row, `uneven gaps between items: ${gaps.join(', ')}px`, 'Use one gap value for the whole row (gap: 8px or 12px), and group deliberately with a bigger jump');
      const off = layoutSelectedInset(row, items);
      if (off) add('SU-203', 'warn', 'Control rows keep one rhythm', row, `selected item sits ${off.toFixed(1)}px off-center in its track`, 'Equal inset from the track on every side: the track padding is the same top and bottom');
    }
  }

  // Probe first-line baselines with a zero-size inline-block; always removed again.
  function layoutBaselineSpread(children) {
    const probes = children.map(() => Object.assign(document.createElement('span'), { style: PROBE_STYLE }));
    try {
      children.forEach((child, i) => child.insertBefore(probes[i], child.firstChild));
      const tops = probes.map((probe) => probe.getBoundingClientRect().top);
      return Math.max(...tops) - Math.min(...tops);
    } finally {
      probes.forEach((probe) => probe.remove());
    }
  }
  const layoutInlineTextOnly = (el, style) => TEXT_CONTAINER_DISPLAY.test(style.display) && el.textContent.trim().length > 0
    && !el.matches('input, select, textarea, img, svg, video, canvas') && [...el.children].every((c) => /^(inline|contents)/.test(css(c).display));
  // A badge, chip or button paints its own box, and boxes center optically, so they're not baseline text.
  const layoutPaintsBox = (style) => parseColor(style.backgroundColor).a > 0.05 || style.backgroundImage !== 'none'
    || ['Top', 'Right', 'Bottom', 'Left'].some((side) => px(style[`border${side}Width`]) > 0 && parseColor(style[`border${side}Color`]).a > 0.05);
  function checkBaselines() {
    let rows = 0;
    for (const row of LAYOUT_ALL_ELEMENTS()) {
      if (row.childElementCount < 2) continue;
      if (rows >= LAYOUT_RHYTHM.maxRows) { COVERAGE.capsHit.push(`baselines checked the first ${LAYOUT_RHYTHM.maxRows} mixed-size text rows`); break; }
      const style = css(row);
      if (!layoutIsFlexRow(style) || /baseline/.test(style.alignItems) || !isVisible(row)) continue;
      const texts = [...row.children].filter((child) => isVisible(child) && layoutInlineTextOnly(child, css(child)) && !layoutPaintsBox(css(child)));
      if (texts.length < 2) continue;
      const sizes = texts.map((child) => px(css(child).fontSize));
      if (Math.max(...sizes) / Math.min(...sizes) < LAYOUT_RHYTHM.sizeRatio) continue;
      const rects = texts.map((child) => child.getBoundingClientRect());
      if (Math.max(...rects.map((r) => r.top)) >= Math.min(...rects.map((r) => r.bottom))) continue; // wrapped onto other lines
      rows += 1;
      checked('flex text rows (baselines)');
      const spread = layoutBaselineSpread(texts);
      if (spread > LAYOUT_RHYTHM.baselineSpread) add('SU-4', 'warn', 'Baselines', row, `text baselines differ by ${Math.round(spread)}px; align-items: baseline`, 'Align mixed-size text on the baseline (align-items: baseline), not on the box centers');
    }
  }
  REGISTERED = [...REGISTERED, ['control rows', () => checkControlRows()], ['baselines', () => checkBaselines()]];
