# Telegram 通知部署 SOP

H03 的 Telegram 整合採「前端只用 publishable key、服務端保管秘密」設計。請不要把下列任何秘密寫入 Git、Astro 或 GitHub Pages：

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_NOTIFY_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

## 1. 建立資料表

在 Supabase SQL Editor 執行 [`schema.sql`](./schema.sql)。除了研究案外，這會建立通知偏好、Telegram 訂閱與一次性綁定 token 表；後兩者不授予一般登入使用者直接存取權。

## 2. 設定 Edge Function secrets

在 Supabase Dashboard 的 Edge Functions secrets 設定：

```text
TELEGRAM_BOT_TOKEN=<BotFather 提供的 token>
TELEGRAM_BOT_USERNAME=<不含 @ 的 bot username>
TELEGRAM_WEBHOOK_SECRET=<至少 32 字元的隨機字串>
TELEGRAM_NOTIFY_SECRET=<至少 32 字元的隨機字串>
ALLOWED_ORIGIN=https://hanjhou2000716.github.io
```

Supabase 內建的 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 由 Edge Functions 使用；service role 只放在 Supabase secrets。

## 3. 部署三個函式

```text
supabase functions deploy telegram-link
supabase functions deploy telegram-webhook
supabase functions deploy telegram-notify
```

將 Telegram webhook 設為：

```text
https://<project-ref>.supabase.co/functions/v1/telegram-webhook
```

並在 `setWebhook` 請求中帶上與 `TELEGRAM_WEBHOOK_SECRET` 完全相同的 `secret_token`。部署前先確認 BotFather 的 username 與連結中的 username 一致。

## 4. 驗證使用者流程

1. 建置環境設定 `PUBLIC_SUPABASE_URL` 與 `PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
2. 使用者在「帳號與同步」登入並儲存通知偏好。
3. 點擊「產生 Telegram 綁定連結」，連結只有效 15 分鐘且只使用一次。
4. 在 Telegram 開啟連結並傳送 `/start`，webhook 會建立訂閱。
5. 由排程或 CI 呼叫 `telegram-notify`，請帶 `x-prstk-notify-secret`，body 只允許五種通知類型：`latest_research`、`weekly_digest`、`tool_status`、`review_reminders`、`platform_updates`。

通知函式只會傳送使用者已選擇的摘要與 HTTPS 連結，不傳送研究筆記、投資部位或 service role 憑證。
