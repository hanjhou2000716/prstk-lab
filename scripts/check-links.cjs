const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tools = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'tools.json'), 'utf8'));
const outputArg = process.argv.find(argument => argument.startsWith('--output='));
const outputPath = outputArg ? path.resolve(process.cwd(), outputArg.slice('--output='.length)) : null;
const timeoutMs = 12_000;

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const checkUrl = async url => {
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
      if ([403, 405].includes(response.status)) {
        response = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
      }
      clearTimeout(timer);
      return { ok: response.ok, status: response.status, finalUrl: response.url, attempt };
    } catch (error) {
      clearTimeout(timer);
      lastError = error.name === 'AbortError' ? 'timeout' : error.message;
      if (attempt < 2) await sleep(500);
    }
  }
  return { ok: false, status: null, finalUrl: null, error: lastError, attempt: 2 };
};

(async () => {
  const results = [];
  for (const tool of tools) {
    const checkedAt = new Date().toISOString();
    const result = await checkUrl(tool.url);
    results.push({ id: tool.id, slug: tool.slug, name: tool.name, url: tool.url, checkedAt, ...result });
    console.log(`${result.ok ? 'OK' : 'FAIL'} ${tool.slug} ${result.status ?? result.error} ${tool.url}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    failures: results.filter(result => !result.ok),
    results
  };
  if (outputPath) fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  if (report.failures.length) process.exitCode = 1;
})();
