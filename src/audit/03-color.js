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

