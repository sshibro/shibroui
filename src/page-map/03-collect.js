  // ---------- collect ----------
  const COVERAGE = { capsHit: [], skipped: {} };
  let running = [];
  let elements = [];
  let textOwners = [];
  let surfaces = [];
  let docWidth = 0;
  let docHeight = 0;
  function collect() {
    // Measure the resting state: fast-forward finite running animations (entrance fades frozen mid-flight
    // in a background tab would otherwise hide whole panels).
    running = document.getAnimations ? document.getAnimations().filter((a) => {
      const timing = a.effect && a.effect.getComputedTiming();
      return a.playState !== 'finished' && a.playState !== 'idle' && timing && Number.isFinite(timing.endTime);
    }) : [];
    running.forEach((a) => { try { a.finish(); } catch { /* infinite or detached animation */ } });
    styleCache.clear();
    const all = [...ROOT.querySelectorAll('*')];
    if (all.length > LIMITS.maxElements) COVERAGE.capsHit.push(`measured the first ${LIMITS.maxElements} of ${all.length} elements; scope with window.__shibroPageMap = { root } and run per region`);
    elements = all.slice(0, LIMITS.maxElements).filter((el) => !/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|svg|path|BR)$/i.test(el.tagName) && isVisible(el));
    textOwners = elements.filter((el) => ownText(el).length > 0);
    surfaces = elements.filter(isSurface);
    docWidth = Math.max(document.documentElement.scrollWidth, innerWidth);
    docHeight = Math.max(document.documentElement.scrollHeight, innerHeight);
  }

