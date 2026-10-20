// shibroUI audit: evaluate this whole file in a rendered page; it returns a JSON report.
// It is deliberately one expression (no imports, no exports) so any browser tool can run it:
//   built-in / Chrome browser tools → run the contents as-is
//   Playwright MCP                  → browser_evaluate with `() => <contents>`
// Optional scope: window.__shibroAudit = { root: 'main', maxFindings: 400 } before running.
// Every finding lists all of its instances (CSS paths) and `coverage` says what was checked, what was
// skipped and why, and which hidden states (tabs, menus, dialogs, accordions) still need a run.
(() => {
  const VERSION = '0.2.0';
  const OPTIONS = { root: null, maxFindings: 400, ...(window.__shibroAudit || {}) };
  // Reassigned once at run time: while a modal is open the page behind it is inert, so only the modal is audited.
  let ROOT = (OPTIONS.root && document.querySelector(OPTIONS.root)) || document.body;
  const LIMITS = {
    textAA: 4.5, textLarge: 3, largePx: 24, largeBoldPx: 18.66, fieldBoundary: 1.06,
    target: 44, targetFloor: 24, targetGap: 8, heightTolerance: 1, radiusTolerance: 3,
    measureHigh: 80, measureLow: 35, leadingLow: 1.3, leadingHigh: 2.1, minReadingPx: 13,
    pressScaleMin: 0.94, routineMs: 500, pressMs: 300, shakePx: 12, maxElements: 6000,
    maxFocus: 800, maxInstances: 40,
  };
  const INTERACTIVE = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [role=option], [tabindex]:not([tabindex="-1"])';
  const TEXT_FIELD = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]), select, textarea';
  const findings = new Map();
  const notes = [];
  const css = (el) => getComputedStyle(el);
  const px = (value) => parseFloat(value) || 0;

  // ---------- reporting ----------
  function describe(el) {
    if (!el || !el.tagName) return null;
    const id = el.id ? `#${el.id}` : '';
    const classes = [...el.classList].slice(0, 2).map((c) => `.${c}`).join('');
    const choice = el.matches('input[type=checkbox], input[type=radio]');
    const value = choice ? '' : el.value;
    const text = (el.getAttribute('aria-label') || el.textContent || value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${classes}${text ? ` "${text}"` : ''}`;
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

  // ---------- visibility & geometry ----------
  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const style = css(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    }
    const style = css(el);
    return !(style.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(style.clipPath));
  }
  const inViewport = (r) => r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
  function reveal(el) {
    if (!inViewport(el.getBoundingClientRect())) el.scrollIntoView({ block: 'center', inline: 'center' });
    return el.getBoundingClientRect();
  }
  const isDisabled = (el) => !!el.closest(':disabled, [aria-disabled="true"], [inert]');

  // ---------- color ----------
  const canvas = Object.assign(document.createElement('canvas'), { width: 1, height: 1 });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const colorCache = new Map();
  function parseColor(value) {
    if (!value) return { r: 0, g: 0, b: 0, a: 0 };
    if (colorCache.has(value)) return colorCache.get(value);
    const match = value.match(/^rgba?\(([^)]+)\)$/);
    let color;
    if (match) {
      const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
      color = { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    } else {
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      color = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    }
    colorCache.set(value, color);
    return color;
  }
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a), a: 1,
  });
  const linear = (channel) => { const c = channel / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const luminance = (c) => 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
  const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const hex = (c) => `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  function pageCanvas() {
    const scheme = css(document.documentElement).colorScheme || '';
    const dark = /dark/.test(scheme) && (!/light/.test(scheme) || matchMedia('(prefers-color-scheme: dark)').matches);
    return dark ? { r: 18, g: 18, b: 18, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
  }
  const gradientStops = (image) => (image.match(/rgba?\([^)]+\)/g) || []).map(parseColor);

  // Backdrop behind a point: paint-order stack first (catches positioned siblings), ancestors as fallback.
  function backdropAt(el, x, y) {
    const layers = [];
    let image = null;
    let stops = null;
    const visit = (node) => {
      const style = css(node);
      if (style.backgroundImage !== 'none') {
        if (/url\(/.test(style.backgroundImage)) image = image || node;
        else stops = stops || gradientStops(style.backgroundImage);
      }
      if (/^(IMG|VIDEO|CANVAS|IFRAME|PICTURE)$/.test(node.tagName) && node !== el) { image = image || node; return true; }
      const bg = parseColor(style.backgroundColor);
      if (bg.a > 0) layers.push(bg);
      return bg.a >= 0.999 || !!image;
    };
    const stack = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight ? document.elementsFromPoint(x, y) : [];
    const index = stack.indexOf(el);
    if (index >= 0) {
      const covering = stack.slice(0, index).some((n) => !el.contains(n) && parseColor(css(n).backgroundColor).a > 0.05);
      if (covering) return { covered: true };
      for (const node of stack.slice(index)) if (visit(node)) break;
    } else {
      for (let node = el; node && node.nodeType === 1; node = node.parentElement) if (visit(node)) break;
    }
    const base = layers.reduceRight((acc, layer) => over(layer, acc), pageCanvas());
    return { color: base, image, stops: stops && stops.length ? stops.map((s) => over(s, base)) : null };
  }
  function effectiveOpacity(el) {
    let value = 1;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) value *= px(css(node).opacity) || (css(node).opacity === '0' ? 0 : 1);
    return value;
  }
  const hasBoundary = (el) => {
    const s = css(el);
    const border = ['Top', 'Right', 'Bottom', 'Left'].some((side) => px(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none' && parseColor(s[`border${side}Color`]).a > 0);
    return parseColor(s.backgroundColor).a > 0.05 || border || s.boxShadow !== 'none' || s.backgroundImage !== 'none';
  };

  // ---------- 1. text contrast (SU-45, SU-46, SU-49) ----------
  function checkTextContrast() {
    const walker = document.createTreeWalker(ROOT, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const owners = new Map();
    while (walker.nextNode() && owners.size < LIMITS.maxElements) {
      const parent = walker.currentNode.parentElement;
      if (parent && !owners.has(parent) && !parent.closest('script, style, noscript, template, svg, option, title')) owners.set(parent, walker.currentNode);
    }
    if (owners.size >= LIMITS.maxElements) COVERAGE.capsHit.push(`text contrast stopped at ${LIMITS.maxElements} text elements; scope with window.__shibroAudit = { root } and run per region`);
    for (const [el, textNode] of owners) {
      if (!isVisible(el) || isDisabled(el)) continue;
      reveal(el);
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const box = range.getClientRects()[0];
      if (!box || box.width < 1) continue;
      checked('text elements');
      const style = css(el);
      const size = px(style.fontSize);
      const large = size >= LIMITS.largePx || (size >= LIMITS.largeBoldPx && px(style.fontWeight) >= 700);
      const needed = large ? LIMITS.textLarge : LIMITS.textAA;
      const backdrop = backdropAt(el, box.left + Math.min(box.width / 2, 12), box.top + box.height / 2);
      if (backdrop.covered) { skipped('text covered by an overlay'); continue; }
      const fg = parseColor(style.color);
      const alpha = fg.a * effectiveOpacity(el);
      const id = el.closest('button, [role=button], input[type=submit], input[type=button]') ? 'SU-46' : 'SU-45';
      if (backdrop.image) {
        skipped('text over an image (contrast not measurable)');
        add('SU-49', 'info', 'Text over images', el, 'text sits on an image; contrast cannot be measured', 'Add a scrim (~75% overlay) and check the brightest spot under the text');
        continue;
      }
      const surfaces = backdrop.stops || [backdrop.color];
      const worst = surfaces.map((bg) => ({ bg, value: ratio(over({ ...fg, a: alpha }, bg), bg) })).sort((a, b) => a.value - b.value)[0];
      if (worst.value < needed) {
        add(id, 'fail', id === 'SU-46' ? 'Button contrast' : 'Text contrast', el,
          `${hex(fg)}${alpha < 1 ? ` @${alpha.toFixed(2)}` : ''} on ${hex(worst.bg)} = ${worst.value.toFixed(2)}:1 (needs ≥ ${needed}:1${large ? ', large text' : ''})`,
          `node scripts/contrast.mjs '${hex(fg)}' '${hex(worst.bg)}' --fix`);
      }
    }
  }

  // ---------- 2. field visibility (SU-44) ----------
  function checkFields() {
    for (const field of ROOT.querySelectorAll(TEXT_FIELD)) {
      if (!isVisible(field) || !field.parentElement) continue;
      checked('form fields');
      const rect = reveal(field);
      const behind = backdropAt(field.parentElement, rect.left - 1, rect.top - 1);
      if (behind.covered || behind.image) { skipped('field surface not measurable'); continue; }
      const surface = behind.color;
      const s = css(field);
      const fill = over(parseColor(s.backgroundColor), surface);
      const borderRatios = ['Top', 'Right', 'Bottom', 'Left']
        .filter((side) => px(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none')
        .map((side) => ratio(over(parseColor(s[`border${side}Color`]), fill), surface));
      const best = Math.max(ratio(fill, surface), ...borderRatios, s.boxShadow !== 'none' ? 99 : 1);
      if (best < LIMITS.fieldBoundary) {
        add('SU-44', 'fail', 'Input contrast', field, `field fill and border are ${best.toFixed(2)}:1 against ${hex(surface)}`, 'Give the field its own shade and a visible border');
      }
    }
  }

  // ---------- 3. targets (SU-61–65, SU-63, SU-69) ----------
  const targetsList = () => [...ROOT.querySelectorAll(INTERACTIVE)].filter((el) => isVisible(el) && !isDisabled(el));
  // A link inside running text: its block holds real non-link words (a nav of bare links does not).
  function isInlineLink(el) {
    if (el.tagName !== 'A' || css(el).display !== 'inline') return false;
    const block = el.parentElement;
    if (!block) return false;
    const linkText = [...block.querySelectorAll('a')].reduce((sum, a) => sum + a.textContent.trim().length, 0);
    const prose = block.textContent.replace(/[\s·|•–—/,]+/g, ' ').trim().length - linkText;
    return prose >= 12;
  }
  // True when `node` belongs to an absolutely/fixed positioned layer that isn't an ancestor of `el`.
  function overlayOver(node, el) {
    for (let n = node; n && n !== document.body; n = n.parentElement) {
      if (n.contains(el)) return false;
      if (/absolute|fixed/.test(css(n).position) && !n.contains(el)) return true;
    }
    return false;
  }
  // Samples a circle of the given diameter around the center (rounded corners don't count against it).
  // Returns true / false, or null when the target can't be brought on screen (e.g. an unfocused skip link).
  function covers(el, related, size) {
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) return null;
    const [cx, cy, radius] = [r.left + r.width / 2, r.top + r.height / 2, size / 2 - 0.5];
    const points = Array.from({ length: 8 }, (_, i) => [cx + Math.cos((i * Math.PI) / 4) * radius, cy + Math.sin((i * Math.PI) / 4) * radius]);
    let known = 0;
    for (const [x, y] of points) {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      known += 1;
      const top = document.elementFromPoint(x, y);
      if (top && (el.contains(top) || related.some((n) => n.contains(top)))) continue;
      // A probe landing on an open dropdown/popover/drawer says nothing about this target's own hit area.
      if (top && overlayOver(top, el)) { known -= 1; continue; }
      return false;
    }
    return known > 0 ? true : null;
  }
  // WCAG 2.5.8 spacing exception: an undersized target is acceptable when a 24px circle on its
  // center stays clear of every other target.
  function spacedEnough(el, targets) {
    const r = el.getBoundingClientRect();
    const [cx, cy] = [r.left + r.width / 2, r.top + r.height / 2];
    return targets.every((other) => {
      if (other === el || other.contains(el) || el.contains(other)) return true;
      const o = other.getBoundingClientRect();
      const dx = Math.max(o.left - cx, 0, cx - o.right);
      const dy = Math.max(o.top - cy, 0, cy - o.bottom);
      return Math.hypot(dx, dy) >= LIMITS.targetFloor / 2;
    });
  }
  function checkTargets(targets) {
    for (const el of targets) {
      if (isInlineLink(el)) continue;
      const parentTarget = el.parentElement && el.parentElement.closest(INTERACTIVE);
      if (parentTarget && ROOT.contains(parentTarget)) continue;
      const related = el.labels ? [...el.labels].filter(isVisible) : [];
      if (el.matches('input[type=checkbox], input[type=radio]') && related.length) continue; // label rows are SU-50's job
      const rect = reveal(el);
      checked('interactive targets');
      const isField = el.matches(TEXT_FIELD);
      if (isField && rect.height >= 32) continue;
      // A target under an open dropdown or popover isn't reachable right now; it's audited in the closed state.
      const centerHit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (centerHit && !el.contains(centerHit) && !related.some((n) => n.contains(centerHit)) && !centerHit.contains(el)) { skipped('target covered by an overlay'); continue; }
      const coverage = covers(el, related, LIMITS.target);
      if (coverage === null) { skipped('target off-screen (not measurable)'); continue; }
      if (coverage) continue;
      const closeish = /close|dismiss|×|✕/i.test(el.getAttribute('aria-label') || el.textContent || '');
      const id = closeish ? 'SU-65' : el.textContent.trim().length > 2 ? 'SU-62' : 'SU-61';
      const size = `${Math.round(rect.width)}×${Math.round(rect.height)}px`;
      const meetsFloor = covers(el, related, LIMITS.targetFloor) === true || spacedEnough(el, targets);
      add(id, meetsFloor ? 'warn' : 'fail', 'Target size', el,
        `hit area ${size} does not cover ${LIMITS.target}px${meetsFloor ? '' : ` and is under ${LIMITS.targetFloor}px with crowded neighbours`}`,
        'Extend the hit area with padding or an invisible ::before (inset: -10px) without enlarging the visible control');
    }
    const outer = targets.filter((el) => !isInlineLink(el) && hasBoundary(el) && !el.matches(TEXT_FIELD));
    for (let i = 0; i < outer.length; i += 1) {
      for (let j = i + 1; j < outer.length; j += 1) {
        const [a, b] = [outer[i], outer[j]];
        if (a.contains(b) || b.contains(a) || a.closest('[role=tablist], [role=radiogroup]') && a.closest('[role=tablist], [role=radiogroup]') === b.closest('[role=tablist], [role=radiogroup]')) continue;
        const [ra, rb] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
        const dx = Math.max(rb.left - ra.right, ra.left - rb.right);
        const dy = Math.max(rb.top - ra.bottom, ra.top - rb.bottom);
        const sameRow = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top) > Math.min(ra.height, rb.height) / 2;
        const sameColumn = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left) > Math.min(ra.width, rb.width) / 2;
        if (dx < 0 && dy < 0) add('SU-69', 'fail', 'Room to click', a, `overlaps ${describe(b)}`, 'Separate the targets; each point should belong to one action');
        else if ((sameRow && dx >= 0 && dx < LIMITS.targetGap) || (sameColumn && dy >= 0 && dy < LIMITS.targetGap)) {
          add('SU-63', 'warn', 'Target spacing', a, `only ${Math.round(sameRow ? dx : dy)}px from ${describe(b)}`, `Leave ≥ ${LIMITS.targetGap}px (12px comfortable) between neighbouring targets`);
        }
      }
    }
  }

  // ---------- 4. focus visibility (SU-70) ----------
  // A background tab never paints focus styles, so without document focus this reads the CSS instead.
  const RING_FIX = ':focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }';
  const removesOutline = (style) => style.outlineStyle === 'none' || style.outlineWidth === '0px' || /^(none|0(px)?)(\s|$)/.test((style.outline || '').trim());
  const drawsRing = (style) => (!!style.outlineStyle && style.outlineStyle !== 'none' && style.outlineWidth !== '0px')
    || /solid|dashed|dotted|double|auto/.test(style.outline || '') || (!!style.boxShadow && style.boxShadow !== 'none');
  const ringWidth = (style) => px(style.outlineWidth) || px(((style.outline || '').match(/(\d+(?:\.\d+)?)px/) || [])[1]) || (style.boxShadow && style.boxShadow !== 'none' ? 2 : 1);
  function staticFocus(el, rules) {
    let removed = false;
    let ring = null;
    for (const { rule } of rules) {
      for (const part of (rule.selectorText || '').split(',')) {
        const focusPart = /:focus/.test(part);
        if (!focusPart && /:(hover|active|checked|disabled|visited)/.test(part)) continue;
        const base = part.replace(/:focus(-visible|-within)?/g, '').trim() || '*';
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
    const live = document.hasFocus();
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

  // ---------- 5. tables & numbers (SU-16, SU-17) ----------
  const AMOUNT = /^[+\-−]?\s?[$€£¥₹]?\s?[+\-−]?\d[\d,.\s ]*\s?(%|[a-zA-Z]{1,3})?$/;
  const isAmount = (text) => { const t = text.trim(); return t.length > 0 && t.length <= 20 && AMOUNT.test(t) && !/\d[/:]\d/.test(t); };
  const tabular = (el) => { const s = css(el); return /tabular-nums/.test(s.fontVariantNumeric) || /"tnum"/.test(s.fontFeatureSettings); };
  function alignment(cell) {
    const s = css(cell);
    const direction = s.direction === 'rtl' ? 'rtl' : 'ltr';
    const inner = cell.firstElementChild && /flex|grid/.test(css(cell.firstElementChild).display) ? css(cell.firstElementChild) : null;
    if (inner && /end|right/.test(inner.justifyContent)) return 'right';
    if (/flex|grid/.test(s.display) && /end|right/.test(s.justifyContent)) return 'right';
    if (s.textAlign === 'end') return direction === 'ltr' ? 'right' : 'left';
    if (s.textAlign === 'start') return direction === 'ltr' ? 'left' : 'right';
    return s.textAlign === 'justify' ? 'left' : s.textAlign;
  }
  function tableRows(table) {
    if (table.tagName === 'TABLE') return [...table.rows].map((row) => ({ head: !!row.closest('thead') || [...row.cells].every((c) => c.tagName === 'TH'), cells: [...row.cells] }));
    return [...table.querySelectorAll('[role=row]')].map((row) => ({
      head: !!row.querySelector('[role=columnheader]'), cells: [...row.querySelectorAll(':scope > [role=cell], :scope > [role=gridcell], :scope > [role=columnheader]')],
    }));
  }
  function checkTables() {
    for (const table of ROOT.querySelectorAll('table, [role=table], [role=grid]')) {
      if (!isVisible(table)) continue;
      checked('tables');
      const rows = tableRows(table);
      const body = rows.filter((r) => !r.head);
      checked('table cells', body.reduce((sum, r) => sum + r.cells.length, 0));
      const header = rows.find((r) => r.head);
      const columns = new Map();
      for (const row of body) row.cells.forEach((cell, index) => {
        const col = columns.get(index) || { amounts: [], texts: [] };
        const text = cell.textContent.trim();
        if (text) (isAmount(text) ? col.amounts : col.texts).push(cell);
        columns.set(index, col);
      });
      for (const [index, col] of columns) {
        const headCell = header && header.cells[index];
        const label = headCell ? `"${headCell.textContent.trim().slice(0, 24)}"` : `#${index + 1}`;
        if (col.amounts.length >= 2 && col.amounts.length >= col.texts.length * 1.5) {
          const misaligned = col.amounts.filter((c) => alignment(c) !== 'right');
          if (misaligned.length) add('SU-17', 'fail', 'Typographic alignment', misaligned[0], `numeric column ${label} is ${alignment(misaligned[0])}-aligned`, 'text-align: right (or end) for comparable amounts');
          else if (headCell && alignment(headCell) !== 'right') add('SU-17', 'warn', 'Typographic alignment', headCell, `header ${label} is ${alignment(headCell)}-aligned over a right-aligned numeric column`, 'Align the header with its column');
          if (!col.amounts.every(tabular)) add('SU-16', 'warn', 'Tabular numbers', col.amounts[0], `numeric column ${label} uses proportional digits`, 'font-variant-numeric: tabular-nums');
        } else if (col.texts.length >= 2 && col.texts.filter((c) => alignment(c) === 'center').length > col.texts.length / 2) {
          add('SU-17', 'warn', 'Typographic alignment', col.texts[0], `text column ${label} is centered`, 'Left-align text columns');
        }
      }
    }
    const live = ROOT.querySelectorAll('[aria-live], [role=timer], [role=status], [class*=count], [class*=total], [class*=price], [class*=amount], [class*=balance], [class*=stat], [class*=metric], [class*=timer], [class*=kpi]');
    for (const el of live) {
      if (!isVisible(el) || el.closest('table, [role=table], [role=grid]') || !isAmount(el.textContent) || el.children.length > 2) continue;
      if (!tabular(el)) add('SU-16', 'warn', 'Tabular numbers', el, 'likely-changing number uses proportional digits', 'font-variant-numeric: tabular-nums');
    }
  }

  // ---------- 6. control heights (SU-58–60) ----------
  function checkControlHeights(targets) {
    const controls = targets.filter((el) => el.matches(`${TEXT_FIELD}, button, [role=button], input[type=submit], input[type=button], a[href]`) && (el.matches(TEXT_FIELD) || hasBoundary(el)) && !isInlineLink(el));
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        const [a, b] = [controls[i], controls[j]];
        if (a.contains(b) || b.contains(a)) continue;
        const [ra, rb] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
        const overlap = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        const gap = Math.max(rb.left - ra.right, ra.left - rb.right);
        if (overlap < Math.min(ra.height, rb.height) / 2 || gap < 0 || gap > 24) continue;
        const diff = Math.abs(ra.height - rb.height);
        if (diff <= LIMITS.heightTolerance) continue;
        const involvesField = a.matches(TEXT_FIELD) || b.matches(TEXT_FIELD);
        const pagination = a.closest('[aria-label*=pagination i], .pagination, [class*=pager]');
        const id = involvesField ? 'SU-58' : pagination ? 'SU-59' : 'SU-60';
        add(id, diff >= 4 ? 'fail' : 'warn', 'Control alignment', a, `${Math.round(ra.height)}px next to ${describe(b)} at ${Math.round(rb.height)}px`, 'Use one control height (e.g. 40px) for every control in the row');
      }
    }
  }

  // ---------- 7. nested radius (SU-93–98) ----------
  function radii(el, rect) {
    const s = css(el);
    const max = Math.min(rect.width, rect.height) / 2;
    const read = (value) => Math.min(max, value.includes('%') ? (px(value) / 100) * Math.min(rect.width, rect.height) : px(value));
    return { tl: read(s.borderTopLeftRadius), tr: read(s.borderTopRightRadius), br: read(s.borderBottomRightRadius), bl: read(s.borderBottomLeftRadius), max };
  }
  function clipsBetween(el, container) {
    for (let node = el.parentElement; node; node = node.parentElement) {
      const s = css(node);
      if (/hidden|clip/.test(`${s.overflowX} ${s.overflowY}`) || s.clipPath !== 'none') return true;
      if (node === container) return false;
    }
    return false;
  }
  function checkRadius() {
    const elements = [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements);
    for (const el of elements) {
      const media = /^(IMG|VIDEO|CANVAS|IFRAME|PICTURE)$/.test(el.tagName);
      if (!(media || hasBoundary(el)) || !isVisible(el)) continue;
      const inner = el.getBoundingClientRect();
      const r = radii(el, inner);
      const roundedSurface = (node) => {
        const box = radii(node, node.getBoundingClientRect());
        return hasBoundary(node) && box.tl + box.tr + box.br + box.bl > 0;
      };
      let container = el.parentElement;
      for (let depth = 0; container && depth < 4 && !roundedSurface(container); depth += 1) container = container.parentElement;
      if (!container || container === document.documentElement || !roundedSurface(container)) continue;
      const outer = container.getBoundingClientRect();
      const R = radii(container, outer);
      // The rule is about nested surfaces: children that fill most of the container, or sit close into its corner.
      const nestedSurface = inner.width >= outer.width * 0.5 || inner.height >= outer.height * 0.5;
      const corners = [
        ['tl', inner.left - outer.left, inner.top - outer.top], ['tr', outer.right - inner.right, inner.top - outer.top],
        ['br', outer.right - inner.right, outer.bottom - inner.bottom], ['bl', inner.left - outer.left, outer.bottom - inner.bottom],
      ];
      for (const [corner, dx, dy] of corners) {
        if (dx < 0 || dy < 0 || Math.abs(dx - dy) > 4 || R[corner] <= 0) continue;
        const inset = (dx + dy) / 2;
        if (inset >= R[corner] || inset < 1) continue;
        if (inset <= 2 && clipsBetween(el, container)) continue; // a flush child clipped by overflow:hidden inherits the outer curve
        if (!nestedSurface && inset > R[corner] * 0.5) continue;
        const expected = Math.min(r.max, Math.max(0, R[corner] - inset));
        const actual = r[corner];
        if (Math.abs(actual - expected) <= LIMITS.radiusTolerance) continue;
        add('SU-93', actual > expected && nestedSurface ? 'fail' : 'warn', 'Nested corners', el,
          `${corner} radius ${Math.round(actual)}px inside ${Math.round(R[corner])}px with ${Math.round(inset)}px inset (expected ≈ ${Math.round(expected)}px)`,
          'inner radius = max(0, outer radius − padding)');
        break;
      }
    }
  }

  // ---------- 8. reading text (SU-5, SU-7, SU-15, SU-25) ----------
  const BLOCKY = /^(block|flex|grid|list-item|table|table-row|table-cell)$/;
  function checkReading() {
    for (const el of ROOT.querySelectorAll('p, li, blockquote, dd, figcaption, div, section, article, td')) {
      const text = el.textContent.trim().replace(/\s+/g, ' ');
      if (text.length < 120 || !isVisible(el) || [...el.children].some((c) => BLOCKY.test(css(c).display))) continue;
      const s = css(el);
      const size = px(s.fontSize);
      const lineHeight = s.lineHeight === 'normal' ? size * 1.2 : px(s.lineHeight);
      const rect = el.getBoundingClientRect();
      const contentWidth = rect.width - px(s.paddingLeft) - px(s.paddingRight) - px(s.borderLeftWidth) - px(s.borderRightWidth);
      const lines = Math.round((rect.height - px(s.paddingTop) - px(s.paddingBottom)) / lineHeight);
      if (lines < 2) continue;
      // Measured in ch (width of "0"), the unit the rule is written in: 65ch holds ~80–90 average characters.
      ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const measure = Math.round(contentWidth / ctx.measureText('0').width);
      if (measure > LIMITS.measureHigh) add('SU-15', 'warn', 'Line length', el, `text column ≈${measure}ch wide`, 'max-width: 65ch on the text column (60–75ch OK)');
      if (measure < LIMITS.measureLow && lines >= 4) add('SU-15', 'warn', 'Line length', el, `text column ≈${measure}ch wide`, 'Widen the column toward 60–75ch');
      if (s.textAlign === 'center' && lines >= 3) add('SU-7', 'warn', 'Text alignment', el, `centered paragraph over ${lines} lines`, 'text-align: start for multi-line prose');
      if (s.textAlign === 'justify' && s.hyphens !== 'auto') add('SU-7', 'warn', 'Text alignment', el, 'justified without hyphenation', 'text-align: start, or hyphens: auto with lang');
      const leading = lineHeight / size;
      if (size <= 20 && leading < LIMITS.leadingLow) add('SU-5', 'warn', 'Line height', el, `line-height ${leading.toFixed(2)} at ${size}px`, 'line-height ~1.5 for body text');
      if (leading > LIMITS.leadingHigh) add('SU-5', 'warn', 'Line height', el, `line-height ${leading.toFixed(2)}`, 'line-height ~1.5 keeps the paragraph together');
      if (size < LIMITS.minReadingPx) add('SU-25', 'warn', 'Readable size', el, `${size}px paragraph text`, 'Keep reading text ≥ 14px (16px for paragraphs)');
    }
  }

  // ---------- 9. links (SU-6, SU-9) ----------
  const VAGUE = /^(click here|here|read more|more|learn more|link|this link|go|details|continue reading)$/;
  function checkLinks() {
    const byName = new Map();
    for (const a of ROOT.querySelectorAll('a[href]')) {
      if (!isVisible(a)) continue;
      const name = (a.getAttribute('aria-label') || a.textContent).trim().toLowerCase().replace(/\s+/g, ' ');
      if (VAGUE.test(name)) add('SU-6', 'fail', 'Descriptive links', a, `link text "${name}"`, 'Name the destination ("Billing settings", "Typography guide")');
      if (name) byName.set(name, [...(byName.get(name) || []), a]);
      if (!isInlineLink(a)) continue;
      const s = css(a);
      const marked = /underline/.test(s.textDecorationLine) || px(s.borderBottomWidth) > 0 || s.backgroundImage !== 'none';
      if (marked) continue;
      const difference = ratio(parseColor(s.color), parseColor(css(a.parentElement).color));
      add('SU-9', difference < 3 ? 'fail' : 'warn', 'Obvious links', a, `inline link without underline (${difference.toFixed(2)}:1 from surrounding text)`, 'text-decoration: underline; text-underline-offset: .2em');
    }
    for (const [name, links] of byName) {
      const hrefs = new Set(links.map((l) => l.getAttribute('href')));
      if (links.length > 1 && hrefs.size > 1 && name.length < 30) add('SU-6', 'warn', 'Descriptive links', links[0], `${links.length} links share the text "${name}" but go to different places`, 'Make each link text name its destination');
    }
  }

  // ---------- 10. forms (SU-50, SU-51, SU-53) ----------
  function checkChoices() {
    for (const input of ROOT.querySelectorAll('input[type=checkbox], input[type=radio]')) {
      if (!input.isConnected || isDisabled(input)) continue;
      const named = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
      const shown = input.getClientRects().length > 0 || [...(input.labels || [])].some(isVisible);
      if (!shown) {
        // Inside a hidden state (tab, menu, dialog): the label association can still be checked statically.
        checked('checkboxes/radios in hidden states (static check)');
        if (!(input.labels || []).length && !named) add('SU-50', 'fail', 'Clickable labels', input, 'checkbox/radio has no associated label (in a hidden state)', 'Wrap it in <label> or use for/id so the whole row toggles it');
        continue;
      }
      checked('checkboxes/radios');
      const labels = [...(input.labels || [])].filter(isVisible);
      if (!labels.length) {
        add('SU-50', named ? 'warn' : 'fail', 'Clickable labels', input, named ? 'labelled by aria only; the visible words are not clickable' : 'checkbox/radio has no associated label', 'Wrap it in <label> or use for/id so the whole row toggles it');
        continue;
      }
      const label = labels[0];
      const rect = label.getBoundingClientRect();
      const union = { top: Math.min(rect.top, input.getBoundingClientRect().top), bottom: Math.max(rect.bottom, input.getBoundingClientRect().bottom) };
      if (union.bottom - union.top < 24) add('SU-50', 'warn', 'Clickable labels', label, `click area ${Math.round(union.bottom - union.top)}px tall`, 'Pad the label row to ~40px');
      if (css(label).userSelect !== 'none') add('SU-51', 'info', 'Label selection', label, 'option label text is selectable', 'user-select: none on short option labels');
      const s = css(label);
      const lineHeight = s.lineHeight === 'normal' ? px(s.fontSize) * 1.2 : px(s.lineHeight);
      if (rect.height > lineHeight * 1.8 && label.contains(input)) {
        const inputRect = input.getBoundingClientRect();
        const firstLineCenter = rect.top + px(s.paddingTop) + lineHeight / 2;
        if (Math.abs(inputRect.top + inputRect.height / 2 - firstLineCenter) > lineHeight * 0.5) add('SU-53', 'warn', 'Wrapped labels', input, 'control is not aligned with the first line of its wrapped label', 'align-items: flex-start and center the box on the first line');
      }
    }
  }

  // ---------- 11. status dots, images, dialogs (SU-71, SU-106, SU-103) ----------
  const STATUS_WORD = /online|offline|active|inactive|connected|disconnected|paid|pending|overdue|failed|failing|success|error|warning|live|idle|busy|away|draft|published|open|closed|done|complete|running|stopped|healthy|degraded|down|operational|enabled|disabled|on\b|off\b/i;
  function checkMisc() {
    for (const el of [...ROOT.querySelectorAll('span, i, div, b, em')].slice(0, LIMITS.maxElements)) {
      if (el.children.length || el.textContent.trim() || el.closest(INTERACTIVE) || !isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.width > 16 || Math.abs(rect.width - rect.height) > 2) continue;
      const s = css(el);
      if (parseColor(s.backgroundColor).a < 0.3 || px(s.borderTopLeftRadius) < rect.width / 2 - 1) continue;
      const context = `${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.parentElement ? el.parentElement.textContent : ''}`;
      if (!STATUS_WORD.test(context)) add('SU-71', 'warn', 'Status signals', el, 'colored dot with no status word next to it', 'Pair the color with an icon and a text label ("✓ Connected")');
    }
    for (const img of ROOT.querySelectorAll('img')) {
      if (!isVisible(img) || !img.naturalWidth || !img.naturalHeight) continue;
      checked('images');
      const rect = img.getBoundingClientRect();
      const distortion = (rect.width / rect.height) / (img.naturalWidth / img.naturalHeight);
      if (css(img).objectFit === 'fill' && Math.abs(distortion - 1) > 0.03) add('SU-106', 'fail', 'Consistent frames', img, `image stretched ${Math.round((distortion - 1) * 100)}% from its natural aspect`, 'aspect-ratio on the frame + object-fit: cover');
    }
    const DIALOG = 'dialog[open], [role=dialog], [role=alertdialog], [aria-modal=true]';
    for (const dialog of [ROOT, ...ROOT.querySelectorAll(DIALOG)].filter((d) => d.matches(DIALOG))) {
      if (!isVisible(dialog)) continue;
      checked('open dialogs');
      if (css(dialog).boxShadow === 'none' && !hasBoundary(dialog.firstElementChild || dialog)) add('SU-103', 'warn', 'Modal depth', dialog, 'dialog has no elevation shadow', 'Level-5 shadow: soft broad + tight edge');
      const nativeBackdrop = dialog.matches('dialog') && dialog.matches(':modal') && parseColor(getComputedStyle(dialog, '::backdrop').backgroundColor).a > 0.05;
      const scrim = [...document.querySelectorAll('body *')].some((n) => {
        const s = css(n);
        if (!/fixed|absolute/.test(s.position) || n === dialog) return false;
        const r = n.getBoundingClientRect();
        return r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9 && parseColor(s.backgroundColor).a >= 0.1 && isVisible(n);
      });
      if (!nativeBackdrop && !scrim) add('SU-103', 'warn', 'Modal depth', dialog, 'no dimming scrim behind the dialog', 'Dim the page behind modals (::backdrop or a fixed scrim)');
    }
  }

  // ---------- 12. motion in CSS (SU-72, SU-75, SU-78, SU-82, SU-85, SU-86) ----------
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
      if (!loader && longest > LIMITS.routineMs) add('SU-85', 'warn', 'Timing', null, `${selector}: ${longest}ms`, 'Keep routine UI ≤ 300ms (micro ≤ 200ms)');
      const moves = /transform|translate|scale|rotate|left|top|right|bottom|inset|margin|width|height|all/.test(s.transitionProperty || 'all');
      if (!loader && transitionMs.length && moves && /(^|,|\s)linear(\s|,|$)/.test(s.transitionTimingFunction)) add('SU-82', 'warn', 'Easing', null, `${selector}: linear easing on movement`, 'ease-out to enter, ease-in to exit, ease-in-out to move');
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

  // A modal counts as open only when it is modal, painted and on screen (closed sheets often sit off-screen).
  function findOpenModal() {
    const candidates = [...document.querySelectorAll('dialog, [aria-modal="true"]')];
    return candidates.find((dialog) => {
      let modal = dialog.getAttribute('aria-modal') === 'true';
      try { modal = modal || dialog.matches(':modal'); } catch { /* :modal unsupported */ }
      if (!modal || !isVisible(dialog) || dialog.closest('[inert], [aria-hidden="true"]')) return false;
      const r = dialog.getBoundingClientRect();
      return r.bottom > 1 && r.right > 1 && r.top < innerHeight - 1 && r.left < innerWidth - 1;
    }) || null;
  }

  // Hidden states (closed tabs, menus, accordions, dialogs, popovers) were not on screen, so most checks
  // could not run inside them. Listing them turns "only the visible state" into a concrete to-do list.
  function hiddenStates() {
    const found = [];
    const seen = new Set();
    const shown = (n) => n.getClientRects().length > 0 && css(n).visibility !== 'hidden';
    const push = (nodes, trigger, kind) => {
      const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
      if (!list.length || list.some((n) => seen.has(n) || shown(n)) || [...seen].some((s) => s.contains(list[0]))) return;
      list.forEach((n) => seen.add(n));
      const interactive = list.reduce((sum, n) => sum + n.querySelectorAll(INTERACTIVE).length, 0);
      const textChars = list.reduce((sum, n) => sum + n.textContent.trim().length, 0);
      if (!interactive && textChars < 20) return;
      found.push({ kind, state: path(list[0]), opensWith: trigger ? `${path(trigger)} "${(trigger.getAttribute('aria-label') || trigger.textContent || '').trim().slice(0, 24)}"` : null, interactive });
    };
    ROOT.querySelectorAll('details:not([open])').forEach((d) => push([...d.children].filter((c) => c.tagName !== 'SUMMARY'), d.querySelector('summary'), 'collapsed details'));
    ROOT.querySelectorAll('[aria-controls]').forEach((t) => {
      const target = document.getElementById(t.getAttribute('aria-controls'));
      if (t.getAttribute('role') === 'tab') push(target, t, 'inactive tab');
      else if (t.getAttribute('aria-expanded') === 'false') push(target, t, 'collapsed menu or panel');
    });
    document.querySelectorAll('dialog:not([open])').forEach((d) => push(d, d.id ? document.querySelector(`[aria-controls="${d.id}"], [data-dialog="${d.id}"], [commandfor="${d.id}"], [data-target="#${d.id}"]`) : null, 'closed dialog'));
    document.querySelectorAll('[popover]').forEach((p) => { let open = false; try { open = p.matches(':popover-open'); } catch { open = false; } if (!open) push(p, p.id ? document.querySelector(`[popovertarget="${p.id}"]`) : null, 'closed popover'); });
    [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements).forEach((el) => {
      if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(el.tagName)) return;
      if ((css(el).display === 'none' || el.hidden) && el.parentElement && css(el.parentElement).display !== 'none') push(el, null, 'hidden element');
    });
    return found.slice(0, 30);
  }

  // ---------- run ----------
  if (!innerWidth || !innerHeight) {
    const error = 'The viewport is 0×0 (hidden or background browser pane), so nothing can be measured. Set a viewport size (e.g. 1280×900) or show the page, reload, and run again.';
    window.__shibroAuditResult = { tool: 'shibroUI audit', version: VERSION, error };
    return window.__shibroAuditResult;
  }
  const started = performance.now();
  // Measure the resting state: an entrance fade caught mid-flight (or frozen in a background tab) would
  // make whole panels look invisible. Finite running animations are fast-forwarded to their end.
  const running = document.getAnimations ? document.getAnimations().filter((a) => {
    const timing = a.effect && a.effect.getComputedTiming();
    return a.playState !== 'finished' && a.playState !== 'idle' && timing && Number.isFinite(timing.endTime);
  }) : [];
  running.forEach((a) => { try { a.finish(); } catch { /* infinite or detached animation */ } });
  if (running.length) notes.push(`${running.length} running animation(s) were finished first so the resting state was measured.`);
  const OPEN_MODAL = OPTIONS.root ? null : findOpenModal();
  if (OPEN_MODAL) {
    ROOT = OPEN_MODAL;
    notes.push('A modal is open, so only its contents were audited (the page behind it is inert).');
  }
  const scroll = [scrollX, scrollY];
  const previouslyFocused = document.activeElement;
  const sheetInfo = collectRules();
  const targets = targetsList();
  const checks = [
    ['text contrast', checkTextContrast], ['fields', checkFields], ['targets', () => checkTargets(targets)],
    ['focus', () => checkFocus(targets, sheetInfo.rules)], ['tables', checkTables], ['control heights', () => checkControlHeights(targets)],
    ['radius', checkRadius], ['reading', checkReading], ['links', checkLinks], ['choices', checkChoices], ['misc', checkMisc], ['motion', () => checkMotion(sheetInfo)],
  ];
  for (const [name, check] of checks) {
    try { check(); } catch (error) { notes.push(`Check "${name}" errored: ${error.message}`); }
  }
  scrollTo(scroll[0], scroll[1]);
  if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus({ preventScroll: true });

  const order = { fail: 0, warn: 1, info: 2 };
  const list = [...findings.values()].sort((a, b) => order[a.level] - order[b.level] || parseInt(a.id.slice(3), 10) - parseInt(b.id.slice(3), 10));
  const summary = list.reduce((acc, f) => ({ ...acc, [f.level]: acc[f.level] + 1 }), { fail: 0, warn: 0, info: 0 });
  const byRule = list.reduce((acc, f) => ({ ...acc, [f.id]: (acc[f.id] || 0) + f.count }), {});
  let states = [];
  try { states = hiddenStates(); } catch (error) { notes.push(`Hidden-state scan errored: ${error.message}`); }
  if (list.length > OPTIONS.maxFindings) COVERAGE.capsHit.push(`${list.length - OPTIONS.maxFindings} findings beyond maxFindings were cut; raise window.__shibroAudit.maxFindings or scope by region`);
  const report = {
    tool: 'shibroUI audit', version: VERSION, url: location.href, viewport: `${innerWidth}×${innerHeight}`,
    summary: { ...summary, instances: list.reduce((sum, f) => sum + f.count, 0), byRule },
    findings: list.slice(0, OPTIONS.maxFindings), truncated: list.length > OPTIONS.maxFindings,
    coverage: { ...COVERAGE, hiddenStates: states },
    notes: [...notes,
      states.length ? `${states.length} hidden state(s) were not audited (coverage.hiddenStates): open each one and run the audit again.` : 'No hidden states detected.',
      'Fix every instance listed in findings[].instances, not just the first.',
      'Layout, hierarchy and visual-system problems are page-map.js territory (references/composition.md).'],
    ms: Math.round(performance.now() - started),
  };
  // Also exposed for tools that load the file with a <script> tag instead of evaluating it.
  window.__shibroAuditResult = report;
  return report;
})()
