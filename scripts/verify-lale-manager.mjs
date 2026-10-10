import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assertOfflineArchive } from './lale-manager-zip.mjs';

const usage = 'Usage: npm run verify:lale-manager [-- --url https://dejans11.github.io/fun/lale-manager/]\nChecks local release files first; --url also checks the published files. Read-only: never commits or pushes.';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const requireCheck = (condition, message) => { if (!condition) throw new Error(message); };
const keys = ['sourceHtmlSha256', 'publishedHtmlSha256', 'zipSha256', 'screenshotSha256'];

function read(path) {
  requireCheck(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(), `Required regular file: ${path}`);
  return readFileSync(path);
}

function navigation(home, gallery) {
  requireCheck(/href=["'](?:\.\/)?fun\/lale-manager\/["']/.test(home), 'Homepage is missing the game shortcut.');
  requireCheck(/href=["']lale-manager\/["']/.test(gallery) && /href=["']lale-manager\/retro-football-manager\.zip["']/.test(gallery) && /src=["']\.\.\/assets\/games\/lale-manager\.png["']/.test(gallery), 'Gallery is missing the game, ZIP or screenshot.');
}

function release(html, zip, screenshot, record, label) {
  for (const key of keys) requireCheck(/^[a-f0-9]{64}$/.test(record?.[key]), `Missing release hash: ${key}`);
  for (const [name, bytes, key] of [['HTML', html, 'publishedHtmlSha256'], ['ZIP', zip, 'zipSha256'], ['screenshot', screenshot, 'screenshotSha256']]) {
    requireCheck(hash(bytes) === record[key], `${label} ${name} hash differs from the prepared release.`);
  }
  const offline = assertOfflineArchive(zip);
  requireCheck(hash(offline) === record.sourceHtmlSha256, 'Offline source HTML hash differs from the recorded build.');
  requireCheck(!offline.includes('data-site-analytics'), 'Offline ZIP unexpectedly contains website analytics.');
  requireCheck(screenshot.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), 'Screenshot is not a PNG.');
  const page = html.toString('utf8');
  requireCheck((page.match(/<script\b[^>]*\bdata-site-analytics(?=[\s=>])/g) || []).length === 1, 'Website HTML must have one analytics loader.');
  requireCheck((page.match(/<nav\b[^>]*\bdata-rfm-site-links(?=[\s=>])/g) || []).length === 1 && /href=["']\.\.\/["']/.test(page) && /href=["']retro-football-manager\.zip["']/.test(page) && /href=["']\/privacy\.html["']/.test(page), 'Website navigation is incomplete.');
}

async function main(args) {
  if (args.length === 1 && args[0] === '--help') { console.log(usage); return; }
  requireCheck(args.length === 0 || (args.length === 2 && args[0] === '--url'), usage);
  let url;
  if (args.length) {
    url = new URL(args[1]);
    requireCheck(['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/fun/lale-manager/', 'Use the complete HTTP(S) game URL ending in /fun/lale-manager/.');
  }
  const site = process.cwd(), folder = join(site, 'fun', 'lale-manager');
  read(join(site, '.nojekyll'));
  requireCheck(JSON.stringify(readdirSync(folder).sort()) === JSON.stringify(['index.html', 'retro-football-manager.zip']), 'Unexpected files in game release; exclude source files and career saves.');
  const record = JSON.parse(read(join(site, 'fun', 'game-versions.json')))['lale-manager'];
  release(read(join(folder, 'index.html')), read(join(folder, 'retro-football-manager.zip')), read(join(site, 'assets', 'games', 'lale-manager.png')), record, 'Local');
  navigation(read(join(site, 'index.html')).toString(), read(join(site, 'fun', 'index.html')).toString());
  console.log(`Verified local Retro Football Manager: HTML, offline ZIP, screenshot, hashes and navigation (${record.publishedHtmlSha256.slice(0, 12)}).`);
  if (!url) return;
  const paths = [url.pathname, url.pathname + 'retro-football-manager.zip', '/assets/games/lale-manager.png', '/fun/game-versions.json', '/', '/fun/'];
  const files = await Promise.all(paths.map(async path => {
    const address = new URL(path, url);
    const response = await fetch(address, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
    requireCheck(response.ok, `HTTP ${response.status}: ${address}`);
    return Buffer.from(await response.arrayBuffer());
  }));
  const publishedRecord = JSON.parse(files[3].toString())['lale-manager'];
  for (const key of keys) requireCheck(publishedRecord?.[key] === record[key], `Published manifest ${key} does not match the prepared release.`);
  release(files[0], files[1], files[2], record, 'Published');
  navigation(files[4].toString(), files[5].toString());
  console.log(`Verified published Retro Football Manager at ${url}: all six HTTP routes match the prepared release. No commits or pushes.`);
}

try { await main(process.argv.slice(2)); }
catch (error) { console.error(error.message); process.exitCode = 1; }
