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

## Release 0 records

The A01 inventory, screenshots and regression checklist are in [`docs/release-0`](./docs/release-0/).
