
  // ---------- validation timing and error messages (SU-150, SU-151) ----------
  const SEM_INVALID_STYLE_PROPS = /^(border(-[a-z]+)*-color|outline(-color)?|box-shadow|color|background(-color)?)$/;
  const SEM_VALIDATION_GUARDS = /\[aria-invalid|\.was-validated|\.submitted|\[data-submitted|:user-invalid|:not\(:invalid\)/;
  const SEM_SUBMIT = 'button[type=submit], input[type=submit], button:not([type])';
  const SEM_SELECTOR_PREVIEW_CHARS = 60;

  // :invalid matches a required empty field before anyone has typed, so styling it paints errors on load.
  function checkInvalidStyling({ rules }) {
    const reported = new Set();
    for (const { rule } of rules) {
      if (![...rule.style].some((name) => SEM_INVALID_STYLE_PROPS.test(name))) continue;
      for (const part of splitSelectorList(rule.selectorText || '').map((s) => s.trim())) {
        if (!/:invalid/.test(part) || SEM_VALIDATION_GUARDS.test(part) || reported.has(part)) continue;
        reported.add(part);
        add('SU-150', 'warn', 'Validate at the right moment', null, `errors styled with :invalid show before anyone types (${part.slice(0, SEM_SELECTOR_PREVIEW_CHARS)})`, 'Use :user-invalid, or [aria-invalid="true"] set after blur or submit');
      }
    }
  }

  function checkDisabledSubmit() {
    for (const form of ROOT.querySelectorAll('form')) {
      const submit = [...form.querySelectorAll(SEM_SUBMIT)].find((button) => isVisible(button) && (button.disabled || button.getAttribute('aria-disabled') === 'true'));
      if (!submit) continue;
      const emptyRequired = [...form.querySelectorAll('[required], [aria-required="true"]')]
        .some((field) => isVisible(field) && (/^(checkbox|radio)$/.test(field.type) ? !field.checked : !field.value));
      if (!emptyRequired) continue;
      const tall = form.getBoundingClientRect().height > innerHeight;
      add('SU-150', tall ? 'warn' : 'info', 'Validate at the right moment', submit,
        `submit is disabled while a required field is empty${tall ? ' (the form is taller than the screen, so the reason is off screen)' : ''}`,
        'Keep the button enabled and validate on submit, with an error summary and focus on the first problem');
    }
  }

  function checkInvalidMessages() {
    for (const field of ROOT.querySelectorAll('[aria-invalid="true"]')) {
      if (!isVisible(field)) continue;
      checked('invalid fields');
      const ids = [...semIdsOf(field, 'aria-errormessage'), ...semIdsOf(field, 'aria-describedby')];
      const linked = ids.map((id) => document.getElementById(id)).some((node) => node && semClean(node.textContent) && isVisible(node));
      if (!linked) add('SU-151', 'fail', 'Inline errors', field, 'field is marked aria-invalid but no visible error text is linked to it', 'Put the message next to the field and link it: aria-describedby="field-error"');
    }
  }

  REGISTERED = [...REGISTERED, ['invalid styling', checkInvalidStyling], ['disabled submit', checkDisabledSubmit], ['invalid messages', checkInvalidMessages]];
