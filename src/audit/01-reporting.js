  // ---------- reporting ----------
  // tag#id.class.class: names a container in advice without quoting all of its text.
  const selectorOf = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${[...el.classList].slice(0, 2).map((c) => `.${c}`).join('')}`;
  function describe(el) {
    if (!el || !el.tagName) return null;
    const choice = el.matches('input[type=checkbox], input[type=radio]');
    const value = choice ? '' : el.value;
    const text = (el.getAttribute('aria-label') || el.textContent || value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${selectorOf(el)}${text ? ` "${text}"` : ''}`;
  }
  // A unique-enough CSS path so every instance can be found and fixed, not just the first.
  function path(el) {
    if (!el || !el.tagName) return null;
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && parts.length < 4; node = node.parentElement) {
      if (node.id) { parts.unshift(`#${node.id}`); break; }
      const tag = node.tagName.toLowerCase();
      const cls = [...node.classList].slice(0, 2).map((c) => `.${c}`).join('');
      const same = node.parentElement ? [...node.parentElement.children].filter((c) => c.tagName === node.tagName) : [];
      parts.unshift(`${tag}${cls}${same.length > 1 ? `:nth-of-type(${same.indexOf(node) + 1})` : ''}`);
      if (tag === 'body') break;
    }
    return parts.join(' > ');
  }
  // Same rule + same kind of element + same measurement collapse into one finding listing every instance.
  function add(id, level, rule, el, detail, fix) {
    const signature = el && el.tagName ? `${el.tagName}${[...el.classList].join('.')}` : '';
    const key = `${id}|${signature}|${detail}`;
    const existing = findings.get(key);
    const where = path(el);
    if (existing) {
      existing.count += 1;
      if (where && existing.instances.length < LIMITS.maxInstances) existing.instances.push(where);
      return;
    }
    findings.set(key, { id, level, rule, element: describe(el), detail, fix, count: 1, instances: where ? [where] : [] });
  }
  const COVERAGE = { checked: {}, skipped: {}, capsHit: [] };
  const checked = (key, n = 1) => { COVERAGE.checked[key] = (COVERAGE.checked[key] || 0) + n; };
  const skipped = (key) => { COVERAGE.skipped[key] = (COVERAGE.skipped[key] || 0) + 1; };

