# Publishing Footsi

Footsi is the public website name for the Retro Football Manager source project (`lale-manager`). The web game lives at `fun/lale-manager/index.html`, with a gallery screenshot at `assets/games/lale-manager.png`. Its intended public URL is https://dejans11.github.io/fun/lale-manager/. The existing URL, `rfm-career-v1` save key, manifest identity and exporter command names are retained. Publication happens only after a specifically approved push of the website repository's `master` branch; a local export is not a deployment.

This integration belongs to [Build retro football manager](codex://threads/01a1240f-1c9e-7732-b6a1-09fa9ff6ffd1). The game workspace is `C:/dev/games/lale-manager`; its companion handoff is `docs/web-publishing.md` there. Keep that handoff and this guide updated together whenever the build, export, save handling or publication steps change.

## Build and export

The complete local preparation command, run from the game folder with Node.js 22.12+ or a newer supported version, is:

```powershell
Set-Location "C:\dev\games\lale-manager"
npm run prepare:web -- --site "E:\dev\dejans11.github.com"
```

It runs the game tests and production build, exports into the website, then runs the website tests and local release verification. Add `--screenshot <PNG>` to update the image. It stops at the first failed step and never initializes Git, commits or pushes. The command works with paths containing spaces. A failed website check leaves the exported changes local for correction and review.

To run the individual steps instead:

From the local game source folder:

```powershell
Set-Location "C:\dev\games\lale-manager"
npm test
npm run build
```

The build produces one self-contained `dist/index.html` and `dist/retro-football-manager.zip`. The ZIP includes the offline HTML, README and reference notes. Do not edit these built files manually.

From this website repository:

```powershell
npm run import:lale-manager -- --source "C:\dev\games\lale-manager\dist" --screenshot "C:\dev\games\lale-manager\output\playwright\phase3-match.png"
npm test
npm run verify:lale-manager
```

For later game updates, omit `--screenshot` to retain the current image. The optional screenshot must be a PNG. The website exporter requires Node.js 22 or newer, with no npm dependencies. It validates HTML, output paths, all three ZIP entries and their checksums, and requires the offline HTML to match the build before staging the release. Failed installation restores the previous files; if restoration also fails, recovery files are retained and their location reported. It never builds the game, modifies its source, initializes Git, commits or pushes.

Only the built HTML and ZIP enter `fun/lale-manager/`. Source files, tests, development plans, source maps, and local career save JSON do not enter the website. The website copy uses the Footsi title/heading and Web edition label, and adds All games, Offline ZIP and Analytics privacy links, plus the same shared pageview loader as other games. Repeated exports retain the public name. The original HTML and ZIP keep their Retro Football Manager name and remain unchanged; the downloadable version includes no website analytics.

`fun/game-versions.json` records SHA-256 hashes for the original HTML, published HTML, ZIP and screenshot. This exporter tracks built artifacts, so it also works while the game source is awaiting its first approved commit. Blobs/Warblade continue to require clean committed source releases. No local source paths appear in the public release manifest. Runtime browser code remains public and downloadable.

The offline ZIP includes the source README, so README changes also require a rebuild and export. Update documentation in both workspaces before running the complete preparation command; it refreshes the ZIP and release hashes together.

## Preview and verify

Start the website's local preview using the instructions in [Publishing](PUBLISHING.md), then open http://127.0.0.1:8080/fun/lale-manager/.

- Confirm the homepage shortcut, Fun gallery, screenshot lightbox, game and offline download work.
- Start a new career, choose a club, review the sponsor offer, and play through half-time and full-time. Space pauses; Escape pauses or goes back.
- Export a career, reload the web page, Continue, and import the exported file. Tactics and transfer controls should work unchanged.
- The web ZIP must match the original build's ZIP bytes. Extract it and open its `index.html` while offline.
- Local preview must make no requests to Umami. Production uses the shared hostname/Do Not Track rules; no careers, moves, bids or scores are sent as analytics.

Careers stay in each visitor's browser under `rfm-career-v1`. The offline file and HTTPS website use different storage origins: move a career with Export/Import. Different devices/browsers do not share careers automatically. GitHub Pages hosts the game; it does not provide cloud saves or user accounts.

## Publish after approval

Review the local website diff and obtain approval before creating this project's commits. Stage only the approved game/gallery/exporter/documentation changes, preserving concurrent changes for other games. The user approved local game Git initialization and commits in both repositories on 10 October 2026; the source uses `main` and the website uses `master`.

Identify `dejans11/dejans11.github.com`, the `master` branch and the exact commits proposed for `origin/master`, then obtain approval for that specific push before running it. The existing Pages branch/root setup publishes the approved website commit. Check that its GitHub Pages deployment succeeds before checking the live game and ZIP; updating documentation or running the exporter alone does not make the game live.

After GitHub Pages finishes publication, run from the website folder:

```powershell
npm run verify:lale-manager -- --url https://dejans11.github.io/fun/lale-manager/
```

The read-only checker first validates the local release, then fetches the live HTML, ZIP, PNG, release manifest, homepage and Fun gallery. It rejects non-successful HTTP responses, stale game files or hashes, malformed archives and missing navigation. No authentication or extra package is needed. The same command accepts the local preview's full game URL. It neither changes files nor executes remote scripts; follow it with the browser checks above to assess gameplay on the production origin.

## Local preparation verification — 10 October 2026

The complete preparation command passed: 147 game tests, TypeScript/production build, export, 62 website tests and local release verification. The tests include four preparation cases, 14 importer cases and eight local/HTTP verifier cases. All 23 HTTP browser checks passed: gallery/lightbox/download, desktop/mobile layout, career/transfer, save migration/reload, keyboard pause, half-time substitution and full-time settlement. No JavaScript errors, external game runtime requests or local analytics requests occurred. An independent standard ZIP reader checked every entry and confirmed the source, public and downloaded ZIP match exactly (46,457 bytes). Release-tooling follow-up review found no remaining actionable issues.

At the initial review, the web integration was prepared locally, awaiting review and commit/push approval. The HTTP checker passed against the local preview and correctly reported HTTP 404 for the unpublished production game URL. No project commits or remote push had occurred at that point.

After the Footsi naming update, all 72 current website tests and 23 HTTP browser checks passed. The homepage/Fun labels, screenshot caption, page title and heading use Footsi. Local HTTP release verification passed; the original HTML/ZIP and save key remain unchanged. Other concurrent game changes were preserved.

## Documentation refresh — 10 October 2026

Both publishing guides now link the development chat and describe coordinated documentation updates, local preparation, commit/push approval and verification after Pages deployment. The complete preparation command was rerun successfully: 147 game tests, TypeScript/production build, export, 72 website tests and local release verification. All six HTTP routes also matched the prepared release on the local preview at port 8091.

The rebuilt offline ZIP includes the updated source README, verified against the packaged README with a standard ZIP reader. Source and exported ZIP hashes match. The original game HTML, screenshot, save key and other games' release records are unchanged. Gameplay browser checks from the naming update were not rerun for this documentation refresh. This Footsi release remains local.

## Commit and publication status

The user approved game Git initialization and all local game/Footsi website commits on 10 October 2026. The source repository uses `main`, with no remote configured; the website uses `master`. Remote publication requires separate approval of the repository, branch and every unpublished commit in the proposed push. The preceding Girl in Fire commits are already present on `origin/master`; the three Footsi commits remain local. After approval, wait for GitHub Pages and run the live release checker above.
