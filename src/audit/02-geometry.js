  // ---------- visibility & geometry ----------
  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const style = css(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    }
    // Content of a closed <details> can keep a box (e.g. absolutely positioned) but isn't rendered for people.
    const closedDetails = el.closest('details:not([open])');
    if (closedDetails && !el.closest('summary')) return false;
    const style = css(el);
    return !(style.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(style.clipPath));
  }
  const inViewport = (r) => r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
  // The square the target probe samples: the box grown to at least LIMITS.target around its center.
  function probeRect(r) {
    const [cx, cy] = [r.left + r.width / 2, r.top + r.height / 2];
    const [halfW, halfH] = [Math.max(r.width, LIMITS.target) / 2, Math.max(r.height, LIMITS.target) / 2];
    return { left: cx - halfW, right: cx + halfW, top: cy - halfH, bottom: cy + halfH };
  }
  const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  // Fixed and sticky layers (outermost only) stay put while the page scrolls, so whatever sits under them at
  // the current scroll position can't be measured there. Collected once per run, from the whole page.
  const PINNED_LAYER_CAP = 50;
  let pinnedCache = null;
  function pinnedLayers() {
    if (pinnedCache) return pinnedCache;
    pinnedCache = [...document.body.querySelectorAll('*')].slice(0, LIMITS.maxElements).reduce((layers, el) => {
      const last = layers[layers.length - 1];
      if (layers.length >= PINNED_LAYER_CAP || (last && last.contains(el)) || !/fixed|sticky/.test(css(el).position) || !isVisible(el)) return layers;
      return [...layers, el];
    }, []);
    return pinnedCache;
  }
  const pinnedLayerOf = (el) => pinnedLayers().find((layer) => layer.contains(el)) || null;
  const underPinnedLayer = (el, rect) => pinnedLayers().some((layer) => !layer.contains(el) && !el.contains(layer)
    && css(layer).pointerEvents !== 'none' && intersects(layer.getBoundingClientRect(), rect));

  // Ancestors that scroll on their own (overflow auto/scroll), innermost first; html and body scroll with the page.
  const scrollerCache = new Map();
  function scrollersOf(node) {
    if (!node || node === document.body || node === document.documentElement) return [];
    if (scrollerCache.has(node)) return scrollerCache.get(node);
    const style = css(node);
    const [x, y] = [/auto|scroll/.test(style.overflowX), /auto|scroll/.test(style.overflowY)];
    const list = [...(x || y ? [{ node, x, y }] : []), ...scrollersOf(node.parentElement)];
    scrollerCache.set(node, list);
    return list;
  }
  // How far `rect` reaches past the visible (client) box of `scroller` on the axes it scrolls; 0 = not clipped.
  function clipDepth(scroller, rect) {
    const { node, x, y } = scroller;
    const box = node.getBoundingClientRect();
    const [left, top] = [box.left + node.clientLeft, box.top + node.clientTop];
    const overX = x ? Math.max(left - rect.left, rect.right - (left + node.clientWidth)) : 0;
    const overY = y ? Math.max(top - rect.top, rect.bottom - (top + node.clientHeight)) : 0;
    return Math.max(0, overX, overY);
  }
  // The innermost scrolling ancestor that cuts `rect` off (more than half a pixel), or null.
  const clippingScroller = (el, rect) => scrollersOf(el.parentElement).find((scroller) => clipDepth(scroller, rect) > 0.5) || null;

  // Inner scroll positions that reveal() changed; the run puts them back along with the window scroll.
  const innerScrolls = new Map();
  function rememberScroll(el) {
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      if (!innerScrolls.has(node) && (node.scrollTop || node.scrollLeft || node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)) {
        innerScrolls.set(node, [node.scrollLeft, node.scrollTop]);
      }
    }
  }
  // Brings `el` to the center when the probe around it would be cut off: outside the viewport, clipped by an
  // inner scroll panel, or under a fixed/sticky layer it doesn't belong to (a sticky header).
  function reveal(el) {
    const rect = el.getBoundingClientRect();
    const probe = probeRect(rect);
    if (inViewport(rect) && !clippingScroller(el, probe) && !underPinnedLayer(el, probe)) return rect;
    rememberScroll(el);
    el.scrollIntoView({ block: 'center', inline: 'center' });
    return el.getBoundingClientRect();
  }
  const isDisabled = (el) => !!el.closest(':disabled, [aria-disabled="true"], [inert]');

