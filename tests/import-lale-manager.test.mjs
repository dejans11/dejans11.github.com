import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { html, zip, png } from './fixtures/lale-manager.mjs';

const script = fileURLToPath(new URL('../scripts/import-lale-manager.mjs', import.meta.url));
const digest = data => createHash('sha256').update(data).digest('hex');

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'pages-lale-test-'));
  t.after(() => { assert.equal(relative(tmpdir(), root).startsWith('pages-lale-test-'), true); rmSync(root, { recursive: true, force: true }); });
  const site = join(root, 'site'), source = join(root, 'dist');
  mkdirSync(join(site, 'fun', 'lale-manager'), { recursive: true });
  mkdirSync(source);
  writeFileSync(join(site, '.nojekyll'), '');
  writeFileSync(join(site, 'fun', 'index.html'), '<h1>Games</h1>');
  writeFileSync(join(site, 'fun', 'lale-manager', 'index.html'), 'Previous game');
  writeFileSync(join(site, 'fun', 'game-versions.json'), JSON.stringify({ blobs: { commit: 'abc123' } }));
  writeFileSync(join(source, 'index.html'), html);
  writeFileSync(join(source, 'retro-football-manager.zip'), zip);
  writeFileSync(join(source, 'private.ts'), 'Never publish this');
  writeFileSync(join(source, '.env'), 'Never publish this');
  const screenshot = join(root, 'screenshot.png'); writeFileSync(screenshot, png);
  const run = (args = []) => spawnSync(process.execPath, [script, '--source', source, ...args], { cwd: site, encoding: 'utf8' });
  return { root, site, source, screenshot, run };
}

test('exports only the built game and unchanged offline ZIP, records hashes and preserves private source', t => {
  const { site, source, screenshot, run } = fixture(t);
  const result = run(['--screenshot', screenshot]);
  assert.equal(result.status, 0, result.stderr);
  const published = readFileSync(join(site, 'fun', 'lale-manager', 'index.html'), 'utf8');
  assert.match(published, /href="\.\.\/"/);
  assert.match(published, /download[^>]*href="retro-football-manager.zip"/);
  assert.equal((published.match(/data-site-analytics/g) || []).length, 1);
  assert.equal(readFileSync(join(source, 'index.html'), 'utf8'), html);
  assert.deepEqual(readFileSync(join(site, 'fun', 'lale-manager', 'retro-football-manager.zip')), zip);
  assert.deepEqual(readFileSync(join(site, 'assets', 'games', 'lale-manager.png')), png);
  assert.equal(existsSync(join(site, 'fun', 'lale-manager', 'private.ts')), false);
  assert.equal(existsSync(join(site, 'fun', 'lale-manager', '.env')), false);
  const manifest = JSON.parse(readFileSync(join(site, 'fun', 'game-versions.json')));
  assert.deepEqual(manifest.blobs, { commit: 'abc123' });
  assert.equal(manifest['lale-manager'].sourceHtmlSha256, digest(html));
  assert.equal(manifest['lale-manager'].publishedHtmlSha256, digest(published));
  assert.equal(manifest['lale-manager'].zipSha256, digest(zip));
  assert.equal(JSON.stringify(manifest).includes(source), false);
});

test('repeated exports retain one analytics loader and one set of website links', t => {
  const { site, run } = fixture(t);
  for (let i = 0; i < 2; i++) assert.equal(run().status, 0);
  const published = readFileSync(join(site, 'fun', 'lale-manager', 'index.html'), 'utf8');
  assert.equal((published.match(/data-site-analytics/g) || []).length, 1);
  assert.equal((published.match(/data-rfm-site-links/g) || []).length, 1);
});

