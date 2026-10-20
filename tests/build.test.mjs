import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAudit, buildPageMap, AUDIT_OUT, PAGE_MAP_OUT } from '../src/build.mjs';

test('should match the committed audit.js when built from src/audit', () => {
  const built = buildAudit();
  const committed = readFileSync(AUDIT_OUT, 'utf8');
  assert.equal(built, committed, 'shibroui/scripts/audit.js is stale: run `npm run build`');
});

test('should produce a single expression that evaluates to a function call', () => {
  const built = buildAudit();
  assert.match(built.trimEnd(), /^\/\/[\s\S]*\(\(\) => \{[\s\S]*\}\)\(\)$/);
});

test('should match the committed page-map.js when built from src/page-map', () => {
  assert.equal(buildPageMap(), readFileSync(PAGE_MAP_OUT, 'utf8'), 'shibroui/scripts/page-map.js is stale: run `npm run build`');
});
