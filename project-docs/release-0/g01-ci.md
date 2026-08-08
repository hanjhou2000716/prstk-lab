# G01 · Continuous Integration

新增 GitHub Actions `PRStK Lab CI`，在 Pull Request 與 `main` push 時執行：

- A01 基準與工具 Schema 驗證。
- 資料驅動卡片、元件邊界、CSP／第三方依賴與 SEO 驗證。
- Inline block、Astro type check。
- 靜態建置與輸出檔案驗證。

Workflow 使用 Node 22、`npm ci` 與 npm cache，並限制同一分支只保留最新執行中的工作。
