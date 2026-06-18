param(
  [string]$Article = "",
  [string]$Message = "",
  [switch]$NoCommit,
  [switch]$NoPush,
  [switch]$SkipLiveCheck,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$siteRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Fail {
  param([string]$Message)
  throw "[publish-ready-video] $Message"
}

function Get-RepoRelativePath {
  param([string]$Path)

  $resolved = (Resolve-Path -LiteralPath $Path).Path
  if (-not $resolved.StartsWith($siteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    Fail "Path is outside site root: $Path"
  }

  return $resolved.Substring($siteRoot.Length).TrimStart("\", "/").Replace("\", "/")
}

function Get-FrontMatter {
  param([string]$Content)

  $match = [regex]::Match($Content, "(?s)\A---\r?\n(.*?)\r?\n---\r?\n?")
  if (-not $match.Success) {
    Fail "Article is missing YAML front matter."
  }

  return @{
    Text = $match.Groups[1].Value
    Body = $Content.Substring($match.Length)
  }
}

function Get-MetaValue {
  param(
    [string]$FrontMatter,
    [string]$Key
  )

  $pattern = "(?m)^\s*$([regex]::Escape($Key))\s*:\s*(.+?)\s*$"
  $match = [regex]::Match($FrontMatter, $pattern)
  if (-not $match.Success) {
    return ""
  }

  return $match.Groups[1].Value.Trim().Trim('"').Trim("'")
}

function Invoke-Required {
  param(
    [string]$Program,
    [string[]]$Arguments
  )

  & $Program @Arguments
  if ($LASTEXITCODE -ne 0) {
    Fail "Command failed: $Program $($Arguments -join ' ')"
  }
}

function Get-HugoCommand {
  $hugo = Get-Command hugo -ErrorAction SilentlyContinue
  if ($hugo) {
    return $hugo.Source
  }

  $wingetHugo = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter hugo.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName

  if ($wingetHugo) {
    return $wingetHugo
  }

  Fail "Hugo was not found."
}

Set-Location $siteRoot

if ([string]::IsNullOrWhiteSpace($Article)) {
  $changes = @(git -c core.quotepath=false status --porcelain -- content/videos)
  $videoPaths = @(
    $changes |
      ForEach-Object { $_.Substring(3).Trim() } |
      Where-Object { $_ -like "content/videos/*.md" } |
      Sort-Object { (Get-Item -LiteralPath $_).LastWriteTime } -Descending
  )

  if ($videoPaths.Count -eq 0) {
    Fail "No changed video article found under content/videos."
  }

  $Article = $videoPaths[0]
}

$articlePath = (Resolve-Path -LiteralPath $Article).Path
$articleRelative = Get-RepoRelativePath $articlePath
$articleText = Get-Content -LiteralPath $articlePath -Encoding UTF8 -Raw
$frontMatter = Get-FrontMatter $articleText

$title = Get-MetaValue -FrontMatter $frontMatter.Text -Key "title"
$youtube = Get-MetaValue -FrontMatter $frontMatter.Text -Key "youtube"
$thumbnail = Get-MetaValue -FrontMatter $frontMatter.Text -Key "thumbnail"
$draft = (Get-MetaValue -FrontMatter $frontMatter.Text -Key "draft").ToLowerInvariant()

if ([string]::IsNullOrWhiteSpace($title)) {
  Fail "Missing title in front matter."
}

if ([string]::IsNullOrWhiteSpace($youtube)) {
  Fail "Missing youtube video id in front matter."
}

if ([string]::IsNullOrWhiteSpace($thumbnail)) {
  Fail "Missing thumbnail in front matter."
}

if ($draft -eq "true") {
  Fail "draft is true. Set draft: false before publishing."
}

if ($frontMatter.Body -notmatch "\{\{<\s*youtube\s+$([regex]::Escape($youtube))\s*>\}\}") {
  Fail "Body must start with or include: {{< youtube $youtube >}}"
}

if ($articleText -match "garrolan\.github\.io/garrosolivagant" -or $articleText -match "GARRO自由人生實驗室：") {
  Fail "Boilerplate Freedom Lab site link is still present. Remove it before publishing."
}

$thumbnailRelative = ("static/" + $thumbnail.TrimStart("/", "\")).Replace("/", "\")
if (-not (Test-Path -LiteralPath $thumbnailRelative)) {
  Fail "Thumbnail file not found: $thumbnailRelative"
}

$thumbnailRelative = Get-RepoRelativePath $thumbnailRelative

Write-Host "Ready video article:"
Write-Host " - Article: $articleRelative"
Write-Host " - Thumbnail: $thumbnailRelative"
Write-Host " - YouTube: $youtube"
Write-Host " - Title: $title"

$backupScript = Join-Path $siteRoot "scripts\export-website-content-backup.ps1"
if (Test-Path -LiteralPath $backupScript) {
  Write-Host ""
  Write-Host "Refreshing local TXT backup..."
  & powershell -NoProfile -ExecutionPolicy Bypass -File $backupScript -AllPublished
  if ($LASTEXITCODE -ne 0) {
    Fail "Backup export failed."
  }
}

Write-Host ""
Write-Host "Checking whitespace..."
Invoke-Required -Program "git" -Arguments @("diff", "--check", "--", $articleRelative, $thumbnailRelative)

Write-Host "Running Hugo..."
$hugoCommand = Get-HugoCommand
& $hugoCommand --minify
if ($LASTEXITCODE -ne 0) {
  Fail "Hugo build failed."
}

if ($DryRun) {
  Write-Host ""
  Write-Host "Dry run complete. Nothing was staged, committed, or pushed."
  exit 0
}

Write-Host ""
Write-Host "Staging only this video article and thumbnail..."
Invoke-Required -Program "git" -Arguments @("add", "--", $articleRelative, $thumbnailRelative)

if (-not $NoCommit) {
  if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "publish video article"
  }

  Write-Host "Creating commit: $Message"
  Invoke-Required -Program "git" -Arguments @("commit", "-m", $Message)
}

if (-not $NoPush) {
  Write-Host "Pushing to GitHub main..."
  Invoke-Required -Program "git" -Arguments @("push", "origin", "main")
}

if (-not $SkipLiveCheck) {
  $slug = [System.IO.Path]::GetFileNameWithoutExtension($articleRelative)
  $pageUrl = "https://garrolan.github.io/garrosolivagant/videos/$slug/"
  $imageUrl = "https://garrolan.github.io/garrosolivagant/$($thumbnail.TrimStart('/', '\'))"
  $node = Get-Command node -ErrorAction SilentlyContinue

  if ($node) {
    Write-Host "Quick live check. A 404 here usually means GitHub Pages is still deploying."
    $targetsJson = @(
      @{
        label = "page"
        url = $pageUrl
        expect = $title
      },
      @{
        label = "image"
        url = $imageUrl
        image = $true
      }
    ) | ConvertTo-Json -Compress

    $script = @"
const targets = $targetsJson;
(async () => {
  for (const target of targets) {
    const res = await fetch(target.url, { headers: { "cache-control": "no-cache" } });
    const type = res.headers.get("content-type") || "";
    let ok = res.status === 200;
    let length = 0;
    if (target.image) {
      const buffer = await res.arrayBuffer();
      length = buffer.byteLength;
      ok = ok && type.includes("image/");
    } else {
      const text = await res.text();
      length = text.length;
      ok = ok && text.includes(target.expect);
    }
    console.log(JSON.stringify({ label: target.label, status: res.status, ok, contentType: type, length }));
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(0);
});
"@
    $tempScript = Join-Path ([System.IO.Path]::GetTempPath()) "publish-ready-video-live-check.mjs"
    Set-Content -LiteralPath $tempScript -Value $script -Encoding UTF8
    try {
      & node $tempScript
    } finally {
      Remove-Item -LiteralPath $tempScript -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host ""
Write-Host "Fast video publish flow complete."
Invoke-Required -Program "git" -Arguments @("status", "--short", "--branch")
