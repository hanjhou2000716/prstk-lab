const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = fs.readFileSync(path.join(root, 'docs', 'index.html'), 'utf8');

test('generated site keeps the one-page interaction anchors', () => {
  for (const marker of ['tool-search', 'category-filters', 'scenario-entries', 'home-card-grid', 'tool-panel', 'info-drawer', 'tool-card-template', 'drawer-recommendation-reason']) {
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

test('generated homepage uses the segmented external entry footer', () => {
  assert.doesNotMatch(output, /class="research-entry"/, 'retired PRStK Research strip remains');
  assert.doesNotMatch(output, /Together Better/, 'retired Together Better label remains');
  assert.match(output, /class="footer-entry-pill"/);
  assert.match(output, /href="https:\/\/t\.me\/PRStK_Lab_bot"[^>]+target="_blank"[^>]+rel="noopener noreferrer"[^>]+referrerpolicy="no-referrer"/);
  assert.match(output, /href="https:\/\/hanjhou2000716\.github\.io\/prstk-taiwan-etf-research\/index\.html"[^>]+target="_blank"[^>]+rel="noopener noreferrer"[^>]+referrerpolicy="no-referrer"/);
  assert.match(output, /assets\/tg-logo\.webp/);
  assert.match(output, /assets\/sfc-e-logo\.webp/);
  assert.doesNotMatch(output, /<span>Telegram<\/span>|<span>PRStK Research<\/span>/, 'footer buttons should be icon-only');
  assert.equal((output.match(/class="footer-entry-link"/g) || []).length, 2, 'expected two icon-only footer links');
});
