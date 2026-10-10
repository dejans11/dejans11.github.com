# Publishing and updating the games

This public repository hosts the profile and browser games on GitHub Pages. The Blobs and Warblade source repositories stay private; TicTacToe is exported from its local game folder, and Retro Football Manager from its built artifacts. Updating a game means exporting its runtime files here, testing them, then pushing this repository after explicit approval.

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

Use clean, committed game releases. The export tool refuses uncommitted or untracked changes in a source checkout, so unfinished experiments cannot slip into a published release. Commit intended game changes in their private repository before exporting them. Any push to a private game repository also requires explicit approval of that specific push.

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

The tool validates all requested sources before replacing an export. Every selected runtime file must belong to the source commit; ignored runtime files are rejected. Runtime bytes come directly from that commit, with one website-owned addition to `index.html`: the shared analytics loader. The private source is not modified. The tool excludes Git metadata, README files, tests, tools, development plans, environment files, source artwork, and source maps. It records the imported commits and timestamps in `fun/game-versions.json`, without local source paths.

Do not edit the exported game files directly: the next export replaces them. Make game changes in the private source repository. If a game gains new runtime files, update its allowlist in `scripts/import-games.mjs`, then test its export.

The deployed JavaScript and assets remain public and downloadable because the browser needs them to play. Keeping the repositories private preserves their history and development files; it does not hide shipped browser code.

## Export Footsi

Build and test the game in its source folder, then export its `dist` artifacts from this website repository:

Footsi is the website name for Retro Football Manager (`lale-manager`). The existing runtime URL and browser saves remain compatible; the exporter applies the website title/heading on every update.

```powershell
npm run import:lale-manager -- --source "C:\dev\games\lale-manager\dist"
```

This adds the built HTML and unchanged offline ZIP to `fun/lale-manager/`, adds website navigation/shared analytics only to the public HTML, and records SHA-256 release hashes in the existing manifest. Supply `--screenshot <PNG>` to update the gallery image. The source does not need Git initialization or a commit to prepare a local artifact export; source/private files and career saves are excluded. No commits or pushes occur. See [the full game publishing guide](LALE-MANAGER.md) for update steps, browser save portability and verification.

The game's `npm run prepare:web -- --site <website-folder>` runs tests/build/export/website tests/verification together and stops on failure. Alternatively, after the manual export run `npm test` and `npm run verify:lale-manager` here. After an approved publishing push and successful Pages deployment, run `npm run verify:lale-manager -- --url https://dejans11.github.io/fun/lale-manager/` to compare live game/ZIP/screenshot hashes, release metadata and homepage/gallery links against the local release. These scripts never commit or push.

Footsi is prepared locally; its initial website commits are approved, and remote publication awaits approval of the exact push. Its development chat and source-side publishing handoff are linked in [the game publishing guide](LALE-MANAGER.md). Update both guides before preparing a release; the offline ZIP also contains the source README, so changes to that README require rebuilding and exporting.

## Export Girl in Fire (Tanja)

The static game uses the public name **Girl in Fire** at `/fun/girl-in-fire/`. The URL correction is prepared locally; `/fun/tanja/` becomes a redirect after its approved deployment. From this website root, run `npm run import:games -- --tanja "C:\dev\games\tanja"` against a clean committed source checkout. Source allowlist/asset hashes select 29 runtime files; hosted HTML alone gains the name, privacy link and shared Umami loader. The original concept/link stay only in the separate offline package. Sound starts off on every load.

Preview/test/review before committing. Initial publication succeeded on 10 October 2026 at website commit `963ed70`, following approval of its exact push. Future exports are local preparation until separately approved publication. See [Girl in Fire update, acceptance and rollback](TANJA.md). The exporter preserves other games/version entries and never commits or pushes.

## Export TicTacToe

TicTacToe already uses plain HTML, CSS, and JavaScript. It needs neither a Node.js server nor an npm build. From this website repository, run:

```powershell
./scripts/import-tictactoe.ps1 -SourcePath "E:\dev\AI-projects\games\tictactoe"
```

This copies `index.html`, `main.js`, `style.css`, and `favicon.svg` to `fun/tictactoe/`, adding the shared analytics loader to the website copy of the HTML. It does not modify the source folder or other games, commit, or push. Rerun it after changes in the source game folder, then preview and commit the website changes. The existing Git-based export tool and version manifest continue to cover Blobs and Warblade.

Use this website-owned export command rather than the source folder's older `export-pages.ps1`, which does not preserve website analytics. If you add a game asset, add it to `$files` in `scripts/import-tictactoe.ps1`. Keep runtime paths relative to the game directory.

The [TicTacToe publishing guide](TICTACTOE.md) gives the complete export, preview, commit, and approved-push sequence, including how to refresh its gameplay screenshot.

## Preview and check

With Python 3 installed:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/, follow **Fun**, and test the games. Also open each game directly:

- http://127.0.0.1:8080/fun/blobs/
- http://127.0.0.1:8080/fun/warblade/
- http://127.0.0.1:8080/fun/tictactoe/
- http://127.0.0.1:8080/fun/lale-manager/
- http://127.0.0.1:8080/fun/girl-in-fire/

Blobs: select a blob and jump to a highlighted landing cell. Check the help and level controls.

Warblade: press Enter to start, use arrows or WASD to move, and Space to fire. Press P to pause. The current release uses keyboard controls.

TicTacToe: take turns clicking or tapping empty squares. Check a win, a draw, and Reset Game.

Check the browser console and network panel for JavaScript errors or missing files. Stop the preview with Ctrl+C.

The tracked public pages should each load `/assets/analytics.js` once. Local previews must not request `cloud.umami.is`. The exporters preserve the loader after updates; the Retro Football Manager offline ZIP has none. See [analytics verification](ANALYTICS.md#verify-collection) for production checks and owner opt-out.

## Publish

Review the exported files, version manifest, screenshots, catalogue/homepage changes, tooling and documentation:

```powershell
git status --short
git diff --stat
```

Stage only the reviewed release changes, including the relevant parts of shared files. Preserve concurrent work on other games and honor any project-specific hold on commits. Footsi's game Git initialization and local game/website commits were approved on 10 October 2026. If working on a feature branch, integrate the approved changes into `master` before publishing.

Once the local commits are ready, identify this repository (`dejans11/dejans11.github.com`), the `master` branch and their exact hashes in ordinary chat. Include every unpublished commit on that branch, including releases of other games. Wait for approval of that specific push. After approval, run:

```powershell
git push origin master
```

Confirm the Pages deployment finishes, then test https://dejans11.github.io/fun/ and the Play links. If a new version looks unchanged, reload without cache.

Confirm a controlled visit appears under the correct page path in Umami, then re-enable the owner opt-out if you normally exclude your own visits.

## Troubleshooting

- **An image, script, or stylesheet returns 404:** use paths relative to the game directory. `game.js` resolves under `/fun/blobs/`; `/game.js` resolves at the profile root. File-name case must match on GitHub Pages.
- **Export reports a dirty checkout:** inspect `git status` in the private game repository. Commit intended changes or finish that work before exporting. Do not discard work to bypass the check.
- **Git cannot read a private repository:** authenticate GitHub through your Git credential manager or SSH setup. No token belongs in this public repository.
- **A required file is missing:** check the selected source path and the runtime allowlist. The tool validates before replacing the existing export.
- **The site does not update after pushing:** check the Pages branch/folder settings and the deployment run in Actions. Pages cannot publish these private game repositories directly on GitHub Free; it publishes their exported files from this public repository.
