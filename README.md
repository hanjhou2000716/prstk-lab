# PRStK Lab

PRStK Lab is a static investment-tool portal. Release 0 A02 moves the existing one-page experience into an Astro + TypeScript build while preserving the current brand, data, interactions and GitHub Pages path.

## Local development

```bash
npm install
npm run dev
```

## Validation and production build

```bash
npm run validate
npm run baseline:validate
npm run build
npm run preview
```

The production build is emitted to `docs/`, which is the GitHub Pages branch source. The project base path is `/prstk-lab` and static assets live under `public/`.

## Supabase account and sync (Release 2 E05)

The research workbench remains local-only until Supabase is configured. To enable optional account and cloud sync:

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL Editor.
2. Copy `.env.example` to `.env` and set `PUBLIC_SUPABASE_URL` plus the browser-safe `PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Build with `npm run build` and publish the generated `docs/` directory.
4. In the deployed site, open `工作台 → 登入／設定`, create an account, then use the explicit sync buttons.

Never put a `service_role` key in `.env`, the browser bundle, or GitHub Pages. The SQL migration enables Row Level Security and limits every research-project operation to the authenticated owner. If GitHub Actions builds the site, configure the two `PUBLIC_` values as repository Variables or appropriately scoped Secrets before the build step; the Supabase URL origin is then included in the workbench/account CSP.

## Release 0 records

The A01 inventory, screenshots and regression checklist are in [`project-docs/release-0`](./project-docs/release-0/).
