#!/usr/bin/env node
// Builds shibroui/scripts/audit.js from src/audit/ and shibroui/scripts/page-map.js from src/page-map/.
// The browser tools need one self-contained expression each, so the chunks are concatenated in filename
// order (00-head … 99-run). Edit the chunks, then run `npm run build`; tests fail if an output is stale.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT_SRC = join(ROOT, 'src', 'audit');
const PAGE_MAP_SRC = join(ROOT, 'src', 'page-map');
export const AUDIT_OUT = join(ROOT, 'shibroui', 'scripts', 'audit.js');
export const PAGE_MAP_OUT = join(ROOT, 'shibroui', 'scripts', 'page-map.js');

const concatenate = (dirs) => dirs.flatMap((dir) => readdirSync(dir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => ({ name, file: join(dir, name) })))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(({ file }) => readFileSync(file, 'utf8'))
  .join('');

// extraDirs: staged check files (e.g. src/audit-wip/semantics) merged into the same filename order,
// so a check can be built and tested in isolation before it moves into src/audit.
export const buildAudit = ({ extraDirs = [] } = {}) => concatenate([AUDIT_SRC, ...extraDirs]);
export const buildPageMap = () => concatenate([PAGE_MAP_SRC]);

const argValue = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const extra = argValue('--with');
  const isolated = Boolean(extra || argValue('--out'));
  const outputs = [
    { name: 'audit.js', out: argValue('--out') || AUDIT_OUT, built: buildAudit({ extraDirs: extra ? extra.split(',').map((dir) => join(ROOT, dir)) : [] }) },
    // An isolated audit build (--with/--out) leaves the shipped page map alone.
    ...(isolated ? [] : [{ name: 'page-map.js', out: PAGE_MAP_OUT, built: buildPageMap() }]),
  ];
  const stale = [];
  for (const { name, out, built } of outputs) {
    if (process.argv.includes('--check')) {
      if (readFileSync(out, 'utf8') !== built) stale.push(name);
      else console.log(`${name} is up to date`);
    } else {
      writeFileSync(out, built);
      console.log(`Built ${out} (${built.split('\n').length} lines)`);
    }
  }
  if (stale.length) {
    console.error(`${stale.join(' and ')} stale: run \`npm run build\``);
    process.exit(1);
  }
}
