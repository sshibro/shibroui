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
  // True when `node` belongs to an absolutely positioned, fixed or sticky layer that isn't an ancestor of `el`
  // (a sticky header still over the target after reveal() says nothing about its hit area).
  function overlayOver(node, el) {
    for (let n = node; n && n !== document.body; n = n.parentElement) {
      if (n.contains(el)) return false;
      if (/absolute|fixed|sticky/.test(css(n).position)) return true;
    }
    return false;
  }
  // Samples a circle of the given diameter around the center (rounded corners don't count against it).
  // Returns true / false, or null when the target can't be brought on screen (e.g. an unfocused skip link).
  function covers(el, related, size) {
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) return null;
    // 1px inside the edge: probes exactly 0.5px from a boundary round onto the neighbour in headless Chromium.
    const [cx, cy, radius] = [r.left + r.width / 2, r.top + r.height / 2, size / 2 - 1];
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
      // reveal() already scrolled any inner scroll panel to the target, so a cut that remains is the panel's edge.
      const probe = probeRect(rect);
      const scroller = clippingScroller(el, probe);
      const container = scroller && selectorOf(scroller.node);
      add(id, meetsFloor ? 'warn' : 'fail', 'Target size', el,
        `hit area ${size} does not cover ${LIMITS.target}px${meetsFloor ? '' : ` and is under ${LIMITS.targetFloor}px with crowded neighbours`}${scroller ? `; the scrolling container ${container} clips it` : ''}`,
        scroller
          ? `${container} was scrolled to the target and its edge still cuts the hit area: pad ${container} by ≥ ${Math.ceil(clipDepth(scroller, probe))}px on that side, or make the target ${LIMITS.target}px itself`
          : 'Extend the hit area with padding or an invisible ::before (inset: -10px) without enlarging the visible control');
    }
    const outer = targets.filter((el) => !isInlineLink(el) && hasBoundary(el) && !el.matches(TEXT_FIELD));
    // A target in a fixed/sticky bar and one in the scrolling page only meet at the scroll position the last
    // reveal() left, so that pair says nothing about the layout.
    const pinned = new Map(outer.map((el) => [el, !!pinnedLayerOf(el)]));
    for (let i = 0; i < outer.length; i += 1) {
      for (let j = i + 1; j < outer.length; j += 1) {
        const [a, b] = [outer[i], outer[j]];
        if (pinned.get(a) !== pinned.get(b)) continue;
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

