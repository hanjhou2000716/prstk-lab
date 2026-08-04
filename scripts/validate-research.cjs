const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const entries = JSON.parse(fs.readFileSync(path.join(root, 'src/data/research.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'src/data/schema/research.schema.json'), 'utf8'));
if (!Array.isArray(entries) || !entries.length) throw new Error('Research catalog must contain at least one entry.');
const slugs = new Set();
for (const entry of entries) {
  for (const key of schema.required) if (!(key in entry)) throw new Error(`Research entry ${entry.slug || '<unknown>'} is missing ${key}.`);
  if (slugs.has(entry.slug)) throw new Error(`Duplicate research slug: ${entry.slug}`);
  slugs.add(entry.slug);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) throw new Error(`Unsafe research slug: ${entry.slug}`);
  for (const source of entry.sources) if (!/^https:\/\//.test(source.url)) throw new Error(`Research source must use HTTPS: ${entry.slug}`);
  for (const dateKey of ['publishedAt', 'updatedAt']) if (!/^\d{4}-\d{2}-\d{2}$/.test(entry[dateKey])) throw new Error(`Invalid ${dateKey}: ${entry.slug}`);
}
console.log(`Research content valid: ${entries.length} article(s), ${slugs.size} unique slug(s).`);
