  // ---------- Long pages: anchors, reveals, heading proximity, code blocks (SU-207, SU-209, SU-220, SU-221) ----------
  const LP_LIMITS = {
    headerMinWidth: 0.6, headerMinHeight: 40, headerTopSlack: 8, headerClearance: 16, tallViewports: 4, minProse: 12, proseChars: 80,
    tocLinks: 3, contentChars: 20, minRevealSize: 8, maxAnchors: 400, maxHeadings: 400, maxRevealTargets: 20, maxRules: 600, maxCodeBlocks: 100,
  };
  const LP_SKIP_TARGET = /^(main|main-content|maincontent|content)$/i;
  const LP_NOT_AN_ANCHOR = '[role=tab], [role=button], [aria-controls], [aria-expanded], [data-toggle], [data-bs-toggle]';
  const LP_FIX_REVEAL = 'Gate the hidden start state on a class JS sets (html.js .reveal), so content is visible without JS, in print and in headless renders';
  const LP_GATE = /(?:^|[\s>+~(])(?:html|body|:root)(?:\.[\w-]+|\[[^\]]+\]|:not\()|^\.(?:js|has-js|js-[\w-]+|enhanced)(?![\w-])/;
  const LP_REVEAL_STATE = /:hover|:focus|:active|:checked|:target|:disabled|:popover-open|:open|::|\[aria-|\[data-state|\[open|\[hidden/;
  const LP_NOT_A_REVEAL = /tooltip|toast|snackbar|popover|dropdown|modal|dialog|overlay|backdrop|drawer|sr-only|visually-hidden|skeleton|spinner|loader|ripple|cursor/i;
  const LP_OVERLAY_ANCESTOR = '[popover], dialog, [role=dialog], [role=tooltip], [role=menu], [role=listbox], [role=alert], [role=status], [aria-hidden=true], [inert], details:not([open])';
  const LP_HEADING_SKIP = 'nav, header, footer, button, label, summary, dialog, [role=dialog], [role=alertdialog], [popover], th, td, caption, [role=tab], [role=button], [aria-hidden=true]';
  const LP_HEADINGS = 'h2, h3, h4';

  // A rule inside a media query that does not match this viewport never applies.
  function lpRuleApplies(rule) {
    for (let parent = rule.parentRule; parent; parent = parent.parentRule) {
      if (parent instanceof CSSMediaRule && !matchMedia(parent.media.mediaText).matches) return false;
    }
    return true;
  }
  const lpRuleGated = (rule) => {
    for (let parent = rule.parentRule; parent; parent = parent.parentRule) {
      if (parent instanceof CSSMediaRule && /scripting\s*:\s*enabled/.test(parent.conditionText || parent.media.mediaText)) return true;
    }
    return false;
  };

  // ----- SU-207: sticky header vs in-page anchors, and a table of contents on long reading pages -----
  function lpTargetOf(link) {
    const href = link.getAttribute('href') || '';
    if (href.length < 2) return null;
    let id = href.slice(1);
    try { id = decodeURIComponent(id); } catch { /* keep the raw id */ }
    if (LP_SKIP_TARGET.test(id)) return null;
    const target = document.getElementById(id);
    return target && !target.matches('main') ? target : null;
  }
  function lpAnchors() {
    return [...ROOT.querySelectorAll('a[href^="#"]')].slice(0, LP_LIMITS.maxAnchors)
      .filter((link) => !link.matches(LP_NOT_AN_ANCHOR) && isVisible(link))
      .flatMap((link) => { const target = lpTargetOf(link); return target ? [{ link, target }] : []; });
  }
  // The outermost fixed/sticky bar stuck to the top edge: wide, and tall enough to cover content.
  function lpPinnedHeader() {
    const bars = pinnedLayers().filter((layer) => {
      const style = css(layer);
      const rect = layer.getBoundingClientRect();
      return style.top !== 'auto' && px(style.top) <= LP_LIMITS.headerTopSlack
        && rect.width >= innerWidth * LP_LIMITS.headerMinWidth && rect.height >= LP_LIMITS.headerMinHeight;
    });
    return bars.reduce((tallest, bar) => (!tallest || bar.getBoundingClientRect().height > tallest.getBoundingClientRect().height ? bar : tallest), null);
  }
  function lpCheckAnchorOffsets(anchors) {
    const header = lpPinnedHeader();
    if (!header || !anchors.length) return;
    checked('pinned headers');
    checked('in-page anchors', anchors.length);
    const height = Math.round(header.getBoundingClientRect().height);
    const rootPadding = px(css(document.documentElement).scrollPaddingTop);
    const covered = anchors.filter(({ target }) => px(css(target).scrollMarginTop) + rootPadding < height);
    if (!covered.length) return;
    const offset = Math.min(...covered.map(({ target }) => px(css(target).scrollMarginTop) + rootPadding));
    const clearance = height + LP_LIMITS.headerClearance;
    add('SU-207', 'warn', 'Stay oriented on long pages', header,
      `a ${height}px pinned header covers the top of ${covered.length} of ${anchors.length} in-page anchor target(s) after a jump (scroll offset ${offset}px)`,
      `html { scroll-padding-top: ${clearance}px }, or [id] { scroll-margin-top: ${clearance}px }, so a jumped-to heading lands below the header`);
  }
  // Three or more in-page links inside one nav or list are a table of contents.
  function lpHasToc(anchors) {
    const counts = anchors.reduce((map, { link }) => {
      const group = link.closest('nav, ul, ol, [role=navigation]');
      return group ? new Map([...map, [group, new Set([...(map.get(group) || []), link.getAttribute('href')])]]) : map;
    }, new Map());
    return [...counts.values()].some((hrefs) => hrefs.size >= LP_LIMITS.tocLinks);
  }
  function lpCheckToc(anchors) {
    const viewports = document.documentElement.scrollHeight / innerHeight;
    if (viewports < LP_LIMITS.tallViewports) return;
    const prose = [...ROOT.querySelectorAll('p')].filter((p) => p.closest('main, article') && p.getClientRects().length > 0
      && p.textContent.trim().length >= LP_LIMITS.proseChars).length;
    if (prose < LP_LIMITS.minProse) return;
    checked('long reading pages');
    if (lpHasToc(anchors)) return;
    add('SU-207', 'info', 'Stay oriented on long pages', null,
      `${viewports.toFixed(1)} screens of prose (${prose} paragraphs) and no table of contents`,
      'Add a table of contents (a nav of in-page links) at the top of the article, sticky in a side rail from ~1200px wide, with the current section marked aria-current="true"');
  }

  // ----- SU-209: scroll reveals that hide content without a JS-set gate -----
  const lpDurationsMs = (value) => String(value || '').split(',').map((v) => (v.trim().endsWith('ms') ? px(v) : px(v) * 1000));
  // 'transition' | 'animation' | '' : what moves the element's opacity or transform at rest.
  function lpRevealMotion(style) {
    const properties = String(style.transitionProperty || '').split(',').map((p) => p.trim());
    const times = lpDurationsMs(style.transitionDuration);
    const transitions = properties.some((prop, i) => /^(all|opacity|transform)$/.test(prop) && times[i % times.length] > 0);
    if (transitions) return 'transition';
    return style.animationName && style.animationName !== 'none' && lpDurationsMs(style.animationDuration).some((ms) => ms > 0) ? 'animation' : '';
  }
  function lpHoldsContent(el) {
    if (el.textContent.trim().length < LP_LIMITS.contentChars || el.matches(LP_OVERLAY_ANCESTOR) || el.closest(LP_OVERLAY_ANCESTOR)) return false;
    const style = css(el);
    if (/absolute|fixed/.test(style.position) || style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width >= LP_LIMITS.minRevealSize && rect.height >= LP_LIMITS.minRevealSize;
  }
  function lpCheckRevealGates({ rules }) {
    const seen = new Set();
    let examined = 0;
    for (const { rule, inReduced } of rules) {
      if (inReduced || examined >= LP_LIMITS.maxRules || !/^0(\.0+)?%?$/.test(rule.style.opacity.trim())) continue;
      if (!lpRuleApplies(rule) || lpRuleGated(rule)) continue;
      for (const part of splitSelectorList(rule.selectorText || '').map((p) => p.trim()).filter(Boolean)) {
        if (seen.has(part) || LP_REVEAL_STATE.test(part) || LP_GATE.test(part) || LP_NOT_A_REVEAL.test(part)) continue;
        seen.add(part);
        examined += 1;
        let matches = [];
        try { matches = [...ROOT.querySelectorAll(part)].slice(0, LP_LIMITS.maxRevealTargets); } catch { continue; }
        for (const el of matches) {
          if (!lpHoldsContent(el)) continue;
          checked('hidden-at-rest content blocks');
          const motion = lpRevealMotion(css(el));
          if (!motion) continue;
          add('SU-209', 'warn', 'Scroll reveals enhance; they never hide', el,
            `${part} starts at opacity: 0 with a ${motion} and no JS-set gate on html/body, so the content stays invisible without JS, in print and in headless renders`,
            LP_FIX_REVEAL);
        }
      }
    }
  }
  // The core prepare sweep lists reveals that were already in the first screen at load.
  function lpCheckPreparedReveals() {
    if (typeof PREPARED === 'undefined' || !PREPARED || !PREPARED.hiddenInFirstViewport) return;
    for (const el of PREPARED.hiddenInFirstViewport) {
      checked('reveals in the first screen');
      add('SU-209', 'warn', 'Scroll reveals enhance; they never hide', el, 'hidden at load although it was already in the first screen', LP_FIX_REVEAL);
    }
  }

  // ----- SU-220: a heading belongs to what follows -----
  const lpInFlow = (el) => {
    const style = css(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && !/absolute|fixed/.test(style.position) && el.getBoundingClientRect().height > 0;
  };
  const lpSiblingAbove = (el) => { for (let node = el.previousElementSibling; node; node = node.previousElementSibling) if (lpInFlow(node)) return node; return null; };
  const lpSiblingBelow = (el) => { for (let node = el.nextElementSibling; node; node = node.nextElementSibling) if (lpInFlow(node)) return node; return null; };
  function lpHeadingGaps(heading) {
    const [above, below] = [lpSiblingAbove(heading), lpSiblingBelow(heading)];
    if (!above || !below || above.matches('h1, h2, h3, h4, h5, h6')) return null;
    const [h, a, b] = [heading, above, below].map((node) => node.getBoundingClientRect());
    // Side by side (a flex row, a floated figure) is not a stack: there is no vertical gap to compare.
    if (a.bottom > h.top + 1 || b.top < h.bottom - 1) return null;
    return { spaceAbove: Math.max(0, h.top - a.bottom), spaceBelow: Math.max(0, b.top - h.bottom) };
  }
  function lpCheckHeadingProximity() {
    for (const heading of [...ROOT.querySelectorAll(LP_HEADINGS)].slice(0, LP_LIMITS.maxHeadings)) {
      if (heading.closest(LP_HEADING_SKIP) || !isVisible(heading) || !heading.textContent.trim()) continue;
      const gaps = lpHeadingGaps(heading);
      if (!gaps) continue;
      checked('headings (space above vs below)');
      const { spaceAbove, spaceBelow } = gaps;
      if (Math.round(spaceBelow) < Math.round(spaceAbove)) continue;
      add('SU-220', 'warn', 'Headings belong to what follows', heading,
        `${heading.tagName.toLowerCase()} has ${Math.round(spaceBelow)}px of space below and ${Math.round(spaceAbove)}px above: it reads as the end of the previous block, not the start of its own`,
        'Space above a heading ≈ 1.5–2× the space below it (margin-top: 1.5em; margin-bottom: 0.5em), so it groups with the content that follows');
    }
  }

  // ----- SU-221: a code block that neither scrolls nor wraps -----
  function lpCheckCodeBlocks() {
    for (const block of [...ROOT.querySelectorAll('pre')].slice(0, LP_LIMITS.maxCodeBlocks)) {
      if (!isVisible(block)) continue;
      checked('code blocks');
      const overflowX = css(block).overflowX;
      const overflow = block.scrollWidth - block.clientWidth;
      if (!/^(visible|hidden|clip)$/.test(overflowX) || overflow <= 1) continue;
      add('SU-221', 'warn', 'Code blocks read and copy cleanly', block,
        `pre content is ${block.scrollWidth}px wide in a ${block.clientWidth}px box and does not scroll (overflow-x: ${overflowX}): it spills out or is clipped`,
        'overflow-x: auto on the pre, with tabindex="0" and an aria-label so keyboard users can scroll it, and never let it widen the page');
    }
  }

  function checkLongPages(context) {
    const anchors = lpAnchors();
    lpCheckAnchorOffsets(anchors);
    lpCheckToc(anchors);
    lpCheckRevealGates(context);
    lpCheckPreparedReveals();
  }
  REGISTERED = [...REGISTERED, ['long pages', (context) => checkLongPages(context)], ['heading proximity', () => lpCheckHeadingProximity()],
    ['code blocks', () => lpCheckCodeBlocks()]];
