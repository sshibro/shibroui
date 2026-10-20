
  // ---------- error states that explain and recover (SU-160) ----------
  const SEM_ERROR_CLASS = /\b(error|danger|alert-error|is-error)\b/i;
  const SEM_ERROR_MIN_CHARS = 20;
  const SEM_RECOVERY_CONTROL = 'a[href], button, [role=button], [role=link], input[type=button], input[type=submit]';
  const SEM_FIELD_WRAPPER_CLASS = /field|form-group|form-row|input/i;
  // Ids that field messages are wired to; those regions belong to SU-151, not to this check.
  const semDescribedIds = () => new Set([...document.querySelectorAll('[aria-describedby], [aria-errormessage]')]
    .flatMap((el) => [...semIdsOf(el, 'aria-describedby'), ...semIdsOf(el, 'aria-errormessage')]));
  // A message sitting right next to a field is that field's inline message even when it is not linked.
  const semBesideField = (el) => [el.previousElementSibling, el.nextElementSibling].some((sibling) => sibling && sibling.matches(`${TEXT_FIELD}, label`))
    || (!!el.parentElement && (el.parentElement.matches('label') || SEM_FIELD_WRAPPER_CLASS.test(el.parentElement.getAttribute('class') || '')));

  function checkErrorStates() {
    const described = semDescribedIds();
    const toasts = semToastLike();
    for (const toast of toasts) {
      if (semIsEnglish(toast) && SEM_ERROR_WORDS.test(semClean(toast.textContent))) add('SU-160', 'info', 'Errors explain and recover', toast, 'error shown in a toast disappears before it can be read or acted on', 'Show errors where the problem is (inline or a persistent banner) with a Retry, not in a toast');
    }
    const regions = [...ROOT.querySelectorAll('[role=alert], [class]')].slice(0, LIMITS.maxElements).filter((el) => {
      if (!el.matches('[role=alert]') && !SEM_ERROR_CLASS.test(el.getAttribute('class') || '')) return false;
      return !el.matches('svg, svg *, body, html') && isVisible(el) && !toasts.some((toast) => toast.contains(el) || el.contains(toast));
    });
    for (const region of regions.filter((el) => !regions.some((other) => other !== el && other.contains(el)))) {
      if (semClean(region.textContent).length < SEM_ERROR_MIN_CHARS || (region.id && described.has(region.id)) || semBesideField(region)) continue;
      checked('error regions');
      if (!region.querySelector(SEM_RECOVERY_CONTROL)) add('SU-160', 'warn', 'Errors explain and recover', region, 'error with no way to recover', 'Say what failed and what to do, and add the way forward: a Retry button, a link to the fix, or a contact route');
    }
  }

  REGISTERED = [...REGISTERED, ['error states', checkErrorStates]];