for (const failure of ['missing ZIP', 'fake ZIP', 'corrupt ZIP', 'stale ZIP', 'unbuilt HTML', 'missing screenshot', 'ambiguous head']) {
  test(`${failure} preserves the previous game and release manifest`, t => {
    const { root, site, source, run } = fixture(t);
    const before = readFileSync(join(site, 'fun', 'game-versions.json'));
    const args = [];
    if (failure === 'missing ZIP') rmSync(join(source, 'retro-football-manager.zip'));
    if (failure === 'fake ZIP') { const fake = Buffer.alloc(22); fake.writeUInt32LE(0x04034b50); writeFileSync(join(source, 'retro-football-manager.zip'), fake); }
    if (failure === 'corrupt ZIP') { const damaged = Buffer.from(zip); damaged[50] ^= 255; writeFileSync(join(source, 'retro-football-manager.zip'), damaged); }
    if (failure === 'stale ZIP') writeFileSync(join(source, 'index.html'), html.replace('play=true', 'play=false'));
    if (failure === 'unbuilt HTML') writeFileSync(join(source, 'index.html'), html.replace('</main>', '<script type="module" src="/src/main.ts"></script></main>'));
    if (failure === 'missing screenshot') args.push('--screenshot', join(root, 'missing.png'));
    if (failure === 'ambiguous head') writeFileSync(join(source, 'index.html'), html.replace('</head>', '</head></head>'));
    const result = run(args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing|required|built|head|ENOENT/i);
    assert.equal(readFileSync(join(site, 'fun', 'lale-manager', 'index.html'), 'utf8'), 'Previous game');
    assert.deepEqual(readFileSync(join(site, 'fun', 'game-versions.json')), before);
  });
}

for (const restorationFails of [false, true]) {
  test(`installation failure ${restorationFails ? 'retains backups when restoration fails' : 'restores the previous release'}`, t => {
    const { root, site, source } = fixture(t);
    const output = join(site, 'fun', 'lale-manager');
    writeFileSync(join(output, 'retro-football-manager.zip'), 'Previous ZIP');
    const manifest = readFileSync(join(site, 'fun', 'game-versions.json'));
    const hook = join(root, 'fault.mjs');
    writeFileSync(hook, `import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module';
      const rename=fs.renameSync, unlink=fs.unlinkSync;
      fs.renameSync=(from,to)=>{if(String(from).endsWith('new-1')) throw new Error('Injected install failure'); return rename(from,to);};
      fs.unlinkSync=path=>{if(${restorationFails} && String(path).endsWith('index.html')) throw new Error('Injected restoration failure'); return unlink(path);};
      syncBuiltinESMExports();`);
    const result = spawnSync(process.execPath, ['--import', pathToFileURL(hook).href, script, '--source', source], { cwd: site, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Injected install failure/);
    assert.deepEqual(readFileSync(join(site, 'fun', 'game-versions.json')), manifest);
    assert.equal(readFileSync(join(output, 'retro-football-manager.zip'), 'utf8'), 'Previous ZIP');
    const recovery = readdirSync(site).filter(name => name.startsWith('.game-export-'));
    if (restorationFails) {
      assert.equal(recovery.length, 1);
      assert.match(result.stderr, /Recovery files retained at/);
      assert.equal(readFileSync(join(site, recovery[0], 'previous-0'), 'utf8'), 'Previous game');
    } else {
      assert.deepEqual(recovery, []);
      assert.equal(readFileSync(join(output, 'index.html'), 'utf8'), 'Previous game');
    }
  });
}

for (const linkedDirectory of ['fun', 'fun/lale-manager', 'assets']) {
  test(`rejects linked ${linkedDirectory} output without writing outside the website`, t => {
    const { root, site, screenshot, run } = fixture(t);
    const outside = join(root, 'private'); mkdirSync(outside);
    writeFileSync(join(outside, 'index.html'), 'Private file');
    const output = join(site, linkedDirectory);
    if (existsSync(output)) rmSync(output, { recursive: true });
    symlinkSync(outside, output, process.platform === 'win32' ? 'junction' : 'dir');
    const result = run(['--screenshot', screenshot]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /real directory|link/i);
    assert.equal(readFileSync(join(outside, 'index.html'), 'utf8'), 'Private file');
    assert.equal(existsSync(join(outside, 'lale-manager.png')), false);
  });
}
