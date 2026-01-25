
import type { ui } from '../i18n/utils';

export interface NavItem {
    name: string;
    href: string;
    className: string;
}

export function getNavigationItems(
    url: URL,
    base: string,
    t: (typeof ui)[keyof typeof ui],
    lang: 'en' | 'tr'
): NavItem[] {
    const currentPath = url.pathname;

    const navigation = [
        { name: t['nav.home'], href: lang === 'en' ? `${base}/` : `${base}/tr/` },
        { name: t['nav.courses'], href: lang === 'en' ? `${base}/courses` : `${base}/tr/courses` },
        { name: t['nav.equivalency'], href: lang === 'en' ? `${base}/equivalency` : `${base}/tr/equivalency` },
        { name: t['nav.blog'], href: lang === 'en' ? `${base}/blog` : `${base}/tr/blog` },
        { name: t['nav.about'], href: lang === 'en' ? `${base}/about` : `${base}/tr/about` },
        { name: t['nav.contact'], href: lang === 'en' ? `${base}/contact` : `${base}/tr/contact` },
    ];

    return navigation.map(item => {
        // Exact match or subpath match (but not for home/root paths to avoid greedy matching)
        const isExact = currentPath === item.href;
        const isSubPath = item.href !== `${base}/` &&
            item.href !== `${base}/tr/` &&
            currentPath.startsWith(item.href);

        const isActive = isExact || isSubPath;

        return {
            name: item.name,
            href: item.href,
            className: `nav-link ${isActive ? 'active' : ''}`
        };
    });
}
