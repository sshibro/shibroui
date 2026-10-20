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

