import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const script = fileURLToPath(new URL('../scripts/import-games.mjs', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'tanja-export-'));
  t.after(() => {
    const actual = realpathSync(root);
    assert.ok(actual.startsWith(realpathSync(tmpdir()) + sep) && actual.includes('tanja-export-'));
    rmSync(actual, { recursive: true });
  });
  const site = join(root, 'site'), source = join(root, 'source');
  const write = (base, path, bytes) => {
    mkdirSync(join(base, path, '..'), { recursive: true });
    writeFileSync(join(base, path), bytes);
  };
  const runtime = {
    'index.html': '<html><head><title>Paratroopers Over Mostar — Tanja</title><link href="src/css/main.css" rel="stylesheet"><script defer src="src/js/scene.js"></script></head><body><h1>Paratroopers <span>Over Mostar</span></h1><a class="concept-link" href="assets/reference/concept_full_original.png">View original concept</a><span>Tanja · v0.1 round preview</span></body></html>',
    'src/css/main.css': 'body {background:url("../../assets/runtime/scene.png")}',
    'src/js/scene.js': 'const urls = ["assets/runtime/scene.png", "assets/runtime/audio.wav"];',
    'assets/runtime/scene.png': 'committed original art',
    'assets/runtime/audio.wav': 'committed original audio',
  };
  write(site, 'index.html', '<html><head></head></html>');
  for (const [path, bytes] of Object.entries(runtime)) write(source, path, bytes);
  const extra = {
    'assets/reference/concept_full_original.png': 'offline reference',
    'release/PLAYER_README.txt': 'offline instructions',
    'release/NOTES.txt': 'private review notes',
    'docs/private.md': 'DO NOT PUBLISH',
    'assets/source/draft.png': 'DO NOT PUBLISH',
  };
  for (const [path, bytes] of Object.entries(extra)) write(source, path, bytes);
  const record = path => ({ path, bytes: Buffer.byteLength(runtime[path]), sha256: hash(runtime[path]) });
  write(source, 'assets/asset_manifest.json', JSON.stringify({ runtime: [record('assets/runtime/scene.png')], references: [] }));
  write(source, 'assets/audio_manifest.json', JSON.stringify({ assets: [record('assets/runtime/audio.wav')] }));
  const manifest = {
    schemaVersion: 1, version: '0.1-review', archiveName: 'tanja-v0.1-review.zip',
    files: [...Object.keys(runtime), ...Object.keys(extra).slice(0, 3)].map(path => ({
      source: path, path: path === 'release/PLAYER_README.txt' ? 'README.txt' : path === 'release/NOTES.txt' ? 'NOTES.txt' : path,
    })),
  };
  write(source, 'release/player-files.json', JSON.stringify(manifest));
  const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-q'); git('config', 'user.name', 'Export test'); git('config', 'user.email', 'export@example.test'); git('config', 'core.autocrlf', 'false');
  const commit = () => { git('add', '.'); git('commit', '-qm', 'Fixture update'); };
  commit();
  const run = () => spawnSync(process.execPath, [script, '--tanja', source], { cwd: site, encoding: 'utf8' });
  const changeManifest = edit => {
    const value = JSON.parse(readFileSync(join(source, 'release/player-files.json')));
    edit(value); write(source, 'release/player-files.json', JSON.stringify(value));
  };
  const previous = { blobs: { commit: 'a'.repeat(40), importedAt: '2026-01-01' }, tanja: { commit: 'b'.repeat(40), importedAt: '2026-01-02' } };
  const prior = () => {
    write(site, 'fun/girl-in-fire/index.html', 'previous working release');
    write(site, 'fun/blobs/game.js', 'keep this game');
    write(site, 'fun/game-versions.json', JSON.stringify(previous));
  };
  const preserves = result => {
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(join(site, 'fun/girl-in-fire/index.html'), 'utf8'), 'previous working release');
    assert.deepEqual(JSON.parse(readFileSync(join(site, 'fun/game-versions.json'))), previous);
    assert.equal(readdirSync(site).some(path => path.startsWith('.game-export-')), false);
  };
  return { site, source, runtime, write, git, commit, run, changeManifest, prior, preserves, previous };
}
function files(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = prefix + entry.name;
    return entry.isDirectory() ? files(join(directory, entry.name), path + '/') : [path];
  }).sort();
}

