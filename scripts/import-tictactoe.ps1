param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    [string]$SitePath = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$site = (Resolve-Path -LiteralPath $SitePath).Path
$source = (Resolve-Path -LiteralPath $SourcePath).Path
if (!(Test-Path -LiteralPath (Join-Path $site '.nojekyll') -PathType Leaf) -or
    !(Test-Path -LiteralPath (Join-Path $site 'fun\index.html') -PathType Leaf)) {
    throw 'SitePath must point to the personal GitHub Pages repository.'
}

$files = @('index.html', 'main.js', 'style.css', 'favicon.svg')
foreach ($file in $files) {
    if (!(Test-Path -LiteralPath (Join-Path $source $file) -PathType Leaf)) {
        throw "Missing game file: $file"
    }
}

$html = [System.IO.File]::ReadAllText((Join-Path $source 'index.html'))
if ([regex]::Matches($html, '(?i)</head\s*>').Count -ne 1) {
    throw 'Game HTML must contain exactly one closing head tag for site analytics.'
}
$html = [regex]::Replace($html, '(?is)\s*<script\b[^>]*\bdata-site-analytics\b[^>]*>[\s\S]*?</script\s*>', '')
$newline = if ($html.Contains("`r`n")) { "`r`n" } else { "`n" }
$loader = '  <script defer src="/assets/analytics.js" data-site-analytics></script>'
$html = [regex]::Replace($html, '(?i)</head\s*>', "$loader$newline</head>")

$destination = Join-Path $site 'fun\tictactoe'
if ($source -eq $destination) { throw 'SourcePath must be the editable game folder, not the website copy.' }
foreach ($directory in @((Join-Path $site 'fun'), $destination)) {
    if (Test-Path -LiteralPath $directory) {
        $entry = Get-Item -LiteralPath $directory -Force
        if (!$entry.PSIsContainer -or ($entry.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
            throw 'Game output must be a real directory, not a symbolic link or junction.'
        }
    }
}
New-Item -ItemType Directory -Path $destination -Force | Out-Null
foreach ($file in $files | Where-Object { $_ -ne 'index.html' }) {
    Copy-Item -LiteralPath (Join-Path $source $file) -Destination (Join-Path $destination $file)
}
[System.IO.File]::WriteAllText((Join-Path $destination 'index.html'), $html, (New-Object System.Text.UTF8Encoding($false)))

Write-Output "Exported TicTacToe with site analytics to $destination"
Write-Output 'Preview the game, then review and commit the website changes. This script does not push or deploy.'
