  // ---------- 9. links (SU-6, SU-9) ----------
  const VAGUE = /^(click here|here|read more|more|learn more|link|this link|go|details|continue reading)$/;
  function checkLinks() {
    const byName = new Map();
    for (const a of ROOT.querySelectorAll('a[href]')) {
      if (!isVisible(a)) continue;
      const name = (a.getAttribute('aria-label') || a.textContent).trim().toLowerCase().replace(/\s+/g, ' ');
      if (VAGUE.test(name)) add('SU-6', 'fail', 'Descriptive links', a, `link text "${name}"`, 'Name the destination ("Billing settings", "Typography guide")');
      if (name) byName.set(name, [...(byName.get(name) || []), a]);
      if (!isInlineLink(a)) continue;
      const s = css(a);
      const marked = /underline/.test(s.textDecorationLine) || px(s.borderBottomWidth) > 0 || s.backgroundImage !== 'none';
      if (marked) continue;
      const difference = ratio(parseColor(s.color), parseColor(css(a.parentElement).color));
      add('SU-9', difference < 3 ? 'fail' : 'warn', 'Obvious links', a, `inline link without underline (${difference.toFixed(2)}:1 from surrounding text)`, 'text-decoration: underline; text-underline-offset: .2em');
    }
    for (const [name, links] of byName) {
      const hrefs = new Set(links.map((l) => l.getAttribute('href')));
      if (links.length > 1 && hrefs.size > 1 && name.length < 30) add('SU-6', 'warn', 'Descriptive links', links[0], `${links.length} links share the text "${name}" but go to different places`, 'Make each link text name its destination');
    }
  }