test('Tanja exports runtime to the Girl in Fire URL and preserves source and other releases', t => {
  const f = fixture(t); f.prior();
  const result = f.run(); assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(files(join(f.site, 'fun/girl-in-fire')), Object.keys(f.runtime).sort());
  const html = readFileSync(join(f.site, 'fun/girl-in-fire/index.html'), 'utf8');
  assert.equal((html.match(/src="\/assets\/analytics\.js"/g) || []).length, 1);
  assert.match(html, /href="\/privacy\.html"/);
  assert.match(html, /<title>Girl in Fire — Paratroopers Over Mostar<\/title>/);
  assert.match(html, /<h1>Girl <span>in Fire<\/span><\/h1>/);
  assert.match(html, /Girl in Fire · v0\.1 round preview/);
  assert.doesNotMatch(html, /View original concept|assets\/reference/);
  for (const [path, bytes] of Object.entries(f.runtime)) {
    assert.equal(readFileSync(join(f.source, path), 'utf8'), bytes);
    if (path !== 'index.html') assert.equal(readFileSync(join(f.site, 'fun/girl-in-fire', path), 'utf8'), bytes);
  }
  assert.equal(f.git('status', '--porcelain'), '');
  assert.equal(readFileSync(join(f.site, 'fun/blobs/game.js'), 'utf8'), 'keep this game');
  const versions = JSON.parse(readFileSync(join(f.site, 'fun/game-versions.json')));
  assert.deepEqual(versions.blobs, f.previous.blobs);
  assert.equal(versions.tanja.commit, f.git('rev-parse', 'HEAD'));
  assert.equal(versions.tanja.version, '0.1-review');
  assert.equal(versions.tanja.path, 'fun/girl-in-fire/');
  assert.equal(existsSync(join(f.site, 'fun/tanja')), false);
  assert.equal(JSON.stringify(versions).includes(f.source), false);
});

test('Tanja reimport removes stale exports without duplicating analytics', t => {
  const f = fixture(t); assert.equal(f.run().status, 0);
  f.write(f.site, 'fun/girl-in-fire/assets/reference/leaked.png', 'stale private file');
  assert.equal(f.run().status, 0);
  assert.equal(existsSync(join(f.site, 'fun/girl-in-fire/assets/reference')), false);
  assert.equal((readFileSync(join(f.site, 'fun/girl-in-fire/index.html'), 'utf8').match(/data-site-analytics/g) || []).length, 1);
});

test('Tanja uses committed manifest and runtime bytes when Git hides local changes', t => {
  const f = fixture(t);
  f.git('update-index', '--assume-unchanged', 'release/player-files.json', 'src/js/scene.js');
  f.write(f.source, 'release/player-files.json', 'invalid private working manifest');
  f.write(f.source, 'src/js/scene.js', 'private local script');
  assert.equal(f.run().status, 0);
  assert.equal(readFileSync(join(f.site, 'fun/girl-in-fire/src/js/scene.js'), 'utf8'), f.runtime['src/js/scene.js']);
});

test('Tanja dirty checkout is refused without replacing the last release', t => {
  const f = fixture(t); f.prior(); f.write(f.source, 'src/js/scene.js', 'uncommitted script');
  const result = f.run(); f.preserves(result); assert.match(result.stderr, /clean|uncommitted/i);
});

test('Tanja missing registered audio is refused before replacing a release', t => {
  const f = fixture(t); f.prior();
  f.changeManifest(value => { value.files = value.files.filter(item => !item.path.endsWith('audio.wav')); }); f.commit();
  const result = f.run(); f.preserves(result); assert.match(result.stderr, /audio|runtime|allowlist/i);
});

test('Tanja altered registered asset is refused before replacing a release', t => {
  const f = fixture(t); f.prior(); f.write(f.source, 'assets/runtime/scene.png', 'corrupted export'); f.commit();
  const result = f.run(); f.preserves(result); assert.match(result.stderr, /registered|hash|asset/i);
});

