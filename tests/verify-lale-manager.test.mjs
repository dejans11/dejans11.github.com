import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, execFile } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { html, zip, png } from './fixtures/lale-manager.mjs';

const verify = fileURLToPath(new URL('../scripts/verify-lale-manager.mjs', import.meta.url));
const importer = fileURLToPath(new URL('../scripts/import-lale-manager.mjs', import.meta.url));
const runFile = promisify(execFile);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'lale-verify-'));
  t.after(() => { assert.ok(relative(tmpdir(), root).startsWith('lale-verify-')); rmSync(root, { recursive: true, force: true }); });
  const site = join(root, 'site'), source = join(root, 'source'), game = join(site, 'fun', 'lale-manager');
  mkdirSync(join(site, 'fun'), { recursive: true }); mkdirSync(source);
  writeFileSync(join(site, '.nojekyll'), '');
  writeFileSync(join(site, 'index.html'), '<a href="fun/lale-manager/">Retro Football Manager</a>');
  writeFileSync(join(site, 'fun', 'index.html'), '<a href="lale-manager/">Play</a><a download href="lale-manager/retro-football-manager.zip">ZIP</a><img src="../assets/games/lale-manager.png">');
  writeFileSync(join(source, 'index.html'), html); writeFileSync(join(source, 'retro-football-manager.zip'), zip);
  const screenshot = join(root, 'shot.png'); writeFileSync(screenshot, png);
  execFileSync(process.execPath, [importer, '--source', source, '--screenshot', screenshot], { cwd: site });
  const run = args => runFile(process.execPath, [verify, ...(args || [])], { cwd: site });
  return { root, site, game, run };
}

test('checks the release, archive and gallery without changing any files', async t => {
  const { site, game, run } = fixture(t);
  const before = readFileSync(join(site, 'fun', 'game-versions.json'));
  const result = await run();
  assert.match(result.stdout, /Verified local Retro Football Manager/);
  assert.deepEqual(readFileSync(join(site, 'fun', 'game-versions.json')), before);
  assert.deepEqual(readdirSync(game).sort(), ['index.html', 'retro-football-manager.zip']);
});

for (const defect of ['changed HTML', 'damaged ZIP with updated hash', 'wrong source hash', 'unwanted source file']) {
  test(`rejects ${defect}`, async t => {
    const { site, game, run } = fixture(t);
    const manifestPath = join(site, 'fun', 'game-versions.json');
    const manifest = JSON.parse(readFileSync(manifestPath));
    if (defect === 'changed HTML') writeFileSync(join(game, 'index.html'), 'wrong game');
    if (defect === 'damaged ZIP with updated hash') {
      const damaged = Buffer.from(zip); damaged[50] ^= 255;
      writeFileSync(join(game, 'retro-football-manager.zip'), damaged);
      manifest['lale-manager'].zipSha256 = digest(damaged);
    }
    if (defect === 'wrong source hash') manifest['lale-manager'].sourceHtmlSha256 = '0'.repeat(64);
    if (defect === 'unwanted source file') writeFileSync(join(game, 'private.ts'), 'private source');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    await assert.rejects(run(), error => /hash|ZIP|source|unexpected/i.test(error.stderr));
  });
}

async function serve(t, site, override = {}) {
  const routes = {
    '/': 'index.html', '/fun/': 'fun/index.html', '/fun/lale-manager/': 'fun/lale-manager/index.html',
    '/fun/lale-manager/retro-football-manager.zip': 'fun/lale-manager/retro-football-manager.zip',
    '/fun/game-versions.json': 'fun/game-versions.json', '/assets/games/lale-manager.png': 'assets/games/lale-manager.png',
  };
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    const data = Object.hasOwn(override, path) ? override[path] : routes[path] && readFileSync(join(site, routes[path]));
    response.statusCode = data ? 200 : 404; response.end(data || 'Not found');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  return `http://127.0.0.1:${server.address().port}/fun/lale-manager/`;
}

test('verifies HTTP files and navigation against the prepared release', async t => {
  const { site, run } = fixture(t);
  const url = await serve(t, site);
  assert.match((await run(['--url', url])).stdout, /Verified published Retro Football Manager/);
});

test('refuses a stale HTTP game even when it returns 200', async t => {
  const { site, run } = fixture(t);
  const url = await serve(t, site, { '/fun/lale-manager/': Buffer.from('Previous release') });
  await assert.rejects(run(['--url', url]), error => /published HTML.*hash/i.test(error.stderr));
});

test('reports a missing HTTP ZIP instead of claiming publication succeeded', async t => {
  const { site, run } = fixture(t);
  const url = await serve(t, site, { '/fun/lale-manager/retro-football-manager.zip': null });
  await assert.rejects(run(['--url', url]), error => /HTTP 404.*retro-football-manager\.zip/i.test(error.stderr));
});
