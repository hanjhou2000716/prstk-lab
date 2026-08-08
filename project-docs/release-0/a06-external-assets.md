# A06 · 外部化 CSS／JS 與第三方依賴

## 實作

- 將入口頁全域 CSS 移至 `src/styles.css`，由 Tailwind 建置輸出。
- 將 Logo fallback、AOS 初始化、Lucide icon hydration、搜尋／篩選／Drawer 事件移至 `src/scripts/main.ts`。
- AOS 與 Lucide 改由 npm 版本建置，不再依賴 unpkg CDN 才能啟動主要介面。
- CSP 移除 `unsafe-inline` 與 unpkg 來源；JSON 工具資料仍以非執行性的 `application/json` data block 嵌入。
- Logo fallback 改用 `addEventListener('error')`，不再使用 inline event handler。

## 驗證

`security:validate` 會檢查 CSP、inline style／script、CDN 依賴、bundled runtime 與外部 CSS 是否符合 A06 邊界。
