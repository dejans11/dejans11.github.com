import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const script = fileURLToPath(new URL('../scripts/import-games.mjs', import.meta.url));

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'pages-game-test-'));
  t.after(() => {
    assert.equal(relative(tmpdir(), root).startsWith('pages-game-test-'), true);
    rmSync(root, { recursive: true, force: true });
  });
  const site = join(root, 'site');
  mkdirSync(site);
  writeFileSync(join(site, 'index.html'), '<h1>Personal homepage</h1>');
  const sources = {};
  for (const slug of ['blobs', 'warblade']) {
    const source = join(root, slug);
    sources[slug] = source;
    mkdirSync(source);
    writeFileSync(join(source, 'index.html'), '<!doctype html><html><head><title>Game</title></head><body><script src="game.js"></script></body></html>');
    writeFileSync(join(source, 'game.js'), `console.log('${slug}');`);
    writeFileSync(join(source, 'style.css'), 'body { margin: 0; }');
    writeFileSync(join(source, 'README.md'), 'Private development notes');
    writeFileSync(join(source, '.env'), 'DO_NOT_PUBLISH=test');
    mkdirSync(join(source, 'tests'));
    writeFileSync(join(source, 'tests', 'private.test.js'), 'Private test code');
    if (slug === 'blobs') writeFileSync(join(source, 'solver.js'), 'function solve() {}');
    if (slug === 'warblade') {
      mkdirSync(join(source, 'assets'));
      writeFileSync(join(source, 'assets', 'ship.png'), 'Runtime image');
      writeFileSync(join(source, 'assets', 'design.blend'), 'Private artwork source');
      writeFileSync(join(source, 'assets', '.env'), 'DO_NOT_PUBLISH=test');
    }
    execFileSync('git', ['init', '-q', source]);
    execFileSync('git', ['-C', source, 'config', 'user.name', 'Export test']);
    execFileSync('git', ['-C', source, 'config', 'user.email', 'export@example.test']);
    execFileSync('git', ['-C', source, 'config', 'core.autocrlf', 'false']);
    execFileSync('git', ['-C', source, 'add', '.']);
    execFileSync('git', ['-C', source, 'commit', '-qm', 'Test runtime files']);
  }
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: site, encoding: 'utf8' });
  return { root, site, sources, run };
}

function files(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + entry.name;
    return entry.isDirectory() ? files(join(directory, entry.name), name + '/') : [name];
  }).sort();
}

test('exports the playable files while excluding private development files', t => {
  const { site, sources, run } = fixture(t);
  const result = run('--blobs', sources.blobs, '--warblade', sources.warblade);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(files(join(site, 'fun', 'blobs')), ['game.js', 'index.html', 'solver.js', 'style.css']);
  assert.deepEqual(files(join(site, 'fun', 'warblade')), ['assets/ship.png', 'game.js', 'index.html', 'style.css']);
  assert.equal(readFileSync(join(site, 'fun', 'blobs', 'game.js'), 'utf8'), "console.log('blobs');");
  const versions = JSON.parse(readFileSync(join(site, 'fun', 'game-versions.json'), 'utf8'));
  const expectedCommit = execFileSync('git', ['-C', sources.blobs, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  assert.equal(versions.blobs.commit, expectedCommit);
  assert.equal(JSON.stringify(versions).includes(sources.blobs), false);
});

test('game exports add site analytics without changing the source or runtime scripts', t => {
  const { site, sources, run } = fixture(t);
  const original = readFileSync(join(sources.blobs, 'index.html'), 'utf8');
  for (let update = 0; update < 2; update++) {
    const result = run('--blobs', sources.blobs, '--warblade', sources.warblade);
    assert.equal(result.status, 0, result.stderr);
    for (const slug of ['blobs', 'warblade']) {
      const html = readFileSync(join(site, 'fun', slug, 'index.html'), 'utf8');
      assert.equal((html.match(/src="\/assets\/analytics\.js"/g) || []).length, 1);
      assert.match(html, /<head>[\s\S]*<script[^>]*src="\/assets\/analytics\.js"[^>]*><\/script>[\s\S]*<\/head>/);
      assert.equal(readFileSync(join(site, 'fun', slug, 'game.js'), 'utf8'), `console.log('${slug}');`);
    }
  }
  assert.equal(readFileSync(join(sources.blobs, 'index.html'), 'utf8'), original);
});

test('an invalid HTML head leaves the previous published game intact', t => {
  const { site, sources, run } = fixture(t);
  mkdirSync(join(site, 'fun', 'blobs'), { recursive: true });
  writeFileSync(join(site, 'fun', 'blobs', 'index.html'), 'Previous release');
  writeFileSync(join(sources.blobs, 'index.html'), '<html><body>Missing head</body></html>');
  execFileSync('git', ['-C', sources.blobs, 'add', 'index.html']);
  execFileSync('git', ['-C', sources.blobs, 'commit', '-qm', 'Invalid HTML']);
  const result = run('--blobs', sources.blobs);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /head/i);
  assert.equal(readFileSync(join(site, 'fun', 'blobs', 'index.html'), 'utf8'), 'Previous release');
});

test('validates both sources before replacing an existing working export', t => {
  const { site, sources, run } = fixture(t);
  mkdirSync(join(site, 'fun', 'blobs'), { recursive: true });
  writeFileSync(join(site, 'fun', 'blobs', 'game.js'), 'Previous working release');
  rmSync(join(sources.warblade, 'style.css'));
  execFileSync('git', ['-C', sources.warblade, 'add', '-u']);
  execFileSync('git', ['-C', sources.warblade, 'commit', '-qm', 'Remove required file']);
  const result = run('--blobs', sources.blobs, '--warblade', sources.warblade);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing|required/i);
  assert.equal(readFileSync(join(site, 'fun', 'blobs', 'game.js'), 'utf8'), 'Previous working release');
  assert.equal(existsSync(join(site, 'fun', 'warblade')), false);
});

