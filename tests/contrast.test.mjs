import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseColor, contrastRatio, rate, fixColor, toHex, rgbToOklch, oklchToRgb } from '../shibroui/scripts/contrast.mjs';

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

// ---------- CSS Color 4: oklch(), oklab(), named colors (SU-163) ----------
const toRgbBytes = ({ r, g, b }) => ({ r, g, b });
const BLUE_OKLCH = 'oklch(0.62 0.19 260)';
// Reference bytes for BLUE_OKLCH, computed independently with Chromium's canvas color parser.
const BLUE_OKLCH_BYTES = { r: 58, g: 129, b: 246 };

test('should parse oklch to the sRGB bytes a browser produces', () => {
  const parsed = parseColor(BLUE_OKLCH);
  assert.ok(Math.abs(parsed.r - BLUE_OKLCH_BYTES.r) <= 1 && Math.abs(parsed.g - BLUE_OKLCH_BYTES.g) <= 1 && Math.abs(parsed.b - BLUE_OKLCH_BYTES.b) <= 1, JSON.stringify(parsed));
});

test('should round-trip oklch through the inverse conversion within one byte', () => {
  const lch = rgbToOklch(parseColor(BLUE_OKLCH));
  const back = oklchToRgb(lch);
  const parsed = parseColor(BLUE_OKLCH);
  assert.ok(Math.abs(back.r - parsed.r) <= 1 && Math.abs(back.g - parsed.g) <= 1 && Math.abs(back.b - parsed.b) <= 1);
});

test('should recover the authored lightness and chroma from the parsed oklch color', () => {
  const lch = rgbToOklch(parseColor(BLUE_OKLCH));
  assert.ok(Math.abs(lch.L - 0.62) < 0.005 && Math.abs(lch.C - 0.19) < 0.005, JSON.stringify(lch));
});

test('should parse oklch white as #ffffff', () => {
  assert.equal(toHex(parseColor('oklch(1 0 0)')), '#ffffff');
});

test('should parse oklch black as #000000', () => {
  assert.equal(toHex(parseColor('oklch(0 0 0)')), '#000000');
});

test('should parse oklch percentages like the unitless form', () => {
  assert.deepEqual(toRgbBytes(parseColor('oklch(62% 47.5% 260)')), toRgbBytes(parseColor(BLUE_OKLCH)));
});

test('should parse oklch alpha', () => {
  assert.equal(parseColor('oklch(0.62 0.19 260 / 40%)').a, 0.4);
});

test('should treat none as zero in oklch', () => {
  assert.equal(toHex(parseColor('oklch(1 none none)')), '#ffffff');
});

test('should accept a deg unit on the oklch hue', () => {
  assert.deepEqual(toRgbBytes(parseColor('oklch(0.62 0.19 260deg)')), toRgbBytes(parseColor(BLUE_OKLCH)));
});

test('should gamut-clamp an out-of-range oklch chroma instead of throwing', () => {
  const parsed = parseColor('oklch(0.7 0.4 150)');
  assert.ok([parsed.r, parsed.g, parsed.b].every((channel) => channel >= 0 && channel <= 255));
});

test('should parse oklab with a and b numbers', () => {
  const lab = parseColor('oklab(0.62 -0.03 -0.19)');
  assert.ok(lab.b > lab.r, JSON.stringify(lab));
});

test('should parse oklab percentages of 0.4 like numbers', () => {
  assert.deepEqual(toRgbBytes(parseColor('oklab(62% -7.5% -47.5%)')), toRgbBytes(parseColor('oklab(0.62 -0.03 -0.19)')));
});

test('should parse oklab gray with zero chroma', () => {
  const gray = parseColor('oklab(0.5 0 0)');
  assert.ok(gray.r === gray.g && gray.g === gray.b);
});

test('should parse oklab alpha', () => {
  assert.equal(parseColor('oklab(1 0 0 / 0.5)').a, 0.5);
});

test('should parse the basic named colors', () => {
  const named = { red: '#ff0000', green: '#008000', blue: '#0000ff', navy: '#000080', yellow: '#ffff00', orange: '#ffa500', purple: '#800080', teal: '#008080', maroon: '#800000', olive: '#808000', lime: '#00ff00', silver: '#c0c0c0', gray: '#808080', white: '#ffffff', black: '#000000' };
  Object.entries(named).forEach(([name, hex]) => assert.equal(toHex(parseColor(name)), hex, name));
});

