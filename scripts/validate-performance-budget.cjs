const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'docs', '_astro');
const maxInitialJsGzip = 100 * 1024;
const homepage = fs.readFileSync(path.join(root, 'docs', 'index.html'), 'utf8');
const currentJs = [...homepage.matchAll(/<script[^>]+src="(?:[^\"]*\/)?_astro\/([^\"]+\.js)"/g)]
  .map(match => match[1])
  .filter(file => file.includes('index.astro_astro_type_script_index_0'));
if (!currentJs.length) {
  console.error('No current Astro runtime asset found. Run npm run build first.');
  process.exit(1);
}

const totalJsGzip = currentJs.reduce((total, file) => {
  const assetPath = path.join(outputDir, file);
  if (!fs.existsSync(assetPath)) throw new Error(`Referenced runtime asset is missing: ${file}`);
  return total + zlib.gzipSync(fs.readFileSync(assetPath)).length;
}, 0);
console.log(`Initial runtime JS gzip: ${totalJsGzip} bytes (budget ${maxInitialJsGzip} bytes).`);
if (totalJsGzip > maxInitialJsGzip) process.exit(1);
