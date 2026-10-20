  // ---------- run ----------
  if (!innerWidth || !innerHeight) {
    const error = 'The viewport is 0×0 (hidden or background browser pane), so nothing can be measured. Set a viewport size (e.g. 1280×900) or show the page, reload, and run again.';
    window.__shibroAuditResult = { tool: 'shibroUI audit', version: VERSION, error };
    return window.__shibroAuditResult;
  }
  const started = performance.now();
  // Measure the resting state: an entrance fade caught mid-flight (or frozen in a background tab) would
  // make whole panels look invisible. Finite running animations are fast-forwarded to their end.
  const running = document.getAnimations ? document.getAnimations().filter((a) => {
    const timing = a.effect && a.effect.getComputedTiming();
    return a.playState !== 'finished' && a.playState !== 'idle' && timing && Number.isFinite(timing.endTime);
  }) : [];
  running.forEach((a) => { try { a.finish(); } catch { /* infinite or detached animation */ } });
  if (running.length) notes.push(`${running.length} running animation(s) were finished first so the resting state was measured.`);
  const OPEN_MODAL = OPTIONS.root ? null : findOpenModal();
  if (OPEN_MODAL) {
    ROOT = OPEN_MODAL;
    notes.push('A modal is open, so only its contents were audited (the page behind it is inert).');
  }
  const scroll = [scrollX, scrollY];
  const previouslyFocused = document.activeElement;
  const sheetInfo = collectRules();
  const targets = targetsList();
  const checks = [
    ['text contrast', checkTextContrast], ['fields', checkFields], ['targets', () => checkTargets(targets)],
    ['focus', () => checkFocus(targets, sheetInfo.rules)], ['tables', checkTables], ['control heights', () => checkControlHeights(targets)],
    ['radius', checkRadius], ['reading', checkReading], ['links', checkLinks], ['choices', checkChoices], ['misc', checkMisc], ['centering', checkCentering], ['motion', () => checkMotion(sheetInfo)],
  ];
  const checkContext = { targets, rules: sheetInfo.rules, keyframes: sheetInfo.keyframes, reduced: sheetInfo.reduced };
  const allChecks = [...checks, ...REGISTERED.map(([name, check]) => [name, () => check(checkContext)])];
  for (const [name, check] of allChecks) {
    try { check(); } catch (error) { notes.push(`Check "${name}" errored: ${error.message}`); }
  }
  scrollTo(scroll[0], scroll[1]);
  innerScrolls.forEach(([left, top], node) => node.scrollTo(left, top));
  if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus({ preventScroll: true });

  const order = { fail: 0, warn: 1, info: 2 };
  const list = [...findings.values()].sort((a, b) => order[a.level] - order[b.level] || parseInt(a.id.slice(3), 10) - parseInt(b.id.slice(3), 10));
  const summary = list.reduce((acc, f) => ({ ...acc, [f.level]: acc[f.level] + 1 }), { fail: 0, warn: 0, info: 0 });
  const byRule = list.reduce((acc, f) => ({ ...acc, [f.id]: (acc[f.id] || 0) + f.count }), {});
  let states = [];
  try { states = hiddenStates(); } catch (error) { notes.push(`Hidden-state scan errored: ${error.message}`); }
  if (list.length > OPTIONS.maxFindings) COVERAGE.capsHit.push(`${list.length - OPTIONS.maxFindings} findings beyond maxFindings were cut; raise window.__shibroAudit.maxFindings or scope by region`);
  const report = {
    tool: 'shibroUI audit', version: VERSION, url: location.href, viewport: `${innerWidth}×${innerHeight}`,
    summary: { ...summary, instances: list.reduce((sum, f) => sum + f.count, 0), byRule },
    findings: list.slice(0, OPTIONS.maxFindings), truncated: list.length > OPTIONS.maxFindings,
    coverage: { ...COVERAGE, hiddenStates: states },
    notes: [...notes,
      states.length ? `${states.length} hidden state(s) were not audited (coverage.hiddenStates): open each one and run the audit again.` : 'No hidden states detected.',
      'Fix every instance listed in findings[].instances, not just the first.',
      'Layout, hierarchy and visual-system problems are page-map.js territory (references/composition.md).'],
    ms: Math.round(performance.now() - started),
  };
  // Also exposed for tools that load the file with a <script> tag instead of evaluating it.
  window.__shibroAuditResult = report;
  return report;
})()
