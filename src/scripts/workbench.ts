import type { ResearchProject, ResearchProjectDraft, ResearchStatus } from '../types/workbench';

const storageKey = 'prstk-lab-workbench-v1';
const templates: Record<string, Partial<ResearchProjectDraft>> = {
  company: { question: '這家公司是否具備可持續的競爭優勢？', hypothesis: '公司的基本面與競爭優勢能支持長期成長。', risks: '估值過高、產業週期反轉、關鍵假設失效。', methodology: '基本面、產業結構與估值交叉檢查。' },
  etf: { question: '這檔 ETF 的曝險與費用是否符合配置目的？', hypothesis: '標的曝險、流動性與費用結構符合配置需求。', risks: '折溢價、追蹤誤差、槓桿耗損與流動性。', methodology: '成分、費用、追蹤誤差與情境壓力測試。' },
  strategy: { question: '策略在不同市場情境下是否仍有風險報酬優勢？', hypothesis: '策略在明確風控下可重複執行。', risks: '過度擬合、交易成本、樣本外失效。', methodology: '樣本內外回測、交易成本與最大回撤檢查。' },
  allocation: { question: '目前資產權重是否符合目標與風險承受度？', hypothesis: '配置能在可接受波動下支持長期目標。', risks: '集中度、流動性、再平衡與極端行情。', methodology: '目標權重、相關性、回撤與再平衡情境。' },
  event: { question: '這項市場事件會如何改變投資假設？', hypothesis: '事件影響可透過來源與情境分析拆解。', risks: '資訊不完整、政策變動、情緒擴散。', methodology: '時間線、第一手來源與多情境推演。' },
  risk: { question: '最壞情境下的損失與應對方案是什麼？', hypothesis: '事前定義風險界線能降低被動反應。', risks: '流動性枯竭、槓桿追繳、相關性上升。', methodology: '壓力測試、流動性檢查與去槓桿 SOP。' },
  review: { question: '事後結果與原先投資假設有何差異？', hypothesis: '透過事後檢討可修正流程而非追逐結果。', risks: '結果偏誤、倖存者偏差、事後合理化。', methodology: '對照原始假設、結果與失效條件。' }
};

const fieldIds = ['title', 'target', 'question', 'hypothesis', 'evidence', 'sources', 'methodology', 'assumptions', 'risks', 'invalidationConditions', 'decision', 'confidence', 'status', 'nextReviewDate', 'reviewOutcome'] as const;
type FieldId = typeof fieldIds[number];
type FormElements = Record<FieldId, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`缺少工作台元素：${id}`);
  return element as T;
};
const formElements = (): FormElements => Object.fromEntries(fieldIds.map(id => [id, getElement<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(id)])) as FormElements;
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const validStatuses: ResearchStatus[] = ['draft', 'active', 'completed', 'archived'];

const defaults: ResearchProjectDraft = {
  title: '', target: '', question: '', hypothesis: '', evidence: '', sources: '', methodology: '', assumptions: '', risks: '', invalidationConditions: '',
  decision: '觀望', confidence: '尚未評估', status: 'draft', nextReviewDate: '', reviewOutcome: ''
};

const normaliseProject = (value: unknown, fallbackId?: string): ResearchProject | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const title = text(record.title);
  if (!title) return null;
  const decision = record.decision === '買入' || record.decision === '賣出' ? record.decision : '觀望';
  const confidence = ['低', '中', '高'].includes(text(record.confidence)) ? text(record.confidence) : '尚未評估';
  const status = validStatuses.includes(record.status as ResearchStatus) ? record.status as ResearchStatus : 'draft';
  const now = new Date().toISOString();
  return {
    ...defaults,
    ...Object.fromEntries(fieldIds.map(id => [id, text(record[id])])),
    title,
    decision,
    confidence: confidence as ResearchProject['confidence'],
    status,
    id: text(record.id) || fallbackId || globalThis.crypto.randomUUID(),
    createdAt: text(record.createdAt) || now,
    updatedAt: text(record.updatedAt) || now
  } as ResearchProject;
};

let projects: ResearchProject[] = loadProjects();
let editingId: string | null = null;

