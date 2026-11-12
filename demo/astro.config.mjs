// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// The sitemap and the RSS feed need the address of the site.
	site: 'http://localhost:4321',
	integrations: [preact(), sitemap()],
});