test('updating one game preserves the other game and its version record', t => {
  const { site, sources, run } = fixture(t);
  mkdirSync(join(site, 'fun', 'warblade'), { recursive: true });
  writeFileSync(join(site, 'fun', 'warblade', 'game.js'), 'Keep this release');
  const previous = { warblade: { commit: 'a'.repeat(40), importedAt: '2026-01-01T00:00:00.000Z' } };
  writeFileSync(join(site, 'fun', 'game-versions.json'), JSON.stringify(previous));
  const result = run('--blobs', sources.blobs);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(site, 'fun', 'warblade', 'game.js'), 'utf8'), 'Keep this release');
  const versions = JSON.parse(readFileSync(join(site, 'fun', 'game-versions.json'), 'utf8'));
  assert.deepEqual(versions.warblade, previous.warblade);
});

test('refuses to publish uncommitted game changes', t => {
  const { site, sources, run } = fixture(t);
  writeFileSync(join(sources.blobs, 'game.js'), 'Uncommitted experiment');
  const result = run('--blobs', sources.blobs);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /uncommitted|clean/i);
  assert.equal(existsSync(join(site, 'fun', 'blobs')), false);
});

test('refuses ignored runtime assets before replacing an existing release', t => {
  const { site, sources, run } = fixture(t);
  mkdirSync(join(site, 'fun', 'warblade'), { recursive: true });
  writeFileSync(join(site, 'fun', 'warblade', 'game.js'), 'Previous working release');
  writeFileSync(join(sources.warblade, '.gitignore'), 'assets/private-preview.png\n');
  execFileSync('git', ['-C', sources.warblade, 'add', '.gitignore']);
  execFileSync('git', ['-C', sources.warblade, 'commit', '-qm', 'Ignore private preview']);
  writeFileSync(join(sources.warblade, 'assets', 'private-preview.png'), 'Private preview');
  const result = run('--warblade', sources.warblade);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not.*source commit|not.*HEAD/i);
  assert.equal(readFileSync(join(site, 'fun', 'warblade', 'game.js'), 'utf8'), 'Previous working release');
  assert.equal(existsSync(join(site, 'fun', 'warblade', 'assets', 'private-preview.png')), false);
});

test('refuses required runtime files that are absent from the source commit', t => {
  const { site, sources, run } = fixture(t);
  execFileSync('git', ['-C', sources.blobs, 'rm', '--cached', '-q', 'game.js']);
  writeFileSync(join(sources.blobs, '.gitignore'), 'game.js\n');
  execFileSync('git', ['-C', sources.blobs, 'add', '.gitignore']);
  execFileSync('git', ['-C', sources.blobs, 'commit', '-qm', 'Untrack runtime file']);
  const result = run('--blobs', sources.blobs);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not.*source commit|not.*HEAD/i);
  assert.equal(existsSync(join(site, 'fun', 'blobs')), false);
});

test('exports committed bytes even when Git hides a working copy change', t => {
  const { site, sources, run } = fixture(t);
  execFileSync('git', ['-C', sources.blobs, 'update-index', '--assume-unchanged', 'game.js']);
  writeFileSync(join(sources.blobs, 'game.js'), 'Private local experiment');
  const result = run('--blobs', sources.blobs);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(site, 'fun', 'blobs', 'game.js'), 'utf8'), "console.log('blobs');");
});

test('includes committed assets that are absent from a sparse working copy', t => {
  const { site, sources, run } = fixture(t);
  execFileSync('git', ['-C', sources.warblade, 'update-index', '--skip-worktree', 'assets/ship.png']);
  rmSync(join(sources.warblade, 'assets', 'ship.png'));
  const result = run('--warblade', sources.warblade);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(site, 'fun', 'warblade', 'assets', 'ship.png')), true);
  assert.equal(readFileSync(join(site, 'fun', 'warblade', 'assets', 'ship.png'), 'utf8'), 'Runtime image');
});

test('rejects unknown options without creating a public export', t => {
  const { site, run } = fixture(t);
  const result = run('--other-game', resolve('unused'));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown|usage/i);
  assert.equal(existsSync(join(site, 'fun')), false);
});
