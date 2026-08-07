const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = fs.readFileSync(path.join(root, 'docs', 'index.html'), 'utf8');

test('generated site keeps the one-page interaction anchors', () => {
  for (const marker of ['tool-search', 'category-filters', 'scenario-entries', 'home-card-grid', 'tool-panel', 'info-drawer', 'tool-card-template']) {
    assert.ok(output.includes(`id="${marker}"`), `missing ${marker}`);
  }
  assert.match(output, /<script id="tool-data" type="application\/json">/);
  assert.match(output, /_astro\/index\.[^"']+\.js/);
});

test('generated site has no inline executable script or unsafe CSP', () => {
  assert.doesNotMatch(output, /script-src[^>]*unsafe-inline/);
  assert.doesNotMatch(output, /<script>\s*(?:const|let|function|document\.)/);
});

test('generated site removes the retired compare feature', () => {
  for (const marker of ['compare-bar', 'compare-panel', 'data-tool-action="compare"', 'columns-3', '比較工具']) {
    assert.doesNotMatch(output, new RegExp(marker), `retired compare marker remains: ${marker}`);
  }
});