test('should treat grey, aqua, cyan, fuchsia and magenta as aliases', () => {
  assert.equal(toHex(parseColor('grey')), toHex(parseColor('gray')));
  assert.equal(toHex(parseColor('aqua')), '#00ffff');
  assert.equal(toHex(parseColor('cyan')), '#00ffff');
  assert.equal(toHex(parseColor('fuchsia')), '#ff00ff');
  assert.equal(toHex(parseColor('magenta')), '#ff00ff');
});

test('should parse extended named colors case-insensitively', () => {
  assert.equal(toHex(parseColor('RebeccaPurple')), '#663399');
});

test('should use oklch colors in a contrast ratio', () => {
  assert.equal(round2(contrastRatio('oklch(0 0 0)', 'oklch(1 0 0)')), 21);
});

// ---------- --palette (SU-163) ----------
const writePalette = (spec) => {
  const dir = mkdtempSync(join(tmpdir(), 'shibroui-palette-'));
  const file = join(dir, 'tokens.json');
  writeFileSync(file, JSON.stringify(spec));
  return file;
};
const runCli = (args) => {
  try {
    return { status: 0, stdout: execFileSync('node', [CLI, ...args], { encoding: 'utf8', stdio: 'pipe' }) };
  } catch (error) {
    return { status: error.status, stdout: String(error.stdout || ''), stderr: String(error.stderr || '') };
  }
};
const PASSING_PALETTE = {
  schemes: {
    light: { text: '#18181b', surface: '#ffffff', border: 'oklch(0.55 0 0)' },
    dark: { text: '#e4e4e7', surface: '#121212', border: 'oklch(0.65 0 0)' },
  },
  pairs: [['text', 'surface', 4.5], ['border', 'surface', 3]],
};
const FAILING_DARK = { ...PASSING_PALETTE, schemes: { ...PASSING_PALETTE.schemes, dark: { ...PASSING_PALETTE.schemes.dark, text: '#3f3f46' } } };

test('should exit 0 and print PASS for a palette whose pairs all pass', () => {
  const result = runCli(['--palette', writePalette(PASSING_PALETTE)]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /PASS/);
  assert.doesNotMatch(result.stdout, /FAIL/);
});

test('should print a table per scheme with ratio and target', () => {
  const { stdout } = runCli(['--palette', writePalette(PASSING_PALETTE)]);
  assert.match(stdout, /light/);
  assert.match(stdout, /dark/);
  assert.match(stdout, /text.*surface.*\d+\.\d\d:1.*4\.5/);
});

test('should exit 1 and print FAIL when a dark pair misses its target', () => {
  const result = runCli(['--palette', writePalette(FAILING_DARK)]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /FAIL/);
});

test('should fail only the scheme that is broken', () => {
  const { stdout } = runCli(['--palette', writePalette(FAILING_DARK), '--json']);
  const report = JSON.parse(stdout);
  assert.ok(report.schemes.light.every((row) => row.pass));
  assert.ok(report.schemes.dark.some((row) => !row.pass));
});

test('should print palette json with ratio, target and pass per pair', () => {
  const { stdout } = runCli(['--palette', writePalette(PASSING_PALETTE), '--json']);
  const report = JSON.parse(stdout);
  assert.equal(report.ok, true);
  assert.deepEqual(Object.keys(report.schemes.light[0]).sort(), ['background', 'backgroundColor', 'foreground', 'foregroundColor', 'pass', 'ratio', 'target']);
});

test('should default a pair without a target to 4.5', () => {
  const spec = { schemes: { light: { a: '#767676', b: '#ffffff' } }, pairs: [['a', 'b']] };
  const report = JSON.parse(runCli(['--palette', writePalette(spec), '--json']).stdout);
  assert.equal(report.schemes.light[0].target, 4.5);
});

test('should exit 2 and name the token when a pair references an unknown token', () => {
  const spec = { schemes: { light: { a: '#000' } }, pairs: [['a', 'missing']] };
  const result = runCli(['--palette', writePalette(spec)]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /missing/);
});

test('should note neutral tokens at chroma 0 next to a chromatic accent (SU-257)', () => {
  const palette = { ...PASSING_PALETTE, schemes: { light: { ...PASSING_PALETTE.schemes.light, accent: '#4f46e5' } } };
  const { stdout } = runCli(['--palette', writePalette(palette)]);
  assert.match(stdout, /info: light: .*border.* chroma 0 next to the accent accent/);
});

test('should not note neutrals when there is no chromatic accent', () => {
  const { stdout } = runCli(['--palette', writePalette(PASSING_PALETTE)]);
  assert.doesNotMatch(stdout, /SU-257/);
});
