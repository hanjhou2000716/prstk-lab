const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

function extractConst(name) {
  const marker = `const ${name} = `;
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`Unable to find ${name} in index.html`);
  const end = html.indexOf('];', start);
  if (end < 0) throw new Error(`Unable to find end of ${name}`);
  const snippet = html.slice(start, end + 2).replace(`const ${name}`, 'module.exports');
  const sandbox = { module: { exports: null } };
  vm.runInNewContext(snippet, sandbox, { filename: 'index.html' });
  return sandbox.module.exports;
}

const tools = extractConst('toolCatalog');
const categories = extractConst('categories');
const requiredToolFields = ['id', 'category', 'title', 'subtitle', 'features', 'targets', 'link'];
const ids = new Set();
const links = new Set();

for (const tool of tools) {
  for (const field of requiredToolFields) {
    if (!(field in tool)) throw new Error(`Tool ${tool.id || '<unknown>'} is missing ${field}`);
  }
  if (ids.has(tool.id)) throw new Error(`Duplicate tool id: ${tool.id}`);
  if (links.has(tool.link)) throw new Error(`Duplicate tool URL: ${tool.link}`);
  if (!/^https:\/\//.test(tool.link)) throw new Error(`Tool ${tool.id} URL must use HTTPS: ${tool.link}`);
  if (!categories.some(category => category.id === tool.category)) {
    throw new Error(`Tool ${tool.id} uses unknown category: ${tool.category}`);
  }
  ids.add(tool.id);
  links.add(tool.link);
}

const capturedAt = process.env.BASELINE_DATE || '2026-08-04';
const sourceCommit = process.env.BASELINE_COMMIT || '105b1cd';
const categoryCounts = Object.fromEntries(categories.map(category => [
  category.id,
  tools.filter(tool => tool.category === category.id).length,
]));

const baseline = {
  schemaVersion: 'release-0-a01-v1',
  capturedAt,
  sourceCommit,
  sourceFile: 'index.html',
  toolCount: tools.length,
  categoryCount: categories.length,
  categories: categories.map(category => ({ ...category, toolCount: categoryCounts[category.id] })),
  tools: tools.map(tool => ({
    id: tool.id,
    category: tool.category,
    title: tool.title,
    brandName: tool.subtitle,
    url: tool.link,
    featureCount: Array.isArray(tool.features) ? tool.features.length : 0,
    targetCount: Array.isArray(tool.targets) ? tool.targets.length : 0,
  })),
};

const outputPath = path.join(repoRoot, 'docs', 'release-0', 'baseline-tools.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
console.log(`Captured ${baseline.toolCount} tools across ${baseline.categoryCount} categories.`);
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
