const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'docs', '_astro');
const maxInitialJsGzip = 100 * 1024;
const assets = fs.readdirSync(outputDir).filter(file => /\.(js|css)$/.test(file));
const currentJs = assets.filter(file => file.includes('index.astro_astro_type_script_index_0'));
if (!currentJs.length) {
  console.error('No current Astro runtime asset found. Run npm run build first.');
  process.exit(1);
}

const totalJsGzip = currentJs.reduce((total, file) => total + zlib.gzipSync(fs.readFileSync(path.join(outputDir, file))).length, 0);
console.log(`Initial runtime JS gzip: ${totalJsGzip} bytes (budget ${maxInitialJsGzip} bytes).`);
if (totalJsGzip > maxInitialJsGzip) process.exit(1);
