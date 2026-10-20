  // ---------- hidden states (SU-136) ----------
  function states() {
    const found = [];
    const seen = new Set();
    // nodes: the hidden element(s) that make up one state; the first one names it.
    const push = (nodes, trigger, kind) => {
      const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
      if (!list.length || list.some((n) => seen.has(n) || isVisible(n)) || [...seen].some((s) => s.contains(list[0]))) return;
      list.forEach((n) => seen.add(n));
      const interactive = list.reduce((sum, n) => sum + n.querySelectorAll(INTERACTIVE).length + (n.matches(INTERACTIVE) ? 1 : 0), 0);
      const textChars = list.reduce((sum, n) => sum + n.textContent.trim().length, 0);
      if (!interactive && textChars < 20) return;
      found.push({ kind, state: path(list[0]), opensWith: trigger ? `${path(trigger)} "${snippet(trigger, 24)}"` : null, interactive, textChars });
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
      if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(el.tagName) || seen.has(el)) return;
      const hidden = css(el).display === 'none' || el.hidden;
      if (hidden && el.parentElement && css(el.parentElement).display !== 'none' && !el.closest('details:not([open])')) push(el, null, 'hidden element');
    });
    if (found.length) flag('SU-136', 'info', 'Every state reviewed', `${found.length} hidden state(s) were not on screen: open each and re-run audit.js and page-map.js`);
    if (found.length > 30) COVERAGE.capsHit.push(`hidden states: listed the first 30 of ${found.length}`);
    return found.slice(0, 30);
  }

