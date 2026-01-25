import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: 'https://anilcolakk.github.io',
    base: '/personalsite',
    integrations: [
        sitemap({
            filter: (page) => !page.includes('/tr/') // Only English pages in sitemap
        })
    ],
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
    },
    i18n: {
        defaultLocale: "en",
        locales: ["en", "tr"],
        routing: {
            prefixDefaultLocale: false
        }
    }
});
