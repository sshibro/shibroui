
  // ---------- live regions and widget state (SU-146, SU-147) ----------
  const SEM_TOAST_CLASS = /toast|snackbar|notification|(^|[^a-z])flash(es)?([^a-z]|$)/i;
  const SEM_TOAST_IGNORED_CLASS = /badge|count|dot|indicator|icon|bell|trigger|toggle|btn|button/i;
  const SEM_TOAST_MIN_CHARS = 4;
  const SEM_TOAST_MAX_CHARS = 140;
  const SEM_NOT_A_TOAST = 'nav, header, footer, aside, dialog, form, [role=dialog], [role=alertdialog], [role=navigation], [role=banner], [role=toolbar], [role=menu], [role=tablist], [aria-modal]';
  const SEM_LIVE_REGION = '[role=status], [role=alert], [role=log], [aria-live]:not([aria-live=off])';
  const SEM_ERROR_WORDS = /error|fail|couldn|can't|cannot|invalid|problem|denied|expired/i;
  let semToastCache = null;
  // Short, transient messages: fixed-position bubbles or classes named like toasts. Outermost match only.
  function semToastLike() {
    if (semToastCache) return semToastCache;
    const fixed = new Set(semLayers().fixed);
    const candidates = [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements).filter((el) => {
      const classes = el.getAttribute('class') || '';
      const named = SEM_TOAST_CLASS.test(classes) && !SEM_TOAST_IGNORED_CLASS.test(classes);
      if (!fixed.has(el) && !named) return false;
      if (el.matches(SEM_NOT_A_TOAST) || el.closest('a[href], button, [role=button]') || !isVisible(el)) return false;
      const text = semClean(el.textContent);
      if (text.length < SEM_TOAST_MIN_CHARS || text.length > SEM_TOAST_MAX_CHARS) return false;
      const controls = [...el.querySelectorAll(INTERACTIVE)];
      const controlChars = controls.reduce((sum, control) => sum + semClean(control.textContent).length, 0);
      return controls.length <= 2 && !(controls.length && controlChars >= text.length - 2) && !el.matches(INTERACTIVE);
    });
    semToastCache = candidates.filter((el) => !candidates.some((other) => other !== el && other.contains(el)));
    return semToastCache;
  }
  const semHasLiveRegion = (el) => !!el.closest(SEM_LIVE_REGION) || !!el.querySelector(SEM_LIVE_REGION);

  function checkLiveRegions() {
    for (const toast of semToastLike()) {
      checked('toast-like messages');
      if (!semHasLiveRegion(toast)) add('SU-146', 'warn', 'Status messages', toast, 'message appears without role="status" or aria-live, so screen readers never hear it', 'Mount <div role="status"> at load and put the message inside it (role="alert" only for errors)');
    }
    for (const alert of ROOT.querySelectorAll('[role=alert], [aria-live=assertive]')) {
      const text = semClean(alert.textContent);
      if (!text || !isVisible(alert) || SEM_ERROR_WORDS.test(text) || !semIsEnglish(alert)) continue;
      add('SU-146', 'warn', 'Status messages', alert, 'assertive announcement that does not read like an error', 'role="status" (polite) for confirmations and progress; keep role="alert" for errors that need attention');
    }
  }

  const semIsHidden = (node) => !node || node.hidden || css(node).display === 'none' || css(node).visibility === 'hidden' || !node.getClientRects().length;
  const SEM_CONTROLLED_DIALOG = 'dialog, [role=dialog], [role=alertdialog]';
  function checkWidgetState() {
    for (const tab of ROOT.querySelectorAll('[role=tab]')) {
      if (isVisible(tab) && !tab.hasAttribute('aria-selected')) add('SU-147', 'fail', 'Widget patterns', tab, 'role="tab" has no aria-selected', 'aria-selected="true" on the active tab, "false" on the others');
    }
    // A modal dialog opener (aria-haspopup="dialog") is the exception: the dialog itself signals its state.
    for (const el of ROOT.querySelectorAll('[aria-haspopup]:not([aria-haspopup=false]):not([aria-haspopup=dialog])')) {
      if (isVisible(el) && !el.hasAttribute('aria-expanded')) add('SU-147', 'fail', 'Widget patterns', el, 'popup trigger has no aria-expanded', 'Toggle aria-expanded="true|false" with the popup');
    }
    for (const el of ROOT.querySelectorAll('button[aria-controls]:not([role=tab]):not([role=menuitem]):not([role=option]), [role=button][aria-controls]')) {
      if (!isVisible(el) || el.hasAttribute('aria-expanded') || el.hasAttribute('aria-haspopup') || el.hasAttribute('aria-pressed')) continue;
      const target = document.getElementById(el.getAttribute('aria-controls'));
      if (target && !target.matches(SEM_CONTROLLED_DIALOG) && semIsHidden(target)) add('SU-147', 'fail', 'Widget patterns', el, 'disclosure button controls a hidden panel but has no aria-expanded', 'aria-expanded="false" while collapsed, "true" while open');
    }
    for (const list of ROOT.querySelectorAll('[role=tablist]')) {
      const tabs = [...list.querySelectorAll('[role=tab]')].filter(isVisible);
      const stops = tabs.filter((tab) => tab.tabIndex >= 0);
      if (tabs.length >= 2 && stops.length > 1) add('SU-147', 'warn', 'Widget patterns', list, `${stops.length} tabs are separate Tab stops`, 'Roving tabindex: tabindex="0" on the selected tab, "-1" on the rest, arrow keys move between them');
    }
  }

  REGISTERED = [...REGISTERED, ['live regions', checkLiveRegions], ['widget state', checkWidgetState]];
