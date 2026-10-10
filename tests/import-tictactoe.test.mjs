import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const script = fileURLToPath(new URL('../scripts/import-tictactoe.ps1', import.meta.url));
const shell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
const hasPowerShell = spawnSync(shell, ['-NoProfile', '-Command', 'exit 0']).status === 0;

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'pages-tictactoe-test-'));
  t.after(() => {
    assert.equal(relative(tmpdir(), root).startsWith('pages-tictactoe-test-'), true);
    rmSync(root, { recursive: true, force: true });
  });
  const site = join(root, 'site');
  const source = join(root, 'source');
  mkdirSync(join(site, 'fun', 'tictactoe'), { recursive: true });
  mkdirSync(source);
  writeFileSync(join(site, '.nojekyll'), '');
  writeFileSync(join(site, 'fun', 'index.html'), '<h1>Games</h1>');
  writeFileSync(join(site, 'fun', 'tictactoe', 'index.html'), 'Previous release');
  writeFileSync(join(source, 'index.html'), '<!doctype html><html><head><title>TicTacToe</title></head><body>Play</body></html>');
  for (const file of ['main.js', 'style.css', 'favicon.svg']) writeFileSync(join(source, file), `Runtime ${file}`);
  writeFileSync(join(source, '.env'), 'Private development file');
  const run = () => spawnSync(shell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-SourcePath', source, '-SitePath', site], { encoding: 'utf8' });
  return { root, site, source, run };
}

test('TicTacToe exports keep analytics across updates without Node or source edits', { skip: !hasPowerShell }, t => {
  const { site, source, run } = fixture(t);
  const original = readFileSync(join(source, 'index.html'), 'utf8');
  for (let update = 0; update < 2; update++) {
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const html = readFileSync(join(site, 'fun', 'tictactoe', 'index.html'), 'utf8');
    assert.equal((html.match(/src="\/assets\/analytics\.js"/g) || []).length, 1);
    assert.match(html, /<head>[\s\S]*src="\/assets\/analytics\.js"[\s\S]*<\/head>/);
    assert.equal(html.charCodeAt(0), '<'.charCodeAt(0), 'HTML must not gain a UTF-8 BOM');
    assert.equal(readFileSync(join(site, 'fun', 'tictactoe', 'main.js'), 'utf8'), 'Runtime main.js');
  }
  assert.equal(readFileSync(join(source, 'index.html'), 'utf8'), original);
});

test('missing TicTacToe runtime files preserve the previous release', { skip: !hasPowerShell }, t => {
  const { site, source, run } = fixture(t);
  rmSync(join(source, 'style.css'));
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing game file/i);
  assert.equal(readFileSync(join(site, 'fun', 'tictactoe', 'index.html'), 'utf8'), 'Previous release');
});

for (const linkedDirectory of ['fun', 'fun/tictactoe']) {
  test(`TicTacToe rejects a linked ${linkedDirectory} output before overwriting private files`, { skip: !hasPowerShell }, t => {
    const { root, site, run } = fixture(t);
    const linked = join(root, 'private-folder');
    const privateGame = linkedDirectory === 'fun' ? join(linked, 'tictactoe') : linked;
    mkdirSync(privateGame, { recursive: true });
    writeFileSync(join(linked, 'index.html'), 'Private catalogue');
    writeFileSync(join(privateGame, 'index.html'), 'Private game');
    writeFileSync(join(privateGame, 'main.js'), 'Private game code');
    const output = join(site, linkedDirectory);
    assert.equal(relative(root, output).startsWith('site'), true);
    rmSync(output, { recursive: true });
    symlinkSync(linked, output, 'junction');
    const result = run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /real directory|link|junction|reparse/i);
    assert.equal(readFileSync(join(privateGame, 'index.html'), 'utf8'), 'Private game');
    assert.equal(readFileSync(join(privateGame, 'main.js'), 'utf8'), 'Private game code');
  });
}
