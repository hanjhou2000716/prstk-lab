const fs = require('node:fs');
const path = require('node:path');
const page = fs.readFileSync(path.join(process.cwd(), 'src/pages/workbench/index.astro'), 'utf8');
const script = fs.readFileSync(path.join(process.cwd(), 'src/scripts/workbench.ts'), 'utf8');
for (const marker of ['project-form', 'export-json', 'import-file', 'project-list', 'sources', 'methodology', 'invalidationConditions', 'reviewOutcome']) if (!page.includes(marker)) throw new Error(`Workbench page missing ${marker}.`);
for (const marker of ['localStorage', 'exportJson', 'exportMarkdown', 'exportCsv', 'normaliseProject', 'reviewOutcome']) if (!script.includes(marker)) throw new Error(`Workbench runtime missing ${marker}.`);
if (script.includes('@ts-nocheck')) throw new Error('Workbench runtime must use explicit TypeScript types.');
if (/<script\s+is:inline/i.test(page)) throw new Error('Workbench must not use inline executable scripts.');
console.log('Workbench contract valid: local research CRUD and import/export controls present.');
