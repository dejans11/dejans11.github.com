import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const loader = fileURLToPath(new URL('../assets/analytics.js', import.meta.url));

// The external network boundary is replaced; the actual loader executes unchanged.
function load(hostname, doNotTrack = null, repeats = 1) {
  const scripts = [];
  const context = {
    window: { location: { hostname } },
    navigator: { doNotTrack },
    document: {
      getElementById: id => scripts.find(script => script.id === id),
      createElement: () => ({ attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }),
      head: { appendChild: script => scripts.push(script) },
    },
  };
  const code = existsSync(loader) ? readFileSync(loader, 'utf8') : '';
  for (let iteration = 0; iteration < repeats; iteration++) runInNewContext(code, context);
  return scripts;
}

test('production initializes one deferred tracker even if the loader runs twice', () => {
  const scripts = load('dejans11.github.io', null, 2);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://cloud.umami.is/script.js');
  assert.equal(scripts[0].defer, true);
  assert.equal(scripts[0].attributes['data-website-id'], 'bd7ebc04-50fb-411f-a235-319790223f5d');
  assert.equal(scripts[0].attributes['data-exclude-search'], 'true');
  assert.equal(scripts[0].attributes['data-exclude-hash'], 'true');
  assert.equal(scripts[0].attributes['data-do-not-track'], 'true');
});

test('local previews and other hosts never load the external tracker', () => {
  for (const hostname of ['localhost', '127.0.0.1', '', 'preview.example.com', 'dejans11.github.io.example.com']) {
    assert.deepEqual(load(hostname), [], hostname);
  }
});

test('Do Not Track prevents loading the tracker on production', () => {
  assert.deepEqual(load('dejans11.github.io', '1'), []);
  assert.equal(load('dejans11.github.io', '0').length, 1);
});
