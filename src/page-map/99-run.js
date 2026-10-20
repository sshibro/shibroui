  // ---------- run ----------
  function runMap() {
    collect();
    const sections = {};
    const notes = [];
    for (const [name, fn] of [['wireframe', wireframe], ['hierarchy', hierarchy], ['headings', headings], ['system', system], ['craft', craftSection], ['alignment', alignment], ['layout', rowsAndRhythm], ['states', states], ['bands', bandsSection]]) {
      try { sections[name] = fn(); } catch (error) { notes.push(`Section "${name}" errored: ${error.message}`); }
    }
    let unseen = null;
    try { unseen = unseenContent(notes); } catch (error) { notes.push(`Unseen-content scan errored: ${error.message}`); }
    const { craft, bands, system: visualSystem, ...rest } = sections;
    const order = { warn: 0, info: 1 };
    const sortedFlags = flags.sort((a, b) => order[a.level] - order[b.level] || parseInt(a.id.slice(3), 10) - parseInt(b.id.slice(3), 10));
    const byRule = sortedFlags.reduce((acc, f) => ({ ...acc, [f.id]: (acc[f.id] || 0) + 1 }), {});
    const report = {
      tool: 'shibroUI page map', version: VERSION, url: location.href, viewport: `${innerWidth}×${innerHeight}`,
      page: `${docWidth}×${docHeight}`, elementsMeasured: elements.length, longPage: isLongPage(),
      summary: { warn: sortedFlags.filter((f) => f.level === 'warn').length, info: sortedFlags.filter((f) => f.level === 'info').length, byRule },
      flags: sortedFlags, ...(bands ? { outline: bands.outline } : {}), ...rest,
      system: visualSystem ? { ...visualSystem, ...(craft || {}) } : craft,
      ...(bands ? { bands: bands.bands } : {}),
      coverage: { ...COVERAGE, unseen, prepared: PREPARED },
      notes: [...notes, ...(running.length ? [`${running.length} running animation(s) were finished first so the resting state was measured.`] : []),
        ...(isLongPage() ? ['A long page: read `outline` first, then each band with its screenshot (scroll to band.y). Long-page rules are in references/long-pages.md.'] : []),
        'Screen-level flags are evidence for judgment, not verdicts. Read them with a screenshot and references/composition.md.'],
    };
    window.__shibroPageMapResult = report;
    return report;
  }
  // prepare: scroll the page once first (scroll reveals, lazy sections); the result is then a Promise.
  return OPTIONS.prepare ? prepareSweep().then(runMap) : runMap();
})()
