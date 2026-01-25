import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: 'https://aaanilclk.github.io', // Updated based on your username
    base: '/',
    integrations: [sitemap()],
    output: 'static',
    build: {
        assets: 'assets'
    },
    vite: {
        build: {
            rollupOptions: {
                external: ['/pagefind/pagefind-ui.js']
            }
        }
    }
});
