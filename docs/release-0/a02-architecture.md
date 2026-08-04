# A02 Astro + TypeScript 架構基準

## 已完成

- 入口由根目錄 `index.html` 遷移至 `src/pages/index.astro`。
- 新增 `astro.config.mjs`，固定 `site` 與 GitHub Pages `base: /prstk-lab`。
- 使用 Astro static output，建置結果輸出到 `docs/`，配合 GitHub Pages `main:/docs`。
- 靜態資產集中於 `public/`；manifest、品牌圖片、稜量背景與 Tailwind CSS 會在建置時複製至 Pages 輸出。
- 新增 `tsconfig.json` 與 `@astrojs/check`，保留既有客戶端互動並通過 Astro 型別檢查。
- 動態工具卡由既有 JavaScript 建立，因此入口樣式使用 `is:global`，避免 Astro scoped CSS 讓動態卡片的收藏／釘選／資訊控制失去版面樣式。
- 加入 `.nojekyll`，避免 Pages 將 `_astro` 靜態資產當成 Jekyll 私有目錄忽略。

## 驗收命令

```powershell
npm run astro:check
npm run validate
npm run baseline:validate
npm run build
npm run build:validate
```

## 部署狀態

GitHub Pages source 已設定為 `main:/docs`。A02 線上回歸確認入口、CSS、背景圖片、manifest 與 Astro 產生的 JavaScript 均以 `/prstk-lab/` 子路徑回應 HTTP 200。

本階段刻意不重寫工具資料與既有互動邏輯；資料 Schema、元件拆分與內嵌 CSS／JS 外部化會在後續 A03–A06 處理。
