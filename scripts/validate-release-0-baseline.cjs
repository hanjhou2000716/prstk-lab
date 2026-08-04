const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const filePath = path.join(repoRoot, 'docs', 'release-0', 'baseline-tools.json');
const baseline = JSON.parse(fs.readFileSync(filePath, 'utf8'));

if (baseline.schemaVersion !== 'release-0-a01-v1') throw new Error('Unexpected A01 schema version');
if (baseline.toolCount !== 28) throw new Error(`Expected 28 tools, found ${baseline.toolCount}`);
if (baseline.categoryCount !== 5) throw new Error(`Expected 5 categories, found ${baseline.categoryCount}`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(baseline.capturedAt)) throw new Error('capturedAt must use YYYY-MM-DD');

const ids = new Set();
const urls = new Set();
for (const tool of baseline.tools) {
  for (const field of ['id', 'category', 'title', 'brandName', 'url']) {
    if (!tool[field]) throw new Error(`${tool.id || '<unknown>'} is missing ${field}`);
  }
  if (ids.has(tool.id)) throw new Error(`Duplicate tool id: ${tool.id}`);
  if (urls.has(tool.url)) throw new Error(`Duplicate URL: ${tool.url}`);
  if (!/^https:\/\//.test(tool.url)) throw new Error(`Non-HTTPS URL: ${tool.url}`);
  ids.add(tool.id);
  urls.add(tool.url);
}

const countedTools = baseline.categories.reduce((total, category) => total + category.toolCount, 0);
if (countedTools !== baseline.toolCount) throw new Error('Category counts do not add up to toolCount');

console.log(`A01 baseline valid: ${baseline.toolCount} tools, ${baseline.categoryCount} categories.`);
