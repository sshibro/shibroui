
  // ---------- microcopy (SU-178, SU-179, SU-180, SU-181, SU-183, SU-184) ----------
  const SEM_DIALOGS = 'dialog, [role=dialog], [role=alertdialog]';
  const SEM_BUTTONS = 'button, [role=button], input[type=button], input[type=submit]';
  const SEM_VAGUE_DIALOG_BUTTON = /^(ok|okay|yes|no|submit|confirm|continue)$/i;
  const SEM_VAGUE_CONFIRM_TITLE = /^(are you sure\??|confirm)$/i;
  const SEM_GENERIC_ERROR = /^(error|invalid( input| value)?|something went wrong|an error (has )?occurred|this field is required|required|oops!?)[.!]?$/i;
  const SEM_ERROR_CODE = /^(error )?[A-Z0-9_-]{3,}$/i;
  const SEM_INSTRUCTION_PLACEHOLDER = /^(enter|type|input|fill in|please)\b/i;
  const SEM_PLACEHOLDER_CONTENT = /lorem ipsum|john doe|jane doe|foo@bar|example@example\.com/i;
  const SEM_PLACEHOLDER_CONTENT_ALL = new RegExp(SEM_PLACEHOLDER_CONTENT.source, 'gi');
  const SEM_TITLE_CASE_MIN_WORDS = 3;
  const SEM_TITLE_CASE_MIN_LONG_WORDS = 2;
  const SEM_LONG_WORD_LETTERS = 3;
  const SEM_TITLE_CASE_MAX_CHARS = 80;
  const semLetters = (word) => [...word].filter((char) => /\p{L}/u.test(char)).length;
  const semDialogs = () => [...new Set([...(ROOT.matches(SEM_DIALOGS) ? [ROOT] : []), ...ROOT.querySelectorAll(SEM_DIALOGS)])].filter(isVisible);
  const semButtonText = (el) => semClean(el.matches('input') ? el.value : el.innerText);
  const semStartsUpper = (word) => { const first = [...word].find((char) => /\p{L}/u.test(char)); return first !== first.toLowerCase() && first === first.toUpperCase(); };
  // "Create New Project Settings": every word of 3+ letters is capitalized and it is not an all-caps label.
  function semLooksTitleCased(text) {
    const words = text.split(/\s+/).filter((word) => semLetters(word) > 0);
    const long = words.filter((word) => semLetters(word) >= SEM_LONG_WORD_LETTERS);
    if (words.length < SEM_TITLE_CASE_MIN_WORDS || long.length < SEM_TITLE_CASE_MIN_LONG_WORDS || text === text.toUpperCase()) return false;
    return long.every(semStartsUpper);
  }
  const semIsGenericError = (text) => SEM_GENERIC_ERROR.test(text) || (SEM_ERROR_CODE.test(text) && /[0-9_]/.test(text));

  function checkButtonCopy() {
    const inDialog = new Set();
    for (const dialog of semDialogs()) {
      for (const button of dialog.querySelectorAll(SEM_BUTTONS)) {
        inDialog.add(button);
        if (isVisible(button) && semIsEnglish(button) && SEM_VAGUE_DIALOG_BUTTON.test(semButtonText(button))) add('SU-178', 'warn', 'Buttons name the outcome', button, `dialog button "${semButtonText(button)}" does not name the action`, 'Name the action: verb + object ("Delete project", "Keep editing")');
      }
    }
    for (const button of ROOT.querySelectorAll(SEM_BUTTONS)) {
      if (!inDialog.has(button) && isVisible(button) && semIsEnglish(button) && /^submit$/i.test(semButtonText(button))) add('SU-178', 'info', 'Buttons name the outcome', button, 'button says "Submit"', 'Name the outcome: "Send message", "Create account"');
    }
  }

  function checkHeadingAndButtonCase() {
    for (const el of ROOT.querySelectorAll(`h1, h2, h3, h4, h5, h6, [role=heading], ${SEM_BUTTONS}`)) {
      const text = semButtonText(el);
      if (text.length > SEM_TITLE_CASE_MAX_CHARS || !semLooksTitleCased(text) || !isVisible(el) || !semIsEnglish(el)) continue;
      add('SU-179', 'info', 'Sentence case', el, `"${text}" is in title case`, 'Use sentence case: capitalize the first word and proper nouns only');
    }
  }

  function checkErrorCopy() {
    const described = semDescribedIds();
    const messages = new Set([...ROOT.querySelectorAll('[role=alert], [aria-live]:not([aria-live=off])'), ...semToastLike(), ...[...described].map((id) => document.getElementById(id)).filter((node) => node && ROOT.contains(node))]);
    for (const el of messages) {
      const text = semClean(el.textContent);
      if (text && semIsGenericError(text) && isVisible(el) && semIsEnglish(el)) add('SU-180', 'warn', 'Error formula', el, `"${text.slice(0, 40)}" does not say what happened or how to fix it`, 'Say what happened and how to fix it: "Card declined. Check the number or try another card."');
    }
  }

  function checkConfirmTitles() {
    for (const dialog of semDialogs()) {
      const labelled = semIdsOf(dialog, 'aria-labelledby').map((id) => document.getElementById(id)).filter(Boolean)[0];
      const heading = labelled || dialog.querySelector('h1, h2, h3, [role=heading]');
      const title = heading ? semClean(heading.textContent) : '';
      if (semIsEnglish(dialog) && SEM_VAGUE_CONFIRM_TITLE.test(title)) add('SU-181', 'warn', 'Confirmation dialogs', dialog, `dialog title "${title}" does not name the action`, 'Ask about the specific action and object: "Delete project \'Atlas\'?"');
    }
  }

  function checkPlaceholderCopy() {
    for (const field of ROOT.querySelectorAll('input[placeholder], textarea[placeholder]')) {
      if (field.matches(TEXT_FIELD) && semIsEnglish(field) && SEM_INSTRUCTION_PLACEHOLDER.test(semClean(field.getAttribute('placeholder'))) && isVisible(field)) {
        add('SU-183', 'info', 'Plain language', field, 'placeholder reads as an instruction', 'Put instructions in the label or a hint; a placeholder holds an example ("maya@northstar.studio")');
      }
    }
    const walker = document.createTreeWalker(ROOT, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (SEM_PLACEHOLDER_CONTENT.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    for (let count = 0; walker.nextNode() && count < LIMITS.maxElements; count += 1) {
      const parent = walker.currentNode.parentElement;
      if (!parent || parent.closest('script, style, noscript, template, title') || !isVisible(parent)) continue;
      add('SU-184', 'info', 'Real content', parent, `placeholder content: ${[...new Set(walker.currentNode.nodeValue.match(SEM_PLACEHOLDER_CONTENT_ALL).map((found) => `"${found.toLowerCase()}"`))].join(', ')}`, 'Use plausible, varied names, numbers and dates; they also stress-test the layout');
    }
  }

  REGISTERED = [...REGISTERED, ['button copy', checkButtonCopy], ['heading case', checkHeadingAndButtonCase], ['error copy', checkErrorCopy], ['confirm titles', checkConfirmTitles], ['placeholder copy', checkPlaceholderCopy]];
