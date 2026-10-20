  // ---------- big pages: prepare sweep, content hidden until scrolled, bands (H2, H3) ----------
  // Scroll reveals (opacity 0 until an IntersectionObserver fires), lazy sections and content-visibility
  // regions don't render until the page has been scrolled. `prepare: true` scrolls the page's scroller once,
  // top to bottom, so they render; without it, the run reports how much of the page it couldn't see.
  const PREPARE = { stepRatio: 0.8, waitMs: 120, settleMs: 450, maxSteps: 400, minTextChars: 20 };
  // Set by prepareSweep(): what was hidden before the sweep. The SU-209 check reads it.
  let PREPARED = null;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // The element that scrolls the page: the document, or an app shell's own scrolling region (B8).
  function pageScroller() {
    const doc = document.scrollingElement || document.documentElement;
    if (doc.scrollHeight > innerHeight + 1) return doc;
    const scrolling = [...document.querySelectorAll('main, [role=main], body > *, body > * > *, body > * > * > *')]
      .filter((el) => /auto|scroll/.test(css(el).overflowY) && el.scrollHeight > el.clientHeight + 1);
    return scrolling.sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth)[0] || doc;
  }
  const isDocumentScroller = (el) => el === document.scrollingElement || el === document.documentElement;
  // Laid-out content that people can't see only because it (or an ancestor) sits at opacity 0, outermost
  // container first. In normal flow and holding text or controls, it's almost always a scroll reveal.
  function transparentContainers() {
    const containers = [];
    for (const el of [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements)) {
      const style = css(el);
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
  // content-visibility: auto regions the browser is still skipping (off-screen and never rendered).
  const skippedContentVisibility = () => [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements)
    .filter((el) => css(el).contentVisibility === 'auto' && el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true }));
  async function prepareSweep() {
    const scroller = pageScroller();
    const started = performance.now();
    const before = document.querySelectorAll('*').length;
    const hiddenAtStart = transparentContainers();
    // Hidden at load although already on screen: a reveal people wait for, or never see without JS.
    const firstScreen = hiddenAtStart.filter((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
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
    PREPARED = {
      scroller: isDocumentScroller(scroller) ? 'document' : path(scroller), steps, ms: Math.round(performance.now() - started),
      elementsBefore: before, elementsAfter: document.querySelectorAll('*').length,
      hiddenAtStart: hiddenAtStart.length,
      hiddenInFirstViewport: firstScreen,
    };
    return PREPARED;
  }
  // What the run couldn't see, for coverage: opacity-0 content and skipped content-visibility regions.
  function unseenContent() {
    const transparent = transparentContainers();
    const elements = transparent.reduce((sum, el) => sum + el.querySelectorAll('*').length + 1, 0);
    const skippedCv = skippedContentVisibility();
    if (transparent.length) {
      COVERAGE.skipped[`laid out but at opacity 0 (likely scroll reveals): ${elements} elements in ${transparent.length} container(s)`] = transparent.length;
      notes.push(`${transparent.length} container(s) holding ${elements} elements were at opacity 0 (usually scroll reveals that haven't fired), so nothing inside them was measured. ${PREPARED ? 'They stayed hidden after the prepare sweep: check them by hand.' : 'Run again with window.__shibroAudit = { prepare: true } and await the result.'}`);
    }
    if (skippedCv.length) COVERAGE.skipped[`content-visibility: auto regions not rendered yet: ${skippedCv.length}`] = skippedCv.length;
    return { transparentContainers: transparent.length, transparentElements: elements, sample: transparent.slice(0, 5).map(path), contentVisibilitySkipped: skippedCv.length };
  }

  // Bands: the page's top-level blocks in reading order (header, hero, sections, footer), the same way
  // page-map.js finds them. Tall wrappers that only stack full-width blocks are opened up.
  const BAND = { minHeight: 24, mergeBelow: 160, openAbove: 1.5, fullWidth: 0.9, maxDepth: 4 };
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
    // A short block (a section heading, a divider) joins the band after it.
    return flat.reduce((bands, el) => {
      const last = bands[bands.length - 1];
      if (last && last.pending) return [...bands.slice(0, -1), { el, parts: [...last.parts, el], pending: el.getBoundingClientRect().height < BAND.mergeBelow }];
      return [...bands, { el, parts: [el], pending: el.getBoundingClientRect().height < BAND.mergeBelow && el.tagName !== 'HEADER' }];
    }, []).map(({ el, parts }) => ({ el: parts.length > 1 && parts.every((p) => p.parentElement === parts[0].parentElement) && blocks(parts[0].parentElement).length === parts.length ? parts[0].parentElement : el, parts }));
  }
