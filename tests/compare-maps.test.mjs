import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareMaps } from '../shibroui/scripts/compare-maps.mjs';

const report = ({ sizes = [12, 14, 16, 20], radii = [8, 12], header = 'h1 28px + stack' } = {}) => ({
  system: {
    fontSizes: sizes.map((value) => ({ value, count: 3 })),
    textColors: [{ value: '#18181b' }, { value: '#52525b' }],
    radii: radii.map((value) => ({ value })),
    shadows: [],
    controlHeights: [{ value: 40 }],
  },
  bands: [{ fingerprint: header }],
});

test('should pass when every route uses the same system', () => {
  const result = compareMaps([{ name: 'billing', report: report() }, { name: 'settings', report: report() }]);
  assert.equal(result.ok, true);
});

test('should name a font size that only one route uses', () => {
  const result = compareMaps([{ name: 'billing', report: report({ sizes: [12, 13, 14, 16, 20] }) }, { name: 'settings', report: report() }]);
  assert.match(result.findings.join('\n'), /fontSizes: 13 \(only billing\)/);
});

test('should flag page headers built differently', () => {
  const result = compareMaps([{ name: 'billing', report: report() }, { name: 'reports', report: report({ header: 'h1 32px + split' }) }]);
  assert.match(result.findings.join('\n'), /page headers differ/);
});

test('should flag the union of radii over budget', () => {
  const result = compareMaps([{ name: 'a', report: report({ radii: [4, 8, 12] }) }, { name: 'b', report: report({ radii: [6, 10, 16] }) }]);
  assert.match(result.findings.join('\n'), /radii: 6 across all routes \(budget 4\)/);
});
