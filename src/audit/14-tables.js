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

