const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'src', 'pages', 'index.astro'), 'utf8');
const footer = fs.readFileSync(path.join(root, 'src', 'components', 'Footer.astro'), 'utf8');
const errors = [];

for (const marker of ['name="description"', 'rel="canonical"', 'property="og:title"', 'name="twitter:card"', 'application/ld+json']) {
  if (!page.includes(marker)) errors.push(`Missing SEO marker: ${marker}`);
}
for (const marker of ['非投資建議', '資料可能延遲', '自行查證']) {
  if (!footer.includes(marker)) errors.push(`Missing risk disclosure marker: ${marker}`);
}
for (const file of ['public/robots.txt', 'public/sitemap.xml', 'src/pages/404.astro']) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing SEO asset: ${file}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('SEO and risk disclosure valid: metadata, crawler assets, 404 page, and warning text present.');
