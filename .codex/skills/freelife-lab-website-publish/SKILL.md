---
name: freelife-lab-website-publish
description: Use this for the C:\GARRO\garrosolivagant Hugo site when publishing a normal article file, updating a published article, or creating a website video article from a YouTube link plus description text.
---

# 自由人生實驗室網站發文

## 使用時機

只在 `C:\GARRO\garrosolivagant` 這個 Hugo 網站專案使用。

使用者提到以下任務時，使用這個 skill：

- 發布、上傳、推上去、更新一篇網站文章
- 將已放進專案的文章檔發布到網站
- 把 `.txt` 文章整理成可發布的 `.md` 文章
- 用 YouTube 連結建立網站影片文章
- 更新已發布的影片文章內容、標題或縮圖

不要把這個流程直接套到其他 Hugo 網站，除非已重新確認資料夾、部署分支和 GitHub Actions 設定相同。

## 開始前

先用白話告訴使用者：

1. 理解到的任務是什麼
2. 會查看或修改哪些檔案
3. 預期完成後網站會有什麼變化
4. 若會發布到 GitHub，要提醒這會觸發網站更新

接著做基本檢查：

```powershell
git status --short --branch
```

這個指令用來確認目前網站專案有沒有尚未處理的檔案變動。

## 判斷任務類型

依照使用者給的材料選擇流程：

- 一般文章：走 `content/posts/`，圖片通常在 `static/images/`
- YouTube 影片文章：走 `content/videos/`
- 已發布內容更新：只修改對應的文章或影片檔，除非模板真的需要改

如果使用者只簡短說「發文」「推上去」「發布這篇」，預設他要的是完整發布流程，不要停在建議或計畫。

## 快版流程：材料已經放在資料夾內

如果使用者說「資料已經放到資料夾內」「我已經放好了」「直接發布」這類意思，優先使用快版流程，不要重新走探索式流程。

快版目標是把已準備好的文章推上網站，不要花時間重新產生內容：

1. 只做一次 `git status --short --branch`，找出最新的 `content/videos/*.md` 與對應 `static/images/*cover*`。
2. 若文章已經有 `title`、`youtube`、`thumbnail`、`description`、`draft: false`，不要再查 YouTube oEmbed 標題。
3. 若 `thumbnail` 指向本機 `images/...` 且圖片存在，不要重新下載縮圖。
4. 修正常見小錯即可，例如：
   - `youtube: ""` 改成影片 ID
   - `{{< https://youtu.be/... >}}` 改成 `{{< youtube VIDEO_ID >}}`
   - 移除制式網站連結 `GARRO自由人生實驗室： https://garrolan.github.io/garrosolivagant/`
5. 備份直接跑完整本機備份，不要嘗試多路徑 `-Paths` 造成 PowerShell 參數解析錯誤：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\export-website-content-backup.ps1 -AllPublished
```

6. 若已經有一篇準備好的影片文章，優先用快檢腳本完成檢查、備份、建置、提交、推送：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\publish-ready-video.ps1 -Article "content/videos/文章檔名.md" -Message "publish video article" -SkipLiveCheck
```

7. 公開網站檢查只做一次 Node `fetch()` 快查；如果剛推送後出現 404，先判斷為 GitHub Pages 尚未部署完成，不要反覆等很多輪。只要已確認：
   - 本機 `hugo --minify` 通過
   - GitHub `main` 推送成功
   - 本機 `public/` 有產生頁面與圖片

   就可以回覆使用者「內容已推送，公開頁面可能還在部署中」。

快版時間目標：

- 使用者已放好文章與封面：目標 3 到 6 分鐘內完成提交與推送。
- 需要小修 front matter 或 shortcode：目標 5 到 8 分鐘內完成。
- 不要因為公開頁面部署延遲，把任務拖到 15 分鐘以上。

## 一般文章發布流程

適用於新的 Markdown 文章、文字檔文章，或已放在 `content/posts/` 的文章。

