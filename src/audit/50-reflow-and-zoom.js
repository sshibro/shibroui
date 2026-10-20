  // ---------- Reflow, zoom and text spacing (SU-170, SU-171, SU-172) ----------
  const LAYOUT_REFLOW = {
    maxViewport: 400, overflowSlack: 1, maxOffenders: 20, scrollerMinHeight: 80,
    minZoomScale: 2, minRootPx: 16, spacingSlack: 2,
  };
  const REFLOW_EXEMPT = 'table, pre, code, canvas, video, svg, iframe, [role=img], [role=application]';
  const SPACING_STYLE = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important } p { margin-bottom: 2em !important }';
  const LAYOUT_ALL_ELEMENTS = () => [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements);

  // An ancestor that scrolls or clips sideways (or a fixed layer) keeps the element from widening the page.
  function layoutContainedSideways(el) {
    for (let node = el; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const style = css(node);
      if (style.position === 'fixed') return true;
      if (node !== el && /auto|scroll|hidden/.test(style.overflowX)) return true;
    }
    return false;
  }
  // Text that runs past the edge inside a box that itself fits: the deepest element whose content still overflows.
  const layoutContentRight = (el) => el.getBoundingClientRect().left + scrollX + el.scrollWidth;
  function layoutTextOverflows(el, limit) {
    if (el.scrollWidth <= el.clientWidth + LAYOUT_REFLOW.overflowSlack || layoutContentRight(el) <= limit) return false;
    return ![...el.children].some((child) => layoutContentRight(child) > limit);
  }
  // The outermost box offender per branch, so one wide wrapper is one finding instead of fifty.
  function layoutOverflowOffenders() {
    const limit = innerWidth + LAYOUT_REFLOW.overflowSlack;
    const offenders = [];
    for (const el of LAYOUT_ALL_ELEMENTS()) {
      if (offenders.length >= LAYOUT_REFLOW.maxOffenders) break;
      const boxOverflows = el.getBoundingClientRect().right + scrollX > limit;
      if (!boxOverflows && !layoutTextOverflows(el, limit)) continue;
      if (el.closest(REFLOW_EXEMPT) || offenders.some((offender) => offender.contains(el))) continue;
      if (!isVisible(el) || layoutContainedSideways(el)) continue;
      offenders.push(el);
    }
    return offenders;
  }
  function layoutKeyboardScrollers() {
    for (const el of LAYOUT_ALL_ELEMENTS()) {
      if (el.clientWidth === 0 || el.scrollWidth <= el.clientWidth + LAYOUT_REFLOW.overflowSlack) continue;
      if (el.matches('textarea, input, select') || !/auto|scroll/.test(css(el).overflowX)) continue;
      if (el.getBoundingClientRect().height < LAYOUT_REFLOW.scrollerMinHeight || !isVisible(el)) continue;
      checked('scrollable regions');
      if (el.matches(INTERACTIVE) || el.querySelector(INTERACTIVE)) continue;
      add('SU-170', 'warn', 'Reflow', el, 'scrollable region is not keyboard focusable', 'Add tabindex=0 and a name (role=region + aria-label) so keyboard users can scroll it');
    }
  }
  function checkReflow() {
    layoutKeyboardScrollers();
    if (innerWidth > LAYOUT_REFLOW.maxViewport) { skipped(`page reflow: viewport is ${innerWidth}px (run again at 320px wide)`); return; }
    checked('page reflow (viewport ≤ 400px)');
    const root = document.documentElement;
    if (root.scrollWidth <= root.clientWidth + LAYOUT_REFLOW.overflowSlack) return;
    const fix = 'No horizontal page scroll at 320px: let text wrap (min-width: 0, overflow-wrap: anywhere) and scroll wide tables or code inside their own container';
    add('SU-170', 'fail', 'Reflow', null, `page is ${root.scrollWidth}px wide at a ${innerWidth}px viewport`, fix);
    for (const el of layoutOverflowOffenders()) add('SU-170', 'fail', 'Reflow', el, 'extends past the right edge of the viewport', fix);
  }

  // Zoom must never be blocked, and text must scale with the user's settings.
  function checkZoom({ rules }) {
    const meta = document.querySelector('meta[name=viewport]');
    const settings = new Map((meta ? meta.getAttribute('content') || '' : '').split(/[,;]/).map((part) => part.split('=').map((s) => s.trim().toLowerCase())));
    const maximum = parseFloat(settings.get('maximum-scale'));
    const blocked = ['no', '0'].includes(settings.get('user-scalable')) ? `user-scalable=${settings.get('user-scalable')}` : maximum < LAYOUT_REFLOW.minZoomScale ? `maximum-scale=${maximum}` : null;
    if (meta) checked('viewport meta');
    if (blocked) add('SU-171', 'fail', 'Zoom and resize', meta, `zoom is blocked (${blocked})`, 'Use content="width=device-width, initial-scale=1" and nothing else');
    const rootPx = px(css(document.documentElement).fontSize);
    if (rootPx < LAYOUT_REFLOW.minRootPx) add('SU-171', 'warn', 'Zoom and resize', document.documentElement, `root font-size is ${rootPx}px`, 'Leave html at 100% (16px) and size text in rem');
    for (const { rule } of rules) {
      const size = rule.style.fontSize || '';
      if (/vw/.test(size) && !/clamp|min\(|max\(|rem|em/.test(size)) add('SU-171', 'warn', 'Zoom and resize', null, `${rule.selectorText}: font-size ${size}`, 'Viewport-only sizes ignore zoom: use clamp(1rem, 0.9rem + 1vw, 1.25rem)');
    }
  }

  // Opt-in probe (window.__shibroAudit = { textSpacing: true }): inject the WCAG 1.4.12 stylesheet and flag
  // boxes that clip text only because of it. Boxes that already clip at rest are SU-200's business.
  function layoutClipState(el) {
    return { high: el.scrollHeight > el.clientHeight + LAYOUT_REFLOW.spacingSlack, wide: el.scrollWidth > el.clientWidth + LAYOUT_REFLOW.spacingSlack };
  }
  function checkTextSpacing() {
    if (!(window.__shibroAudit && window.__shibroAudit.textSpacing)) { skipped('text spacing probe: off (set __shibroAudit.textSpacing)'); return; }
    const clipping = LAYOUT_ALL_ELEMENTS()
      .filter((el) => el.clientHeight > 0 && /hidden|clip/.test(`${css(el).overflowX} ${css(el).overflowY}`) && !el.matches('textarea, input, select') && el.textContent.trim().length >= 2 && isVisible(el))
      .map((el) => ({ el, before: layoutClipState(el) }));
    checked('text spacing probe', clipping.length);
    const style = document.createElement('style');
    try {
      style.textContent = SPACING_STYLE;
      document.head.appendChild(style);
      void document.body.offsetHeight;
      for (const { el, before } of clipping) {
        const after = layoutClipState(el);
        if ((after.high && !before.high) || (after.wide && !before.wide)) add('SU-172', 'warn', 'Text spacing', el, 'text clips at WCAG text spacing', 'Let the box grow: min-height and padding instead of a fixed height, no overflow: hidden on text');
      }
    } finally {
      style.remove();
    }
  }
  REGISTERED = [...REGISTERED, ['reflow', () => checkReflow()], ['zoom', (context) => checkZoom(context)], ['text spacing', () => checkTextSpacing()]];
