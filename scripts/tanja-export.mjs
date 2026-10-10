import { createHash } from 'node:crypto';
import { posix } from 'node:path';
import { withSiteAnalytics } from './site-analytics.mjs';

const offline = new Map([
  ['assets/reference/concept_full_original.png', 'assets/reference/concept_full_original.png'],
  ['release/PLAYER_README.txt', 'README.txt'],
  ['release/NOTES.txt', 'NOTES.txt'],
]);
function safePath(path) {
  if (typeof path !== 'string' || !path || /[\\:\x00-\x1f<>|?*]/.test(path)
    || path.split('/').some(part => !part || part === '.' || part === '..'
      || /[ .]$/.test(part) || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i.test(part))) {
    throw new Error('Tanja manifest: unsafe path ' + JSON.stringify(path));
  }
  return path;
}
function publicPath(path) {
  return path === 'index.html' || /^src\/(?:css\/[^/]+\.css|js\/[^/]+\.js)$/.test(path)
    || (/^assets\/runtime\/.+\.(?:png|wav)$/.test(path) && !path.split('/').some(part => part.startsWith('.')));
}
function json(read, path) {
  try { return JSON.parse(read(path).toString('utf8')); }
  catch (error) { throw new Error('Tanja manifest ' + path + ': ' + error.message); }
}

function directoryCase(path, prefixes) {
  const parts = path.split('/');
  for (let i = 1; i < parts.length; i++) {
    const prefix = parts.slice(0, i).join('/'), key = prefix.toLowerCase();
    if (prefixes.has(key) && prefixes.get(key) !== prefix) throw new Error('Tanja manifest: case-aliased directory prefix ' + prefix);
    prefixes.set(key, prefix);
  }
}

