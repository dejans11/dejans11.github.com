# Girl in Fire — archived publishing record

## Removal requested — 12 October 2026

The user requested removal from `dejans11.github.io`. Removal is prepared locally and awaits approval of its specific website push. The public runtime at `fun/girl-in-fire/`, the old `fun/tanja/` redirect, gallery image, navigation, privacy paragraph and release entry are deleted. The website's `--tanja` importer and its dedicated helper are retired. After Pages publishes the approved removal, both game URLs and the former gallery image should return 404.

The local source project and offline package remain available separately. The records below preserve the earlier publication and verification history; their export commands describe the retired integration and are no longer active.

## Historical publication and testing

Girl in Fire is the site's display name for **Tanja — Paratroopers Over Mostar**. Its public address is [Girl in Fire](https://dejans11.github.io/fun/girl-in-fire/); the hosted directory is `girl-in-fire`, while the source name, `--tanja` exporter option and `tanja` version-record key remain unchanged. Sound starts **off on every page load**, including reload. Players can enable it through the Sound button.

## Current status — 10 October 2026

**Published on 10 October 2026.** The user approved the specific push of website commits `41e5656`, `92a3507` and `963ed70` to `dejans11/dejans11.github.com`, `origin/master`, while requesting no new branches. The website's existing default/publishing branch is `master`; Tanja uses `main`. No branch was created or renamed, and no source push was needed. The [Pages deployment](https://github.com/dejans11/dejans11.github.com/actions/runs/38033412047) completed successfully at 07:09:21 UTC for `963ed70fcdc2bdd1fd2ae1c623dd3d404dae1788`.

The 29-file runtime export records source commit `2a6d9c4369bf` and release `0.1-review` in [game versions](../fun/game-versions.json). At 07:11 UTC, all 35 checked live files matched that website commit by SHA-256: game runtime, homepage/Fun, privacy, analytics loader, screenshot and version manifest. Both catalogue links were present; the excluded original-concept path returned 404. Concurrent football-manager work was excluded from that initial push. Subsequent website documentation is included in the locally committed URL correction below; source documentation remains uncommitted for review.

