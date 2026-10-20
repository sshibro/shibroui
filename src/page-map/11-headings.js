  // ---------- headings (SU-129) ----------
  function headings() {
    const list = [...ROOT.querySelectorAll('h1, h2, h3, h4, h5, h6, [role=heading]')].filter(isVisible).map((el) => ({
      el, level: el.getAttribute('aria-level') ? parseInt(el.getAttribute('aria-level'), 10) : parseInt(el.tagName.slice(1), 10) || 2, size: px(css(el).fontSize),
    }));
    const outline = list.map((h) => `h${h.level} ${Math.round(h.size)}px "${snippet(h.el, 40)}"`);
    const h1s = list.filter((h) => h.level === 1);
    if (h1s.length !== 1) flag('SU-129', 'warn', 'Heading outline', `${h1s.length} h1 elements (want exactly one)`, h1s.map((h) => h.el));
    list.forEach((h, i) => {
      const previous = list[i - 1];
      if (previous && h.level > previous.level + 1) flag('SU-129', 'warn', 'Heading outline', `h${previous.level} → h${h.level} skips a level ("${snippet(h.el, 30)}")`, [h.el]);
      const shallower = list.filter((other) => other.level < h.level);
      const biggest = Math.max(0, ...shallower.map((o) => o.size));
      if (shallower.length && h.size > biggest + 0.5) flag('SU-129', 'warn', 'Heading outline', `h${h.level} "${snippet(h.el, 30)}" renders at ${h.size}px, larger than every shallower heading (max ${biggest}px)`, [h.el]);
    });
    const untitled = surfaces.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width * r.height < 20000 || el.closest('nav, header, footer')) return false;
      const rich = el.querySelectorAll(INTERACTIVE).length >= 3 || el.textContent.trim().length >= 160;
      const titled = el.querySelector('h1, h2, h3, h4, h5, h6, [role=heading], legend, caption') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      const nestedSurface = surfaces.some((other) => other !== el && el.contains(other) && other.querySelector('h1, h2, h3, h4, h5, h6'));
      return rich && !titled && !nestedSurface;
    });
    if (untitled.length) flag('SU-129', 'info', 'Heading outline', `${untitled.length} content group(s) without a heading`, untitled);
    return { outline };
  }

