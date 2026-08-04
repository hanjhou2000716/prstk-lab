(() => {
  const lastSeenKey = 'prstk-lab-last-seen-update-v1';
  const entries = [...document.querySelectorAll('[data-update-id]')];
  const readLastSeen = () => {
    try { return localStorage.getItem(lastSeenKey) || ''; } catch { return ''; }
  };
  const writeLastSeen = value => {
    try { localStorage.setItem(lastSeenKey, value); } catch { /* Optional revisit state. */ }
  };
  const render = () => {
    const lastSeen = readLastSeen();
    const unread = entries.filter(entry => entry.dataset.updateId !== lastSeen);
    entries.forEach(entry => entry.querySelector('.update-new')?.classList.toggle('hidden', entry.dataset.updateId === lastSeen));
    const status = document.getElementById('updates-status');
    if (status) {
      status.dataset.runtime = 'local-only';
      status.textContent = unread.length ? `${unread.length} 項更新尚未閱讀` : '已看過最新更新。';
    }
  };
  document.getElementById('mark-updates-read')?.addEventListener('click', () => {
    if (entries[0]) writeLastSeen(entries[0].dataset.updateId);
    render();
  });
  entries.forEach(entry => entry.querySelectorAll('a').forEach(link => link.addEventListener('click', () => writeLastSeen(entry.dataset.updateId))));
  render();
})();
