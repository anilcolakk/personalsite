import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://anilcolakk.github.io',
    base: '/personalsite',
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
