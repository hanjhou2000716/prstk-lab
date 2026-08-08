# A03 工具資料 Schema

## 資料位置

- Schema：[`src/data/schema/tool.schema.json`](../../src/data/schema/tool.schema.json)
- 28 筆工具資料：[`src/data/tools.json`](../../src/data/tools.json)
- 產生器：[`scripts/generate-tool-data.cjs`](../../scripts/generate-tool-data.cjs)
- 驗證器：[`scripts/validate-tool-schema.cjs`](../../scripts/validate-tool-schema.cjs)

## 必填欄位

每項工具都必須提供身份、內容、分類、使用情境、驗證狀態、連結、風險提示與推薦狀態等 31 個欄位。尚未逐項驗證的欄位使用 `unknown`、空陣列或 `pending-verification`，不自行推測外部服務功能。

驗證規則包含：

- `id` 與 `slug` 必須是唯一 kebab-case。
- URL 必須是有效 HTTPS URL 且不可重複。
- `lastVerifiedAt` 統一使用 `YYYY-MM-DD`。
- enum 欄位不得使用未定義值。
- 所有必要陣列必須是陣列；功能、限制與適合對象不得為空。
- `relatedTools` 只能引用已存在的工具 ID。

## 指令

```powershell
npm run data:generate
npm run schema:validate
```

`npm run build` 會先執行 Schema 驗證；資料缺欄位、ID／slug／URL 重複或格式錯誤時，建置會失敗。

本階段先建立單一資料檔與驗證邊界；A04 才會將入口卡片、詳情與分類頁改為直接從這份資料產生。
