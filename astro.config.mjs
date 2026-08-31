// @ts-check
import { defineConfig } from 'astro/config';

// Deployed to GitHub Pages at https://nuterian.github.io/resume/
export default defineConfig({
  site: 'https://nuterian.github.io',
  base: '/resume',
  output: 'static',
  build: {
    inlineStylesheets: 'always',
  },
});
