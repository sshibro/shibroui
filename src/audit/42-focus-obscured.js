
  // ---------- focus not obscured (SU-145, WCAG 2.4.11) ----------
  // A sticky header or footer can hide the element that just got focus when the browser scrolls it to the
  // nearest edge. Each focusable is scrolled into view from both directions and its hit points are sampled.
  const SEM_FOCUS_OBSCURED_CAP = 300;
  const SEM_COVER_INSET_PX = 2;
  const SEM_MAX_LAYERS = 50;
  let semLayerCache = null;
  // Fixed and sticky elements inside the audit root, computed once per run.
  function semLayers() {
    if (semLayerCache) return semLayerCache;
    const fixed = [];
    const sticky = [];
    for (const el of [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements)) {
      const position = css(el).position;
      if (position === 'fixed') fixed.push(el);
      else if (position === 'sticky') sticky.push(el);
    }
    semLayerCache = { fixed, sticky };
    return semLayerCache;
  }
  // The layer that covers all five sample points of `el`, or null when any point is free or off screen.
  function semCoveringLayer(el, layers) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    const [dx, dy] = [Math.min(SEM_COVER_INSET_PX, r.width / 2 - 0.5), Math.min(SEM_COVER_INSET_PX, r.height / 2 - 0.5)];
    const points = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + dx, r.top + dy], [r.right - dx, r.top + dy], [r.left + dx, r.bottom - dy], [r.right - dx, r.bottom - dy]];
    let cover = null;
    for (const [x, y] of points) {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return null;
      const top = document.elementsFromPoint(x, y)[0];
      const layer = top && layers.find((candidate) => candidate.contains(top));
      if (!layer) return null;
      cover = cover || layer;
    }
    return cover;
  }

  function checkFocusObscured({ targets }) {
    const layers = [...semLayers().fixed, ...semLayers().sticky].filter(isVisible).slice(0, SEM_MAX_LAYERS);
    if (!layers.length) { checked('focus obscured: no sticky elements'); return; }
    if (targets.length > SEM_FOCUS_OBSCURED_CAP) COVERAGE.capsHit.push(`focus obscured checked the first ${SEM_FOCUS_OBSCURED_CAP} of ${targets.length} focusable elements`);
    const [left, top] = [scrollX, scrollY];
    const previous = document.activeElement;
    const lastScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const scrollWindowTo = (y) => scrollTo({ left, top: y, behavior: 'instant' });
    for (const el of targets.slice(0, SEM_FOCUS_OBSCURED_CAP)) {
      const others = layers.filter((layer) => !layer.contains(el) && !el.contains(layer));
      if (!others.length) continue;
      checked('focus obscured');
      el.focus({ preventScroll: true });
      const cover = [lastScroll, 0].map((from) => {
        scrollWindowTo(from);
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        return semCoveringLayer(el, others);
      }).find(Boolean);
      if (!cover) continue;
      const height = Math.round(cover.getBoundingClientRect().height);
      add('SU-145', 'fail', 'Focus not obscured', el, `focused element is fully covered by ${describe(cover)} (${height}px) once scrolled into view`,
        `scroll-padding-top / scroll-padding-bottom equal to the sticky bar's height (html { scroll-padding-top: ${height + 8}px })`);
    }
    scrollWindowTo(top);
    if (previous && previous.focus && previous !== document.body) previous.focus({ preventScroll: true });
    else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  REGISTERED = [...REGISTERED, ['focus obscured', checkFocusObscured]];
