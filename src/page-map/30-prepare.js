  // ---------- big pages: prepare sweep and content hidden until scrolled (H2) ----------
  const PREPARE = { stepRatio: 0.8, waitMs: 120, settleMs: 450, maxSteps: 400, minTextChars: 20 };
  let PREPARED = null;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function pageScroller() {
    const doc = document.scrollingElement || document.documentElement;
    if (doc.scrollHeight > innerHeight + 1) return doc;
    const scrolling = [...document.querySelectorAll('main, [role=main], body > *, body > * > *, body > * > * > *')]
      .filter((el) => /auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1);
    return scrolling.sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth)[0] || doc;
  }
  const isDocumentScroller = (el) => el === document.scrollingElement || el === document.documentElement;
  // Laid-out content at opacity 0 (itself or an ancestor), outermost first: almost always a scroll reveal.
  function transparentContainers() {
    const containers = [];
    for (const el of [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements)) {
      const style = getComputedStyle(el);
      if (style.opacity !== '0' || style.display === 'none' || style.visibility === 'hidden') continue;
      if (/absolute|fixed/.test(style.position) || el.matches('[role=tooltip], input, option')) continue;
      if (containers.some((c) => c.contains(el))) continue;
      const r = el.getBoundingClientRect();
      // A small control revealed on hover (row actions) is SU-174's business; reveals hide content blocks.
      if (r.width < 160 && r.height < 80) continue;
      if (el.closest('dialog:not([open]), [aria-hidden="true"], [inert]')) continue;
      if (el.textContent.trim().length < PREPARE.minTextChars && !el.querySelector(INTERACTIVE)) continue;
      containers.push(el);
    }
    return containers;
  }
  async function prepareSweep() {
    const scroller = pageScroller();
    const started = performance.now();
    const before = document.querySelectorAll('*').length;
    const hiddenAtStart = transparentContainers().length;
    const start = scroller.scrollTop;
    const step = Math.max(200, Math.round((isDocumentScroller(scroller) ? innerHeight : scroller.clientHeight) * PREPARE.stepRatio));
    let steps = 0;
    for (let y = 0; y <= scroller.scrollHeight && steps < PREPARE.maxSteps; y += step) {
      scroller.scrollTo({ top: y, behavior: 'instant' });
      steps += 1;
      await sleep(PREPARE.waitMs);
    }
    if (steps >= PREPARE.maxSteps) COVERAGE.capsHit.push(`prepare stopped after ${PREPARE.maxSteps} scroll steps`);
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' });
    await sleep(PREPARE.waitMs);
    scroller.scrollTo({ top: start, behavior: 'instant' });
    await sleep(PREPARE.settleMs);
    PREPARED = { scroller: isDocumentScroller(scroller) ? 'document' : path(scroller), steps, ms: Math.round(performance.now() - started), elementsBefore: before, elementsAfter: document.querySelectorAll('*').length, hiddenAtStart };
    return PREPARED;
  }
  function unseenContent(notes) {
    const transparent = transparentContainers();
    const count = transparent.reduce((sum, el) => sum + el.querySelectorAll('*').length + 1, 0);
    if (transparent.length) {
      COVERAGE.skipped[`laid out but at opacity 0 (likely scroll reveals): ${count} elements in ${transparent.length} container(s)`] = transparent.length;
      notes.push(`${transparent.length} container(s) holding ${count} elements were at opacity 0 (usually scroll reveals that haven't fired), so the map left them out. ${PREPARED ? 'They stayed hidden after the prepare sweep: check them by hand.' : 'Run again with window.__shibroPageMap = { prepare: true } and await the result.'}`);
    }
    return { transparentContainers: transparent.length, transparentElements: count, sample: transparent.slice(0, 5).map(path) };
  }

