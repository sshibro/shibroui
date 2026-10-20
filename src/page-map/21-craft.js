  // ---------- craft inventory: controls, avatars, shadows, borders, icons (SU-239, SU-245, SU-253, SU-254, SU-256) ----------
  // Box-shadow layers: computed values list the color first, then x, y, blur, spread.
  function shadowLayers(value) {
    const layers = [];
    let depth = 0;
    let start = 0;
    [...value].forEach((ch, i) => { if (ch === '(') depth += 1; else if (ch === ')') depth -= 1; else if (ch === ',' && depth === 0) { layers.push(value.slice(start, i)); start = i + 1; } });
    return [...layers, value.slice(start)].map((layer) => {
      const color = (layer.match(/rgba?\([^)]*\)/) || ['rgba(0, 0, 0, 1)'])[0];
      const [x = 0, y = 0, blur = 0, spread = 0] = (layer.replace(color, '').match(/-?\d+(\.\d+)?px/g) || []).map(parseFloat);
      return { color: parseColor(color), x, y, blur, spread, inset: /inset/.test(layer) };
    });
  }
  const isBlackish = (c) => Math.max(c.r, c.g, c.b) <= 24;
  function craftSection() {
    const controls = elements.filter((el) => el.matches('button, input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range]):not([type=color]), select, [role=button]') && !el.closest('[role=menu], [role=listbox], table'));
    const controlHeights = tally(controls.map((el) => round(el.getBoundingClientRect().height, 2)));
    if (controlHeights.length > 3) flag('SU-239', 'warn', 'One control size scale', `${controlHeights.length} control heights in use (${controlHeights.map((h) => `${h.value}px×${h.count}`).join(', ')}); use sm 32 · md 40 · lg 48`, controls.slice(0, 6));
    const avatars = elements.filter((el) => {
      const r = el.getBoundingClientRect();
      const circular = px(css(el).borderTopLeftRadius) >= r.width * 0.45;
      return (/avatar/i.test(typeof el.className === 'string' ? el.className : '') || (el.tagName === 'IMG' && circular)) && Math.abs(r.width - r.height) <= 1 && r.width >= 14 && r.width <= 128;
    });
    const avatarSizes = tally(avatars.map((el) => Math.round(el.getBoundingClientRect().width)));
    if (avatarSizes.length > 4) flag('SU-245', 'info', 'Avatars', `${avatarSizes.length} avatar sizes (${avatarSizes.map((s) => `${s.value}px`).join(', ')}); pick sizes from one scale`, avatars.slice(0, 6));

    // SU-253: shadows are layered and tinted. Rings (spread only) and inset shadows don't count.
    const shadowed = elements.filter((el) => css(el).boxShadow && css(el).boxShadow !== 'none');
    const byValue = new Map();
    shadowed.forEach((el) => byValue.set(css(el).boxShadow, [...(byValue.get(css(el).boxShadow) || []), el]));
    for (const [value, users] of byValue) {
      const layers = shadowLayers(value).filter((l) => !l.inset && !(l.blur === 0 && l.spread > 0) && l.color.a > 0);
      if (!layers.length) continue;
      if (layers.length === 1 && layers[0].blur >= 12) flag('SU-253', 'warn', 'Shadows are layered and tinted', `a single-layer ${layers[0].blur}px shadow on ${users.length} element(s) (${value.slice(0, 60)}); pair a broad soft layer with a tight contact layer`, users.slice(0, 6));
      const heavy = layers.find((l) => isBlackish(l.color) && l.color.a > 0.25);
      if (heavy) flag('SU-253', 'warn', 'Shadows are layered and tinted', `a black shadow at alpha ${Math.round(heavy.color.a * 100) / 100} (${value.slice(0, 60)}); stay at or below 0.25`, users.slice(0, 6));
      const onColor = users.filter((el) => el.parentElement && oklab(backdrop(el.parentElement)).C >= 0.04);
      if (onColor.length && layers.every((l) => isBlackish(l.color))) flag('SU-253', 'info', 'Shadows are layered and tinted', `pure-black shadows over a colored surface on ${onColor.length} element(s); tint the shadow with the surface's hue`, onColor.slice(0, 6));
    }
    // SU-254: opaque gray borders drawn on several different surfaces.
    const borders = new Map();
    for (const el of elements) {
      const s = css(el);
      if (px(s.borderTopWidth) <= 0 && px(s.borderBottomWidth) <= 0) continue;
      const color = parseColor(px(s.borderTopWidth) > 0 ? s.borderTopColor : s.borderBottomColor);
      if (color.a < 0.99 || oklab(color).C >= 0.02 || !el.parentElement) continue;
      const key = hex(color);
      borders.set(key, new Set([...(borders.get(key) || []), hex(backdrop(el.parentElement))]));
    }
    for (const [color, surfacesUsed] of borders) {
      if (surfacesUsed.size >= 3) flag('SU-254', 'info', 'Edges are hairlines with alpha', `the opaque gray border ${color} sits on ${surfacesUsed.size} different surfaces; a translucent ink (rgb(0 0 0 / .08–.12)) works on all of them`);
    }
    // SU-256: one icon family, one stroke, sized to the text.
    const icons = [...ROOT.querySelectorAll('svg')].filter((svg) => {
      if (!isVisible(svg) || svg.parentElement.closest('svg')) return false;
      const r = svg.getBoundingClientRect();
      return r.width >= 10 && r.width <= 48 && r.height >= 10 && r.height <= 48;
    }).map((svg) => {
      const r = svg.getBoundingClientRect();
      const shape = svg.querySelector('path, circle, rect, line, polyline, polygon, ellipse');
      const s = shape ? getComputedStyle(shape) : null;
      const box = svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width ? svg.viewBox.baseVal.width : r.width;
      const stroked = !!s && s.stroke !== 'none' && parseColor(s.stroke).a > 0 && px(s.strokeWidth) > 0;
      const filled = !!s && s.fill !== 'none' && parseColor(s.fill).a > 0;
      return { svg, size: Math.round(Math.max(r.width, r.height)), stroke: stroked ? round(px(s.strokeWidth) * (r.width / box), 0.25) : null, style: stroked && !filled ? 'outline' : filled && !stroked ? 'filled' : 'mixed' };
    });
    const iconSizes = tally(icons.map((i) => i.size));
    if (iconSizes.length > 3) flag('SU-256', 'warn', 'One icon family, one stroke', `${iconSizes.length} icon sizes (${iconSizes.map((s) => `${s.value}px×${s.count}`).join(', ')}); keep to 16/20/24`, icons.slice(0, 6).map((i) => i.svg));
    for (const { value: size } of iconSizes) {
      const strokes = [...new Set(icons.filter((i) => i.size === size && i.stroke !== null).map((i) => i.stroke))];
      if (strokes.length > 1) flag('SU-256', 'warn', 'One icon family, one stroke', `${size}px icons use ${strokes.length} stroke widths (${strokes.join(', ')}px); use one`, icons.filter((i) => i.size === size).slice(0, 6).map((i) => i.svg));
    }
    const groups = new Map();
    icons.forEach((i) => { const group = i.svg.closest('nav, ul, ol, [role=toolbar], [role=tablist], [role=menu]'); if (group) groups.set(group, [...(groups.get(group) || []), i]); });
    for (const [group, list] of groups) {
      const styles = new Set(list.map((i) => i.style).filter((st) => st !== 'mixed'));
      const selected = list.filter((i) => i.svg.closest('[aria-current], [aria-selected=true], [aria-pressed=true]'));
      if (styles.size > 1 && !(selected.length && selected.every((i) => i.style === 'filled'))) flag('SU-256', 'info', 'One icon family, one stroke', `icons in ${path(group)} mix filled and outline styles; filled is for the selected item only`, list.slice(0, 6).map((i) => i.svg));
    }
    return { controlHeights, avatarSizes, icons: { sizes: iconSizes, strokes: [...new Set(icons.map((i) => i.stroke).filter((v) => v !== null))] } };
  }

