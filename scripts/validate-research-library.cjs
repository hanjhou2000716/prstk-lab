const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const topics = JSON.parse(fs.readFileSync(path.join(root, 'src/data/research-topics.json'), 'utf8'));
const glossary = JSON.parse(fs.readFileSync(path.join(root, 'src/data/glossary.json'), 'utf8'));
const slugs = new Set();
for (const topic of topics) {
  if (!topic.slug || !topic.title || !topic.summary || !Array.isArray(topic.tools) || !Array.isArray(topic.research) || !Array.isArray(topic.methods)) throw new Error(`Invalid research topic: ${topic.slug || '<unknown>'}`);
  if (slugs.has(topic.slug)) throw new Error(`Duplicate research topic: ${topic.slug}`);
  slugs.add(topic.slug);
}
const terms = new Set();
for (const item of glossary) {
  if (!item.term || !item.name || !item.definition || !Array.isArray(item.related)) throw new Error(`Invalid glossary item: ${item.term || '<unknown>'}`);
  if (terms.has(item.term)) throw new Error(`Duplicate glossary term: ${item.term}`);
  terms.add(item.term);
}
console.log(`Research library valid: ${topics.length} topic(s), ${glossary.length} glossary term(s).`);
