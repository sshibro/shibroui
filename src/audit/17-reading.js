  // ---------- 8. reading text (SU-5, SU-7, SU-15, SU-25) ----------
  const BLOCKY = /^(block|flex|grid|list-item|table|table-row|table-cell)$/;
  function checkReading() {
    for (const el of ROOT.querySelectorAll('p, li, blockquote, dd, figcaption, div, section, article, td')) {
      const text = el.textContent.trim().replace(/\s+/g, ' ');
      if (text.length < 120 || !isVisible(el) || [...el.children].some((c) => BLOCKY.test(css(c).display))) continue;
      const s = css(el);
      const size = px(s.fontSize);
      const lineHeight = s.lineHeight === 'normal' ? size * 1.2 : px(s.lineHeight);
      const rect = el.getBoundingClientRect();
      const contentWidth = rect.width - px(s.paddingLeft) - px(s.paddingRight) - px(s.borderLeftWidth) - px(s.borderRightWidth);
      const lines = Math.round((rect.height - px(s.paddingTop) - px(s.paddingBottom)) / lineHeight);
      if (lines < 2) continue;
      // Measured in ch (width of "0"), the unit the rule is written in: 65ch holds ~80–90 average characters.
      ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const measure = Math.round(contentWidth / ctx.measureText('0').width);
      if (measure > LIMITS.measureHigh) add('SU-15', 'warn', 'Line length', el, `text column ≈${measure}ch wide`, 'max-width: 65ch on the text column (60–75ch OK)');
      // A phone-width viewport makes short lines unavoidable; only flag narrow columns on wider screens.
      if (measure < LIMITS.measureLow && lines >= 4 && innerWidth > LIMITS.narrowViewport) add('SU-15', 'warn', 'Line length', el, `text column ≈${measure}ch wide`, 'Widen the column toward 60–75ch');
      if (s.textAlign === 'center' && lines >= 3) add('SU-7', 'warn', 'Text alignment', el, `centered paragraph over ${lines} lines`, 'text-align: start for multi-line prose');
      if (s.textAlign === 'justify' && s.hyphens !== 'auto') add('SU-7', 'warn', 'Text alignment', el, 'justified without hyphenation', 'text-align: start, or hyphens: auto with lang');
      const leading = lineHeight / size;
      if (size <= 20 && leading < LIMITS.leadingLow) add('SU-5', 'warn', 'Line height', el, `line-height ${leading.toFixed(2)} at ${size}px`, 'line-height ~1.5 for body text');
      if (leading > LIMITS.leadingHigh) add('SU-5', 'warn', 'Line height', el, `line-height ${leading.toFixed(2)}`, 'line-height ~1.5 keeps the paragraph together');
      if (size < LIMITS.minReadingPx) add('SU-25', 'warn', 'Readable size', el, `${size}px paragraph text`, 'Keep reading text ≥ 14px (16px for paragraphs)');
    }
  }

