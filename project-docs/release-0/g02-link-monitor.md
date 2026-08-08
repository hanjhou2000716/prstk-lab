# G02 · 外部連結監測

新增每週 GitHub Actions 連結監測：

- 對 28 個工具 URL 執行 HEAD，遇到 403／405 時改用 GET。
- 每個 URL 最多重試兩次，記錄狀態碼、redirect 後網址、錯誤與檢查時間。
- 產生 JSON artifact；連續執行失敗時建立或更新 `external-link-monitor` Issue。
- 暫時性失敗只會進入報告，不會自動從入口移除工具。
