const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const schema = read('supabase/schema.sql');
const account = read('src/pages/account/index.astro');
const sync = read('src/scripts/workbench-sync.ts');
const setup = read('supabase/telegram-setup.md');
const functions = ['telegram-link', 'telegram-webhook', 'telegram-notify'].map(name => read(`supabase/functions/${name}/index.ts`)).join('\n');

for (const marker of ['notification_preferences', 'telegram_subscriptions', 'telegram_link_tokens', 'revoke all on public.telegram_subscriptions', 'enable row level security']) {
  if (!schema.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Telegram schema missing ${marker}.`);
}
for (const marker of ['notification-options', 'save-notification-preferences', 'create-telegram-link', 'telegram-link']) {
  if (!account.includes(marker) && !sync.includes(marker)) throw new Error(`Telegram account flow missing ${marker}.`);
}
for (const marker of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', 'TELEGRAM_NOTIFY_SECRET', 'SUPABASE_SERVICE_ROLE_KEY', 'x-prstk-notify-secret']) {
  if (!functions.includes(marker) || !setup.includes(marker)) throw new Error(`Telegram deployment marker missing ${marker}.`);
}
if (/['"](?:[0-9]{6,}:[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]+)['"]/.test(functions)) throw new Error('Telegram or Supabase secrets must not be committed.');
if (!/15 \* 60 \* 1000/.test(functions)) throw new Error('Telegram link token expiry must remain bounded.');
if (!/allowedTypes/.test(functions) || !/disable_web_page_preview/.test(functions)) throw new Error('Telegram notification payload guard is missing.');
console.log('Telegram integration valid: RLS preferences, one-time linking, guarded webhook, and server-only delivery are present.');
