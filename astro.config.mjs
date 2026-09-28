import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL e BASE_PATH vêm do ambiente: GitHub Pages usa BASE_PATH=/Site-oficial-MAW
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://waynermoraes12.github.io',
  base: process.env.BASE_PATH ?? '/',
  integrations: [sitemap()],
});
