# Publishing Girl in Fire (Tanja)

Girl in Fire is the site's display name for **Tanja — Paratroopers Over Mostar**. The prepared URL is `https://dejans11.github.io/fun/tanja/`; the folder, exporter option and version-record key remain `tanja`. Sound starts **off on every page load**, including reload. Players can enable it through the Sound button.

## Current status — 10 October 2026

Prepared and verified locally; **not published yet**. Local Phase7 commits were approved on 10 October 2026. The 29-file runtime export records source commit `2a6d9c4369bf` and release `0.1-review` in [game versions](../fun/game-versions.json). Homepage/Fun links and gameplay screenshot are ready. Specific website push approval, Pages completion and authenticated Umami dashboard reception remain pending.

The source checkout is `C:\dev\games\tanja` (`main`); the website is `E:\dev\dejans11.github.com` (`master`, origin `dejans11/dejans11.github.com`). Existing site docs describe branch-root Pages with `.nojekyll`. Confirm **Settings → Pages → master / root** before an approved push; authenticated remote settings were not inspected here. See [GitHub's source configuration](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Export and preview

Make and verify game changes in Tanja first. Obtain approval before committing them. The exporter requires a clean committed source, including documentation changes; never discard work or hide modifications to bypass that guard. From the website root with Git and Node22+:

```powershell
node scripts/import-games.mjs --tanja "C:\dev\games\tanja"
npm test
python -m http.server 8080 --bind 127.0.0.1
```

`npm run import:games -- --tanja <checkout>` is equivalent. No npm installation, bundler, player installation or new account is needed. The source is read without modification; the exporter makes no commit/push/deployment. Open `http://127.0.0.1:8080/fun/tanja/` and follow the homepage/Fun Play links. Stop the preview with Ctrl+C.

The current export originally used the clean source root. After review captures made that root dirty, the name update was re-exported from an ignored clean local clone of the **same committed source**, without bypassing the guard or committing pending work. Later updates should use a reviewed clean checkout.

## What becomes public

The committed `release/player-files.json` selects `index.html`, direct `src/css/*.css` and `src/js/*.js` files, and `assets/runtime/**/*.png` / `*.wav`. All 12 PNGs and six WAVs ship, including optional audio. All 28 non-HTML files retain their exact committed bytes. Only HTML receives the public display name, shared analytics loader and privacy link.

The original concept/image link, offline README/NOTES, reference crops, source artwork, manifests, docs/tests/tools, private files and Git history are excluded from the runtime export. The concept remains in Tanja's separate offline ZIP; this site does not offer that ZIP. The gallery PNG is a native capture of actual gameplay. The browser code/assets are publicly downloadable; this procedure neither changes nor assumes source-repository visibility. Preparing the approved export does not establish the still-undecided release license.

## Validation and updates

The importer reads **Git blobs from HEAD**, not working bytes. It rejects unsupported schemas, unsafe/reserved paths, aliases, duplicate/case-colliding paths, untracked or symlink-mode members, missing registered assets and hash/length mismatches. Supported literal HTML/CSS/JS dependencies must resolve inside the runtime, apart from the shared website links. Validation/preflight failures preserve the previous export and other game/version records; this is not a crash-consistent storage transaction.

The static dependency guard covers quoted HTML resource/link attributes and srcsets, CSS URLs/imports, and supported JS asset/src/href/poster literals. It is not a parser for computed, escaped or inline-script URLs. Extend validation/tests and repeat browser network checks when those forms or new file types are introduced.

Directory-prefix casing must be consistent. The hosted transform rejects missing/ambiguous title, heading, version footer, privacy link or shared analytics loader; source markup changes require a corresponding website transform update.

Do not edit `fun/tanja/` directly; re-exporting replaces it. Website naming belongs in `scripts/tanja-export.mjs`; the source/offline title stays intact. For art updates, capture the actual native 640×360 Canvas as `assets/games/tanja.png` and refresh Fun description/alt text if needed. The exporter does not capture screenshots.

## Analytics and browser data

Hosted HTML has exactly one `/assets/analytics.js` loader and `/privacy.html` link. The shared loader admits only `dejans11.github.io`, respects Do Not Track and excludes URL queries/fragments. Best score stays local under `tanja.bestScore.v1`, with an in-memory fallback. No game events, scores or sound settings are submitted; sound preferences do not persist. The source/offline game has no analytics.

See [analytics and live verification](ANALYTICS.md), [visitor notice](../privacy.html) and [Umami configuration](https://docs.umami.is/docs/tracker-configuration). Controlled production-host tests used locally fulfilled site responses and a harmless tracker stub/abort: they verify configuration, DNT gating and blocked-tracker gameplay, **not real collection or dashboard reception**.

## Verified local acceptance

- Committed Tanja-only website snapshot: 50 passes, zero failures/skips, including export/failure preservation and final review regressions. The combined working-checkout suite passed72, including22 concurrent football-manager cases that are excluded from these commits.
- Actual nested export: Chrome154 and Firefox157 complete default-random ten-visitor rounds, bosses5/10, 1200 points, no visitor11, real local audio, pause frame/audio freeze, replay/title, best1200 reload, sound off before opt-in/after reload. No game errors, missing resources, external game requests or concept requests.
- Native keyboard screenshot modal/focus containment/return, homepage/Fun Play popups and privacy navigation pass. At 390px and 200% text, controls remain usable without horizontal overflow.
- Git-blob hashes/public exclusions, offline-source/ZIP identity and other exports/version records checked around import. Concurrent Retro Football Manager work is preserved; its independent updates are not attributed to Tanja.

Tanja's `docs/art/PHASE7_WEB_REVIEW.md` holds native captures/limits. Headless desktop responsive checks do not establish physical Android/iOS behavior, Windows minimize/restore or subjective speaker listening. Earlier offline/visibility checks remain recorded in the source project.

## Review, publication and follow-up

1. Review both repos. Commit only after approval, selecting Tanja changes carefully because other website work may be pending.
2. For future source updates, commit approved source changes first, then export/verify the clean checkout. A source push is not required for the website export.
3. Before any push, identify the **repository, branch and exact commits** in ordinary chat and obtain specific approval. Commit approval is not push approval; avoid implicit publishing commands.
4. After the approved site `origin/master` push, check **Actions → pages build and deployment**, then test live homepage/Fun/game/resources/privacy, full round, replay and sound-off reload.
5. Follow the analytics guide for one controlled production visit and confirm `/fun/tanja/` in Umami. Restore owner opt-out if used. Record deployed commit/date/URL and real results in this guide and Tanja's deployment/review docs. Until then retain prepared-only status.

## Rollback

Use a clean checkout of a previous approved Tanja source commit and re-import **only** its runtime/version entry. Keep unrelated games, navigation and version records. Align the gallery capture if art differs, preview/test, then make a new reviewed website commit. Obtain approval for that specific rollback push and verify Pages/live behavior. Do not reset the shared website to an old whole-site commit or force-push: that can discard other updates. Keep the current release safely retained in Git before replacement. Local preparation alone needs no live rollback.
