# A05 · 元件化介面

## 目標

把入口頁的版面責任拆成可重用的 Astro 元件，同時保留既有 DOM ID 與事件契約，讓搜尋、收藏、釘選、工具面板與詳情抽屜可以在後續頁面重用。

## 元件邊界

- `Header`：品牌 Logo 與 slogan。
- `SearchBar`：搜尋輸入、最愛篩選與查看全部入口。
- `ScenarioSelector`：四個情境入口。
- `ToolCard`：工具卡片 template；資料仍由 A04 renderer 填入，避免 HTML 靜態重複。
- `FavoriteButton`、`PinButton`：卡片操作按鈕。
- `HomeTools`：首頁精選區與空狀態。
- `ToolPanel`：完整工具面板。
- `ToolPreviewDrawer`、`ToolDetail`：工具詳情預覽與內容區塊。
- `Footer`：Together Better 與版權資訊。

## 驗證

`components:validate` 會檢查元件檔案、頁面匯入、元件使用，以及面板／抽屜沒有回到入口頁重複硬寫。
