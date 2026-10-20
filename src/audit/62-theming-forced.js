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
