import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { withSiteAnalytics } from './site-analytics.mjs';
import { assertOfflineArchive } from './lale-manager-zip.mjs';

const usage = 'Usage: node scripts/import-lale-manager.mjs --source <built-dist-folder> [--screenshot <PNG>]\nRun from the website repository root. This exports files locally; it never commits or pushes.';
const hash = data => createHash('sha256').update(data).digest('hex');

function inside(parent, child) {
  const path = relative(parent, child);
  if (!path || path === '..' || path.startsWith('..' + sep) || isAbsolute(path)) throw new Error('Output must stay inside the website directory.');
}

function directory(path) {
  if (existsSync(path) && (lstatSync(path).isSymbolicLink() || !lstatSync(path).isDirectory())) throw new Error('Output must be a real directory, not a link.');
}

function regularFile(path) {
  if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error(`Missing required regular file: ${path}`);
  return readFileSync(path);
}

function websiteHtml(source) {
  if (/<script\b[^>]*(?:type\s*=\s*["']module|src\s*=\s*["']\/src\/)/i.test(source) || !/<canvas\b[^>]*id=["']game["']/i.test(source)) throw new Error('Use the built dist/index.html, not development HTML. Run npm run build in the game folder.');
  if ((source.match(/<\/main\s*>/gi) || []).length !== 1) throw new Error('Game HTML must contain exactly one closing main tag.');
  const style = '<style data-rfm-site-style>.rfm-site-links{display:flex;flex-wrap:wrap;gap:8px;margin:16px 8px}.rfm-site-links a{font:10px "Courier New",monospace;padding:9px 12px;border:1px solid #54664b;color:#d3e7be;background:#192a20;text-decoration:none}.rfm-site-links a:hover,.rfm-site-links a:focus-visible{border-color:#bdd5a6;color:#fff}</style>';
  const links = '<nav class="rfm-site-links" data-rfm-site-links aria-label="Website links"><a href="../">ALL GAMES</a><a download href="retro-football-manager.zip">DOWNLOAD OFFLINE ZIP</a><a href="/privacy.html">ANALYTICS PRIVACY</a></nav>';
  return withSiteAnalytics(source.replace(/<title>Retro Football Manager<\/title>/i, '<title>Footsi</title>').replace(/<h1>Retro Football Manager<\/h1>/i, '<h1>Footsi</h1>').replace(' OFFLINE EDITION</span>', ' WEB EDITION</span>').replace(/<\/head\s*>/i, () => `${style}\n</head>`).replace(/<\/main\s*>/i, () => `${links}\n</main>`));
}

function main(args) {
  if (args.length === 1 && args[0] === '--help') { console.log(usage); return; }
  const options = new Map();
  for (let i = 0; i < args.length; i += 2) {
    if (!['--source', '--screenshot'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options.has(args[i])) throw new Error(usage);
    options.set(args[i], args[i + 1]);
  }
  if (!options.has('--source')) throw new Error(usage);
  const site = realpathSync(process.cwd()), source = realpathSync(resolve(options.get('--source')));
  regularFile(join(site, '.nojekyll'));
  const fun = join(site, 'fun'), destination = join(fun, 'lale-manager');
  directory(fun); directory(destination); regularFile(join(fun, 'index.html'));
  const sourceOffset = relative(destination, source);
  if (!sourceOffset || (!sourceOffset.startsWith('..' + sep) && sourceOffset !== '..' && !isAbsolute(sourceOffset))) throw new Error('Source must be separate from the website output.');
  const html = regularFile(join(source, 'index.html'));
  const zip = regularFile(join(source, 'retro-football-manager.zip'));
  const published = Buffer.from(websiteHtml(html.toString('utf8')));
  assertOfflineArchive(zip, html);
  const manifest = join(fun, 'game-versions.json');
  const versions = existsSync(manifest) ? JSON.parse(regularFile(manifest).toString('utf8')) : {};
  if (!versions || typeof versions !== 'object' || Array.isArray(versions)) throw new Error('Invalid game release manifest.');
  const files = [
    { path: join(destination, 'index.html'), data: published },
    { path: join(destination, 'retro-football-manager.zip'), data: zip },
  ];
  versions['lale-manager'] = { sourceHtmlSha256: hash(html), publishedHtmlSha256: hash(published), zipSha256: hash(zip), files: ['index.html', 'retro-football-manager.zip'], importedAt: new Date().toISOString() };
  if (options.has('--screenshot')) {
    directory(join(site, 'assets')); directory(join(site, 'assets', 'games'));
    const screenshot = regularFile(resolve(options.get('--screenshot')));
    if (!screenshot.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) throw new Error('Screenshot must be a PNG file.');
    files.push({ path: join(site, 'assets', 'games', 'lale-manager.png'), data: screenshot });
    versions['lale-manager'].screenshotSha256 = hash(screenshot);
  } else if (versions['lale-manager'] && existsSync(join(site, 'assets', 'games', 'lale-manager.png'))) {
    directory(join(site, 'assets')); directory(join(site, 'assets', 'games'));
    versions['lale-manager'].screenshotSha256 = hash(regularFile(join(site, 'assets', 'games', 'lale-manager.png')));
  }
  files.push({ path: manifest, data: Buffer.from(JSON.stringify(versions, null, 2) + '\n') });
  for (const file of files) {
    inside(site, file.path);
    if (existsSync(file.path)) regularFile(file.path);
  }
  // Stage all validated bytes, then install with rollback to preserve the previous release.
  const staging = mkdtempSync(join(site, '.game-export-')), replaced = [];
  let keepRecovery = false;
  inside(site, staging);
  try {
    files.forEach((file, i) => writeFileSync(join(staging, `new-${i}`), file.data));
    files.forEach((file, i) => {
      mkdirSync(dirname(file.path), { recursive: true });
      const backup = join(staging, `previous-${i}`), hadPrevious = existsSync(file.path);
      if (hadPrevious) renameSync(file.path, backup);
      replaced.push({ path: file.path, backup, hadPrevious });
      renameSync(join(staging, `new-${i}`), file.path);
    });
  } catch (error) {
    const failures = [];
    for (const file of replaced.reverse()) {
      try {
        if (existsSync(file.path)) unlinkSync(file.path);
        if (file.hadPrevious) renameSync(file.backup, file.path);
      } catch (restoreError) { failures.push(restoreError.message); }
    }
    if (failures.length) {
      keepRecovery = true;
      throw new Error(`${error.message}. Restoration incomplete: ${failures.join('; ')}. Recovery files retained at ${staging}`);
    }
    throw error;
  } finally { if (!keepRecovery) { inside(site, staging); rmSync(staging, { recursive: true }); } }
  console.log(`Exported lale-manager: built HTML and offline ZIP; source SHA-256 ${hash(html).slice(0, 12)}. No commits or pushes.`);
}

try { main(process.argv.slice(2)); }
catch (error) { console.error(error.message); process.exitCode = 1; }
