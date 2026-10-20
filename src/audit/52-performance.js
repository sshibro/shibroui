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
