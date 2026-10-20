#!/usr/bin/env node
// shibroUI contrast helper: WCAG 2 contrast ratios, AA/AAA ratings and the nearest passing color.
// Usage: node contrast.mjs <fg> <bg> [<fg> <bg> ...] [--target 4.5] [--fix] [--json]
import { fileURLToPath } from 'node:url';

const AA_NORMAL = 4.5;
const AAA_NORMAL = 7;
const AA_LARGE = 3;
const AAA_LARGE = 4.5;
const NON_TEXT = 3;
const LIGHTNESS_STEP = 0.002;
const CHROMA_SEARCH_STEPS = 20;
const NAMED = { white: '#ffffff', black: '#000000', transparent: '#00000000' };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function parseHex(hex) {
  const digits = hex.slice(1);
  const full = digits.length <= 4 ? [...digits].map((d) => d + d).join('') : digits;
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(full)) throw new Error(`Unknown color: ${hex}`);
  const channel = (index) => parseInt(full.slice(index, index + 2), 16);
  return { r: channel(0), g: channel(2), b: channel(4), a: full.length === 8 ? channel(6) / 255 : 1 };
}

function parseAlpha(token) {
  if (token === undefined) return 1;
  return token.endsWith('%') ? parseFloat(token) / 100 : parseFloat(token);
}

function splitArgs(inner) {
  return inner.replace('/', ' / ').split(/[\s,/]+/).filter(Boolean);
}

function hslToRgb(hue, saturation, lightness) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const channel = (n) => {
    const k = (n + hue / 30) % 12;
    return lightness - chroma / 2 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: Math.round(channel(0) * 255), g: Math.round(channel(8) * 255), b: Math.round(channel(4) * 255) };
}

export function parseColor(input) {
  const value = String(input).trim().toLowerCase();
  if (NAMED[value]) return parseHex(NAMED[value]);
  if (value.startsWith('#')) return parseHex(value);
  const match = value.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (!match) throw new Error(`Unknown color: ${input}`);
  const [name, inner] = [match[1], match[2]];
  const parts = splitArgs(inner);
  if (name.startsWith('rgb')) {
    const toByte = (token) => (token.endsWith('%') ? parseFloat(token) * 2.55 : parseFloat(token));
    const [r, g, b] = parts.slice(0, 3).map((token) => Math.round(clamp(toByte(token), 0, 255)));
    return { r, g, b, a: parseAlpha(parts[3]) };
  }
  const rgb = hslToRgb(parseFloat(parts[0]), parseFloat(parts[1]) / 100, parseFloat(parts[2]) / 100);
  return { ...rgb, a: parseAlpha(parts[3]) };
}

const asColor = (color) => (typeof color === 'string' ? parseColor(color) : color);

export function composite(foreground, background) {
  const top = asColor(foreground);
  const bottom = asColor(background);
  const mix = (front, back) => Math.round(front * top.a + back * (1 - top.a));
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

const toLinear = (byte) => {
  const channel = byte / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};

export function relativeLuminance(color) {
  const { r, g, b } = asColor(color);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(foreground, background) {
  const opaqueBackground = composite(background, '#ffffff');
  const opaqueForeground = composite(foreground, opaqueBackground);
  const [high, low] = [relativeLuminance(opaqueForeground), relativeLuminance(opaqueBackground)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

export function rate(ratio) {
  return {
    aaNormal: ratio >= AA_NORMAL,
    aaaNormal: ratio >= AAA_NORMAL,
    aaLarge: ratio >= AA_LARGE,
    aaaLarge: ratio >= AAA_LARGE,
    nonText: ratio >= NON_TEXT,
  };
}

export function toHex(color) {
  const { r, g, b } = asColor(color);
  return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
}

// OKLab/OKLCH conversions keep hue stable while lightness changes.
function rgbToOklch({ r, g, b }) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: Math.atan2(B, A) };
}

function oklchToLinearRgb({ L, C, h }) {
  const [A, B] = [C * Math.cos(h), C * Math.sin(h)];
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (channels) => channels.every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4);
const toByte = (linear) => {
  const channel = clamp(linear, 0, 1);
  const encoded = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
};

function oklchToRgb(lch) {
  let channels = oklchToLinearRgb(lch);
  if (!inGamut(channels)) {
    let [low, high] = [0, lch.C];
    for (let step = 0; step < CHROMA_SEARCH_STEPS; step += 1) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinearRgb({ ...lch, C: mid }))) low = mid;
      else high = mid;
    }
    channels = oklchToLinearRgb({ ...lch, C: low });
  }
  const [r, g, b] = channels.map(toByte);
  return { r, g, b, a: 1 };
}

