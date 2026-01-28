import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://modelmentions.com';

    // Static Routes
    const routes = [
        '',
        '/features',
        '/how-it-works',
        '/pricing',
        '/about',
        '/blog',
        '/contact',
        '/integrations',
        '/privacy',
        '/terms',
        '/auth', // Login page is often indexed
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return routes;
}
