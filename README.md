# PRStK Lab

PRStK Lab 是一個靜態的量化與投資工具入口站，可直接部署到 GitHub Pages。

## 本機開發

```bash
npm install
npm run build
python -m http.server 4173
```

開啟 `http://localhost:4173` 即可預覽。

## 發布前檢查

每次變更 `index.html` 中的 Tailwind utility class 後，請先執行 `npm run build`，並一併提交產生的 `assets/styles.css`。GitHub Pages 會直接提供這個編譯後的靜態 CSS，不依賴 Tailwind CDN。

## 維護原則

- 新增外部連結時必須保留 `target="_blank"` 與 `rel="noopener noreferrer"`。
- 詳情抽屜資料集中在 `index.html` 內的 `appData`；工具名稱、功能、對象與網址要同步更新。
- 外部工具內容僅供入口與研究參考，實際使用前請自行確認服務狀態與投資風險。
