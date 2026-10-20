
  // ---------- field labels, placeholders and autofill (SU-45, SU-148, SU-149, SU-153) ----------
  const SEM_MIN_FORM_FIELDS = 3;
  const SEM_REQUIRED_MARKER = /optional|required|\*/i;
  const SEM_SPLIT_CODE_MIN = 4;
  const SEM_SPLIT_CODE_MAX = 8;
  const SEM_AUTOFILL_TOKENS = new Set(['name', 'honorific-prefix', 'given-name', 'additional-name', 'family-name', 'honorific-suffix', 'nickname', 'username', 'new-password', 'current-password', 'one-time-code',
    'organization-title', 'organization', 'street-address', 'address-line1', 'address-line2', 'address-line3', 'address-level4', 'address-level3', 'address-level2', 'address-level1', 'country', 'country-name',
    'postal-code', 'cc-name', 'cc-given-name', 'cc-additional-name', 'cc-family-name', 'cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-csc', 'cc-type', 'transaction-currency', 'transaction-amount',
    'language', 'bday', 'bday-day', 'bday-month', 'bday-year', 'sex', 'url', 'photo', 'tel', 'tel-country-code', 'tel-national', 'tel-area-code', 'tel-local', 'tel-extension', 'email', 'impp']);
  const SEM_CONTACT_PREFIX = /^(home|work|mobile|fax|pager)$/;
  const semWord = (words) => new RegExp(`(?<![a-z])(?:${words})(?![a-z])`, 'i');
  // Order matters: the first purpose that matches wins ("email address" is an email, not a street address).
  const SEM_PERSONAL_PURPOSES = [
    { purpose: 'email', token: 'email', test: semWord('e-?mail') },
    { purpose: 'phone number', token: 'tel', test: semWord('phone|telephone|mobile|tel') },
    { purpose: 'one-time code', token: 'one-time-code', test: semWord('one[-_ ]?time|otp|verification[-_ ]?code|sms[-_ ]?code|2fa') },
    { purpose: 'username', token: 'username', test: semWord('user[-_ ]?name|login') },
    { purpose: 'first name', token: 'given-name', test: semWord('first[-_ ]?name|given[-_ ]?name|fname') },
    { purpose: 'last name', token: 'family-name', test: semWord('last[-_ ]?name|family[-_ ]?name|surname|lname') },
    { purpose: 'full name', token: 'name', test: semWord('full[-_ ]?name|your[-_ ]?name') },
    { purpose: 'street address', token: 'street-address', test: semWord('street|address[-_ ]?line|addr|address') },
    { purpose: 'postal code', token: 'postal-code', test: semWord('postal|zip|postcode') },
    { purpose: 'city', token: 'address-level2', test: semWord('city|town') },
    { purpose: 'country', token: 'country', test: semWord('country') },
    { purpose: 'birthday', token: 'bday', test: semWord('birth|bday|dob') },
  ];
  function semValidAutofill(value) {
    const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 1 && /^(on|off)$/.test(tokens[0])) return true;
    const scoped = tokens.filter((token) => !/^section-/.test(token) && !/^(shipping|billing)$/.test(token));
    const named = scoped.length > 1 && SEM_CONTACT_PREFIX.test(scoped[0]) ? scoped.slice(1) : scoped;
    const field = named.filter((token) => token !== 'webauthn');
    return field.length === 1 && SEM_AUTOFILL_TOKENS.has(field[0]);
  }
  const semPurpose = (field) => {
    const hints = `${field.type} ${field.name} ${field.id} ${semLabelText(field)} ${field.getAttribute('aria-label') || ''}`;
    return SEM_PERSONAL_PURPOSES.find(({ test }) => test.test(hints) || (field.type === 'email' && test === SEM_PERSONAL_PURPOSES[0].test) || (field.type === 'tel' && test === SEM_PERSONAL_PURPOSES[1].test));
  };
  const semEditable = (field) => isVisible(field) && !field.matches(':disabled, [readonly]') && !field.closest('[aria-hidden="true"]');

  // SU-45 extension: a placeholder is text too, and the browser default is a pale gray.
  function checkPlaceholderContrast() {
    for (const field of ROOT.querySelectorAll('input[placeholder], textarea[placeholder]')) {
      if (field.value || !field.matches(TEXT_FIELD) || !semClean(field.getAttribute('placeholder')) || !isVisible(field)) continue;
      const rect = field.getBoundingClientRect();
      const behind = backdropAt(field.parentElement || field, rect.left - 1, rect.top - 1);
      if (behind.covered || behind.image) { skipped('placeholder surface not measurable'); continue; }
      checked('placeholders');
      const holder = getComputedStyle(field, '::placeholder');
      const fill = over(parseColor(css(field).backgroundColor), behind.color);
      const color = parseColor(holder.color);
      const opacity = Number.isNaN(parseFloat(holder.opacity)) ? 1 : parseFloat(holder.opacity);
      const value = ratio(over({ ...color, a: color.a * opacity }, fill), fill);
      if (value < LIMITS.textAA) {
        add('SU-45', 'fail', 'Text contrast', field, `placeholder ${hex(color)} on ${hex(fill)} = ${value.toFixed(2)}:1 (needs ≥ ${LIMITS.textAA}:1)`, `::placeholder { color: <a gray that reaches ${LIMITS.textAA}:1 on ${hex(fill)}> }`);
      }
    }
  }

  function checkFieldNames() {
    for (const field of ROOT.querySelectorAll(TEXT_FIELD)) {
      if (!isVisible(field) || field.matches(':disabled') || field.closest('[aria-hidden="true"]')) continue;
      checked('field names');
      const { source } = semName(field);
      if (source === 'placeholder') add('SU-148', 'fail', 'Persistent labels', field, 'field named only by its placeholder', 'Add a visible <label for> above the field; a placeholder disappears as soon as someone types');
      else if (!source) add('SU-148', 'fail', 'Persistent labels', field, 'field has no accessible name', 'Add a visible <label for> above the field (or aria-label for a search box with a visible button)');
    }
  }

  function checkRequiredMarkers() {
    for (const form of ROOT.querySelectorAll('form')) {
      const fields = [...form.querySelectorAll(TEXT_FIELD)].filter((field) => isVisible(field) && !field.matches(':disabled'));
      const required = fields.filter((field) => field.required || field.getAttribute('aria-required') === 'true');
      if (fields.length < SEM_MIN_FORM_FIELDS || !required.length || required.length === fields.length) continue;
      const labelled = fields.some((field) => SEM_REQUIRED_MARKER.test(`${[...(field.labels || [])].map((label) => label.textContent).join(' ')} ${field.getAttribute('aria-label') || ''}`));
      if (!labelled) add('SU-149', 'warn', 'Mark the exception', form, `form mixes ${required.length} required and ${fields.length - required.length} optional fields and no label says which`, 'Mark the minority: "(optional)" in the label when most fields are required, otherwise a "*" explained once');
    }
  }

  function checkAutofill() {
    for (const field of ROOT.querySelectorAll(TEXT_FIELD)) {
      if (!semEditable(field)) continue;
      const attr = field.getAttribute('autocomplete');
      if (field.type === 'password') {
        if (attr && attr.trim().toLowerCase() === 'off') add('SU-153', 'fail', 'Help the browser help the user', field, 'password field has autocomplete="off"', 'autocomplete="current-password" (sign in) or "new-password" (sign up) so password managers work');
        else if (attr === null) add('SU-153', 'warn', 'Help the browser help the user', field, 'password field has no autocomplete attribute', 'autocomplete="current-password" or "new-password"');
        continue;
      }
      const match = semPurpose(field);
      if (!match) continue;
      checked('autofill fields');
      if (attr === null) add('SU-153', 'warn', 'Help the browser help the user', field, `${match.purpose} field has no autocomplete attribute`, `autocomplete="${match.token}"`);
      else if (!semValidAutofill(attr)) add('SU-153', 'warn', 'Help the browser help the user', field, `autocomplete="${attr}" is not a valid token`, `autocomplete="${match.token}"`);
    }
    const groups = new Map();
    for (const box of ROOT.querySelectorAll('input[maxlength="1"]')) if (isVisible(box)) groups.set(box.parentElement, [...(groups.get(box.parentElement) || []), box]);
    for (const boxes of groups.values()) {
      if (boxes.length >= SEM_SPLIT_CODE_MIN && boxes.length <= SEM_SPLIT_CODE_MAX) add('SU-153', 'warn', 'Help the browser help the user', boxes[0], `${boxes.length} single-character inputs (split code boxes)`, 'Must accept a pasted code: autocomplete="one-time-code", inputmode="numeric", and spread pasted text over the boxes (or use one input)');
    }
  }

  REGISTERED = [...REGISTERED, ['placeholder contrast', checkPlaceholderContrast], ['field names', checkFieldNames], ['required markers', checkRequiredMarkers], ['autofill', checkAutofill]];