The source checkout is `C:\dev\games\tanja` (`main`); the website is `E:\dev\dejans11.github.com` (`master`, origin `dejans11/dejans11.github.com`). Existing site docs describe branch-root Pages with `.nojekyll`. Confirm **Settings → Pages → master / root** before an approved push; authenticated remote settings were not inspected here. See [GitHub's source configuration](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Public URL correction

The user requested that the public URL also match Girl in Fire and be deployed, then approved the five explicitly listed website commits with “push”. Commits `c2a4502`, `94628b8`, `913a91e` (Footsi) and `3f46ee9`, `854f53f` (Girl in Fire) were pushed to the existing `origin/master`. [Pages deployment38035065782](https://github.com/dejans11/dejans11.github.com/actions/runs/38035065782) succeeded at 07:38:02 UTC on 10 October 2026 for `854f53f61758c15a48c43b54e960201eab7584c6`. No branch was created or renamed; no source push was needed.

Homepage/Fun links and future `--tanja` exports now target `/fun/girl-in-fire/`; the version record adds `path: "fun/girl-in-fire/"`. The original 29 runtime files are moved unchanged, and the gallery capture is renamed to `assets/games/girl-in-fire.png`. `/fun/tanja/` contains only an analytics-free redirect with a canonical link and a visible fallback link; its previous runtime files are removed. At 07:39 UTC, all36 checked public files matched the deployed commit by SHA-256, including both catalogue pages and the redirect. The new concept path returns404. Post-push documentation updates remain local and uncommitted for review.

Saved best scores survive the route change because the origin and `tanja.bestScore.v1` key are unchanged. The sound setting still resets to off. Initial publication evidence below refers to the earlier `/fun/tanja/` release; the URL correction is now published at `/fun/girl-in-fire/`. Website regressions pass72/72, including canonical-directory export/reimport and failure preservation.

Private Chrome154 completes a native-input ten-visitor/two-boss/1200 round at the new loopback URL, with pause/audio/replay/title/no11/best reload and initial/reload Sound off. Revisiting the old bookmark redirects correctly and retains best1200 with Sound off. Final run has zero page/console errors or failed requests and sends no local analytics. All29 runtime files and the gallery image match the initial published bytes.

Published acceptance at the new actual URL also passes in Chrome154.0.8037.98: ten encounters, two bosses,1200 points, native Canvas input, real audio, pause/replay/title/no11, saved best1200 and initial/reload Sound off. Old-bookmark navigation reaches `/fun/girl-in-fire/` with best1200 retained and Sound off. No page/console errors, failed requests or original-concept requests. Real Umami collection returned200 for the new path with query/fragment excluded; no old-route pageview was submitted. Authenticated dashboard display remains unchecked. The private browser is closed; latest records remain local and uncommitted.

## Export and preview

Make and verify game changes in Tanja first. Obtain approval before committing them. The exporter requires a clean committed source, including documentation changes; never discard work or hide modifications to bypass that guard. From the website root with Git and Node22+:

```powershell
node scripts/import-games.mjs --tanja "C:\dev\games\tanja"
npm test
python -m http.server 8080 --bind 127.0.0.1
```

`npm run import:games -- --tanja <checkout>` is equivalent. No npm installation, bundler, player installation or new account is needed. The source is read without modification; the exporter makes no commit/push/deployment. Open `http://127.0.0.1:8080/fun/girl-in-fire/` and follow the homepage/Fun Play links. Stop the preview with Ctrl+C.

The current export originally used the clean source root. After review captures made that root dirty, the name update was re-exported from an ignored clean local clone of the **same committed source**, without bypassing the guard or committing pending work. Later updates should use a reviewed clean checkout.

## What becomes public

The committed `release/player-files.json` selects `index.html`, direct `src/css/*.css` and `src/js/*.js` files, and `assets/runtime/**/*.png` / `*.wav`. All 12 PNGs and six WAVs ship, including optional audio. All 28 non-HTML files retain their exact committed bytes. Only HTML receives the public display name, shared analytics loader and privacy link.

The original concept/image link, offline README/NOTES, reference crops, source artwork, manifests, docs/tests/tools, private files and Git history are excluded from the runtime export. The concept remains in Tanja's separate offline ZIP; this site does not offer that ZIP. The gallery PNG is a native capture of actual gameplay. The browser code/assets are publicly downloadable; this procedure neither changes nor assumes source-repository visibility. Preparing the approved export does not establish the still-undecided release license.

## Validation and updates

The importer reads **Git blobs from HEAD**, not working bytes. It rejects unsupported schemas, unsafe/reserved paths, aliases, duplicate/case-colliding paths, untracked or symlink-mode members, missing registered assets and hash/length mismatches. Supported literal HTML/CSS/JS dependencies must resolve inside the runtime, apart from the shared website links. Validation/preflight failures preserve the previous export and other game/version records; this is not a crash-consistent storage transaction.

The static dependency guard covers quoted HTML resource/link attributes and srcsets, CSS URLs/imports, and supported JS asset/src/href/poster literals. It is not a parser for computed, escaped or inline-script URLs. Extend validation/tests and repeat browser network checks when those forms or new file types are introduced.

Directory-prefix casing must be consistent. The hosted transform rejects missing/ambiguous title, heading, version footer, privacy link or shared analytics loader; source markup changes require a corresponding website transform update.

Do not edit `fun/girl-in-fire/` directly; re-exporting replaces it. Website naming belongs in `scripts/tanja-export.mjs`; the output directory is configured in `scripts/import-games.mjs`. The source/offline title stays intact. For art updates, capture the actual native 640×360 Canvas as `assets/games/girl-in-fire.png` and refresh Fun description/alt text if needed. The exporter does not capture screenshots. Preserve the old-address redirect when updating the game.

## Analytics and browser data

Hosted HTML has exactly one `/assets/analytics.js` loader and `/privacy.html` link. The shared loader admits only `dejans11.github.io`, respects Do Not Track and excludes URL queries/fragments. Best score stays local under `tanja.bestScore.v1`, with an in-memory fallback. No game events, scores or sound settings are submitted; sound preferences do not persist. The source/offline game has no analytics.

See [analytics and live verification](ANALYTICS.md), [visitor notice](../privacy.html) and [Umami configuration](https://docs.umami.is/docs/tracker-configuration). Controlled production-host tests used locally fulfilled site responses and a harmless tracker stub/abort: they verify configuration, DNT gating and blocked-tracker gameplay, **not real collection or dashboard reception**.

After publication, a real game pageview was accepted with HTTP200 by `https://gateway.umami.is/api/send`, using the existing website ID. The query/fragment test visit submitted only `https://dejans11.github.io/fun/tanja/`. No game actions or scores were submitted. Collector acceptance is verified; authenticated dashboard display was not inspected. The private test browser was closed without changing the owner's browser storage.

## Verified local acceptance

- Committed Tanja-only website snapshot: 50 passes, zero failures/skips, including export/failure preservation and final review regressions. The combined working-checkout suite passed72, including22 concurrent football-manager cases that are excluded from these commits.
- Actual nested export: Chrome154 and Firefox157 complete default-random ten-visitor rounds, bosses5/10, 1200 points, no visitor11, real local audio, pause frame/audio freeze, replay/title, best1200 reload, sound off before opt-in/after reload. No game errors, missing resources, external game requests or concept requests.
- Native keyboard screenshot modal/focus containment/return, homepage/Fun Play popups and privacy navigation pass. At 390px and 200% text, controls remain usable without horizontal overflow.
- Git-blob hashes/public exclusions, offline-source/ZIP identity and other exports/version records checked around import. Concurrent Retro Football Manager work is preserved; its independent updates are not attributed to Tanja.

Tanja's `docs/art/PHASE7_WEB_REVIEW.md` holds native captures/limits. Headless desktop responsive checks do not establish physical Android/iOS behavior, Windows minimize/restore or subjective speaker listening. Earlier offline/visibility checks remain recorded in the source project.

## Verified published acceptance

Actual production Chrome154.0.8037.98 completed ten random-stamina encounters, bosses5/10 and1200 points using native Canvas mouse input. Gesture-started audio, frame/audio pause, terminal silence/no11, replay/title, saved best1200 and initial/reload Sound off pass. The final run has zero page/console errors, failed requests or original-concept requests. Live homepage/Fun title links resolve to the game;35 downloaded files match approved commit963ed70. The first visit received a transient503 for resources.js; a fresh load cleared it without a deployed-code change. The source web review contains the native live capture and precise evidence limits.

## Review, publication and follow-up

1. Review both repos. Commit only after approval, selecting Tanja changes carefully because other website work may be pending.
2. For future source updates, commit approved source changes first, then export/verify the clean checkout. A source push is not required for the website export.
3. Before any push, identify the **repository, branch and exact commits** in ordinary chat and obtain specific approval. Commit approval is not push approval; avoid implicit publishing commands.
4. After the approved site `origin/master` push, check **Actions → pages build and deployment**, then test live homepage/Fun/game/resources/privacy, full round, replay and sound-off reload.
5. Follow the analytics guide for one controlled production visit and confirm `/fun/girl-in-fire/` in Umami. Restore owner opt-out if used. Record deployed commit/date/URL and real results in this guide and Tanja's deployment/review docs. Until then retain prepared-only status for each new release.

## Rollback

Use a clean checkout of a previous approved Tanja source commit and re-import **only** its runtime/version entry. Keep unrelated games, navigation and version records. Align the gallery capture if art differs, preview/test, then make a new reviewed website commit. Obtain approval for that specific rollback push and verify Pages/live behavior. Do not reset the shared website to an old whole-site commit or force-push: that can discard other updates. Keep the current release safely retained in Git before replacement. Local preparation alone needs no live rollback.
