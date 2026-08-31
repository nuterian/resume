// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Served from https://jugalm.com/resume/ — the nuterian.github.io URL
// redirects here, so this is the canonical host for search engines.
export default defineConfig({
  site: 'https://jugalm.com',
  base: '/resume',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'always',
  },
});
