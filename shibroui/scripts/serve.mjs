#!/usr/bin/env node
// Serves audit.js and page-map.js to the page under review, so a browser tool can load them with one line
// instead of pasting ~190 KB of script into every call:
//   node scripts/serve.mjs            (keep it running in the background; --port 4399 by default)
//   await fetch('http://127.0.0.1:4399/audit.js').then((r) => r.text()).then((s) => (0, eval)(s))
// Only the in-page scripts in this folder are served, read-only, on the loopback interface. The CORS and
// Private Network Access headers let pages on other local ports or https staging hosts fetch them.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVED = new Set(['audit.js', 'page-map.js']);
const DEFAULT_PORT = 4399;
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Private-Network': 'true',
  'Cache-Control': 'no-store',
};

export function createScriptServer() {
  return createServer(async (req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, HEADERS).end(); return; }
    const name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname).replace(/^\/+/, '');
    if (req.method !== 'GET' || !SERVED.has(name)) { res.writeHead(404, HEADERS).end('not found'); return; }
    try {
      const body = await readFile(join(HERE, name));
      res.writeHead(200, { ...HEADERS, 'Content-Type': 'text/javascript; charset=utf-8' }).end(body);
    } catch {
      res.writeHead(500, HEADERS).end('could not read the script');
    }
  });
}

const portArg = () => {
  const index = process.argv.indexOf('--port');
  const value = index >= 0 ? Number(process.argv[index + 1]) : Number(process.env.SHIBROUI_PORT || DEFAULT_PORT);
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : DEFAULT_PORT;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = portArg();
  createScriptServer().listen(port, '127.0.0.1', () => {
    console.log(`shibroUI scripts on http://127.0.0.1:${port}/ (audit.js, page-map.js)`);
    console.log(`load: await fetch('http://127.0.0.1:${port}/audit.js').then((r) => r.text()).then((s) => (0, eval)(s))`);
  });
}
