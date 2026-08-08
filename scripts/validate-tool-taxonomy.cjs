const fs = require('node:fs');
const path = require('node:path');

const tools = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/tools.json'), 'utf8'));
const allowedTags = new Set([
  '台股', '美股', '全球', '選股', '籌碼', '回測', 'ETF', '退休', '資產配置', '產業研究', '新聞',
  '市場情緒', '總經', '風控', '質押', '槓桿', '維持率', '法人', '技術分析', '基本面', '波動',
  'ETF重疊', '回撤', '資金流', '產業輪動', '量化', '波段', '長期投資'
]);

const errors = [];
for (const tool of tools) {
  if (!Array.isArray(tool.tags) || tool.tags.length < 2 || tool.tags.length > 6) {
    errors.push(`${tool.id}: tags must contain 2–6 entries`);
  }
  if (!Array.isArray(tool.aliases) || tool.aliases.length < 2 || tool.aliases.length > 6) {
    errors.push(`${tool.id}: aliases must contain 2–6 entries`);
  }
  for (const tag of tool.tags || []) {
    if (!allowedTags.has(tag)) errors.push(`${tool.id}: unsupported tag ${tag}`);
  }
  if (new Set(tool.tags || []).size !== (tool.tags || []).length) errors.push(`${tool.id}: duplicate tags`);
  if (new Set(tool.aliases || []).size !== (tool.aliases || []).length) errors.push(`${tool.id}: duplicate aliases`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Semantic taxonomy valid: ${tools.length} tools, bounded tags and aliases.`);
