param(
  [string[]]$Paths = @(),
  [string]$OutputRoot = "",
  [switch]$AllPublished
)

$ErrorActionPreference = "Stop"

$siteRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupTime = Get-Date
$usingDefaultOutputRoot = [string]::IsNullOrWhiteSpace($OutputRoot)

if ($usingDefaultOutputRoot) {
  $OutputRoot = Join-Path $siteRoot "_generated\website-content-backups\latest"
}

function Get-RelativePath {
  param([string]$Path)

  $resolved = (Resolve-Path $Path).Path
  if ($resolved.StartsWith($siteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $resolved.Substring($siteRoot.Length).TrimStart("\", "/")
  }
  return $resolved
}

function Get-FrontMatterParts {
  param([string]$Content)

  $match = [regex]::Match($Content, "(?s)\A---\r?\n(.*?)\r?\n---\r?\n?")
  if (-not $match.Success) {
    return @{
      FrontMatter = ""
      Body = $Content.TrimStart()
    }
  }

  return @{
    FrontMatter = $match.Groups[1].Value
    Body = $Content.Substring($match.Length).TrimStart()
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

function Test-PublishedContent {
  param(
    [string]$FrontMatter,
    [DateTime]$Now
  )

  $draft = (Get-MetaValue -FrontMatter $FrontMatter -Key "draft").ToLowerInvariant()
  if ($draft -eq "true") {
    return $false
  }

  $dateValue = Get-MetaValue -FrontMatter $FrontMatter -Key "date"
  if (-not [string]::IsNullOrWhiteSpace($dateValue)) {
    $parsedDate = [DateTimeOffset]::MinValue
    if ([DateTimeOffset]::TryParse($dateValue, [ref]$parsedDate)) {
      if ($parsedDate.LocalDateTime -gt $Now) {
        return $false
      }
    }
  }

  return $true
}

function Convert-ToSafeFileName {
  param([string]$Value)

  $safe = $Value
  foreach ($char in [System.IO.Path]::GetInvalidFileNameChars()) {
    $safe = $safe.Replace($char, "_")
  }
  $safe = [regex]::Replace($safe, "\s+", " ").Trim()
  if ($safe.Length -gt 90) {
    $safe = $safe.Substring(0, 90).Trim()
  }
  if ([string]::IsNullOrWhiteSpace($safe)) {
    return "untitled"
  }
  return $safe
}

function Get-ContentFiles {
  if ($Paths.Count -gt 0) {
    return $Paths |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
      ForEach-Object {
        $fullPath = Join-Path $siteRoot $_
        if (-not (Test-Path $fullPath)) {
          throw "Cannot find content file: $_"
        }
        Get-Item $fullPath
      } |
      Where-Object {
        $_.Extension -eq ".md" -and
        $_.Name -ne "_index.md" -and
        ($_.FullName -like (Join-Path $siteRoot "content\posts\*") -or
         $_.FullName -like (Join-Path $siteRoot "content\videos\*"))
      }
  }

  return @("content\posts", "content\videos") |
    ForEach-Object { Join-Path $siteRoot $_ } |
    ForEach-Object { Get-ChildItem -Path $_ -File -Filter "*.md" } |
    Where-Object { $_.Name -ne "_index.md" }
}

$contentFiles = @(Get-ContentFiles)
$backupItems = @()

if ($usingDefaultOutputRoot -and (Test-Path $OutputRoot)) {
  Remove-Item -LiteralPath (Join-Path $OutputRoot "*") -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

foreach ($file in $contentFiles) {
  $raw = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  $parts = Get-FrontMatterParts -Content $raw

  if (-not (Test-PublishedContent -FrontMatter $parts.FrontMatter -Now $backupTime)) {
    continue
  }

  $relativePath = Get-RelativePath -Path $file.FullName
  $type = if ($relativePath -like "content\videos\*") { "影片" } else { "文章" }
  $title = Get-MetaValue -FrontMatter $parts.FrontMatter -Key "title"
  $date = Get-MetaValue -FrontMatter $parts.FrontMatter -Key "date"
  $youtube = Get-MetaValue -FrontMatter $parts.FrontMatter -Key "youtube"

  if ([string]::IsNullOrWhiteSpace($title)) {
    $title = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
  }

  $datePrefix = if ($date -match "^\d{4}-\d{2}-\d{2}") {
    $date.Substring(0, 10).Replace("-", "")
  } elseif ($file.BaseName -match "^(\d{8})") {
    $matches[1]
  } else {
    "nodate"
  }

  $baseName = "$(Convert-ToSafeFileName $type)__$datePrefix`__$(Convert-ToSafeFileName $title)"
  $targetPath = Join-Path $OutputRoot "$baseName.txt"
  $counter = 2
  while (Test-Path $targetPath) {
    $targetPath = Join-Path $OutputRoot "$baseName-$counter.txt"
    $counter += 1
  }

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("自由人生實驗室網站文章備份")
  $lines.Add("")
  $lines.Add("類型: $type")
  $lines.Add("標題: $title")
  if (-not [string]::IsNullOrWhiteSpace($date)) {
    $lines.Add("日期: $date")
  }
  if (-not [string]::IsNullOrWhiteSpace($youtube)) {
    $lines.Add("YouTube: https://youtu.be/$youtube")
  }
  $lines.Add("原始檔案: $relativePath")
  $lines.Add("備份時間: $($backupTime.ToString("yyyy-MM-dd HH:mm:ss zzz"))")
  $lines.Add("")
  $lines.Add("---- 正文開始 ----")
  $lines.Add("")
  $lines.Add($parts.Body.Trim())
  $lines.Add("")
  $lines.Add("---- 正文結束 ----")

  Set-Content -LiteralPath $targetPath -Value $lines -Encoding UTF8

  $backupItems += [pscustomobject]@{
    Type = $type
    Title = $title
    Date = $date
    Source = $relativePath
    BackupFile = (Split-Path -Leaf $targetPath)
  }
}

$indexPath = Join-Path $OutputRoot "備份目錄.txt"
$indexLines = New-Object System.Collections.Generic.List[string]
$indexLines.Add("自由人生實驗室網站文章備份目錄")
$indexLines.Add("備份時間: $($backupTime.ToString("yyyy-MM-dd HH:mm:ss zzz"))")
$indexLines.Add("備份數量: $($backupItems.Count)")
$indexLines.Add("")

foreach ($item in ($backupItems | Sort-Object Type, Date, Title)) {
  $indexLines.Add("[$($item.Type)] $($item.Date) $($item.Title)")
  $indexLines.Add("  原始檔案: $($item.Source)")
  $indexLines.Add("  備份檔名: $($item.BackupFile)")
  $indexLines.Add("")
}

Set-Content -LiteralPath $indexPath -Value $indexLines -Encoding UTF8

$combinedPath = Join-Path $OutputRoot "全文合併備份.txt"
$combinedLines = New-Object System.Collections.Generic.List[string]
$combinedLines.Add("自由人生實驗室網站文章全文合併備份")
$combinedLines.Add("備份時間: $($backupTime.ToString("yyyy-MM-dd HH:mm:ss zzz"))")
$combinedLines.Add("備份數量: $($backupItems.Count)")
$combinedLines.Add("")
$combinedLines.Add("這份文件把每一篇已發布文章和影片文章集中在同一份純文字備份中。")
$combinedLines.Add("如果要找單篇文章，可以用標題搜尋。")
$combinedLines.Add("")
$combinedLines.Add("========================================")
$combinedLines.Add("")

foreach ($item in ($backupItems | Sort-Object Type, Date, Title)) {
  $combinedLines.Add("[$($item.Type)] $($item.Date) $($item.Title)")
  $combinedLines.Add("原始檔案: $($item.Source)")
  $combinedLines.Add("")
  $articlePath = Join-Path $OutputRoot $item.BackupFile
  $articleText = Get-Content -LiteralPath $articlePath -Raw -Encoding UTF8
  $combinedLines.Add($articleText.Trim())
  $combinedLines.Add("")
  $combinedLines.Add("========================================")
  $combinedLines.Add("")
}

Set-Content -LiteralPath $combinedPath -Value $combinedLines -Encoding UTF8

Write-Host "Backup export complete."
Write-Host "Output folder: $OutputRoot"
Write-Host "Published files exported: $($backupItems.Count)"
