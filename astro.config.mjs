import { defineConfig } from 'astro/config';

// AndroidScroll prototype — Astro static, no integrations, no UI kits.
export default defineConfig({
  output: 'static',
  site: 'https://androidscroll.com/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
});