1. 找出本次要發布的文章與圖片。
   - 文章放在 `content/posts/`
   - 封面或內文圖片放在 `static/images/`
2. 如果文章是 `.txt`，但內容已經是 Markdown 和 front matter，改成 `.md`。
3. 用 UTF-8 讀取中文內容，避免終端機亂碼：

```powershell
Get-Content -Encoding UTF8 <文章路徑>
```

4. 檢查文章開頭的 front matter，至少要有：

```yaml
---
title: "文章標題"
date: 2026-05-21
categories: [...]
tags: [...]
author: "garrolan"
cover: "images/檔名.jpg"
description: "文章摘要"
draft: false
---
```

5. 確認 `draft: false`，代表文章會正式出現在網站上。
6. 確認 `cover` 指到的圖片真的存在。
7. 若多篇文章同一天一起發布，可以整理成同一次提交。

## YouTube 影片文章流程

適用於使用者提供 YouTube 連結，並希望建立網站影片文章。

必要輸入：

- YouTube 影片連結
- 影片說明文字或想放在網站上的介紹內容

標準做法：

1. 從 YouTube 連結取出影片 ID。
2. 確認 YouTube 影片原標題，front matter 的 `title` 要照 YouTube 標題完整填入，不要自行改寫、縮短或另取標題。若自動抓不到標題，優先使用使用者提供的 YouTube 標題；如果使用者沒有提供，才先用臨時標題並在回覆中提醒需要確認。
3. 在 `content/videos/` 建立一個 Markdown 檔。
4. 檔名使用穩定格式：

```text
YYYYMMDD-編號-簡短英文代稱.md
```

5. front matter 使用這個基本形狀：

```yaml
---
title: "YouTube 影片原標題"
date: 2026-05-21T00:11:00+08:00
categories: ["生活實驗"]
tags: ["自由人生實驗室"]
author: "garrolan"
youtube: "影片ID"
thumbnail: "images/YYYYMMDD-video-編號-cover.jpg"
description: "一句話摘要"
draft: false
---
```

6. 將影片縮圖下載或另存到 `static/images/`，檔名使用穩定格式，例如：

```text
static/images/YYYYMMDD-video-編號-cover.jpg
```

7. front matter 的 `thumbnail` 固定使用本機圖片路徑，例如：

```yaml
thumbnail: "images/YYYYMMDD-video-編號-cover.jpg"
```

8. 正文第一段先放 YouTube shortcode：

```go
{{< youtube 影片ID >}}
```

9. shortcode 下方放使用者提供的說明文字。
10. 保留自然段落和編號結構，不要把每一段都變成大標題。如果正文有影片時間軸，使用 `- 00:00 章節標題` 這種項目清單格式，或每個時間點中間留空行，避免網站把整段時間軸壓成同一段。
11. 如果說明文字中有制式網站連結，例如 `自由人生實驗室： https://garrolan.github.io/garrosolivagant/`，除非使用者要求保留，否則移除。
12. hashtag 可以保留，但要確認放在網站文章裡不突兀。
13. 日期不要設定成未來時間；如果只需要當天發布，可用當天較早的台灣時間。

縮圖規則：

- 影片文章縮圖固定要存在本機，也就是放進 `static/images/`，不要讓 `thumbnail` 直接指向 YouTube 遠端縮圖網址。
- YouTube 的 `maxresdefault.jpg`、`hqdefault.jpg` 或 oEmbed 縮圖只能當下載來源，下載後要用肉眼或圖片檢視工具確認不是灰色佔位圖。
- front matter 的 `thumbnail` 一律使用 `images/檔名.jpg` 這種本機路徑，例如 `images/20260531-video-019-cover.jpg`。
- 如果 YouTube 來源下載下來是灰色佔位圖，不要直接發布；改用影片截圖、使用者提供的封面，或其他已確認正常的本機圖片。
- 發布時要把對應的 `content/videos/*.md` 和 `static/images/縮圖檔` 一起 stage、commit、push。

## 發布流程

## 文章 TXT 備份

