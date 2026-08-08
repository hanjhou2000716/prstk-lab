const test = require('node:test');
const assert = require('node:assert/strict');
const tools = require('../src/data/tools.json');

const normalise = value => String(value || '').normalize('NFKC').toLocaleLowerCase('zh-TW').replace(/\s+/g, '');
const score = (tool, rawQuery) => {
  const query = normalise(rawQuery);
  const name = normalise(tool.name);
  const brand = normalise(tool.brandName);
  const aliases = (tool.aliases || []).map(normalise);
  const tags = (tool.tags || []).map(normalise);
  let value = 0;
  if (name === query) value += 10;
  if (brand === query) value += 9;
  if (aliases.some(item => item === query)) value += 8;
  if (name.includes(query) || brand.includes(query)) value += 6;
  if (aliases.some(item => item.includes(query))) value += 4;
  if (tags.some(item => item === query)) value += 5;
  if (tags.some(item => item.includes(query))) value += 3;
  if (normalise(tool.summary).includes(query)) value += 2;
  if (normalise(tool.description).includes(query)) value += 1;
  return value;
};

const acceptanceQueries = ['ETF', 'ETF 重疊', '台股 ETF', '質押', '質押維持率', '法人', '法人籌碼', '退休', '槓桿', 'AI', '台股', '美股', '回測', '量化', '選股', '技術分析', '風控', '資產配置', '產業輪動', '資金流'];

for (const query of acceptanceQueries) {
  test(`semantic search: ${query}`, () => {
    const ranked = tools.map(tool => ({ tool, score: score(tool, query) }))
      .filter(item => item.score > 0)
      .sort((left, right) => right.score - left.score || left.tool.name.localeCompare(right.tool.name, 'zh-TW'));
    assert.ok(ranked.length > 0, `expected a result for ${query}`);
    assert.ok(ranked.slice(0, 3).some(item => item.score >= 3), `expected a relevant top-three result for ${query}`);
  });
}
