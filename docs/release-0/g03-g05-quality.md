# G03／G04／G05 · 品質與無障礙基礎

- 新增 Node test runner 單元測試，驗證 28 筆工具資料、唯一 ID／slug、HTTPS URL 與 legacy index migration。
- 新增靜態輸出 smoke test，驗證一頁式搜尋、分類、情境、工具面板、Drawer 與工具 template 都存在，且 CSP 沒有 unsafe-inline。
- 新增 Skip link、主要內容 anchor、44px 以上工具操作區與 44px 面板關閉按鈕。
- 保留 `prefers-reduced-motion` 降級規則與鍵盤 focus 樣式。
