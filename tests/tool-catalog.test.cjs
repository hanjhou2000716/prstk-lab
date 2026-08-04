const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tools = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'tools.json'), 'utf8'));

test('catalog keeps all baseline tools with unique IDs and slugs', () => {
  assert.equal(tools.length, 28);
  assert.equal(new Set(tools.map(tool => tool.id)).size, tools.length);
  assert.equal(new Set(tools.map(tool => tool.slug)).size, tools.length);
});

test('every tool has a safe HTTPS destination and category', () => {
  for (const tool of tools) {
    assert.match(tool.url, /^https:\/\//, tool.id);
    assert.ok(tool.categories.length > 0, tool.id);
    assert.ok(tool.name && tool.brandName, tool.id);
  }
});

test('legacy favorite and pin migration can resolve every catalog index', () => {
  for (let index = 0; index < tools.length; index += 1) {
    assert.ok(tools[index].id, `missing id at index ${index}`);
  }
});
