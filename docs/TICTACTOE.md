# Publishing TicTacToe on GitHub Pages

TicTacToe runs as static HTML, CSS, and JavaScript. There is no Node.js server or build step. After changing the game, export its files into this website repository and publish an approved commit; changes in the source folder alone do not update the website.

| Item | Location |
| --- | --- |
| Editable game | `E:\dev\AI-projects\games\tictactoe` |
| Export script | `E:\dev\AI-projects\games\tictactoe\export-pages.ps1` |
| Website copy | `fun/tictactoe/` in this repository |
| Gameplay screenshot | `assets/games/tictactoe.png` in this repository |

## Export and preview

Make changes in the editable game folder, then run these commands in PowerShell:

```powershell
Set-Location "E:\dev\dejans11.github.com"
& "E:\dev\AI-projects\games\tictactoe\export-pages.ps1" -SitePath (Get-Location).Path
python -m http.server 8080 --bind 127.0.0.1
```

The export copies `index.html`, `main.js`, `style.css`, and `favicon.svg`. It leaves the other games alone and does not commit or push. Python is only for the local preview; GitHub Pages serves the exported files directly. Node.js, npm, and Vite are not needed for these steps.

Open http://127.0.0.1:8080/fun/tictactoe/. Check alternating turns, X and O wins, a draw, and Reset Game. On http://127.0.0.1:8080/fun/, check the game link and screenshot modal. Stop the preview with Ctrl+C.

## Publish the update

Review and commit the website changes on `master`:

```powershell
git status --short
git diff -- fun/tictactoe/
git add fun/tictactoe/
git commit -m "Update TicTacToe"
git log --oneline origin/master..HEAD
```

If you also changed the screenshot, game catalogue, homepage, or documentation, review and include those files in the commit too.

Explicitly approve the repository, branch, and commits before pushing. After approval:

```powershell
git push origin master
```

Check **Actions → pages build and deployment**, then open https://dejans11.github.io/fun/tictactoe/ and play a round. If the previous version appears, reload without cache. See [the general publishing guide](PUBLISHING.md) for the Pages configuration.

## Future changes

- Always edit the source game and rerun the export; editing `fun/tictactoe/` directly would be overwritten by the next export.
- If you add an image, sound, or other runtime file, add it to `$files` in `export-pages.ps1`. Keep paths relative, such as `./main.js`, so they work under `/fun/tictactoe/`.
- The export does not refresh the catalogue screenshot. After a visual change, capture a game in progress and update `assets/games/tictactoe.png` separately.
- If you move either local folder, use its new path in the commands above. `-SitePath` must point to the website repository root.
