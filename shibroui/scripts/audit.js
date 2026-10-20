// shibroUI audit: evaluate this whole file in a rendered page; it returns a JSON report.
// It is deliberately one expression (no imports, no exports) so any browser tool can run it:
//   built-in / Chrome browser tools → run the contents as-is
//   Playwright MCP                  → browser_evaluate with `() => <contents>`
//   a loader instead of pasting  → node scripts/serve.mjs, then
//                                   await fetch('http://127.0.0.1:4399/audit.js').then((r) => r.text()).then((s) => (0, eval)(s))
// Options: window.__shibroAudit = { root: 'main', band: 3, prepare: true, maxFindings: 400 } before running.
// `prepare: true` scrolls the page once first (scroll reveals, lazy sections) and makes the result a Promise.
// Every finding lists its instances (CSS paths) and `coverage` says what was checked, what was skipped and
// why, what it couldn't see (`unseen`), and which hidden states (tabs, menus, dialogs) still need a run.
(() => {
  const VERSION = '0.4.0';
  const OPTIONS = { root: null, band: null, prepare: false, maxFindings: 400, ...(window.__shibroAudit || {}) };
  // Reassigned once at run time: while a modal is open the page behind it is inert, so only the modal is audited.
  let ROOT = (OPTIONS.root && document.querySelector(OPTIONS.root)) || document.body;
  const LIMITS = {
    textAA: 4.5, textLarge: 3, largePx: 24, largeBoldPx: 18.66, fieldBoundary: 1.06,
    target: 44, targetFloor: 24, targetGap: 8, heightTolerance: 1, radiusTolerance: 3,
    measureHigh: 80, measureLow: 35, narrowViewport: 480, leadingLow: 1.3, leadingHigh: 2.1, minReadingPx: 13,
    pressScaleMin: 0.94, routineMs: 500, pressMs: 300, shakePx: 12, maxElements: 6000,
    maxFocus: 800, maxInstances: 40,
  };
  const INTERACTIVE = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [role=option], [tabindex]:not([tabindex="-1"])';
  const TEXT_FIELD = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]), select, textarea';
  const findings = new Map();
  const notes = [];
  // Check files after the built-in ones register here: REGISTERED = [...REGISTERED, ['name', (context) => {…}]].
  // context = { targets, rules, keyframes, reduced } (rules: [{ rule: CSSStyleRule, inReduced }] from same-origin sheets).
  let REGISTERED = [];
  const css = (el) => getComputedStyle(el);
  const px = (value) => parseFloat(value) || 0;

  // ---------- reporting ----------
  // tag#id.class.class: names a container in advice without quoting all of its text.
  const selectorOf = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${[...el.classList].slice(0, 2).map((c) => `.${c}`).join('')}`;
  function describe(el) {
    if (!el || !el.tagName) return null;
    const choice = el.matches('input[type=checkbox], input[type=radio]');
    const value = choice ? '' : el.value;
    const text = (el.getAttribute('aria-label') || el.textContent || value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${selectorOf(el)}${text ? ` "${text}"` : ''}`;
  }
  // A unique-enough CSS path so every instance can be found and fixed, not just the first.
  function path(el) {
    if (!el || !el.tagName) return null;
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && parts.length < 4; node = node.parentElement) {
      if (node.id) { parts.unshift(`#${node.id}`); break; }
      const tag = node.tagName.toLowerCase();
      const cls = [...node.classList].slice(0, 2).map((c) => `.${c}`).join('');
      const same = node.parentElement ? [...node.parentElement.children].filter((c) => c.tagName === node.tagName) : [];
      parts.unshift(`${tag}${cls}${same.length > 1 ? `:nth-of-type(${same.indexOf(node) + 1})` : ''}`);
      if (tag === 'body') break;
    }
    return parts.join(' > ');
  }
  // Same rule + same kind of element + same kind of measurement collapse into one finding listing every
  // instance. Numbers are left out of the key, so a 20px and a 22px icon with the same problem are one
  // finding (one fix); the other measured values are kept in `variants` and appended to the detail.
  const MAX_VARIANTS = 4;
  const detailShape = (detail) => String(detail || '').replace(/\d+(\.\d+)?/g, '#');
  function add(id, level, rule, el, detail, fix) {
    const signature = el && el.tagName ? `${el.tagName}${[...el.classList].join('.')}` : '';
    const key = `${id}|${level}|${signature}|${detailShape(detail)}`;
    const existing = findings.get(key);
    const where = path(el);
    if (existing) {
      existing.count += 1;
      if (where && existing.instances.length < LIMITS.maxInstances) existing.instances.push(where);
      if (detail !== existing.detail && !existing.variants.includes(detail) && existing.variants.length < MAX_VARIANTS) existing.variants.push(detail);
      return;
    }
    findings.set(key, { id, level, rule, element: describe(el), detail, fix, count: 1, instances: where ? [where] : [], variants: [] });
  }
  // Findings of one rule that share the exact same fix across 2+ kinds of element and 20+ instances have one
  // cause (a missing global focus style, a sticky header without scroll padding): report them as one
  // root-cause finding, with the per-element groups kept in `groups`.
  const ROOT_CAUSE = { minKinds: 2, minInstances: 20 };
  function foldRootCauses(list) {
    const byFix = new Map();
    for (const f of list) {
      if (!f.fix) continue;
      const key = `${f.id}|${f.level}|${f.fix}`;
      byFix.set(key, [...(byFix.get(key) || []), f]);
    }
    const folded = new Set();
    const merged = [];
    for (const group of byFix.values()) {
      const total = group.reduce((sum, f) => sum + f.count, 0);
      if (group.length < ROOT_CAUSE.minKinds || total < ROOT_CAUSE.minInstances) continue;
      group.forEach((f) => folded.add(f));
      const [first] = group;
      merged.push({ ...first, element: `${group.length} kinds of element`, rootCause: true,
        detail: `${total} instances across ${group.length} kinds of element share one fix: ${first.detail}`,
        count: total, instances: group.flatMap((f) => f.instances).slice(0, LIMITS.maxInstances), variants: [],
        groups: group.map((f) => ({ element: f.element, count: f.count, detail: f.detail })) });
    }
    return [...list.filter((f) => !folded.has(f)), ...merged];
  }
  // The public shape: the first detail plus the other measured values; `instancesSampled` when the list is capped.
  const finalizeFinding = ({ variants, ...f }) => ({
    ...f, detail: variants && variants.length ? `${f.detail} (also: ${variants.join('; ')})` : f.detail,
    ...(f.count > f.instances.length ? { instancesSampled: true } : {}),
  });
  const COVERAGE = { checked: {}, skipped: {}, capsHit: [] };
  const checked = (key, n = 1) => { COVERAGE.checked[key] = (COVERAGE.checked[key] || 0) + n; };
  const skipped = (key) => { COVERAGE.skipped[key] = (COVERAGE.skipped[key] || 0) + 1; };

  // ---------- visibility & geometry ----------
  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const style = css(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    }
    // Content of a closed <details> can keep a box (e.g. absolutely positioned) but isn't rendered for people.
    const closedDetails = el.closest('details:not([open])');
    if (closedDetails && !el.closest('summary')) return false;
    const style = css(el);
    return !(style.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(style.clipPath));
  }
  const inViewport = (r) => r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
  // The square the target probe samples: the box grown to at least LIMITS.target around its center.
  function probeRect(r) {
    const [cx, cy] = [r.left + r.width / 2, r.top + r.height / 2];
    const [halfW, halfH] = [Math.max(r.width, LIMITS.target) / 2, Math.max(r.height, LIMITS.target) / 2];
    return { left: cx - halfW, right: cx + halfW, top: cy - halfH, bottom: cy + halfH };
  }
  const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  // Fixed and sticky layers (outermost only) stay put while the page scrolls, so whatever sits under them at
  // the current scroll position can't be measured there. Collected once per run, from the whole page.
  const PINNED_LAYER_CAP = 50;
  let pinnedCache = null;
  function pinnedLayers() {
    if (pinnedCache) return pinnedCache;
    pinnedCache = [...document.body.querySelectorAll('*')].slice(0, LIMITS.maxElements).reduce((layers, el) => {
      const last = layers[layers.length - 1];
      if (layers.length >= PINNED_LAYER_CAP || (last && last.contains(el)) || !/fixed|sticky/.test(css(el).position) || !isVisible(el)) return layers;
      return [...layers, el];
    }, []);
    return pinnedCache;
  }
  const pinnedLayerOf = (el) => pinnedLayers().find((layer) => layer.contains(el)) || null;
  const underPinnedLayer = (el, rect) => pinnedLayers().some((layer) => !layer.contains(el) && !el.contains(layer)
    && css(layer).pointerEvents !== 'none' && intersects(layer.getBoundingClientRect(), rect));

  // Ancestors that scroll on their own (overflow auto/scroll), innermost first; html and body scroll with the page.
  const scrollerCache = new Map();
  function scrollersOf(node) {
    if (!node || node === document.body || node === document.documentElement) return [];
    if (scrollerCache.has(node)) return scrollerCache.get(node);
    const style = css(node);
    const [x, y] = [/auto|scroll/.test(style.overflowX), /auto|scroll/.test(style.overflowY)];
    const list = [...(x || y ? [{ node, x, y }] : []), ...scrollersOf(node.parentElement)];
    scrollerCache.set(node, list);
    return list;
  }
  // How far `rect` reaches past the visible (client) box of `scroller` on the axes it scrolls; 0 = not clipped.
  function clipDepth(scroller, rect) {
    const { node, x, y } = scroller;
    const box = node.getBoundingClientRect();
    const [left, top] = [box.left + node.clientLeft, box.top + node.clientTop];
    const overX = x ? Math.max(left - rect.left, rect.right - (left + node.clientWidth)) : 0;
    const overY = y ? Math.max(top - rect.top, rect.bottom - (top + node.clientHeight)) : 0;
    return Math.max(0, overX, overY);
  }
  // The innermost scrolling ancestor that cuts `rect` off (more than half a pixel), or null.
  const clippingScroller = (el, rect) => scrollersOf(el.parentElement).find((scroller) => clipDepth(scroller, rect) > 0.5) || null;

  // Inner scroll positions that reveal() changed; the run puts them back along with the window scroll.
  const innerScrolls = new Map();
  function rememberScroll(el) {
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      if (!innerScrolls.has(node) && (node.scrollTop || node.scrollLeft || node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)) {
        innerScrolls.set(node, [node.scrollLeft, node.scrollTop]);
      }
    }
  }
  // Brings `el` to the center when the probe around it would be cut off: outside the viewport, clipped by an
  // inner scroll panel, or under a fixed/sticky layer it doesn't belong to (a sticky header).
  function reveal(el) {
    const rect = el.getBoundingClientRect();
    const probe = probeRect(rect);
    if (inViewport(rect) && !clippingScroller(el, probe) && !underPinnedLayer(el, probe)) return rect;
    rememberScroll(el);
    el.scrollIntoView({ block: 'center', inline: 'center' });
    return el.getBoundingClientRect();
  }
  const isDisabled = (el) => !!el.closest(':disabled, [aria-disabled="true"], [inert]');

  // ---------- color ----------
  const canvas = Object.assign(document.createElement('canvas'), { width: 1, height: 1 });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const colorCache = new Map();
  function parseColor(value) {
    if (!value) return { r: 0, g: 0, b: 0, a: 0 };
    if (colorCache.has(value)) return colorCache.get(value);
    const match = value.match(/^rgba?\(([^)]+)\)$/);
    let color;
    if (match) {
      const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
      color = { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    } else {
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      color = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    }
    colorCache.set(value, color);
    return color;
  }
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a), a: 1,
  });
  const linear = (channel) => { const c = channel / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const luminance = (c) => 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
  const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const hex = (c) => `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  function pageCanvas() {
    const scheme = css(document.documentElement).colorScheme || '';
    const dark = /dark/.test(scheme) && (!/light/.test(scheme) || matchMedia('(prefers-color-scheme: dark)').matches);
    return dark ? { r: 18, g: 18, b: 18, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
  }
  const gradientStops = (image) => (image.match(/rgba?\([^)]+\)/g) || []).map(parseColor);
  // Opacity of whatever an element's ::before/::after paints (0 for an invisible hit-area layer).
  const pseudoPaint = (node) => Math.max(...['::before', '::after'].map((pseudo) => {
    const style = getComputedStyle(node, pseudo);
    if (/^(none|normal)$/.test(style.content)) return 0;
    return style.backgroundImage !== 'none' ? 1 : parseColor(style.backgroundColor).a;
  }));

  // Backdrop behind a point: paint-order stack first (catches positioned siblings), ancestors as fallback.
  function backdropAt(el, x, y) {
    const layers = [];
    let image = null;
    let stops = null;
    const visit = (node) => {
      const style = css(node);
      if (style.backgroundImage !== 'none') {
        if (/url\(/.test(style.backgroundImage)) image = image || node;
        else stops = stops || gradientStops(style.backgroundImage);
      }
      if (/^(IMG|VIDEO|CANVAS|IFRAME|PICTURE)$/.test(node.tagName) && node !== el) { image = image || node; return true; }
      const bg = parseColor(style.backgroundColor);
      if (bg.a > 0) layers.push(bg);
      return bg.a >= 0.999 || !!image;
    };
    const stack = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight ? document.elementsFromPoint(x, y) : [];
    const index = stack.indexOf(el);
    if (index >= 0) {
      const front = stack.slice(0, index).filter((n) => !el.contains(n));
      // An ancestor listed in front of its own text got there through a positioned ::before/::after (the SU-61
      // hit-area or stretched-link layer): only that pseudo-element's paint can hide the text.
      const lifted = front.filter((n) => n.contains(el));
      const covering = front.some((n) => (lifted.includes(n) ? pseudoPaint(n) : parseColor(css(n).backgroundColor).a) > 0.05);
      if (covering) return { covered: true };
      // Its own background still paints under the text: put it back below its descendants, above its ancestors.
      const below = lifted.reduce((nodes, n) => {
        const at = nodes.findIndex((m) => m !== n && m.contains(n));
        return at < 0 ? [...nodes, n] : [...nodes.slice(0, at), n, ...nodes.slice(at)];
      }, stack.slice(index));
      for (const node of below) if (visit(node)) break;
    } else {
      for (let node = el; node && node.nodeType === 1; node = node.parentElement) if (visit(node)) break;
    }
    const base = layers.reduceRight((acc, layer) => over(layer, acc), pageCanvas());
    return { color: base, image, stops: stops && stops.length ? stops.map((s) => over(s, base)) : null };
  }
  function effectiveOpacity(el) {
    let value = 1;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) value *= px(css(node).opacity) || (css(node).opacity === '0' ? 0 : 1);
    return value;
  }
  const hasBoundary = (el) => {
    const s = css(el);
    const border = ['Top', 'Right', 'Bottom', 'Left'].some((side) => px(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none' && parseColor(s[`border${side}Color`]).a > 0);
    return parseColor(s.backgroundColor).a > 0.05 || border || s.boxShadow !== 'none' || s.backgroundImage !== 'none';
  };

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
  // ---------- 1. text contrast (SU-45, SU-46, SU-49) ----------
  function checkTextContrast() {
    const walker = document.createTreeWalker(ROOT, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const owners = new Map();
    while (walker.nextNode() && owners.size < LIMITS.maxElements) {
      const parent = walker.currentNode.parentElement;
      if (parent && !owners.has(parent) && !parent.closest('script, style, noscript, template, svg, option, title')) owners.set(parent, walker.currentNode);
    }
    if (owners.size >= LIMITS.maxElements) COVERAGE.capsHit.push(`text contrast stopped at ${LIMITS.maxElements} text elements; scope with window.__shibroAudit = { root } and run per region`);
    for (const [el, textNode] of owners) {
      if (!isVisible(el) || isDisabled(el)) continue;
      reveal(el);
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const box = range.getClientRects()[0];
      if (!box || box.width < 1) continue;
      checked('text elements');
      const style = css(el);
      const size = px(style.fontSize);
      const large = size >= LIMITS.largePx || (size >= LIMITS.largeBoldPx && px(style.fontWeight) >= 700);
      const needed = large ? LIMITS.textLarge : LIMITS.textAA;
      const backdrop = backdropAt(el, box.left + Math.min(box.width / 2, 12), box.top + box.height / 2);
      if (backdrop.covered) { skipped('text covered by an overlay'); continue; }
      const fg = parseColor(style.color);
      const alpha = fg.a * effectiveOpacity(el);
      const id = el.closest('button, [role=button], input[type=submit], input[type=button]') ? 'SU-46' : 'SU-45';
      if (backdrop.image) {
        skipped('text over an image (contrast not measurable)');
        add('SU-49', 'info', 'Text over images', el, 'text sits on an image; contrast cannot be measured', 'Add a scrim (~75% overlay) and check the brightest spot under the text');
        continue;
      }
      const surfaces = backdrop.stops || [backdrop.color];
      const worst = surfaces.map((bg) => ({ bg, value: ratio(over({ ...fg, a: alpha }, bg), bg) })).sort((a, b) => a.value - b.value)[0];
      if (worst.value < needed) {
        add(id, 'fail', id === 'SU-46' ? 'Button contrast' : 'Text contrast', el,
          `${hex(fg)}${alpha < 1 ? ` @${alpha.toFixed(2)}` : ''} on ${hex(worst.bg)} = ${worst.value.toFixed(2)}:1 (needs ≥ ${needed}:1${large ? ', large text' : ''})`,
          `node scripts/contrast.mjs '${hex(fg)}' '${hex(worst.bg)}' --fix`);
      }
    }
  }

  // ---------- 2. field visibility (SU-44) ----------
  function checkFields() {
    for (const field of ROOT.querySelectorAll(TEXT_FIELD)) {
      if (!isVisible(field) || !field.parentElement) continue;
      checked('form fields');
      const rect = reveal(field);
      const behind = backdropAt(field.parentElement, rect.left - 1, rect.top - 1);
      if (behind.covered || behind.image) { skipped('field surface not measurable'); continue; }
      const surface = behind.color;
      const s = css(field);
      const fill = over(parseColor(s.backgroundColor), surface);
      const borderRatios = ['Top', 'Right', 'Bottom', 'Left']
        .filter((side) => px(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none')
        .map((side) => ratio(over(parseColor(s[`border${side}Color`]), fill), surface));
      const best = Math.max(ratio(fill, surface), ...borderRatios, s.boxShadow !== 'none' ? 99 : 1);
      if (best < LIMITS.fieldBoundary) {
        add('SU-44', 'fail', 'Input contrast', field, `field fill and border are ${best.toFixed(2)}:1 against ${hex(surface)}`, 'Give the field its own shade and a visible border');
      }
    }
  }

  // ---------- 3. targets (SU-61–65, SU-63, SU-69) ----------
  const targetsList = () => [...ROOT.querySelectorAll(INTERACTIVE)].filter((el) => isVisible(el) && !isDisabled(el));
  // A link inside running text: its block holds real non-link words (a nav of bare links does not).
  function isInlineLink(el) {
    if (el.tagName !== 'A' || css(el).display !== 'inline') return false;
    const block = el.parentElement;
    if (!block) return false;
    const linkText = [...block.querySelectorAll('a')].reduce((sum, a) => sum + a.textContent.trim().length, 0);
    const prose = block.textContent.replace(/[\s·|•–—/,]+/g, ' ').trim().length - linkText;
    return prose >= 12;
  }
  // True when `node` belongs to an absolutely positioned, fixed or sticky layer that isn't an ancestor of `el`
  // (a sticky header still over the target after reveal() says nothing about its hit area).
  function overlayOver(node, el) {
    for (let n = node; n && n !== document.body; n = n.parentElement) {
      if (n.contains(el)) return false;
      if (/absolute|fixed|sticky/.test(css(n).position)) return true;
    }
    return false;
  }
  // Samples a circle of the given diameter around the center (rounded corners don't count against it).
  // Returns true / false, or null when the target can't be brought on screen (e.g. an unfocused skip link).
  function covers(el, related, size) {
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) return null;
    // 1px inside the edge: probes exactly 0.5px from a boundary round onto the neighbour in headless Chromium.
    const [cx, cy, radius] = [r.left + r.width / 2, r.top + r.height / 2, size / 2 - 1];
    const points = Array.from({ length: 8 }, (_, i) => [cx + Math.cos((i * Math.PI) / 4) * radius, cy + Math.sin((i * Math.PI) / 4) * radius]);
    let known = 0;
    for (const [x, y] of points) {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      known += 1;
      const top = document.elementFromPoint(x, y);
      if (top && (el.contains(top) || related.some((n) => n.contains(top)))) continue;
      // A probe landing on an open dropdown/popover/drawer says nothing about this target's own hit area.
      if (top && overlayOver(top, el)) { known -= 1; continue; }
      return false;
    }
    return known > 0 ? true : null;
  }
  // WCAG 2.5.8 spacing exception: an undersized target is acceptable when a 24px circle on its
  // center stays clear of every other target.
  function spacedEnough(el, targets) {
    const r = el.getBoundingClientRect();
    const [cx, cy] = [r.left + r.width / 2, r.top + r.height / 2];
    return targets.every((other) => {
      if (other === el || other.contains(el) || el.contains(other)) return true;
      const o = other.getBoundingClientRect();
      const dx = Math.max(o.left - cx, 0, cx - o.right);
      const dy = Math.max(o.top - cy, 0, cy - o.bottom);
      return Math.hypot(dx, dy) >= LIMITS.targetFloor / 2;
    });
  }
  function checkTargets(targets) {
    for (const el of targets) {
      if (isInlineLink(el)) continue;
      const parentTarget = el.parentElement && el.parentElement.closest(INTERACTIVE);
      if (parentTarget && ROOT.contains(parentTarget)) continue;
      const related = el.labels ? [...el.labels].filter(isVisible) : [];
      if (el.matches('input[type=checkbox], input[type=radio]') && related.length) continue; // label rows are SU-50's job
      const rect = reveal(el);
      checked('interactive targets');
      const isField = el.matches(TEXT_FIELD);
      if (isField && rect.height >= 32) continue;
      // A target under an open dropdown or popover isn't reachable right now; it's audited in the closed state.
      const centerHit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (centerHit && !el.contains(centerHit) && !related.some((n) => n.contains(centerHit)) && !centerHit.contains(el)) { skipped('target covered by an overlay'); continue; }
      const coverage = covers(el, related, LIMITS.target);
      if (coverage === null) { skipped('target off-screen (not measurable)'); continue; }
      if (coverage) continue;
      const closeish = /close|dismiss|×|✕/i.test(el.getAttribute('aria-label') || el.textContent || '');
      const id = closeish ? 'SU-65' : el.textContent.trim().length > 2 ? 'SU-62' : 'SU-61';
      const size = `${Math.round(rect.width)}×${Math.round(rect.height)}px`;
      const meetsFloor = covers(el, related, LIMITS.targetFloor) === true || spacedEnough(el, targets);
      // reveal() already scrolled any inner scroll panel to the target, so a cut that remains is the panel's edge.
      const probe = probeRect(rect);
      const scroller = clippingScroller(el, probe);
      const container = scroller && selectorOf(scroller.node);
      add(id, meetsFloor ? 'warn' : 'fail', 'Target size', el,
        `hit area ${size} does not cover ${LIMITS.target}px${meetsFloor ? '' : ` and is under ${LIMITS.targetFloor}px with crowded neighbours`}${scroller ? `; the scrolling container ${container} clips it` : ''}`,
        scroller
          ? `${container} was scrolled to the target and its edge still cuts the hit area: pad ${container} by ≥ ${Math.ceil(clipDepth(scroller, probe))}px on that side, or make the target ${LIMITS.target}px itself`
          : 'Extend the hit area with padding or an invisible ::before (inset: -10px) without enlarging the visible control');
    }
    const outer = targets.filter((el) => !isInlineLink(el) && hasBoundary(el) && !el.matches(TEXT_FIELD));
    // A target in a fixed/sticky bar and one in the scrolling page only meet at the scroll position the last
    // reveal() left, so that pair says nothing about the layout.
    const pinned = new Map(outer.map((el) => [el, !!pinnedLayerOf(el)]));
    for (let i = 0; i < outer.length; i += 1) {
      for (let j = i + 1; j < outer.length; j += 1) {
        const [a, b] = [outer[i], outer[j]];
        if (pinned.get(a) !== pinned.get(b)) continue;
        if (a.contains(b) || b.contains(a) || a.closest('[role=tablist], [role=radiogroup]') && a.closest('[role=tablist], [role=radiogroup]') === b.closest('[role=tablist], [role=radiogroup]')) continue;
        const [ra, rb] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
        const dx = Math.max(rb.left - ra.right, ra.left - rb.right);
        const dy = Math.max(rb.top - ra.bottom, ra.top - rb.bottom);
        const sameRow = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top) > Math.min(ra.height, rb.height) / 2;
        const sameColumn = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left) > Math.min(ra.width, rb.width) / 2;
        if (dx < 0 && dy < 0) add('SU-69', 'fail', 'Room to click', a, `overlaps ${describe(b)}`, 'Separate the targets; each point should belong to one action');
        else if ((sameRow && dx >= 0 && dx < LIMITS.targetGap) || (sameColumn && dy >= 0 && dy < LIMITS.targetGap)) {
          add('SU-63', 'warn', 'Target spacing', a, `only ${Math.round(sameRow ? dx : dy)}px from ${describe(b)}`, `Leave ≥ ${LIMITS.targetGap}px (12px comfortable) between neighbouring targets`);
        }
      }
    }
  }

  // ---------- 4. focus visibility (SU-70) ----------
  // A background tab never paints focus styles, so without document focus this reads the CSS instead.
  const RING_FIX = ':focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }';
  const removesOutline = (style) => style.outlineStyle === 'none' || style.outlineWidth === '0px' || /^(none|0(px)?)(\s|$)/.test((style.outline || '').trim());
  const drawsRing = (style) => (!!style.outlineStyle && style.outlineStyle !== 'none' && style.outlineWidth !== '0px')
    || /solid|dashed|dotted|double|auto/.test(style.outline || '') || (!!style.boxShadow && style.boxShadow !== 'none');
  const ringWidth = (style) => px(style.outlineWidth) || px(((style.outline || '').match(/(\d+(?:\.\d+)?)px/) || [])[1]) || (style.boxShadow && style.boxShadow !== 'none' ? 2 : 1);
  // Splits a selector list on top-level commas only, so `:is(a, button):focus-visible` stays one selector.
  function splitSelectorList(text) {
    const parts = [];
    let depth = 0;
    let start = 0;
    [...text].forEach((char, index) => {
      if (char === '(' || char === '[') depth += 1;
      else if (char === ')' || char === ']') depth -= 1;
      else if (char === ',' && depth === 0) { parts.push(text.slice(start, index)); start = index + 1; }
    });
    return [...parts, text.slice(start)];
  }
  // `html *:focus-visible` serializes as `html :focus-visible`; stripping the pseudo-class must leave `html *`.
  function focusBase(part) {
    const stripped = part.replace(/:focus(-visible|-within)?/g, '');
    return (/(^|[\s>+~(])$/.test(stripped) ? `${stripped}*` : stripped).trim() || '*';
  }
  function staticFocus(el, rules) {
    let removed = false;
    let ring = null;
    for (const { rule } of rules) {
      for (const part of splitSelectorList(rule.selectorText || '')) {
        const focusPart = /:focus/.test(part);
        if (!focusPart && /:(hover|active|checked|disabled|visited)/.test(part)) continue;
        const base = focusBase(part);
        let matches = false;
        try { matches = el.matches(base) || (/:focus-within/.test(part) && !!el.closest(base)); } catch { matches = false; }
        if (!matches) continue;
        if (removesOutline(rule.style) && !drawsRing(rule.style)) removed = true;
        if (focusPart && drawsRing(rule.style) && !removesOutline(rule.style)) ring = { selector: part.trim(), width: ringWidth(rule.style) };
      }
    }
    return { removed, ring };
  }
  function snapshot(el) {
    if (!el) return '';
    const s = css(el);
    return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor].join('|');
  }
  function liveFocus(el) {
    const [before, parentBefore] = [snapshot(el), snapshot(el.parentElement)];
    el.focus({ preventScroll: true, focusVisible: true });
    if (document.activeElement !== el) return null;
    const s = css(el);
    const result = s.outlineStyle !== 'none' && px(s.outlineWidth) >= 1 && parseColor(s.outlineColor).a > 0
      ? { state: 'ring', width: px(s.outlineWidth), style: s.outlineStyle }
      : snapshot(el).split('|')[3] !== before.split('|')[3] || snapshot(el.parentElement) !== parentBefore ? { state: 'shadow' }
        : { state: snapshot(el) !== before ? 'subtle' : 'none' };
    el.blur();
    return result;
  }
  function checkFocus(targets, rules) {
    // staticFocus: judge rings from CSS even when the page has focus (deterministic background-tab behaviour).
    const live = document.hasFocus() && !OPTIONS.staticFocus;
    if (!live) notes.push('The page has no focus (background tab), so focus rings were judged from CSS rules, not painted styles.');
    if (targets.length > LIMITS.maxFocus) COVERAGE.capsHit.push(`focus checked the first ${LIMITS.maxFocus} of ${targets.length} focusable elements; scope with window.__shibroAudit = { root } for the rest`);
    for (const el of targets.slice(0, LIMITS.maxFocus)) {
      if (el.matches('input[type=checkbox], input[type=radio]') && css(el).opacity === '0') continue;
      checked('focusable elements');
      const painted = live ? liveFocus(el) : null;
      if (live && !painted) continue;
      if (painted && painted.state === 'shadow') continue;
      if (painted && painted.state === 'ring') {
        if (painted.width < 2) add('SU-70', 'warn', 'Focus visibility', el, `focus ring ${painted.width}px (${painted.style})`, 'Use a 2px ring with a 2px offset');
        continue;
      }
      const { removed, ring } = staticFocus(el, rules);
      if (ring) {
        if (ring.width < 2) add('SU-70', 'warn', 'Focus visibility', el, `focus ring ${ring.width}px via ${ring.selector}`, 'Use a 2px ring with a 2px offset');
        continue;
      }
      if (removed || (painted && painted.state === 'none')) add('SU-70', 'fail', 'Focus visibility', el, 'outline removed with no visible focus replacement', RING_FIX);
      else add('SU-70', 'warn', 'Focus visibility', el, painted ? 'focus only changes color/border subtly' : "relies on the browser's thin default focus ring", RING_FIX);
    }
  }

  // ---------- 5. tables & numbers (SU-16, SU-17) ----------
  const AMOUNT = /^[+\-−]?\s?[$€£¥₹]?\s?[+\-−]?\d[\d,.\s ]*\s?(%|[a-zA-Z]{1,3})?$/;
  const isAmount = (text) => { const t = text.trim(); return t.length > 0 && t.length <= 20 && AMOUNT.test(t) && !/\d[/:]\d/.test(t); };
  const tabular = (el) => { const s = css(el); return /tabular-nums/.test(s.fontVariantNumeric) || /"tnum"/.test(s.fontFeatureSettings); };
  function alignment(cell) {
    const s = css(cell);
    const direction = s.direction === 'rtl' ? 'rtl' : 'ltr';
    const inner = cell.firstElementChild && /flex|grid/.test(css(cell.firstElementChild).display) ? css(cell.firstElementChild) : null;
    if (inner && /end|right/.test(inner.justifyContent)) return 'right';
    if (/flex|grid/.test(s.display) && /end|right/.test(s.justifyContent)) return 'right';
    if (s.textAlign === 'end') return direction === 'ltr' ? 'right' : 'left';
    if (s.textAlign === 'start') return direction === 'ltr' ? 'left' : 'right';
    return s.textAlign === 'justify' ? 'left' : s.textAlign;
  }
  function tableRows(table) {
    if (table.tagName === 'TABLE') return [...table.rows].map((row) => ({ head: !!row.closest('thead') || [...row.cells].every((c) => c.tagName === 'TH'), cells: [...row.cells] }));
    return [...table.querySelectorAll('[role=row]')].map((row) => ({
      head: !!row.querySelector('[role=columnheader]'), cells: [...row.querySelectorAll(':scope > [role=cell], :scope > [role=gridcell], :scope > [role=columnheader]')],
    }));
  }
  function checkTables() {
    for (const table of ROOT.querySelectorAll('table, [role=table], [role=grid]')) {
      if (!isVisible(table)) continue;
      checked('tables');
      const rows = tableRows(table);
      const body = rows.filter((r) => !r.head);
      checked('table cells', body.reduce((sum, r) => sum + r.cells.length, 0));
      const header = rows.find((r) => r.head);
      const columns = new Map();
      for (const row of body) row.cells.forEach((cell, index) => {
        const col = columns.get(index) || { amounts: [], texts: [] };
        const text = cell.textContent.trim();
        if (text) (isAmount(text) ? col.amounts : col.texts).push(cell);
        columns.set(index, col);
      });
      for (const [index, col] of columns) {
        const headCell = header && header.cells[index];
        const label = headCell ? `"${headCell.textContent.trim().slice(0, 24)}"` : `#${index + 1}`;
        if (col.amounts.length >= 2 && col.amounts.length >= col.texts.length * 1.5) {
          const misaligned = col.amounts.filter((c) => alignment(c) !== 'right');
          if (misaligned.length) add('SU-17', 'fail', 'Typographic alignment', misaligned[0], `numeric column ${label} is ${alignment(misaligned[0])}-aligned`, 'text-align: right (or end) for comparable amounts');
          else if (headCell && alignment(headCell) !== 'right') add('SU-17', 'warn', 'Typographic alignment', headCell, `header ${label} is ${alignment(headCell)}-aligned over a right-aligned numeric column`, 'Align the header with its column');
          if (!col.amounts.every(tabular)) add('SU-16', 'warn', 'Tabular numbers', col.amounts[0], `numeric column ${label} uses proportional digits`, 'font-variant-numeric: tabular-nums');
        } else if (col.texts.length >= 2 && col.texts.filter((c) => alignment(c) === 'center').length > col.texts.length / 2) {
          add('SU-17', 'warn', 'Typographic alignment', col.texts[0], `text column ${label} is centered`, 'Left-align text columns');
        }
      }
    }
    const live = ROOT.querySelectorAll('[aria-live], [role=timer], [role=status], [class*=count], [class*=total], [class*=price], [class*=amount], [class*=balance], [class*=stat], [class*=metric], [class*=timer], [class*=kpi]');
    for (const el of live) {
      if (!isVisible(el) || el.closest('table, [role=table], [role=grid]') || !isAmount(el.textContent) || el.children.length > 2) continue;
      if (!tabular(el)) add('SU-16', 'warn', 'Tabular numbers', el, 'likely-changing number uses proportional digits', 'font-variant-numeric: tabular-nums');
    }
  }

  // ---------- 6. control heights (SU-58–60) ----------
  function checkControlHeights(targets) {
    const controls = targets.filter((el) => el.matches(`${TEXT_FIELD}, button, [role=button], input[type=submit], input[type=button], a[href]`) && (el.matches(TEXT_FIELD) || hasBoundary(el)) && !isInlineLink(el));
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        const [a, b] = [controls[i], controls[j]];
        if (a.contains(b) || b.contains(a)) continue;
        const [ra, rb] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
        const overlap = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        const gap = Math.max(rb.left - ra.right, ra.left - rb.right);
        if (overlap < Math.min(ra.height, rb.height) / 2 || gap < 0 || gap > 24) continue;
        const diff = Math.abs(ra.height - rb.height);
        if (diff <= LIMITS.heightTolerance) continue;
        const involvesField = a.matches(TEXT_FIELD) || b.matches(TEXT_FIELD);
        const pagination = a.closest('[aria-label*=pagination i], .pagination, [class*=pager]');
        const id = involvesField ? 'SU-58' : pagination ? 'SU-59' : 'SU-60';
        add(id, diff >= 4 ? 'fail' : 'warn', 'Control alignment', a, `${Math.round(ra.height)}px next to ${describe(b)} at ${Math.round(rb.height)}px`, 'Use one control height (e.g. 40px) for every control in the row');
      }
    }
  }

  // ---------- 7. nested radius (SU-93–98) ----------
  function radii(el, rect) {
    const s = css(el);
    const max = Math.min(rect.width, rect.height) / 2;
    const read = (value) => Math.min(max, value.includes('%') ? (px(value) / 100) * Math.min(rect.width, rect.height) : px(value));
    return { tl: read(s.borderTopLeftRadius), tr: read(s.borderTopRightRadius), br: read(s.borderBottomRightRadius), bl: read(s.borderBottomLeftRadius), max };
  }
  function clipsBetween(el, container) {
    for (let node = el.parentElement; node; node = node.parentElement) {
      const s = css(node);
      if (/hidden|clip/.test(`${s.overflowX} ${s.overflowY}`) || s.clipPath !== 'none') return true;
      if (node === container) return false;
    }
    return false;
  }
  function checkRadius() {
    const elements = [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements);
    for (const el of elements) {
      const media = /^(IMG|VIDEO|CANVAS|IFRAME|PICTURE)$/.test(el.tagName);
      if (!(media || hasBoundary(el)) || !isVisible(el)) continue;
      const inner = el.getBoundingClientRect();
      const r = radii(el, inner);
      const roundedSurface = (node) => {
        const box = radii(node, node.getBoundingClientRect());
        return hasBoundary(node) && box.tl + box.tr + box.br + box.bl > 0;
      };
      let container = el.parentElement;
      for (let depth = 0; container && depth < 4 && !roundedSurface(container); depth += 1) container = container.parentElement;
      if (!container || container === document.documentElement || !roundedSurface(container)) continue;
      const outer = container.getBoundingClientRect();
      const R = radii(container, outer);
      // The rule is about nested surfaces: children that fill most of the container, or sit close into its corner.
      const nestedSurface = inner.width >= outer.width * 0.5 || inner.height >= outer.height * 0.5;
      const corners = [
        ['tl', inner.left - outer.left, inner.top - outer.top], ['tr', outer.right - inner.right, inner.top - outer.top],
        ['br', outer.right - inner.right, outer.bottom - inner.bottom], ['bl', inner.left - outer.left, outer.bottom - inner.bottom],
      ];
      for (const [corner, dx, dy] of corners) {
        if (dx < 0 || dy < 0 || Math.abs(dx - dy) > 4 || R[corner] <= 0) continue;
        const inset = (dx + dy) / 2;
        if (inset >= R[corner] || inset < 1) continue;
        if (inset <= 2 && clipsBetween(el, container)) continue; // a flush child clipped by overflow:hidden inherits the outer curve
        if (!nestedSurface && inset > R[corner] * 0.5) continue;
        const expected = Math.min(r.max, Math.max(0, R[corner] - inset));
        const actual = r[corner];
        if (Math.abs(actual - expected) <= LIMITS.radiusTolerance) continue;
        add('SU-93', actual > expected && nestedSurface ? 'fail' : 'warn', 'Nested corners', el,
          `${corner} radius ${Math.round(actual)}px inside ${Math.round(R[corner])}px with ${Math.round(inset)}px inset (expected ≈ ${Math.round(expected)}px)`,
          'inner radius = max(0, outer radius − padding)');
        break;
      }
    }
  }

  // ---------- 8. reading text (SU-5, SU-7, SU-15, SU-25) ----------
  const BLOCKY = /^(block|flex|grid|list-item|table|table-row|table-cell)$/;
  function checkReading() {
    for (const el of ROOT.querySelectorAll('p, li, blockquote, dd, figcaption, div, section, article, td')) {
      const text = el.textContent.trim().replace(/\s+/g, ' ');
      if (text.length < 120 || !isVisible(el) || [...el.children].some((c) => BLOCKY.test(css(c).display))) continue;
      const s = css(el);
      const size = px(s.fontSize);
      const lineHeight = s.lineHeight === 'normal' ? size * 1.2 : px(s.lineHeight);
      const rect = el.getBoundingClientRect();
      const contentWidth = rect.width - px(s.paddingLeft) - px(s.paddingRight) - px(s.borderLeftWidth) - px(s.borderRightWidth);
      const lines = Math.round((rect.height - px(s.paddingTop) - px(s.paddingBottom)) / lineHeight);
      if (lines < 2) continue;
      // Measured in ch (width of "0"), the unit the rule is written in: 65ch holds ~80–90 average characters.
      ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const measure = Math.round(contentWidth / ctx.measureText('0').width);
      if (measure > LIMITS.measureHigh) add('SU-15', 'warn', 'Line length', el, `text column ≈${measure}ch wide`, 'max-width: 65ch on the text column (60–75ch OK)');
      // A phone-width viewport makes short lines unavoidable; only flag narrow columns on wider screens.
      if (measure < LIMITS.measureLow && lines >= 4 && innerWidth > LIMITS.narrowViewport) add('SU-15', 'warn', 'Line length', el, `text column ≈${measure}ch wide`, 'Widen the column toward 60–75ch');
      if (s.textAlign === 'center' && lines >= 3) add('SU-7', 'warn', 'Text alignment', el, `centered paragraph over ${lines} lines`, 'text-align: start for multi-line prose');
      if (s.textAlign === 'justify' && s.hyphens !== 'auto') add('SU-7', 'warn', 'Text alignment', el, 'justified without hyphenation', 'text-align: start, or hyphens: auto with lang');
      const leading = lineHeight / size;
      if (size <= 20 && leading < LIMITS.leadingLow) add('SU-5', 'warn', 'Line height', el, `line-height ${leading.toFixed(2)} at ${size}px`, 'line-height ~1.5 for body text');
      if (leading > LIMITS.leadingHigh) add('SU-5', 'warn', 'Line height', el, `line-height ${leading.toFixed(2)}`, 'line-height ~1.5 keeps the paragraph together');
      if (size < LIMITS.minReadingPx) add('SU-25', 'warn', 'Readable size', el, `${size}px paragraph text`, 'Keep reading text ≥ 14px (16px for paragraphs)');
    }
  }

  // ---------- 9. links (SU-6, SU-9) ----------
  const VAGUE = /^(click here|here|read more|more|learn more|link|this link|go|details|continue reading)$/;
  function checkLinks() {
    const byName = new Map();
    for (const a of ROOT.querySelectorAll('a[href]')) {
      if (!isVisible(a)) continue;
      const name = (a.getAttribute('aria-label') || a.textContent).trim().toLowerCase().replace(/\s+/g, ' ');
      if (VAGUE.test(name)) add('SU-6', 'fail', 'Descriptive links', a, `link text "${name}"`, 'Name the destination ("Billing settings", "Typography guide")');
      if (name) byName.set(name, [...(byName.get(name) || []), a]);
      if (!isInlineLink(a)) continue;
      const s = css(a);
      const marked = /underline/.test(s.textDecorationLine) || px(s.borderBottomWidth) > 0 || s.backgroundImage !== 'none';
      if (marked) continue;
      const difference = ratio(parseColor(s.color), parseColor(css(a.parentElement).color));
      add('SU-9', difference < 3 ? 'fail' : 'warn', 'Obvious links', a, `inline link without underline (${difference.toFixed(2)}:1 from surrounding text)`, 'text-decoration: underline; text-underline-offset: .2em');
    }
    for (const [name, links] of byName) {
      const hrefs = new Set(links.map((l) => l.getAttribute('href')));
      if (links.length > 1 && hrefs.size > 1 && name.length < 30) add('SU-6', 'warn', 'Descriptive links', links[0], `${links.length} links share the text "${name}" but go to different places`, 'Make each link text name its destination');
    }
  }

  // ---------- 10. forms (SU-50, SU-51, SU-53) ----------
  function checkChoices() {
    for (const input of ROOT.querySelectorAll('input[type=checkbox], input[type=radio]')) {
      if (!input.isConnected || isDisabled(input)) continue;
      const named = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
      const shown = input.getClientRects().length > 0 || [...(input.labels || [])].some(isVisible);
      if (!shown) {
        // Inside a hidden state (tab, menu, dialog): the label association can still be checked statically.
        checked('checkboxes/radios in hidden states (static check)');
        if (!(input.labels || []).length && !named) add('SU-50', 'fail', 'Clickable labels', input, 'checkbox/radio has no associated label (in a hidden state)', 'Wrap it in <label> or use for/id so the whole row toggles it');
        continue;
      }
      checked('checkboxes/radios');
      const labels = [...(input.labels || [])].filter(isVisible);
      if (!labels.length) {
        add('SU-50', named ? 'warn' : 'fail', 'Clickable labels', input, named ? 'labelled by aria only; the visible words are not clickable' : 'checkbox/radio has no associated label', 'Wrap it in <label> or use for/id so the whole row toggles it');
        continue;
      }
      const label = labels[0];
      const rect = label.getBoundingClientRect();
      const union = { top: Math.min(rect.top, input.getBoundingClientRect().top), bottom: Math.max(rect.bottom, input.getBoundingClientRect().bottom) };
      if (union.bottom - union.top < 24) add('SU-50', 'warn', 'Clickable labels', label, `click area ${Math.round(union.bottom - union.top)}px tall`, 'Pad the label row to ~40px');
      if (css(label).userSelect !== 'none') add('SU-51', 'info', 'Label selection', label, 'option label text is selectable', 'user-select: none on short option labels');
      const s = css(label);
      const lineHeight = s.lineHeight === 'normal' ? px(s.fontSize) * 1.2 : px(s.lineHeight);
      if (rect.height > lineHeight * 1.8 && label.contains(input)) {
        const inputRect = input.getBoundingClientRect();
        const firstLineCenter = rect.top + px(s.paddingTop) + lineHeight / 2;
        if (Math.abs(inputRect.top + inputRect.height / 2 - firstLineCenter) > lineHeight * 0.5) add('SU-53', 'warn', 'Wrapped labels', input, 'control is not aligned with the first line of its wrapped label', 'align-items: flex-start and center the box on the first line');
      }
    }
  }

  // ---------- 11. status dots, images, dialogs (SU-71, SU-106, SU-103) ----------
  const STATUS_WORD = /online|offline|active|inactive|connected|disconnected|paid|pending|overdue|failed|failing|success|error|warning|live|idle|busy|away|draft|published|open|closed|done|complete|running|stopped|healthy|degraded|down|operational|enabled|disabled|on\b|off\b/i;
  function checkMisc() {
    for (const el of [...ROOT.querySelectorAll('span, i, div, b, em')].slice(0, LIMITS.maxElements)) {
      if (el.children.length || el.textContent.trim() || el.closest(INTERACTIVE) || !isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.width > 16 || Math.abs(rect.width - rect.height) > 2) continue;
      const s = css(el);
      if (parseColor(s.backgroundColor).a < 0.3 || px(s.borderTopLeftRadius) < rect.width / 2 - 1) continue;
      const context = `${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.parentElement ? el.parentElement.textContent : ''}`;
      if (!STATUS_WORD.test(context)) add('SU-71', 'warn', 'Status signals', el, 'colored dot with no status word next to it', 'Pair the color with an icon and a text label ("✓ Connected")');
    }
    for (const img of ROOT.querySelectorAll('img')) {
      if (!isVisible(img) || !img.naturalWidth || !img.naturalHeight) continue;
      checked('images');
      const rect = img.getBoundingClientRect();
      const distortion = (rect.width / rect.height) / (img.naturalWidth / img.naturalHeight);
      if (css(img).objectFit === 'fill' && Math.abs(distortion - 1) > 0.03) add('SU-106', 'fail', 'Consistent frames', img, `image stretched ${Math.round((distortion - 1) * 100)}% from its natural aspect`, 'aspect-ratio on the frame + object-fit: cover');
    }
    const DIALOG = 'dialog[open], [role=dialog], [role=alertdialog], [aria-modal=true]';
    for (const dialog of [ROOT, ...ROOT.querySelectorAll(DIALOG)].filter((d) => d.matches(DIALOG))) {
      if (!isVisible(dialog)) continue;
      checked('open dialogs');
      if (css(dialog).boxShadow === 'none' && !hasBoundary(dialog.firstElementChild || dialog)) add('SU-103', 'warn', 'Modal depth', dialog, 'dialog has no elevation shadow', 'Level-5 shadow: soft broad + tight edge');
      const nativeBackdrop = dialog.matches('dialog') && dialog.matches(':modal') && parseColor(getComputedStyle(dialog, '::backdrop').backgroundColor).a > 0.05;
      const scrim = [...document.querySelectorAll('body *')].some((n) => {
        const s = css(n);
        if (!/fixed|absolute/.test(s.position) || n === dialog) return false;
        const r = n.getBoundingClientRect();
        return r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9 && parseColor(s.backgroundColor).a >= 0.1 && isVisible(n);
      });
      if (!nativeBackdrop && !scrim) add('SU-103', 'warn', 'Modal depth', dialog, 'no dimming scrim behind the dialog', 'Dim the page behind modals (::backdrop or a fixed scrim)');
    }
  }

  // ---------- 13. centered content (SU-137, with SU-30) ----------
  // Text that sits a few px off-center in a pill, chip or button, or a sliding selection highlight drawn
  // a few px off its label, is invisible to every other check and easy to miss by eye in a screenshot.
  const CONTROL_LIKE = 'button, [role=button], [role=tab], [role=radio], [role=option], [role=menuitem], a[href], label, span, div, li';
  function contentBox(el) {
    const boxes = [];
    let texts = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    while (walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0).forEach((r) => { boxes.push(r); texts += 1; });
    }
    const icons = [...el.querySelectorAll('svg, img, i, [class*=icon]')].filter((n) => isVisible(n) && n.getBoundingClientRect().width >= 6).map((n) => n.getBoundingClientRect());
    const all = [...boxes, ...icons];
    if (!all.length) return null;
    return {
      left: Math.min(...all.map((b) => b.left)), right: Math.max(...all.map((b) => b.right)),
      top: Math.min(...all.map((b) => b.top)), bottom: Math.max(...all.map((b) => b.bottom)), texts, icons: icons.length,
    };
  }
  const offCenterLevel = (diff, width) => (diff > Math.max(6, width * 0.06) ? 'fail' : diff > Math.max(3, width * 0.03) ? 'warn' : null);
  function checkCentering() {
    const indicatorFor = new Set();
    // (b) Separately drawn highlights: an untexted surface behind an interactive item.
    for (const ind of [...ROOT.querySelectorAll('span, div, i, b, li')].slice(0, LIMITS.maxElements)) {
      if (ind.textContent.trim() || !isVisible(ind) || !hasBoundary(ind) || !/absolute|fixed/.test(css(ind).position)) continue;
      const r = ind.getBoundingClientRect();
      if (r.height < 16 || r.height > 96 || r.width < 24 || r.width > 600 || !ind.parentElement) continue;
      const overlap = (o) => Math.max(0, Math.min(r.right, o.right) - Math.max(r.left, o.left)) * Math.max(0, Math.min(r.bottom, o.bottom) - Math.max(r.top, o.top));
      const item = [...ind.parentElement.querySelectorAll(INTERACTIVE)].filter((n) => !n.contains(ind) && isVisible(n))
        .map((n) => ({ n, area: overlap(n.getBoundingClientRect()) })).sort((a, b) => b.area - a.area)[0];
      if (!item || item.area < 0.5 * Math.min(r.width * r.height, item.n.getBoundingClientRect().width * item.n.getBoundingClientRect().height)) continue;
      const content = contentBox(item.n);
      if (!content || !content.texts) continue;
      checked('selection indicators');
      indicatorFor.add(item.n);
      const [left, right] = [content.left - r.left, r.right - content.right];
      const level = offCenterLevel(Math.abs(left - right), r.width);
      if (level) {
        add('SU-137', level, 'Centered content', ind,
          `selection highlight is ${Math.abs((left - right) / 2).toFixed(1)}px off-center behind ${describe(item.n)} (left ${Math.round(left)}px vs right ${Math.round(right)}px)`,
          'Position the highlight from the selected item\'s own box (left = item.offsetLeft, width = item.offsetWidth), with no extra gap or padding offset');
      }
    }
    // (a) Content inside pill-like controls that are meant to be centered.
    for (const el of [...ROOT.querySelectorAll(CONTROL_LIKE)].slice(0, LIMITS.maxElements)) {
      if (indicatorFor.has(el) || !isVisible(el) || !hasBoundary(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 16 || r.height > 96 || r.width < 24 || r.width > 480) continue;
      // Overflowing (truncated) content has no meaningful center; SU-200 reports the truncation itself.
      if (el.scrollWidth > el.clientWidth + 1) continue;
      const content = contentBox(el);
      if (!content || !content.texts) continue;
      const s = css(el);
      const [left, right] = [content.left - r.left, r.right - content.right];
      const hugs = r.width <= content.right - content.left + px(s.paddingLeft) + px(s.paddingRight) + px(s.borderLeftWidth) + px(s.borderRightWidth) + 4;
      const centered = s.textAlign === 'center' || /center/.test(s.justifyContent) || hugs || el.matches('button, [role=button], [role=tab], [role=radio]');
      if (!centered || (s.textAlign !== 'center' && !/center/.test(s.justifyContent) && !hugs && right > r.width * 0.35)) continue;
      checked('centered controls');
      if (content.icons) {
        const iconLeft = [...el.querySelectorAll('svg, img, i, [class*=icon]')].some((n) => Math.abs(n.getBoundingClientRect().left - content.left) < 1);
        const [iconSide, textSide] = iconLeft ? [left, right] : [right, left];
        if (iconSide > textSide + 2) add('SU-30', 'warn', 'Button padding', el, `icon side has ${Math.round(iconSide)}px vs ${Math.round(textSide)}px on the text side`, 'Give the icon side ~4px less padding than the text side');
        continue;
      }
      const level = offCenterLevel(Math.abs(left - right), r.width);
      if (level) {
        add('SU-137', level, 'Centered content', el, `label is ${Math.abs((left - right) / 2).toFixed(1)}px off-center (left ${Math.round(left)}px vs right ${Math.round(right)}px)`, 'Make the inline padding symmetric (or center with justify-content), then judge optically');
      }
      const [top, bottom] = [content.top - r.top, r.bottom - content.bottom];
      if (Math.abs(top - bottom) > 4) add('SU-137', 'warn', 'Centered content', el, `label sits ${Math.abs((top - bottom) / 2).toFixed(1)}px ${top > bottom ? 'low' : 'high'} (top ${Math.round(top)}px vs bottom ${Math.round(bottom)}px)`, 'Center with align-items: center and equal block padding; then nudge optically (SU-36)');
    }
  }

  // ---------- 12. motion in CSS (SU-72, SU-75, SU-78, SU-82, SU-85, SU-86) ----------
  // Routine UI transitions stay ≤ 300ms; big surfaces (modals, drawers, sheets, pages) get up to 500ms.
  const MOTION_LIMITS = { routineMs: 300, panelMs: 500 };
  const PANEL_MOTION = /modal|dialog|drawer|sheet|panel|page|route|overlay|backdrop/i;
  const INTERACTION_STATE = /:hover|:active|:focus|\[aria-pressed|\[aria-expanded|\.is-active|\[data-state/;
  const EASE_IN_MIN_X1 = 0.4;
  const EASE_IN_MAX_Y1 = 0.1;
  const EASE_OUT_END = { minY2: 0.9, maxX2: 0.8 };
  function collectRules() {
    const rules = [];
    const keyframes = [];
    let reduced = false;
    const walk = (list, inReduced) => {
      for (const rule of list) {
        if (rule instanceof CSSKeyframesRule) keyframes.push(rule);
        else if (rule instanceof CSSMediaRule) {
          const isReduced = /prefers-reduced-motion/.test(rule.conditionText || rule.media.mediaText);
          reduced = reduced || isReduced;
          walk(rule.cssRules, inReduced || isReduced);
        } else if (rule instanceof CSSStyleRule) {
          rules.push({ rule, inReduced });
          if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules, inReduced);
        } else if (rule.cssRules) walk(rule.cssRules, inReduced);
      }
    };
    for (const sheet of document.styleSheets) {
      try { walk(sheet.cssRules, false); } catch { notes.push(`Skipped a cross-origin stylesheet: ${sheet.href}`); }
    }
    return { rules, keyframes, reduced };
  }
  // Timing functions of a rule, with var(--ease-*) tokens resolved from :root (a transition shorthand with var() has no longhand).
  function timingText(style) {
    const text = style.transitionTimingFunction || (style.transition || '');
    const rootStyle = css(document.documentElement);
    return text.replace(/var\(\s*(--[\w-]+)[^)]*\)/g, (_, name) => rootStyle.getPropertyValue(name).trim());
  }
  // An ease-in curve starts slow and keeps accelerating: keyword ease-in, or cubic-bezier(x1 ≥ .4, y1 ≤ .1) that does not
  // flatten out at the end (that shape is ease-in-out, which is fine for a short move).
  function usesEaseIn(timing) {
    if (/(^|[\s,])ease-in(?![\w-])/.test(timing)) return true;
    return [...timing.matchAll(/cubic-bezier\(\s*([^)]*)\)/g)].some((match) => {
      const [x1, y1, x2, y2] = match[1].split(',').map(parseFloat);
      const decelerates = y2 >= EASE_OUT_END.minY2 && x2 <= EASE_OUT_END.maxX2;
      return x1 >= EASE_IN_MIN_X1 && y1 <= EASE_IN_MAX_Y1 && !decelerates;
    });
  }
  const durations = (value) => (value || '').split(',').map((v) => (v.trim().endsWith('ms') ? px(v) : px(v) * 1000)).filter((v) => v > 0);
  function checkMotion({ rules, keyframes, reduced }) {
    let usesMotion = false;
    for (const { rule, inReduced } of rules) {
      if (inReduced) continue;
      const s = rule.style;
      const selector = rule.selectorText || '';
      const loader = /spin|load|skeleton|marquee|progress|shimmer|pulse/i.test(`${selector} ${s.animationName}`);
      const transitionMs = s.transitionProperty === 'none' ? [] : durations(s.transitionDuration);
      const animated = s.animationName && s.animationName !== 'none';
      if (transitionMs.length || animated) usesMotion = true;
      const longest = Math.max(0, ...transitionMs, ...(animated && s.animationIterationCount !== 'infinite' ? durations(s.animationDuration) : []));
      const panel = PANEL_MOTION.test(selector);
      const limit = panel ? MOTION_LIMITS.panelMs : MOTION_LIMITS.routineMs;
      if (!loader && longest > limit) {
        add('SU-85', 'warn', 'Timing', null, `${selector}: ${longest}ms (limit ${limit}ms)`,
          panel ? `Keep modals, drawers, sheets and page transitions ≤ ${MOTION_LIMITS.panelMs}ms` : `Keep routine UI transitions ≤ ${MOTION_LIMITS.routineMs}ms (micro ≤ 200ms)`);
      }
      const moves = /transform|translate|scale|rotate|left|top|right|bottom|inset|margin|width|height|all/.test(s.transitionProperty || 'all');
      if (!loader && transitionMs.length && moves && /(^|,|\s)linear(\s|,|$)/.test(s.transitionTimingFunction)) add('SU-82', 'warn', 'Easing', null, `${selector}: linear easing on movement`, 'ease-out to enter, ease-in to exit, ease-in-out to move');
      if (!loader && INTERACTION_STATE.test(selector) && usesEaseIn(timingText(s))) add('SU-82', 'warn', 'Easing', null, `${selector}: ease-in on an interaction`, 'ease-in on an interaction feels sluggish; use ease-out (or a short ease-in-out)');
      if (/:active/.test(selector)) {
        const scale = (s.transform.match(/scale\(\s*([\d.]+)/) || [])[1] || s.scale;
        if (scale && px(scale) > 0 && px(scale) < LIMITS.pressScaleMin) add('SU-72', 'warn', 'Press feedback', null, `${selector}: scale(${px(scale)})`, 'Pressed scale 0.95–0.98');
        const base = selector.replace(/:active/g, '').trim();
        const baseRule = rules.find(({ rule: r }) => r.selectorText === base);
        const pressMs = baseRule ? Math.max(0, ...durations(baseRule.rule.style.transitionDuration)) : 0;
        if (pressMs > LIMITS.pressMs) add('SU-72', 'warn', 'Press feedback', null, `${base}: press transition ${pressMs}ms`, 'About 200ms');
      }
      if (animated && /\[(data-)?(open|state)|\.(is-)?(open|show|visible|active|expanded|enter)|:popover-open|\[open\]/i.test(selector)) add('SU-75', 'info', 'Interruptible transitions', null, `${selector}: opens with @keyframes ${s.animationName}`, 'Use transitions or springs so closing mid-way reverses from the current state');
    }
    for (const frames of keyframes) {
      const offsets = [...frames.cssRules].map((k) => px((k.style.transform.match(/translateX\(\s*(-?[\d.]+)px/) || [])[1]));
      const flips = offsets.filter((v, i) => i > 0 && Math.sign(v) !== Math.sign(offsets[i - 1]) && v !== 0).length;
      const amplitude = Math.max(0, ...offsets.map(Math.abs));
      if (flips >= 2 && amplitude > LIMITS.shakePx) add('SU-86', 'warn', 'Noticeable errors', null, `@keyframes ${frames.name} shakes ±${amplitude}px`, 'About ±4px, once, ~240ms');
    }
    if (usesMotion && !reduced) add('SU-78', 'warn', 'Reduced motion', null, 'transitions/animations without a prefers-reduced-motion rule', '@media (prefers-reduced-motion: reduce) { … }');
  }

  // A modal counts as open only when it is modal, painted and on screen (closed sheets often sit off-screen).
  function findOpenModal() {
    const candidates = [...document.querySelectorAll('dialog, [aria-modal="true"]')];
    return candidates.find((dialog) => {
      let modal = dialog.getAttribute('aria-modal') === 'true';
      try { modal = modal || dialog.matches(':modal'); } catch { /* :modal unsupported */ }
      if (!modal || !isVisible(dialog) || dialog.closest('[inert], [aria-hidden="true"]')) return false;
      const r = dialog.getBoundingClientRect();
      return r.bottom > 1 && r.right > 1 && r.top < innerHeight - 1 && r.left < innerWidth - 1;
    }) || null;
  }

  // Hidden states (closed tabs, menus, accordions, dialogs, popovers) were not on screen, so most checks
  // could not run inside them. Listing them turns "only the visible state" into a concrete to-do list.
  function hiddenStates() {
    const found = [];
    const seen = new Set();
    const shown = (n) => n.getClientRects().length > 0 && css(n).visibility !== 'hidden';
    const push = (nodes, trigger, kind) => {
      const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
      if (!list.length || list.some((n) => seen.has(n) || shown(n)) || [...seen].some((s) => s.contains(list[0]))) return;
      list.forEach((n) => seen.add(n));
      const interactive = list.reduce((sum, n) => sum + n.querySelectorAll(INTERACTIVE).length, 0);
      const textChars = list.reduce((sum, n) => sum + n.textContent.trim().length, 0);
      if (!interactive && textChars < 20) return;
      found.push({ kind, state: path(list[0]), opensWith: trigger ? `${path(trigger)} "${(trigger.getAttribute('aria-label') || trigger.textContent || '').trim().slice(0, 24)}"` : null, interactive });
    };
    ROOT.querySelectorAll('details:not([open])').forEach((d) => push([...d.children].filter((c) => c.tagName !== 'SUMMARY'), d.querySelector('summary'), 'collapsed details'));
    ROOT.querySelectorAll('[aria-controls]').forEach((t) => {
      const target = document.getElementById(t.getAttribute('aria-controls'));
      if (t.getAttribute('role') === 'tab') push(target, t, 'inactive tab');
      else if (t.getAttribute('aria-expanded') === 'false') push(target, t, 'collapsed menu or panel');
    });
    document.querySelectorAll('dialog:not([open])').forEach((d) => push(d, d.id ? document.querySelector(`[aria-controls="${d.id}"], [data-dialog="${d.id}"], [commandfor="${d.id}"], [data-target="#${d.id}"]`) : null, 'closed dialog'));
    document.querySelectorAll('[popover]').forEach((p) => { let open = false; try { open = p.matches(':popover-open'); } catch { open = false; } if (!open) push(p, p.id ? document.querySelector(`[popovertarget="${p.id}"]`) : null, 'closed popover'); });
    [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements).forEach((el) => {
      if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(el.tagName)) return;
      if ((css(el).display === 'none' || el.hidden) && el.parentElement && css(el.parentElement).display !== 'none') push(el, null, 'hidden element');
    });
    if (found.length > 30) COVERAGE.capsHit.push(`hidden states: listed the first 30 of ${found.length}`);
    return found.slice(0, 30);
  }


  // ---------- accessible names and non-text content (SU-140, SU-141) ----------
  const SEM_NAMED_CONTROLS = 'button, a[href], summary, [role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=radio], [role=switch], [role=option], input[type=button], input[type=submit], input[type=reset], input[type=image], input[type=checkbox], input[type=radio]';
  const SEM_NAME_FROM_CONTENT = 'button, a, summary, [role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=radio], [role=switch], [role=option]';
  const SEM_LABEL_IN_NAME_MIN_CHARS = 2;
  const SEM_DECORATIVE_ROLES = /^(presentation|none)$/;
  // The copy checks (generic errors, vague button words, title case) match English phrases only.
  const semIsEnglish = (el) => /^(en\b|$)/i.test(((el.closest('[lang]') || document.documentElement).getAttribute('lang') || '').trim());
  const semClean = (text) => (text || '').replace(/\s+/g, ' ').trim();
  const semWords = (text) => semClean(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const semIdsOf = (el, attr) => (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean);
  const semRole = (el) => el.getAttribute('role') || el.tagName.toLowerCase();
  // Text a node contributes to a name. Controls inside it add nothing; aria-hidden and hidden subtrees are skipped
  // (except for the node an aria-labelledby points at, which may be hidden on purpose).
  function semText(node, isRoot = false) {
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType !== 1 || /^(SCRIPT|STYLE|TEMPLATE|INPUT|SELECT|TEXTAREA)$/.test(node.tagName)) return '';
    if (!isRoot && (node.getAttribute('aria-hidden') === 'true' || node.hidden || css(node).display === 'none')) return '';
    const own = node.getAttribute('aria-label');
    if (own && !isRoot) return ` ${own} `;
    if (node.tagName === 'IMG') return node.getAttribute('alt') || '';
    if (node.localName === 'svg') return semClean(own) || (node.querySelector(':scope > title') || { textContent: '' }).textContent;
    return [...node.childNodes].map((child) => semText(child)).join('');
  }
  const semLabelText = (el) => semClean([...(el.labels || [])].map((label) => semText(label, true)).join(' '));
  // Simplified accessible-name computation: where the name comes from matters (a placeholder is not a label, SU-148).
  function semName(el) {
    const labelledby = semIdsOf(el, 'aria-labelledby').map((id) => document.getElementById(id)).filter(Boolean)
      .map((node) => semClean(semText(node, true))).filter(Boolean).join(' ');
    if (labelledby) return { name: labelledby, source: 'aria-labelledby' };
    const ariaLabel = semClean(el.getAttribute('aria-label'));
    if (ariaLabel) return { name: ariaLabel, source: 'aria-label' };
    const label = semLabelText(el);
    if (label) return { name: label, source: 'label' };
    if (el.matches('input[type=image]') && semClean(el.getAttribute('alt'))) return { name: semClean(el.getAttribute('alt')), source: 'alt' };
    if (el.matches('input[type=button], input[type=submit], input[type=reset]')) {
      const value = el.hasAttribute('value') ? semClean(el.getAttribute('value')) : { submit: 'Submit', reset: 'Reset' }[el.type] || '';
      if (value) return { name: value, source: 'value' };
    }
    const content = el.matches(SEM_NAME_FROM_CONTENT) ? semClean(semText(el, true)) : '';
    if (content) return { name: content, source: 'content' };
    const title = semClean(el.getAttribute('title'));
    if (title) return { name: title, source: 'title' };
    const placeholder = el.matches('input, textarea') ? semClean(el.getAttribute('placeholder')) : '';
    return placeholder ? { name: placeholder, source: 'placeholder' } : { name: '', source: null };
  }

  function checkNames() {
    for (const el of [...ROOT.querySelectorAll(SEM_NAMED_CONTROLS)].slice(0, LIMITS.maxElements)) {
      if (!isVisible(el) || el.closest('[aria-hidden="true"]')) continue;
      checked('accessible names');
      const { name, source } = semName(el);
      if (!name) {
        add('SU-140', 'fail', 'Accessible name', el, `${semRole(el)} has no accessible name`, 'Add visible text, or aria-label / aria-labelledby that says what it does ("Close", not the icon)');
        continue;
      }
      if (source !== 'aria-label' && source !== 'aria-labelledby') continue;
      const visible = semWords(el.innerText);
      if (visible.length >= SEM_LABEL_IN_NAME_MIN_CHARS && !semWords(name).includes(visible)) {
        add('SU-140', 'warn', 'Accessible name', el, `visible text "${semClean(el.innerText).slice(0, 30)}" is not part of its accessible name "${name.slice(0, 30)}"`, 'Start the aria-label with the visible text so voice control ("click Search products") still works');
      }
    }
  }

  function checkImages() {
    for (const img of ROOT.querySelectorAll('img:not([alt])')) {
      if (!isVisible(img) || img.closest('[aria-hidden="true"]') || SEM_DECORATIVE_ROLES.test(img.getAttribute('role') || '')) continue;
      add('SU-141', 'fail', 'Non-text content', img, 'image has no alt attribute', 'alt="…" describing what it shows, or alt="" when it is decorative');
    }
    for (const svg of ROOT.querySelectorAll('svg[role=img]')) {
      if (!isVisible(svg) || svg.closest('[aria-hidden="true"]')) continue;
      const named = semIdsOf(svg, 'aria-labelledby').length || semClean(svg.getAttribute('aria-label')) || svg.querySelector(':scope > title');
      if (!named) add('SU-141', 'warn', 'Non-text content', svg, 'svg with role="img" has no accessible name', 'aria-label, aria-labelledby or a <title> child; use aria-hidden="true" when decorative');
    }
  }

  REGISTERED = [...REGISTERED, ['accessible names', checkNames], ['non-text content', checkImages]];

  // ---------- landmarks, language, title and ARIA validity (SU-138, SU-139, SU-142) ----------
  const SEM_SKIP_LINK_MIN_PRECEDING = 5;
  const SEM_GENERIC_TITLE = /^(document|untitled|react app|vite \+ \w+|home|index)$/i;
  const SEM_LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i;
  const SEM_ID_REFERENCES = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-errormessage', 'aria-owns'];
  const SEM_TABBABLE = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex], [contenteditable]';
  // Reachable with Tab: tabindex >= 0, enabled, and rendered (a hidden-until-focus skip link still counts).
  const semIsTabbable = (el) => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert]')
    && css(el).visibility !== 'hidden' && el.getClientRects().length > 0;

  function checkLandmarks() {
    if (ROOT !== document.body) { skipped('landmarks (audit is scoped to a region or a modal)'); return; }
    const mains = [...document.querySelectorAll('main, [role=main]')].filter((main) => !main.hidden && css(main).display !== 'none');
    checked('main landmarks', mains.length);
    if (mains.length !== 1) {
      const detail = mains.length ? `${mains.length} main landmarks (a page has exactly one)` : 'no main landmark';
      add('SU-138', 'fail', 'Landmarks and skip link', mains[1] || document.body, detail, 'Wrap the page\'s primary content in a single <main>');
    }
    if (!mains.length) return;
    const tabbable = [...document.querySelectorAll(SEM_TABBABLE)].slice(0, LIMITS.maxElements).filter(semIsTabbable);
    const before = tabbable.filter((el) => !mains[0].contains(el) && (mains[0].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING));
    if (before.length < SEM_SKIP_LINK_MIN_PRECEDING) return;
    const target = tabbable[0].matches('a[href^="#"]') && tabbable[0].getAttribute('href').length > 1 && document.getElementById(decodeURIComponent(tabbable[0].getAttribute('href').slice(1)));
    if (!target) add('SU-138', 'warn', 'Landmarks and skip link', tabbable[0], `${before.length} focusable elements come before <main> and the first one is not a skip link`, 'First focusable: <a href="#main">Skip to main content</a>, visible on focus, pointing at <main id="main">');
  }

  function checkDocument() {
    const root = document.documentElement;
    const lang = (root.getAttribute('lang') || '').trim();
    if (!lang) add('SU-139', 'fail', 'Language and title', root, '<html> has no lang attribute', '<html lang="en"> so screen readers pick the right voice');
    else if (!SEM_LANGUAGE_TAG.test(lang)) add('SU-139', 'fail', 'Language and title', root, `lang="${lang}" is not a valid language tag`, 'Use a BCP 47 tag such as "en", "en-GB" or "pt-BR"');
    const title = semClean(document.title);
    if (!title) add('SU-139', 'fail', 'Language and title', document.head, 'document has no title', '<title>Page - Product</title>, updated on every client-side route');
    else if (SEM_GENERIC_TITLE.test(title)) add('SU-139', 'warn', 'Language and title', document.head, `title "${title}" is generic`, 'Name the page and the product: "Billing - Northstar"');
  }

  function checkAriaValidity() {
    for (const el of ROOT.querySelectorAll('[tabindex]')) {
      if (parseInt(el.getAttribute('tabindex'), 10) > 0) add('SU-142', 'fail', 'Honest ARIA and native first', el, `tabindex="${el.getAttribute('tabindex')}" overrides the natural focus order`, 'Use tabindex="0" or "-1" only; fix the order in the DOM');
    }
    for (const el of [...ROOT.querySelectorAll(SEM_TABBABLE)].slice(0, LIMITS.maxElements)) {
      if (el.closest('[aria-hidden="true"]') && semIsTabbable(el)) add('SU-142', 'fail', 'Honest ARIA and native first', el, 'focusable element inside aria-hidden="true"', 'Remove aria-hidden, or make the subtree inert (the inert attribute hides it from focus and from assistive tech)');
    }
    for (const el of ROOT.querySelectorAll(SEM_ID_REFERENCES.map((attr) => `[${attr}]`).join(', '))) {
      for (const attr of SEM_ID_REFERENCES) {
        semIdsOf(el, attr).filter((id) => !document.getElementById(id))
          .forEach((id) => add('SU-142', 'fail', 'Honest ARIA and native first', el, `${attr} points at #${id}, which does not exist`, 'Point it at an existing id, or remove the attribute'));
      }
    }
    const seen = new Set();
    for (const el of ROOT.querySelectorAll('[id]')) {
      if (el.id && seen.has(el.id)) add('SU-142', 'warn', 'Honest ARIA and native first', el, `duplicate id "${el.id}"`, 'ids are unique per document; references and labels pick the first match');
      seen.add(el.id);
    }
  }

  REGISTERED = [...REGISTERED, ['landmarks', checkLandmarks], ['language and title', checkDocument], ['aria validity', checkAriaValidity]];

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

  // ---------- live regions and widget state (SU-146, SU-147) ----------
  const SEM_TOAST_CLASS = /toast|snackbar|notification|(^|[^a-z])flash(es)?([^a-z]|$)/i;
  const SEM_TOAST_IGNORED_CLASS = /badge|count|dot|indicator|icon|bell|trigger|toggle|btn|button/i;
  const SEM_TOAST_MIN_CHARS = 4;
  const SEM_TOAST_MAX_CHARS = 140;
  const SEM_NOT_A_TOAST = 'nav, header, footer, aside, dialog, form, [role=dialog], [role=alertdialog], [role=navigation], [role=banner], [role=toolbar], [role=menu], [role=tablist], [aria-modal]';
  const SEM_LIVE_REGION = '[role=status], [role=alert], [role=log], [aria-live]:not([aria-live=off])';
  const SEM_ERROR_WORDS = /error|fail|couldn|can't|cannot|invalid|problem|denied|expired/i;
  let semToastCache = null;
  // Short, transient messages: fixed-position bubbles or classes named like toasts. Outermost match only.
  function semToastLike() {
    if (semToastCache) return semToastCache;
    const fixed = new Set(semLayers().fixed);
    const candidates = [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements).filter((el) => {
      const classes = el.getAttribute('class') || '';
      const named = SEM_TOAST_CLASS.test(classes) && !SEM_TOAST_IGNORED_CLASS.test(classes);
      if (!fixed.has(el) && !named) return false;
      if (el.matches(SEM_NOT_A_TOAST) || el.closest('a[href], button, [role=button]') || !isVisible(el)) return false;
      const text = semClean(el.textContent);
      if (text.length < SEM_TOAST_MIN_CHARS || text.length > SEM_TOAST_MAX_CHARS) return false;
      const controls = [...el.querySelectorAll(INTERACTIVE)];
      const controlChars = controls.reduce((sum, control) => sum + semClean(control.textContent).length, 0);
      return controls.length <= 2 && !(controls.length && controlChars >= text.length - 2) && !el.matches(INTERACTIVE);
    });
    semToastCache = candidates.filter((el) => !candidates.some((other) => other !== el && other.contains(el)));
    return semToastCache;
  }
  const semHasLiveRegion = (el) => !!el.closest(SEM_LIVE_REGION) || !!el.querySelector(SEM_LIVE_REGION);

  function checkLiveRegions() {
    for (const toast of semToastLike()) {
      checked('toast-like messages');
      if (!semHasLiveRegion(toast)) add('SU-146', 'warn', 'Status messages', toast, 'message appears without role="status" or aria-live, so screen readers never hear it', 'Mount <div role="status"> at load and put the message inside it (role="alert" only for errors)');
    }
    for (const alert of ROOT.querySelectorAll('[role=alert], [aria-live=assertive]')) {
      const text = semClean(alert.textContent);
      if (!text || !isVisible(alert) || SEM_ERROR_WORDS.test(text) || !semIsEnglish(alert)) continue;
      add('SU-146', 'warn', 'Status messages', alert, 'assertive announcement that does not read like an error', 'role="status" (polite) for confirmations and progress; keep role="alert" for errors that need attention');
    }
  }

  const semIsHidden = (node) => !node || node.hidden || css(node).display === 'none' || css(node).visibility === 'hidden' || !node.getClientRects().length;
  const SEM_CONTROLLED_DIALOG = 'dialog, [role=dialog], [role=alertdialog]';
  function checkWidgetState() {
    for (const tab of ROOT.querySelectorAll('[role=tab]')) {
      if (isVisible(tab) && !tab.hasAttribute('aria-selected')) add('SU-147', 'fail', 'Widget patterns', tab, 'role="tab" has no aria-selected', 'aria-selected="true" on the active tab, "false" on the others');
    }
    // A modal dialog opener (aria-haspopup="dialog") is the exception: the dialog itself signals its state.
    for (const el of ROOT.querySelectorAll('[aria-haspopup]:not([aria-haspopup=false]):not([aria-haspopup=dialog])')) {
      if (isVisible(el) && !el.hasAttribute('aria-expanded')) add('SU-147', 'fail', 'Widget patterns', el, 'popup trigger has no aria-expanded', 'Toggle aria-expanded="true|false" with the popup');
    }
    for (const el of ROOT.querySelectorAll('button[aria-controls]:not([role=tab]):not([role=menuitem]):not([role=option]), [role=button][aria-controls]')) {
      if (!isVisible(el) || el.hasAttribute('aria-expanded') || el.hasAttribute('aria-haspopup') || el.hasAttribute('aria-pressed')) continue;
      const target = document.getElementById(el.getAttribute('aria-controls'));
      if (target && !target.matches(SEM_CONTROLLED_DIALOG) && semIsHidden(target)) add('SU-147', 'fail', 'Widget patterns', el, 'disclosure button controls a hidden panel but has no aria-expanded', 'aria-expanded="false" while collapsed, "true" while open');
    }
    for (const list of ROOT.querySelectorAll('[role=tablist]')) {
      const tabs = [...list.querySelectorAll('[role=tab]')].filter(isVisible);
      const stops = tabs.filter((tab) => tab.tabIndex >= 0);
      if (tabs.length >= 2 && stops.length > 1) add('SU-147', 'warn', 'Widget patterns', list, `${stops.length} tabs are separate Tab stops`, 'Roving tabindex: tabindex="0" on the selected tab, "-1" on the rest, arrow keys move between them');
    }
  }

  REGISTERED = [...REGISTERED, ['live regions', checkLiveRegions], ['widget state', checkWidgetState]];

  // ---------- field labels, placeholders and autofill (SU-45, SU-148, SU-149, SU-153) ----------
  const SEM_MIN_FORM_FIELDS = 3;
  const SEM_REQUIRED_MARKER = /optional|required|\*/i;
  const SEM_SPLIT_CODE_MIN = 4;
  const SEM_SPLIT_CODE_MAX = 8;
  const SEM_AUTOFILL_TOKENS = new Set(['name', 'honorific-prefix', 'given-name', 'additional-name', 'family-name', 'honorific-suffix', 'nickname', 'username', 'new-password', 'current-password', 'one-time-code',
    'organization-title', 'organization', 'street-address', 'address-line1', 'address-line2', 'address-line3', 'address-level4', 'address-level3', 'address-level2', 'address-level1', 'country', 'country-name',
    'postal-code', 'cc-name', 'cc-given-name', 'cc-additional-name', 'cc-family-name', 'cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-csc', 'cc-type', 'transaction-currency', 'transaction-amount',
    'language', 'bday', 'bday-day', 'bday-month', 'bday-year', 'sex', 'url', 'photo', 'tel', 'tel-country-code', 'tel-national', 'tel-area-code', 'tel-local', 'tel-extension', 'email', 'impp']);
  const SEM_CONTACT_PREFIX = /^(home|work|mobile|fax|pager)$/;
  const semWord = (words) => new RegExp(`(?<![a-z])(?:${words})(?![a-z])`, 'i');
  // Order matters: the first purpose that matches wins ("email address" is an email, not a street address).
  const SEM_PERSONAL_PURPOSES = [
    { purpose: 'email', token: 'email', test: semWord('e-?mail') },
    { purpose: 'phone number', token: 'tel', test: semWord('phone|telephone|mobile|tel') },
    { purpose: 'one-time code', token: 'one-time-code', test: semWord('one[-_ ]?time|otp|verification[-_ ]?code|sms[-_ ]?code|2fa') },
    { purpose: 'username', token: 'username', test: semWord('user[-_ ]?name|login') },
    { purpose: 'first name', token: 'given-name', test: semWord('first[-_ ]?name|given[-_ ]?name|fname') },
    { purpose: 'last name', token: 'family-name', test: semWord('last[-_ ]?name|family[-_ ]?name|surname|lname') },
    { purpose: 'full name', token: 'name', test: semWord('full[-_ ]?name|your[-_ ]?name') },
    { purpose: 'street address', token: 'street-address', test: semWord('street|address[-_ ]?line|addr|address') },
    { purpose: 'postal code', token: 'postal-code', test: semWord('postal|zip|postcode') },
    { purpose: 'city', token: 'address-level2', test: semWord('city|town') },
    { purpose: 'country', token: 'country', test: semWord('country') },
    { purpose: 'birthday', token: 'bday', test: semWord('birth|bday|dob') },
  ];
  function semValidAutofill(value) {
    const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 1 && /^(on|off)$/.test(tokens[0])) return true;
    const scoped = tokens.filter((token) => !/^section-/.test(token) && !/^(shipping|billing)$/.test(token));
    const named = scoped.length > 1 && SEM_CONTACT_PREFIX.test(scoped[0]) ? scoped.slice(1) : scoped;
    const field = named.filter((token) => token !== 'webauthn');
    return field.length === 1 && SEM_AUTOFILL_TOKENS.has(field[0]);
  }
  const semPurpose = (field) => {
    const hints = `${field.type} ${field.name} ${field.id} ${semLabelText(field)} ${field.getAttribute('aria-label') || ''}`;
    return SEM_PERSONAL_PURPOSES.find(({ test }) => test.test(hints) || (field.type === 'email' && test === SEM_PERSONAL_PURPOSES[0].test) || (field.type === 'tel' && test === SEM_PERSONAL_PURPOSES[1].test));
  };
  const semEditable = (field) => isVisible(field) && !field.matches(':disabled, [readonly]') && !field.closest('[aria-hidden="true"]');

  // SU-45 extension: a placeholder is text too, and the browser default is a pale gray.
  function checkPlaceholderContrast() {
    for (const field of ROOT.querySelectorAll('input[placeholder], textarea[placeholder]')) {
      if (field.value || !field.matches(TEXT_FIELD) || !semClean(field.getAttribute('placeholder')) || !isVisible(field)) continue;
      const rect = field.getBoundingClientRect();
      const behind = backdropAt(field.parentElement || field, rect.left - 1, rect.top - 1);
      if (behind.covered || behind.image) { skipped('placeholder surface not measurable'); continue; }
      checked('placeholders');
      const holder = getComputedStyle(field, '::placeholder');
      const fill = over(parseColor(css(field).backgroundColor), behind.color);
      const color = parseColor(holder.color);
      const opacity = Number.isNaN(parseFloat(holder.opacity)) ? 1 : parseFloat(holder.opacity);
      const value = ratio(over({ ...color, a: color.a * opacity }, fill), fill);
      if (value < LIMITS.textAA) {
        add('SU-45', 'fail', 'Text contrast', field, `placeholder ${hex(color)} on ${hex(fill)} = ${value.toFixed(2)}:1 (needs ≥ ${LIMITS.textAA}:1)`, `::placeholder { color: <a gray that reaches ${LIMITS.textAA}:1 on ${hex(fill)}> }`);
      }
    }
  }

  function checkFieldNames() {
    for (const field of ROOT.querySelectorAll(TEXT_FIELD)) {
      if (!isVisible(field) || field.matches(':disabled') || field.closest('[aria-hidden="true"]')) continue;
      checked('field names');
      const { source } = semName(field);
      if (source === 'placeholder') add('SU-148', 'fail', 'Persistent labels', field, 'field named only by its placeholder', 'Add a visible <label for> above the field; a placeholder disappears as soon as someone types');
      else if (!source) add('SU-148', 'fail', 'Persistent labels', field, 'field has no accessible name', 'Add a visible <label for> above the field (or aria-label for a search box with a visible button)');
    }
  }

  function checkRequiredMarkers() {
    for (const form of ROOT.querySelectorAll('form')) {
      const fields = [...form.querySelectorAll(TEXT_FIELD)].filter((field) => isVisible(field) && !field.matches(':disabled'));
      const required = fields.filter((field) => field.required || field.getAttribute('aria-required') === 'true');
      if (fields.length < SEM_MIN_FORM_FIELDS || !required.length || required.length === fields.length) continue;
      const labelled = fields.some((field) => SEM_REQUIRED_MARKER.test(`${[...(field.labels || [])].map((label) => label.textContent).join(' ')} ${field.getAttribute('aria-label') || ''}`));
      if (!labelled) add('SU-149', 'warn', 'Mark the exception', form, `form mixes ${required.length} required and ${fields.length - required.length} optional fields and no label says which`, 'Mark the minority: "(optional)" in the label when most fields are required, otherwise a "*" explained once');
    }
  }

  function checkAutofill() {
    for (const field of ROOT.querySelectorAll(TEXT_FIELD)) {
      if (!semEditable(field)) continue;
      const attr = field.getAttribute('autocomplete');
      if (field.type === 'password') {
        if (attr && attr.trim().toLowerCase() === 'off') add('SU-153', 'fail', 'Help the browser help the user', field, 'password field has autocomplete="off"', 'autocomplete="current-password" (sign in) or "new-password" (sign up) so password managers work');
        else if (attr === null) add('SU-153', 'warn', 'Help the browser help the user', field, 'password field has no autocomplete attribute', 'autocomplete="current-password" or "new-password"');
        continue;
      }
      const match = semPurpose(field);
      if (!match) continue;
      checked('autofill fields');
      if (attr === null) add('SU-153', 'warn', 'Help the browser help the user', field, `${match.purpose} field has no autocomplete attribute`, `autocomplete="${match.token}"`);
      else if (!semValidAutofill(attr)) add('SU-153', 'warn', 'Help the browser help the user', field, `autocomplete="${attr}" is not a valid token`, `autocomplete="${match.token}"`);
    }
    const groups = new Map();
    for (const box of ROOT.querySelectorAll('input[maxlength="1"]')) if (isVisible(box)) groups.set(box.parentElement, [...(groups.get(box.parentElement) || []), box]);
    for (const boxes of groups.values()) {
      if (boxes.length >= SEM_SPLIT_CODE_MIN && boxes.length <= SEM_SPLIT_CODE_MAX) add('SU-153', 'warn', 'Help the browser help the user', boxes[0], `${boxes.length} single-character inputs (split code boxes)`, 'Must accept a pasted code: autocomplete="one-time-code", inputmode="numeric", and spread pasted text over the boxes (or use one input)');
    }
  }

  REGISTERED = [...REGISTERED, ['placeholder contrast', checkPlaceholderContrast], ['field names', checkFieldNames], ['required markers', checkRequiredMarkers], ['autofill', checkAutofill]];

  // ---------- validation timing and error messages (SU-150, SU-151) ----------
  const SEM_INVALID_STYLE_PROPS = /^(border(-[a-z]+)*-color|outline(-color)?|box-shadow|color|background(-color)?)$/;
  const SEM_VALIDATION_GUARDS = /\[aria-invalid|\.was-validated|\.submitted|\[data-submitted|:user-invalid|:not\(:invalid\)/;
  const SEM_SUBMIT = 'button[type=submit], input[type=submit], button:not([type])';
  const SEM_SELECTOR_PREVIEW_CHARS = 60;

  // :invalid matches a required empty field before anyone has typed, so styling it paints errors on load.
  function checkInvalidStyling({ rules }) {
    const reported = new Set();
    for (const { rule } of rules) {
      if (![...rule.style].some((name) => SEM_INVALID_STYLE_PROPS.test(name))) continue;
      for (const part of splitSelectorList(rule.selectorText || '').map((s) => s.trim())) {
        if (!/:invalid/.test(part) || SEM_VALIDATION_GUARDS.test(part) || reported.has(part)) continue;
        reported.add(part);
        add('SU-150', 'warn', 'Validate at the right moment', null, `errors styled with :invalid show before anyone types (${part.slice(0, SEM_SELECTOR_PREVIEW_CHARS)})`, 'Use :user-invalid, or [aria-invalid="true"] set after blur or submit');
      }
    }
  }

  function checkDisabledSubmit() {
    for (const form of ROOT.querySelectorAll('form')) {
      const submit = [...form.querySelectorAll(SEM_SUBMIT)].find((button) => isVisible(button) && (button.disabled || button.getAttribute('aria-disabled') === 'true'));
      if (!submit) continue;
      const emptyRequired = [...form.querySelectorAll('[required], [aria-required="true"]')]
        .some((field) => isVisible(field) && (/^(checkbox|radio)$/.test(field.type) ? !field.checked : !field.value));
      if (!emptyRequired) continue;
      const tall = form.getBoundingClientRect().height > innerHeight;
      add('SU-150', tall ? 'warn' : 'info', 'Validate at the right moment', submit,
        `submit is disabled while a required field is empty${tall ? ' (the form is taller than the screen, so the reason is off screen)' : ''}`,
        'Keep the button enabled and validate on submit, with an error summary and focus on the first problem');
    }
  }

  function checkInvalidMessages() {
    for (const field of ROOT.querySelectorAll('[aria-invalid="true"]')) {
      if (!isVisible(field)) continue;
      checked('invalid fields');
      const ids = [...semIdsOf(field, 'aria-errormessage'), ...semIdsOf(field, 'aria-describedby')];
      const linked = ids.map((id) => document.getElementById(id)).some((node) => node && semClean(node.textContent) && isVisible(node));
      if (!linked) add('SU-151', 'fail', 'Inline errors', field, 'field is marked aria-invalid but no visible error text is linked to it', 'Put the message next to the field and link it: aria-describedby="field-error"');
    }
  }

  REGISTERED = [...REGISTERED, ['invalid styling', checkInvalidStyling], ['disabled submit', checkDisabledSubmit], ['invalid messages', checkInvalidMessages]];

  // ---------- error states that explain and recover (SU-160) ----------
  const SEM_ERROR_CLASS = /\b(error|danger|alert-error|is-error)\b/i;
  const SEM_ERROR_MIN_CHARS = 20;
  const SEM_RECOVERY_CONTROL = 'a[href], button, [role=button], [role=link], input[type=button], input[type=submit]';
  const SEM_FIELD_WRAPPER_CLASS = /field|form-group|form-row|input/i;
  // Ids that field messages are wired to; those regions belong to SU-151, not to this check.
  const semDescribedIds = () => new Set([...document.querySelectorAll('[aria-describedby], [aria-errormessage]')]
    .flatMap((el) => [...semIdsOf(el, 'aria-describedby'), ...semIdsOf(el, 'aria-errormessage')]));
  // A message sitting right next to a field is that field's inline message even when it is not linked.
  const semBesideField = (el) => [el.previousElementSibling, el.nextElementSibling].some((sibling) => sibling && sibling.matches(`${TEXT_FIELD}, label`))
    || (!!el.parentElement && (el.parentElement.matches('label') || SEM_FIELD_WRAPPER_CLASS.test(el.parentElement.getAttribute('class') || '')));

  function checkErrorStates() {
    const described = semDescribedIds();
    const toasts = semToastLike();
    for (const toast of toasts) {
      if (semIsEnglish(toast) && SEM_ERROR_WORDS.test(semClean(toast.textContent))) add('SU-160', 'info', 'Errors explain and recover', toast, 'error shown in a toast disappears before it can be read or acted on', 'Show errors where the problem is (inline or a persistent banner) with a Retry, not in a toast');
    }
    const regions = [...ROOT.querySelectorAll('[role=alert], [class]')].slice(0, LIMITS.maxElements).filter((el) => {
      if (!el.matches('[role=alert]') && !SEM_ERROR_CLASS.test(el.getAttribute('class') || '')) return false;
      return !el.matches('svg, svg *, body, html') && isVisible(el) && !toasts.some((toast) => toast.contains(el) || el.contains(toast));
    });
    for (const region of regions.filter((el) => !regions.some((other) => other !== el && other.contains(el)))) {
      if (semClean(region.textContent).length < SEM_ERROR_MIN_CHARS || (region.id && described.has(region.id)) || semBesideField(region)) continue;
      checked('error regions');
      if (!region.querySelector(SEM_RECOVERY_CONTROL)) add('SU-160', 'warn', 'Errors explain and recover', region, 'error with no way to recover', 'Say what failed and what to do, and add the way forward: a Retry button, a link to the fix, or a contact route');
    }
  }

  REGISTERED = [...REGISTERED, ['error states', checkErrorStates]];

  // ---------- microcopy (SU-178, SU-179, SU-180, SU-181, SU-183, SU-184) ----------
  const SEM_DIALOGS = 'dialog, [role=dialog], [role=alertdialog]';
  const SEM_BUTTONS = 'button, [role=button], input[type=button], input[type=submit]';
  const SEM_VAGUE_DIALOG_BUTTON = /^(ok|okay|yes|no|submit|confirm|continue)$/i;
  const SEM_VAGUE_CONFIRM_TITLE = /^(are you sure\??|confirm)$/i;
  const SEM_GENERIC_ERROR = /^(error|invalid( input| value)?|something went wrong|an error (has )?occurred|this field is required|required|oops!?)[.!]?$/i;
  const SEM_ERROR_CODE = /^(error )?[A-Z0-9_-]{3,}$/i;
  const SEM_INSTRUCTION_PLACEHOLDER = /^(enter|type|input|fill in|please)\b/i;
  const SEM_PLACEHOLDER_CONTENT = /lorem ipsum|john doe|jane doe|foo@bar|example@example\.com/i;
  const SEM_PLACEHOLDER_CONTENT_ALL = new RegExp(SEM_PLACEHOLDER_CONTENT.source, 'gi');
  const SEM_TITLE_CASE_MIN_WORDS = 3;
  const SEM_TITLE_CASE_MIN_LONG_WORDS = 2;
  const SEM_LONG_WORD_LETTERS = 3;
  const SEM_TITLE_CASE_MAX_CHARS = 80;
  const semLetters = (word) => [...word].filter((char) => /\p{L}/u.test(char)).length;
  const semDialogs = () => [...new Set([...(ROOT.matches(SEM_DIALOGS) ? [ROOT] : []), ...ROOT.querySelectorAll(SEM_DIALOGS)])].filter(isVisible);
  const semButtonText = (el) => semClean(el.matches('input') ? el.value : el.innerText);
  const semStartsUpper = (word) => { const first = [...word].find((char) => /\p{L}/u.test(char)); return first !== first.toLowerCase() && first === first.toUpperCase(); };
  // "Create New Project Settings": every word of 3+ letters is capitalized and it is not an all-caps label.
  function semLooksTitleCased(text) {
    const words = text.split(/\s+/).filter((word) => semLetters(word) > 0);
    const long = words.filter((word) => semLetters(word) >= SEM_LONG_WORD_LETTERS);
    if (words.length < SEM_TITLE_CASE_MIN_WORDS || long.length < SEM_TITLE_CASE_MIN_LONG_WORDS || text === text.toUpperCase()) return false;
    return long.every(semStartsUpper);
  }
  const semIsGenericError = (text) => SEM_GENERIC_ERROR.test(text) || (SEM_ERROR_CODE.test(text) && /[0-9_]/.test(text));

  function checkButtonCopy() {
    const inDialog = new Set();
    for (const dialog of semDialogs()) {
      for (const button of dialog.querySelectorAll(SEM_BUTTONS)) {
        inDialog.add(button);
        if (isVisible(button) && semIsEnglish(button) && SEM_VAGUE_DIALOG_BUTTON.test(semButtonText(button))) add('SU-178', 'warn', 'Buttons name the outcome', button, `dialog button "${semButtonText(button)}" does not name the action`, 'Name the action: verb + object ("Delete project", "Keep editing")');
      }
    }
    for (const button of ROOT.querySelectorAll(SEM_BUTTONS)) {
      if (!inDialog.has(button) && isVisible(button) && semIsEnglish(button) && /^submit$/i.test(semButtonText(button))) add('SU-178', 'info', 'Buttons name the outcome', button, 'button says "Submit"', 'Name the outcome: "Send message", "Create account"');
    }
  }

  function checkHeadingAndButtonCase() {
    for (const el of ROOT.querySelectorAll(`h1, h2, h3, h4, h5, h6, [role=heading], ${SEM_BUTTONS}`)) {
      const text = semButtonText(el);
      if (text.length > SEM_TITLE_CASE_MAX_CHARS || !semLooksTitleCased(text) || !isVisible(el) || !semIsEnglish(el)) continue;
      add('SU-179', 'info', 'Sentence case', el, `"${text}" is in title case`, 'Use sentence case: capitalize the first word and proper nouns only');
    }
  }

  function checkErrorCopy() {
    const described = semDescribedIds();
    const messages = new Set([...ROOT.querySelectorAll('[role=alert], [aria-live]:not([aria-live=off])'), ...semToastLike(), ...[...described].map((id) => document.getElementById(id)).filter((node) => node && ROOT.contains(node))]);
    for (const el of messages) {
      const text = semClean(el.textContent);
      if (text && semIsGenericError(text) && isVisible(el) && semIsEnglish(el)) add('SU-180', 'warn', 'Error formula', el, `"${text.slice(0, 40)}" does not say what happened or how to fix it`, 'Say what happened and how to fix it: "Card declined. Check the number or try another card."');
    }
  }

  function checkConfirmTitles() {
    for (const dialog of semDialogs()) {
      const labelled = semIdsOf(dialog, 'aria-labelledby').map((id) => document.getElementById(id)).filter(Boolean)[0];
      const heading = labelled || dialog.querySelector('h1, h2, h3, [role=heading]');
      const title = heading ? semClean(heading.textContent) : '';
      if (semIsEnglish(dialog) && SEM_VAGUE_CONFIRM_TITLE.test(title)) add('SU-181', 'warn', 'Confirmation dialogs', dialog, `dialog title "${title}" does not name the action`, 'Ask about the specific action and object: "Delete project \'Atlas\'?"');
    }
  }

  function checkPlaceholderCopy() {
    for (const field of ROOT.querySelectorAll('input[placeholder], textarea[placeholder]')) {
      if (field.matches(TEXT_FIELD) && semIsEnglish(field) && SEM_INSTRUCTION_PLACEHOLDER.test(semClean(field.getAttribute('placeholder'))) && isVisible(field)) {
        add('SU-183', 'info', 'Plain language', field, 'placeholder reads as an instruction', 'Put instructions in the label or a hint; a placeholder holds an example ("maya@northstar.studio")');
      }
    }
    const walker = document.createTreeWalker(ROOT, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (SEM_PLACEHOLDER_CONTENT.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    for (let count = 0; walker.nextNode() && count < LIMITS.maxElements; count += 1) {
      const parent = walker.currentNode.parentElement;
      if (!parent || parent.closest('script, style, noscript, template, title') || !isVisible(parent)) continue;
      add('SU-184', 'info', 'Real content', parent, `placeholder content: ${[...new Set(walker.currentNode.nodeValue.match(SEM_PLACEHOLDER_CONTENT_ALL).map((found) => `"${found.toLowerCase()}"`))].join(', ')}`, 'Use plausible, varied names, numbers and dates; they also stress-test the layout');
    }
  }

  REGISTERED = [...REGISTERED, ['button copy', checkButtonCopy], ['heading case', checkHeadingAndButtonCase], ['error copy', checkErrorCopy], ['confirm titles', checkConfirmTitles], ['placeholder copy', checkPlaceholderCopy]];
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
  // ---------- Touch, hover and viewport units (SU-174, SU-175, SU-176, SU-177) ----------
  const LAYOUT_TOUCH = { maxViewport: 480, minFieldPx: 16, maxBottomItems: 5, bottomSlack: 2, barMaxShare: 0.5, maxHoverRules: 300, maxRevealTargets: 50 };
  const HOVER_FALLBACK_MEDIA = /hover:\s*none|pointer:\s*coarse/;
  const FOCUS_PSEUDO = /:focus(?:-visible|-within)?/g;

  const layoutShowsElement = (style) => (style.opacity !== '' && parseFloat(style.opacity) > 0)
    || style.visibility === 'visible' || (style.display !== '' && style.display !== 'none');
  const layoutHiddenAtRest = (el) => {
    const style = css(el);
    return style.opacity === '0' || style.visibility === 'hidden' || style.display === 'none';
  };
  const layoutInTouchMedia = (rule) => {
    for (let parent = rule.parentRule; parent; parent = parent.parentRule) {
      if (parent instanceof CSSMediaRule && HOVER_FALLBACK_MEDIA.test(parent.conditionText || parent.media.mediaText)) return true;
    }
    return false;
  };
  const layoutSelectorParts = (rule) => splitSelectorList(rule.selectorText || '').map((part) => part.trim()).filter(Boolean);

  // Rules that make an element visible without a mouse: under :focus*, or inside a touch/no-hover media query.
  function layoutHoverFallbacks(rules) {
    const fallbacks = [];
    for (const { rule } of rules) {
      if (!layoutShowsElement(rule.style)) continue;
      const touch = layoutInTouchMedia(rule);
      for (const part of layoutSelectorParts(rule)) {
        if (FOCUS_PSEUDO.test(part)) fallbacks.push(part.replace(FOCUS_PSEUDO, '').trim() || '*');
        else if (touch && !/:hover/.test(part)) fallbacks.push(part);
        FOCUS_PSEUDO.lastIndex = 0;
      }
    }
    return fallbacks;
  }
  function layoutMatchesAny(el, selectors) {
    return selectors.some((selector) => { try { return el.matches(selector); } catch { return false; } });
  }
  function checkHoverOnly({ rules }) {
    const fallbacks = layoutHoverFallbacks(rules);
    let examined = 0;
    for (const { rule } of rules) {
      if (!layoutShowsElement(rule.style)) continue;
      for (const part of layoutSelectorParts(rule).filter((p) => /:hover/.test(p))) {
        if (examined >= LAYOUT_TOUCH.maxHoverRules) return;
        examined += 1;
        const base = part.replace(/:hover/g, '').trim() || '*';
        let revealed = [];
        try { revealed = [...ROOT.querySelectorAll(base)].slice(0, LAYOUT_TOUCH.maxRevealTargets); } catch { continue; }
        for (const el of revealed) {
          if (!layoutHiddenAtRest(el)) continue;
          checked('hover reveals');
          if (layoutMatchesAny(el, fallbacks)) continue;
          add('SU-174', 'warn', 'No hover-only affordances', el, `revealed only on :hover (${part})`, 'Also reveal it on :focus-within and keep it always visible under @media (hover: none)');
        }
      }
    }
  }

  function checkTouchInputs() {
    if (innerWidth > LAYOUT_TOUCH.maxViewport) { skipped(`touch input checks: viewport is ${innerWidth}px (run again at 375px)`); return; }
    for (const field of ROOT.querySelectorAll(TEXT_FIELD)) {
      if (!isVisible(field)) continue;
      checked('touch text fields');
      const size = px(css(field).fontSize);
      if (size < LAYOUT_TOUCH.minFieldPx) add('SU-175', 'warn', 'Touch input', field, `${size}px field: iOS zooms the page when a field under 16px gets focus`, 'font-size: 16px (1rem) on text inputs, textareas and selects');
    }
    for (const el of ROOT.querySelectorAll('[draggable="true"]')) {
      if (isVisible(el)) add('SU-175', 'info', 'Touch input', el, 'dragging needs a single-pointer alternative (WCAG 2.5.7)', 'Offer a tap or click alternative: "Move up/down" buttons, a menu, or a number field');
    }
  }

  function checkViewportHeight({ rules }) {
    for (const { rule } of rules) {
      const prop = rule.style.height === '100vh' ? 'height' : rule.style.minHeight === '100vh' ? 'min-height' : null;
      if (prop) add('SU-176', 'info', 'Viewport units', null, `${rule.selectorText}: ${prop}: 100vh`, 'Use 100dvh (or 100svh) so mobile browser bars do not cut content');
    }
  }

  // A bottom bar that is a fixed/sticky strip (not a full-height drawer), or a fixed nav in the lower half.
  function checkBottomNavigation() {
    if (innerWidth > LAYOUT_TOUCH.maxViewport) { skipped(`bottom navigation: viewport is ${innerWidth}px (run again at 375px)`); return; }
    const flagged = [];
    for (const el of LAYOUT_ALL_ELEMENTS()) {
      if (flagged.some((bar) => bar.contains(el))) continue;
      const position = css(el).position;
      if (position !== 'fixed' && position !== 'sticky') continue;
      if (!isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      const strip = rect.bottom >= innerHeight - LAYOUT_TOUCH.bottomSlack && rect.height < innerHeight * LAYOUT_TOUCH.barMaxShare;
      const lowerNav = position === 'fixed' && el.matches('nav, [role=navigation], [role=tablist]') && rect.top > innerHeight * LAYOUT_TOUCH.barMaxShare;
      if (!strip && !lowerNav) continue;
      checked('bottom bars');
      const count = [...el.querySelectorAll(INTERACTIVE)].filter(isVisible).length;
      if (count <= LAYOUT_TOUCH.maxBottomItems) continue;
      flagged.push(el);
      add('SU-177', 'warn', 'Bottom navigation', el, `bottom navigation holds ${count} items`, 'Bottom navigation holds 3–5 destinations; move the rest into the page or a menu');
    }
  }
  REGISTERED = [...REGISTERED, ['hover-only reveals', (context) => checkHoverOnly(context)], ['touch inputs', () => checkTouchInputs()],
    ['viewport height', (context) => checkViewportHeight(context)], ['bottom navigation', () => checkBottomNavigation()]];
  // ---------- Performance-related UI (SU-192, SU-193, SU-194, SU-195, SU-196) ----------
  const LAYOUT_PERF = { heroMinArea: 40000, maxCssSizedChecks: 400 };
  const SPACE_PROPERTY = /^(width|height|min-width|min-height|max-width|max-height|top|left|right|bottom|inset(-.*)?|margin(-.*)?|padding(-.*)?)$/;
  const LOADER_SELECTOR = /spin|load|skeleton|progress|shimmer|pulse/i;
  const LENGTH = /^-?[\d.]+(px|rem|em)$/;

  // Space is reserved when attributes, an aspect-ratio (own or on a wrapper), absolute placement, or fixed px sizes say so.
  function layoutReservesSpace(el, rules) {
    if (el.hasAttribute('width') && el.hasAttribute('height')) return true;
    const style = css(el);
    if (style.aspectRatio !== 'auto' || /absolute|fixed/.test(style.position)) return true;
    if (el.style.width && el.style.height) return true;
    for (let parent = el.parentElement, depth = 0; parent && depth < 2; parent = parent.parentElement, depth += 1) {
      if (css(parent).aspectRatio !== 'auto') return true;
    }
    return rules.slice(0, LAYOUT_PERF.maxCssSizedChecks).some(({ rule }) => {
      if (!LENGTH.test(rule.style.width) || !LENGTH.test(rule.style.height)) return false;
      try { return el.matches(rule.selectorText); } catch { return false; }
    });
  }
  function checkUnsizedMedia({ rules }) {
    for (const el of ROOT.querySelectorAll('img, video, iframe')) {
      if (!isVisible(el)) continue;
      checked('media boxes');
      if (!layoutReservesSpace(el, rules)) add('SU-192', 'warn', 'Reserve space', el, 'no width/height attributes or aspect-ratio, so the page jumps when it loads', 'Reserve its space: width and height attributes (with height: auto in CSS) or aspect-ratio');
    }
  }

  function layoutFontFaces() {
    const faces = [];
    const walk = (list) => { for (const rule of list) { if (rule instanceof CSSFontFaceRule) faces.push(rule); else if (rule.cssRules) walk(rule.cssRules); } };
    for (const sheet of document.styleSheets) {
      try { walk(sheet.cssRules); } catch { /* cross-origin sheet */ }
    }
    return faces;
  }
  function checkFontDisplay() {
    for (const face of layoutFontFaces()) {
      checked('@font-face rules');
      if (face.style.getPropertyValue('font-display')) continue;
      add('SU-193', 'warn', 'Font loading', null, `@font-face ${face.style.getPropertyValue('font-family') || '(unnamed)'} has no font-display`, 'font-display: swap (body text) or optional, with a metric-matched fallback');
    }
  }

  // "First viewport" is measured in document coordinates: earlier checks scroll the page around.
  function checkHeroImage() {
    let hero = null;
    let heroArea = 0;
    for (const img of ROOT.querySelectorAll('img')) {
      if (!isVisible(img)) continue;
      const rect = img.getBoundingClientRect();
      if (rect.top + scrollY >= innerHeight || rect.bottom + scrollY <= 0) continue;
      if (rect.width * rect.height > heroArea) { hero = img; heroArea = rect.width * rect.height; }
    }
    if (!hero || heroArea < LAYOUT_PERF.heroMinArea) return;
    checked('hero image');
    if (hero.getAttribute('loading') === 'lazy') add('SU-194', 'warn', 'Hero image first', hero, 'the largest above-the-fold image is loading="lazy"', 'Do not lazy-load the hero image; add fetchpriority="high"');
  }

  function checkContentVisibility({ rules }) {
    const candidates = new Set([...ROOT.querySelectorAll('[style*="content-visibility"]')]);
    for (const { rule } of rules) {
      if (rule.style.contentVisibility !== 'auto') continue;
      try { ROOT.querySelectorAll(rule.selectorText).forEach((el) => candidates.add(el)); } catch { /* unmatched selector */ }
    }
    for (const el of candidates) {
      const style = css(el);
      if (style.contentVisibility !== 'auto') continue;
      checked('content-visibility: auto elements');
      if (!/\d/.test(style.containIntrinsicHeight)) add('SU-195', 'warn', 'Long pages stay light', el, 'content-visibility: auto without contain-intrinsic-size', 'Add contain-intrinsic-size: auto <estimated height>, or offscreen chunks collapse');
    }
  }

  function checkLayoutTransitions({ rules }) {
    for (const { rule, inReduced } of rules) {
      const selector = rule.selectorText || '';
      if (inReduced || LOADER_SELECTOR.test(selector)) continue;
      const properties = (rule.style.transitionProperty || '').split(',').map((p) => p.trim()).filter((p) => SPACE_PROPERTY.test(p));
      if (properties.length) add('SU-196', 'warn', 'Fast to respond', null, `${selector}: transitions ${properties.join(', ')}`, 'Animate transform and opacity, not layout properties');
    }
  }
  REGISTERED = [...REGISTERED, ['unsized media', (context) => checkUnsizedMedia(context)], ['font-display', () => checkFontDisplay()],
    ['hero image', () => checkHeroImage()], ['content-visibility', (context) => checkContentVisibility(context)], ['layout transitions', (context) => checkLayoutTransitions(context)]];
  // ---------- RTL, truncation and script typography (SU-197, SU-200, SU-201) ----------
  const LAYOUT_INTL = { clipSlack: 1, maxExamples: 3 };
  const ARABIC_SCRIPT_LANG = /^(ar|fa|ur)(-|$)/i;
  const PHYSICAL_PROPERTY = /^(margin|padding)-(left|right)$|^border-(left|right)(-(width|style|color))?$|^(left|right)$/;
  const PHYSICAL_VALUE_PROPERTY = /^(text-align|float|clear)$/;
  const ACTION_OR_ERROR = 'button, [role=button], [role=alert], label';

  function layoutPageIsRtl() {
    return !!document.querySelector('[dir=rtl]') || css(document.documentElement).direction === 'rtl' || css(document.body).direction === 'rtl';
  }
  // Declarations as written (cssText keeps shorthands), minus a left/right pair that is symmetric.
  function layoutPhysicalDeclarations(rule) {
    const declarations = (rule.style.cssText || '').split(';').map((d) => d.split(/:(.+)/).map((s) => (s || '').trim().toLowerCase())).filter(([name]) => name);
    const physical = declarations.filter(([name, value]) => PHYSICAL_PROPERTY.test(name) || (PHYSICAL_VALUE_PROPERTY.test(name) && /^(left|right)$/.test(value)));
    const sideless = (name) => name.replace(/left|right/, '*');
    return physical.filter(([name, value]) => !physical.some(([other, otherValue]) => other !== name && sideless(other) === sideless(name) && otherValue === value));
  }
  function checkPhysicalCss({ rules }) {
    if (!layoutPageIsRtl()) return;
    checked('RTL page: CSS direction scan');
    const found = [];
    for (const { rule } of rules) {
      const selector = rule.selectorText || '';
      if (/dir=|:dir\(|:lang\(/.test(selector)) continue;
      for (const [name] of layoutPhysicalDeclarations(rule)) found.push(`${selector} (${name})`);
    }
    if (!found.length) return;
    add('SU-197', 'warn', 'Direction-agnostic CSS', null, `${found.length} physical-direction declarations on an RTL page; use logical properties (margin-inline-start…)`,
      `margin-inline-start / padding-inline-end / inset-inline-start / text-align: start; e.g. ${found.slice(0, LAYOUT_INTL.maxExamples).join(', ')}`);
  }

  const layoutTruncated = (el, style) => (style.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + LAYOUT_INTL.clipSlack)
    || ((style.webkitLineClamp || 'none') !== 'none' && el.scrollHeight > el.clientHeight + LAYOUT_INTL.clipSlack);
  function checkTruncation() {
    for (const el of LAYOUT_ALL_ELEMENTS()) {
      if (el.matches('input, textarea, select')) continue;
      if (el.scrollWidth <= el.clientWidth + LAYOUT_INTL.clipSlack && el.scrollHeight <= el.clientHeight + LAYOUT_INTL.clipSlack) continue;
      if (!layoutTruncated(el, css(el)) || !isVisible(el)) continue;
      checked('truncated elements');
      if (el.closest(ACTION_OR_ERROR)) add('SU-200', 'fail', 'Truncation policy', el, 'never truncate actions or errors', 'Let buttons, labels and error messages wrap or grow; shorten the copy instead');
      else if (!el.closest('[title], [aria-label], [aria-describedby]')) add('SU-200', 'warn', 'Truncation policy', el, 'truncated text with no way to read it', 'Expose the full text (title, tooltip on focus, or an expand control), or wrap instead of truncating');
    }
  }

  function checkArabicLetterSpacing() {
    for (const el of LAYOUT_ALL_ELEMENTS()) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) continue;
      const region = el.closest('[lang]');
      if (!region || !ARABIC_SCRIPT_LANG.test(region.getAttribute('lang') || '') || !isVisible(el)) continue;
      checked('Arabic-script text elements');
      const spacing = css(el).letterSpacing;
      if (spacing !== 'normal' && px(spacing) !== 0) add('SU-201', 'warn', 'Script-aware typography', el, `letter-spacing ${spacing} breaks Arabic letter joining`, 'letter-spacing: normal on Arabic, Persian and Urdu text');
    }
  }
  REGISTERED = [...REGISTERED, ['physical CSS on RTL pages', (context) => checkPhysicalCss(context)], ['truncation', () => checkTruncation()], ['Arabic letter-spacing', () => checkArabicLetterSpacing()]];
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
  // ---------- theming: stylesheet scan and scheme coverage (SU-165, SU-166) ----------
  const THEMING_RULE_CAP = 30000;
  const DARK_SELECTOR = /\.dark(?![\w-])|\.dark-(?:mode|theme)\b|\.theme-dark|\.is-dark|\[data-(?:theme|mode|color-scheme|bs-theme)(?![^\]]*=\s*["']?light)/i;
  const THEME_ATTRIBUTES = ['data-theme', 'data-mode', 'data-color-scheme', 'data-bs-theme', 'class'];
  const ROOT_SELECTOR = /(^|[\s,>+~])(:root|html|body)(?![\w-])/;
  let themingScanCache = null;
  // Walks every same-origin rule once (media, supports, layers, nesting) and keeps its media conditions.
  function themingScan() {
    if (themingScanCache) return themingScanCache;
    const entries = [];
    const walk = (list, conditions, parentSelector) => {
      for (const rule of list) {
        if (entries.length >= THEMING_RULE_CAP) return;
        if (rule instanceof CSSStyleRule) {
          const own = rule.selectorText || '';
          const selector = !parentSelector ? own : (/&/.test(own) ? own.replace(/&/g, parentSelector) : `${parentSelector} ${own}`);
          entries.push({ rule, selector, conditions });
          if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules, conditions, selector);
        } else if (rule instanceof CSSMediaRule || (typeof CSSSupportsRule !== 'undefined' && rule instanceof CSSSupportsRule)) {
          walk(rule.cssRules, [...conditions, rule.conditionText || (rule.media && rule.media.mediaText) || ''], parentSelector);
        } else if (rule.cssRules) walk(rule.cssRules, conditions, parentSelector);
      }
    };
    for (const sheet of document.styleSheets) {
      try { walk(sheet.cssRules, [], ''); } catch { /* cross-origin sheet: collectRules already noted it */ }
    }
    if (entries.length >= THEMING_RULE_CAP) COVERAGE.capsHit.push(`theming checks read the first ${THEMING_RULE_CAP} CSS rules only`);
    const declaresScheme = entries.some(({ rule, selector }) => {
      const value = rule.style.getPropertyValue('color-scheme').trim();
      return !!value && value !== 'normal' && (ROOT_SELECTOR.test(selector) || DARK_SELECTOR.test(selector));
    });
    themingScanCache = {
      entries,
      declaresScheme,
      darkMedia: entries.some(({ conditions }) => /prefers-color-scheme:\s*dark/.test(conditions.join(' '))),
      darkSelector: entries.some(({ selector }) => DARK_SELECTOR.test(selector)),
      lightDark: entries.some(({ rule }) => /light-dark\(/.test(rule.cssText)),
    };
    return themingScanCache;
  }
  const hasDarkStyles = (scan) => scan.darkMedia || scan.darkSelector || scan.lightDark;
  // Which scheme this run is in: an explicit theme attribute or class wins, then color-scheme, then the OS preference.
  function currentScheme() {
    const attributes = [document.documentElement, document.body].filter(Boolean)
      .flatMap((el) => THEME_ATTRIBUTES.map((name) => el.getAttribute(name) || '')).join(' ');
    if (/dark/i.test(attributes)) return 'dark';
    if (/(^|[\s-])light/i.test(attributes)) return 'light';
    const scheme = css(document.documentElement).colorScheme || '';
    if (/\bdark\b/.test(scheme) && !/\blight\b/.test(scheme)) return 'dark';
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  REGISTERED = [...REGISTERED, ['theming schemes', () => {
    const scan = themingScan();
    const darkStylesFound = hasDarkStyles(scan);
    const current = currentScheme();
    COVERAGE.schemes = { current, darkStylesFound, toAudit: darkStylesFound ? [current === 'dark' ? 'light' : 'dark'] : [] };
    if (darkStylesFound) notes.push('Dark styles exist: re-run the audit in the other scheme (emulate prefers-color-scheme or set the theme attribute).');
  }]];

  // SU-166 · warn: dark styles exist but nothing sets color-scheme, so native controls and scrollbars stay light.
  REGISTERED = [...REGISTERED, ['color-scheme declared', () => {
    const scan = themingScan();
    if (!hasDarkStyles(scan)) return;
    checked('color-scheme');
    const computed = css(document.documentElement).colorScheme;
    const unset = !computed || computed === 'normal';
    if (!unset || scan.declaresScheme || document.querySelector('meta[name="color-scheme"]')) return;
    add('SU-166', 'warn', 'Scheme switching', null, ':root has dark styles but color-scheme is normal (no meta color-scheme either)',
      'Set :root { color-scheme: light dark } so form controls and scrollbars follow the theme');
  }]];
  // ---------- theming: dark surfaces and elevation (SU-164) ----------
  const DARK_PAGE_LUMINANCE = 0.05;
  const ELEVATED_MIN = { width: 120, height: 48 };
  const SHADOW_COLOR = /rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|\b[a-z]+(?=\s+-?\d)/gi;
  const ELEVATION_BLUR_PX = 4;
  const ELEVATION_OFFSET_PX = 2;
  // First non-transparent background of html, body, main; the page canvas guess only when all are transparent.
  function themingBase() {
    for (const el of [document.documentElement, document.body, document.querySelector('main')]) {
      if (!el) continue;
      const color = parseColor(css(el).backgroundColor);
      if (color.a > 0) return { color: over(color, pageCanvas()), el, authored: true };
    }
    return { color: pageCanvas(), el: null, authored: false };
  }
  // A shadow that reads as elevation: outer, and blurred or offset (not a 1px ring or border imitation).
  function hasElevationShadow(style) {
    if (!style.boxShadow || style.boxShadow === 'none') return false;
    return style.boxShadow.split(/,(?![^(]*\))/).some((shadow) => {
      if (/\binset\b/.test(shadow)) return false;
      const [, offsetY = 0, blur = 0] = (shadow.replace(SHADOW_COLOR, ' ').match(/-?[\d.]+px/g) || []).map(px);
      return blur >= ELEVATION_BLUR_PX || Math.abs(offsetY) >= ELEVATION_OFFSET_PX;
    });
  }
  function checkDarkSurfaces() {
    const base = themingBase();
    const baseLuminance = luminance(base.color);
    if (baseLuminance >= DARK_PAGE_LUMINANCE) return;
    checked('dark page');
    if (base.authored && base.color.r === 0 && base.color.g === 0 && base.color.b === 0 && css(base.el).backgroundColor !== 'rgba(0, 0, 0, 0)') {
      add('SU-164', 'warn', 'Dark surfaces', base.el, 'pure #000 base', 'Use a dark gray (~#121212–#1c1c1e) so raised surfaces can get lighter');
    }
    for (const el of [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements)) {
      if (el === base.el || el.matches(INTERACTIVE) || !hasElevationShadow(css(el))) continue;
      const background = parseColor(css(el).backgroundColor);
      if (background.a < 0.5 || !isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < ELEVATED_MIN.width || rect.height < ELEVATED_MIN.height) continue;
      const surface = over(background, base.color);
      if (luminance(surface) > baseLuminance) continue;
      add('SU-164', 'warn', 'Dark surfaces', el, `raised surface ${hex(surface)} is not lighter than the ${hex(base.color)} base`,
        'Elevation in dark is a lighter surface (+0.03–0.05 L per level); shadows barely show on dark');
    }
  }
  REGISTERED = [...REGISTERED, ['dark surfaces', checkDarkSurfaces]];
  // ---------- theming: forced colors and translucency (SU-168, SU-169) ----------
  const FOCUS_PART = /:focus(-visible|-within)?(?![\w-])/;
  // SU-168 · warn: focus drawn only with box-shadow vanishes in forced colors (shadows become none).
  const GENERIC_FOCUS = /^(\*|html|body|:root)?\s*:focus(-visible|-within)?$/;
  const squash = (selector) => selector.replace(/\s+/g, ' ').trim();
  const isForcedColors = ({ conditions }) => conditions.some((condition) => /forced-colors/.test(condition));
  const restoresOutline = ({ rule }) => !removesOutline(rule.style) && (!!rule.style.outlineStyle || !!rule.style.outline);
  function checkForcedColorsFocus() {
    const { entries } = themingScan();
    const restored = new Set(entries.filter((e) => isForcedColors(e) && FOCUS_PART.test(e.selector) && restoresOutline(e)).map((e) => squash(e.selector)));
    const restoredEverywhere = [...restored].some((selector) => GENERIC_FOCUS.test(selector));
    for (const entry of entries) {
      const { rule, selector } = entry;
      if (isForcedColors(entry) || !FOCUS_PART.test(selector) || /:not\(\s*:focus/.test(selector)) continue;
      checked('focus rules (forced colors)');
      const style = rule.style;
      if (!removesOutline(style) || !style.boxShadow || style.boxShadow === 'none') continue;
      if (restoredEverywhere || restored.has(squash(selector))) continue;
      add('SU-168', 'warn', 'Forced colors', null, `${selector}: focus drawn only with box-shadow`,
        'Use outline (2px solid; transparent still shows in forced colors) instead of, or beside, box-shadow');
    }
  }
  REGISTERED = [...REGISTERED, ['forced-colors focus', checkForcedColorsFocus]];

  // SU-169 · info: a blurred translucent surface carrying text needs a solid fallback.
  function checkTranslucentSurfaces() {
    for (const el of [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements)) {
      const style = css(el);
      const filter = style.backdropFilter || style.webkitBackdropFilter;
      if (!filter || filter === 'none' || !el.textContent.trim() || !isVisible(el)) continue;
      checked('translucent surfaces');
      add('SU-169', 'info', 'Translucency', el, `backdrop-filter: ${filter.slice(0, 40)}`,
        'Translucent surface: check text against the worst backdrop and provide a solid fallback (prefers-reduced-transparency, forced colors)');
    }
  }
  REGISTERED = [...REGISTERED, ['translucent surfaces', checkTranslucentSurfaces]];
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
  // ---------- run ----------
  if (!innerWidth || !innerHeight) {
    const error = 'The viewport is 0×0 (hidden or background browser pane), so nothing can be measured. Set a viewport size (e.g. 1280×900) or show the page, reload, and run again.';
    window.__shibroAuditResult = { tool: 'shibroUI audit', version: VERSION, error };
    return window.__shibroAuditResult;
  }
  function runAudit() {
    const started = performance.now();
    // Measure the resting state: an entrance fade caught mid-flight (or frozen in a background tab) would
    // make whole panels look invisible. Finite running animations are fast-forwarded to their end.
    const running = document.getAnimations ? document.getAnimations().filter((a) => {
      const timing = a.effect && a.effect.getComputedTiming();
      return a.playState !== 'finished' && a.playState !== 'idle' && timing && Number.isFinite(timing.endTime);
    }) : [];
    running.forEach((a) => { try { a.finish(); } catch { /* infinite or detached animation */ } });
    if (running.length) notes.push(`${running.length} running animation(s) were finished first so the resting state was measured.`);
    if (OPTIONS.band && !OPTIONS.root) {
      const bands = pageBands();
      const band = bands[OPTIONS.band - 1];
      if (band) { ROOT = band.el; notes.push(`Scoped to band ${OPTIONS.band} of ${bands.length} (${path(band.el)}), as page-map.js numbers them.`); }
      else notes.push(`There is no band ${OPTIONS.band} (the page has ${bands.length}), so the whole page was audited.`);
    }
    const OPEN_MODAL = OPTIONS.root ? null : findOpenModal();
    if (OPEN_MODAL) {
      ROOT = OPEN_MODAL;
      notes.push('A modal is open, so only its contents were audited (the page behind it is inert).');
    }
    const scroll = [scrollX, scrollY];
    const previouslyFocused = document.activeElement;
    const sheetInfo = collectRules();
    const targets = targetsList();
    const checks = [
      ['text contrast', checkTextContrast], ['fields', checkFields], ['targets', () => checkTargets(targets)],
      ['focus', () => checkFocus(targets, sheetInfo.rules)], ['tables', checkTables], ['control heights', () => checkControlHeights(targets)],
      ['radius', checkRadius], ['reading', checkReading], ['links', checkLinks], ['choices', checkChoices], ['misc', checkMisc], ['centering', checkCentering], ['motion', () => checkMotion(sheetInfo)],
    ];
    const checkContext = { targets, rules: sheetInfo.rules, keyframes: sheetInfo.keyframes, reduced: sheetInfo.reduced };
    const allChecks = [...checks, ...REGISTERED.map(([name, check]) => [name, () => check(checkContext)])];
    for (const [name, check] of allChecks) {
      try { check(); } catch (error) { notes.push(`Check "${name}" errored: ${error.message}`); }
    }
    scrollTo(scroll[0], scroll[1]);
    innerScrolls.forEach(([left, top], node) => node.scrollTo(left, top));
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus({ preventScroll: true });

    let unseen = null;
    try { unseen = unseenContent(); } catch (error) { notes.push(`Unseen-content scan errored: ${error.message}`); }
    const totalElements = ROOT.querySelectorAll('*').length;
    if (totalElements > LIMITS.maxElements) COVERAGE.capsHit.push(`element walks stopped at ${LIMITS.maxElements} of ${totalElements} elements; scope with window.__shibroAudit = { root } or { band } and run per region`);
    const order = { fail: 0, warn: 1, info: 2 };
    const list = foldRootCauses([...findings.values()])
      .sort((a, b) => order[a.level] - order[b.level] || parseInt(a.id.slice(3), 10) - parseInt(b.id.slice(3), 10))
      .map(finalizeFinding);
    const sampled = list.filter((f) => f.instancesSampled).length;
    if (sampled) COVERAGE.capsHit.push(`${sampled} finding(s) list a sample of ${LIMITS.maxInstances} instances (see count): fix the pattern, not just the listed ones`);
    const summary = list.reduce((acc, f) => ({ ...acc, [f.level]: acc[f.level] + 1 }), { fail: 0, warn: 0, info: 0 });
    const byRule = list.reduce((acc, f) => ({ ...acc, [f.id]: (acc[f.id] || 0) + f.count }), {});
    let states = [];
    try { states = hiddenStates(); } catch (error) { notes.push(`Hidden-state scan errored: ${error.message}`); }
    if (list.length > OPTIONS.maxFindings) COVERAGE.capsHit.push(`${list.length - OPTIONS.maxFindings} findings beyond maxFindings were cut; raise window.__shibroAudit.maxFindings or scope by region`);
    const prepared = PREPARED ? { ...PREPARED, hiddenInFirstViewport: PREPARED.hiddenInFirstViewport.map(path) } : null;
    const report = {
      tool: 'shibroUI audit', version: VERSION, url: location.href, viewport: `${innerWidth}×${innerHeight}`,
      summary: { ...summary, instances: list.reduce((sum, f) => sum + f.count, 0), byRule },
      findings: list.slice(0, OPTIONS.maxFindings), truncated: list.length > OPTIONS.maxFindings,
      coverage: { ...COVERAGE, hiddenStates: states, unseen, prepared },
      notes: [...notes,
        states.length ? `${states.length} hidden state(s) were not audited (coverage.hiddenStates): open each one and run the audit again.` : 'No hidden states detected.',
        'Fix every instance listed in findings[].instances, not just the first. A rootCause finding is one fix for all of its groups.',
        'Layout, hierarchy and visual-system problems are page-map.js territory (references/composition.md).'],
      ms: Math.round(performance.now() - started) + (PREPARED ? PREPARED.ms : 0),
    };
    // Also exposed for tools that load the file with a <script> tag instead of evaluating it.
    window.__shibroAuditResult = report;
    return report;
  }
  // prepare: scroll the page once first (scroll reveals, lazy sections); the result is then a Promise.
  return OPTIONS.prepare ? prepareSweep().then(runAudit) : runAudit();
})()
