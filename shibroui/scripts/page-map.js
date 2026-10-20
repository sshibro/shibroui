// shibroUI page map: evaluate this whole file in a rendered page; it returns a JSON map of the screen:
// a text wireframe of its regions, what reads first, loud buttons per region, the heading outline, the
// visual system in use (sizes, colors, radii, shadows, spacing), alignment, row and rhythm problems,
// card nesting, and hidden states still to review. It backs the screen-level rules SU-119–SU-136.
// It is one expression, like audit.js: run the contents as-is, or Playwright browser_evaluate(() => <contents>).
// Optional: window.__shibroPageMap = { root: 'main', cols: 96, maxRows: 70 } before running.
(() => {
  const VERSION = '0.3.0';
  const OPTIONS = { root: null, cols: 96, maxRows: 70, ...(window.__shibroPageMap || {}) };
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
  // Measure the resting state: fast-forward finite running animations (entrance fades frozen mid-flight
  // in a background tab would otherwise hide whole panels).
  const running = document.getAnimations ? document.getAnimations().filter((a) => {
    const timing = a.effect && a.effect.getComputedTiming();
    return a.playState !== 'finished' && a.playState !== 'idle' && timing && Number.isFinite(timing.endTime);
  }) : [];
  running.forEach((a) => { try { a.finish(); } catch { /* infinite or detached animation */ } });
  styleCache.clear();
  const elements = [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements).filter((el) => !/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|svg|path|BR)$/i.test(el.tagName) && isVisible(el));
  const textOwners = elements.filter((el) => ownText(el).length > 0);
  const surfaces = elements.filter(isSurface);
  const docWidth = Math.max(document.documentElement.scrollWidth, innerWidth);
  const docHeight = Math.max(document.documentElement.scrollHeight, innerHeight);

  // ---------- hierarchy (SU-119, SU-120, SU-121, SU-131) ----------
  function hierarchy() {
    const groups = new Map();
    for (const el of textOwners) {
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
    const ranked = [...groups.values()].sort((a, b) => b.score - a.score);
    const top = ranked[0];
    if (!top) return { tiers: [] };
    const peers = ranked.filter((g) => g.score >= top.score * LIMITS.peerTier);
    const loud = ranked.filter((g) => g.score >= top.score * LIMITS.loudTier);
    if (peers.length > 1) flag('SU-119', 'warn', 'One focal point', `${peers.length} different styles compete for first read: ${peers.map((g) => `${g.style} "${g.samples[0]}"`).join(' · ')}`, peers.map((g) => g.elements[0]));
    if (loud.length >= LIMITS.loudStyles) flag('SU-131', 'warn', 'Three tiers', `${loud.length} distinct loud styles (within 50% of the top weight); aim for one loud tier, one strong tier, the rest quiet`, loud.map((g) => g.elements[0]));
    if (top.count > 6) flag('SU-131', 'info', 'Three tiers', `${top.count} elements share the loudest style (${top.style}); that many equal peers dilute the focal point`, top.elements);

    const loudButtons = [];
    for (const el of elements.filter((e) => e.matches('button, [role=button], input[type=submit], input[type=button], a[href]'))) {
      const s = css(el);
      const fill = parseColor(s.backgroundColor);
      const box = pageRect(el);
      if (fill.a < 0.8 || !el.parentElement || box.y + box.h <= 0 || box.x + box.w <= 0) continue; // off-screen (e.g. an unfocused skip link)
      if (ratio(over(fill, backdrop(el.parentElement)), backdrop(el.parentElement)) < LIMITS.loudButtonContrast) continue;
      const region = el.closest('section, article, form, aside, header, nav, dialog, [role=region], [role=dialog], main') || document.body;
      loudButtons.push({ el, label: snippet(el, 24), region });
    }
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
  function wireframe() {
    const minArea = docWidth * docHeight * 0.004;
    let candidates = elements.filter((el) => (el.matches(LANDMARK) || isSurface(el)) && (el.matches(LANDMARK) || pageRect(el).w * pageRect(el).h >= minArea));
    candidates = candidates.filter((el) => {
      const parent = candidates.find((p) => p !== el && p.contains(el) && !candidates.some((q) => q !== p && q !== el && p.contains(q) && q.contains(el)));
      if (!parent) return true;
      const [a, b] = [pageRect(el), pageRect(parent)];
      return !(Math.abs(a.x - b.x) < 4 && Math.abs(a.y - b.y) < 4 && Math.abs(a.w - b.w) < 4 && Math.abs(a.h - b.h) < 4);
    });
    const depthOf = (el) => candidates.filter((p) => p !== el && p.contains(el)).length;
    const regions = candidates.map((el) => ({ el, depth: depthOf(el), rect: pageRect(el) })).filter((r) => r.depth <= 2)
      .sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h).slice(0, LIMITS.maxRegions)
      .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)
      .map((r, i) => ({ ...r, n: i + 1 }));
    const cols = OPTIONS.cols;
    const cellW = docWidth / cols;
    const cellH = Math.max(cellW * 2, docHeight / OPTIONS.maxRows);
    const rows = Math.min(OPTIONS.maxRows, Math.ceil(docHeight / cellH));
    const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
    const put = (y, x, ch) => { if (y >= 0 && y < rows && x >= 0 && x < cols) grid[y][x] = ch; };
    for (const region of [...regions].sort((a, b) => a.depth - b.depth)) {
      const x0 = Math.floor(region.rect.x / cellW);
      const x1 = Math.min(cols - 1, Math.max(x0 + 1, Math.ceil((region.rect.x + region.rect.w) / cellW) - 1));
      const y0 = Math.floor(region.rect.y / cellH);
      const y1 = Math.min(rows - 1, Math.max(y0 + 1, Math.ceil((region.rect.y + region.rect.h) / cellH) - 1));
      for (let x = x0; x <= x1; x += 1) { put(y0, x, '-'); put(y1, x, '-'); }
      for (let y = y0; y <= y1; y += 1) { put(y, x0, '|'); put(y, x1, '|'); }
      [[y0, x0], [y0, x1], [y1, x0], [y1, x1]].forEach(([y, x]) => put(y, x, '+'));
      const text = `${region.n} ${label(region.el)}`.slice(0, Math.max(0, x1 - x0 - 1));
      const ty = y1 - y0 >= 2 ? y0 + 1 : y0;
      [...text].forEach((ch, i) => put(ty, x0 + 1 + i, ch));
    }
    return {
      map: grid.map((row) => row.join('').replace(/\s+$/, '')).join('\n'),
      scale: `1 column ≈ ${Math.round(cellW)}px, 1 row ≈ ${Math.round(cellH)}px`,
      regions: regions.map((r) => ({
        n: r.n, label: label(r.el), path: path(r.el), depth: r.depth,
        box: `${Math.round(r.rect.x)},${Math.round(r.rect.y)} ${Math.round(r.rect.w)}×${Math.round(r.rect.h)}`,
        interactive: r.el.querySelectorAll(INTERACTIVE).length, textChars: r.el.textContent.trim().length,
      })),
    };
  }

  // ---------- run ----------
  const sections = {};
  const notes = [];
  for (const [name, fn] of [['wireframe', wireframe], ['hierarchy', hierarchy], ['headings', headings], ['system', system], ['alignment', alignment], ['layout', rowsAndRhythm], ['states', states]]) {
    try { sections[name] = fn(); } catch (error) { notes.push(`Section "${name}" errored: ${error.message}`); }
  }
  const order = { warn: 0, info: 1 };
  const sortedFlags = flags.sort((a, b) => order[a.level] - order[b.level] || parseInt(a.id.slice(3), 10) - parseInt(b.id.slice(3), 10));
  const byRule = sortedFlags.reduce((acc, f) => ({ ...acc, [f.id]: (acc[f.id] || 0) + 1 }), {});
  const report = {
    tool: 'shibroUI page map', version: VERSION, url: location.href, viewport: `${innerWidth}×${innerHeight}`,
    page: `${docWidth}×${docHeight}`, elementsMeasured: elements.length,
    summary: { warn: sortedFlags.filter((f) => f.level === 'warn').length, info: sortedFlags.filter((f) => f.level === 'info').length, byRule },
    flags: sortedFlags, ...sections,
    notes: [...notes, ...(running.length ? [`${running.length} running animation(s) were finished first so the resting state was measured.`] : []), 'Screen-level flags are evidence for judgment, not verdicts. Read them with a screenshot and references/composition.md.'],
  };
  window.__shibroPageMapResult = report;
  return report;
})()
