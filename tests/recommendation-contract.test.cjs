const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const tools = require('../src/data/tools.json');

const main = fs.readFileSync('src/scripts/main.ts', 'utf8');

test('unavailable tools are excluded from homepage recommendations', () => {
  assert.match(main, /const isUnavailable = \(tool: Tool\)/);
  assert.match(main, /\.filter\(\(\{ tool \}\) => !isUnavailable\(tool\)\)/);
  assert.match(main, /pins\.has\(toolId\) && !isUnavailable\(tool\)/);
  assert.match(main, /const visibleEntries = activeScenario \? entries\.filter\(\(\{ tool \}\) => !isUnavailable\(tool\)\) : entries/);
  for (const id of ['solitude']) {
    const tool = tools.find(item => item.id === id);
    assert.equal(tool.status, 'unavailable', `${id} should be marked unavailable after link checks`);
  }
});

test('legacy task deep links remain compatible without homepage shortcuts', () => {
  assert.match(main, /const resolveLegacyScenario = \(task: string \| null\)/);
  assert.match(main, /activeScenario = resolveLegacyScenario\(params\.get\('task'\)\)/);
  for (const [task, category] of [
    ['find-opportunities', 'explore'],
    ['research-security', 'research'],
    ['check-risk', 'risk'],
    ['plan-assets', 'allocation']
  ]) {
    assert.match(main, new RegExp(`'${task}': '${category}'`));
  }
  assert.match(main, /activeCategory = scenarioCategories\[activeScenario\]/);
  assert.match(main, /activeScenario = '';/);
});

test('tool detail exposes verification status and last check date', () => {
  assert.match(fs.readFileSync('src/components/ToolDetail.astro', 'utf8'), /drawer-status/);
  assert.match(main, /最後檢查/);
});
