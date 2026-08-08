const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const page = fs.readFileSync(path.join(root, 'src/pages/workbench/index.astro'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'src/scripts/workbench.ts'), 'utf8');

test('research workbench exposes decision-quality fields', () => {
  for (const field of ['sources', 'methodology', 'assumptions', 'invalidationConditions', 'reviewOutcome']) {
    assert.match(page, new RegExp(`id="${field}"`));
    assert.match(runtime, new RegExp(field));
  }
  assert.doesNotMatch(runtime, /@ts-nocheck/);
});

test('research backups retain the complete project shape', () => {
  for (const field of ['exportJson', 'exportMarkdown', 'exportCsv', 'normaliseProject']) assert.match(runtime, new RegExp(field));
  assert.match(runtime, /prstk-lab-workbench-v1/);
});
