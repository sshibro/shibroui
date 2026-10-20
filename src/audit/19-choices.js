  // ---------- 10. forms (SU-50, SU-51, SU-53) ----------
  function checkChoices() {
    for (const input of ROOT.querySelectorAll('input[type=checkbox], input[type=radio]')) {
      if (!input.isConnected || isDisabled(input)) continue;
      const named = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
      const shown = input.getClientRects().length > 0 || [...(input.labels || [])].some(isVisible);
      if (!shown) {
        // Inside a hidden state (tab, menu, dialog): the label association can still be checked statically.
        checked('checkboxes/radios in hidden states (static check)');
        if (!(input.labels || []).length && !named) add('SU-50', 'fail', 'Clickable labels', input, 'checkbox/radio has no associated label (in a hidden state)', 'Wrap it in <label> or use for/id so the whole row toggles it');
        continue;
      }
      checked('checkboxes/radios');
      const labels = [...(input.labels || [])].filter(isVisible);
      if (!labels.length) {
        add('SU-50', named ? 'warn' : 'fail', 'Clickable labels', input, named ? 'labelled by aria only; the visible words are not clickable' : 'checkbox/radio has no associated label', 'Wrap it in <label> or use for/id so the whole row toggles it');
        continue;
      }
      const label = labels[0];
      const rect = label.getBoundingClientRect();
      const union = { top: Math.min(rect.top, input.getBoundingClientRect().top), bottom: Math.max(rect.bottom, input.getBoundingClientRect().bottom) };
      if (union.bottom - union.top < 24) add('SU-50', 'warn', 'Clickable labels', label, `click area ${Math.round(union.bottom - union.top)}px tall`, 'Pad the label row to ~40px');
      if (css(label).userSelect !== 'none') add('SU-51', 'info', 'Label selection', label, 'option label text is selectable', 'user-select: none on short option labels');
      const s = css(label);
      const lineHeight = s.lineHeight === 'normal' ? px(s.fontSize) * 1.2 : px(s.lineHeight);
      if (rect.height > lineHeight * 1.8 && label.contains(input)) {
        const inputRect = input.getBoundingClientRect();
        const firstLineCenter = rect.top + px(s.paddingTop) + lineHeight / 2;
        if (Math.abs(inputRect.top + inputRect.height / 2 - firstLineCenter) > lineHeight * 0.5) add('SU-53', 'warn', 'Wrapped labels', input, 'control is not aligned with the first line of its wrapped label', 'align-items: flex-start and center the box on the first line');
      }
    }
  }

