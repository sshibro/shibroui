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

  // ---------- element helpers ----------
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
  const snippet = (el, length = 32) => (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, length);
  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const s = css(node);
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
    }
    return true;
  }
  const pageRect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('').trim();

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
      const p = match[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
      color = { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    } else {
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      color = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    }
    colorCache.set(value, color);
    return color;
  }
  const hex = (c) => `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}${c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : ''}`;
  const over = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
  const linear = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const luminance = (c) => 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
  const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  function oklab(c) {
    const [r, g, b] = [linear(c.r), linear(c.g), linear(c.b)];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return { L, A, B, C: Math.hypot(A, B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
  }
  const labDistance = (a, b) => { const [p, q] = [oklab(a), oklab(b)]; return Math.hypot(p.L - q.L, p.A - q.A, p.B - q.B); };
  function backdrop(el) {
    const layers = [];
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const s = css(node);
      const stops = (s.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(parseColor);
      if (stops.length) {
        const avg = stops.reduce((acc, c) => ({ r: acc.r + c.r / stops.length, g: acc.g + c.g / stops.length, b: acc.b + c.b / stops.length, a: 1 }), { r: 0, g: 0, b: 0, a: 1 });
        layers.push(avg);
        break;
      }
      const bg = parseColor(s.backgroundColor);
      if (bg.a > 0) { layers.push(bg); if (bg.a >= 0.999) break; }
    }
    return layers.reduceRight((acc, layer) => over(layer, acc), { r: 255, g: 255, b: 255, a: 1 });
  }
  const hasBoundary = (el) => {
    const s = css(el);
    const border = ['Top', 'Right', 'Bottom', 'Left'].some((side) => px(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none' && parseColor(s[`border${side}Color`]).a > 0);
    const fill = parseColor(s.backgroundColor);
    const differs = fill.a > 0.05 && el.parentElement && labDistance(over(fill, backdrop(el.parentElement)), backdrop(el.parentElement)) > 0.01;
    return differs || border || s.boxShadow !== 'none' || (s.backgroundImage !== 'none' && !/url\(/.test(s.backgroundImage));
  };
  const isSurface = (el) => {
    if (/^(HTML|BODY)$/.test(el.tagName) || el.matches(CONTROL) || !hasBoundary(el)) return false;
    const r = el.getBoundingClientRect();
    return r.height >= 48 && r.width >= 120;
  };

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

  // ---------- hierarchy (SU-119, SU-120, SU-121, SU-131) ----------
  // Text grouped by style and ranked by visual weight, loudest first (used page-wide and per band).
  function textGroups(owners) {
    const groups = new Map();
    for (const el of owners) {
      const s = css(el);
      const size = px(s.fontSize);
      const weight = px(s.fontWeight) || 400;
      const fg = parseColor(s.color);
      const bg = backdrop(el);
      // Salience: how far the text stands from its surface (lightness and chroma), and a saturated
      // surface (a colored tile or banner) reads loud on its own even when its text is low-contrast.
      const textSalience = Math.min(1, labDistance(over(fg, bg), bg) / 0.5);
      const surfaceSalience = oklab(bg).C >= LIMITS.accentChroma ? 0.9 : 0;
      const score = size * size * (0.75 + 0.25 * (weight / 400)) * Math.max(0.15, textSalience, surfaceSalience);
      const key = `${round(size, 0.5)}px/${weight}/${hex(fg)}${s.textTransform === 'uppercase' ? '/caps' : ''}`;
      const group = groups.get(key) || { style: key, score: 0, count: 0, samples: [], elements: [] };
      groups.set(key, { ...group, score: Math.max(group.score, score), count: group.count + 1,
        samples: group.samples.length < 3 ? [...group.samples, ownText(el).slice(0, 28)] : group.samples, elements: [...group.elements, el] });
    }
    return [...groups.values()].sort((a, b) => b.score - a.score);
  }
  // Filled, high-contrast buttons and links: the loud ones (SU-121, SU-208).
  function loudButtonList() {
    const list = [];
    for (const el of elements.filter((e) => e.matches('button, [role=button], input[type=submit], input[type=button], a[href]'))) {
      const s = css(el);
      const fill = parseColor(s.backgroundColor);
      const box = pageRect(el);
      if (fill.a < 0.8 || !el.parentElement || box.y + box.h <= 0 || box.x + box.w <= 0) continue; // off-screen (e.g. an unfocused skip link)
      if (ratio(over(fill, backdrop(el.parentElement)), backdrop(el.parentElement)) < LIMITS.loudButtonContrast) continue;
      const region = el.closest('section, article, form, aside, header, nav, dialog, [role=region], [role=dialog], main') || document.body;
      list.push({ el, label: snippet(el, 24), region });
    }
    return list;
  }
  function hierarchy() {
    const ranked = textGroups(textOwners);
    const top = ranked[0];
    if (!top) return { tiers: [] };
    const peers = ranked.filter((g) => g.score >= top.score * LIMITS.peerTier);
    const loud = ranked.filter((g) => g.score >= top.score * LIMITS.loudTier);
    if (peers.length > 1) flag('SU-119', 'warn', 'One focal point', `${peers.length} different styles compete for first read: ${peers.map((g) => `${g.style} "${g.samples[0]}"`).join(' · ')}`, peers.map((g) => g.elements[0]));
    if (loud.length >= LIMITS.loudStyles) flag('SU-131', 'warn', 'Three tiers', `${loud.length} distinct loud styles (within 50% of the top weight); aim for one loud tier, one strong tier, the rest quiet`, loud.map((g) => g.elements[0]));
    if (top.count > 6) flag('SU-131', 'info', 'Three tiers', `${top.count} elements share the loudest style (${top.style}); that many equal peers dilute the focal point`, top.elements);

    const loudButtons = loudButtonList();
    const byRegion = new Map();
    for (const b of loudButtons) byRegion.set(b.region, [...(byRegion.get(b.region) || []), b]);
    const regionSummary = [...byRegion.entries()].map(([region, list]) => ({ region: path(region), labels: [...new Set(list.map((b) => b.label))] }));
    for (const entry of regionSummary) {
      if (entry.labels.length > 1) flag('SU-121', 'warn', 'One primary action per view', `${entry.labels.length} loud (filled, high-contrast) buttons in ${entry.region}: ${entry.labels.join(', ')}`, loudButtons.filter((b) => path(b.region) === entry.region).map((b) => b.el));
    }
    const firstScreen = loudButtons.filter((b) => pageRect(b.el).y < innerHeight);
    const firstLabels = [...new Set(firstScreen.map((b) => b.label))];
    if (firstLabels.length > 2) flag('SU-121', 'warn', 'One primary action per view', `${firstLabels.length} loud buttons in the first screen: ${firstLabels.join(', ')}`, firstScreen.map((b) => b.el));
    if (loudButtons.length && !firstScreen.length) flag('SU-120', 'info', 'Reading order', 'no loud (primary-looking) action in the first screen; the primary action sits below the fold', [loudButtons[0].el]);
    const focal = top.elements[0];
    const focalY = pageRect(focal).y;
    if (focalY > innerHeight) flag('SU-120', 'warn', 'Reading order', `the first read ("${top.samples[0]}") starts ${Math.round(focalY)}px down, below the first screen`, [focal]);

    return {
      firstRead: { style: top.style, text: top.samples[0], element: path(focal), y: Math.round(focalY) },
      tiers: ranked.slice(0, 8).map((g) => ({ style: g.style, relativeWeight: Math.round((g.score / top.score) * 100) / 100, count: g.count, samples: g.samples })),
      loudButtons: regionSummary,
    };
  }

  // ---------- headings (SU-129) ----------
  function headings() {
    const list = [...ROOT.querySelectorAll('h1, h2, h3, h4, h5, h6, [role=heading]')].filter(isVisible).map((el) => ({
      el, level: el.getAttribute('aria-level') ? parseInt(el.getAttribute('aria-level'), 10) : parseInt(el.tagName.slice(1), 10) || 2, size: px(css(el).fontSize),
    }));
    const outline = list.map((h) => `h${h.level} ${Math.round(h.size)}px "${snippet(h.el, 40)}"`);
    const h1s = list.filter((h) => h.level === 1);
    if (h1s.length !== 1) flag('SU-129', 'warn', 'Heading outline', `${h1s.length} h1 elements (want exactly one)`, h1s.map((h) => h.el));
    list.forEach((h, i) => {
      const previous = list[i - 1];
      if (previous && h.level > previous.level + 1) flag('SU-129', 'warn', 'Heading outline', `h${previous.level} → h${h.level} skips a level ("${snippet(h.el, 30)}")`, [h.el]);
      const shallower = list.filter((other) => other.level < h.level);
      const biggest = Math.max(0, ...shallower.map((o) => o.size));
      if (shallower.length && h.size > biggest + 0.5) flag('SU-129', 'warn', 'Heading outline', `h${h.level} "${snippet(h.el, 30)}" renders at ${h.size}px, larger than every shallower heading (max ${biggest}px)`, [h.el]);
    });
    const untitled = surfaces.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width * r.height < 20000 || el.closest('nav, header, footer')) return false;
      const rich = el.querySelectorAll(INTERACTIVE).length >= 3 || el.textContent.trim().length >= 160;
      const titled = el.querySelector('h1, h2, h3, h4, h5, h6, [role=heading], legend, caption') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      const nestedSurface = surfaces.some((other) => other !== el && el.contains(other) && other.querySelector('h1, h2, h3, h4, h5, h6'));
      return rich && !titled && !nestedSurface;
    });
    if (untitled.length) flag('SU-129', 'info', 'Heading outline', `${untitled.length} content group(s) without a heading`, untitled);
    return { outline };
  }

  // ---------- visual system (SU-125, SU-126, SU-127, SU-128) ----------
  // The heading whose untouched browser default margin on `side` produced this gap between stacked blocks.
  function defaultMarginHeading(el, side, gap) {
    const em = DEFAULT_HEADING_MARGIN_EM[el.tagName];
    if (!em) return null;
    const margin = px(css(el)[`margin${side}`]);
    return Math.abs(margin - em * px(css(el).fontSize)) < 0.5 && Math.abs(margin - gap) <= 1 ? el : null;
  }
  const tally = (values) => [...values.reduce((map, v) => map.set(v, (map.get(v) || 0) + 1), new Map()).entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
  const nearPairs = (list, distance, threshold) => {
    const pairs = [];
    for (let i = 0; i < list.length; i += 1) for (let j = i + 1; j < list.length; j += 1) {
      const d = distance(list[i], list[j]);
      if (d > 0 && d <= threshold) pairs.push(`${list[i]} ≈ ${list[j]}`);
    }
    return pairs.slice(0, 10);
  };
  function system() {
    const fontSizes = tally(textOwners.map((el) => round(px(css(el).fontSize), 0.5)));
    const fontWeights = tally(textOwners.map((el) => px(css(el).fontWeight) || 400));
    const fontFamilies = tally(textOwners.map((el) => css(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase()));
    const textColors = tally(textOwners.map((el) => hex(parseColor(css(el).color))));
    // Translucent fills are tallied as seen, composited over their backdrop: a header at 82% of the page color
    // is that page color, not a near-duplicate of it (and #rrggbbaa can't round-trip through the canvas exactly).
    const backgrounds = tally(elements.map((el) => ({ el, fill: parseColor(css(el).backgroundColor) })).filter(({ fill }) => fill.a > 0.05)
      .map(({ el, fill }) => hex(fill.a >= 0.999 || !el.parentElement ? fill : over(fill, backdrop(el.parentElement)))));
    const borderColors = tally(elements.filter((el) => px(css(el).borderTopWidth) > 0 || px(css(el).borderBottomWidth) > 0)
      .map((el) => hex(parseColor(px(css(el).borderTopWidth) > 0 ? css(el).borderTopColor : css(el).borderBottomColor))));
    const radiusValues = [];
    for (const el of elements.filter((e) => hasBoundary(e) || /^(IMG|VIDEO)$/.test(e.tagName))) {
      const raw = css(el).borderTopLeftRadius;
      const r = el.getBoundingClientRect();
      const value = raw.includes('%') ? (px(raw) / 100) * r.width : px(raw);
      if (value <= 0) continue;
      radiusValues.push(value >= Math.min(r.width, r.height) / 2 - 1 ? 'pill' : round(value));
    }
    const radii = tally(radiusValues);
    const shadows = tally(elements.map((el) => css(el).boxShadow).filter((s) => s && s !== 'none'));
    const spacingValues = [];
    const defaultMargins = [];
    for (const el of elements) {
      const s = css(el);
      if (hasBoundary(el)) ['Top', 'Right', 'Bottom', 'Left'].forEach((side) => { const v = round(px(s[`padding${side}`])); if (v > 0) spacingValues.push(v); });
      if (/flex|grid/.test(s.display) && el.children.length > 1) [s.rowGap, s.columnGap].forEach((g) => { const v = round(px(g)); if (v > 0) spacingValues.push(v); });
      if (!/flex|grid/.test(s.display)) {
        const kids = [...el.children].filter((c) => isVisible(c) && /block|flex|grid|table|list-item/.test(css(c).display) && css(c).position !== 'absolute' && css(c).position !== 'fixed');
        for (let i = 1; i < kids.length; i += 1) {
          const gap = round(kids[i].getBoundingClientRect().top - kids[i - 1].getBoundingClientRect().bottom);
          if (gap <= 0) continue;
          spacingValues.push(gap);
          const heading = defaultMarginHeading(kids[i - 1], 'Bottom', gap) || defaultMarginHeading(kids[i], 'Top', gap);
          if (heading) defaultMargins.push({ gap, heading });
        }
      }
    }
    const spacing = tally(spacingValues);
    const offScale = spacing.filter(({ value }) => !SCALE.some((step) => Math.abs(step - value) <= 0.75)).map((entry) => {
      const tags = [...new Set(defaultMargins.filter((d) => d.gap === entry.value).map((d) => d.heading.tagName.toLowerCase()))];
      return tags.length ? { ...entry, defaultMarginOn: tags } : entry;
    });
    const offScaleDefaults = [...new Set(defaultMargins.filter((d) => offScale.some((entry) => entry.value === d.gap)).map((d) => d.heading))];

    const sizeList = fontSizes.map((f) => f.value).sort((a, b) => a - b);
    if (fontSizes.length > LIMITS.fontSizes) flag('SU-126', 'warn', 'Type budget', `${fontSizes.length} font sizes in use (${sizeList.join(', ')}px); aim for ≤ ${LIMITS.fontSizes}`);
    const nearSizes = nearPairs(sizeList, (a, b) => Math.abs(a - b), LIMITS.nearSize);
    if (nearSizes.length) flag('SU-126', 'warn', 'Type budget', `near-duplicate font sizes: ${nearSizes.join(', ')}`);
    if (fontWeights.length > LIMITS.weights) flag('SU-126', 'warn', 'Type budget', `${fontWeights.length} font weights (${fontWeights.map((w) => w.value).join(', ')}); aim for ≤ ${LIMITS.weights}`);
    if (fontFamilies.length > LIMITS.families) flag('SU-126', 'warn', 'Type budget', `${fontFamilies.length} font families (${fontFamilies.map((f) => f.value).join(', ')}); aim for ≤ ${LIMITS.families}`);
    if (textColors.length > LIMITS.textColors) flag('SU-127', 'warn', 'Color budget', `${textColors.length} text colors in use; aim for ≤ ${LIMITS.textColors} (2–3 neutrals, inverse, accent, a few semantic)`);
    const nearText = nearPairs(textColors.map((c) => c.value), (a, b) => labDistance(parseColor(a), parseColor(b)), LIMITS.nearColor);
    // Surfaces legitimately step in small increments (page → card → field), so only near-identical fills count.
    const nearBg = nearPairs(backgrounds.map((c) => c.value), (a, b) => labDistance(parseColor(a), parseColor(b)), LIMITS.nearBackground);
    if (nearText.length) flag('SU-127', 'warn', 'Color budget', `near-duplicate text colors: ${nearText.join(', ')}`);
    if (nearBg.length) flag('SU-127', 'warn', 'Color budget', `near-duplicate background colors: ${nearBg.join(', ')}`);
    const numericRadii = radii.filter((r) => r.value !== 'pill');
    if (numericRadii.length > LIMITS.radii) flag('SU-128', 'warn', 'Shape budget', `${numericRadii.length} corner radii (${numericRadii.map((r) => `${r.value}px`).join(', ')}) plus pills; aim for ≤ ${LIMITS.radii}`);
    const nearRadii = nearPairs(numericRadii.map((r) => r.value).sort((a, b) => a - b), (a, b) => Math.abs(a - b), LIMITS.nearRadius);
    if (nearRadii.length) flag('SU-128', 'warn', 'Shape budget', `near-duplicate radii: ${nearRadii.join(', ')}`);
    if (shadows.length > LIMITS.shadows) flag('SU-128', 'warn', 'Shape budget', `${shadows.length} different shadows; use your elevation levels only`);
    if (offScale.length) {
      const values = offScale.slice(0, 12).map((s) => `${s.value}px×${s.count}${s.defaultMarginOn ? ` (browser default margin on ${s.defaultMarginOn.join(', ')})` : ''}`);
      const hint = offScaleDefaults.length ? '; set heading margins yourself (e.g. h1–h6 { margin: 0 }) and space them with scale steps' : '';
      flag('SU-125', 'warn', 'Spacing scale', `off-scale spacing values: ${values.join(', ')}${hint}`, offScaleDefaults);
    }
    if (spacing.length > LIMITS.spacingValues) flag('SU-125', 'info', 'Spacing scale', `${spacing.length} distinct spacing values in use`);

    const saturated = elements.filter((el) => {
      const fill = parseColor(css(el).backgroundColor);
      const r = el.getBoundingClientRect();
      return fill.a >= 0.5 && r.width * r.height >= LIMITS.accentMinArea && oklab(fill).C >= LIMITS.accentChroma;
    });
    const accentArea = saturated.filter((el) => !saturated.some((o) => o !== el && o.contains(el))).reduce((sum, el) => { const r = el.getBoundingClientRect(); return sum + r.width * r.height; }, 0);
    const hues = [...new Set(saturated.map((el) => Math.round(oklab(parseColor(css(el).backgroundColor)).h / 30) % 12))];
    const accentShare = accentArea / (docWidth * docHeight);
    if (hues.length > LIMITS.accentHues) flag('SU-127', 'warn', 'Color budget', `${hues.length} different saturated hues on large surfaces ("rainbow"); keep one accent and use semantic colors only for status`, saturated);
    if (accentShare > LIMITS.accentShare) flag('SU-127', 'warn', 'Color budget', `saturated surfaces cover ${Math.round(accentShare * 100)}% of the page`, saturated);

    return { fontSizes, fontWeights, fontFamilies, textColors, backgrounds: backgrounds.slice(0, 16), borderColors: borderColors.slice(0, 10), radii, shadows: shadows.map((s) => ({ ...s, value: s.value.slice(0, 80) })), spacing: spacing.slice(0, 24), offScale, accent: { hues: hues.length, share: Math.round(accentShare * 100) / 100 } };
  }

  // ---------- alignment, rows, rhythm, nesting (SU-124, SU-125, SU-130, SU-132) ----------
  function alignment() {
    const blocks = elements.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width >= 160 && (isSurface(el) || /^(H[1-6]|P|TABLE|FORM|UL|OL|SECTION|ARTICLE)$/.test(el.tagName)) && !el.closest('nav, header, footer');
    });
    const edges = new Map();
    for (const el of blocks) {
      const x = round(pageRect(el).x);
      edges.set(x, [...(edges.get(x) || []), el]);
    }
    const sorted = [...edges.keys()].sort((a, b) => a - b);
    // Cluster edges that sit within a few px of each other; a cluster with unrelated elements on
    // different edges is one "almost aligned" problem, however many pairs it contains.
    const clusters = sorted.reduce((acc, x) => {
      const last = acc[acc.length - 1];
      if (last && x - last[last.length - 1] <= LIMITS.edgeNearMiss) last.push(x); else acc.push([x]);
      return acc;
    }, []).filter((c) => c.length > 1);
    const nearMisses = [];
    for (const cluster of clusters) {
      const members = cluster.map((x) => ({ x, els: edges.get(x) }));
      const pair = members.flatMap((m, i) => members.slice(i + 1).flatMap((n) => m.els.flatMap((a) => n.els.filter((b) => !a.contains(b) && !b.contains(a)).map((b) => [a, b]))))[0];
      if (pair) nearMisses.push({ edges: cluster.map((x) => `${x}px`).join(' / '), elements: members.map((m) => m.els[0]) });
    }
    nearMisses.slice(0, 6).forEach((m) => flag('SU-124', 'warn', 'Shared edges', `left edges ${m.edges} almost align; pick one`, m.elements));
    return { distinctEdges: sorted.length, nearMisses: nearMisses.map((m) => ({ edges: m.edges, elements: m.elements.map(path) })) };
  }
  function rowsAndRhythm() {
    const parents = new Set(surfaces.map((el) => el.parentElement).filter(Boolean));
    for (const parent of parents) {
      const kids = [...parent.children].filter((c) => surfaces.includes(c));
      if (kids.length < 2) continue;
      const rows = [];
      for (const kid of kids) {
        const r = kid.getBoundingClientRect();
        const row = rows.find((candidate) => Math.min(candidate.bottom, r.bottom) - Math.max(candidate.top, r.top) > Math.min(candidate.height, r.height) / 2);
        if (row) { row.items.push({ kid, r }); row.top = Math.min(row.top, r.top); row.bottom = Math.max(row.bottom, r.bottom); }
        else rows.push({ top: r.top, bottom: r.bottom, height: r.height, items: [{ kid, r }] });
      }
      for (const row of rows.filter((rw) => rw.items.length > 1)) {
        const tops = row.items.map((i) => i.r.top);
        const heights = row.items.map((i) => i.r.height);
        const topSpread = Math.max(...tops) - Math.min(...tops);
        const heightSpread = Math.max(...heights) - Math.min(...heights);
        if (topSpread >= 1 && topSpread <= LIMITS.rowTopMiss) flag('SU-132', 'warn', 'Rows align', `cards in a row are ${Math.round(topSpread)}px out of line at the top`, row.items.map((i) => i.kid));
        if (heightSpread > LIMITS.rowHeightMiss) flag('SU-132', 'warn', 'Rows align', `cards in a row have uneven heights (${heights.map(Math.round).join(', ')}px)`, row.items.map((i) => i.kid));
      }
    }
    // Section rhythm: in the main column (and any parent of several surfaces), adjacent stacked blocks
    // of section size should be separated by the same gap.
    const columns = new Set([...ROOT.querySelectorAll('main, [role=main]'), ...parents].filter((p) => p && isVisible(p)));
    if (ROOT.matches('main, [role=main]')) columns.add(ROOT);
    for (const column of columns) {
      const kids = [...column.children].filter((c) => isVisible(c) && !/absolute|fixed/.test(css(c).position)).map((kid) => ({ kid, r: kid.getBoundingClientRect() }));
      const gaps = [];
      const blocks = [];
      for (let i = 1; i < kids.length; i += 1) {
        const [prev, next] = [kids[i - 1], kids[i]];
        if (next.r.top < prev.r.bottom - 1 || prev.r.height < 40 || next.r.height < 40) continue;
        gaps.push(Math.round(next.r.top - prev.r.bottom));
        blocks.push(next.kid);
      }
      // One deliberate group break (4, 4, 4, 16) is grouping, not drift; wandering gaps (13, 22, 30, 17) are drift.
      const distinct = new Set(gaps.map((g) => round(g, 2))).size;
      if (gaps.length >= 3 && distinct >= 3 && Math.max(...gaps) - Math.min(...gaps) >= LIMITS.rhythmSpread) {
        flag('SU-125', 'warn', 'Rhythm', `uneven gaps between stacked sections in ${path(column)}: ${gaps.join(', ')}px`, blocks);
      }
    }
    const deep = surfaces.filter((el) => { let depth = 0; for (let n = el.parentElement; n && n !== ROOT.parentElement; n = n.parentElement) if (surfaces.includes(n)) depth += 1; return depth >= 2; });
    if (deep.length) flag('SU-130', 'warn', 'Group with space before boxes', `${deep.length} surface(s) nested three or more boxes deep (card in card in card)`, deep);
    return { surfaces: surfaces.length, deepNesting: deep.length };
  }

  // ---------- hidden states (SU-136) ----------
  function states() {
    const found = [];
    const seen = new Set();
    // nodes: the hidden element(s) that make up one state; the first one names it.
    const push = (nodes, trigger, kind) => {
      const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
      if (!list.length || list.some((n) => seen.has(n) || isVisible(n)) || [...seen].some((s) => s.contains(list[0]))) return;
      list.forEach((n) => seen.add(n));
      const interactive = list.reduce((sum, n) => sum + n.querySelectorAll(INTERACTIVE).length + (n.matches(INTERACTIVE) ? 1 : 0), 0);
      const textChars = list.reduce((sum, n) => sum + n.textContent.trim().length, 0);
      if (!interactive && textChars < 20) return;
      found.push({ kind, state: path(list[0]), opensWith: trigger ? `${path(trigger)} "${snippet(trigger, 24)}"` : null, interactive, textChars });
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
      if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(el.tagName) || seen.has(el)) return;
      const hidden = css(el).display === 'none' || el.hidden;
      if (hidden && el.parentElement && css(el.parentElement).display !== 'none' && !el.closest('details:not([open])')) push(el, null, 'hidden element');
    });
    if (found.length) flag('SU-136', 'info', 'Every state reviewed', `${found.length} hidden state(s) were not on screen: open each and re-run audit.js and page-map.js`);
    if (found.length > 30) COVERAGE.capsHit.push(`hidden states: listed the first 30 of ${found.length}`);
    return found.slice(0, 30);
  }

  // ---------- wireframe ----------
  const LANDMARK = 'header, nav, main, aside, footer, section, article, form, table, dialog[open], [role=banner], [role=navigation], [role=main], [role=complementary], [role=contentinfo], [role=region], [role=tablist], [role=toolbar], [role=dialog]';
  function label(el) {
    const heading = el.querySelector('h1, h2, h3, h4, h5, h6, [role=heading], legend, caption');
    const text = (heading && heading.textContent) || el.getAttribute('aria-label') || '';
    const clean = text.trim().replace(/\s+/g, ' ');
    const tag = el.tagName.toLowerCase();
    return clean ? `${tag} "${clean.slice(0, 26)}"` : `${tag}${el.classList[0] ? `.${el.classList[0]}` : ''}`;
  }
  // Landmarks and surfaces from `pool` big enough to draw, minus wrappers with the same box, biggest `cap` first.
  function pickRegions(pool, minArea, cap) {
    let candidates = pool.filter((el) => (el.matches(LANDMARK) || isSurface(el)) && (el.matches(LANDMARK) || pageRect(el).w * pageRect(el).h >= minArea));
    candidates = candidates.filter((el) => {
      const parent = candidates.find((p) => p !== el && p.contains(el) && !candidates.some((q) => q !== p && q !== el && p.contains(q) && q.contains(el)));
      if (!parent) return true;
      const [a, b] = [pageRect(el), pageRect(parent)];
      return !(Math.abs(a.x - b.x) < 4 && Math.abs(a.y - b.y) < 4 && Math.abs(a.w - b.w) < 4 && Math.abs(a.h - b.h) < 4);
    });
    const depthOf = (el) => candidates.filter((p) => p !== el && p.contains(el)).length;
    const drawable = candidates.map((el) => ({ el, depth: depthOf(el), rect: pageRect(el) })).filter((r) => r.depth <= 2);
    const regions = [...drawable].sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h).slice(0, cap)
      .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)
      .map((r, i) => ({ ...r, n: i + 1 }));
    return { regions, total: drawable.length };
  }
  // ASCII boxes for `regions` inside `area` (page coordinates), at most `maxRows` rows.
  function drawMap(regions, area, cols, maxRows) {
    const cellW = area.w / cols;
    const cellH = Math.max(cellW * 2, area.h / maxRows);
    const rows = Math.max(2, Math.min(maxRows, Math.ceil(area.h / cellH)));
    const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
    const put = (y, x, ch) => { if (y >= 0 && y < rows && x >= 0 && x < cols) grid[y][x] = ch; };
    for (const region of [...regions].sort((a, b) => a.depth - b.depth)) {
      const x0 = Math.max(0, Math.floor((region.rect.x - area.x) / cellW));
      const x1 = Math.min(cols - 1, Math.max(x0 + 1, Math.ceil((region.rect.x - area.x + region.rect.w) / cellW) - 1));
      const y0 = Math.max(0, Math.floor((region.rect.y - area.y) / cellH));
      const y1 = Math.min(rows - 1, Math.max(y0 + 1, Math.ceil((region.rect.y - area.y + region.rect.h) / cellH) - 1));
      for (let x = x0; x <= x1; x += 1) { put(y0, x, '-'); put(y1, x, '-'); }
      for (let y = y0; y <= y1; y += 1) { put(y, x0, '|'); put(y, x1, '|'); }
      [[y0, x0], [y0, x1], [y1, x0], [y1, x1]].forEach(([y, x]) => put(y, x, '+'));
      const text = `${region.n} ${label(region.el)}`.slice(0, Math.max(0, x1 - x0 - 1));
      const ty = y1 - y0 >= 2 ? y0 + 1 : y0;
      [...text].forEach((ch, i) => put(ty, x0 + 1 + i, ch));
    }
    return { map: grid.map((row) => row.join('').replace(/\s+$/, '')).join('\n'), scale: `1 column ≈ ${Math.round(cellW)}px, 1 row ≈ ${Math.round(cellH)}px` };
  }
  const describeRegion = (r) => ({
    n: r.n, label: label(r.el), path: path(r.el), depth: r.depth,
    box: `${Math.round(r.rect.x)},${Math.round(r.rect.y)} ${Math.round(r.rect.w)}×${Math.round(r.rect.h)}`,
    interactive: r.el.querySelectorAll(INTERACTIVE).length, textChars: r.el.textContent.trim().length,
  });
  function wireframe() {
    // The threshold comes from the viewport, not the document, so the sections of a long page still qualify.
    const minArea = Math.min(docWidth * docHeight, innerWidth * innerHeight * 3) * 0.004;
    const { regions, total } = pickRegions(elements, minArea, LIMITS.maxRegions);
    if (total > LIMITS.maxRegions) COVERAGE.capsHit.push(`the wireframe draws the ${LIMITS.maxRegions} largest of ${total} regions${isLongPage() ? '; bands[].wireframe draws each band in detail' : ''}`);
    return { ...drawMap(regions, { x: 0, y: 0, w: docWidth, h: docHeight }, OPTIONS.cols, OPTIONS.maxRows), regions: regions.map(describeRegion) };
  }

  // ---------- bands: a long page, one top-level block at a time (H3, SU-204–212, SU-259, SU-261, SU-262) ----------
  // The same algorithm as audit.js's `band` option: top-level blocks in reading order, with tall wrappers
  // that only stack full-width blocks opened up, and short blocks (a lone heading) joined to the next one.
  const BAND = { minHeight: 24, mergeBelow: 160, openAbove: 1.5, fullWidth: 0.9, maxDepth: 4, max: 24, regionCap: 14 };
  const LONG_PAGE_SCREENS = 3;
  const isLongPage = () => OPTIONS.bands === true || (OPTIONS.bands === 'auto' && docHeight >= innerHeight * LONG_PAGE_SCREENS);
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
    return flat.reduce((bands, el) => {
      const last = bands[bands.length - 1];
      if (last && last.pending) return [...bands.slice(0, -1), { el, parts: [...last.parts, el], pending: el.getBoundingClientRect().height < BAND.mergeBelow }];
      return [...bands, { el, parts: [el], pending: el.getBoundingClientRect().height < BAND.mergeBelow && el.tagName !== 'HEADER' }];
    }, []).map(({ el, parts }) => ({ el: parts.length > 1 && parts.every((p) => p.parentElement === parts[0].parentElement) && blocks(parts[0].parentElement).length === parts.length ? parts[0].parentElement : el, parts }));
  }
  // A band's layout in one comparable string: its heading, then its repeated group (a grid of one shape), a
  // two-column split, or a plain stack.
  const shapeOf = (el) => `${el.tagName.toLowerCase()}${el.classList[0] ? `.${el.classList[0]}` : ''}(${[...el.children].filter(isVisible).slice(0, 5).map((c) => c.tagName.toLowerCase()).join(',')})`;
  function fingerprint(parts) {
    const heading = parts.map((p) => (p.matches('h1, h2, h3') ? p : p.querySelector('h1, h2, h3'))).find((h) => h && isVisible(h));
    const head = heading ? `${heading.tagName.toLowerCase()} ${Math.round(px(css(heading).fontSize))}px` : 'no heading';
    let best = null;
    for (const node of parts.flatMap((p) => [p, ...p.querySelectorAll('*')]).slice(0, 3000)) {
      const kids = [...node.children].filter(isVisible);
      if (kids.length < 3) continue;
      const [top] = tally(kids.map(shapeOf));
      if (top.count >= 3 && (!best || top.count > best.count)) {
        best = { count: top.count, shape: top.value, cols: new Set(kids.map((k) => Math.round(k.getBoundingClientRect().left / 8))).size };
      }
    }
    if (best) return { heading, key: `${head.split(' ')[0]}|grid ${best.cols} ${best.shape}`, text: `${head} + grid ${best.cols}×${Math.ceil(best.count / best.cols)} ${best.shape}` };
    const split = parts.flatMap((p) => [p, ...p.querySelectorAll('*')]).slice(0, 3000).find((node) => {
      const kids = [...node.children].filter(isVisible);
      const width = node.getBoundingClientRect().width;
      return kids.length === 2 && width >= innerWidth * 0.5 && kids.every((k) => k.getBoundingClientRect().width >= width * 0.3)
        && Math.abs(kids[0].getBoundingClientRect().top - kids[1].getBoundingClientRect().top) < 40;
    });
    if (split) {
      const media = [...split.children].findIndex((k) => k.matches('img, video, canvas, picture, svg') || k.querySelector('img, video, canvas, picture'));
      return { heading, key: `${head.split(' ')[0]}|split`, text: `${head} + split${media === 0 ? ' (media left)' : media === 1 ? ' (media right)' : ''}` };
    }
    return { heading, key: `${head.split(' ')[0]}|stack`, text: `${head} + stack` };
  }
  const bandKind = (el) => (el.matches('header, [role=banner]') ? 'header' : el.matches('footer, [role=contentinfo]') ? 'footer' : el.matches('nav') ? 'nav' : 'content');
  const isDecoration = (el) => {
    const s = css(el);
    const r = el.getBoundingClientRect();
    const blurred = /blur\((\d+(\.\d+)?)px\)/.exec(s.filter);
    return el.textContent.trim().length === 0 && r.width * r.height >= 40000
      && ((blurred && parseFloat(blurred[1]) >= 24) || /radial-gradient/.test(s.backgroundImage));
  };
  function bandsSection() {
    const all = pageBands();
    if (all.length > BAND.max) COVERAGE.capsHit.push(`bands: analysed the first ${BAND.max} of ${all.length}`);
    const long = isLongPage();
    const loud = loudButtonList();
    const seen = { sizes: new Set(), colors: new Set(), radii: new Set() };
    const bands = all.slice(0, BAND.max).map((band, i) => {
      const inBand = (el) => band.parts.some((p) => p === el || p.contains(el));
      const rects = band.parts.map(pageRect);
      const area = { x: 0, y: Math.min(...rects.map((r) => r.y)), w: docWidth, h: Math.max(...rects.map((r) => r.y + r.h)) - Math.min(...rects.map((r) => r.y)) };
      const owners = textOwners.filter(inBand);
      const groups = textGroups(owners);
      const top = groups[0];
      const sizeOf = (g) => g.style.split('/')[0];
      const rivals = top ? groups.filter((g) => g !== top && g.score >= top.score * LIMITS.peerTier && sizeOf(g) !== sizeOf(top)) : [];
      const fresh = (set, values) => [...new Set(values)].filter((v) => !set.has(v) && set.add(v));
      const newValues = {
        fontSizes: fresh(seen.sizes, owners.map((el) => round(px(css(el).fontSize), 0.5))),
        textColors: fresh(seen.colors, owners.map((el) => hex(parseColor(css(el).color)))),
        radii: fresh(seen.radii, elements.filter((el) => inBand(el) && (hasBoundary(el) || el.tagName === 'IMG')).map((el) => round(px(css(el).borderTopLeftRadius))).filter((v) => v > 0)),
      };
      const style = css(band.el);
      const firstChild = [...band.el.children].find(isVisible);
      const print = fingerprint(band.parts);
      const entry = {
        n: i + 1, kind: bandKind(band.el), label: label(band.el), path: path(band.el), y: Math.round(area.y), height: Math.round(area.h),
        background: hex(backdrop(band.el)), fullBleed: band.el.getBoundingClientRect().width >= innerWidth * 0.95,
        paddingTop: Math.round(firstChild ? firstChild.getBoundingClientRect().top - band.el.getBoundingClientRect().top : px(style.paddingTop)),
        fingerprint: print.text, layoutKey: print.key, hasH1: band.parts.some((p) => p.matches('h1') || !!p.querySelector('h1')),
        sectionHeading: print.heading && print.heading.tagName === 'H2' ? `${round(px(css(print.heading).fontSize), 0.5)}px/${px(css(print.heading).fontWeight) || 400}/${hex(parseColor(css(print.heading).color))}` : null,
        firstRead: top ? { style: top.style, text: top.samples[0] } : null, rivals: rivals.map((g) => `${g.style} "${g.samples[0]}"`),
        loudButtons: [...new Set(loud.filter((b) => inBand(b.el)).map((b) => b.label))],
        newValues,
        images: elements.filter((el) => inBand(el) && el.tagName === 'IMG' && el.getBoundingClientRect().width >= 64),
        decorations: elements.filter((el) => inBand(el) && isDecoration(el)).length,
      };
      if (long && OPTIONS.bandMaps !== false) {
        const { regions } = pickRegions(elements.filter(inBand), innerWidth * innerHeight * 0.004, BAND.regionCap);
        entry.wireframe = drawMap(regions, area, OPTIONS.bandCols, OPTIONS.bandRows).map;
      }
      return entry;
    });
    if (long) longPageFlags(bands);
    const outline = bands.map((b) => `${b.n}. ${b.kind} ${b.label} · ${b.height}px · ${b.fingerprint} · ${b.background}${b.firstRead ? ` · reads "${b.firstRead.text}"` : ''}`);
    return { outline, bands: bands.map(({ images, ...b }) => b) };
  }
  // SU-204–212 and the per-band craft notes, from the band list.
  function longPageFlags(bands) {
    const content = bands.filter((b) => b.kind === 'content');
    for (const b of content) {
      if (b.rivals.length) flag('SU-204', 'warn', 'Each screen has a lead', `band ${b.n} (${b.label}): ${b.rivals.length + 1} different styles compete for its first read: ${b.firstRead.style} "${b.firstRead.text}" · ${b.rivals.join(' · ')}`);
      if (b.firstRead && px(b.firstRead.style) <= 18 && !b.images.some((img) => img.getBoundingClientRect().height >= b.height * 0.25)) flag('SU-204', 'info', 'Each screen has a lead', `band ${b.n} (${b.label}) has no lead: its loudest text is ${b.firstRead.style} and there is no large visual`);
    }
    const sectionHeads = new Set(content.map((b) => b.sectionHeading).filter(Boolean));
    if (sectionHeads.size > 1) flag('SU-204', 'warn', 'Each screen has a lead', `section headings lead their bands in ${sectionHeads.size} different styles (${[...sectionHeads].join(', ')}); give every section h2 one strong style`);
    // SU-205: three or more identical layouts in a row read as a template; padding should be one token.
    for (let i = 0; i + 2 < content.length; i += 1) {
      const run = [content[i]];
      for (let j = i + 1; j < content.length && content[j].layoutKey === content[i].layoutKey; j += 1) run.push(content[j]);
      if (run.length >= 3) {
        flag('SU-205', 'warn', 'Vary the shape, keep the system', `bands ${run.map((b) => b.n).join(', ')} repeat one layout (${run[0].fingerprint}); change the shape of the middle one (a split, a single large visual, a quote) or make them one list under one heading`);
        i += run.length - 1;
      }
    }
    const paddings = content.slice(1).map((b) => round(b.paddingTop, 8)).filter((v) => v > 0);
    const distinctPadding = [...new Set(paddings)];
    if (distinctPadding.length >= 3 && Math.max(...distinctPadding) - Math.min(...distinctPadding) >= 24) flag('SU-205', 'warn', 'Vary the shape, keep the system', `section padding varies across bands (${distinctPadding.sort((a, b) => a - b).join(', ')}px); use one section-padding token`);
    // SU-206: a band boundary that coincides with the fold, with a color change, looks like the end of the page.
    const first = content[0];
    const next = first && bands[bands.indexOf(first) + 1];
    if (first && next && Math.abs(first.y + first.height - innerHeight) <= 24 && labDistance(parseColor(first.background), parseColor(next.background)) > 0.02) flag('SU-206', 'info', 'No false floor', `band ${first.n} ends exactly at the fold (${first.y + first.height}px of ${innerHeight}px) with a color change below it; let the next band peek into the first screen`);
    // SU-208: one primary call to action, repeated with the same words.
    const labels = [...new Set(bands.flatMap((b) => b.loudButtons).map((l) => l.trim().toLowerCase()))];
    if (labels.length > 1) flag('SU-208', 'warn', 'One call to action, repeated', `${labels.length} different labels on loud (filled) buttons across the page: ${labels.join(', ')}; repeat one primary label and make the rest secondary (a form with a different job may keep its own)`);
    // SU-210: gentle banding.
    const backgrounds = [...new Set(bands.map((b) => b.background))].filter((value, i, list) => !list.slice(0, i).some((other) => labDistance(parseColor(other), parseColor(value)) < LIMITS.nearBackground));
    if (backgrounds.length > 3) flag('SU-210', 'warn', 'Band backgrounds band gently', `${backgrounds.length} different band backgrounds (${backgrounds.join(', ')}); alternate the base surface with one or two neighbouring steps`);
    const brandBands = bands.filter((b) => b.fullBleed && oklab(parseColor(b.background)).C >= LIMITS.accentChroma);
    if (brandBands.length > 1) flag('SU-210', 'warn', 'Band backgrounds band gently', `${brandBands.length} saturated full-bleed bands (${brandBands.map((b) => b.n).join(', ')}); keep at most one`);
    // SU-212: the hero says one thing.
    const hero = bands.find((b) => b.hasH1);
    const h1 = document.querySelector('h1');
    if (hero && h1 && isVisible(h1)) {
      const words = h1.textContent.trim().split(/\s+/).filter(Boolean).length;
      if (words > 12) flag('SU-212', 'warn', 'The hero says one thing', `the h1 has ${words} words; aim for about 10 or fewer on at most two lines`, [h1]);
      const cta = loudButtonList().find((b) => hero.loudButtons.includes(b.label));
      if (cta && pageRect(cta.el).y + pageRect(cta.el).h > innerHeight) flag('SU-212', 'warn', 'The hero says one thing', `the hero's call to action "${cta.label}" sits below the first screen`, [cta.el]);
    }
    // Craft per band: SU-259 (one frame per band), SU-261 (one glow), SU-262 (marketing whitespace).
    for (const b of content) {
      const radii = new Set(b.images.filter((img) => { const r = img.getBoundingClientRect(); return Math.abs(r.width - r.height) > 2 || px(css(img).borderTopLeftRadius) < r.width / 2 - 1; }).map((img) => round(px(css(img).borderTopLeftRadius))));
      if (radii.size > 1) flag('SU-259', 'info', 'Product imagery is framed one way', `band ${b.n} frames its images with ${radii.size} different radii (${[...radii].join(', ')}px)`);
      if (b.decorations > 1) flag('SU-261', 'info', 'Depth effects are rare and earned', `band ${b.n} has ${b.decorations} large blurred or radial-gradient decorations; keep one, behind the focal element`);
    }
    const display = h1 && isVisible(h1) && px(css(h1).fontSize) >= 48;
    const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
    const padding = content.slice(1).map((b) => b.paddingTop).filter((v) => v > 0);
    if (display && content.length >= 3 && padding.length && median(padding) < 64) flag('SU-262', 'info', 'Whitespace scales with the medium', `a marketing page (a ${Math.round(px(css(h1).fontSize))}px h1) with app-tier section padding (median ${median(padding)}px); use 96–160px on desktop`);
  }

  // ---------- craft inventory: controls, avatars, shadows, borders, icons (SU-239, SU-245, SU-253, SU-254, SU-256) ----------
  // Box-shadow layers: computed values list the color first, then x, y, blur, spread.
  function shadowLayers(value) {
    const layers = [];
    let depth = 0;
    let start = 0;
    [...value].forEach((ch, i) => { if (ch === '(') depth += 1; else if (ch === ')') depth -= 1; else if (ch === ',' && depth === 0) { layers.push(value.slice(start, i)); start = i + 1; } });
    return [...layers, value.slice(start)].map((layer) => {
      const color = (layer.match(/rgba?\([^)]*\)/) || ['rgba(0, 0, 0, 1)'])[0];
      const [x = 0, y = 0, blur = 0, spread = 0] = (layer.replace(color, '').match(/-?\d+(\.\d+)?px/g) || []).map(parseFloat);
      return { color: parseColor(color), x, y, blur, spread, inset: /inset/.test(layer) };
    });
  }
  const isBlackish = (c) => Math.max(c.r, c.g, c.b) <= 24;
  function craftSection() {
    const controls = elements.filter((el) => el.matches('button, input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range]):not([type=color]), select, [role=button]') && !el.closest('[role=menu], [role=listbox], table'));
    const controlHeights = tally(controls.map((el) => round(el.getBoundingClientRect().height, 2)));
    if (controlHeights.length > 3) flag('SU-239', 'warn', 'One control size scale', `${controlHeights.length} control heights in use (${controlHeights.map((h) => `${h.value}px×${h.count}`).join(', ')}); use sm 32 · md 40 · lg 48`, controls.slice(0, 6));
    const avatars = elements.filter((el) => {
      const r = el.getBoundingClientRect();
      const circular = px(css(el).borderTopLeftRadius) >= r.width * 0.45;
      return (/avatar/i.test(typeof el.className === 'string' ? el.className : '') || (el.tagName === 'IMG' && circular)) && Math.abs(r.width - r.height) <= 1 && r.width >= 14 && r.width <= 128;
    });
    const avatarSizes = tally(avatars.map((el) => Math.round(el.getBoundingClientRect().width)));
    if (avatarSizes.length > 4) flag('SU-245', 'info', 'Avatars', `${avatarSizes.length} avatar sizes (${avatarSizes.map((s) => `${s.value}px`).join(', ')}); pick sizes from one scale`, avatars.slice(0, 6));

    // SU-253: shadows are layered and tinted. Rings (spread only) and inset shadows don't count.
    const shadowed = elements.filter((el) => css(el).boxShadow && css(el).boxShadow !== 'none');
    const byValue = new Map();
    shadowed.forEach((el) => byValue.set(css(el).boxShadow, [...(byValue.get(css(el).boxShadow) || []), el]));
    for (const [value, users] of byValue) {
      const layers = shadowLayers(value).filter((l) => !l.inset && !(l.blur === 0 && l.spread > 0) && l.color.a > 0);
      if (!layers.length) continue;
      if (layers.length === 1 && layers[0].blur >= 12) flag('SU-253', 'warn', 'Shadows are layered and tinted', `a single-layer ${layers[0].blur}px shadow on ${users.length} element(s) (${value.slice(0, 60)}); pair a broad soft layer with a tight contact layer`, users.slice(0, 6));
      const heavy = layers.find((l) => isBlackish(l.color) && l.color.a > 0.25);
      if (heavy) flag('SU-253', 'warn', 'Shadows are layered and tinted', `a black shadow at alpha ${Math.round(heavy.color.a * 100) / 100} (${value.slice(0, 60)}); stay at or below 0.25`, users.slice(0, 6));
      const onColor = users.filter((el) => el.parentElement && oklab(backdrop(el.parentElement)).C >= 0.04);
      if (onColor.length && layers.every((l) => isBlackish(l.color))) flag('SU-253', 'info', 'Shadows are layered and tinted', `pure-black shadows over a colored surface on ${onColor.length} element(s); tint the shadow with the surface's hue`, onColor.slice(0, 6));
    }
    // SU-254: opaque gray borders drawn on several different surfaces.
    const borders = new Map();
    for (const el of elements) {
      const s = css(el);
      if (px(s.borderTopWidth) <= 0 && px(s.borderBottomWidth) <= 0) continue;
      const color = parseColor(px(s.borderTopWidth) > 0 ? s.borderTopColor : s.borderBottomColor);
      if (color.a < 0.99 || oklab(color).C >= 0.02 || !el.parentElement) continue;
      const key = hex(color);
      borders.set(key, new Set([...(borders.get(key) || []), hex(backdrop(el.parentElement))]));
    }
    for (const [color, surfacesUsed] of borders) {
      if (surfacesUsed.size >= 3) flag('SU-254', 'info', 'Edges are hairlines with alpha', `the opaque gray border ${color} sits on ${surfacesUsed.size} different surfaces; a translucent ink (rgb(0 0 0 / .08–.12)) works on all of them`);
    }
    // SU-256: one icon family, one stroke, sized to the text.
    const icons = [...ROOT.querySelectorAll('svg')].filter((svg) => {
      if (!isVisible(svg) || svg.parentElement.closest('svg')) return false;
      const r = svg.getBoundingClientRect();
      return r.width >= 10 && r.width <= 48 && r.height >= 10 && r.height <= 48;
    }).map((svg) => {
      const r = svg.getBoundingClientRect();
      const shape = svg.querySelector('path, circle, rect, line, polyline, polygon, ellipse');
      const s = shape ? getComputedStyle(shape) : null;
      const box = svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width ? svg.viewBox.baseVal.width : r.width;
      const stroked = !!s && s.stroke !== 'none' && parseColor(s.stroke).a > 0 && px(s.strokeWidth) > 0;
      const filled = !!s && s.fill !== 'none' && parseColor(s.fill).a > 0;
      return { svg, size: Math.round(Math.max(r.width, r.height)), stroke: stroked ? round(px(s.strokeWidth) * (r.width / box), 0.25) : null, style: stroked && !filled ? 'outline' : filled && !stroked ? 'filled' : 'mixed' };
    });
    const iconSizes = tally(icons.map((i) => i.size));
    if (iconSizes.length > 3) flag('SU-256', 'warn', 'One icon family, one stroke', `${iconSizes.length} icon sizes (${iconSizes.map((s) => `${s.value}px×${s.count}`).join(', ')}); keep to 16/20/24`, icons.slice(0, 6).map((i) => i.svg));
    for (const { value: size } of iconSizes) {
      const strokes = [...new Set(icons.filter((i) => i.size === size && i.stroke !== null).map((i) => i.stroke))];
      if (strokes.length > 1) flag('SU-256', 'warn', 'One icon family, one stroke', `${size}px icons use ${strokes.length} stroke widths (${strokes.join(', ')}px); use one`, icons.filter((i) => i.size === size).slice(0, 6).map((i) => i.svg));
    }
    const groups = new Map();
    icons.forEach((i) => { const group = i.svg.closest('nav, ul, ol, [role=toolbar], [role=tablist], [role=menu]'); if (group) groups.set(group, [...(groups.get(group) || []), i]); });
    for (const [group, list] of groups) {
      const styles = new Set(list.map((i) => i.style).filter((st) => st !== 'mixed'));
      const selected = list.filter((i) => i.svg.closest('[aria-current], [aria-selected=true], [aria-pressed=true]'));
      if (styles.size > 1 && !(selected.length && selected.every((i) => i.style === 'filled'))) flag('SU-256', 'info', 'One icon family, one stroke', `icons in ${path(group)} mix filled and outline styles; filled is for the selected item only`, list.slice(0, 6).map((i) => i.svg));
    }
    return { controlHeights, avatarSizes, icons: { sizes: iconSizes, strokes: [...new Set(icons.map((i) => i.stroke).filter((v) => v !== null))] } };
  }

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

  // ---------- run ----------
  function runMap() {
    collect();
    const sections = {};
    const notes = [];
    for (const [name, fn] of [['wireframe', wireframe], ['hierarchy', hierarchy], ['headings', headings], ['system', system], ['craft', craftSection], ['alignment', alignment], ['layout', rowsAndRhythm], ['states', states], ['bands', bandsSection]]) {
      try { sections[name] = fn(); } catch (error) { notes.push(`Section "${name}" errored: ${error.message}`); }
    }
    let unseen = null;
    try { unseen = unseenContent(notes); } catch (error) { notes.push(`Unseen-content scan errored: ${error.message}`); }
    const { craft, bands, system: visualSystem, ...rest } = sections;
    const order = { warn: 0, info: 1 };
    const sortedFlags = flags.sort((a, b) => order[a.level] - order[b.level] || parseInt(a.id.slice(3), 10) - parseInt(b.id.slice(3), 10));
    const byRule = sortedFlags.reduce((acc, f) => ({ ...acc, [f.id]: (acc[f.id] || 0) + 1 }), {});
    const report = {
      tool: 'shibroUI page map', version: VERSION, url: location.href, viewport: `${innerWidth}×${innerHeight}`,
      page: `${docWidth}×${docHeight}`, elementsMeasured: elements.length, longPage: isLongPage(),
      summary: { warn: sortedFlags.filter((f) => f.level === 'warn').length, info: sortedFlags.filter((f) => f.level === 'info').length, byRule },
      flags: sortedFlags, ...(bands ? { outline: bands.outline } : {}), ...rest,
      system: visualSystem ? { ...visualSystem, ...(craft || {}) } : craft,
      ...(bands ? { bands: bands.bands } : {}),
      coverage: { ...COVERAGE, unseen, prepared: PREPARED },
      notes: [...notes, ...(running.length ? [`${running.length} running animation(s) were finished first so the resting state was measured.`] : []),
        ...(isLongPage() ? ['A long page: read `outline` first, then each band with its screenshot (scroll to band.y). Long-page rules are in references/long-pages.md.'] : []),
        'Screen-level flags are evidence for judgment, not verdicts. Read them with a screenshot and references/composition.md.'],
    };
    window.__shibroPageMapResult = report;
    return report;
  }
  // prepare: scroll the page once first (scroll reveals, lazy sections); the result is then a Promise.
  return OPTIONS.prepare ? prepareSweep().then(runMap) : runMap();
})()
