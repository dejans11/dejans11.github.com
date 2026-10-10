# Publishing and updating the games

This public repository hosts the profile and the playable browser versions of Blobs, Warblade, and TicTacToe on GitHub Pages. The Blobs and Warblade source repositories stay private; TicTacToe is exported from its local game folder. Updating a game means exporting its runtime files here, testing them, then pushing this repository after explicit approval.

## GitHub Pages setup

The existing `dejans11.github.com` repository already serves https://dejans11.github.io/. Its legacy name can stay in place. New personal-site repositories normally use the `<username>.github.io` name.

In this repository's **Settings → Pages**, use:

- **Source:** Deploy from a branch.
- **Branch:** `master`.
- **Folder:** `/ (root)`.

The root `.nojekyll` file disables Jekyll processing. No custom deployment workflow, server, or paid GitHub plan is needed. The game source repositories do not need Pages enabled and do not need to be made public.

After a push, check **Actions → pages build and deployment**. GitHub can take up to ten minutes to publish changes. See [GitHub's publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [site creation guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Get the game sources

Clone the private repositories outside this public profile repository, using your normal GitHub authentication:

```powershell
git clone https://github.com/dejans11/blobs.git "E:\dev\AI-projects\games\blobs"
git clone https://github.com/dejans11/warblade.git "E:\dev\AI-projects\games\warblade"
```

If those directories already exist, update the checkouts instead:

```powershell
git -C "E:\dev\AI-projects\games\blobs" pull --ff-only
git -C "E:\dev\AI-projects\games\warblade" pull --ff-only
```

Use clean, committed game releases. The export tool refuses uncommitted or untracked changes in a source checkout, so unfinished experiments cannot slip into a published release. Commit and push intended game changes in their private repository before exporting them.

## Export a release

Run these commands from the profile repository root. Git and Node.js 22 or newer are required; there are no package dependencies to install.

```powershell
npm run import:games -- --blobs "E:\dev\AI-projects\games\blobs" --warblade "E:\dev\AI-projects\games\warblade"
npm test
```

For a single game, supply only its option:

```powershell
npm run import:games -- --blobs "E:\dev\AI-projects\games\blobs"
```

The other game's published files and version record are preserved. `node scripts/import-games.mjs --help` shows the command syntax.

Both games currently work directly as static browser files; no Vite, Unity, or other build step is involved. The tool packages these runtime files:

| Game | Files published |
| --- | --- |
| Blobs | `index.html`, `style.css`, `game.js`, `solver.js` |
| Warblade | `index.html`, `style.css`, `game.js`, supported image, audio, and font files under `assets/` |

The tool validates all requested sources before replacing an export. Every selected runtime file must belong to the source commit; ignored runtime files are rejected. Exported bytes come directly from that commit. It excludes Git metadata, README files, tests, tools, development plans, environment files, source artwork, and source maps. It records the imported commits and timestamps in `fun/game-versions.json`, without local source paths.

Do not edit the exported game files directly: the next export replaces them. Make game changes in the private source repository. If a game gains new runtime files, update its allowlist in `scripts/import-games.mjs`, then test its export.

The deployed JavaScript and assets remain public and downloadable because the browser needs them to play. Keeping the repositories private preserves their history and development files; it does not hide shipped browser code.

## Export TicTacToe

TicTacToe already uses plain HTML, CSS, and JavaScript. It needs neither a Node.js server nor an npm build. From this website repository, run:

```powershell
& "E:\dev\AI-projects\games\tictactoe\export-pages.ps1" -SitePath (Get-Location).Path
```

This copies `index.html`, `main.js`, `style.css`, and `favicon.svg` to `fun/tictactoe/`. It does not modify other games, commit, or push. Rerun it after changes in the source game folder, then preview and commit the website changes. The existing Git-based export tool and version manifest continue to cover Blobs and Warblade.

The source game folder also contains a README with these update instructions. If you add a game asset, add it to the PowerShell script's `$files` list. Keep runtime paths relative to the game directory.

## Preview and check

With Python 3 installed:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/, follow **Fun**, and test the games. Also open each game directly:

- http://127.0.0.1:8080/fun/blobs/
- http://127.0.0.1:8080/fun/warblade/
- http://127.0.0.1:8080/fun/tictactoe/

Blobs: select a blob and jump to a highlighted landing cell. Check the help and level controls.

Warblade: press Enter to start, use arrows or WASD to move, and Space to fire. Press P to pause. The current release uses keyboard controls.

TicTacToe: take turns clicking or tapping empty squares. Check a win, a draw, and Reset Game.

Check the browser console and network panel for JavaScript errors or missing files. Stop the preview with Ctrl+C.

## Publish

Run this sequence on `master`. If you made the update on a feature branch, commit there and integrate it into `master` before pushing `master`. Review and commit the exported files, version manifest, screenshots, and any catalogue or homepage changes. Push only after explicitly approving the repository, branch, and commits:

```powershell
git status --short
git diff --stat
git add fun/ assets/games/ index.html
git commit -m "Update browser game releases"
git push origin master
```

Confirm the Pages deployment finishes, then test https://dejans11.github.io/fun/ and the Play links. If a new version looks unchanged, reload without cache.

## Troubleshooting

- **An image, script, or stylesheet returns 404:** use paths relative to the game directory. `game.js` resolves under `/fun/blobs/`; `/game.js` resolves at the profile root. File-name case must match on GitHub Pages.
- **Export reports a dirty checkout:** inspect `git status` in the private game repository. Commit intended changes or finish that work before exporting. Do not discard work to bypass the check.
- **Git cannot read a private repository:** authenticate GitHub through your Git credential manager or SSH setup. No token belongs in this public repository.
- **A required file is missing:** check the selected source path and the runtime allowlist. The tool validates before replacing the existing export.
- **The site does not update after pushing:** check the Pages branch/folder settings and the deployment run in Actions. Pages cannot publish these private game repositories directly on GitHub Free; it publishes their exported files from this public repository.
