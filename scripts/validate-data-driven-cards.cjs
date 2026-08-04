const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'src', 'pages', 'index.astro');
const dataPath = path.join(root, 'src', 'data', 'tools.json');
const page = fs.readFileSync(pagePath, 'utf8');
const tools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const errors = [];
const ids = new Set();
const slugs = new Set();

for (const tool of tools) {
  if (ids.has(tool.id)) errors.push(`Duplicate tool id: ${tool.id}`);
  if (slugs.has(tool.slug)) errors.push(`Duplicate tool slug: ${tool.slug}`);
  ids.add(tool.id);
  slugs.add(tool.slug);
}

const forbiddenPatterns = [
  { pattern: /onclick\s*=\s*["']openDrawer\(/, message: 'Static openDrawer onclick handler found.' },
  { pattern: /openDrawer\(\s*\d+\s*\)/, message: 'Numeric openDrawer index found.' },
  { pattern: /const\s+toolCatalog\s*=\s*\[/, message: 'Static tool catalog array found.' }
];

for (const { pattern, message } of forbiddenPatterns) {
  if (pattern.test(page)) errors.push(message);
}

for (const required of ['id="tool-data"', 'renderCatalogSections', 'toolById']) {
  if (!page.includes(required)) errors.push(`Missing data-driven renderer marker: ${required}`);
}

if (!tools.length) errors.push('Tool data is empty.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Data-driven cards valid: ${tools.length} tools, stable IDs/slugs, no static card or numeric drawer handlers.`);
