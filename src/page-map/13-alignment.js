  // ---------- alignment, rows, rhythm, nesting (SU-124, SU-125, SU-130, SU-132) ----------
  function alignment() {
    const blocks = elements.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width >= 160 && (isSurface(el) || /^(H[1-6]|P|TABLE|FORM|UL|OL|SECTION|ARTICLE)$/.test(el.tagName)) && !el.closest('nav, header, footer');
    });
    const edges = new Map();
    for (const el of blocks) {
      const x = round(pageRect(el).x);
      edges.set(x, [...(edges.get(x) || []), el]);
    }
    const sorted = [...edges.keys()].sort((a, b) => a - b);
    // Cluster edges that sit within a few px of each other; a cluster with unrelated elements on
    // different edges is one "almost aligned" problem, however many pairs it contains.
    const clusters = sorted.reduce((acc, x) => {
      const last = acc[acc.length - 1];
      if (last && x - last[last.length - 1] <= LIMITS.edgeNearMiss) last.push(x); else acc.push([x]);
      return acc;
    }, []).filter((c) => c.length > 1);
    const nearMisses = [];
    for (const cluster of clusters) {
      const members = cluster.map((x) => ({ x, els: edges.get(x) }));
      const pair = members.flatMap((m, i) => members.slice(i + 1).flatMap((n) => m.els.flatMap((a) => n.els.filter((b) => !a.contains(b) && !b.contains(a)).map((b) => [a, b]))))[0];
      if (pair) nearMisses.push({ edges: cluster.map((x) => `${x}px`).join(' / '), elements: members.map((m) => m.els[0]) });
    }
    nearMisses.slice(0, 6).forEach((m) => flag('SU-124', 'warn', 'Shared edges', `left edges ${m.edges} almost align; pick one`, m.elements));
    return { distinctEdges: sorted.length, nearMisses: nearMisses.map((m) => ({ edges: m.edges, elements: m.elements.map(path) })) };
  }
  function rowsAndRhythm() {
    const parents = new Set(surfaces.map((el) => el.parentElement).filter(Boolean));
    for (const parent of parents) {
      const kids = [...parent.children].filter((c) => surfaces.includes(c));
      if (kids.length < 2) continue;
      const rows = [];
      for (const kid of kids) {
        const r = kid.getBoundingClientRect();
        const row = rows.find((candidate) => Math.min(candidate.bottom, r.bottom) - Math.max(candidate.top, r.top) > Math.min(candidate.height, r.height) / 2);
        if (row) { row.items.push({ kid, r }); row.top = Math.min(row.top, r.top); row.bottom = Math.max(row.bottom, r.bottom); }
        else rows.push({ top: r.top, bottom: r.bottom, height: r.height, items: [{ kid, r }] });
      }
      for (const row of rows.filter((rw) => rw.items.length > 1)) {
        const tops = row.items.map((i) => i.r.top);
        const heights = row.items.map((i) => i.r.height);
        const topSpread = Math.max(...tops) - Math.min(...tops);
        const heightSpread = Math.max(...heights) - Math.min(...heights);
        if (topSpread >= 1 && topSpread <= LIMITS.rowTopMiss) flag('SU-132', 'warn', 'Rows align', `cards in a row are ${Math.round(topSpread)}px out of line at the top`, row.items.map((i) => i.kid));
        if (heightSpread > LIMITS.rowHeightMiss) flag('SU-132', 'warn', 'Rows align', `cards in a row have uneven heights (${heights.map(Math.round).join(', ')}px)`, row.items.map((i) => i.kid));
      }
    }
    // Section rhythm: in the main column (and any parent of several surfaces), adjacent stacked blocks
    // of section size should be separated by the same gap.
    const columns = new Set([...ROOT.querySelectorAll('main, [role=main]'), ...parents].filter((p) => p && isVisible(p)));
    if (ROOT.matches('main, [role=main]')) columns.add(ROOT);
    for (const column of columns) {
      const kids = [...column.children].filter((c) => isVisible(c) && !/absolute|fixed/.test(css(c).position)).map((kid) => ({ kid, r: kid.getBoundingClientRect() }));
      const gaps = [];
      const blocks = [];
      for (let i = 1; i < kids.length; i += 1) {
        const [prev, next] = [kids[i - 1], kids[i]];
        if (next.r.top < prev.r.bottom - 1 || prev.r.height < 40 || next.r.height < 40) continue;
        gaps.push(Math.round(next.r.top - prev.r.bottom));
        blocks.push(next.kid);
      }
      // One deliberate group break (4, 4, 4, 16) is grouping, not drift; wandering gaps (13, 22, 30, 17) are drift.
      const distinct = new Set(gaps.map((g) => round(g, 2))).size;
      if (gaps.length >= 3 && distinct >= 3 && Math.max(...gaps) - Math.min(...gaps) >= LIMITS.rhythmSpread) {
        flag('SU-125', 'warn', 'Rhythm', `uneven gaps between stacked sections in ${path(column)}: ${gaps.join(', ')}px`, blocks);
      }
    }
    const deep = surfaces.filter((el) => { let depth = 0; for (let n = el.parentElement; n && n !== ROOT.parentElement; n = n.parentElement) if (surfaces.includes(n)) depth += 1; return depth >= 2; });
    if (deep.length) flag('SU-130', 'warn', 'Group with space before boxes', `${deep.length} surface(s) nested three or more boxes deep (card in card in card)`, deep);
    return { surfaces: surfaces.length, deepNesting: deep.length };
  }

