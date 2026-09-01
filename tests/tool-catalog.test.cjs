const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tools = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'tools.json'), 'utf8'));

test('catalog keeps all baseline tools with unique IDs and slugs', () => {
  assert.equal(tools.length, 34);
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

test('new catalog entries replace unavailable TradeLens without changing featured tools', () => {
  assert.equal(tools.find(tool => tool.id === 'tradelens'), undefined);
  const expected = {
    'digital-garden': 'research',
    echoequity: 'strategy',
    'twrs-matrix': 'strategy',
    'ais-cloud': 'risk'
  };
  for (const [id, category] of Object.entries(expected)) {
    const tool = tools.find(entry => entry.id === id);
    assert.ok(tool, `missing ${id}`);
    assert.deepEqual(tool.categories, [category]);
    assert.equal(tool.status, 'pending-verification');
    assert.equal(tool.featured, false);
  }
  assert.equal(tools.find(tool => tool.id === 'echoequity')?.brandName, 'TWETQ Engine');
  assert.equal(tools.filter(tool => tool.featured).length, 4);
});

test('legacy favorite and pin migration can resolve every catalog index', () => {
  for (let index = 0; index < tools.length; index += 1) {
    assert.ok(tools[index].id, `missing id at index ${index}`);
  }
});

test('new catalog tools remain unfeatured and use the requested categories', () => {
  const expected = {
    'clec-tw': 'research',
    'rocketstock-ai': 'strategy'
  };
  for (const [id, category] of Object.entries(expected)) {
    const tool = tools.find(item => item.id === id);
    assert.ok(tool, `missing ${id}`);
    assert.deepEqual(tool.categories, [category]);
    assert.equal(tool.status, 'pending-verification');
    assert.equal(tool.featured, false);
    assert.match(tool.url, /^https:\/\//);
  }
  assert.equal(tools.filter(tool => tool.featured).length, 4);
});
