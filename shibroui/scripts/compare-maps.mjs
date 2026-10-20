#!/usr/bin/env node
// Compares saved page-map.js reports from several screens of one product (SU-265): values that only one
// route uses (font sizes, text colors, radii, shadows, control heights), page headers built differently,
// and the union against the screen budgets.
//   node scripts/compare-maps.mjs billing.json settings.json reports.json [--json]
// Save each report with JSON.stringify(window.__shibroPageMapResult) or from scripts/scan.mjs (<out>/<width>/page-map.json).
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUDGETS = { fontSizes: 6, textColors: 8, radii: 4, shadows: 5, controlHeights: 3 };
const KEYS = ['fontSizes', 'textColors', 'radii', 'shadows', 'controlHeights'];

const valuesOf = (report, key) => ((report.system && report.system[key]) || []).map((entry) => String(entry.value));
// The page header's shape: the first band's fingerprint, or the first region with a heading.
const headerShape = (report) => (report.bands && report.bands[0] ? report.bands[0].fingerprint
  : ((report.wireframe && report.wireframe.regions) || []).map((r) => r.label).slice(0, 2).join(' + ')) || 'unknown';

export function compareMaps(named) {
  const routes = named.map(({ name }) => name);
  const keys = KEYS.map((key) => {
    const perRoute = named.map(({ name, report }) => ({ name, values: new Set(valuesOf(report, key)) }));
    const union = [...new Set(perRoute.flatMap((r) => [...r.values]))];
    const oneOff = union.map((value) => ({ value, routes: perRoute.filter((r) => r.values.has(value)).map((r) => r.name) }))
      .filter((entry) => entry.routes.length === 1 && routes.length > 1);
    return { key, union, overBudget: union.length > BUDGETS[key], budget: BUDGETS[key], oneOff };
  });
  const headers = named.map(({ name, report }) => ({ name, shape: headerShape(report) }));
  const headerShapes = [...new Set(headers.map((h) => h.shape))];
  const findings = [
    ...keys.filter((k) => k.oneOff.length).map((k) => `SU-265 ${k.key}: ${k.oneOff.map((o) => `${o.value} (only ${o.routes[0]})`).join(', ')}`),
    ...keys.filter((k) => k.overBudget).map((k) => `SU-265 ${k.key}: ${k.union.length} across all routes (budget ${k.budget})`),
    ...(headerShapes.length > 1 ? [`SU-265 page headers differ: ${headers.map((h) => `${h.name}: ${h.shape}`).join(' · ')}`] : []),
  ];
  return { routes, keys, headers, findings, ok: findings.length === 0 };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  if (files.length < 2) {
    console.error('usage: node scripts/compare-maps.mjs <page-map.json> <page-map.json> [...] [--json]');
    process.exit(2);
  }
  const named = files.map((file) => ({ name: basename(file).replace(/\.json$/, ''), report: JSON.parse(readFileSync(file, 'utf8')) }));
  const result = compareMaps(named);
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else console.log(result.ok ? `One system across ${result.routes.length} routes.` : result.findings.join('\n'));
  process.exit(result.ok ? 0 : 1);
}
