param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"

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

  throw "Hugo was not found. Install Hugo Extended, then run this script again."
}

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

  & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Git command failed: git $($Arguments -join ' ')"
  }
}

$targets = @("content/posts", "content/videos", "static/images")
$changes = @(git -c core.quotepath=false status --porcelain -- $targets)

if ($changes.Count -eq 0) {
  Write-Host "No new post, video, or image changes found. Nothing to publish."
  exit 0
}

Write-Host "Content that will be published:"
$paths = @()
foreach ($line in $changes) {
  $path = $line.Substring(3)
  $paths += $path
  Write-Host " - $path"
}

$hugoCommand = Get-HugoCommand
Write-Host ""
Write-Host "Running Hugo build check..."
& $hugoCommand --minify
if ($LASTEXITCODE -ne 0) {
  throw "Hugo build failed. Fix the error before publishing."
}

Write-Host ""
Write-Host "Staging content files..."
foreach ($path in $paths) {
  Invoke-Git add -- $path
}

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "publish new content"
}

Write-Host "Creating commit: $Message"
Invoke-Git commit -m $Message

Write-Host "Pushing to GitHub main. The site deployment will start after push..."
Invoke-Git push origin main

Write-Host ""
Write-Host "Publish flow complete."
Invoke-Git status --short --branch
