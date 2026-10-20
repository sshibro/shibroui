  // ---------- RTL, truncation and script typography (SU-197, SU-200, SU-201) ----------
  const LAYOUT_INTL = { clipSlack: 1, maxExamples: 3 };
  const ARABIC_SCRIPT_LANG = /^(ar|fa|ur)(-|$)/i;
  const PHYSICAL_PROPERTY = /^(margin|padding)-(left|right)$|^border-(left|right)(-(width|style|color))?$|^(left|right)$/;
  const PHYSICAL_VALUE_PROPERTY = /^(text-align|float|clear)$/;
  const ACTION_OR_ERROR = 'button, [role=button], [role=alert], label';

  function layoutPageIsRtl() {
    return !!document.querySelector('[dir=rtl]') || css(document.documentElement).direction === 'rtl' || css(document.body).direction === 'rtl';
  }
  // Declarations as written (cssText keeps shorthands), minus a left/right pair that is symmetric.
  function layoutPhysicalDeclarations(rule) {
    const declarations = (rule.style.cssText || '').split(';').map((d) => d.split(/:(.+)/).map((s) => (s || '').trim().toLowerCase())).filter(([name]) => name);
    const physical = declarations.filter(([name, value]) => PHYSICAL_PROPERTY.test(name) || (PHYSICAL_VALUE_PROPERTY.test(name) && /^(left|right)$/.test(value)));
    const sideless = (name) => name.replace(/left|right/, '*');
    return physical.filter(([name, value]) => !physical.some(([other, otherValue]) => other !== name && sideless(other) === sideless(name) && otherValue === value));
  }
  function checkPhysicalCss({ rules }) {
    if (!layoutPageIsRtl()) return;
    checked('RTL page: CSS direction scan');
    const found = [];
    for (const { rule } of rules) {
      const selector = rule.selectorText || '';
      if (/dir=|:dir\(|:lang\(/.test(selector)) continue;
      for (const [name] of layoutPhysicalDeclarations(rule)) found.push(`${selector} (${name})`);
    }
    if (!found.length) return;
    add('SU-197', 'warn', 'Direction-agnostic CSS', null, `${found.length} physical-direction declarations on an RTL page; use logical properties (margin-inline-start…)`,
      `margin-inline-start / padding-inline-end / inset-inline-start / text-align: start; e.g. ${found.slice(0, LAYOUT_INTL.maxExamples).join(', ')}`);
  }

  const layoutTruncated = (el, style) => (style.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + LAYOUT_INTL.clipSlack)
    || ((style.webkitLineClamp || 'none') !== 'none' && el.scrollHeight > el.clientHeight + LAYOUT_INTL.clipSlack);
  function checkTruncation() {
    for (const el of LAYOUT_ALL_ELEMENTS()) {
      if (el.matches('input, textarea, select')) continue;
      if (el.scrollWidth <= el.clientWidth + LAYOUT_INTL.clipSlack && el.scrollHeight <= el.clientHeight + LAYOUT_INTL.clipSlack) continue;
      if (!layoutTruncated(el, css(el)) || !isVisible(el)) continue;
      checked('truncated elements');
      if (el.closest(ACTION_OR_ERROR)) add('SU-200', 'fail', 'Truncation policy', el, 'never truncate actions or errors', 'Let buttons, labels and error messages wrap or grow; shorten the copy instead');
      else if (!el.closest('[title], [aria-label], [aria-describedby]')) add('SU-200', 'warn', 'Truncation policy', el, 'truncated text with no way to read it', 'Expose the full text (title, tooltip on focus, or an expand control), or wrap instead of truncating');
    }
  }

  function checkArabicLetterSpacing() {
    for (const el of LAYOUT_ALL_ELEMENTS()) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) continue;
      const region = el.closest('[lang]');
      if (!region || !ARABIC_SCRIPT_LANG.test(region.getAttribute('lang') || '') || !isVisible(el)) continue;
      checked('Arabic-script text elements');
      const spacing = css(el).letterSpacing;
      if (spacing !== 'normal' && px(spacing) !== 0) add('SU-201', 'warn', 'Script-aware typography', el, `letter-spacing ${spacing} breaks Arabic letter joining`, 'letter-spacing: normal on Arabic, Persian and Urdu text');
    }
  }
  REGISTERED = [...REGISTERED, ['physical CSS on RTL pages', (context) => checkPhysicalCss(context)], ['truncation', () => checkTruncation()], ['Arabic letter-spacing', () => checkArabicLetterSpacing()]];
