const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const entries = JSON.parse(read('src/data/changelog.json'));
const page = read('src/pages/updates/index.astro');
if (!Array.isArray(entries) || !entries.length) throw new Error('Changelog must contain at least one entry.');
const ids = new Set();
for (const entry of entries) {
  for (const field of ['id', 'date', 'type', 'title', 'summary', 'links']) if (!(field in entry)) throw new Error(`Changelog entry missing ${field}.`);
  if (ids.has(entry.id)) throw new Error(`Duplicate changelog ID: ${entry.id}.`);
  ids.add(entry.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) throw new Error(`Invalid changelog date: ${entry.id}.`);
  if (!Array.isArray(entry.links)) throw new Error(`Changelog links must be an array: ${entry.id}.`);
}
for (const marker of ['data-update-id', 'mark-updates-read', 'updates-status']) if (!page.includes(marker)) throw new Error(`Updates page missing ${marker}.`);
console.log(`Updates valid: ${entries.length} entries with unique IDs and revisit state.`);