function loadProjects(): ResearchProject[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value.map(item => normaliseProject(item)).filter((item): item is ResearchProject => Boolean(item)) : [];
  } catch { return []; }
}
function persist(): void { localStorage.setItem(storageKey, JSON.stringify(projects)); }
function announce(message: string): void { getElement<HTMLElement>('workbench-status').textContent = message; }
function readForm(): ResearchProjectDraft {
  const elements = formElements();
  const values = Object.fromEntries(fieldIds.map(id => [id, elements[id].value.trim()])) as ResearchProjectDraft;
  return { ...defaults, ...values, decision: values.decision as ResearchProject['decision'], confidence: values.confidence as ResearchProject['confidence'], status: values.status as ResearchStatus };
}
function fillForm(project: ResearchProject): void {
  const elements = formElements();
  fieldIds.forEach(id => { elements[id].value = project[id]; });
  getElement<HTMLElement>('project-form-title').textContent = '編輯研究案';
  editingId = project.id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function resetForm(): void { getElement<HTMLFormElement>('project-form').reset(); getElement<HTMLElement>('project-form-title').textContent = '建立研究案'; editingId = null; }
function render(): void {
  const list = getElement<HTMLElement>('project-list');
  list.replaceChildren();
  getElement<HTMLElement>('project-count').textContent = `${projects.length} 個研究案`;
  getElement<HTMLElement>('project-empty').hidden = projects.length > 0;
  projects.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).forEach(project => {
    const card = document.createElement('article'); card.className = 'rounded-2xl border border-muji-border bg-white/85 p-4 shadow-sm';
    const head = document.createElement('div'); head.className = 'flex items-start justify-between gap-3';
    const title = document.createElement('div'); const h3 = document.createElement('h3'); h3.className = 'font-semibold'; h3.textContent = project.title;
    const meta = document.createElement('p'); meta.className = 'mt-1 text-xs text-muji-muted'; meta.textContent = `${project.target || '未指定標的'} · ${project.status}${project.decision ? ` · ${project.decision}` : ''}${project.nextReviewDate ? ` · 下次檢查 ${project.nextReviewDate}` : ''}`;
    title.append(h3, meta);
    const actions = document.createElement('div'); actions.className = 'flex shrink-0 gap-1';
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'rounded-full px-2.5 py-1.5 text-[11px] text-muji-muted hover:bg-muji-bg hover:text-orange'; edit.textContent = '編輯'; edit.addEventListener('click', () => fillForm(project));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = edit.className; remove.textContent = '刪除'; remove.addEventListener('click', () => removeProject(project.id));
    actions.append(edit, remove); head.append(title, actions);
    const body = document.createElement('p'); body.className = 'mt-3 line-clamp-3 text-sm leading-6 text-muji-muted'; body.textContent = project.question || '尚未填寫研究問題。';
    card.append(head, body); list.append(card);
  });
}
function removeProject(id: string): void { projects = projects.filter(project => project.id !== id); persist(); render(); announce('研究案已刪除。'); }
function download(name: string, content: string, type: string): void { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
function exportJson(): void { download('prstk-research-backup.json', JSON.stringify(projects, null, 2), 'application/json'); announce('JSON 備份已下載。'); }
function exportMarkdown(): void {
  const textContent = projects.map(project => `# ${project.title}\n\n- 標的：${project.target}\n- 狀態：${project.status}\n- 決策：${project.decision}\n- 信心：${project.confidence}\n- 下次檢查：${project.nextReviewDate || '未設定'}\n\n## 研究問題\n${project.question}\n\n## 投資假設\n${project.hypothesis}\n\n## 證據與來源\n${project.evidence}\n\n## 原始來源\n${project.sources}\n\n## 方法與前提\n${project.methodology}\n\n${project.assumptions}\n\n## 風險與失效條件\n${project.risks}\n${project.invalidationConditions}\n\n## 事後檢討\n${project.reviewOutcome}\n`).join('\n---\n');
  download('prstk-research.md', textContent, 'text/markdown;charset=utf-8'); announce('Markdown 報告已下載。');
}
function exportCsv(): void { const headers = fieldIds.join(','); const rows = projects.map(project => fieldIds.map(field => `"${String(project[field] || '').replaceAll('"', '""')}"`).join(',')); download('prstk-research.csv', [headers, ...rows].join('\n'), 'text/csv;charset=utf-8'); announce('CSV 觀察清單已下載。'); }

const elements = formElements();
getElement<HTMLSelectElement>('template').addEventListener('change', event => { const template = templates[(event.target as HTMLSelectElement).value]; if (template) Object.entries(template).forEach(([id, value]) => { elements[id as FieldId].value = value || ''; }); });
getElement<HTMLFormElement>('project-form').addEventListener('submit', event => {
  event.preventDefault(); const data = readForm(); if (!data.title) return; const now = new Date().toISOString();
  if (editingId) projects = projects.map(project => project.id === editingId ? { ...project, ...data, updatedAt: now } : project);
  else projects.unshift({ ...data, id: globalThis.crypto.randomUUID(), createdAt: now, updatedAt: now });
  persist(); render(); resetForm(); announce('研究案已儲存到本機。');
});
getElement<HTMLButtonElement>('reset-form').addEventListener('click', resetForm);
getElement<HTMLButtonElement>('export-json').addEventListener('click', exportJson);
getElement<HTMLButtonElement>('export-markdown').addEventListener('click', exportMarkdown);
getElement<HTMLButtonElement>('export-csv').addEventListener('click', exportCsv);
getElement<HTMLButtonElement>('import-data').addEventListener('click', () => getElement<HTMLInputElement>('import-file').click());
getElement<HTMLInputElement>('import-file').addEventListener('change', event => {
  const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
  const reader = new FileReader(); reader.onload = () => { try { const incoming: unknown = JSON.parse(String(reader.result)); if (!Array.isArray(incoming)) throw new Error(); projects = incoming.map((item, index) => normaliseProject(item, `imported-${index + 1}-${globalThis.crypto.randomUUID()}`)).filter((item): item is ResearchProject => Boolean(item)); persist(); render(); announce(`已匯入 ${projects.length} 個研究案。`); } catch { announce('匯入失敗：請選擇有效的 JSON 備份。'); } }; reader.readAsText(file);
});
render();

import('./workbench-sync').then(({ bindWorkbenchControls }) => bindWorkbenchControls({ getProjects: () => projects, replaceProjects: incoming => { projects = incoming.map(item => normaliseProject(item)).filter((item): item is ResearchProject => Boolean(item)); persist(); render(); } })).catch(() => { const status = document.getElementById('sync-status'); if (status) status.textContent = '同步模組暫時無法載入，仍可使用本機模式。'; });
