  // ---------- 13. centered content (SU-137, with SU-30) ----------
  // Text that sits a few px off-center in a pill, chip or button, or a sliding selection highlight drawn
  // a few px off its label, is invisible to every other check and easy to miss by eye in a screenshot.
  const CONTROL_LIKE = 'button, [role=button], [role=tab], [role=radio], [role=option], [role=menuitem], a[href], label, span, div, li';
  function contentBox(el) {
    const boxes = [];
    let texts = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    while (walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0).forEach((r) => { boxes.push(r); texts += 1; });
    }
    const icons = [...el.querySelectorAll('svg, img, i, [class*=icon]')].filter((n) => isVisible(n) && n.getBoundingClientRect().width >= 6).map((n) => n.getBoundingClientRect());
    const all = [...boxes, ...icons];
    if (!all.length) return null;
    return {
      left: Math.min(...all.map((b) => b.left)), right: Math.max(...all.map((b) => b.right)),
      top: Math.min(...all.map((b) => b.top)), bottom: Math.max(...all.map((b) => b.bottom)), texts, icons: icons.length,
    };
  }
  const offCenterLevel = (diff, width) => (diff > Math.max(6, width * 0.06) ? 'fail' : diff > Math.max(3, width * 0.03) ? 'warn' : null);
  function checkCentering() {
    const indicatorFor = new Set();
    // (b) Separately drawn highlights: an untexted surface behind an interactive item.
    for (const ind of [...ROOT.querySelectorAll('span, div, i, b, li')].slice(0, LIMITS.maxElements)) {
      if (ind.textContent.trim() || !isVisible(ind) || !hasBoundary(ind) || !/absolute|fixed/.test(css(ind).position)) continue;
      const r = ind.getBoundingClientRect();
      if (r.height < 16 || r.height > 96 || r.width < 24 || r.width > 600 || !ind.parentElement) continue;
      const overlap = (o) => Math.max(0, Math.min(r.right, o.right) - Math.max(r.left, o.left)) * Math.max(0, Math.min(r.bottom, o.bottom) - Math.max(r.top, o.top));
      const item = [...ind.parentElement.querySelectorAll(INTERACTIVE)].filter((n) => !n.contains(ind) && isVisible(n))
        .map((n) => ({ n, area: overlap(n.getBoundingClientRect()) })).sort((a, b) => b.area - a.area)[0];
      if (!item || item.area < 0.5 * Math.min(r.width * r.height, item.n.getBoundingClientRect().width * item.n.getBoundingClientRect().height)) continue;
      const content = contentBox(item.n);
      if (!content || !content.texts) continue;
      checked('selection indicators');
      indicatorFor.add(item.n);
      const [left, right] = [content.left - r.left, r.right - content.right];
      const level = offCenterLevel(Math.abs(left - right), r.width);
      if (level) {
        add('SU-137', level, 'Centered content', ind,
          `selection highlight is ${Math.abs((left - right) / 2).toFixed(1)}px off-center behind ${describe(item.n)} (left ${Math.round(left)}px vs right ${Math.round(right)}px)`,
          'Position the highlight from the selected item\'s own box (left = item.offsetLeft, width = item.offsetWidth), with no extra gap or padding offset');
      }
    }
    // (a) Content inside pill-like controls that are meant to be centered.
    for (const el of [...ROOT.querySelectorAll(CONTROL_LIKE)].slice(0, LIMITS.maxElements)) {
      if (indicatorFor.has(el) || !isVisible(el) || !hasBoundary(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 16 || r.height > 96 || r.width < 24 || r.width > 480) continue;
      // Overflowing (truncated) content has no meaningful center; SU-200 reports the truncation itself.
      if (el.scrollWidth > el.clientWidth + 1) continue;
      const content = contentBox(el);
      if (!content || !content.texts) continue;
      const s = css(el);
      const [left, right] = [content.left - r.left, r.right - content.right];
      const hugs = r.width <= content.right - content.left + px(s.paddingLeft) + px(s.paddingRight) + px(s.borderLeftWidth) + px(s.borderRightWidth) + 4;
      const centered = s.textAlign === 'center' || /center/.test(s.justifyContent) || hugs || el.matches('button, [role=button], [role=tab], [role=radio]');
      if (!centered || (s.textAlign !== 'center' && !/center/.test(s.justifyContent) && !hugs && right > r.width * 0.35)) continue;
      checked('centered controls');
      if (content.icons) {
        const iconLeft = [...el.querySelectorAll('svg, img, i, [class*=icon]')].some((n) => Math.abs(n.getBoundingClientRect().left - content.left) < 1);
        const [iconSide, textSide] = iconLeft ? [left, right] : [right, left];
        if (iconSide > textSide + 2) add('SU-30', 'warn', 'Button padding', el, `icon side has ${Math.round(iconSide)}px vs ${Math.round(textSide)}px on the text side`, 'Give the icon side ~4px less padding than the text side');
        continue;
      }
      const level = offCenterLevel(Math.abs(left - right), r.width);
      if (level) {
        add('SU-137', level, 'Centered content', el, `label is ${Math.abs((left - right) / 2).toFixed(1)}px off-center (left ${Math.round(left)}px vs right ${Math.round(right)}px)`, 'Make the inline padding symmetric (or center with justify-content), then judge optically');
      }
      const [top, bottom] = [content.top - r.top, r.bottom - content.bottom];
      if (Math.abs(top - bottom) > 4) add('SU-137', 'warn', 'Centered content', el, `label sits ${Math.abs((top - bottom) / 2).toFixed(1)}px ${top > bottom ? 'low' : 'high'} (top ${Math.round(top)}px vs bottom ${Math.round(bottom)}px)`, 'Center with align-items: center and equal block padding; then nudge optically (SU-36)');
    }
  }

