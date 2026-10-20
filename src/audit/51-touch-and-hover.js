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
