import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.0';

const origin = Deno.env.get('ALLOWED_ORIGIN') || 'https://hanjhou2000716.github.io';
const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
};

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const botUsername = Deno.env.get('TELEGRAM_BOT_USERNAME');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !botUsername) return json({ error: 'Telegram linking is not configured.' }, 503);
  const authorization = request.headers.get('Authorization') || '';
  const jwt = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!jwt) return json({ error: 'Authentication required.' }, 401);
  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(jwt);
  if (authError || !user) return json({ error: 'Authentication required.' }, 401);
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const token = randomToken();
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await admin.from('telegram_link_tokens').delete().eq('user_id', user.id);
  const { error } = await admin.from('telegram_link_tokens').insert({ token_hash: tokenHash, user_id: user.id, expires_at: expiresAt });
  if (error) return json({ error: 'Unable to create a Telegram link.' }, 500);
  return json({ url: `https://t.me/${botUsername}?start=${token}`, expiresAt });
});
