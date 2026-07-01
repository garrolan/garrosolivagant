# Designing Your Life 第二層工具箱

這是一組可直接放在 GitHub Pages / Hugo static 目錄中的純前端 HTML 工具。

## 頁面

- `index.html`：第二層首頁
- `mind-map.html`：Tool 06 思維圖（中心主題＋可拖曳卡片＋卡片連線）
- `odyssey.html`：Tool 07 奧德賽計畫
- `prototype.html`：Tool 08 原型測試
- `conversation.html`：Tool 09 原型訪談
- `review.html`：Tool 10 實驗選擇
- `summary.html`：第二層總結
- `assets/styles.css`：橘黑古希臘黑彩陶風格
- `assets/app.js`：互動與 localStorage

## 使用方式

把整個資料夾放到網站：

```text
static/tools/life-design-layer2/
```

或依你的網站架構放到：

```text
/tools/life-design-layer2/
```

工具資料儲存在使用者自己的瀏覽器 localStorage，不需要後端。

## 第二版調整

- 刪除「可能性種子」頁，直接從思維圖開始。
- 思維圖改為自行設定中心主題，再新增、拖曳、連結聯想卡。
- 奧德賽計畫的「需要資源／害怕／興奮」支援自定義標籤。
- 原型測試的「我想測試的方向」改成手動輸入，不再使用下拉選單。
- 原型訪談問題卡調整文字對比。
- 實驗選擇頁總分會跟著拉桿即時更新。
