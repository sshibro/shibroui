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

