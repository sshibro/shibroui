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
  // Same rule + same kind of element + same kind of measurement collapse into one finding listing every
  // instance. Numbers are left out of the key, so a 20px and a 22px icon with the same problem are one
  // finding (one fix); the other measured values are kept in `variants` and appended to the detail.
  const MAX_VARIANTS = 4;
  const detailShape = (detail) => String(detail || '').replace(/\d+(\.\d+)?/g, '#');
  function add(id, level, rule, el, detail, fix) {
    const signature = el && el.tagName ? `${el.tagName}${[...el.classList].join('.')}` : '';
    const key = `${id}|${level}|${signature}|${detailShape(detail)}`;
    const existing = findings.get(key);
    const where = path(el);
    if (existing) {
      existing.count += 1;
      if (where && existing.instances.length < LIMITS.maxInstances) existing.instances.push(where);
      if (detail !== existing.detail && !existing.variants.includes(detail) && existing.variants.length < MAX_VARIANTS) existing.variants.push(detail);
      return;
    }
    findings.set(key, { id, level, rule, element: describe(el), detail, fix, count: 1, instances: where ? [where] : [], variants: [] });
  }
  // Findings of one rule that share the exact same fix across 2+ kinds of element and 20+ instances have one
  // cause (a missing global focus style, a sticky header without scroll padding): report them as one
  // root-cause finding, with the per-element groups kept in `groups`.
  const ROOT_CAUSE = { minKinds: 2, minInstances: 20 };
  function foldRootCauses(list) {
    const byFix = new Map();
    for (const f of list) {
      if (!f.fix) continue;
      const key = `${f.id}|${f.level}|${f.fix}`;
      byFix.set(key, [...(byFix.get(key) || []), f]);
    }
    const folded = new Set();
    const merged = [];
    for (const group of byFix.values()) {
      const total = group.reduce((sum, f) => sum + f.count, 0);
      if (group.length < ROOT_CAUSE.minKinds || total < ROOT_CAUSE.minInstances) continue;
      group.forEach((f) => folded.add(f));
      const [first] = group;
      merged.push({ ...first, element: `${group.length} kinds of element`, rootCause: true,
        detail: `${total} instances across ${group.length} kinds of element share one fix: ${first.detail}`,
        count: total, instances: group.flatMap((f) => f.instances).slice(0, LIMITS.maxInstances), variants: [],
        groups: group.map((f) => ({ element: f.element, count: f.count, detail: f.detail })) });
    }
    return [...list.filter((f) => !folded.has(f)), ...merged];
  }
  // The public shape: the first detail plus the other measured values; `instancesSampled` when the list is capped.
  const finalizeFinding = ({ variants, ...f }) => ({
    ...f, detail: variants && variants.length ? `${f.detail} (also: ${variants.join('; ')})` : f.detail,
    ...(f.count > f.instances.length ? { instancesSampled: true } : {}),
  });
  const COVERAGE = { checked: {}, skipped: {}, capsHit: [] };
  const checked = (key, n = 1) => { COVERAGE.checked[key] = (COVERAGE.checked[key] || 0) + n; };
  const skipped = (key) => { COVERAGE.skipped[key] = (COVERAGE.skipped[key] || 0) + 1; };

