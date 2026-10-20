
  // ---------- accessible names and non-text content (SU-140, SU-141) ----------
  const SEM_NAMED_CONTROLS = 'button, a[href], summary, [role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=radio], [role=switch], [role=option], input[type=button], input[type=submit], input[type=reset], input[type=image], input[type=checkbox], input[type=radio]';
  const SEM_NAME_FROM_CONTENT = 'button, a, summary, [role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=radio], [role=switch], [role=option]';
  const SEM_LABEL_IN_NAME_MIN_CHARS = 2;
  const SEM_DECORATIVE_ROLES = /^(presentation|none)$/;
  // The copy checks (generic errors, vague button words, title case) match English phrases only.
  const semIsEnglish = (el) => /^(en\b|$)/i.test(((el.closest('[lang]') || document.documentElement).getAttribute('lang') || '').trim());
  const semClean = (text) => (text || '').replace(/\s+/g, ' ').trim();
  const semWords = (text) => semClean(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const semIdsOf = (el, attr) => (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean);
  const semRole = (el) => el.getAttribute('role') || el.tagName.toLowerCase();
  // Text a node contributes to a name. Controls inside it add nothing; aria-hidden and hidden subtrees are skipped
  // (except for the node an aria-labelledby points at, which may be hidden on purpose).
  function semText(node, isRoot = false) {
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType !== 1 || /^(SCRIPT|STYLE|TEMPLATE|INPUT|SELECT|TEXTAREA)$/.test(node.tagName)) return '';
    if (!isRoot && (node.getAttribute('aria-hidden') === 'true' || node.hidden || css(node).display === 'none')) return '';
    const own = node.getAttribute('aria-label');
    if (own && !isRoot) return ` ${own} `;
    if (node.tagName === 'IMG') return node.getAttribute('alt') || '';
    if (node.localName === 'svg') return semClean(own) || (node.querySelector(':scope > title') || { textContent: '' }).textContent;
    return [...node.childNodes].map((child) => semText(child)).join('');
  }
  const semLabelText = (el) => semClean([...(el.labels || [])].map((label) => semText(label, true)).join(' '));
  // Simplified accessible-name computation: where the name comes from matters (a placeholder is not a label, SU-148).
  function semName(el) {
    const labelledby = semIdsOf(el, 'aria-labelledby').map((id) => document.getElementById(id)).filter(Boolean)
      .map((node) => semClean(semText(node, true))).filter(Boolean).join(' ');
    if (labelledby) return { name: labelledby, source: 'aria-labelledby' };
    const ariaLabel = semClean(el.getAttribute('aria-label'));
    if (ariaLabel) return { name: ariaLabel, source: 'aria-label' };
    const label = semLabelText(el);
    if (label) return { name: label, source: 'label' };
    if (el.matches('input[type=image]') && semClean(el.getAttribute('alt'))) return { name: semClean(el.getAttribute('alt')), source: 'alt' };
    if (el.matches('input[type=button], input[type=submit], input[type=reset]')) {
      const value = el.hasAttribute('value') ? semClean(el.getAttribute('value')) : { submit: 'Submit', reset: 'Reset' }[el.type] || '';
      if (value) return { name: value, source: 'value' };
    }
    const content = el.matches(SEM_NAME_FROM_CONTENT) ? semClean(semText(el, true)) : '';
    if (content) return { name: content, source: 'content' };
    const title = semClean(el.getAttribute('title'));
    if (title) return { name: title, source: 'title' };
    const placeholder = el.matches('input, textarea') ? semClean(el.getAttribute('placeholder')) : '';
    return placeholder ? { name: placeholder, source: 'placeholder' } : { name: '', source: null };
  }

  function checkNames() {
    for (const el of [...ROOT.querySelectorAll(SEM_NAMED_CONTROLS)].slice(0, LIMITS.maxElements)) {
      if (!isVisible(el) || el.closest('[aria-hidden="true"]')) continue;
      checked('accessible names');
      const { name, source } = semName(el);
      if (!name) {
        add('SU-140', 'fail', 'Accessible name', el, `${semRole(el)} has no accessible name`, 'Add visible text, or aria-label / aria-labelledby that says what it does ("Close", not the icon)');
        continue;
      }
      if (source !== 'aria-label' && source !== 'aria-labelledby') continue;
      const visible = semWords(el.innerText);
      if (visible.length >= SEM_LABEL_IN_NAME_MIN_CHARS && !semWords(name).includes(visible)) {
        add('SU-140', 'warn', 'Accessible name', el, `visible text "${semClean(el.innerText).slice(0, 30)}" is not part of its accessible name "${name.slice(0, 30)}"`, 'Start the aria-label with the visible text so voice control ("click Search products") still works');
      }
    }
  }

  function checkImages() {
    for (const img of ROOT.querySelectorAll('img:not([alt])')) {
      if (!isVisible(img) || img.closest('[aria-hidden="true"]') || SEM_DECORATIVE_ROLES.test(img.getAttribute('role') || '')) continue;
      add('SU-141', 'fail', 'Non-text content', img, 'image has no alt attribute', 'alt="…" describing what it shows, or alt="" when it is decorative');
    }
    for (const svg of ROOT.querySelectorAll('svg[role=img]')) {
      if (!isVisible(svg) || svg.closest('[aria-hidden="true"]')) continue;
      const named = semIdsOf(svg, 'aria-labelledby').length || semClean(svg.getAttribute('aria-label')) || svg.querySelector(':scope > title');
      if (!named) add('SU-141', 'warn', 'Non-text content', svg, 'svg with role="img" has no accessible name', 'aria-label, aria-labelledby or a <title> child; use aria-hidden="true" when decorative');
    }
  }

  REGISTERED = [...REGISTERED, ['accessible names', checkNames], ['non-text content', checkImages]];
