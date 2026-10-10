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

Rerun the export after game changes, preview, then review and commit the website update. Publishing requires an explicitly approved push.

See [the TicTacToe publishing guide](docs/TICTACTOE.md) for the complete update steps and screenshot instructions.

See [Publishing and updating the games](docs/PUBLISHING.md) for the full procedure, GitHub Pages settings, and troubleshooting.

## Analytics

Umami Cloud records pageviews on the six pages listed above. `assets/analytics.js` contains the public website ID and loads the tracker only on `dejans11.github.io`, respecting Do Not Track and excluding URL query strings and fragments. Local previews send no analytics. Both game export tools add the shared loader automatically.

See [Analytics setup and maintenance](docs/ANALYTICS.md) for configuration, excluding your own visits, verification, and disabling collection. The site footer links to the visitor-facing [analytics privacy notice](privacy.html).

## Site files

- `index.html`, `projects/index.html`, `fun/index.html`: profile pages.
- `assets/site.css`: shared profile styling.
- `assets/game-gallery.js`, `assets/vendor/baguettebox/`: screenshot modal setup and the bundled lightbox library, including its license.
- `fun/blobs/`, `fun/warblade/`, `fun/tictactoe/`: exported playable games.
- `scripts/import-games.mjs`: local export tool.
- `scripts/site-analytics.mjs`: adds the shared analytics loader to exported game HTML.
- `scripts/import-tictactoe.ps1`: TicTacToe export with analytics, requiring only PowerShell.
- `tests/import-games.test.mjs`: export checks.
- `assets/analytics.js`, `privacy.html`: analytics configuration and visitor privacy information.
- `design/`: the approved design preview and its editable source.

The profile pages use plain HTML, CSS, and JavaScript. `.nojekyll` lets GitHub Pages publish these files directly. The older Octopress files remain in Git history and the repository; the homepage no longer links to them.
