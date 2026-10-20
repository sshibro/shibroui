#!/usr/bin/env node
// Headless fixture runner: the automated twin of tests/audit.html.
// Loads every fixture listed in tests/fixtures/expected.json and tests/fixtures/expected/*.json,
// opens it at its viewport (and color scheme / state), runs the named in-page script and checks the
// expected rule IDs. Needs Playwright: `npm i -D playwright-core` or PLAYWRIGHT_CORE=/path/to/playwright-core.
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const EXPECTED_DIR = join(ROOT, 'tests', 'fixtures', 'expected');
const DEFAULT_VIEWPORT = { width: 1280, height: 900 };
const SETTLE_MS = 250;
const OPEN_MS = 400;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

async function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_CORE && pathToFileURL(join(process.env.PLAYWRIGHT_CORE, 'index.mjs')).href, 'playwright-core', 'playwright'].filter(Boolean);
  for (const name of candidates) {
    try { return await import(name); } catch { /* try the next one */ }
  }
  return null;
}

function serve() {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const file = join(ROOT, path);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function loadFixtures() {
  const main = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'expected.json'), 'utf8')).fixtures;
  const extra = existsSync(EXPECTED_DIR)
    ? readdirSync(EXPECTED_DIR).filter((f) => f.endsWith('.json')).sort()
      .flatMap((f) => JSON.parse(readFileSync(join(EXPECTED_DIR, f), 'utf8')).fixtures)
    : [];
  return [...main, ...extra];
}

function judge(fixture, report) {
  const items = report.findings || report.flags || [];
  const ids = (level) => new Set(items.filter((f) => !level || f.level === level).map((f) => f.id));
  const [failIds, anyIds] = [ids('fail'), ids()];
  const fails = items.filter((f) => f.level === 'fail');
  const warns = items.filter((f) => f.level === 'warn');
  const hidden = report.coverage ? report.coverage.hiddenStates.length : (report.states || []).length;
  const list = (arr) => arr.map((f) => `${f.id} ${f.detail}`).join(' | ');
  const problems = [
    ...(fixture.mustFail || []).filter((id) => !failIds.has(id)).map((id) => `missing fail ${id}`),
    ...(fixture.mustFlag || []).filter((id) => !anyIds.has(id)).map((id) => `missing flag ${id}`),
    ...(fixture.mustNotFlag || []).filter((id) => anyIds.has(id)).map((id) => `unexpected ${id}: ${list(items.filter((f) => f.id === id))}`),
    // mustMatch: { "SU-62": "regex" } → some finding with that ID has a detail or fix matching the pattern.
    ...Object.entries(fixture.mustMatch || {}).filter(([id, pattern]) => !items.some((f) => f.id === id && new RegExp(pattern).test(`${f.detail} ${f.fix || ''}`)))
      .map(([id, pattern]) => `no ${id} matching /${pattern}/: ${list(items.filter((f) => f.id === id)) || 'none flagged'}`),
    ...(fixture.maxFails !== undefined && fails.length > fixture.maxFails ? [`${fails.length} fails > ${fixture.maxFails}: ${list(fails)}`] : []),
    ...(fixture.maxWarns !== undefined && warns.length > fixture.maxWarns ? [`${warns.length} warns > ${fixture.maxWarns}: ${list(warns)}`] : []),
    ...(fixture.minHiddenStates !== undefined && hidden < fixture.minHiddenStates ? [`${hidden} hidden states < ${fixture.minHiddenStates}`] : []),
    ...(report.error ? [report.error] : []),
  ];
  return { problems, fails: fails.length, warns: warns.length };
}

async function runFixture(browser, base, fixture) {
  const context = await browser.newContext({ viewport: fixture.viewport || DEFAULT_VIEWPORT, colorScheme: fixture.colorScheme || 'light' });
  const page = await context.newPage();
  try {
    await page.goto(new URL(fixture.url, base).href);
    await page.waitForTimeout(SETTLE_MS);
    if (fixture.setup) await page.evaluate(fixture.setup);
    if (fixture.open) { await page.click(fixture.open); await page.waitForTimeout(OPEN_MS); }
    // SHIBROUI_AUDIT points at an isolated build (src/build.mjs --with … --out …) instead of the shipped audit.js.
    const scriptPath = fixture.script === 'audit.js' && process.env.SHIBROUI_AUDIT ? process.env.SHIBROUI_AUDIT : join(ROOT, 'shibroui', 'scripts', fixture.script);
    const script = readFileSync(scriptPath, 'utf8');
    return await page.evaluate(script);
  } finally {
    await context.close();
  }
}

async function main() {
  const playwright = await loadPlaywright();
  if (!playwright) {
    console.error('Playwright not found. Install playwright-core or set PLAYWRIGHT_CORE=/path/to/playwright-core.');
    process.exit(2);
  }
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/tests/`;
  const browser = await playwright.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const only = process.env.FIXTURES ? process.env.FIXTURES.split(',') : null;
  const fixtures = loadFixtures().filter((f) => !only || only.some((word) => f.name.includes(word) || f.url.includes(word)));
  const results = [];
  for (const fixture of fixtures) {
    const report = await runFixture(browser, base, fixture).catch((error) => ({ error: error.message }));
    const verdict = judge(fixture, report);
    results.push({ fixture, ...verdict });
    const label = verdict.problems.length ? 'FAIL' : 'PASS';
    console.log(`${label} ${fixture.name} (${fixture.script}${fixture.open ? `, open ${fixture.open}` : ''}): ${verdict.fails} fail / ${verdict.warns} warn${verdict.problems.length ? `\n     ${verdict.problems.join('\n     ')}` : ''}`);
  }
  await browser.close();
  server.close();
  const failed = results.filter((r) => r.problems.length).length;
  console.log(`\n${results.length - failed}/${results.length} fixtures pass`);
  process.exit(failed ? 1 : 0);
}

main();
