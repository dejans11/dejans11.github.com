import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { withSiteAnalytics } from './site-analytics.mjs';

const games = {
  blobs: { files: ['index.html', 'style.css', 'game.js', 'solver.js'], assets: false },
  warblade: { files: ['index.html', 'style.css', 'game.js'], assets: true },
};
const assetExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif', '.ico', '.mp3', '.ogg', '.wav', '.woff', '.woff2', '.ttf']);
const excludedDirectories = new Set(['source', 'blender', 'tools', 'tests', 'docs', 'plans', 'node_modules']);
const usage = 'Usage: node scripts/import-games.mjs --blobs <clean-checkout> [--warblade <clean-checkout>]\nYou can supply either game or both. Run from the profile repository root.';

function inside(parent, child) {
  const path = relative(resolve(parent), resolve(child));
  if (!path || path === '..' || path.startsWith('..' + sep) || isAbsolute(path)) {
    throw new Error('Refusing to write outside the selected output directory.');
  }
}

function supportedAsset(file) {
  const parts = file.split('/');
  return parts[0] === 'assets' && parts.length > 1
    && parts.every(part => !part.startsWith('.'))
    && parts.slice(1, -1).every(part => !excludedDirectories.has(part))
    && assetExtensions.has(extname(file).toLowerCase());
}

function runtimeAssets(source, subdirectory = 'assets') {
  const directory = join(source, subdirectory);
  if (!existsSync(directory)) return [];
  if (lstatSync(directory).isSymbolicLink()) throw new Error('Runtime assets must not contain symbolic links.');
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || excludedDirectories.has(entry.name)) return [];
    if (entry.isSymbolicLink()) throw new Error('Runtime assets must not contain symbolic links.');
    const path = join(subdirectory, entry.name);
    if (entry.isDirectory()) return runtimeAssets(source, path);
    return entry.isFile() && assetExtensions.has(extname(entry.name).toLowerCase()) ? [path] : [];
  });
}

function prepare(slug, input) {
  const source = realpathSync(resolve(input));
  if (!lstatSync(source).isDirectory()) throw new Error(`${slug}: source must be a directory.`);
  for (const file of games[slug].files) {
    const path = join(source, file);
    if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) {
      throw new Error(`${slug}: missing required runtime file ${file}.`);
    }
  }
  let commit, root, tree;
  try {
    commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    root = execFileSync('git', ['-C', source, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const status = execFileSync('git', ['-C', source, 'status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (status.trim()) throw new Error(`${slug}: source has uncommitted changes. Use a clean checkout.`);
    tree = execFileSync('git', ['-C', source, 'ls-tree', '-r', '-z', '--full-tree', commit], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    if (/uncommitted/.test(error.message)) throw error;
    throw new Error(`${slug}: source must be a clean Git checkout with a commit.`);
  }
  if (relative(source, realpathSync(root))) throw new Error(`${slug}: select the Git checkout root.`);
  const objects = new Map(tree.split('\0').flatMap(entry => {
    const match = entry.match(/^100(?:644|755) blob ([0-9a-f]+)\t([\s\S]+)$/);
    return match ? [[match[2], match[1]]] : [];
  }));
  const committedAssets = games[slug].assets
    ? tree.split('\0').map(entry => entry.slice(entry.indexOf('\t') + 1)).filter(supportedAsset)
    : [];
  const localAssets = games[slug].assets ? runtimeAssets(source).map(file => file.split(sep).join('/')) : [];
  const files = [...new Set([...games[slug].files, ...committedAssets, ...localAssets])];
  for (const file of files) {
    if (!objects.has(file)) throw new Error(`${slug}: runtime file ${file} is not a regular file in the source commit. Commit it or remove it from the runtime directory.`);
  }
  return { slug, source, commit, files, objects };
}

function main(args) {
  if (args.length === 1 && args[0] === '--help') { console.log(usage); return; }
  const inputs = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const slug = args[index].slice(2);
    if (!args[index].startsWith('--') || !Object.hasOwn(games, slug)) throw new Error('Unknown option. ' + usage);
    if (inputs.has(slug) || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error(usage);
    inputs.set(slug, args[index + 1]);
  }
  if (!inputs.size) throw new Error(usage);
  const site = realpathSync(process.cwd());
  if (!existsSync(join(site, 'index.html'))) throw new Error('Run from the profile repository root containing index.html.');
  const exports = [...inputs].map(([slug, source]) => prepare(slug, source));
  const fun = join(site, 'fun');
  if (existsSync(fun) && (lstatSync(fun).isSymbolicLink() || !lstatSync(fun).isDirectory())) throw new Error('The Fun output must be a real directory.');
  const manifest = join(fun, 'game-versions.json');
  const versions = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : {};
  for (const { slug } of exports) {
    const destination = join(fun, slug);
    inside(fun, destination);
    if (existsSync(destination) && (lstatSync(destination).isSymbolicLink() || !lstatSync(destination).isDirectory())) throw new Error(`${slug}: existing output must be a real directory.`);
  }
  const staging = mkdtempSync(join(site, '.game-export-'));
  inside(site, staging);
  const replaced = [];
  try {
    for (const { slug, source, files, objects } of exports) {
      for (const file of files) {
        const destination = join(staging, slug, file);
        inside(staging, destination);
        mkdirSync(dirname(destination), { recursive: true });
        const bytes = execFileSync('git', ['-C', source, 'cat-file', 'blob', objects.get(file)], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
        writeFileSync(destination, file === 'index.html' ? withSiteAnalytics(bytes.toString('utf8')) : bytes);
      }
    }
    mkdirSync(fun, { recursive: true });
    for (const { slug, commit } of exports) {
      const destination = join(fun, slug);
      const backup = join(staging, slug + '.previous');
      const hadPrevious = existsSync(destination);
      if (hadPrevious) renameSync(destination, backup);
      const replacement = { destination, backup, hadPrevious };
      replaced.push(replacement);
      renameSync(join(staging, slug), destination);
      versions[slug] = { commit, importedAt: new Date().toISOString() };
    }
    writeFileSync(manifest, JSON.stringify(versions, null, 2) + '\n');
  } catch (error) {
    for (const { destination, backup, hadPrevious } of replaced.reverse()) {
      inside(fun, destination);
      if (existsSync(destination)) rmSync(destination, { recursive: true });
      if (hadPrevious) renameSync(backup, destination);
    }
    throw error;
  } finally {
    inside(site, staging);
    rmSync(staging, { recursive: true });
  }
  for (const { slug, commit, files } of exports) console.log(`Exported ${slug}: ${files.length} runtime files, commit ${commit.slice(0, 12)}.`);
}

try { main(process.argv.slice(2)); }
catch (error) { console.error(error.message); process.exitCode = 1; }
