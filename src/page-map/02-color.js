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

