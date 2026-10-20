  // ---------- theming: dark surfaces and elevation (SU-164) ----------
  const DARK_PAGE_LUMINANCE = 0.05;
  const ELEVATED_MIN = { width: 120, height: 48 };
  const SHADOW_COLOR = /rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|\b[a-z]+(?=\s+-?\d)/gi;
  const ELEVATION_BLUR_PX = 4;
  const ELEVATION_OFFSET_PX = 2;
  // First non-transparent background of html, body, main; the page canvas guess only when all are transparent.
  function themingBase() {
    for (const el of [document.documentElement, document.body, document.querySelector('main')]) {
      if (!el) continue;
      const color = parseColor(css(el).backgroundColor);
      if (color.a > 0) return { color: over(color, pageCanvas()), el, authored: true };
    }
    return { color: pageCanvas(), el: null, authored: false };
  }
  // A shadow that reads as elevation: outer, and blurred or offset (not a 1px ring or border imitation).
  function hasElevationShadow(style) {
    if (!style.boxShadow || style.boxShadow === 'none') return false;
    return style.boxShadow.split(/,(?![^(]*\))/).some((shadow) => {
      if (/\binset\b/.test(shadow)) return false;
      const [, offsetY = 0, blur = 0] = (shadow.replace(SHADOW_COLOR, ' ').match(/-?[\d.]+px/g) || []).map(px);
      return blur >= ELEVATION_BLUR_PX || Math.abs(offsetY) >= ELEVATION_OFFSET_PX;
    });
  }
  function checkDarkSurfaces() {
    const base = themingBase();
    const baseLuminance = luminance(base.color);
    if (baseLuminance >= DARK_PAGE_LUMINANCE) return;
    checked('dark page');
    if (base.authored && base.color.r === 0 && base.color.g === 0 && base.color.b === 0 && css(base.el).backgroundColor !== 'rgba(0, 0, 0, 0)') {
      add('SU-164', 'warn', 'Dark surfaces', base.el, 'pure #000 base', 'Use a dark gray (~#121212–#1c1c1e) so raised surfaces can get lighter');
    }
    for (const el of [...ROOT.querySelectorAll('*')].slice(0, LIMITS.maxElements)) {
      if (el === base.el || el.matches(INTERACTIVE) || !hasElevationShadow(css(el))) continue;
      const background = parseColor(css(el).backgroundColor);
      if (background.a < 0.5 || !isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < ELEVATED_MIN.width || rect.height < ELEVATED_MIN.height) continue;
      const surface = over(background, base.color);
      if (luminance(surface) > baseLuminance) continue;
      add('SU-164', 'warn', 'Dark surfaces', el, `raised surface ${hex(surface)} is not lighter than the ${hex(base.color)} base`,
        'Elevation in dark is a lighter surface (+0.03–0.05 L per level); shadows barely show on dark');
    }
  }
  REGISTERED = [...REGISTERED, ['dark surfaces', checkDarkSurfaces]];
