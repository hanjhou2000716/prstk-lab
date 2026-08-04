# Release 0 現況基準（A01）

本目錄保存 Release 0 重構前的可回歸基準。基準來源為 `index.html` 目前的 `toolCatalog` 與 `categories`，捕獲日期為 2026-08-04，來源 commit 為 `105b1cd`。

## 基準摘要

- 工具總數：28
- 分類總數：5
- 品牌 Logo、稜量背景與目前藍灰／米白色彩維持現況，後續重構不得任意替換。
- 所有工具連結均記錄於 [`baseline-tools.json`](./baseline-tools.json)，並要求使用 HTTPS。
- 功能回歸項目記錄於 [`a01-behavior-checklist.md`](./a01-behavior-checklist.md)。
- 裝置基準尺寸與截圖狀態記錄於 [`viewport-baseline.md`](./viewport-baseline.md)。

## 重新產生與驗證

```powershell
node scripts/capture-release-0-baseline.cjs
node scripts/validate-release-0-baseline.cjs
node scripts/validate-inline-js.cjs
```

若來源 commit 或捕獲日期不同，可透過 `BASELINE_COMMIT` 與 `BASELINE_DATE` 覆寫，避免把環境時間寫入資料：

```powershell
$env:BASELINE_COMMIT = 'your-commit'
$env:BASELINE_DATE = 'YYYY-MM-DD'
node scripts/capture-release-0-baseline.cjs
```
