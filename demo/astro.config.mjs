// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	vite: {
		server: {
			// Allows the dev server to be reached through DDEV's routed hostname
			// (e.g. astro-steps-demo.ddev.site) and any other host, since this
			// site only ever runs in local/CI test environments.
			allowedHosts: true,
		},
	},
});
