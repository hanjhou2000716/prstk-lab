const fs = require('node:fs');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const requiredVersion = '3.1.6';
const installedVersion = lockfile.packages?.['node_modules/fast-uri']?.version;
const overrideVersion = packageJson.overrides?.['fast-uri'];

if (overrideVersion !== requiredVersion) {
  throw new Error(`fast-uri override must be ${requiredVersion}, found ${overrideVersion || 'missing'}`);
}
if (installedVersion !== requiredVersion) {
  throw new Error(`package-lock.json must install fast-uri ${requiredVersion}, found ${installedVersion || 'missing'}`);
}

console.log(`Dependency security valid: fast-uri ${installedVersion} is pinned through npm overrides.`);
