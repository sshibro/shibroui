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

