import { MetadataRoute } from 'next';
import { getAllBlogPosts } from './lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://modelmentions.co.uk';

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
        priority: route === '' ? 1 : route === '/blog' ? 0.9 : 0.8,
    }));

    // Dynamic Blog Posts
    const blogPosts = getAllBlogPosts().map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    return [...routes, ...blogPosts];
}
