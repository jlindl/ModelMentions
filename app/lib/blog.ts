export interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    publishedAt: string;
    author: string;
    readTime: string;
}

export const blogPosts: BlogPost[] = [
    {
        slug: 'why-ai-brand-monitoring-matters-2026',
        title: 'Why AI Brand Monitoring Matters in 2026',
        excerpt: 'The shift from Google SEO to AI search optimization is here. Learn why monitoring your brand\'s presence in LLMs is critical for modern marketing.',
        category: 'Strategy',
        publishedAt: '2026-01-28',
        author: 'ModelMentions Team',
        readTime: '6 min read'
    }
];

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find(post => post.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
    return blogPosts.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}
