import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createScriptServer } from '../shibroui/scripts/serve.mjs';

let server;
let base;
before(async () => {
  server = createScriptServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('should serve audit.js byte for byte', async () => {
  const res = await fetch(`${base}/audit.js`);
  assert.equal(await res.text(), readFileSync(new URL('../shibroui/scripts/audit.js', import.meta.url), 'utf8'));
});

test('should send CORS and Private Network Access headers', async () => {
  const res = await fetch(`${base}/page-map.js`);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  assert.equal(res.headers.get('access-control-allow-private-network'), 'true');
});

test('should answer a CORS preflight with 204', async () => {
  const res = await fetch(`${base}/audit.js`, { method: 'OPTIONS' });
  assert.equal(res.status, 204);
});

test('should refuse files other than the in-page scripts', async () => {
  const responses = await Promise.all(['/serve.mjs', '/../SKILL.md', '/%2e%2e/SKILL.md', '/contrast.mjs'].map((p) => fetch(`${base}${p}`)));
  assert.deepEqual(responses.map((r) => r.status), [404, 404, 404, 404]);
});
