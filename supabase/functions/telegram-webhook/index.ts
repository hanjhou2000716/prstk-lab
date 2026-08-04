import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.0';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
};

const sendTelegram = async (token: string, chatId: string, text: string) => fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
});

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405 });
  const expectedSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (!expectedSecret || request.headers.get('x-telegram-bot-api-secret-token') !== expectedSecret) return new Response('Unauthorized.', { status: 401 });
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!botToken || !supabaseUrl || !serviceRoleKey) return new Response('Not configured.', { status: 503 });
  const update = await request.json().catch(() => null);
  const message = update?.message;
  const text = typeof message?.text === 'string' ? message.text.trim() : '';
  const match = text.match(/^\/start(?:\s+)([A-Za-z0-9_-]{20,64})$/);
  if (!message?.chat?.id || !match) return new Response('ok');
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const tokenHash = await sha256(match[1]);
  const { data: link } = await admin.from('telegram_link_tokens').select('user_id,expires_at').eq('token_hash', tokenHash).maybeSingle();
  const chatId = String(message.chat.id);
  if (!link || new Date(link.expires_at).getTime() < Date.now()) {
    await sendTelegram(botToken, chatId, '這個 PRStK Lab 綁定連結已失效，請回到帳號設定重新產生。');
    return new Response('ok');
  }
  const { error } = await admin.from('telegram_subscriptions').upsert({ user_id: link.user_id, telegram_chat_id: chatId, linked_at: new Date().toISOString() }, { onConflict: 'telegram_chat_id' });
  if (!error) await admin.from('telegram_link_tokens').delete().eq('token_hash', tokenHash);
  await sendTelegram(botToken, chatId, error ? '綁定失敗，請稍後再試。' : `已完成 PRStK Lab 通知綁定。\n帳號：${escapeHtml(link.user_id.slice(0, 8))}…`);
  return new Response('ok');
});