test('Tanja unsupported manifests fail without publishing private files', async t => {
  const cases = [
    value => { value.schemaVersion = 999; },
    value => { value.files.push({ source: '../outside.png', path: 'assets/runtime/outside.png' }); },
    value => { value.files.push({ source: 'docs/private.md', path: 'src/js/private.js' }); },
    value => { value.files.push({ source: 'docs/private.md', path: 'docs/private.md' }); },
    value => { value.files.push({ source: 'assets/runtime/scene.png', path: 'assets/runtime/SCENE.png' }); },
    value => { value.files.push({ source: 'index.html', path: 'index.html' }); },
    value => { value.files.push({ source: 'assets/runtime/CON.png', path: 'assets/runtime/CON.png' }); },
  ];
  for (const [index, edit] of cases.entries()) await t.test('manifest case ' + index, sub => {
    const f = fixture(sub); f.prior(); f.changeManifest(edit); f.commit();
    const result = f.run(); f.preserves(result); assert.match(result.stderr, /manifest|unsafe|duplicate|alias|runtime|allowlist/i);
  });
});

test('Tanja missing literal HTML/CSS/JS dependency is refused before output', async t => {
  const cases = [
    ['index.html', html => html.replace('</head>', '<script src="src/js/missing.js"></script></head>')],
    ['src/css/main.css', '@import "missing.css";'],
    ['src/js/scene.js', 'new Image().src = "assets/missing.png";'],
    ['index.html', html => html.replace('</body>', '<img srcset="missing.png 1x, missing2.png 2x"></body>')],
  ];
  for (const [index, [path, bytes]] of cases.entries()) await t.test('dependency case ' + index, sub => {
    const f = fixture(sub); f.prior(); f.write(f.source, path, typeof bytes === 'function' ? bytes(f.runtime[path]) : bytes); f.commit();
    const result = f.run(); f.preserves(result); assert.match(result.stderr, /missing|dependency/i);
  });
});

test('Tanja case-aliased directories preserve the previous export and versions', t => {
  const f = fixture(t); f.prior();
  const paths = ['assets/runtime/A/foo.png', 'assets/runtime/a/bar.png'];
  for (const path of paths) {
    f.write(f.source, path, 'case fixture ' + path);
    const object = f.git('hash-object', '-w', path);
    f.git('update-index', '--add', '--cacheinfo', '100644', object, path);
  }
  f.changeManifest(value => { for (const path of paths) value.files.push({ source: path, path }); });
  f.git('add', 'release/player-files.json'); f.git('commit', '-qm', 'Case-aliased Git directories');
  assert.equal(f.git('status', '--porcelain'), '', 'Fixture must reach runtime validation from clean committed files');
  const result = f.run(); f.preserves(result); assert.match(result.stderr, /directory|prefix|case/i);
});

test('Tanja missing or ambiguous hosted HTML requirements preserve the prior release', async t => {
  const anchor = /<a class="concept-link"[^>]*>.*?<\/a>/;
  const cases = [
    ['missing concept anchor', html => html.replace(anchor, '')],
    ['changed concept anchor', html => html.replace('href="assets/reference/concept_full_original.png"', 'href="#concept"')],
    ['unmarked analytics loader', html => html.replace('</head>', '<script defer src="/assets/analytics.js"></script></head>')],
    ['duplicate concept anchor', html => html.replace('</body>', html.match(anchor)[0] + '</body>')],
    ['changed page title', html => html.replace('Paratroopers Over Mostar — Tanja', 'New source title')],
    ['changed game heading', html => html.replace('Paratroopers <span>Over Mostar</span>', 'New source heading')],
    ['changed version footer', html => html.replace('Tanja · v0.1 round preview', 'New source footer')],
    ['duplicate title', html => html.replace('</head>', '<title>Another title</title></head>')],
  ];
  for (const [name, edit] of cases) await t.test(name, sub => {
    const f = fixture(sub); f.prior(); f.write(f.source, 'index.html', edit(f.runtime['index.html'])); f.commit();
    const result = f.run(); f.preserves(result); assert.match(result.stderr, /hosted|privacy|analytics|title|heading|footer/i);
  });
});

test('Tanja missing tracked runtime and malformed HTML preserve a previous export', async t => {
  await t.test('runtime removed from commit', sub => {
    const f = fixture(sub); f.prior();
    f.git('rm', '-q', 'src/js/scene.js'); f.git('commit', '-qm', 'Remove runtime');
    const result = f.run(); f.preserves(result); assert.match(result.stderr, /missing|commit|runtime/i);
  });
  await t.test('invalid HTML head', sub => {
    const f = fixture(sub); f.prior(); f.write(f.source, 'index.html', '<html><body>No head</body></html>'); f.commit();
    const result = f.run(); f.preserves(result); assert.match(result.stderr, /head/i);
  });
});