export function publicTanjaHtml(html) {
  const privacy = '<a href="/privacy.html" class="concept-link">Analytics privacy</a>';
  const publicHtml = html
    .replace('<title>Paratroopers Over Mostar — Tanja</title>', '<title>Girl in Fire — Paratroopers Over Mostar</title>')
    .replace('<h1>Paratroopers <span>Over Mostar</span></h1>', '<h1>Girl <span>in Fire</span></h1>')
    .replace('Tanja · v0.1 round preview', 'Girl in Fire · v0.1 round preview')
    .replace(/<a\b(?=[^>]*\bhref\s*=\s*["']assets\/reference\/concept_full_original\.png["'])[^>]*>[\s\S]*?<\/a\s*>/gi, privacy);
  if (/assets\/reference\//i.test(publicHtml)) throw new Error('Tanja HTML still contains an offline reference dependency.');
  const hosted = withSiteAnalytics(publicHtml);
  const required = [
    ['title', /<title\b/gi, '<title>Girl in Fire — Paratroopers Over Mostar</title>'],
    ['heading', /<h1\b/gi, '<h1>Girl <span>in Fire</span></h1>'],
    ['footer', /Girl in Fire · v0\.1 round preview/g, 'Girl in Fire · v0.1 round preview'],
  ];
  for (const [name, pattern, exact] of required) {
    if ((hosted.match(pattern) || []).length !== 1 || !hosted.includes(exact)) throw new Error('Tanja hosted HTML: missing or ambiguous ' + name + '. Update the website transform for the new source markup.');
  }
  const privacyLinks = hosted.match(/<a\b[^>]*\shref\s*=\s*(?:"\/privacy\.html"|'\/privacy\.html'|\/privacy\.html(?=[\s>]))/gi) || [];
  const loaders = hosted.match(/<script\b[^>]*\ssrc\s*=\s*(?:"\/assets\/analytics\.js"|'\/assets\/analytics\.js'|\/assets\/analytics\.js(?=[\s>]))/gi) || [];
  if (privacyLinks.length !== 1 || loaders.length !== 1) throw new Error('Tanja hosted HTML: require exactly one privacy link and analytics loader.');
  return hosted;
}

function dependencies(files, read) {
  const selected = new Set(files);
  for (const path of files) {
    if (!/\.(html|css|js)$/.test(path)) continue;
    const text = path === 'index.html' ? publicTanjaHtml(read(path).toString('utf8')) : read(path).toString('utf8');
    const urls = [];
    if (path.endsWith('.html')) {
      for (const match of text.matchAll(/\b(?:src|href|poster)\s*=\s*(["'])(.*?)\1/gi)) urls.push(match[2]);
      for (const match of text.matchAll(/\b(?:srcset|imagesrcset)\s*=\s*(["'])(.*?)\1/gi)) {
        if (/(?:^|,)\s*data:/i.test(match[2])) throw new Error('Tanja srcset data URLs are unsupported dependencies.');
        urls.push(...match[2].split(',').filter(candidate => candidate.trim()).map(candidate => candidate.trim().split(/\s+/)[0]));
      }
    } else if (path.endsWith('.css')) {
      const css = text.replace(/\/\*[\s\S]*?\*\//g, '');
      for (const match of css.matchAll(/url\(\s*([^)]*?)\s*\)/gi)) urls.push(match[1].replace(/^["']|["']$/g, ''));
      for (const match of css.matchAll(/@import\s+(["'])(.*?)\1/gi)) urls.push(match[2]);
    } else {
      for (const match of text.matchAll(/(["'])((?:\.{1,2}\/)*assets\/[^"']+)\1/g)) urls.push(match[2]);
      for (const match of text.matchAll(/\.\s*(?:src|href|poster)\s*=\s*(["'])(.*?)\1/g)) urls.push(match[2]);
    }
    for (const url of urls) {
      if (url.startsWith('data:') || url.startsWith('#')) continue;
      if (path === 'index.html' && ['/assets/analytics.js', '/privacy.html'].includes(url)) continue;
      if (/^(?:[a-z][a-z+.-]*:|\/)/i.test(url)) throw new Error('Tanja non-relative dependency in ' + path + ': ' + url);
      const parent = path.endsWith('.js') ? '' : posix.dirname(path);
      const target = safePath(posix.normalize(posix.join(parent, decodeURIComponent(url.split(/[?#]/)[0]))));
      if (!selected.has(target)) throw new Error('Tanja missing dependency in ' + path + ': ' + target);
    }
  }
}

// All metadata and bytes come from the selected source commit, never the working copy.
export function tanjaRelease(read) {
  const value = json(read, 'release/player-files.json');
  if (value.schemaVersion !== 1 || !/^[\w.-]{1,64}$/.test(value.version || '') || !Array.isArray(value.files)) {
    throw new Error('Tanja manifest: unsupported format/version.');
  }
  const files = [], sources = new Set(), paths = new Set(), sourcePrefixes = new Map(), pathPrefixes = new Map();
  for (const entry of value.files) {
    const source = safePath(entry.source), path = safePath(entry.path);
    if (sources.has(source.toLowerCase()) || paths.has(path.toLowerCase())) throw new Error('Tanja manifest: duplicate/case-colliding path.');
    sources.add(source.toLowerCase()); paths.add(path.toLowerCase());
    directoryCase(source, sourcePrefixes); directoryCase(path, pathPrefixes);
    if (offline.has(source) && offline.get(source) === path) continue;
    if (source !== path || !publicPath(path)) throw new Error('Tanja manifest: private, aliased or unsupported runtime path ' + source + ' -> ' + path);
    read(source);
    files.push(path);
  }
  if (!files.includes('index.html')) throw new Error('Tanja manifest: missing runtime index.html.');
  for (const [path, key] of [['assets/asset_manifest.json', 'runtime'], ['assets/audio_manifest.json', 'assets']]) {
    const entries = json(read, path)[key];
    if (!Array.isArray(entries) || !entries.length) throw new Error('Tanja manifest: missing registered runtime assets in ' + path);
    for (const entry of entries) {
      safePath(entry.path);
      if (!files.includes(entry.path)) throw new Error('Tanja registered runtime asset absent from allowlist: ' + entry.path);
      const bytes = read(entry.path), digest = createHash('sha256').update(bytes).digest('hex');
      if (bytes.length !== entry.bytes || digest !== entry.sha256) throw new Error('Tanja registered asset hash/length mismatch: ' + entry.path);
    }
  }
  dependencies(files, read);
  return { files, version: value.version };
}
