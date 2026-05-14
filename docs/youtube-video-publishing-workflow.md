# YouTube 影片發布流程規範

這份文件記錄《自由人生實驗室》網站新增 YouTube 影片時的固定流程。目標是讓影片能穩定出現在首頁時間線與 `/videos/` 影片頁，並避免未來日期、縮圖失效、部署未產出等問題。

## 1. 取得影片資訊

拿到 YouTube 連結後，先取得：

- YouTube 影片 ID
- 影片正式標題
- YouTube oEmbed 回傳的縮圖網址
- 使用者提供的影片說明文字

優先用 YouTube oEmbed 確認標題與縮圖。若 PowerShell 網路請求失敗，可用 bundled Python 讀取 oEmbed。

## 2. 新增影片內容檔

每支影片在 `content/videos/` 新增一個 Markdown 檔。

檔名格式建議：

```text
YYYYMMDD-集數-英文短標題.md
```

例如：

```text
20260515-004-shoot-without-waiting.md
```

## 3. Front Matter 欄位

每支影片至少要包含：

```yaml
---
title: "影片完整標題"
date: 2026-05-15T00:04:00+08:00
categories: ["生活實驗"]
tags: ["自由人生實驗室", "影片創作"]
author: "garrolan"
youtube: "YouTube影片ID"
thumbnail: "https://i.ytimg.com/vi/YouTube影片ID/hqdefault.jpg?v=YYYYMMDD"
description: "首頁卡片用的簡短說明。"
draft: false
---
```

日期注意事項：

- 如果是當天發布，時間不要設成未來時間。
- 保守做法是用 `00:xx:00+08:00`，避免 GitHub Actions / Hugo 因時區或部署時間判定為未來內容。
- Hugo 預設會跳過未來日期內容，這會造成「GitHub 已推送，但網站看不到」。

縮圖注意事項：

- 預設使用 oEmbed 回傳的 `hqdefault.jpg`，最穩定。
- 不要直接預設 `maxresdefault.jpg`，因為不是每支影片都會產生高解析縮圖。
- 若要使用 `maxresdefault.jpg`，要先確認該圖片實際存在；否則網站會出現 YouTube 灰色佔位圖。
- 網址後可加 `?v=YYYYMMDD`，降低瀏覽器一直顯示舊縮圖快取的機率。

## 4. 內文格式

影片內容檔正文建議順序：

1. YouTube shortcode
2. 影片總說明
3. `## 影片重點`
4. 條列或小標題整理重點
5. 自由人生實驗室連結
6. hashtags

YouTube shortcode 格式：

```go-html-template
{{< youtube YouTube影片ID >}}
```

## 5. 首頁與影片頁顯示規則

目前網站設定是內容驅動：

- `content/videos/` 會產生 `/videos/` 影片頁。
- 首頁會混合 `posts` 與 `videos`，依日期由新到舊排列。
- 不要再新增固定的首頁影片區塊，避免影片永遠卡在文章上方。

## 6. 發布檢查

提交前檢查：

```powershell
git status --short --branch
git diff --check
git diff --stat
```

如果本機沒有 `hugo`，不要宣稱已完成本機 Hugo 預覽。改用檔案檢查、Git 檢查與部署分支確認。

## 7. Git 發布

只 stage 相關檔案，例如：

```powershell
git add -- content/videos/YYYYMMDD-xxx.md
git commit -m "add video: short english title"
git push origin main
```

如果遇到 `.git/index.lock` 權限問題，依照目前環境慣例用提升權限重試 Git 指令。

## 8. 部署確認

推送後至少確認：

- `git status --short --branch` 回到 `## main...origin/main`
- GitHub 遠端 `main` 已是最新提交
- `origin/gh-pages` 部署提交訊息對應到最新 `main` 提交
- 部署輸出的 `videos/index.html` 或首頁含有新影片標題 / 影片 ID

若網站看不到新影片，優先檢查：

1. 影片日期是否被 Hugo 判定為未來內容
2. GitHub Pages 是否還沒部署完成
3. `gh-pages` 是否已部署到最新提交
4. 瀏覽器快取是否尚未刷新
5. 縮圖網址是否有效，尤其是否誤用不存在的 `maxresdefault.jpg`
