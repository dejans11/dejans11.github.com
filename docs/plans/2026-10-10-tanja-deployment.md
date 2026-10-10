# Phase 7 — Tanja website integration implementation plan

> REQUIRED: execute inline with superpowers:executing-plans, meaningful test-first behavior and one fresh whole-phase review. The user's root/phase-review workflow overrides helper worktrees, intermediate approvals and commits. Stop with both checkouts unstaged/uncommitted; no push or publication before specific approval.

**Goal:** Prepare the existing personal site to publish Tanja at https://dejans11.github.io/fun/tanja/, with Umami online and the supplied concept kept offline.

**Architecture:** Extend the site's committed-source importer. Tanja's portable allowlist selects browser runtime files; public-only HTML changes replace the concept link with analytics privacy and add the existing Umami loader. The offline project/package bytes remain unchanged. No framework, hosting migration or new credentials.

**Stack:** Existing Node22+ standard-library export/tests, plain static HTML/CSS/classic JS/Canvas/PNG/WAV, existing branch-root GitHub Pages. Python loopback preview/private browser verification are developer tools only.

**Spec:** [Tanja publishing contract](../TANJA.md).

## Global constraints

- Source checkout C:/dev/games/tanja main at 2a6d9c4 must be clean when exporting; site checkout E:/dev/dejans11.github.com master starts at 19f523b. Export before adding source-project deployment docs, so no dirty-source bypass is needed.
- Preserve source index/src/assets and offline ZIP; concept image/link remain there, never in the public export. Export runtime files only, from Git blobs, no working-copy/private/docs/source-art/history files.
- Hosted index alone gains the existing /assets/analytics.js loader and /privacy.html footer link. Do Not Track/host gating remain unchanged. No analytics installation or credentials.
- Preflight all requested games before replacing output. Validate manifest/path/registered asset integrity and supported relative runtime dependencies. Failures preserve prior games/version records.
- Preserve Blobs/Warblade/TicTacToe output, gallery behavior, site style and Pages setup. No recursive deletion outside verified owned staging/fixtures.
- Stop Phase 7 prepared for review. No staging/commits/push. Live URL, Pages completion and Umami dashboard reception must not be reported before publication.

## Review focus

1. Malformed, aliased, case-colliding or unsafe portable manifests must not publish private/reference files or lose a previous working export.
2. Runtime URLs, missing optional WAVs, source Git flags and symlink/junctions must not silently corrupt the nested /fun/tanja/ game or read unpublished working bytes.
3. Hosted HTML must contain exactly one Umami loader and a working privacy link, with no concept-image request; local/offline contexts must remain tracking-free.
4. Another game/version, source checkout, homepage/lightbox accessibility and responsive catalogue layout must remain functional after importing Tanja.
5. Documentation must distinguish verified local readiness from actual publication, state the two-repository update/approval sequence and give a safe rollback.

## Task 1 — committed public export

Files: scripts/import-games.mjs, new scripts/tanja-export.mjs, new tests/import-tanja.test.mjs. Interface: tanjaRelease(readCommitted) returns selected files/version; publicTanjaHtml(html) transforms only the hosted HTML; existing CLI gains --tanja <clean-checkout>. Version record adds source release version to the existing commit/importedAt fields.

- [x] Write isolated Git-fixture cases before implementation: runtime selection, unchanged source/other games, Umami/privacy/no concept, committed-byte sourcing, missing/corrupt assets/dependencies, unsafe/duplicate/aliased manifests, dirty source, reimport and failure preservation.
- [x] Observe meaningful failures for unsupported Tanja export; implement the smallest helper/importer extension, then run the full website suite.
- [x] Import the actual clean source before source-project doc edits. Verify 29 runtime members and Git-blob hashes, transformed HTML only, no concept/private files and unchanged other games/version records.

## Task 2 — catalogue, nested browser acceptance and docs

Files: site index.html, fun/index.html, assets/games/tanja.png, README/docs(PUBLISHING/ANALYTICS/TANJA), Tanja README/docs(ROADMAP/DECISIONS/TESTING/DEPLOYMENT and review). Scratch evidence stays in Tanja output/phase7.

- [x] Add homepage/Fun Play links and native gameplay screenshot with the existing accessible lightbox; retain site styles.
- [x] Preview actual exported /fun/tanja/ at loopback; full Chrome/Firefox round, audio/pause/replay/best, local analytics loader/no remote tracker, no concept request, catalogue popup/screenshot/mobile layout. Check existing exports unaffected.
- [x] Assert production Umami loader configuration using controlled production-host browser responses; no real tracker requests or dashboard claims. Keep offline concept/hash identity checks.
- [x] Add both projects' export/update/rollback/approval documentation and actual verification limits. Verify links/whitespace/syntax/assets/empty indexes.
- [x] Fresh whole-phase read-only review, material fix pass, close only private sessions/server, stop for user review. Deployment/production smoke test/dashboard docs remain a later approved-push step.

## Execution ledger

