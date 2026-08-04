const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const account = read('src/pages/account/index.astro');
const workbench = read('src/pages/workbench/index.astro');
const sync = read('src/scripts/workbench-sync.ts');
const schema = read('supabase/schema.sql');
const packageJson = JSON.parse(read('package.json'));

if (!packageJson.dependencies?.['@supabase/supabase-js']) throw new Error('Supabase client dependency is missing.');
for (const marker of ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_PUBLISHABLE_KEY']) {
  if (!`${account}${sync}`.includes(marker)) throw new Error(`Supabase client missing ${marker}.`);
}
for (const marker of ['account-sign-in', 'account-sign-up', 'account-sign-out']) {
  if (!account.includes(marker)) throw new Error(`Account page missing ${marker}.`);
}
for (const marker of ['sync-pull', 'sync-push', 'research_projects']) {
  if (!workbench.includes(marker) && !sync.includes(marker)) throw new Error(`Workbench sync marker missing ${marker}.`);
}
for (const marker of ['enable row level security', 'auth.uid()', 'research_projects_select_own', 'research_projects_delete_own']) {
  if (!schema.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Supabase schema missing ${marker}.`);
}
if (/SUPABASE_SERVICE_ROLE_KEY|service_role\s*[:=]/i.test(`${account}${workbench}${sync}`)) throw new Error('Service role key must never be shipped to the browser.');
if (/<(?:script|form)[^>]+(?:is:inline|onsubmit|onclick)=/i.test(`${account}${workbench}`)) throw new Error('Supabase pages must not use inline executable handlers.');
console.log('Supabase contract valid: optional browser client, account controls, sync actions, and RLS schema present.');
