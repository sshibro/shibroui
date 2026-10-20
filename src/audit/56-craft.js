  // ---------- Visual craft: gradients, display type, imagery, logos, finishes (SU-255, SU-258, SU-259, SU-260, SU-263) ----------
  const CR_LIMITS = {
    midpointChromaShare: 0.6, minMeanChroma: 0.06, minStopAlpha: 0.85,
    gradientTextInfoPx: 32, displayPx: 48, displayLeading: 1.2,
    imageMinWidth: 64, imageMinShare: 0.75, imageMaxDpr: 2,
    logoMinCount: 4, logoMaxWidth: 240, logoMaxHeight: 120, logoRowTolerance: 8, logoAreaRatio: 1.4,
    scrollerMinHeight: 120, scrollerMaxShare: 0.8,
  };
  const CR_GRADIENT = /(?:repeating-)?(?:linear|radial|conic)-gradient\(/;
  const CR_PERCEPTUAL_SPACE = /\bin\s+(?:oklch|oklab|lab|lch)\b/;
  const CR_COLOR_FUNCTION = /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\((?:[^()]|\([^()]*\))*\)/g;
  const CR_RASTER_SKIP = /\.svg(?:[?#]|$)|^data:image\/svg/i;
  const CR_RTL_OR_CJK = /[֐-ࣿऀ-෿぀-鿿가-힯]/;
  const CR_SCROLL_LOCK_CLASS = /\b(?:no-?scroll|scroll-?lock(?:ed)?|modal-open|overflow-hidden|is-locked|lock-scroll)\b/;
  const CR_NATIVE_CHOICE = 'input[type=checkbox], input[type=radio], input[type=range]';
  const CR_ALL_ELEMENTS = () => [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements);

  // sRGB (0–255 channels) → OKLCH, with only the chroma and hue the checks need.
  function crOklch(color) {
    const [r, g, b] = [linear(color.r), linear(color.g), linear(color.b)];
    const [l, m, s] = [
      Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b),
      Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b),
      Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b),
    ];
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return { L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, C: Math.hypot(a, bAxis) };
  }
  // Splits a computed background-image on its top-level commas (one string per layer).
  function crSplitLayers(value) {
    const layers = [];
    let depth = 0;
    let start = 0;
    [...value].forEach((char, i) => {
      if (char === '(') depth += 1;
      else if (char === ')') depth -= 1;
      else if (char === ',' && depth === 0) { layers.push(value.slice(start, i).trim()); start = i + 1; }
    });
    return [...layers, value.slice(start).trim()].filter(Boolean);
  }
  const crOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
  const crTransparentText = (style) => parseColor(style.color).a === 0 || parseColor(style.webkitTextFillColor).a === 0;

  // The first adjacent pair of opaque stops whose sRGB midpoint loses most of the stops' chroma, or null.
  function crMuddyPair(layer) {
    const stops = (layer.match(CR_COLOR_FUNCTION) || []).map(parseColor);
    for (let i = 1; i < stops.length; i += 1) {
      const [from, to] = [stops[i - 1], stops[i]];
      if (Math.min(from.a, to.a) < CR_LIMITS.minStopAlpha) continue;
      const midpoint = { r: (from.r + to.r) / 2, g: (from.g + to.g) / 2, b: (from.b + to.b) / 2 };
      const mean = (crOklch(from).C + crOklch(to).C) / 2;
      const middle = crOklch(midpoint).C;
      if (mean >= CR_LIMITS.minMeanChroma && middle < CR_LIMITS.midpointChromaShare * mean) return { mean, middle, from, to };
    }
    return null;
  }
  function checkGradients() {
    for (const el of CR_ALL_ELEMENTS()) {
      const style = css(el);
      if (!CR_GRADIENT.test(style.backgroundImage) || !isVisible(el)) continue;
      checked('gradients');
      for (const layer of crSplitLayers(style.backgroundImage)) {
        if (!CR_GRADIENT.test(layer) || CR_PERCEPTUAL_SPACE.test(layer)) continue;
        const pair = crMuddyPair(layer);
        if (!pair) continue;
        const share = Math.round((pair.middle / pair.mean) * 100);
        add('SU-255', 'warn', 'Gradients interpolate in OKLCH', el,
          `sRGB gradient ${hex(pair.from)} to ${hex(pair.to)}: the midpoint keeps ${share}% of the stops' chroma (muddy middle)`,
          'linear-gradient(in oklch, …) or stops with neighbouring hues, 2–3 stops');
      }
      const clipsToText = /\btext\b/.test(style.backgroundClip) || /\btext\b/.test(style.webkitBackgroundClip);
      if (!clipsToText || !crTransparentText(style) || !el.textContent.trim()) continue;
      checked('gradient text');
      const size = px(style.fontSize);
      if (size < CR_LIMITS.gradientTextInfoPx) {
        add('SU-255', 'warn', 'No gradient text', el, `gradient text at ${Math.round(size)}px`, 'Use a solid text color; if the brand needs a gradient, display sizes (≥ 32px) only');
      } else {
        add('SU-255', 'info', 'No gradient text', el, `gradient text at ${Math.round(size)}px: measure contrast at the weakest stop`, 'Check ≥ 4.5:1 (3:1 for large text) against the page at the stop with the least contrast');
      }
    }
  }

  // Display type (≥ 48px) is set, not scaled: tracked in and tightly led.
  function checkDisplayType() {
    for (const el of CR_ALL_ELEMENTS()) {
      if (!crOwnText(el) || el.closest('svg, input, textarea, select, option')) continue;
      const style = css(el);
      const size = px(style.fontSize);
      if (size < CR_LIMITS.displayPx || !isVisible(el)) continue;
      if (CR_RTL_OR_CJK.test(el.textContent) || style.direction === 'rtl') { skipped('display type (connected or CJK script)'); continue; }
      checked('display text');
      if (px(style.letterSpacing) >= 0) {
        add('SU-258', 'warn', 'Display type is set, not scaled', el, `${Math.round(size)}px text with letter-spacing ${style.letterSpacing}`, 'letter-spacing: -0.02em to -0.04em at display sizes');
      }
      const leading = style.lineHeight === 'normal' ? 0 : px(style.lineHeight) / size;
      if (leading > CR_LIMITS.displayLeading) {
        add('SU-258', 'warn', 'Display type is set, not scaled', el, `${Math.round(size)}px text with line-height ${Math.round(leading * 100) / 100}`, 'line-height: 1.0–1.1 at display sizes');
      }
    }
  }

  // Raster images shown larger than their pixels can fill at the display density.
  function checkImageSharpness() {
    const density = Math.min(devicePixelRatio || 1, CR_LIMITS.imageMaxDpr);
    for (const img of ROOT.querySelectorAll('img')) {
      const source = img.currentSrc || img.src;
      if (!source || CR_RASTER_SKIP.test(source) || css(img).imageRendering === 'pixelated' || !isVisible(img)) continue;
      const shown = img.getBoundingClientRect().width;
      if (shown < CR_LIMITS.imageMinWidth) continue;
      if (!img.complete || !img.naturalWidth) { skipped('images not loaded yet (sharpness)'); continue; }
      checked('raster image sharpness');
      if (img.naturalWidth < CR_LIMITS.imageMinShare * shown * density) {
        add('SU-259', 'warn', 'Product imagery is crisp', img,
          `naturalWidth ${img.naturalWidth}px is shown at ${Math.round(shown)}px (${Math.round((img.naturalWidth / shown) * 100) / 100}× the rendered width, needs ≥ ${CR_LIMITS.imageMinShare * density}× at ${density}× density)`,
          'Export the image at 2× its rendered width (srcset with 1x/2x, or a source twice as wide)');
      }
    }
  }

  // Logo rows: ≥ 4 sibling images/SVGs (or links/items wrapping just one) on one line, each logo-sized.
  const crLogoMark = (child) => {
    if (child.matches('img, svg')) return child;
    if (!child.matches('a, li, div, span, picture') || child.textContent.trim()) return null;
    const media = child.querySelectorAll('img, svg');
    return media.length === 1 ? media[0] : null;
  };
  function crLogoRow(marks) {
    const sized = marks.map((mark) => ({ mark, rect: mark.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width <= CR_LIMITS.logoMaxWidth && rect.height <= CR_LIMITS.logoMaxHeight);
    const centerY = ({ rect }) => rect.top + rect.height / 2;
    const rows = sized.reduce((found, item) => {
      const index = found.findIndex((row) => Math.abs(centerY(row[0]) - centerY(item)) <= CR_LIMITS.logoRowTolerance);
      return index < 0 ? [...found, [item]] : found.map((row, i) => (i === index ? [...row, item] : row));
    }, []);
    return rows.filter((row) => row.length >= CR_LIMITS.logoMinCount).sort((a, b) => b.length - a.length)[0] || null;
  }
  function checkLogoRows() {
    for (const container of CR_ALL_ELEMENTS()) {
      if (container.childElementCount < CR_LIMITS.logoMinCount || container.matches('svg, svg *, picture, select')) continue;
      const marks = [...container.children].filter(isVisible).map(crLogoMark).filter((mark) => mark && isVisible(mark));
      if (marks.length < CR_LIMITS.logoMinCount) continue;
      const row = crLogoRow(marks);
      if (!row) continue;
      checked('logo rows');
      const areas = row.map(({ rect }) => rect.width * rect.height);
      const [smallest, largest] = [Math.min(...areas), Math.max(...areas)];
      if (smallest <= 0 || largest / smallest <= CR_LIMITS.logoAreaRatio) continue;
      add('SU-260', 'info', 'Logos are balanced by area', container,
        `${row.length} logos differ in area by ${Math.round((largest / smallest - 1) * 100)}% (${Math.round(smallest)} to ${Math.round(largest)} px²)`,
        'Scale logos so their area matches (±15%): wide wordmarks shorter, square marks taller, on one baseline row');
    }
  }

  // The small finishes (SU-263): one finding listing what is missing, never one per element.
  const crInertOrHidden = (el) => !isVisible(el) || !!el.closest('[inert]');
  const crContainsOverscroll = (el) => /contain|none/.test(css(el).overscrollBehaviorY);
  function crCrossOriginSheets() {
    return [...document.styleSheets].some((sheet) => { try { return !sheet.cssRules; } catch { return true; } });
  }
  function crScrollGutterMissing() {
    const root = document.documentElement;
    const locks = !!document.querySelector('dialog, [aria-modal]')
      || CR_SCROLL_LOCK_CLASS.test(`${root.getAttribute('class') || ''} ${document.body.getAttribute('class') || ''}`);
    if (!locks || root.scrollHeight <= innerHeight + 1) return false;
    checked('scrollbar-gutter');
    return !/stable/.test(css(root).scrollbarGutter) && !/stable/.test(css(document.body).scrollbarGutter);
  }
  function crOverscrollMissing() {
    const dialogs = [...ROOT.querySelectorAll('dialog, [role=dialog], [role=alertdialog], [aria-modal=true]')];
    const panels = CR_ALL_ELEMENTS().filter((el) => {
      if (dialogs.includes(el) || el.matches('textarea, select, input, html, body') || crInertOrHidden(el)) return false;
      const style = css(el);
      if (!/auto|scroll/.test(style.overflowY) || el.scrollHeight <= el.clientHeight + 1) return false;
      if (style.position === 'fixed') return true;
      const height = el.getBoundingClientRect().height;
      return height >= CR_LIMITS.scrollerMinHeight && height <= CR_LIMITS.scrollerMaxShare * innerHeight;
    });
    checked('overscroll containers', dialogs.length + panels.length);
    return [...dialogs, ...panels].filter((el) => !crContainsOverscroll(el)).length;
  }
  function crSelectionStyled(rules) {
    if (crCrossOriginSheets()) { skipped('::selection (cross-origin stylesheet)'); return true; }
    checked('::selection rules');
    return rules.some(({ rule }) => /::(?:-moz-)?selection/.test(rule.selectorText || ''));
  }
  function crAccentMissing() {
    const controls = [...ROOT.querySelectorAll(CR_NATIVE_CHOICE)].filter((el) => !crInertOrHidden(el) && css(el).appearance !== 'none');
    if (!controls.length) return false;
    checked('native checkboxes, radios and ranges', controls.length);
    return controls.some((el) => css(el).accentColor === 'auto');
  }
  // Computed caret-color resolves "auto" to the text color, so it can't tell set from unset: ask the rules
  // (an ancestor match counts, the property inherits) and the inline style instead.
  const crCaretSet = (field, rules) => !!field.style.caretColor || rules.some(({ rule }) => {
    if (!rule.style.caretColor || rule.style.caretColor === 'auto') return false;
    try { return !!field.closest(rule.selectorText); } catch { return false; }
  });
  function crCaretMissing(rules) {
    const fields = [...ROOT.querySelectorAll(TEXT_FIELD)].filter((el) => !el.matches('select') && !crInertOrHidden(el));
    if (!fields.length) return false;
    if (crCrossOriginSheets()) { skipped('caret-color (cross-origin stylesheet)'); return false; }
    checked('text fields (caret-color)', fields.length);
    return fields.some((el) => !crCaretSet(el, rules));
  }
  function checkFinishes({ rules }) {
    const overscroll = crOverscrollMissing();
    const missing = [
      crScrollGutterMissing() && 'scrollbar-gutter: stable on html (a dialog or scroll lock shifts the page)',
      overscroll > 0 && `overscroll-behavior: contain on ${overscroll} dialog(s), drawer(s) or scroll panel(s)`,
      !crSelectionStyled(rules) && '::selection in an accent tint',
      crAccentMissing() && 'accent-color on :root (native checkboxes, radios or ranges)',
      crCaretMissing(rules) && 'caret-color on text fields',
    ].filter(Boolean);
    if (!missing.length) return;
    add('SU-263', 'info', 'The small finishes are on', document.documentElement, `missing finishes: ${missing.join('; ')}`,
      'html { scrollbar-gutter: stable; accent-color: <accent> } ::selection { background: <accent tint> } input, textarea { caret-color: <accent> } dialog, .drawer, .scroll-panel { overscroll-behavior: contain }');
  }
  REGISTERED = [...REGISTERED, ['gradients', () => checkGradients()], ['display type', () => checkDisplayType()],
    ['image sharpness', () => checkImageSharpness()], ['logo rows', () => checkLogoRows()], ['small finishes', (context) => checkFinishes(context)]];
