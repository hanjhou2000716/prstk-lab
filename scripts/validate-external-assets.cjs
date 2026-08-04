const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'src', 'pages', 'index.astro');
const page = fs.readFileSync(pagePath, 'utf8');
const runtime = fs.readFileSync(path.join(root, 'src', 'scripts', 'main.ts'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const errors = [];
if (page.includes("'unsafe-inline'")) errors.push('CSP still allows unsafe-inline.');
if (page.includes('unpkg.com')) errors.push('Runtime still depends on unpkg.');
if (/<style(?:\s|>)/.test(page)) errors.push('Inline style block remains in index.astro.');
if (/<script(?![^>]*type="application\/json")[^>]*>\s*[^<]/.test(page)) errors.push('Inline executable script remains in index.astro.');
if (!page.includes('<script src="../scripts/main.ts"></script>')) errors.push('Bundled runtime entry is missing.');
if (!runtime.includes("from 'aos'") || !runtime.includes("from 'lucide'")) errors.push('AOS/Lucide are not bundled from npm dependencies.');
if (!styles.includes('.site-background')) errors.push('Global styles were not moved to src/styles.css.');
if (!packageJson.dependencies?.aos || !packageJson.dependencies?.lucide) errors.push('AOS/Lucide must be declared as runtime dependencies.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('External assets valid: CSP has no unsafe-inline, runtime is bundled, and global CSS is externalized.');
