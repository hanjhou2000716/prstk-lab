const fs = require('node:fs');

const html = fs.readFileSync('src/pages/index.astro', 'utf8');
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

for (const source of inlineScripts) {
  new Function(source);
}

console.log(`Validated ${inlineScripts.length} inline script block(s).`);
