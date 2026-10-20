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

