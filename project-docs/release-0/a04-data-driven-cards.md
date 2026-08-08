# A04 · 資料驅動工具卡片

## 目標

將首頁、分類與工具詳情的卡片渲染統一改為讀取 `src/data/tools.json`，避免 HTML 內重複維護工具內容，也避免用數字索引開啟錯誤的詳情抽屜。

## 實作

- Astro 在建置時將工具資料嵌入 `tool-data` JSON script，瀏覽器端只解析這一份資料。
- `renderCatalogSections()` 依 `categories` 與每項工具的 `categories` 產生分類區段與卡片。
- 收藏、釘選、搜尋、情境入口與詳情抽屜全部以穩定 `id` 連結，不依賴工具排序。
- 外部工具連結統一設定 `noopener noreferrer` 與 `no-referrer`。
- `cards:validate` 會阻擋靜態卡片、數字索引 `openDrawer(n)` 與重複 ID／slug。

## 驗證

```text
npm run cards:validate
npm run schema:validate
npx astro build
```

目前資料集包含 28 個工具，ID 與 slug 均唯一。
