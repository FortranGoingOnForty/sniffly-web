// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sniffly.musicsian.com',
  integrations: [sitemap()],
  outDir: './dist',
  publicDir: './public',
  vite: {
    build: {
      assetsDir: 'assets'
    }
  }
});
