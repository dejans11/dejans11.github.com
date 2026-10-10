# Analytics setup and maintenance

This website uses Umami Cloud for automatic pageview statistics. GitHub Pages serves the files directly; there is no analytics server, build step, npm package, or account credential in this repository.

## Configuration and coverage

| Setting | Value |
| --- | --- |
| Production host | `dejans11.github.io` |
| Public website ID | `bd7ebc04-50fb-411f-a235-319790223f5d` |
| Tracker URL | `https://cloud.umami.is/script.js` |
| Configuration | `assets/analytics.js` |
| Visitor notice | `/privacy.html` |

The website ID is a public collection identifier, not a password or API key. The Umami website's Domain should be `dejans11.github.io`; it helps Umami exclude the site from its own referrers. The loader separately restricts collection to that production hostname.

Each tracked HTML page contains one deferred reference to `/assets/analytics.js` marked with `data-site-analytics`. It creates the configured Umami script once. These paths share a single Umami website entry:

- `/`
- `/projects/`
- `/fun/`
- `/fun/blobs/`
- `/fun/warblade/`
- `/fun/tictactoe/`
- `/fun/lale-manager/` (Footsi; prepared locally, pending approved publication)
- `/fun/girl-in-fire/` (Girl in Fire; URL correction prepared locally, pending approved deployment; previous `/fun/tanja/` release published 10 October 2026)

The privacy page, design previews, and legacy Octopress pages are not instrumented. The absolute loader path assumes this personal site is published at the domain root.

The loader sends no request to Umami on localhost, `127.0.0.1`, file previews, or other hosts. On production it respects Do Not Track, excludes search parameters and fragments from reported page URLs, and leaves normal automatic pageview tracking enabled. It does not identify users or enable custom click events, game telemetry, session recordings, or heatmaps. The Umami tracker is cookieless; its standard statistics include referring sites, browser/device details, and approximate geographic information.

Change the website ID or tracker URL only in `assets/analytics.js`. When changing the production host, update its `domain` constant, the Umami website settings, this guide, and the privacy notice as appropriate. URL query stripping means campaign reporting should be deliberately reviewed before adding UTM campaigns.

See Umami's [website setup](https://docs.umami.is/docs/add-a-website), [tracker installation](https://docs.umami.is/docs/collect-data), [configuration options](https://docs.umami.is/docs/tracker-configuration), and [collected data](https://docs.umami.is/docs/faq).

## Game updates

For Blobs and Warblade, continue using `npm run import:games`. `scripts/site-analytics.mjs` adds one loader reference to each staged game HTML file before publication, replacing any existing marked reference. Other runtime files retain their committed source bytes. The source repositories remain unchanged. A missing or ambiguous closing head tag rejects the export before replacing the working game.

For TicTacToe, use the website-owned PowerShell exporter:

```powershell
./scripts/import-tictactoe.ps1 -SourcePath "E:\dev\AI-projects\games\tictactoe"
```

It defaults to this website's root as `SitePath`; specify `-SitePath` for another checkout. It validates the required files and HTML head, rejects linked output directories, copies the four runtime files, and adds the same loader to the website HTML. It requires PowerShell, with no Node.js dependency. Do not use the source folder's older `export-pages.ps1`: it copies the uninstrumented HTML over the published copy.

For Footsi (source project Retro Football Manager), use `npm run import:lale-manager -- --source <built-dist-folder>`. Its website HTML receives the public name, shared loader and a privacy link; the source and downloadable offline ZIP remain untouched. It sends pageviews only, with no careers, scores, moves or transfer bids. The existing `/fun/lale-manager/` URL remains in use. See [Footsi updates](LALE-MANAGER.md).

See [publishing games](PUBLISHING.md) and [TicTacToe updates](TICTACTOE.md).

For Girl in Fire (Tanja), use `npm run import:games -- --tanja <clean-committed-checkout>`. Hosted HTML gains the shared loader/privacy link and public name; the source/offline package retains the concept and no analytics. Sound starts off on every load. Best scores stay local; no game actions, audio settings or scores are submitted. Local/controlled-host checks pass. After publication on 10 October 2026, the actual game pageview received HTTP200 from `https://gateway.umami.is/api/send` with the correct website ID and query/fragment excluded. Collector acceptance is verified; authenticated dashboard display was not inspected. See [Girl in Fire publishing](TANJA.md).

