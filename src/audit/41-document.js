
  // ---------- landmarks, language, title and ARIA validity (SU-138, SU-139, SU-142) ----------
  const SEM_SKIP_LINK_MIN_PRECEDING = 5;
  const SEM_GENERIC_TITLE = /^(document|untitled|react app|vite \+ \w+|home|index)$/i;
  const SEM_LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i;
  const SEM_ID_REFERENCES = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-errormessage', 'aria-owns'];
  const SEM_TABBABLE = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex], [contenteditable]';
  // Reachable with Tab: tabindex >= 0, enabled, and rendered (a hidden-until-focus skip link still counts).
  const semIsTabbable = (el) => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert]')
    && css(el).visibility !== 'hidden' && el.getClientRects().length > 0;

  function checkLandmarks() {
    if (ROOT !== document.body) { skipped('landmarks (audit is scoped to a region or a modal)'); return; }
    const mains = [...document.querySelectorAll('main, [role=main]')].filter((main) => !main.hidden && css(main).display !== 'none');
    checked('main landmarks', mains.length);
    if (mains.length !== 1) {
      const detail = mains.length ? `${mains.length} main landmarks (a page has exactly one)` : 'no main landmark';
      add('SU-138', 'fail', 'Landmarks and skip link', mains[1] || document.body, detail, 'Wrap the page\'s primary content in a single <main>');
    }
    if (!mains.length) return;
    const tabbable = [...document.querySelectorAll(SEM_TABBABLE)].slice(0, LIMITS.maxElements).filter(semIsTabbable);
    const before = tabbable.filter((el) => !mains[0].contains(el) && (mains[0].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING));
    if (before.length < SEM_SKIP_LINK_MIN_PRECEDING) return;
    const target = tabbable[0].matches('a[href^="#"]') && tabbable[0].getAttribute('href').length > 1 && document.getElementById(decodeURIComponent(tabbable[0].getAttribute('href').slice(1)));
    if (!target) add('SU-138', 'warn', 'Landmarks and skip link', tabbable[0], `${before.length} focusable elements come before <main> and the first one is not a skip link`, 'First focusable: <a href="#main">Skip to main content</a>, visible on focus, pointing at <main id="main">');
  }

  function checkDocument() {
    const root = document.documentElement;
    const lang = (root.getAttribute('lang') || '').trim();
    if (!lang) add('SU-139', 'fail', 'Language and title', root, '<html> has no lang attribute', '<html lang="en"> so screen readers pick the right voice');
    else if (!SEM_LANGUAGE_TAG.test(lang)) add('SU-139', 'fail', 'Language and title', root, `lang="${lang}" is not a valid language tag`, 'Use a BCP 47 tag such as "en", "en-GB" or "pt-BR"');
    const title = semClean(document.title);
    if (!title) add('SU-139', 'fail', 'Language and title', document.head, 'document has no title', '<title>Page - Product</title>, updated on every client-side route');
    else if (SEM_GENERIC_TITLE.test(title)) add('SU-139', 'warn', 'Language and title', document.head, `title "${title}" is generic`, 'Name the page and the product: "Billing - Northstar"');
  }

  function checkAriaValidity() {
    for (const el of ROOT.querySelectorAll('[tabindex]')) {
      if (parseInt(el.getAttribute('tabindex'), 10) > 0) add('SU-142', 'fail', 'Honest ARIA and native first', el, `tabindex="${el.getAttribute('tabindex')}" overrides the natural focus order`, 'Use tabindex="0" or "-1" only; fix the order in the DOM');
    }
    for (const el of [...ROOT.querySelectorAll(SEM_TABBABLE)].slice(0, LIMITS.maxElements)) {
      if (el.closest('[aria-hidden="true"]') && semIsTabbable(el)) add('SU-142', 'fail', 'Honest ARIA and native first', el, 'focusable element inside aria-hidden="true"', 'Remove aria-hidden, or make the subtree inert (the inert attribute hides it from focus and from assistive tech)');
    }
    for (const el of ROOT.querySelectorAll(SEM_ID_REFERENCES.map((attr) => `[${attr}]`).join(', '))) {
      for (const attr of SEM_ID_REFERENCES) {
        semIdsOf(el, attr).filter((id) => !document.getElementById(id))
          .forEach((id) => add('SU-142', 'fail', 'Honest ARIA and native first', el, `${attr} points at #${id}, which does not exist`, 'Point it at an existing id, or remove the attribute'));
      }
    }
    const seen = new Set();
    for (const el of ROOT.querySelectorAll('[id]')) {
      if (el.id && seen.has(el.id)) add('SU-142', 'warn', 'Honest ARIA and native first', el, `duplicate id "${el.id}"`, 'ids are unique per document; references and labels pick the first match');
      seen.add(el.id);
    }
  }

  REGISTERED = [...REGISTERED, ['landmarks', checkLandmarks], ['language and title', checkDocument], ['aria validity', checkAriaValidity]];
