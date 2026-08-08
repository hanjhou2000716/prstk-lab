// Privacy analytics is intentionally isolated from the main interaction bundle.
const consentKey = 'prstk-lab-analytics-consent-v1';
const eventsKey = 'prstk-lab-analytics-events-v1';
const allowedEvents = new Set(['search_started', 'scenario_selected', 'tool_opened', 'favorite_toggled', 'pin_toggled', 'research_opened', 'sync_used']);
const safeCategories = new Set(['explore', 'research', 'strategy', 'risk', 'allocation']);

const readConsent = () => { try { return localStorage.getItem(consentKey) || 'unset'; } catch { return 'unset'; } };
const writeConsent = value => { try { localStorage.setItem(consentKey, value); } catch { /* Privacy controls remain usable if storage is unavailable. */ } };
const readEvents = () => { try { const value = JSON.parse(localStorage.getItem(eventsKey) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
const writeEvents = events => { try { localStorage.setItem(eventsKey, JSON.stringify(events.slice(-200))); } catch { /* Best effort only; never block the app. */ } };
const getSafeProperties = (properties: { category?: string; toolId?: string } = {}) => {
  const safe: { category?: string; toolId?: string } = {};
  if (safeCategories.has(properties?.category)) safe.category = properties.category;
  if (typeof properties?.toolId === 'string' && /^[a-z0-9-]{1,80}$/.test(properties.toolId)) safe.toolId = properties.toolId;
  return safe;
};
const track = (event: string, properties: { category?: string; toolId?: string } = {}) => {
  if (readConsent() !== 'accepted' || !allowedEvents.has(event)) return;
  writeEvents([...readEvents(), { event, ...getSafeProperties(properties), path: location.pathname, at: new Date().toISOString() }]);
};
const updateStatus = message => { const status = document.getElementById('analytics-status'); if (status) status.textContent = message; };
const exportEvents = () => {
  const blob = new Blob([JSON.stringify(readEvents(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'prstk-anonymous-usage.json'; link.click(); URL.revokeObjectURL(url);
};
const bind = () => {
  const accept = document.getElementById('analytics-accept');
  const decline = document.getElementById('analytics-decline');
  const clear = document.getElementById('analytics-clear');
  const details = document.getElementById('privacy-settings') as HTMLDetailsElement | null;
  if (!accept || !decline || !clear) return;
  const render = () => { const consent = readConsent(); updateStatus(consent === 'accepted' ? `已允許；目前保留 ${readEvents().length} 筆本機事件。` : consent === 'declined' ? '已拒絕，不會記錄使用事件。' : '尚未選擇。'); };
  accept.addEventListener('click', () => { writeConsent('accepted'); updateStatus('已允許匿名統計，只保存在此瀏覽器。'); });
  decline.addEventListener('click', () => { writeConsent('declined'); writeEvents([]); updateStatus('已拒絕，不會記錄使用事件。'); });
  clear.addEventListener('click', () => { writeEvents([]); updateStatus('本機統計紀錄已清除。'); });
  details?.addEventListener('toggle', () => { if (details.open) render(); });
  render();
  let searchStarted = false;
  document.getElementById('tool-search')?.addEventListener('input', event => { const hasQuery = Boolean((event.target as HTMLInputElement).value.trim()); if (hasQuery && !searchStarted) track('search_started'); searchStarted = hasQuery; });
  document.addEventListener('click', event => { const target = (event.target as HTMLElement).closest('[data-analytics-event]') as HTMLElement | null; if (!target) return; track(target.dataset.analyticsEvent || 'unknown', { category: target.dataset.analyticsCategory }); });
};

globalThis.prstkAnalytics = { track, exportEvents, clear: () => writeEvents([]), getConsent: readConsent };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true }); else bind();

export {};
