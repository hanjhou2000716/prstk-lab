const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const tools = require('../src/data/tools.json');

const main = fs.readFileSync('src/scripts/main.ts', 'utf8');

test('unavailable tools are excluded from homepage recommendations', () => {
  assert.match(main, /const isUnavailable = \(tool: Tool\)/);
  assert.match(main, /\.filter\(\(\{ tool \}\) => !isUnavailable\(tool\)\)/);
  assert.match(main, /pins\.has\(toolId\) && !isUnavailable\(tool\)/);
  assert.match(main, /const scenarioEntries = activeScenario \? entries\.filter\(\(\{ tool \}\) => !isUnavailable\(tool\)\) : entries/);
  for (const id of ['quants-tw', 'solitude']) {
    const tool = tools.find(item => item.id === id);
    assert.equal(tool.status, 'unavailable', `${id} should be marked unavailable after link checks`);
  }
});

test('tool detail exposes verification status and last check date', () => {
  assert.match(fs.readFileSync('src/components/ToolDetail.astro', 'utf8'), /drawer-status/);
  assert.match(main, /最後檢查/);
});
