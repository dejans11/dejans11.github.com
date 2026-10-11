# Dejan Križan personal website

A static GitHub Pages site with a short personal introduction, projects, and browser games.

| Page | URL |
| --- | --- |
| Homepage | https://dejans11.github.io/ |
| Projects | https://dejans11.github.io/projects/ |
| Fun | https://dejans11.github.io/fun/ |
| Blobs | https://dejans11.github.io/fun/blobs/ |
| Warblade | https://dejans11.github.io/fun/warblade/ |
| TicTacToe | https://dejans11.github.io/fun/tictactoe/ |
| Footsi (prepared locally) | https://dejans11.github.io/fun/lale-manager/ |

Blobs and Warblade keep their source repositories private. This public repository contains only their browser runtime files. The export script selects the files to publish and records their source commits in `fun/game-versions.json`.

## Preview locally

With Python 3 installed, run from this repository:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/. Stop the server with Ctrl+C. No Node.js is needed; `npm run preview` is an optional shortcut if you have it installed.

## Update the games

With Git and Node.js 22 or newer installed, use clean local checkouts of the private game repositories:

```powershell
npm run import:games -- --blobs "E:\dev\AI-projects\games\blobs" --warblade "E:\dev\AI-projects\games\warblade"
npm test
```

No `npm install` or framework build is required. You can supply just `--blobs` or just `--warblade` to update one game. The source repositories are read, never modified.

TicTacToe has a simple PowerShell export that also works without Node.js:

```powershell
./scripts/import-tictactoe.ps1 -SourcePath "E:\dev\AI-projects\games\tictactoe"
```

Footsi (source project Retro Football Manager / lale-manager) exports its already-built HTML and offline ZIP:

```powershell
npm run import:lale-manager -- --source "C:\dev\games\lale-manager\dist"
```

Build in the game folder first with `npm run build`. Add `--screenshot <PNG>` to update its gallery image. The exporter preserves the source/ZIP, adds website navigation and analytics to the public HTML, and records artifact hashes. See [Retro Football Manager publishing](docs/LALE-MANAGER.md) for save portability and verification. A local export is not a deployment.

For a complete local preparation, run `npm run prepare:web -- --site "E:\dev\dejans11.github.com"` from the game source folder. It tests/builds the game, exports it, and tests/verifies the website. In this website folder, `npm run verify:lale-manager` checks the local release; add `-- --url https://dejans11.github.io/fun/lale-manager/` after publication to verify the live files and navigation. Both commands leave commits and pushes to the separately approved publishing step.

Rerun the export after game changes, preview, then review and commit the website update. Publishing requires an explicitly approved push.


See [the TicTacToe publishing guide](docs/TICTACTOE.md) for the complete update steps and screenshot instructions.

See [Publishing and updating the games](docs/PUBLISHING.md) for the full procedure, GitHub Pages settings, and troubleshooting.

## Analytics

Hosted pages use Umami Cloud for pageviews; Footsi joins that coverage after its approved publication. `assets/analytics.js` contains the public website ID and loads the tracker only on `dejans11.github.io`, respecting Do Not Track and excluding URL query strings and fragments. Local previews send no analytics. Game exporters add the shared loader automatically; the Retro Football Manager offline ZIP keeps its original bytes and has no website tracker.

See [Analytics setup and maintenance](docs/ANALYTICS.md) for configuration, excluding your own visits, verification, and disabling collection. The site footer links to the visitor-facing [analytics privacy notice](privacy.html).

## Site files

- `index.html`, `projects/index.html`, `fun/index.html`: profile pages.
- `assets/site.css`: shared profile styling.
- `assets/game-gallery.js`, `assets/vendor/baguettebox/`: screenshot modal setup and the bundled lightbox library, including its license.
- `fun/blobs/`, `fun/warblade/`, `fun/tictactoe/`: exported playable games.
- `fun/lale-manager/`: Footsi web game and original offline ZIP.
- `scripts/import-games.mjs`: local export tool.
- `scripts/site-analytics.mjs`: adds the shared analytics loader to exported game HTML.
- `scripts/import-tictactoe.ps1`: TicTacToe export with analytics, requiring only PowerShell.
- `scripts/import-lale-manager.mjs`: built-artifact export with website links, analytics and release hashes.
- `scripts/lale-manager-zip.mjs`: verifies the offline archive matches the supplied game build.
- `scripts/verify-lale-manager.mjs`: read-only checks of local or published release files, hashes and navigation.
- `tests/import-games.test.mjs`: export checks.
- `assets/analytics.js`, `privacy.html`: analytics configuration and visitor privacy information.
- `design/`: the approved design preview and its editable source.

The profile pages use plain HTML, CSS, and JavaScript. `.nojekyll` lets GitHub Pages publish these files directly. The older Octopress files remain in Git history and the repository; the homepage no longer links to them.
