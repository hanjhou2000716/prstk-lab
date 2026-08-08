import { createClient } from '@supabase/supabase-js';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { ResearchProject } from '../types/workbench';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const tableName = 'research_projects';
const notificationTableName = 'notification_preferences';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabaseConfigHint = '請在建置環境設定 PUBLIC_SUPABASE_URL 與 PUBLIC_SUPABASE_PUBLISHABLE_KEY。';

let client: SupabaseClient | null = null;
const getClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;
  client ||= createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  return client;
};

export async function getSession(): Promise<{ session: Session | null; error: Error | null }> {
  const supabase = getClient();
  if (!supabase) return { session: null, error: new Error(supabaseConfigHint) };
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session || null, error };
}

export async function signIn(email: string, password: string) {
  const supabase = getClient();
  if (!supabase) return { data: null, error: new Error(supabaseConfigHint) };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  const supabase = getClient();
  if (!supabase) return { data: null, error: new Error(supabaseConfigHint) };
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  const supabase = getClient();
  if (!supabase) return { error: new Error(supabaseConfigHint) };
  return supabase.auth.signOut();
}

export async function fetchProjects(userId: string): Promise<{ projects: ResearchProject[]; error: Error | null }> {
  const supabase = getClient();
  if (!supabase) return { projects: [], error: new Error(supabaseConfigHint) };
  const { data, error } = await supabase
    .from(tableName)
    .select('id,payload,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return { projects: (data || []).map(row => ({ ...(row.payload as ResearchProject), id: row.id, createdAt: row.created_at, updatedAt: row.updated_at })), error };
}

export async function upsertProjects(userId: string, projects: ResearchProject[]) {
  const supabase = getClient();
  if (!supabase) return { error: new Error(supabaseConfigHint) };
  const rows = projects.map(project => ({
    id: project.id,
    user_id: userId,
    payload: project,
    created_at: project.createdAt || new Date().toISOString(),
    updated_at: project.updatedAt || new Date().toISOString()
  }));
  const { error: upsertError } = rows.length
    ? await supabase.from(tableName).upsert(rows, { onConflict: 'user_id,id' })
    : { error: null };
  if (upsertError) return { error: upsertError };
  const ids = new Set(projects.map(project => project.id));
  const { data: remoteRows, error: listError } = await supabase.from(tableName).select('id').eq('user_id', userId);
  if (listError) return { error: listError };
  const staleIds = (remoteRows || []).map(row => row.id).filter(id => !ids.has(id));
  if (staleIds.length) {
    const { error: deleteError } = await supabase.from(tableName).delete().eq('user_id', userId).in('id', staleIds);
    if (deleteError) return { error: deleteError };
  }
  return { error: null };
}

export function subscribeToAuth(callback: (session: Session | null) => void): () => void {
  const supabase = getClient();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export function bindWorkbenchControls({ getProjects, replaceProjects, onStatus = () => {} }: { getProjects: () => ResearchProject[]; replaceProjects: (projects: ResearchProject[]) => void; onStatus?: (message: string) => void }) {
  const status = document.getElementById('sync-status');
  const pullButton = document.getElementById('sync-pull') as HTMLButtonElement | null;
  const pushButton = document.getElementById('sync-push') as HTMLButtonElement | null;
  const signOutButton = document.getElementById('sync-sign-out') as HTMLButtonElement | null;
  if (!status || !pullButton || !pushButton || !signOutButton) return;
  let currentSession = null;
  const setStatus = (message: string) => { status.textContent = message; onStatus(message); };
  const renderSession = (session: Session | null) => {
    currentSession = session;
    const signedIn = Boolean(session?.user?.id);
    pullButton.disabled = !signedIn;
    pushButton.disabled = !signedIn;
    signOutButton.hidden = !signedIn;
    setStatus(signedIn ? `已連線：${session.user.email || '目前帳號'}。可手動同步研究案。` : (isSupabaseConfigured ? '尚未登入；請先開啟帳號設定。' : supabaseConfigHint));
  };
  const ensureSession = async (): Promise<Session | null> => {
    if (currentSession) return currentSession;
    const result = await getSession();
    if (result.error) { setStatus(result.error.message); return null; }
    renderSession(result.session);
    return result.session;
  };
  pullButton.addEventListener('click', async () => {
    const session = await ensureSession(); if (!session) return;
    pullButton.disabled = true;
    const { projects, error } = await fetchProjects(session.user.id);
    if (error) setStatus(`載入失敗：${error.message}`);
    else if (projects.length || !getProjects().length || window.confirm('雲端目前沒有研究案，要用空清單取代本機資料嗎？')) { replaceProjects(projects); setStatus(`已從雲端載入 ${projects.length} 個研究案。`); }
    pullButton.disabled = false;
  });
  pushButton.addEventListener('click', async () => {
    const session = await ensureSession(); if (!session) return;
    pushButton.disabled = true;
    const { error } = await upsertProjects(session.user.id, getProjects());
    setStatus(error ? `同步失敗：${error.message}` : `已同步 ${getProjects().length} 個研究案。`);
    pushButton.disabled = false;
  });
  signOutButton.addEventListener('click', async () => { const { error } = await signOut(); if (error) setStatus(`登出失敗：${error.message}`); else renderSession(null); });
  renderSession(null);
  getSession().then(({ session, error }) => error ? setStatus(error.message) : renderSession(session));
  return subscribeToAuth(renderSession);
}

export function bindAccountControls({ onStatus = () => {} }: { onStatus?: (message: string) => void } = {}) {
  const email = document.getElementById('account-email') as HTMLInputElement | null;
  const password = document.getElementById('account-password') as HTMLInputElement | null;
  const signInButton = document.getElementById('account-sign-in') as HTMLButtonElement | null;
  const signUpButton = document.getElementById('account-sign-up') as HTMLButtonElement | null;
  const signOutButton = document.getElementById('account-sign-out') as HTMLButtonElement | null;
  const sessionState = document.getElementById('account-session');
  if (!email || !password || !signInButton || !signUpButton || !signOutButton || !sessionState) return;
  const setStatus = (message: string) => { sessionState.textContent = message; onStatus(message); };
  const renderSession = (session: Session | null) => {
    const userEmail = session?.user?.email;
    sessionState.textContent = userEmail ? `已登入：${userEmail}` : (isSupabaseConfigured ? '尚未登入' : supabaseConfigHint);
    signOutButton.hidden = !userEmail;
    signInButton.disabled = Boolean(userEmail);
    signUpButton.disabled = Boolean(userEmail);
  };
  const run = async (action: () => Promise<{ data: { session: Session | null } | null; error: Error | null }>) => {
    signInButton.disabled = true; signUpButton.disabled = true;
    const { data, error } = await action();
    if (error) setStatus(`操作失敗：${error.message}`);
    else if (data?.session) renderSession(data.session);
    else setStatus('驗證信已寄出，請完成信箱確認後再登入。');
    if (!data?.session) { signInButton.disabled = false; signUpButton.disabled = false; }
  };
  signInButton.addEventListener('click', () => run(() => signIn(email.value.trim(), password.value)));
  signUpButton.addEventListener('click', () => run(() => signUp(email.value.trim(), password.value)));
  signOutButton.addEventListener('click', async () => { const { error } = await signOut(); if (error) setStatus(`登出失敗：${error.message}`); else renderSession(null); });
  getSession().then(({ session, error }) => error ? setStatus(error.message) : renderSession(session));
  return subscribeToAuth(renderSession);
}

const notificationFields = ['latest_research', 'weekly_digest', 'tool_status', 'review_reminders', 'platform_updates'];
const defaultNotificationPreferences: Record<string, boolean> = Object.fromEntries(notificationFields.map(field => [field, true]));

export async function fetchNotificationPreferences(userId: string): Promise<{ preferences: Record<string, boolean>; error: Error | null }> {
  const supabase = getClient();
  if (!supabase) return { preferences: defaultNotificationPreferences, error: new Error(supabaseConfigHint) };
  const { data, error } = await supabase.from(notificationTableName).select(notificationFields.join(',')).eq('user_id', userId).maybeSingle();
  return { preferences: { ...defaultNotificationPreferences, ...(data && typeof data === 'object' ? data as Record<string, boolean> : {}) }, error };
}

export async function upsertNotificationPreferences(userId: string, preferences: Record<string, boolean>) {
  const supabase = getClient();
  if (!supabase) return { error: new Error(supabaseConfigHint) };
  const values = Object.fromEntries(notificationFields.map(field => [field, preferences[field] !== false]));
  const { error } = await supabase.from(notificationTableName).upsert({ user_id: userId, ...values, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  return { error };
}

export async function createTelegramLink() {
  const supabase = getClient();
  if (!supabase) return { data: null, error: new Error(supabaseConfigHint) };
  return supabase.functions.invoke('telegram-link', { body: {} });
}

export function bindNotificationControls() {
  const options = document.getElementById('notification-options');
  const status = document.getElementById('notification-status');
  const saveButton = document.getElementById('save-notification-preferences') as HTMLButtonElement | null;
  const linkButton = document.getElementById('create-telegram-link') as HTMLButtonElement | null;
  const link = document.getElementById('telegram-link') as HTMLAnchorElement | null;
  if (!options || !status || !saveButton || !linkButton || !link) return;
  let currentSession = null;
  const controls = Object.fromEntries(notificationFields.map(field => [field, document.querySelector<HTMLInputElement>(`[data-notification-pref="${field}"]`)])) as Record<string, HTMLInputElement | null>;
  const setEnabled = (enabled: boolean) => { options.hidden = !enabled; Object.values(controls).forEach(control => { if (control) control.disabled = !enabled; }); saveButton.disabled = !enabled; linkButton.disabled = !enabled; };
  const readPreferences = (): Record<string, boolean> => Object.fromEntries(notificationFields.map(field => [field, Boolean(controls[field]?.checked)]));
  const writePreferences = (preferences: Record<string, boolean>) => notificationFields.forEach(field => { if (controls[field]) controls[field]!.checked = preferences[field] !== false; });
  const renderSession = async (session: Session | null) => {
    currentSession = session;
    if (!session?.user?.id) { setEnabled(false); status.textContent = isSupabaseConfigured ? '尚未登入；登入後可設定通知。' : supabaseConfigHint; return; }
    setEnabled(true);
    status.textContent = '正在載入通知設定…';
    const { preferences, error } = await fetchNotificationPreferences(session.user.id);
    writePreferences(preferences);
    status.textContent = error ? `載入通知設定失敗：${error.message}` : '可選擇要接收的通知類型。';
  };
  saveButton.addEventListener('click', async () => {
    if (!currentSession?.user?.id) return;
    saveButton.disabled = true;
    const { error } = await upsertNotificationPreferences(currentSession.user.id, readPreferences());
    status.textContent = error ? `儲存失敗：${error.message}` : '通知設定已儲存。';
    saveButton.disabled = false;
  });
  linkButton.addEventListener('click', async () => {
    if (!currentSession?.user?.id) return;
    linkButton.disabled = true;
    const { data, error } = await createTelegramLink();
    if (error || !data?.url) status.textContent = `無法產生綁定連結：${error?.message || 'Telegram 尚未完成部署設定。'}`;
    else { link.href = data.url; link.textContent = `開啟 Telegram 完成綁定（有效至 ${new Date(data.expiresAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}）`; link.classList.remove('hidden'); status.textContent = '請在有效時間內開啟連結並傳送 /start。'; }
    linkButton.disabled = false;
  });
  setEnabled(false);
  getSession().then(({ session, error }) => { if (error) status.textContent = error.message; else void renderSession(session); });
  return subscribeToAuth(renderSession);
}
