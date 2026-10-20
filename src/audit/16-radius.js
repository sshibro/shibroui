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

