// @ts-nocheck
const storageKey = 'prstk-lab-workbench-v1';
const templates = {
  company: { question: '這家公司是否具備可持續的競爭優勢？', hypothesis: '公司的基本面與競爭優勢能支持長期成長。', risks: '估值過高、產業週期反轉、關鍵假設失效。' },
  etf: { question: '這檔 ETF 的曝險與費用是否符合配置目的？', hypothesis: '標的曝險、流動性與費用結構符合配置需求。', risks: '折溢價、追蹤誤差、槓桿耗損與流動性。' },
  strategy: { question: '策略在不同市場情境下是否仍有風險報酬優勢？', hypothesis: '策略在明確風控下可重複執行。', risks: '過度擬合、交易成本、樣本外失效。' },
  allocation: { question: '目前資產權重是否符合目標與風險承受度？', hypothesis: '配置能在可接受波動下支持長期目標。', risks: '集中度、流動性、再平衡與極端行情。' },
  event: { question: '這項市場事件會如何改變投資假設？', hypothesis: '事件影響可透過來源與情境分析拆解。', risks: '資訊不完整、政策變動、情緒擴散。' },
  risk: { question: '最壞情境下的損失與應對方案是什麼？', hypothesis: '事前定義風險界線能降低被動反應。', risks: '流動性枯竭、槓桿追繳、相關性上升。' },
  review: { question: '事後結果與原先投資假設有何差異？', hypothesis: '透過事後檢討可修正流程而非追逐結果。', risks: '結果偏誤、倖存者偏差、事後合理化。' }
};
const $ = id => document.getElementById(id);
const fields = ['title', 'target', 'question', 'hypothesis', 'evidence', 'risks', 'decision', 'confidence', 'status', 'nextReviewDate'];
let projects = loadProjects();
let editingId = null;
function loadProjects() { try { const value = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
function persist() { localStorage.setItem(storageKey, JSON.stringify(projects)); }
function announce(message) { $('workbench-status').textContent = message; }
function readForm() { return Object.fromEntries(fields.map(id => [id, $(id).value.trim()])); }
function fillForm(project) { fields.forEach(id => { $(id).value = project[id] || ''; }); $('project-form-title').textContent = '編輯研究案'; editingId = project.id; window.scrollTo({ top: 0, behavior: 'smooth' }); }
function resetForm() { $('project-form').reset(); $('project-form-title').textContent = '建立研究案'; editingId = null; }
function render() {
  const list = $('project-list'); list.replaceChildren(); $('project-count').textContent = `${projects.length} 個研究案`; $('project-empty').hidden = projects.length > 0;
  projects.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).forEach(project => {
    const card = document.createElement('article'); card.className = 'rounded-2xl border border-muji-border bg-white/85 p-4 shadow-sm';
    const head = document.createElement('div'); head.className = 'flex items-start justify-between gap-3';
    const title = document.createElement('div'); const h3 = document.createElement('h3'); h3.className = 'font-semibold'; h3.textContent = project.title || '未命名研究案'; const meta = document.createElement('p'); meta.className = 'mt-1 text-xs text-muji-muted'; meta.textContent = `${project.target || '未指定標的'} · ${project.status || 'draft'}${project.nextReviewDate ? ` · 下次檢查 ${project.nextReviewDate}` : ''}`; title.append(h3, meta);
    const actions = document.createElement('div'); actions.className = 'flex shrink-0 gap-1'; ['編輯', '刪除'].forEach(label => { const button = document.createElement('button'); button.type = 'button'; button.className = 'rounded-full px-2.5 py-1.5 text-[11px] text-muji-muted hover:bg-muji-bg hover:text-orange'; button.textContent = label; button.addEventListener('click', () => label === '編輯' ? fillForm(project) : remove(project.id)); actions.append(button); }); head.append(title, actions);
    const body = document.createElement('p'); body.className = 'mt-3 line-clamp-3 text-sm leading-6 text-muji-muted'; body.textContent = project.question || '尚未填寫研究問題。'; card.append(head, body); list.append(card);
  });
}
function remove(id) { projects = projects.filter(project => project.id !== id); persist(); render(); announce('研究案已刪除。'); }
function download(name, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
function exportJson() { download('prstk-research-backup.json', JSON.stringify(projects, null, 2), 'application/json'); announce('JSON 備份已下載。'); }
function exportMarkdown() { const text = projects.map(project => `# ${project.title}\n\n- 標的：${project.target}\n- 狀態：${project.status}\n- 決策：${project.decision}\n- 信心：${project.confidence}\n- 下次檢查：${project.nextReviewDate || '未設定'}\n\n## 研究問題\n${project.question}\n\n## 投資假設\n${project.hypothesis}\n\n## 證據與來源\n${project.evidence}\n\n## 風險與失效條件\n${project.risks}\n`).join('\n---\n'); download('prstk-research.md', text, 'text/markdown;charset=utf-8'); announce('Markdown 報告已下載。'); }
function exportCsv() { const headers = fields.join(','); const rows = projects.map(project => fields.map(field => `"${String(project[field] || '').replaceAll('"', '""')}"`).join(',')); download('prstk-research.csv', [headers, ...rows].join('\n'), 'text/csv;charset=utf-8'); announce('CSV 觀察清單已下載。'); }
$('template').addEventListener('change', event => { const template = templates[event.target.value]; if (!template) return; Object.entries(template).forEach(([id, value]) => { $(id).value = value; }); });
$('project-form').addEventListener('submit', event => { event.preventDefault(); const data = readForm(); if (!data.title) return; const now = new Date().toISOString(); if (editingId) projects = projects.map(project => project.id === editingId ? { ...project, ...data, updatedAt: now } : project); else projects.unshift({ id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now }); persist(); render(); resetForm(); announce('研究案已儲存到本機。'); });
$('reset-form').addEventListener('click', resetForm); $('export-json').addEventListener('click', exportJson); $('export-markdown').addEventListener('click', exportMarkdown); $('export-csv').addEventListener('click', exportCsv); $('import-data').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const incoming = JSON.parse(reader.result); if (!Array.isArray(incoming)) throw new Error(); projects = incoming.filter(project => project && typeof project === 'object' && project.title).map(project => ({ ...project, id: project.id || crypto.randomUUID() })); persist(); render(); announce(`已匯入 ${projects.length} 個研究案。`); } catch { announce('匯入失敗：請選擇有效的 JSON 備份。'); } }; reader.readAsText(file); });
render();
