  // ---------- run ----------
  if (!innerWidth || !innerHeight) {
    const error = 'The viewport is 0×0 (hidden or background browser pane), so nothing can be measured. Set a viewport size (e.g. 1280×900) or show the page, reload, and run again.';
    window.__shibroAuditResult = { tool: 'shibroUI audit', version: VERSION, error };
    return window.__shibroAuditResult;
  }
  function runAudit() {
    const started = performance.now();
    // Measure the resting state: an entrance fade caught mid-flight (or frozen in a background tab) would
    // make whole panels look invisible. Finite running animations are fast-forwarded to their end.
    const running = document.getAnimations ? document.getAnimations().filter((a) => {
      const timing = a.effect && a.effect.getComputedTiming();
      return a.playState !== 'finished' && a.playState !== 'idle' && timing && Number.isFinite(timing.endTime);
    }) : [];
    running.forEach((a) => { try { a.finish(); } catch { /* infinite or detached animation */ } });
    if (running.length) notes.push(`${running.length} running animation(s) were finished first so the resting state was measured.`);
    if (OPTIONS.band && !OPTIONS.root) {
      const bands = pageBands();
      const band = bands[OPTIONS.band - 1];
      if (band) { ROOT = band.el; notes.push(`Scoped to band ${OPTIONS.band} of ${bands.length} (${path(band.el)}), as page-map.js numbers them.`); }
      else notes.push(`There is no band ${OPTIONS.band} (the page has ${bands.length}), so the whole page was audited.`);
    }
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

    let unseen = null;
    try { unseen = unseenContent(); } catch (error) { notes.push(`Unseen-content scan errored: ${error.message}`); }
    const totalElements = ROOT.querySelectorAll('*').length;
    if (totalElements > LIMITS.maxElements) COVERAGE.capsHit.push(`element walks stopped at ${LIMITS.maxElements} of ${totalElements} elements; scope with window.__shibroAudit = { root } or { band } and run per region`);
    const order = { fail: 0, warn: 1, info: 2 };
    const list = foldRootCauses([...findings.values()])
      .sort((a, b) => order[a.level] - order[b.level] || parseInt(a.id.slice(3), 10) - parseInt(b.id.slice(3), 10))
      .map(finalizeFinding);
    const sampled = list.filter((f) => f.instancesSampled).length;
    if (sampled) COVERAGE.capsHit.push(`${sampled} finding(s) list a sample of ${LIMITS.maxInstances} instances (see count): fix the pattern, not just the listed ones`);
    const summary = list.reduce((acc, f) => ({ ...acc, [f.level]: acc[f.level] + 1 }), { fail: 0, warn: 0, info: 0 });
    const byRule = list.reduce((acc, f) => ({ ...acc, [f.id]: (acc[f.id] || 0) + f.count }), {});
    let states = [];
    try { states = hiddenStates(); } catch (error) { notes.push(`Hidden-state scan errored: ${error.message}`); }
    if (list.length > OPTIONS.maxFindings) COVERAGE.capsHit.push(`${list.length - OPTIONS.maxFindings} findings beyond maxFindings were cut; raise window.__shibroAudit.maxFindings or scope by region`);
    const prepared = PREPARED ? { ...PREPARED, hiddenInFirstViewport: PREPARED.hiddenInFirstViewport.map(path) } : null;
    const report = {
      tool: 'shibroUI audit', version: VERSION, url: location.href, viewport: `${innerWidth}×${innerHeight}`,
      summary: { ...summary, instances: list.reduce((sum, f) => sum + f.count, 0), byRule },
      findings: list.slice(0, OPTIONS.maxFindings), truncated: list.length > OPTIONS.maxFindings,
      coverage: { ...COVERAGE, hiddenStates: states, unseen, prepared },
      notes: [...notes,
        states.length ? `${states.length} hidden state(s) were not audited (coverage.hiddenStates): open each one and run the audit again.` : 'No hidden states detected.',
        'Fix every instance listed in findings[].instances, not just the first. A rootCause finding is one fix for all of its groups.',
        'Layout, hierarchy and visual-system problems are page-map.js territory (references/composition.md).'],
      ms: Math.round(performance.now() - started) + (PREPARED ? PREPARED.ms : 0),
    };
    // Also exposed for tools that load the file with a <script> tag instead of evaluating it.
    window.__shibroAuditResult = report;
    return report;
  }
  // prepare: scroll the page once first (scroll reveals, lazy sections); the result is then a Promise.
  return OPTIONS.prepare ? prepareSweep().then(runAudit) : runAudit();
})()
