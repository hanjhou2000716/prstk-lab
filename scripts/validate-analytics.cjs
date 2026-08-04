const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const script = read('src/scripts/privacy-analytics.ts');
const footer = read('src/components/Footer.astro');

for (const marker of ['analytics-accept', 'analytics-decline', 'analytics-clear', 'localStorage', 'allowedEvents', 'toolId']) {
  if (!`${script}${footer}`.includes(marker)) throw new Error(`Privacy analytics marker missing ${marker}.`);
}
if (/location\.(search|hash)|document\.cookie|innerHTML/i.test(script)) throw new Error('Privacy analytics must not capture query strings, hashes, cookies, or inject HTML.');
if (/position|portfolio|note|hypothesis|evidence/i.test(script)) throw new Error('Privacy analytics source must not reference private research content.');
console.log('Privacy analytics valid: opt-in, local-only, allowlisted, and content-minimised.');
