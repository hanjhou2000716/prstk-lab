const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'src', 'pages', 'index.astro');
const page = fs.readFileSync(pagePath, 'utf8');
const components = [
  'Header.astro',
  'SearchBar.astro',
  'ScenarioSelector.astro',
  'ToolCard.astro',
  'HomeTools.astro',
  'ToolPanel.astro',
  'ToolPreviewDrawer.astro',
  'ToolDetail.astro',
  'FavoriteButton.astro',
  'PinButton.astro',
  'Footer.astro'
];

const errors = [];
for (const component of components) {
  const componentPath = path.join(root, 'src', 'components', component);
  if (!fs.existsSync(componentPath)) errors.push(`Missing component: ${component}`);
}

for (const importName of ['Header', 'SearchBar', 'ScenarioSelector', 'ToolCard', 'HomeTools', 'ToolPanel', 'ToolPreviewDrawer', 'Footer']) {
  if (!page.includes(`import ${importName} from`)) errors.push(`Missing page import: ${importName}`);
}

for (const usage of ['<Header />', '<SearchBar />', '<ScenarioSelector />', '<ToolCard />', '<HomeTools />', '<ToolPanel />', '<ToolPreviewDrawer />', '<Footer />']) {
  if (!page.includes(usage)) errors.push(`Missing component usage: ${usage}`);
}

if (!page.includes("document.getElementById('tool-card-template')")) errors.push('ToolCard template is not used by the catalog renderer.');
if (page.includes('id="tool-panel"') || page.includes('id="info-drawer"')) errors.push('Panel or drawer markup remains duplicated in index.astro.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Component boundaries valid: ${components.length} reusable Astro components detected.`);
