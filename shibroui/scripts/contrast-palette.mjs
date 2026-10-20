// `contrast.mjs --palette tokens.json`: checks declared token pairs in every color scheme.
// Spec: { "schemes": { "light": { "text": "#18181b", ... }, "dark": { ... } }, "pairs": [["text", "surface", 4.5], ...] }
// A pair is [foreground, background, target?]; names resolve per scheme, anything else is read as a color.
import { readFileSync } from 'node:fs';
import { contrastRatio, parseColor, toHex } from './contrast.mjs';

const DEFAULT_TARGET = 4.5;
const RATIO_DECIMALS = 2;
const roundRatio = (ratio) => Number(ratio.toFixed(RATIO_DECIMALS));
const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

function resolveToken(name, tokens, scheme) {
  const value = Object.hasOwn(tokens, name) ? tokens[name] : name;
  try {
    parseColor(value);
  } catch {
    throw new Error(`Unknown token "${name}" in scheme "${scheme}" (not a token and not a color)`);
  }
  return value;
}

function checkPair([foreground, background, target], tokens, scheme) {
  const [fg, bg] = [resolveToken(foreground, tokens, scheme), resolveToken(background, tokens, scheme)];
  const goal = target === undefined ? DEFAULT_TARGET : Number(target);
  const ratio = contrastRatio(fg, bg);
  return {
    foreground, background, foregroundColor: toHex(parseColor(fg)), backgroundColor: toHex(parseColor(bg)),
    ratio: roundRatio(ratio), target: goal, pass: ratio >= goal,
  };
}

export function readPalette(file) {
  const spec = JSON.parse(readFileSync(file, 'utf8'));
  if (!isRecord(spec.schemes) || !Object.keys(spec.schemes).length) throw new Error('Palette needs a "schemes" object, e.g. { "light": { "text": "#111" } }');
  if (!Array.isArray(spec.pairs) || !spec.pairs.every((pair) => Array.isArray(pair) && pair.length >= 2)) throw new Error('Palette needs "pairs": [["text", "surface", 4.5], ...]');
  return spec;
}

export function evaluatePalette(spec) {
  const schemes = Object.fromEntries(Object.entries(spec.schemes).map(([scheme, tokens]) => [
    scheme, spec.pairs.map((pair) => checkPair(pair, tokens, scheme)),
  ]));
  const ok = Object.values(schemes).every((rows) => rows.every((row) => row.pass));
  return { ok, schemes };
}

export function formatPalette(report) {
  const tables = Object.entries(report.schemes).map(([scheme, rows]) => {
    const labels = rows.map((row) => `${row.foreground} on ${row.background}`);
    const width = Math.max(...labels.map((label) => label.length));
    const lines = rows.map((row, index) => `  ${labels[index].padEnd(width)}  ${row.foregroundColor} / ${row.backgroundColor}  ${row.ratio.toFixed(RATIO_DECIMALS)}:1  target ${row.target}  ${row.pass ? 'PASS' : 'FAIL'}`);
    return [`${scheme}`, ...lines].join('\n');
  });
  return `${tables.join('\n\n')}\n\n${report.ok ? 'All pairs pass.' : 'Some pairs FAIL.'}`;
}