- User approved the discussed integration with hosted Umami, offline-only concept and both-project docs by saying do it. Existing no-commit-until-review and specific remote-push approval remain in force.
- Ruling: work in the two requested existing clean root checkouts — preserve the established root/review workflow, no unnecessary worktree or branch change — cost if concurrent edits appear: preserve them and reconcile, never reset others' work.
- Ruling: primary plan/spec initially live in the website project and actual export precedes source-project docs — importer must keep its clean-source guard — cost: re-export after subsequent source docs requires committing the source first.
- Preflight: Task1 committed export feeds Task2 nested preview; source runtime/allowlist are unchanged, only website HTML is transformed. Site-owned Umami loader exists and needs no new account settings. Both checkouts start clean; no project-scoped site AGENTS.md was found.
- Ruling: preserve concurrent Retro Football Manager changes in the shared website — another actor is adding it during this phase — cost if wrong: shared catalogue/docs require careful selective review and commit later.
- Ruling: keep /fun/tanja/ and the source/offline title, but make site display/title/heading/footer Girl in Fire — user asked to change the app name on the site — cost if wrong: a route rename can be a later explicit change; existing technical provenance stays stable.
- Ruling: keep sound off on every initial load/reload — requested twice and already guaranteed by the approved runtime — cost if wrong: no persisted sound preference; players opt in each visit.
- Ruling: after untracked review captures made the root dirty, re-export the display-name update from an ignored clean local clone of the same 2a6d9c4 commit — preserve the guard/no-commit gate — cost if wrong: the clone is scratch evidence, not a second development branch; future root imports require reviewed source commits.
- Task1 complete: isolated fixtures observed unsupported-export and hosted-name assertion failures before implementation; full site npm test54/54 green. Actual clean committed exports are29 files; Git-blob/public/offline/other-release preservation checks pass. Initial import and the final name re-import each preserve the other version records; later concurrent manager updates are independent.
- Task2 acceptance: native nested Chrome/Firefox full rounds, sound off/gesture media/pause/replay/best; native catalogue dialog/focus/Play/privacy/mobile; controlled production loader/DNT/blocked tracker with no real pageviews. Native screenshots retained; both-project guides/status/rollback added.
- Harness notes: viewer focus checked before afterShow (wait for actual focus); Firefox error array read after reload (collect before); reused Chrome best1200 requires resetting only this game's key in the private profile before asserting incremental best scores. No product fix. Initial helper launch was rejected; managed loopback server and direct private Firefox used successfully. Source capture dirtiness is expected; root export refuses it.
- Final checks: source behavior72/72; release18 cases17pass/one Windows file-symlink privilege skip; asset9reference/13source/12runtime and6WAV verified;32-file offline archive current-source verification and SHA preserved;211doc links/whitespace/empty indexes pass. Website54/54; source/site syntax and stable other-game byte checks pass.
- Native captured review inspected after final name: Chrome154.0.8037.98/Firefox157.0.1 full rounds; catalogue390px and hosted popup explicitly390px/200% text. The popup originally inherited desktop default despite the base catalogue viewport; corrected the harness and native narrow capture passed. A transient loopback connection refusal disappeared with a quiet private server/expanded request queue; final Chrome has zero failed requests. No player code changed.
- Final review: no Critical/Minor findings; two Important exporter gaps. Re-graded by operator effect, both require fixes before handoff.
- Final: fixed directory-prefix case aliases — real clean Git fixture carrying A/foo.png and a/bar.png RED before prefix validation; preserves prior runtime/versions after guard, full suite72/72.
- Final: fixed absent/ambiguous hosted requirements — eight missing/changed/duplicate anchor/title/heading/footer/unmarked-loader regressions RED before postcondition checks; preserve prior runtime/versions after guard, full suite72/72. Dependency tests retain valid title/heading/footer so they still exercise the dependency scanner.
- Actual-source final helper validation accepts29 members and outputs byte-identical hosted HTML, so native browser acceptance remains applicable. No re-import/other release changes needed for validation-only fixes.
- Final: Ruling: computed/escaped/inline-script dependencies remain the documented static-scanner boundary — current runtime uses supported literals and native network acceptance passes — cost if wrong: future forms need scanner/tests/browser review before import.
- Final: Ruling: independent Retro Football Manager internals remain that actor's responsibility — checked shared catalogue/versions and preserved its bytes — cost if wrong: future integration still needs selective commits.
- Final: Ruling: Pages and real Umami reception remain post-approved-push checks — local/controlled-host tests cannot establish live publication — cost if wrong: deployment/dashboard may still need correction.
- Final: Ruling: physical phones/listening/Windows minimize remain existing manual limits — headless native desktop evidence is labeled accurately — cost if wrong: device-specific behavior awaits manual testing.
- Final: Ruling: general OS-crash/storage-write atomicity of the existing version writer is outside the validated preflight-failure contract — predates this change, not reproduced, no new crash-safety promise — cost if wrong: interrupted writes can require version-record recovery; retain reviewed release history before updates.
- Live read-only check after the user's missing-link report: homepage/Fun200 with no Girl in Fire/Tanja link; /fun/tanja/404. Expected: current site files have not been committed or pushed by this phase. Live status remains pending, not claimed complete.

- Task2 complete: one fresh gpt-6-astra/high read-only whole-phase review, two Important fixes RED→GREEN and suite72/72, native captures inspected, owned Chrome/Firefox/loopback preview closed. No temporary worktree. Both indexes empty; source main2a6d9c4/site master19f523b unchanged. User phase-review workflow overrides finish-menu/commit steps; stop with local files prepared. Specific push approval and production follow-up remain pending.
- Local commits approved on 10 October 2026 by go go go after the review handoff. Source review/docs and three focused website commits are prepared locally. Only Tanja changes enter these commits; the concurrent manager's working files remain untouched. Website shared-file index snapshots omit its unapproved release/docs while preserving the full working files. No push is authorized until exact repository/branch/commits are presented and approved.
- Commit verification: the exact Tanja-only committed website snapshot passes50/50, with no manager release/artifacts; the combined working-checkout72/72 includes its22 separate pending tests. Selective index staging preserved concurrent working content; another actor subsequently renamed that game Footsi and re-exported it. Current residual diff is its work, not discarded or committed here. Source72/72 and offline package checks pass. The clean temporary export clone was removed after confirming its commit is retained; no stale worktree metadata. Origin/master is still19f523b; no push has occurred.
