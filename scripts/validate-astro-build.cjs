const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const buildRoot = path.join(repoRoot, 'docs');
const tools = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src', 'data', 'tools.json'), 'utf8'));
const requiredFiles = [
  'index.html',
  'manifest.json',
  'assets/styles.css',
  'assets/prstk-geometric-background.jpg',
  'PRStK app.png',
  'PRStK Lab-Remove.png',
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(buildRoot, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`Build output is missing ${relativePath}`);
}

const html = fs.readFileSync(path.join(buildRoot, 'index.html'), 'utf8');
for (const fragment of ['/prstk-lab/_astro/', 'assets/styles.css', 'manifest.json']) {
  if (!html.includes(fragment)) throw new Error(`Built HTML is missing expected asset reference: ${fragment}`);
}

const generatedCss = fs.readdirSync(path.join(buildRoot, '_astro'))
  .filter(file => file.endsWith('.css'))
  .map(file => fs.readFileSync(path.join(buildRoot, '_astro', file), 'utf8'))
  .join('\n');
if (!generatedCss.includes('assets/prstk-geometric-background.jpg')) {
  throw new Error('Generated CSS is missing the geometric background reference');
}

for (const tool of tools) {
  const toolPage = path.join(buildRoot, 'tools', tool.slug, 'index.html');
  if (!fs.existsSync(toolPage)) throw new Error(`Tool page is missing for ${tool.slug}`);
  const toolHtml = fs.readFileSync(toolPage, 'utf8');
  if (!toolHtml.includes(`<title>${tool.name}｜PRStK Lab</title>`)) {
    throw new Error(`Tool page title is missing for ${tool.slug}`);
  }
}

console.log(`Astro build valid: homepage, ${tools.length} tool pages, and branded assets are present.`);
