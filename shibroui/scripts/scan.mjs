#!/usr/bin/env node
// One-call headless scan of a page: page-map.js and audit.js at each width (with the prepare sweep on),
// plus one screenshot per band, so a long page is read one screen at a time without pasting scripts.
//   node scripts/scan.mjs <url> [--widths 1280,375] [--out dir] [--scheme light|dark] [--no-prepare] [--json]
// Needs Playwright: `npm i -D playwright-core` (with a Chromium installed), or PLAYWRIGHT_CORE=/path/to/playwright-core.
// Writes <out>/<width>/page-map.json, audit.json and band-NN.png, and prints a compact summary.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const VIEWPORT_HEIGHT = { 1280: 900, 375: 812, 320: 640 };
const SETTLE_MS = 400;
const MAX_SHOT_SCREENS = 1.5;
const SUMMARY_FLAGS = 20;

const VALUE_FLAGS = ['--widths', '--out', '--scheme'];
function args(argv) {
  const value = (flag, fallback) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : fallback; };
  return {
    url: argv.find((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(argv[i - 1])),
    widths: value('--widths', '1280,375').split(',').map(Number).filter(Boolean),
    out: resolve(value('--out', 'shibroui-scan')),
    scheme: value('--scheme', 'light'),
    prepare: !argv.includes('--no-prepare'),
    json: argv.includes('--json'),
  };
}

async function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_CORE && pathToFileURL(join(process.env.PLAYWRIGHT_CORE, 'index.mjs')).href, 'playwright-core', 'playwright'].filter(Boolean);
  for (const name of candidates) {
    try { return await import(name); } catch { /* try the next one */ }
  }
  return null;
}

// The same expression a browser tool would run, with its options set first.
const withOptions = (global, options, source) => `window.${global} = ${JSON.stringify(options)};\n${source}`;

// Viewport-sized clips down each band; a band taller than 1.5 screens is split into parts.
function bandClips(bands, width, height, pageHeight) {
  const list = bands && bands.length ? bands : [{ n: 1, y: 0, height: pageHeight, label: 'page' }];
  return list.flatMap((band) => {
    const parts = Math.max(1, Math.ceil(band.height / (height * MAX_SHOT_SCREENS)));
    const partHeight = Math.ceil(band.height / parts);
    return Array.from({ length: parts }, (_, k) => ({
      name: `band-${String(band.n).padStart(2, '0')}${parts > 1 ? `-${k + 1}` : ''}.png`, band: band.n, label: band.label,
      clip: { x: 0, y: band.y + k * partHeight, width, height: Math.max(1, Math.min(partHeight, pageHeight - band.y - k * partHeight)) },
    }));
  }).filter((shot) => shot.clip.height >= 8);
}

function summarize(width, map, audit, shots) {
  const lines = [`\n── ${width}px ── page ${map.page}${map.longPage ? `, ${(map.bands || []).length} bands` : ''}`];
  if (map.outline) lines.push(...map.outline.map((line) => `  ${line}`));
  lines.push(`  page map: ${map.summary.warn} warn / ${map.summary.info} info`);
  lines.push(...map.flags.slice(0, SUMMARY_FLAGS).map((f) => `    ${f.level === 'warn' ? '!' : '·'} ${f.id} ${f.detail.slice(0, 150)}`));
  lines.push(`  audit: ${audit.summary.fail} fail / ${audit.summary.warn} warn / ${audit.summary.info} info (${audit.summary.instances} instances)`);
  lines.push(...audit.findings.filter((f) => f.level !== 'info').slice(0, SUMMARY_FLAGS)
    .map((f) => `    ${f.level === 'fail' ? '✗' : '!'} ${f.id} ×${f.count} ${f.element || ''}: ${f.detail.slice(0, 140)}`));
  const seen = [...(audit.coverage.capsHit || []), ...Object.keys(audit.coverage.skipped || {}).filter((k) => /opacity|content-visibility/.test(k))];
  if (seen.length) lines.push(`  coverage: ${seen.join(' · ')}`);
  if (audit.coverage.hiddenStates.length) lines.push(`  hidden states to open and re-run: ${audit.coverage.hiddenStates.length}`);
  lines.push(`  screenshots: ${shots.length} (${shots.map((s) => s.name).join(', ')})`);
  return lines.join('\n');
}

async function main() {
  const options = args(process.argv.slice(2));
  if (!options.url) {
    console.error('usage: node scripts/scan.mjs <url> [--widths 1280,375] [--out dir] [--scheme light|dark] [--no-prepare] [--json]');
    process.exit(2);
  }
  const playwright = await loadPlaywright();
  if (!playwright) {
    console.error('Playwright not found. Install playwright-core or set PLAYWRIGHT_CORE=/path/to/playwright-core. Without it, use a browser tool and scripts/serve.mjs.');
    process.exit(2);
  }
  const [mapSource, auditSource] = ['page-map.js', 'audit.js'].map((file) => readFileSync(join(HERE, file), 'utf8'));
  const browser = await playwright.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const results = [];
  try {
    for (const width of options.widths) {
      const height = VIEWPORT_HEIGHT[width] || Math.round(width * 0.7);
      const context = await browser.newContext({ viewport: { width, height }, colorScheme: options.scheme });
      const page = await context.newPage();
      await page.goto(options.url, { waitUntil: 'load' });
      await page.waitForTimeout(SETTLE_MS);
      const map = await page.evaluate(withOptions('__shibroPageMap', { prepare: options.prepare }, mapSource));
      const audit = await page.evaluate(withOptions('__shibroAudit', { prepare: false }, auditSource));
      const dir = join(options.out, String(width));
      mkdirSync(dir, { recursive: true });
      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const shots = bandClips(map.bands, width, height, pageHeight);
      for (const shot of shots) await page.screenshot({ path: join(dir, shot.name), clip: shot.clip, fullPage: true });
      writeFileSync(join(dir, 'page-map.json'), JSON.stringify(map, null, 2));
      writeFileSync(join(dir, 'audit.json'), JSON.stringify(audit, null, 2));
      results.push({ width, dir, map, audit, shots });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  if (options.json) {
    console.log(JSON.stringify(results.map(({ width, dir, map, audit, shots }) => ({ width, dir, outline: map.outline, mapSummary: map.summary, auditSummary: audit.summary, shots: shots.map((s) => join(dir, s.name)) })), null, 2));
  } else {
    results.forEach(({ width, map, audit, shots }) => console.log(summarize(width, map, audit, shots)));
    console.log(`\nFull reports and screenshots: ${options.out}`);
  }
}

main().catch((error) => { console.error(error.message); process.exit(1); });
