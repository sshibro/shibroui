  // ---------- 12. motion in CSS (SU-72, SU-75, SU-78, SU-82, SU-85, SU-86) ----------
  // Routine UI transitions stay ≤ 300ms; big surfaces (modals, drawers, sheets, pages) get up to 500ms.
  const MOTION_LIMITS = { routineMs: 300, panelMs: 500 };
  const PANEL_MOTION = /modal|dialog|drawer|sheet|panel|page|route|overlay|backdrop/i;
  const INTERACTION_STATE = /:hover|:active|:focus|\[aria-pressed|\[aria-expanded|\.is-active|\[data-state/;
  const EASE_IN_MIN_X1 = 0.4;
  const EASE_IN_MAX_Y1 = 0.1;
  const EASE_OUT_END = { minY2: 0.9, maxX2: 0.8 };
  function collectRules() {
    const rules = [];
    const keyframes = [];
    let reduced = false;
    const walk = (list, inReduced) => {
      for (const rule of list) {
        if (rule instanceof CSSKeyframesRule) keyframes.push(rule);
        else if (rule instanceof CSSMediaRule) {
          const isReduced = /prefers-reduced-motion/.test(rule.conditionText || rule.media.mediaText);
          reduced = reduced || isReduced;
          walk(rule.cssRules, inReduced || isReduced);
        } else if (rule instanceof CSSStyleRule) {
          rules.push({ rule, inReduced });
          if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules, inReduced);
        } else if (rule.cssRules) walk(rule.cssRules, inReduced);
      }
    };
    for (const sheet of document.styleSheets) {
      try { walk(sheet.cssRules, false); } catch { notes.push(`Skipped a cross-origin stylesheet: ${sheet.href}`); }
    }
    return { rules, keyframes, reduced };
  }
  // Timing functions of a rule, with var(--ease-*) tokens resolved from :root (a transition shorthand with var() has no longhand).
  function timingText(style) {
    const text = style.transitionTimingFunction || (style.transition || '');
    const rootStyle = css(document.documentElement);
    return text.replace(/var\(\s*(--[\w-]+)[^)]*\)/g, (_, name) => rootStyle.getPropertyValue(name).trim());
  }
  // An ease-in curve starts slow and keeps accelerating: keyword ease-in, or cubic-bezier(x1 ≥ .4, y1 ≤ .1) that does not
  // flatten out at the end (that shape is ease-in-out, which is fine for a short move).
  function usesEaseIn(timing) {
    if (/(^|[\s,])ease-in(?![\w-])/.test(timing)) return true;
    return [...timing.matchAll(/cubic-bezier\(\s*([^)]*)\)/g)].some((match) => {
      const [x1, y1, x2, y2] = match[1].split(',').map(parseFloat);
      const decelerates = y2 >= EASE_OUT_END.minY2 && x2 <= EASE_OUT_END.maxX2;
      return x1 >= EASE_IN_MIN_X1 && y1 <= EASE_IN_MAX_Y1 && !decelerates;
    });
  }
  const durations = (value) => (value || '').split(',').map((v) => (v.trim().endsWith('ms') ? px(v) : px(v) * 1000)).filter((v) => v > 0);
  function checkMotion({ rules, keyframes, reduced }) {
    let usesMotion = false;
    for (const { rule, inReduced } of rules) {
      if (inReduced) continue;
      const s = rule.style;
      const selector = rule.selectorText || '';
      const loader = /spin|load|skeleton|marquee|progress|shimmer|pulse/i.test(`${selector} ${s.animationName}`);
      const transitionMs = s.transitionProperty === 'none' ? [] : durations(s.transitionDuration);
      const animated = s.animationName && s.animationName !== 'none';
      if (transitionMs.length || animated) usesMotion = true;
      const longest = Math.max(0, ...transitionMs, ...(animated && s.animationIterationCount !== 'infinite' ? durations(s.animationDuration) : []));
      const panel = PANEL_MOTION.test(selector);
      const limit = panel ? MOTION_LIMITS.panelMs : MOTION_LIMITS.routineMs;
      if (!loader && longest > limit) {
        add('SU-85', 'warn', 'Timing', null, `${selector}: ${longest}ms (limit ${limit}ms)`,
          panel ? `Keep modals, drawers, sheets and page transitions ≤ ${MOTION_LIMITS.panelMs}ms` : `Keep routine UI transitions ≤ ${MOTION_LIMITS.routineMs}ms (micro ≤ 200ms)`);
      }
      const moves = /transform|translate|scale|rotate|left|top|right|bottom|inset|margin|width|height|all/.test(s.transitionProperty || 'all');
      if (!loader && transitionMs.length && moves && /(^|,|\s)linear(\s|,|$)/.test(s.transitionTimingFunction)) add('SU-82', 'warn', 'Easing', null, `${selector}: linear easing on movement`, 'ease-out to enter, ease-in to exit, ease-in-out to move');
      if (!loader && INTERACTION_STATE.test(selector) && usesEaseIn(timingText(s))) add('SU-82', 'warn', 'Easing', null, `${selector}: ease-in on an interaction`, 'ease-in on an interaction feels sluggish; use ease-out (or a short ease-in-out)');
      if (/:active/.test(selector)) {
        const scale = (s.transform.match(/scale\(\s*([\d.]+)/) || [])[1] || s.scale;
        if (scale && px(scale) > 0 && px(scale) < LIMITS.pressScaleMin) add('SU-72', 'warn', 'Press feedback', null, `${selector}: scale(${px(scale)})`, 'Pressed scale 0.95–0.98');
        const base = selector.replace(/:active/g, '').trim();
        const baseRule = rules.find(({ rule: r }) => r.selectorText === base);
        const pressMs = baseRule ? Math.max(0, ...durations(baseRule.rule.style.transitionDuration)) : 0;
        if (pressMs > LIMITS.pressMs) add('SU-72', 'warn', 'Press feedback', null, `${base}: press transition ${pressMs}ms`, 'About 200ms');
      }
      if (animated && /\[(data-)?(open|state)|\.(is-)?(open|show|visible|active|expanded|enter)|:popover-open|\[open\]/i.test(selector)) add('SU-75', 'info', 'Interruptible transitions', null, `${selector}: opens with @keyframes ${s.animationName}`, 'Use transitions or springs so closing mid-way reverses from the current state');
    }
    for (const frames of keyframes) {
      const offsets = [...frames.cssRules].map((k) => px((k.style.transform.match(/translateX\(\s*(-?[\d.]+)px/) || [])[1]));
      const flips = offsets.filter((v, i) => i > 0 && Math.sign(v) !== Math.sign(offsets[i - 1]) && v !== 0).length;
      const amplitude = Math.max(0, ...offsets.map(Math.abs));
      if (flips >= 2 && amplitude > LIMITS.shakePx) add('SU-86', 'warn', 'Noticeable errors', null, `@keyframes ${frames.name} shakes ±${amplitude}px`, 'About ±4px, once, ~240ms');
    }
    if (usesMotion && !reduced) add('SU-78', 'warn', 'Reduced motion', null, 'transitions/animations without a prefers-reduced-motion rule', '@media (prefers-reduced-motion: reduce) { … }');
  }

