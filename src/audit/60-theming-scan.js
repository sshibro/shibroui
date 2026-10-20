  // ---------- theming: stylesheet scan and scheme coverage (SU-165, SU-166) ----------
  const THEMING_RULE_CAP = 30000;
  const DARK_SELECTOR = /\.dark(?![\w-])|\.dark-(?:mode|theme)\b|\.theme-dark|\.is-dark|\[data-(?:theme|mode|color-scheme|bs-theme)(?![^\]]*=\s*["']?light)/i;
  const THEME_ATTRIBUTES = ['data-theme', 'data-mode', 'data-color-scheme', 'data-bs-theme', 'class'];
  const ROOT_SELECTOR = /(^|[\s,>+~])(:root|html|body)(?![\w-])/;
  let themingScanCache = null;
  // Walks every same-origin rule once (media, supports, layers, nesting) and keeps its media conditions.
  function themingScan() {
    if (themingScanCache) return themingScanCache;
    const entries = [];
    const walk = (list, conditions, parentSelector) => {
      for (const rule of list) {
        if (entries.length >= THEMING_RULE_CAP) return;
        if (rule instanceof CSSStyleRule) {
          const own = rule.selectorText || '';
          const selector = !parentSelector ? own : (/&/.test(own) ? own.replace(/&/g, parentSelector) : `${parentSelector} ${own}`);
          entries.push({ rule, selector, conditions });
          if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules, conditions, selector);
        } else if (rule instanceof CSSMediaRule || (typeof CSSSupportsRule !== 'undefined' && rule instanceof CSSSupportsRule)) {
          walk(rule.cssRules, [...conditions, rule.conditionText || (rule.media && rule.media.mediaText) || ''], parentSelector);
        } else if (rule.cssRules) walk(rule.cssRules, conditions, parentSelector);
      }
    };
    for (const sheet of document.styleSheets) {
      try { walk(sheet.cssRules, [], ''); } catch { /* cross-origin sheet: collectRules already noted it */ }
    }
    if (entries.length >= THEMING_RULE_CAP) COVERAGE.capsHit.push(`theming checks read the first ${THEMING_RULE_CAP} CSS rules only`);
    const declaresScheme = entries.some(({ rule, selector }) => {
      const value = rule.style.getPropertyValue('color-scheme').trim();
      return !!value && value !== 'normal' && (ROOT_SELECTOR.test(selector) || DARK_SELECTOR.test(selector));
    });
    themingScanCache = {
      entries,
      declaresScheme,
      darkMedia: entries.some(({ conditions }) => /prefers-color-scheme:\s*dark/.test(conditions.join(' '))),
      darkSelector: entries.some(({ selector }) => DARK_SELECTOR.test(selector)),
      lightDark: entries.some(({ rule }) => /light-dark\(/.test(rule.cssText)),
    };
    return themingScanCache;
  }
  const hasDarkStyles = (scan) => scan.darkMedia || scan.darkSelector || scan.lightDark;
  // Which scheme this run is in: an explicit theme attribute or class wins, then color-scheme, then the OS preference.
  function currentScheme() {
    const attributes = [document.documentElement, document.body].filter(Boolean)
      .flatMap((el) => THEME_ATTRIBUTES.map((name) => el.getAttribute(name) || '')).join(' ');
    if (/dark/i.test(attributes)) return 'dark';
    if (/(^|[\s-])light/i.test(attributes)) return 'light';
    const scheme = css(document.documentElement).colorScheme || '';
    if (/\bdark\b/.test(scheme) && !/\blight\b/.test(scheme)) return 'dark';
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  REGISTERED = [...REGISTERED, ['theming schemes', () => {
    const scan = themingScan();
    const darkStylesFound = hasDarkStyles(scan);
    const current = currentScheme();
    COVERAGE.schemes = { current, darkStylesFound, toAudit: darkStylesFound ? [current === 'dark' ? 'light' : 'dark'] : [] };
    if (darkStylesFound) notes.push('Dark styles exist: re-run the audit in the other scheme (emulate prefers-color-scheme or set the theme attribute).');
  }]];

  // SU-166 · warn: dark styles exist but nothing sets color-scheme, so native controls and scrollbars stay light.
  REGISTERED = [...REGISTERED, ['color-scheme declared', () => {
    const scan = themingScan();
    if (!hasDarkStyles(scan)) return;
    checked('color-scheme');
    const computed = css(document.documentElement).colorScheme;
    const unset = !computed || computed === 'normal';
    if (!unset || scan.declaresScheme || document.querySelector('meta[name="color-scheme"]')) return;
    add('SU-166', 'warn', 'Scheme switching', null, ':root has dark styles but color-scheme is normal (no meta color-scheme either)',
      'Set :root { color-scheme: light dark } so form controls and scrollbars follow the theme');
  }]];