The URL correction moves the instrumented runtime to `/fun/girl-in-fire/`. The old `/fun/tanja/` redirect has no analytics loader, so it does not add a duplicate pageview. Confirm the new path at the real collector after the separately approved deployment; earlier live evidence covers the original path.

## Exclude your own visits

On `https://dejans11.github.io/`, open the browser developer console and run:

```javascript
localStorage.setItem('umami.disabled', '1');
```

Reload. Umami stops sending analytics in that browser profile for this origin, including all tracked paths. The external script can still load; the flag disables collection. Visits before setting the flag may already have been recorded. Set it separately in each browser/profile you use; clearing site storage removes it.

To temporarily allow a verification visit:

```javascript
localStorage.removeItem('umami.disabled');
```

Reload, verify collection, and restore the flag afterward if desired. See [Umami's opt-out instructions](https://docs.umami.is/docs/exclude-my-own-visits).

## Verify collection

Before publication:

1. Run `npm test`. The tests cover loader eligibility, duplicate initialization, Do Not Track, and game export preservation. The TicTacToe tests run when PowerShell is available; they report a skip otherwise.
2. Preview with `python -m http.server 8080 --bind 127.0.0.1`.
3. Open all tracked pages. Each should load `/assets/analytics.js` once and make no request to `cloud.umami.is` locally.
4. Check that the games, screenshot modal, and footer privacy links work. The privacy page should have no analytics loader.
5. Review and commit the changes locally. Obtain explicit approval of the repository, branch, and commits before pushing. This also applies to private game repositories.

After an approved push and successful Pages deployment:

1. Use a browser with JavaScript enabled, Do Not Track off, analytics blocking off, and no `umami.disabled` flag.
2. In the Network panel, check that `/assets/analytics.js` and `https://cloud.umami.is/script.js` load and that the tracker sends a successful collection request to Umami. The current Cloud tracker sends collection requests to `https://gateway.umami.is/api/send`, separately from its script host.
3. Visit each tracked path and confirm its pageview in the Umami dashboard. Check a URL such as `/projects/?check=example#sample`: the collection payload's page URL should be `https://dejans11.github.io/projects/`, with no query string or fragment.
4. Turn on Do Not Track or set the owner opt-out and reload. Confirm there are no collection requests. Test that the games still work when Umami is blocked.

Local tests cannot confirm reception in your authenticated Umami dashboard. Production dashboard verification remains a post-deployment check.

## Quota, retention, and exports

As of 2026-10-10, the free Hobby plan includes one website, 100,000 events per month, and six months of retention. Confirm your actual plan in Umami account settings. Pageviews, custom events, and stored event properties count toward usage; extra telemetry would increase it.

Review usage in the Cloud dashboard and export statistics there before the retention window expires if you want a longer history. Availability of API access depends on the plan. Current terms and export details are on [Umami's pricing page](https://umami.is/pricing).

## Troubleshooting and disabling

- **Nothing appears locally:** expected; only the production host is eligible.
- **No production pageviews:** check the public website ID, exact hostname, Do Not Track, owner opt-out, blockers, and the Network panel. Confirm the latest Pages deployment finished.
- **Tracker blocked or unavailable:** the site and games remain functional. Some visitors will not be counted; analytics is not an exact visitor census.
- **Tracking disappears after a game update:** use the website-owned exporter for that game. Re-export and confirm one marked loader in the game HTML.
- **Duplicate pageviews:** check for an extra direct Umami snippet or another analytics integration. Keep only the shared marked loader; do not also paste the original Cloud snippet into the pages.
- **Missing query strings or fragments:** intentional privacy settings. Review the configuration and visitor notice before changing collection.

To pause collection everywhere, put `return;` at the beginning of the function in `assets/analytics.js`, before the hostname check, and publish that change after explicit push approval. The game exports can keep their loader references. To restore collection, remove that early return. Update the public privacy notice if analytics is permanently removed. Stopping collection does not delete historical data held in Umami.