這個網站的文章與影片文章需要在本機保留純文字 `.txt` 備份。使用者會自行處理 Google Drive 上傳，不需要替使用者操作雲端硬碟。

備份格式使用最簡單的純文字 `.txt`。純文字沒有複雜排版，但最容易打開、搜尋，也最不容易因格式變動而壞掉。

建立或更新網站文章、影片文章時，在發布前或發布後都要產生備份：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\export-website-content-backup.ps1 -Paths "<文章或影片路徑>"
```

如果一次要備份目前所有已發布文章，使用：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\export-website-content-backup.ps1
```

這支腳本會把 `content/posts/` 和 `content/videos/` 中已發布的內容匯出到 `_generated/website-content-backups/`，包含：

- 每篇文章各一個 `.txt`
- `備份目錄.txt`
- `全文合併備份.txt`

預設輸出位置是 `_generated/website-content-backups/latest/`。這個資料夾每次會更新成最新備份，避免重複產生很多時間戳資料夾。若使用者明確要保留某一次備份，再用 `-OutputRoot` 指定另一個資料夾。

一般內容發布優先使用既有腳本：

```powershell
.\scripts\publish-new-content.ps1 -Message "commit message"
```

這個腳本會找出 `content/posts/`、`content/videos/`、`static/images/` 的變動，嘗試建置網站，然後提交並推送到 `origin/main`。

如果腳本不適合，手動流程是：

```powershell
git diff --check -- <相關檔案>
git add -- <相關檔案>
git commit -m "清楚描述這次發布"
git push origin main
git status --short --branch
```

只 stage 這次任務相關檔案，不要順手把無關變動一起發布。

## 本機 Hugo 檢查

如果可以，發布前跑：

```powershell
hugo --minify
```

如果 `hugo` 找不到，可以試著使用 WinGet 安裝過的 Hugo 路徑，或直接使用 `scripts/publish-new-content.ps1`。

已知這台 Windows 有時會出現：

```text
Application Control policy has blocked this file
```

這表示本機擋住 Hugo 執行，不一定是文章有問題。遇到時不要卡住整個發布流程；改用 front matter 檢查、`git diff --check`，再推到 GitHub，讓 GitHub Actions 做正式建置。

## 完成檢查

完成前確認：

- 文章或影片檔在正確資料夾
- front matter 完整
- `draft: false`
- 圖片或 YouTube ID 正確
- 本次文章或影片已有 `.txt` 備份，位置在 `_generated/website-content-backups/latest/`
- `git diff --check` 沒有空白錯誤
- 推送後 `git status --short --branch` 顯示乾淨同步狀態，例如 `## main...origin/main`

回覆使用者時固定說明：

1. 改了什麼
2. 為什麼這樣改
3. 接下來可以到網站哪裡看
4. 有沒有風險或尚未完成的地方
5. 這次出現的新名詞，用白話補充

## 常見問題

- 中文內容看起來亂碼：改用 `Get-Content -Encoding UTF8` 讀檔。
- 文章沒有出現在網站：先檢查副檔名是不是 `.md`，front matter 是否有結尾 `---`，以及 `draft: false`。
- 推送後網站還沒變：GitHub Actions 需要一點時間部署，必要時再查看 `origin/gh-pages` 或部署結果。
- Git 顯示 ahead by 1：代表已提交但還沒推送，繼續執行 `git push origin main`。
- YouTube 標題抓不到：不要讓任務卡住，但要優先使用使用者提供的 YouTube 原標題；不要從說明文字自行改寫標題。若完全沒有標題，才先用臨時標題並提醒使用者之後要確認。
- PowerShell 不讓 `.ps1` 腳本直接執行：使用 `powershell -NoProfile -ExecutionPolicy Bypass -File <腳本路徑>`，這只是本次指令的臨時允許，不會永久改系統設定。
- 備份檔出現在 `_generated/`：這是本機暫存輸出資料夾，已被 `.gitignore` 排除，不要把它當成網站內容提交。
