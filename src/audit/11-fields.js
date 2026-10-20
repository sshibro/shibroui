  // ---------- 2. field visibility (SU-44) ----------
  function checkFields() {
    for (const field of ROOT.querySelectorAll(TEXT_FIELD)) {
      if (!isVisible(field) || !field.parentElement) continue;
      checked('form fields');
      const rect = reveal(field);
      const behind = backdropAt(field.parentElement, rect.left - 1, rect.top - 1);
      if (behind.covered || behind.image) { skipped('field surface not measurable'); continue; }
      const surface = behind.color;
      const s = css(field);
      const fill = over(parseColor(s.backgroundColor), surface);
      const borderRatios = ['Top', 'Right', 'Bottom', 'Left']
        .filter((side) => px(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none')
        .map((side) => ratio(over(parseColor(s[`border${side}Color`]), fill), surface));
      const best = Math.max(ratio(fill, surface), ...borderRatios, s.boxShadow !== 'none' ? 99 : 1);
      if (best < LIMITS.fieldBoundary) {
        add('SU-44', 'fail', 'Input contrast', field, `field fill and border are ${best.toFixed(2)}:1 against ${hex(surface)}`, 'Give the field its own shade and a visible border');
      }
    }
  }