export function fixColor(foreground, background, target = AA_NORMAL) {
  const opaqueBackground = composite(background, '#ffffff');
  const start = composite(foreground, opaqueBackground);
  const startRatio = contrastRatio(start, opaqueBackground);
  if (startRatio >= target) return { hex: toHex(start), ratio: startRatio, changed: false };

  const towardDark = contrastRatio('#000000', opaqueBackground) >= contrastRatio('#ffffff', opaqueBackground);
  const lch = rgbToOklch(start);
  const direction = towardDark ? -1 : 1;
  let best = { hex: toHex(start), ratio: startRatio };
  for (let L = lch.L; L >= 0 && L <= 1; L += direction * LIGHTNESS_STEP) {
    const candidate = oklchToRgb({ ...lch, L });
    const ratio = contrastRatio(candidate, opaqueBackground);
    if (ratio > best.ratio) best = { hex: toHex(candidate), ratio };
    if (ratio >= target) return { ...best, changed: true };
  }
  const extreme = towardDark ? '#000000' : '#ffffff';
  return { hex: extreme, ratio: contrastRatio(extreme, opaqueBackground), changed: true };
}

function describe(foreground, background, target, withFix) {
  const ratio = contrastRatio(foreground, background);
  const result = { foreground, background, ratio: Math.round(ratio * 100) / 100, ...rate(ratio) };
  return withFix && ratio < target ? { ...result, fix: fixColor(foreground, background, target) } : result;
}

function formatResult(result, target) {
  const mark = (pass) => (pass ? '✓' : '✗');
  const lines = [
    `${result.foreground} on ${result.background} → ${result.ratio.toFixed(2)}:1`,
    `  normal text: ${mark(result.aaNormal)} AA 4.5  ${mark(result.aaaNormal)} AAA 7`,
    `  large text:  ${mark(result.aaLarge)} AA 3    ${mark(result.aaaLarge)} AAA 4.5`,
    `  UI / non-text: ${mark(result.nonText)} 3`,
  ];
  if (result.fix) lines.push(`  fix for ${target}:1 → ${result.fix.hex} (${result.fix.ratio.toFixed(2)}:1)`);
  return lines.join('\n');
}

function parseArgs(argv) {
  const colors = [];
  const flags = new Set();
  let target = AA_NORMAL;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target') {
      target = parseFloat(argv[index + 1]);
      index += 1;
    } else if (arg.startsWith('--')) {
      flags.add(arg);
    } else {
      colors.push(arg);
    }
  }
  return { colors, flags, target };
}

function main(argv) {
  const { colors, flags, target } = parseArgs(argv);
  if (colors.length < 2 || colors.length % 2 !== 0) {
    console.error('Usage: node contrast.mjs <fg> <bg> [<fg> <bg> ...] [--target 4.5] [--fix] [--json]');
    process.exit(2);
  }
  const pairs = Array.from({ length: colors.length / 2 }, (_, index) => [colors[index * 2], colors[index * 2 + 1]]);
  const results = pairs.map(([fg, bg]) => describe(fg, bg, target, flags.has('--fix')));
  const output = flags.has('--json') ? JSON.stringify(results, null, 2) : results.map((r) => formatResult(r, target)).join('\n\n');
  process.stdout.write(`${output}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
