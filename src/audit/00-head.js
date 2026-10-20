// shibroUI audit: evaluate this whole file in a rendered page; it returns a JSON report.
// It is deliberately one expression (no imports, no exports) so any browser tool can run it:
//   built-in / Chrome browser tools → run the contents as-is
//   Playwright MCP                  → browser_evaluate with `() => <contents>`
// Optional scope: window.__shibroAudit = { root: 'main', maxFindings: 400 } before running.
// Every finding lists all of its instances (CSS paths) and `coverage` says what was checked, what was
// skipped and why, and which hidden states (tabs, menus, dialogs, accordions) still need a run.
(() => {
  const VERSION = '0.3.0';
  const OPTIONS = { root: null, maxFindings: 400, ...(window.__shibroAudit || {}) };
  // Reassigned once at run time: while a modal is open the page behind it is inert, so only the modal is audited.
  let ROOT = (OPTIONS.root && document.querySelector(OPTIONS.root)) || document.body;
  const LIMITS = {
    textAA: 4.5, textLarge: 3, largePx: 24, largeBoldPx: 18.66, fieldBoundary: 1.06,
    target: 44, targetFloor: 24, targetGap: 8, heightTolerance: 1, radiusTolerance: 3,
    measureHigh: 80, measureLow: 35, narrowViewport: 480, leadingLow: 1.3, leadingHigh: 2.1, minReadingPx: 13,
    pressScaleMin: 0.94, routineMs: 500, pressMs: 300, shakePx: 12, maxElements: 6000,
    maxFocus: 800, maxInstances: 40,
  };
  const INTERACTIVE = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [role=option], [tabindex]:not([tabindex="-1"])';
  const TEXT_FIELD = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]), select, textarea';
  const findings = new Map();
  const notes = [];
  // Check files after the built-in ones register here: REGISTERED = [...REGISTERED, ['name', (context) => {…}]].
  // context = { targets, rules, keyframes, reduced } (rules: [{ rule: CSSStyleRule, inReduced }] from same-origin sheets).
  let REGISTERED = [];
  const css = (el) => getComputedStyle(el);
  const px = (value) => parseFloat(value) || 0;

