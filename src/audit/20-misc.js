  // ---------- 11. status dots, images, dialogs (SU-71, SU-106, SU-103) ----------
  const STATUS_WORD = /online|offline|active|inactive|connected|disconnected|paid|pending|overdue|failed|failing|success|error|warning|live|idle|busy|away|draft|published|open|closed|done|complete|running|stopped|healthy|degraded|down|operational|enabled|disabled|on\b|off\b/i;
  function checkMisc() {
    for (const el of [...ROOT.querySelectorAll('span, i, div, b, em')].slice(0, LIMITS.maxElements)) {
      if (el.children.length || el.textContent.trim() || el.closest(INTERACTIVE) || !isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.width > 16 || Math.abs(rect.width - rect.height) > 2) continue;
      const s = css(el);
      if (parseColor(s.backgroundColor).a < 0.3 || px(s.borderTopLeftRadius) < rect.width / 2 - 1) continue;
      const context = `${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.parentElement ? el.parentElement.textContent : ''}`;
      if (!STATUS_WORD.test(context)) add('SU-71', 'warn', 'Status signals', el, 'colored dot with no status word next to it', 'Pair the color with an icon and a text label ("✓ Connected")');
    }
    for (const img of ROOT.querySelectorAll('img')) {
      if (!isVisible(img) || !img.naturalWidth || !img.naturalHeight) continue;
      checked('images');
      const rect = img.getBoundingClientRect();
      const distortion = (rect.width / rect.height) / (img.naturalWidth / img.naturalHeight);
      if (css(img).objectFit === 'fill' && Math.abs(distortion - 1) > 0.03) add('SU-106', 'fail', 'Consistent frames', img, `image stretched ${Math.round((distortion - 1) * 100)}% from its natural aspect`, 'aspect-ratio on the frame + object-fit: cover');
    }
    const DIALOG = 'dialog[open], [role=dialog], [role=alertdialog], [aria-modal=true]';
    for (const dialog of [ROOT, ...ROOT.querySelectorAll(DIALOG)].filter((d) => d.matches(DIALOG))) {
      if (!isVisible(dialog)) continue;
      checked('open dialogs');
      if (css(dialog).boxShadow === 'none' && !hasBoundary(dialog.firstElementChild || dialog)) add('SU-103', 'warn', 'Modal depth', dialog, 'dialog has no elevation shadow', 'Level-5 shadow: soft broad + tight edge');
      const nativeBackdrop = dialog.matches('dialog') && dialog.matches(':modal') && parseColor(getComputedStyle(dialog, '::backdrop').backgroundColor).a > 0.05;
      const scrim = [...document.querySelectorAll('body *')].some((n) => {
        const s = css(n);
        if (!/fixed|absolute/.test(s.position) || n === dialog) return false;
        const r = n.getBoundingClientRect();
        return r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9 && parseColor(s.backgroundColor).a >= 0.1 && isVisible(n);
      });
      if (!nativeBackdrop && !scrim) add('SU-103', 'warn', 'Modal depth', dialog, 'no dimming scrim behind the dialog', 'Dim the page behind modals (::backdrop or a fixed scrim)');
    }
  }

