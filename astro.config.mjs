import { defineConfig } from 'astro/config';

// GitHub Pages serves this project from /prstk-lab/ rather than the domain root.
export default defineConfig({
  site: 'https://hanjhou2000716.github.io',
  base: '/prstk-lab',
  output: 'static',
  // GitHub Pages' supported branch source is main:/docs. Release notes and
  // baseline records live in project-docs so docs/ remains generated output.
  outDir: './docs',
  build: {
    format: 'directory',
  },
  vite: {
    build: {
      emptyOutDir: true,
    },
  },
});
