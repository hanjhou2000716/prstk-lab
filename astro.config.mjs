import { defineConfig } from 'astro/config';

// GitHub Pages serves this project from /prstk-lab/ rather than the domain root.
export default defineConfig({
  site: 'https://hanjhou2000716.github.io',
  base: '/prstk-lab',
  output: 'static',
  // GitHub Pages' supported branch source is main:/docs. Keep A01 records in
  // docs/release-0 while the generated site is emitted alongside them.
  outDir: './docs',
  build: {
    format: 'directory',
  },
  vite: {
    build: {
      emptyOutDir: false,
    },
  },
});
