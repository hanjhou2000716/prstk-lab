const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src', 'data', 'schema', 'tool.schema.json'), 'utf8'));
const tools = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src', 'data', 'tools.json'), 'utf8'));
const required = schema.required;
const properties = schema.properties;
const enumFields = ['pricing', 'requiresLogin', 'mobileSupport', 'updateFrequency', 'status'];
const arrayFields = ['categories', 'useCases', 'markets', 'assetClasses', 'analysisTypes', 'language', 'dataSources', 'features', 'limitations', 'targetUsers', 'tags', 'aliases', 'screenshots', 'relatedTools', 'relatedResearch'];
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const ids = new Set();
const slugs = new Set();
const urls = new Set();

if (!Array.isArray(tools)) throw new Error('src/data/tools.json must contain an array');
if (tools.length !== 28) throw new Error(`Expected 28 tools, found ${tools.length}`);

for (const tool of tools) {
  for (const field of required) {
    if (!(field in tool)) throw new Error(`${tool.id || '<unknown>'} is missing required field ${field}`);
  }
  for (const field of Object.keys(tool)) {
    if (!properties[field]) throw new Error(`${tool.id || '<unknown>'} has unknown field ${field}`);
  }
  if (!idPattern.test(tool.id) || !idPattern.test(tool.slug)) throw new Error(`${tool.id} id/slug must be kebab-case`);
  if (ids.has(tool.id)) throw new Error(`Duplicate id: ${tool.id}`);
  if (slugs.has(tool.slug)) throw new Error(`Duplicate slug: ${tool.slug}`);
  ids.add(tool.id);
  slugs.add(tool.slug);
  if (typeof tool.url !== 'string' || !/^https:\/\//.test(tool.url)) throw new Error(`${tool.id} URL must use HTTPS`);
  try { new URL(tool.url); } catch { throw new Error(`${tool.id} URL is invalid: ${tool.url}`); }
  if (urls.has(tool.url)) throw new Error(`Duplicate URL: ${tool.url}`);
  urls.add(tool.url);
  if (!datePattern.test(tool.lastVerifiedAt)) throw new Error(`${tool.id} lastVerifiedAt must use YYYY-MM-DD`);
  for (const field of enumFields) {
    if (!schema.properties[field].enum.includes(tool[field])) throw new Error(`${tool.id} has invalid ${field}: ${tool[field]}`);
  }
  for (const field of arrayFields) {
    if (!Array.isArray(tool[field])) throw new Error(`${tool.id}.${field} must be an array`);
    if (new Set(tool[field]).size !== tool[field].length) throw new Error(`${tool.id}.${field} contains duplicates`);
  }
  for (const field of ['features', 'limitations', 'targetUsers']) {
    if (!tool[field].length || tool[field].some(value => typeof value !== 'string' || !value.trim())) {
      throw new Error(`${tool.id}.${field} must contain non-empty strings`);
    }
  }
  if (typeof tool.featured !== 'boolean') throw new Error(`${tool.id}.featured must be boolean`);
}

for (const tool of tools) {
  for (const relatedId of tool.relatedTools) {
    if (!ids.has(relatedId)) throw new Error(`${tool.id} references unknown related tool ${relatedId}`);
  }
}

console.log(`Tool schema valid: ${tools.length} tools, ${required.length} required fields.`);
