#!/usr/bin/env node
// Builds shibroui/scripts/audit.js from the small source chunks in src/audit/.
// The browser tools need one self-contained expression, so the chunks are concatenated in filename
// order (00-head … 99-run). Edit the chunks, then run `npm run build`; tests fail if the output is stale.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT_SRC = join(ROOT, 'src', 'audit');
export const AUDIT_OUT = join(ROOT, 'shibroui', 'scripts', 'audit.js');

// extraDirs: staged check files (e.g. src/audit-wip/semantics) merged into the same filename order,
// so a check can be built and tested in isolation before it moves into src/audit.
export function buildAudit({ extraDirs = [] } = {}) {
  const sources = [AUDIT_SRC, ...extraDirs].flatMap((dir) => readdirSync(dir)
    .filter((name) => name.endsWith('.js'))
    .map((name) => ({ name, file: join(dir, name) })));
  return [...sources]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ file }) => readFileSync(file, 'utf8'))
    .join('');
}

const argValue = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const extra = argValue('--with');
  const out = argValue('--out') || AUDIT_OUT;
  const built = buildAudit({ extraDirs: extra ? extra.split(',').map((dir) => join(ROOT, dir)) : [] });
  if (process.argv.includes('--check')) {
    const current = readFileSync(AUDIT_OUT, 'utf8');
    if (current !== built) {
      console.error('audit.js is stale: run `npm run build`');
      process.exit(1);
    }
    console.log('audit.js is up to date');
  } else {
    writeFileSync(out, built);
    console.log(`Built ${out} (${built.split('\n').length} lines)`);
  }
}
