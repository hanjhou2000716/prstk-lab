const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(repoRoot, 'src', 'pages', 'index.astro');
const source = fs.readFileSync(sourcePath, 'utf8');
const start = source.indexOf('const toolCatalog = [');
const end = source.indexOf('];', start);
if (start < 0 || end < 0) throw new Error('Unable to find toolCatalog in src/pages/index.astro');

const snippet = source.slice(start, end + 2).replace('const toolCatalog', 'module.exports');
const sandbox = { module: { exports: null } };
vm.runInNewContext(snippet, sandbox, { filename: 'src/pages/index.astro' });
const catalog = sandbox.module.exports;
const featuredIds = new Set(['stockintelli', 'quantgems', 'solitude', 'twstock-pulse']);
const capturedAt = process.env.TOOL_DATA_DATE || '2026-08-04';

const tools = catalog.map(tool => {
  const features = [...tool.features];
  const targetUsers = [...tool.targets];
  return {
    id: tool.id,
    slug: tool.id,
    name: tool.title,
    brandName: tool.subtitle,
    summary: features[0] || tool.title,
    description: features.join(' '),
    categories: [tool.category],
    useCases: targetUsers,
    markets: [],
    assetClasses: [],
    analysisTypes: [],
    pricing: 'unknown',
    requiresLogin: 'unknown',
    language: [],
    mobileSupport: 'unknown',
    dataSources: [],
    updateFrequency: 'unknown',
    status: 'pending-verification',
    lastVerifiedAt: capturedAt,
    verifiedBy: 'PRStK Lab A03 baseline migration',
    features,
    limitations: ['尚未完成逐項服務驗證，使用前請以外部服務最新說明為準。'],
    targetUsers,
    tags: [],
    aliases: [...new Set([tool.id, tool.subtitle, tool.title])],
    url: tool.link,
    screenshots: [],
    relatedTools: [],
    relatedResearch: [],
    riskNotice: '外部服務內容可能延遲或變更，不構成投資建議。',
    featured: featuredIds.has(tool.id),
  };
});

const outputPath = path.join(repoRoot, 'src', 'data', 'tools.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(tools, null, 2)}\n`, 'utf8');
console.log(`Generated ${tools.length} schema-complete tools at ${path.relative(repoRoot, outputPath)}.`);
