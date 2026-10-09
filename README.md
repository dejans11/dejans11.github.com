# Dejan Križan personal website

A static GitHub Pages site with a short personal introduction, projects, and browser games.

| Page | URL |
| --- | --- |
| Homepage | https://dejans11.github.io/ |
| Projects | https://dejans11.github.io/projects/ |
| Fun | https://dejans11.github.io/fun/ |
| Blobs | https://dejans11.github.io/fun/blobs/ |
| Warblade | https://dejans11.github.io/fun/warblade/ |

Blobs and Warblade keep their source repositories private. This public repository contains only their browser runtime files. The export script selects the files to publish and records their source commits in `fun/game-versions.json`.

## Preview locally

With Python 3 installed, run from this repository:

```sh
npm run preview
```

Open http://127.0.0.1:8080/. Stop the server with Ctrl+C. You can also run `python -m http.server 8080 --bind 127.0.0.1` directly without Node.js.

## Update the games

With Git and Node.js 22 or newer installed, use clean local checkouts of the private game repositories:

```powershell
npm run import:games -- --blobs "E:\dev\AI-projects\games\blobs" --warblade "E:\dev\AI-projects\games\warblade"
npm test
```

No `npm install` or framework build is required. You can supply just `--blobs` or just `--warblade` to update one game. The source repositories are read, never modified.

See [Publishing and updating the games](docs/PUBLISHING.md) for the full procedure, GitHub Pages settings, and troubleshooting.

## Site files

- `index.html`, `projects/index.html`, `fun/index.html`: profile pages.
- `assets/site.css`: shared profile styling.
- `fun/blobs/`, `fun/warblade/`: exported playable games.
- `scripts/import-games.mjs`: local export tool.
- `tests/import-games.test.mjs`: export checks.
- `design/`: the approved design preview and its editable source.

The profile pages use plain HTML and CSS. `.nojekyll` lets GitHub Pages publish these files directly. The older Octopress files remain in Git history and the repository; the homepage no longer links to them.
