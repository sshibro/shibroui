// shibroUI page map: evaluate this whole file in a rendered page; it returns a JSON map of the screen:
// a text wireframe of its regions, what reads first, loud buttons per region, the heading outline, the
// visual system in use (sizes, colors, radii, shadows, spacing), alignment, row and rhythm problems,
// card nesting, and hidden states still to review. It backs the screen-level rules SU-119–SU-136.
// It is one expression, like audit.js: run the contents as-is, or Playwright browser_evaluate(() => <contents>),
// or load it: node scripts/serve.mjs, then await fetch('http://127.0.0.1:4399/page-map.js').then((r) => r.text()).then((s) => (0, eval)(s)).
// Options: window.__shibroPageMap = { root: 'main', prepare: true, bands: true, cols: 96, maxRows: 70 } before running.
// `prepare: true` scrolls the page once first (scroll reveals, lazy sections) and makes the result a Promise.
// On pages of 3+ screens it also returns `bands` (one entry per top-level block) and `outline`.
(() => {
  const VERSION = '0.5.0';
  const OPTIONS = { root: null, prepare: false, bands: 'auto', bandCols: 64, bandRows: 16, cols: 96, maxRows: 70, ...(window.__shibroPageMap || {}) };
  if (!innerWidth || !innerHeight) {
    const error = 'The viewport is 0×0 (hidden or background browser pane), so the layout cannot be measured. Set a viewport size (e.g. 1280×900), reload, and run again.';
    window.__shibroPageMapResult = { tool: 'shibroUI page map', version: VERSION, error };
    return window.__shibroPageMapResult;
  }
  const ROOT = (OPTIONS.root && document.querySelector(OPTIONS.root)) || document.body;
  const LIMITS = {
    maxElements: 6000, fontSizes: 6, weights: 3, families: 2, textColors: 8, radii: 4, shadows: 5,
    spacingValues: 12, nearSize: 1, nearColor: 0.03, nearBackground: 0.012, nearRadius: 2, edgeNearMiss: 3, rowTopMiss: 8,
    rowHeightMiss: 12, rhythmSpread: 12, loudStyles: 4, peerTier: 0.8, loudTier: 0.5, loudButtonContrast: 2.5,
    accentChroma: 0.08, accentShare: 0.15, accentHues: 3, accentMinArea: 4000, maxRegions: 36,
  };
  const SCALE = [0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 96, 112, 128, 160];
  // Browser default block margins of headings, in em of the heading's own font size (h4 at 16px → 21.28px).
  const DEFAULT_HEADING_MARGIN_EM = { H1: 0.67, H2: 0.83, H3: 1, H4: 1.33, H5: 1.67, H6: 2.33 };
  const INTERACTIVE = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [tabindex]:not([tabindex="-1"])';
  const CONTROL = 'button, input, select, textarea, [role=button], [role=checkbox], [role=radio], [role=switch], option, label';
  const flags = [];
  const styleCache = new Map();
  const css = (el) => { if (!styleCache.has(el)) styleCache.set(el, getComputedStyle(el)); return styleCache.get(el); };
  const px = (value) => parseFloat(value) || 0;
  const round = (value, step = 1) => Math.round(value / step) * step;
  const flag = (id, level, rule, detail, elements = []) => flags.push({ id, level, rule, detail, elements: elements.slice(0, 6).map(path) });

