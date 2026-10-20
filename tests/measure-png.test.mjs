import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const TOOL = fileURLToPath(new URL('../shibroui/scripts/measure-png.py', import.meta.url));
const HAS_PYTHON = spawnSync('python3', ['--version']).status === 0;
const GRAY = [235, 237, 240];
const WHITE = [255, 255, 255];
const INK = [124, 58, 237];

// Minimal RGB PNG writer: rects are [x, y, w, h, color], painted in order over the background.
function png(width, height, background, rects) {
  const pixel = (x, y) => rects.reduce((color, [rx, ry, rw, rh, c]) => (x >= rx && x < rx + rw && y >= ry && y < ry + rh ? c : color), background);
  const rows = Array.from({ length: height }, (_, y) => Buffer.from([0, ...Array.from({ length: width }, (_, x) => pixel(x, y)).flat()]));
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
}

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function measure(name, rects) {
  const file = join(mkdtempSync(join(tmpdir(), 'shibroui-png-')), `${name}.png`);
  writeFileSync(file, png(240, 80, GRAY, rects));
  return JSON.parse(execFileSync('python3', [TOOL, file, '--json'], { encoding: 'utf8' }));
}

const pillWith = (inkX) => [[40, 10, 140, 60, WHITE], [inkX, 34, 80, 12, INK]];
const whitePill = (report) => report.containers.find((c) => c.fill === '#ffffff');

test('should report a centered label as centered', { skip: !HAS_PYTHON }, () => {
  const pill = whitePill(measure('centered', pillWith(70)));
  assert.equal(pill.offsetX, 0);
});

test('should measure a label 6px left of center', { skip: !HAS_PYTHON }, () => {
  const pill = whitePill(measure('offset', pillWith(64)));
  assert.equal(pill.offsetX, -6);
});

test('should flag a 6px offset in a 140px pill as a fail', { skip: !HAS_PYTHON }, () => {
  const pill = whitePill(measure('offset-flag', pillWith(64)));
  assert.equal(pill.level, 'fail');
});

test('should not flag a centered label', { skip: !HAS_PYTHON }, () => {
  const pill = whitePill(measure('centered-flag', pillWith(70)));
  assert.equal(pill.level, null);
});

test('should report the ink contrast against the fill', { skip: !HAS_PYTHON }, () => {
  const pill = whitePill(measure('contrast', pillWith(70)));
  assert.ok(pill.contrast > 5 && pill.contrast < 6, `contrast ${pill.contrast}`);
});
