import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.0';

const allowedTypes = new Set(['latest_research', 'weekly_digest', 'tool_status', 'review_reminders', 'platform_updates']);
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
const safeUrl = (value: unknown) => { try { const url = new URL(String(value || '')); return url.protocol === 'https:' ? url.toString() : ''; } catch { return ''; } };

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405 });
  const notifySecret = Deno.env.get('TELEGRAM_NOTIFY_SECRET');
  if (!notifySecret || request.headers.get('x-prstk-notify-secret') !== notifySecret) return new Response('Unauthorized.', { status: 401 });
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!botToken || !supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Not configured.' }, { status: 503 });
  const event = await request.json().catch(() => null);
  if (!event || !allowedTypes.has(event.type) || typeof event.title !== 'string' || typeof event.body !== 'string') return Response.json({ error: 'Invalid notification payload.' }, { status: 400 });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const [{ data: subscriptions, error: subscriptionError }, { data: preferences, error: preferenceError }] = await Promise.all([
    admin.from('telegram_subscriptions').select('user_id,telegram_chat_id'),
    admin.from('notification_preferences').select('user_id,latest_research,weekly_digest,tool_status,review_reminders,platform_updates')
  ]);
  if (subscriptionError || preferenceError) return Response.json({ error: 'Unable to load notification settings.' }, { status: 500 });
  const preferenceMap = new Map((preferences || []).map(item => [item.user_id, item]));
  const userIds = Array.isArray(event.userIds) ? new Set(event.userIds.filter(id => typeof id === 'string')) : null;
  const recipients = (subscriptions || []).filter(subscription => {
    if (userIds && !userIds.has(subscription.user_id)) return false;
    const preference = preferenceMap.get(subscription.user_id);
    return preference ? preference[event.type] !== false : true;
  });
  const link = safeUrl(event.url);
  const text = `<b>${escapeHtml(event.title.slice(0, 180))}</b>\n${escapeHtml(event.body.slice(0, 3600))}${link ? `\n\n<a href="${escapeHtml(link)}">在 PRStK Lab 開啟</a>` : ''}`;
  let delivered = 0;
  for (const recipient of recipients) {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: recipient.telegram_chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }) });
    if (response.ok) { delivered += 1; await admin.from('telegram_subscriptions').update({ last_delivery_at: new Date().toISOString() }).eq('telegram_chat_id', recipient.telegram_chat_id); }
  }
  return Response.json({ delivered, skipped: (subscriptions || []).length - recipients.length });
});
