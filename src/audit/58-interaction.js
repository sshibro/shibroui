  // ---------- Interaction states: layout shift, contrast, color-only selection, disabled hints (SU-249, SU-250, SU-251, SU-252) ----------
  const IX_LIMITS = {
    shiftSlack: 1, boxSlack: 0.5, perRule: 8, maxRules: 400, maxGroups: 150, maxLabelChars: 80, maxDisabled: 100, fieldOpacity: 0.7,
    boldWeight: 700, selectedFillRatio: 3, selectedTextRatio: 3, hintChars: 8,
  };
  const IX_STATE_SOURCE = ':hover|:active|\\[aria-selected=["\']?true["\']?\\]|\\[aria-current(?:=["\']?[\\w-]+["\']?)?\\]|\\[aria-pressed=["\']?true["\']?\\]'
    + '|\\.is-active(?![\\w-])|\\.active(?![\\w-])|\\.selected(?![\\w-])|\\[data-state=["\']?(?:active|on|checked|open)["\']?\\]';
  const IX_STATE = new RegExp(IX_STATE_SOURCE);
  const IX_STATE_ALL = new RegExp(IX_STATE_SOURCE, 'g');
  const IX_NEGATED_STATE = /:not\([^)]*(?:hover|active|aria-|selected)/;
  const IX_SIDES = ['top', 'right', 'bottom', 'left'];
  const IX_SELECTED = '[aria-selected="true"], [aria-current]:not([aria-current="false"]), [aria-pressed="true"], [aria-checked="true"], .active, .is-active, .selected';
  const IX_GROUP = '[role=tablist], [role=radiogroup], [role=listbox], [role=menu], nav';
  const IX_NOT_A_GROUP = '[aria-label*="readcrumb" i], .breadcrumb, .breadcrumbs';
  const IX_INDICATOR = /indicator|slider|thumb|underline|highlight|marker|glider/i;
  const IX_ITEM = `${INTERACTIVE}, [role=tab], [role=radio], [role=option], [role=menuitem]`;
  const ixCanvas = document.createElement('canvas').getContext('2d');

  // ----- shared helpers -----
  function ixResolve(value, el) {
    let text = String(value || '').trim();
    for (let pass = 0; pass < 3 && /var\(/.test(text); pass += 1) {
      text = text.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_, name, fallback) => css(el).getPropertyValue(name).trim() || (fallback || '').trim());
    }
    return /var\(/.test(text) ? '' : text.trim();
  }
  function ixLength(value, el, base = el) {
    const text = String(value || '').trim();
    if (/^0(px)?$/.test(text)) return 0;
    const match = text.match(/^(-?\d*\.?\d+)(px|rem|em)$/);
    if (!match) return NaN;
    const unit = match[2] === 'px' ? 1 : px(css(match[2] === 'rem' ? document.documentElement : base).fontSize);
    return parseFloat(match[1]) * unit;
  }
  function ixWeight(value, el) {
    const text = ixResolve(value, el).toLowerCase();
    if (text === 'normal') return 400;
    if (text === 'bold') return 700;
    return /^\d+(\.\d+)?$/.test(text) ? parseFloat(text) : NaN;
  }
  function ixColor(value, el) {
    const text = ixResolve(value, el);
    if (!text || /^(inherit|initial|unset|revert|currentcolor)$/i.test(text) || !CSS.supports('color', text)) return null;
    return parseColor(text);
  }
  // What shows through an element's own background: the page behind it, or null when that is an image or gradient.
  function ixBackdropBelow(el) {
    const rect = el.getBoundingClientRect();
    const backdrop = backdropAt(el.parentElement || el, rect.left + rect.width / 2, rect.top + rect.height / 2);
    return !backdrop || backdrop.covered || backdrop.image || backdrop.stops ? null : backdrop.color;
  }
  const ixLabelOf = (el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
  const ixIsSelected = (el) => el.matches(IX_SELECTED);

  // ----- width reservation and the pixels a weight change moves -----
  // A hidden bold copy of the label (::before/::after with content, visibility hidden) or a grade axis keeps the width fixed.
  // The reservation may sit on the item or on the label inside it (a <span data-label> in a link).
  const IX_RESERVE_DEPTH = 2;
  function ixReservesWidth(el, depth = 0) {
    if (/GRAD/i.test(css(el).fontVariationSettings)) return true;
    const own = ['::before', '::after'].some((pseudo) => {
      const style = getComputedStyle(el, pseudo);
      return !/^(none|normal|""|'')$/.test(style.content) && style.visibility === 'hidden';
    });
    return own || (depth < IX_RESERVE_DEPTH && [...el.children].some((child) => ixReservesWidth(child, depth + 1)));
  }
  function ixTextWidth(el, weight) {
    const style = css(el);
    ixCanvas.font = `${style.fontStyle} ${weight} ${style.fontSize} ${style.fontFamily}`;
    const raw = el.textContent.replace(/\s+/g, ' ').trim();
    const text = style.textTransform === 'uppercase' ? raw.toUpperCase() : style.textTransform === 'lowercase' ? raw.toLowerCase() : raw;
    return ixCanvas.measureText(text).width + px(style.letterSpacing) * text.length;
  }
  // How many pixels the element's own width changes when its weight goes from `now` to `other`; room inside a
  // fixed-width box (equal-width segments, a button with a set width) absorbs the change.
  function ixWeightShift(el, now, other) {
    const style = css(el);
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    if (!label || label.length > IX_LIMITS.maxLabelChars || el.getClientRects().length !== 1) return 0;
    const inner = el.getBoundingClientRect().width - ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((sum, side) => sum + px(style[side]), 0);
    const [current, changed] = [ixTextWidth(el, now), ixTextWidth(el, other)];
    if (current > inner + IX_LIMITS.shiftSlack) return 0;
    return Math.max(0, Math.abs(current - changed) - Math.max(0, inner - current));
  }

  // ----- selected items and their siblings (tablists, radiogroups, listboxes, segmented rows, nav lists) -----
  function ixPeers(item) {
    const parent = item.parentElement;
    if (!parent) return [];
    const siblings = [...parent.children].filter((c) => c !== item && c.tagName === item.tagName && isVisible(c));
    if (siblings.length || parent.tagName !== 'LI' || !parent.parentElement) return siblings;
    return [...parent.parentElement.children].filter((li) => li !== parent && li.tagName === 'LI')
      .map((li) => li.querySelector(item.tagName.toLowerCase())).filter((c) => c && isVisible(c));
  }
  function ixGroupOf(item, peers) {
    const container = item.closest(IX_GROUP);
    if (container) return container;
    const parent = item.parentElement;
    const kind = (member) => (member.getAttribute('class') || '').split(/\s+/).filter((name) => !/^(is-)?(active|selected|current)$/.test(name)).sort().join(' ');
    const row = parent && /flex|grid/.test(css(parent).display) && [item, ...peers].every((member) => member.matches(IX_ITEM) && kind(member) === kind(item));
    return row && peers.length ? parent : null;
  }
  let ixGroupCache = null;
  // One entry per group: the selected item, its unselected siblings and the container.
  function ixGroups() {
    if (ixGroupCache) return ixGroupCache;
    const seen = new Set();
    ixGroupCache = [...ROOT.querySelectorAll(IX_SELECTED)].slice(0, LIMITS.maxElements).reduce((groups, node) => {
      if (groups.length >= IX_LIMITS.maxGroups || !isVisible(node)) return groups;
      const item = node.matches('li') ? node.querySelector(IX_ITEM) : node;
      if (!item || !item.matches(IX_ITEM) || item.closest(IX_NOT_A_GROUP)) return groups;
      const peers = ixPeers(item).filter((peer) => !ixIsSelected(peer));
      const container = ixGroupOf(item, peers);
      if (!container || !peers.length || seen.has(container)) return groups;
      seen.add(container);
      return [...groups, { item, peers, container }];
    }, []);
    return ixGroupCache;
  }
  const ixFlaggedShift = new Set();

  // ----- SU-249: states change paint, not layout -----
  // Which box properties a state rule changes, compared with how the element looks at rest (or unselected).
  function ixSideValues(style, kind, el) {
    const longhand = (side) => (kind === 'padding' ? `padding-${side}` : `border-${side}-width`);
    const tokens = ixResolve(style.getPropertyValue(kind === 'padding' ? 'padding' : 'border-width'), el).split(/\s+/).filter(Boolean);
    const expanded = tokens.length ? [tokens[0], tokens[1] || tokens[0], tokens[2] || tokens[0], tokens[3] || tokens[1] || tokens[0]] : [];
    return IX_SIDES.map((side, i) => ixResolve(style.getPropertyValue(longhand(side)), el) || expanded[i] || '');
  }
  function ixBoxChanged(style, kind, el, reference) {
    const rest = css(reference);
    return ixSideValues(style, kind, el).some((value, i) => {
      const next = ixLength(value, el);
      const now = px(rest[kind === 'padding' ? `padding${IX_SIDES[i][0].toUpperCase()}${IX_SIDES[i].slice(1)}` : `border${IX_SIDES[i][0].toUpperCase()}${IX_SIDES[i].slice(1)}Width`]);
      return value !== '' && !Number.isNaN(next) && Math.abs(next - now) > IX_LIMITS.boxSlack;
    });
  }
  function ixShiftingProperties(rule, el, reference) {
    const style = rule.style;
    const changed = [];
    if (ixBoxChanged(style, 'padding', el, reference)) changed.push('padding');
    if (ixBoxChanged(style, 'border', el, reference)) changed.push('border-width');
    const size = ixLength(ixResolve(style.getPropertyValue('font-size'), el), el, el.parentElement || el);
    if (!Number.isNaN(size) && Math.abs(size - px(css(reference).fontSize)) > IX_LIMITS.boxSlack) changed.push('font-size');
    const weight = ixWeight(style.getPropertyValue('font-weight'), el);
    const now = ixWeight(css(reference).fontWeight, reference);
    const reserved = ixReservesWidth(el) || /GRAD/i.test(style.getPropertyValue('font-variation-settings'));
    if (!Number.isNaN(weight) && weight !== now && !reserved && ixWeightShift(reference, now, weight) > IX_LIMITS.shiftSlack) changed.push('font-weight');
    return changed;
  }
  function ixStateParts(rule) {
    return splitSelectorList(rule.selectorText || '').map((part) => part.trim())
      .filter((part) => part && IX_STATE.test(part) && !IX_NEGATED_STATE.test(part) && !/::|:before|:after/.test(part));
  }
  // Elements a state selector applies to: for :hover/:active every match, for attribute/class states the ones in that state.
  function ixStateElements(part) {
    const probe = part.replace(/:hover|:active/g, '').trim();
    if (!probe || /[\s>+~(]$/.test(probe)) return [];
    let found = [];
    try { found = [...ROOT.querySelectorAll(probe)]; } catch { return []; }
    return found.filter((el) => isVisible(el) && !el.matches(':disabled, [aria-disabled="true"]')).slice(0, IX_LIMITS.perRule);
  }
  // The same element without the state: for attribute/class states, a visible match of the stateless selector that is not in it.
  function ixRestReference(part, el) {
    if (/:hover|:active/.test(part.replace(IX_STATE_ALL, (token) => (/^:(hover|active)$/.test(token) ? token : '')))) return el;
    const stateless = part.replace(IX_STATE_ALL, '').trim();
    if (!stateless || /[\s>+~(]$/.test(stateless)) return null;
    try { return [...ROOT.querySelectorAll(stateless)].find((other) => other !== el && !other.matches(part) && isVisible(other)) || null; } catch { return null; }
  }
  function ixCheckStateShift({ rules }) {
    const seen = new Set();
    let examined = 0;
    for (const { rule, inReduced } of rules) {
      if (inReduced || examined >= IX_LIMITS.maxRules || !lpRuleApplies(rule)) continue;
      const names = [...rule.style];
      if (!names.some((name) => /^(padding|border|font-size|font-weight)/.test(name))) continue;
      for (const part of ixStateParts(rule)) {
        if (seen.has(part)) continue;
        seen.add(part);
        examined += 1;
        for (const el of ixStateElements(part)) {
          const inGroup = ixGroups().some((group) => group.item === el);
          const reference = ixRestReference(part, el);
          if (!reference) continue;
          checked('state rules (layout shift)');
          const changed = ixShiftingProperties(rule, el, reference).filter((name) => !(inGroup && name === 'font-weight'));
          if (!changed.length) continue;
          add('SU-249', 'warn', 'States change paint, not layout', el,
            `${part} changes ${changed.join(', ')} when the state applies, so the element and its neighbours move`,
            'Change color, background, shadow or transform only; reserve the bold width with a hidden copy of the label (::after { content: attr(data-label); font-weight: 600; visibility: hidden; height: 0 }) or use the GRAD axis');
        }
      }
    }
  }
  function ixCheckSelectedShift() {
    for (const { item, peers } of ixGroups()) {
      const peer = peers[0];
      const [selectedWeight, peerWeight] = [ixWeight(css(item).fontWeight, item), ixWeight(css(peer).fontWeight, peer)];
      checked('selected items (weight shift)');
      if (selectedWeight === peerWeight || ixReservesWidth(item) || ixReservesWidth(peer)) continue;
      const shift = ixWeightShift(item, selectedWeight, peerWeight);
      if (shift <= IX_LIMITS.shiftSlack) continue;
      ixFlaggedShift.add(item);
      add('SU-249', 'warn', 'States change paint, not layout', item,
        `selected "${ixLabelOf(item)}" is ${Math.round(shift)}px wider at weight ${selectedWeight} than at ${peerWeight}, so its neighbours shift when the selection moves`,
        'Reserve the bold width with a hidden copy of the label (::after { content: attr(data-label); font-weight: 600; visibility: hidden; height: 0 }), use the GRAD axis, or keep one weight and mark selection with an indicator');
    }
  }

  // ----- SU-250: every state keeps its contrast -----
  const ixPlainBackground = (style, el) => {
    if (style.getPropertyValue('background-image') && !/^(none|initial)$/.test(style.getPropertyValue('background-image'))) return null;
    return ixColor(style.getPropertyValue('background-color') || style.getPropertyValue('background'), el);
  };
  // All state rules that match one element in one state, merged in source order (a later rule may set the other half of the pair).
  function ixStatePairs(rules) {
    const merged = new Map();
    let examined = 0;
    for (const { rule, inReduced } of rules) {
      const [textValue, fillValue] = [rule.style.getPropertyValue('color'), rule.style.getPropertyValue('background-color') || rule.style.getPropertyValue('background')];
      if (inReduced || examined >= IX_LIMITS.maxRules || !lpRuleApplies(rule) || (!textValue && !fillValue)) continue;
      for (const part of ixStateParts(rule)) {
        examined += 1;
        const kind = [...new Set(part.match(IX_STATE_ALL))].sort().join('+');
        for (const el of ixStateElements(part)) {
          const entries = merged.get(el) || new Map();
          const entry = entries.get(kind) || { part, text: null, fill: null, fillSet: false };
          const text = textValue ? ixColor(textValue, el) : null;
          const fill = fillValue ? ixPlainBackground(rule.style, el) : null;
          entries.set(kind, { ...entry, text: text || entry.text, fill: fill || entry.fill, fillSet: entry.fillSet || !!fill });
          merged.set(el, entries);
        }
      }
    }
    return merged;
  }
  function ixCheckStateContrast({ rules }) {
    for (const [el, entries] of ixStatePairs(rules)) {
      for (const { part, text, fill } of entries.values()) {
        if (!text && !fill) continue;
        const style = css(el);
        const below = ixBackdropBelow(el);
        if (!below || !el.textContent.trim() || (!fill && style.backgroundImage !== 'none')) continue;
        checked('state color pairs');
        const surface = over(fill || parseColor(style.backgroundColor), below);
        const ink = over(text || parseColor(style.color), surface);
        const [size, weight] = [px(style.fontSize), ixWeight(style.fontWeight, el)];
        const large = size >= LIMITS.largePx || (size >= LIMITS.largeBoldPx && weight >= IX_LIMITS.boldWeight);
        const needed = large ? LIMITS.textLarge : LIMITS.textAA;
        const score = ratio(ink, surface);
        if (score >= needed) continue;
        add('SU-250', 'warn', 'Every state keeps its contrast', el,
          `${part}: text ${hex(ink)} on ${hex(surface)} is ${score.toFixed(2)}:1 (needs ${needed}:1)`,
          'Keep text ≥ 4.5:1 (3:1 for large text) in hover, pressed and selected states: darken the text or move the state fill about 4–8% toward the text color, not past it');
      }
    }
  }

  // ----- SU-251: selected is obvious without color -----
  const IX_SHAPE_PROPS = ['fontWeight', 'fontStyle', 'fontSize', 'textDecorationLine', 'boxShadow', 'backgroundImage', 'transform', 'opacity', 'outlineStyle', 'outlineWidth'];
  const IX_PSEUDO_PROPS = ['content', 'backgroundColor', 'width', 'height', 'transform', 'boxShadow'];
  const ixCap = (side) => `${side[0].toUpperCase()}${side.slice(1)}`;
  // Border width, style and (only when a border is drawn) color: currentcolor on a 0-width border is not a cue.
  const ixBorderKey = (style) => IX_SIDES.map((side) => {
    const [width, kind, color] = [style[`border${ixCap(side)}Width`], style[`border${ixCap(side)}Style`], style[`border${ixCap(side)}Color`]];
    return `${width}|${kind}|${px(width) > 0 && kind !== 'none' ? color : ''}`;
  }).join(';');
  const ixShapeKey = (style) => `${IX_SHAPE_PROPS.map((prop) => style[prop]).join('|')}#${ixBorderKey(style)}`;
  const ixPseudoKey = (el, pseudo) => { const style = getComputedStyle(el, pseudo); return `${IX_PSEUDO_PROPS.map((prop) => style[prop]).join('|')}#${ixBorderKey(style)}`; };
  function ixDiffersByShape(a, b) {
    if (ixShapeKey(css(a)) !== ixShapeKey(css(b))) return true;
    if (['::before', '::after'].some((pseudo) => ixPseudoKey(a, pseudo) !== ixPseudoKey(b, pseudo))) return true;
    return a.children.length !== b.children.length || a.querySelectorAll('svg, img, i').length !== b.querySelectorAll('svg, img, i').length;
  }
  const ixHasIndicator = (container, item) => [...container.querySelectorAll('*')].some((node) => !node.contains(item) && !item.contains(node)
    && !node.matches(IX_ITEM) && IX_INDICATOR.test(node.getAttribute('class') || '') && /absolute|fixed/.test(css(node).position));
  function ixFill(el) {
    const below = ixBackdropBelow(el) || pageCanvas();
    return over(parseColor(css(el).backgroundColor), below);
  }
  function ixCheckSelectedCue() {
    for (const { item, peers, container } of ixGroups()) {
      const peer = peers[0];
      checked('selected items (non-color cue)');
      if (ixDiffersByShape(item, peer) || ixHasIndicator(container, item)) continue;
      const [fillA, fillB] = [ixFill(item), ixFill(peer)];
      const [inkA, inkB] = [over(parseColor(css(item).color), fillA), over(parseColor(css(peer).color), fillB)];
      const [textRatio, fillRatio] = [ratio(inkA, inkB), ratio(fillA, fillB)];
      if (textRatio === 1 && fillRatio === 1) continue;
      if (textRatio >= IX_LIMITS.selectedTextRatio || fillRatio >= IX_LIMITS.selectedFillRatio) continue;
      add('SU-251', 'warn', 'Selected is obvious without color', item,
        `selected "${ixLabelOf(item)}" differs from its siblings by color only (text ${textRatio.toFixed(2)}:1, fill ${fillRatio.toFixed(2)}:1 against an unselected sibling)`,
        'Add a non-color cue to the selected item: a heavier weight plus an indicator, an underline, a check icon, a shadow, or a fill that differs by ≥ 3:1');
    }
  }

  // ----- SU-252: disabled controls say why; read-only is not disabled -----
  function ixHasHint(button) {
    const described = (button.getAttribute('aria-describedby') || '').split(/\s+/).some((id) => id && document.getElementById(id));
    if (described) return true;
    const parent = button.parentElement;
    if (!parent) return false;
    const copy = parent.cloneNode(true);
    copy.querySelectorAll('button, a, input, select, textarea, label, [role=button], style, script, svg').forEach((node) => node.remove());
    return copy.textContent.trim().length >= IX_LIMITS.hintChars;
  }
  function ixCheckDisabledHints() {
    const buttons = [...ROOT.querySelectorAll('button[disabled], button[aria-disabled="true"], [role=button][aria-disabled="true"]')].slice(0, IX_LIMITS.maxDisabled);
    for (const button of buttons) {
      if (!isVisible(button)) continue;
      checked('disabled buttons');
      if (ixHasHint(button)) continue;
      add('SU-252', 'info', 'Disabled means "not now", and says why', button,
        'disabled button has no aria-describedby and no hint text next to it, so nobody learns why it is unavailable',
        'Say what is missing in a hint tied with aria-describedby, or use aria-disabled so the button can take focus and show the reason');
    }
  }
  function ixCheckReadonlyFields() {
    for (const field of ROOT.querySelectorAll(TEXT_FIELD)) {
      if (!field.readOnly || !isVisible(field)) continue;
      checked('read-only fields');
      const style = css(field);
      const below = ixBackdropBelow(field) || pageCanvas();
      const surface = over(parseColor(style.backgroundColor), below);
      const contrast = ratio(over(parseColor(style.color), surface), surface);
      const opacity = effectiveOpacity(field);
      const faded = opacity < IX_LIMITS.fieldOpacity;
      if (!faded && contrast >= LIMITS.textAA) continue;
      add('SU-252', 'warn', 'Disabled means "not now", and says why', field,
        `read-only field is styled like a disabled one (${faded ? `opacity ${opacity.toFixed(2)}` : `text ${contrast.toFixed(2)}:1`}): read-only content has to stay readable`,
        'Read-only is not disabled: full-contrast text (≥ 4.5:1, opacity 1), focusable and selectable, with a visible "read-only" cue such as a label or a lock icon');
    }
  }

  function checkInteractionStates(context) {
    ixCheckSelectedShift();
    ixCheckStateShift(context);
    ixCheckStateContrast(context);
    ixCheckSelectedCue();
  }
  REGISTERED = [...REGISTERED, ['interaction states', (context) => checkInteractionStates(context)],
    ['disabled and read-only', () => { ixCheckDisabledHints(); ixCheckReadonlyFields(); }]];
