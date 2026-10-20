  // ---------- Component specs: data, navigation, overlays, inputs (SU-222 … SU-244) ----------
  const CMP = {
    rowSpread: 2, maxRows: 300, maxCells: 2000, slack: 1, overlap: 2,
    menuItem: 32, menuItemTouch: 44, tooltipChars: 80, modalShare: 0.9, modalMinViewport: 768,
    maxDialogFields: 6, maxRadios: 7, maxSelectOptions: 3, searchChars: 20, minZone: [100, 40], bottomSlack: 2, minWideColumns: 4,
  };
  const CMP_TABLE = 'table, [role=table], [role=grid]';
  const CMP_ROW = 'tr, [role=row]';
  const CMP_CELL = 'td, th, [role=cell], [role=gridcell], [role=columnheader], [role=rowheader]';
  const CMP_CHECKBOX = 'input[type=checkbox], [role=checkbox]';
  const CMP_BUTTON = 'button, [role=button], input[type=button], input[type=submit]';
  const CMP_FOCUSABLE = 'a[href], button, input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const CMP_TOAST = '[role=status], [role=alert], [class*=toast i], [class*=snackbar i]';
  const CMP_NUMERIC = /^[+\-−]?\s?[$€£¥₹]?\s?[+\-−]?\d[\d,.\s ]*\s?(%|[a-zA-Z]{1,3})?$/;
  const CMP_IDENTIFIER = /^[A-Z]{2,5}[-#]?\d{2,}$/;
  const CMP_ACTIVE_CLASS = /(?:^|[^a-z])(?:active|current|selected)(?:[^a-z]|$)/i;
  const CMP_CALL_TO_ACTION = /sign ?up|log ?in|get started|try|start|buy|subscribe|contact|book|demo|join|register/i;
  const CMP_SORT_GLYPH = /[▲▼△▽↑↓⇅⇵▴▾]/;
  const CMP_NOT_SORT = /filter|info|help|menu|more|resize|option|close|remove|setting/i;
  const CMP_DANGER_CLASS = /danger|destructive|delete/i;
  const CMP_ZONE_TOKEN = /(?:^|[-_])(?:drop(?:zone|area)?|upload(?:er)?)(?:$|[-_])|dropzone|drop-zone|file-?drop/i;
  const CMP_ZONE_TAGS = /^(DIV|SECTION|LABEL|FORM|ASIDE|ARTICLE|FIELDSET)$/;
  const CMP_BREADCRUMB = 'nav[aria-label*=readcrumb i], .breadcrumb, .breadcrumbs, [class~=breadcrumb]';

  const cmpAll = (selector) => [...ROOT.querySelectorAll(selector)];
  const cmpVisibleAll = (selector) => cmpAll(selector).filter(isVisible);
  const cmpText = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ');
  const cmpTop = (rect) => Math.round(rect.top);
  const cmpOverlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > CMP.overlap
    && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > CMP.overlap;
  const cmpHasBorder = (el, side) => px(css(el)[`border${side}Width`]) > 0 && css(el)[`border${side}Style`] !== 'none';

  // ----- tables: SU-222, SU-223, SU-224, SU-225 -----
  const cmpRowsOf = (table) => [...table.querySelectorAll(CMP_ROW)].filter((row) => row.closest(CMP_TABLE) === table);
  const cmpCellsOf = (row) => [...row.querySelectorAll(CMP_CELL)].filter((cell) => cell.closest(CMP_ROW) === row);
  function cmpIsHeaderRow(row) {
    if (row.closest('thead')) return true;
    const cells = cmpCellsOf(row);
    return cells.length > 0 && cells.every((cell) => cell.tagName === 'TH' || cell.getAttribute('role') === 'columnheader');
  }
  // A detail row (one cell spanning the table) is taller on purpose.
  const cmpIsSpanningRow = (row) => { const cells = cmpCellsOf(row); return cells.length === 1 && (cells[0].colSpan > 1 || cells[0].hasAttribute('aria-colspan')); };
  // Text that wrapped onto a second line makes its row taller than the rest; that is content, not a density bug.
  function cmpWrapsText(row) {
    const range = document.createRange();
    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.nodeValue.trim()) continue;
      range.selectNodeContents(node);
      const tops = [...range.getClientRects()].filter((rect) => rect.height > 0).map(cmpTop);
      if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > 4) return true;
    }
    return false;
  }
  function cmpGroupByParent(rows) {
    const groups = new Map();
    rows.forEach((row) => groups.set(row.parentElement, [...(groups.get(row.parentElement) || []), row]));
    return [...groups.values()];
  }
  function cmpCheckRowHeights() {
    for (const table of cmpVisibleAll(CMP_TABLE)) {
      const body = cmpRowsOf(table).filter((row) => !cmpIsHeaderRow(row) && isVisible(row));
      for (const group of cmpGroupByParent(body)) {
        if (group.length > CMP.maxRows) COVERAGE.capsHit.push(`table row heights checked the first ${CMP.maxRows} rows of a table body`);
        const rows = group.slice(0, CMP.maxRows).filter((row) => !cmpIsSpanningRow(row) && !cmpWrapsText(row));
        if (rows.length < 2) continue;
        checked('table row heights');
        const heights = rows.map((row) => row.getBoundingClientRect().height);
        const [low, high] = [Math.min(...heights), Math.max(...heights)];
        if (high - low <= CMP.rowSpread) continue;
        add('SU-222', 'warn', 'One density per table', rows[heights.indexOf(high)], `row heights differ in one table body: ${Math.round(low)}px and ${Math.round(high)}px (not caused by wrapping)`, 'One row height per table (32 / 40 / 48px): the same cell padding and control size in every row');
      }
    }
  }

  // Text that is clipped by its own box (overflow hidden, with or without an ellipsis).
  function cmpClippedBox(cell) {
    return [cell, ...cell.querySelectorAll('*')].slice(0, 8).find((el) => {
      const style = css(el);
      return /hidden|clip/.test(style.overflowX) && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + CMP.slack;
    }) || null;
  }
  const cmpIsNumeric = (text) => text.length > 0 && text.length <= 24 && (CMP_NUMERIC.test(text) || CMP_IDENTIFIER.test(text));
  function cmpCheckNumericCells() {
    for (const table of cmpVisibleAll(CMP_TABLE)) {
      const cells = cmpRowsOf(table).filter((row) => !cmpIsHeaderRow(row)).flatMap(cmpCellsOf).slice(0, CMP.maxCells);
      for (const cell of cells) {
        const text = cmpText(cell);
        if (!cmpIsNumeric(text) || !isVisible(cell)) continue;
        checked('table numeric cells');
        if (!cmpClippedBox(cell)) continue;
        add('SU-223', 'warn', 'Columns are sized by their content', cell, `numeric cell "${text}" is truncated or clipped`, 'Numbers and IDs never truncate: give the column a fixed width that fits its widest value and let the name column flex');
      }
    }
  }

  function cmpHorizontalScroller(table) {
    for (let node = table; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      if (/auto|scroll/.test(css(node).overflowX) && node.scrollWidth > node.clientWidth + CMP.slack) return node;
    }
    return null;
  }
  function cmpPaintsEdge(el) {
    const style = css(el);
    if (style.boxShadow !== 'none' || /gradient/.test(style.backgroundImage) || (style.maskImage && style.maskImage !== 'none')) return true;
    return ['::before', '::after'].some((pseudo) => {
      const inner = getComputedStyle(el, pseudo);
      return !/^(none|normal)$/.test(inner.content) && (inner.boxShadow !== 'none' || /gradient/.test(inner.backgroundImage));
    });
  }
  const cmpFirstColumn = (table) => cmpRowsOf(table).map((row) => cmpCellsOf(row)[0]).filter(Boolean);
  const CMP_PHONE_STACK_COLUMNS = 5;
  const CMP_HEADER_ACTIONS = 3;
  // SU-134: a page header holds the title, the primary action and at most two secondary actions.
  function cmpCheckHeaderActions() {
    const h1 = [...ROOT.querySelectorAll('h1')].find(isVisible);
    if (!h1) return;
    const row = h1.parentElement;
    if (!row || !/flex|grid/.test(css(row).display)) return;
    checked('page header actions');
    const actions = [...row.querySelectorAll('button, a[href], [role=button]')].filter((el) => isVisible(el) && !h1.contains(el) && !el.closest('nav'));
    if (actions.length > CMP_HEADER_ACTIONS) {
      add('SU-134', 'info', 'Quiet chrome, clear location', row, `the page header holds ${actions.length} actions (${actions.map((el) => cmpText(el) || el.getAttribute('aria-label') || '?').slice(0, 6).join(', ')})`,
        'Keep the title, the primary action and at most two secondary actions; move occasional ones (Export, Print) into a named "More" menu');
    }
  }
  function cmpCheckScrollingTables() {
    for (const table of cmpVisibleAll(CMP_TABLE)) {
      const scroller = cmpHorizontalScroller(table);
      if (!scroller) continue;
      checked('horizontally scrolling tables');
      // A table of two or three columns keeps its identifier in view anyway; the rule is about wide tables.
      const columns = Math.max(...cmpRowsOf(table).map((row) => cmpCellsOf(row).length));
      if (columns < CMP.minWideColumns) continue;
      // On a phone, a table of records reads better as stacked rows than as a strip people pan sideways.
      if (innerWidth <= LIMITS.narrowViewport && columns >= CMP_PHONE_STACK_COLUMNS) {
        add('SU-223', 'info', 'Columns are sized by their content', table, `a ${columns}-column table scrolls sideways at ${innerWidth}px`,
          'Stack the rows on phones: identifier and key value on line 1, status on line 2, the rest as label–value pairs, and a "Sort by" select');
      }
      if (cmpFirstColumn(table).some((cell) => css(cell).position === 'sticky')) continue;
      if ([scroller, scroller.parentElement].filter(Boolean).some(cmpPaintsEdge)) continue;
      add('SU-223', 'warn', 'Columns are sized by their content', table, 'table scrolls sideways with no sticky first column and no edge shadow, so the row identifier scrolls away and nothing hints at more columns', 'position: sticky; left: 0 on the first column with a soft shadow on its edge (or a gradient on the scroller)');
    }
  }

  // A sort affordance: an icon or arrow glyph in a header button, or the word "sort" in its name, class or label.
  function cmpShowsSort(button) {
    const label = `${button.getAttribute('aria-label') || ''} ${button.getAttribute('title') || ''} ${cmpText(button)}`;
    if (/sort/i.test(label) || /sort/i.test(button.getAttribute('class') || '') || CMP_SORT_GLYPH.test(label)) return true;
    return !!button.querySelector('svg, i, img, [class*=icon], [class*=caret], [class*=arrow], [class*=chevron]') && !CMP_NOT_SORT.test(label);
  }
  // The columns in which every body row (two or more) holds a checkbox.
  function cmpCheckboxColumns(bodyRows) {
    if (bodyRows.length < 2) return [];
    const rows = bodyRows.map(cmpCellsOf);
    return rows[0].map((_, index) => index).filter((index) => rows.every((cells) => cells[index] && (cells[index].matches(CMP_CHECKBOX) || cells[index].querySelector(CMP_CHECKBOX))));
  }
  function cmpCheckHeaders() {
    for (const table of cmpVisibleAll(CMP_TABLE)) {
      const rows = cmpRowsOf(table).filter(isVisible);
      const headRows = rows.filter(cmpIsHeaderRow);
      if (!headRows.length) continue;
      checked('table headers');
      const sortButtons = headRows.flatMap(cmpCellsOf).flatMap((cell) => [...cell.querySelectorAll(CMP_BUTTON)]).filter((button) => isVisible(button) && cmpShowsSort(button));
      if (sortButtons.length && !table.querySelector('[aria-sort]')) {
        add('SU-224', 'fail', 'Sort and select are visible state', sortButtons[0], `${sortButtons.length} header button(s) show a sort icon but no column header has aria-sort`, 'aria-sort="ascending" | "descending" on the sorted th (and only there); the icon shows on that column');
      }
      const head = cmpCellsOf(headRows[headRows.length - 1]);
      for (const index of cmpCheckboxColumns(rows.filter((row) => !cmpIsHeaderRow(row)))) {
        if (head[index] && !head[index].matches(CMP_CHECKBOX) && !head[index].querySelector(CMP_CHECKBOX)) {
          add('SU-224', 'warn', 'Sort and select are visible state', head[index], 'rows have a selection checkbox but the header cell has no select-all checkbox', 'A header checkbox (indeterminate when only some rows are selected) with aria-label "Select all"');
        }
      }
    }
  }

  function cmpCheckClickableRows() {
    for (const row of cmpVisibleAll('tr[onclick], tr[role=link], tr[role=button], [role=row][onclick]')) {
      checked('clickable rows');
      const controls = [...row.querySelectorAll(`${CMP_BUTTON}, a[href], [role=link]`)].filter(isVisible);
      if (!controls.length) continue;
      add('SU-225', 'info', 'Row actions sit at the end', row, `the whole row is clickable and also holds ${controls.length} button(s) or link(s)`, 'Make the row open its detail only when it has no other controls; otherwise link the name cell');
    }
  }

  // ----- navigation: SU-228, SU-231 -----
  const cmpWeight = (el) => parseInt(css(el).fontWeight, 10) || 400;
  const cmpFill = (el) => parseColor(css(el).backgroundColor).a > 0.05;
  // Why a link looks active, or null: its class, or the one link in a list of 3+ with another weight or fill.
  function cmpActiveSignal(link, group) {
    const classes = `${link.getAttribute('class') || ''} ${(link.closest('li') || link).getAttribute('class') || ''}`;
    if (CMP_ACTIVE_CLASS.test(classes)) return `class "${classes.trim()}"`;
    if (group.length < 3) return null;
    const others = group.filter((other) => other !== link);
    if (others.every((other) => cmpWeight(other) === cmpWeight(others[0])) && Math.abs(cmpWeight(link) - cmpWeight(others[0])) >= 200) return `font-weight ${cmpWeight(link)} against ${cmpWeight(others[0])}`;
    if (others.every((other) => !cmpFill(other)) && cmpFill(link) && !CMP_CALL_TO_ACTION.test(cmpText(link))) return 'a background its siblings do not have';
    return null;
  }
  function cmpLinkGroups(nav) {
    const links = [...nav.querySelectorAll('a[href]')].filter((link) => isVisible(link) && !link.matches('[role=tab], [role=menuitem]'));
    const groups = new Map();
    links.forEach((link) => { const key = (link.closest('li') || link).parentElement; groups.set(key, [...(groups.get(key) || []), link]); });
    return [...groups.values()];
  }
  function cmpCheckCurrentLink() {
    for (const nav of cmpVisibleAll('nav, [role=navigation]')) {
      if (nav.matches(CMP_BREADCRUMB) || nav.querySelector('[aria-current]:not([aria-current=false])')) continue;
      for (const group of cmpLinkGroups(nav)) {
        if (group.length < 2) continue;
        checked('navigation lists');
        const link = group.find((candidate) => cmpActiveSignal(candidate, group));
        if (!link) continue;
        add('SU-228', 'warn', 'Navigation marks the current page', link, `"${cmpText(link).slice(0, 24)}" is styled as active (${cmpActiveSignal(link, group)}) but no link in this nav has aria-current`, 'aria-current="page" on the current link (and style from [aria-current], so the two cannot drift apart)');
      }
    }
  }

  const cmpWithoutHash = (href) => { const url = new URL(href, location.href); url.hash = ''; return url.href; };
  function cmpCheckBreadcrumbs() {
    for (const crumbs of cmpVisibleAll(CMP_BREADCRUMB)) {
      const items = [...crumbs.querySelectorAll('li')];
      const last = items.length ? items[items.length - 1] : crumbs.lastElementChild;
      if (!last) continue;
      checked('breadcrumbs');
      const link = last.matches('a[href]') ? last : last.querySelector('a[href]');
      if (!link || cmpWithoutHash(link.getAttribute('href')) !== cmpWithoutHash(location.href)) continue;
      add('SU-231', 'warn', 'Breadcrumbs show where, not where you have been', link, `the last crumb "${cmpText(link).slice(0, 24)}" is a link to the page you are on`, 'Render the current page as plain text with aria-current="page" (or leave it out)');
    }
  }

  // ----- overlays: SU-233, SU-234, SU-236, SU-238 -----
  const cmpIsRed = (el) => { const c = parseColor(css(el).color); return c.a > 0.5 && c.r >= 150 && c.g <= c.r * 0.55 && c.b <= c.r * 0.55; };
  // True when something divides the item from the one above it; the first item has nothing above it.
  function cmpSeparatedBefore(item) {
    for (let node = item; node && !node.matches('[role=menu], [role=menubar], body'); node = node.parentElement) {
      if (cmpHasBorder(node, 'Top')) return true;
      const previous = node.previousElementSibling;
      if (previous) return previous.matches('[role=separator], hr') || cmpHasBorder(previous, 'Bottom');
    }
    return true;
  }
  function cmpCheckMenuItems() {
    const touch = innerWidth <= LIMITS.narrowViewport;
    const minimum = touch ? CMP.menuItemTouch : CMP.menuItem;
    for (const item of cmpVisibleAll('[role^=menuitem]')) {
      checked('menu items');
      const height = item.getBoundingClientRect().height;
      if (height + CMP.slack < minimum) add('SU-233', 'warn', 'Menus are for short action lists', item, `menu item is ${Math.round(height)}px tall (under ${minimum}px${touch ? ', the touch size' : ''})`, `Menu items at least ${minimum}px tall${touch ? '' : ' (44px on touch screens)'}`);
      const danger = CMP_DANGER_CLASS.test(item.getAttribute('class') || '') || cmpIsRed(item);
      if (danger && !cmpSeparatedBefore(item)) add('SU-233', 'info', 'Menus are for short action lists', item, 'destructive menu item has no separator above it', 'Put the destructive item last, after a separator ([role=separator] or a border-top)');
    }
  }

  const cmpIdRefs = (el, name) => (el.getAttribute(name) || '').split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean);
  function cmpHasTooltip(el) {
    return el.hasAttribute('title') || el.hasAttribute('data-tooltip') || el.hasAttribute('data-tip')
      || cmpIdRefs(el, 'aria-describedby').some((target) => target.matches('[role=tooltip]'));
  }
  function cmpCheckTooltips() {
    for (const tip of cmpAll('[role=tooltip]')) {
      checked('tooltips');
      const length = cmpText(tip).length;
      if (length > CMP.tooltipChars) add('SU-234', 'warn', 'Tooltips label; they do not explain', tip, `tooltip holds ${length} characters (about ${CMP.tooltipChars} at most)`, 'Keep a tooltip to a short label; put longer help in the page, a popover or a help link');
      if (tip.querySelector(CMP_FOCUSABLE)) add('SU-234', 'warn', 'Tooltips label; they do not explain', tip, 'tooltip contains focusable content (a link or button); it vanishes before it can be reached', 'Plain text only in a tooltip; use a popover for interactive content');
    }
    for (const el of cmpVisibleAll(':disabled')) {
      if (!cmpHasTooltip(el)) continue;
      checked('disabled tooltip triggers');
      add('SU-234', 'warn', 'Tooltips label; they do not explain', el, 'disabled element is the trigger of a tooltip; disabled controls get no focus or hover events, so the tooltip never shows', 'aria-disabled="true" instead of disabled (still focusable), or explain next to the control');
    }
  }

  const cmpIsOpenModal = () => ROOT.matches('dialog[open], [aria-modal="true"]') && isVisible(ROOT);
  const cmpHasInnerScroll = (dialog) => [dialog, ...dialog.querySelectorAll('*')].some((el) => /auto|scroll/.test(css(el).overflowY) && el.scrollHeight > el.clientHeight + CMP.slack);
  function cmpFieldCount(dialog) {
    const fields = [...dialog.querySelectorAll(`${TEXT_FIELD}, input[type=checkbox], input[type=file]`)].filter(isVisible).length;
    const radioGroups = new Set([...dialog.querySelectorAll('input[type=radio]')].filter(isVisible).map((radio) => radio.name || radio));
    return fields + radioGroups.size;
  }
  function cmpCheckDialog() {
    if (!cmpIsOpenModal()) return;
    checked('open modal dialogs');
    const rect = ROOT.getBoundingClientRect();
    if (innerWidth >= CMP.modalMinViewport && rect.width > innerWidth * CMP.modalShare + CMP.slack) {
      add('SU-236', 'warn', 'Dialogs are for short decisions', ROOT, `dialog is ${Math.round(rect.width)}px wide, wider than 90vw (${Math.round(innerWidth * CMP.modalShare)}px)`, 'width: min(560px, 90vw) for a standard dialog; a task this wide belongs on a page or in a side panel');
    }
    const beyond = rect.top < -CMP.slack || rect.bottom > innerHeight + CMP.slack;
    if (!cmpHasInnerScroll(ROOT) && (beyond || ROOT.scrollHeight > ROOT.clientHeight + CMP.slack)) {
      add('SU-236', 'warn', 'Dialogs are for short decisions', ROOT, `dialog content is taller than the screen (${Math.round(rect.height)}px in ${innerHeight}px) and has no inner scroll`, 'max-height: 90dvh with overflow-y: auto on the body, header and actions pinned; or move the task to a page');
    }
    const fields = cmpFieldCount(ROOT);
    if (fields > CMP.maxDialogFields) add('SU-236', 'info', 'Dialogs are for short decisions', ROOT, `dialog holds ${fields} form fields (more than ${CMP.maxDialogFields})`, 'A dialog is for a short decision; a long form belongs on its own page or in a side panel');
  }

  function cmpIsFixed(el) {
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) if (css(node).position === 'fixed') return true;
    return false;
  }
  // Innermost toast-like elements that are painted, fixed to the screen and take pointer events.
  function cmpToasts() {
    const candidates = cmpAll(CMP_TOAST).filter((el) => isVisible(el) && cmpIsFixed(el) && css(el).pointerEvents !== 'none');
    return candidates.filter((el) => !candidates.some((other) => other !== el && el.contains(other)));
  }
  const cmpIsBottomBar = (layer) => {
    const rect = layer.getBoundingClientRect();
    const isNav = layer.matches('nav, [role=navigation], [role=tablist]') || !!layer.querySelector('nav, [role=navigation], [role=tablist]');
    return isNav && rect.bottom >= innerHeight - CMP.bottomSlack && rect.height < innerHeight / 2;
  };
  function cmpCheckToasts() {
    const toasts = cmpToasts();
    if (!toasts.length) return;
    const buttons = cmpVisibleAll(CMP_BUTTON).filter((button) => !button.closest(CMP_TOAST));
    for (const toast of toasts) {
      checked('toasts');
      const box = toast.getBoundingClientRect();
      const covered = buttons.find((button) => cmpOverlaps(box, button.getBoundingClientRect()));
      if (covered) add('SU-238', 'warn', 'Toasts do not cover the work', toast, `toast sits on top of the button "${cmpText(covered).slice(0, 24) || covered.getAttribute('aria-label') || 'button'}"`, 'Pick one corner nothing else uses, and offset it above any fixed button or bottom bar');
      const bar = pinnedLayers().find((layer) => !layer.contains(toast) && !toast.contains(layer) && !layer.matches(CMP_TOAST) && cmpIsBottomBar(layer) && cmpOverlaps(box, layer.getBoundingClientRect()));
      if (bar) add('SU-238', 'warn', 'Toasts do not cover the work', toast, 'toast overlaps the fixed bottom navigation bar', 'Lift the toast by the bar height (bottom: calc(56px + 16px)) on phones');
    }
  }

  // ----- inputs: SU-240, SU-241, SU-243, SU-244 -----
  const cmpIsSubmit = (el) => el.matches('input[type=submit], button[type=submit], button:not([type])') && !el.matches('[role=switch]');
  function cmpCheckSwitches() {
    const switches = cmpAll('[role=switch], input[type=checkbox][class*=switch i], input[type=checkbox][class*=toggle i]');
    for (const control of switches.filter((el) => isVisible(el) || isVisible(el.closest('label') || el))) {
      checked('switches');
      const form = control.closest('form');
      if (!form || ![...form.querySelectorAll('input, button')].some(cmpIsSubmit)) continue;
      add('SU-240', 'info', 'Switch for now, checkbox for on save', control, 'switch inside a form that also has a submit button: a switch applies at once, so it will look saved before Save is pressed', 'Use a checkbox for a choice that is submitted with the form; keep switches for settings that apply immediately');
    }
  }

  const cmpIsPlaceholder = (option) => option.hidden || (option.disabled && option.value === '');
  function cmpCheckChoiceCounts() {
    for (const select of cmpVisibleAll('select:not([multiple])')) {
      checked('selects');
      const count = [...select.options].filter((option) => !cmpIsPlaceholder(option)).length;
      if (count < 1 || count > CMP.maxSelectOptions) continue;
      add('SU-241', 'info', 'Pick the control by option count', select, `select with ${count} option(s): every choice fits on screen`, 'Two to five options that all fit: radios, or a segmented control for a view or mode');
    }
    const named = new Map();
    for (const radio of cmpVisibleAll('input[type=radio][name]')) {
      const key = `${radio.form ? [...document.forms].indexOf(radio.form) : 'none'}|${radio.name}`;
      named.set(key, [...(named.get(key) || []), radio]);
    }
    const aria = cmpVisibleAll('[role=radiogroup]').map((el) => [...el.querySelectorAll('[role=radio]')]);
    for (const group of [...named.values(), ...aria].filter((radios) => radios.length)) {
      checked('radio groups');
      if (group.length > CMP.maxRadios) add('SU-241', 'info', 'Pick the control by option count', group[0], `radio group with ${group.length} options (more than ${CMP.maxRadios})`, 'Six to fifteen options: a select; more than that: a searchable combobox');
    }
  }

  const cmpZoneByClass = (el) => [...el.classList].some((token) => CMP_ZONE_TOKEN.test(token) && !/dropdown/i.test(token));
  const cmpIsDropZone = (el) => CMP_ZONE_TAGS.test(el.tagName) && (cmpZoneByClass(el) || el.hasAttribute('ondrop') || el.hasAttribute('ondragover'));
  function cmpHasFileControl(zone) {
    if (zone.querySelector(`input[type=file], ${CMP_BUTTON}`)) return true;
    return zone.matches('label') && !!zone.control && zone.control.matches('input[type=file]');
  }
  function cmpCheckDropZones() {
    const zones = cmpVisibleAll('*').filter(cmpIsDropZone);
    for (const zone of zones.filter((el) => !zones.some((outer) => outer !== el && outer.contains(el)))) {
      const rect = zone.getBoundingClientRect();
      if (rect.width < CMP.minZone[0] || rect.height < CMP.minZone[1]) continue;
      checked('drop zones');
      if (cmpHasFileControl(zone)) continue;
      add('SU-243', 'warn', 'File upload works without dragging', zone, 'drop zone has no file input and no button inside, so keyboard and touch users cannot add a file', 'A "Browse files" button (and an input[type=file]) inside the zone, with the accepted types and size limit stated');
    }
  }

  // 1ch is the width of "0", measured on a canvas in the field's own font.
  const cmpMeasureContext = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d');
  function cmpCharWidth(style) {
    cmpMeasureContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return cmpMeasureContext.measureText('0').width || px(style.fontSize) * 0.55;
  }
  function cmpCheckSearchFields() {
    for (const field of cmpVisibleAll('input[type=search], [role=searchbox]')) {
      checked('search fields');
      const style = css(field);
      const inner = field.getBoundingClientRect().width - px(style.paddingLeft) - px(style.paddingRight) - px(style.borderLeftWidth) - px(style.borderRightWidth);
      const wanted = CMP.searchChars * cmpCharWidth(style);
      if (inner + CMP.slack >= wanted) continue;
      add('SU-244', 'info', 'Search fields fit the query', field, `search field shows about ${Math.floor(inner / cmpCharWidth(style))} characters (under ${CMP.searchChars}ch)`, 'Wide enough for a typical query: 27+ characters, or flex to the available width');
    }
  }

  REGISTERED = [...REGISTERED,
    ['table row heights', () => cmpCheckRowHeights()], ['numeric cells', () => cmpCheckNumericCells()], ['scrolling tables', () => cmpCheckScrollingTables()],
    ['table headers', () => cmpCheckHeaders()], ['clickable rows', () => cmpCheckClickableRows()],
    ['current link', () => cmpCheckCurrentLink()], ['breadcrumbs', () => cmpCheckBreadcrumbs()],
    ['menu items', () => cmpCheckMenuItems()], ['tooltips', () => cmpCheckTooltips()], ['dialog size', () => cmpCheckDialog()], ['toasts', () => cmpCheckToasts()],
    ['header actions', () => cmpCheckHeaderActions()], ['switches', () => cmpCheckSwitches()], ['choice counts', () => cmpCheckChoiceCounts()], ['drop zones', () => cmpCheckDropZones()], ['search fields', () => cmpCheckSearchFields()]];
