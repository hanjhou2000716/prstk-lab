# G06／G07 · 效能預算與依賴安全

- 建置後檢查 Astro 初始 runtime JavaScript gzip 不超過 100 KB。
- CI 執行 `npm audit --audit-level=high`，避免高風險依賴進入主線。
- A06 已移除 unpkg 與 `unsafe-inline`；本 PR 將效能與依賴檢查納入 CI 的必要門檻。
