import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseColor, contrastRatio, rate, fixColor, toHex } from '../shibroui/scripts/contrast.mjs';

const CLI = fileURLToPath(new URL('../shibroui/scripts/contrast.mjs', import.meta.url));
const round2 = (value) => Math.round(value * 100) / 100;

test('should parse short hex colors', () => {
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
});

test('should parse long hex colors with alpha', () => {
  assert.deepEqual(parseColor('#00000080'), { r: 0, g: 0, b: 0, a: 128 / 255 });
});

test('should parse space-separated rgb with percentage alpha', () => {
  assert.deepEqual(parseColor('rgb(10 20 30 / 50%)'), { r: 10, g: 20, b: 30, a: 0.5 });
});

test('should parse comma-separated rgba', () => {
  assert.deepEqual(parseColor('rgba(10, 20, 30, 0.25)'), { r: 10, g: 20, b: 30, a: 0.25 });
});

test('should parse hsl colors', () => {
  assert.deepEqual(parseColor('hsl(0 100% 50%)'), { r: 255, g: 0, b: 0, a: 1 });
});

test('should parse named white, black and transparent', () => {
  assert.equal(parseColor('transparent').a, 0);
});

test('should throw on an unknown color', () => {
  assert.throws(() => parseColor('not-a-color'));
});

test('should report 21:1 for black on white', () => {
  assert.equal(round2(contrastRatio('#000', '#fff')), 21);
});

test('should report 1:1 for identical colors', () => {
  assert.equal(contrastRatio('#123456', '#123456'), 1);
});

test('should match the known muted-gray failure on white', () => {
  assert.equal(round2(contrastRatio('#9CA3AF', '#FFFFFF')), 2.54);
});

test('should match the known passing gray on white', () => {
  assert.equal(round2(contrastRatio('#6B7280', '#FFFFFF')), 4.83);
});

test('should composite a translucent foreground over the background', () => {
  assert.equal(round2(contrastRatio('rgba(0,0,0,0.5)', '#fff')), 3.95);
});

test('should rate a ratio against AA and AAA thresholds', () => {
  assert.deepEqual(rate(4.6), { aaNormal: true, aaaNormal: false, aaLarge: true, aaaLarge: true, nonText: true });
});

test('should format colors as lowercase hex', () => {
  assert.equal(toHex({ r: 255, g: 208, b: 0, a: 1 }), '#ffd000');
});

test('should darken a failing gray on white to just pass 4.5:1', () => {
  const fixed = fixColor('#9CA3AF', '#FFFFFF', 4.5);
  assert.ok(fixed.ratio >= 4.5 && fixed.ratio < 4.75, `ratio was ${fixed.ratio}`);
});

test('should lighten a failing gray on a dark surface', () => {
  const fixed = fixColor('#3b3b3b', '#111111', 4.5);
  assert.ok(fixed.ratio >= 4.5 && contrastRatio(fixed.hex, '#000') > contrastRatio('#3b3b3b', '#000'));
});

test('should keep a color that already passes', () => {
  assert.equal(fixColor('#000000', '#ffffff', 4.5).hex, '#000000');
});

test('should keep the hue family when fixing a saturated color', () => {
  const fixed = parseColor(fixColor('#60a5fa', '#ffffff', 4.5).hex);
  assert.ok(fixed.b > fixed.r && fixed.b > fixed.g, `got ${JSON.stringify(fixed)}`);
});

test('should print the ratio from the command line', () => {
  const output = execFileSync('node', [CLI, '#9CA3AF', '#fff'], { encoding: 'utf8' });
  assert.match(output, /2\.54:1/);
});

test('should print json with a fix from the command line', () => {
  const output = execFileSync('node', [CLI, '#9CA3AF', '#fff', '--fix', '--json'], { encoding: 'utf8' });
  const [result] = JSON.parse(output);
  assert.ok(result.fix.ratio >= 4.5);
});
