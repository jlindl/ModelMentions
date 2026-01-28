import Link from 'next/link';
import { getAllBlogPosts } from '../lib/blog';
import { ArrowRight } from 'lucide-react';

export default function BlogPage() {
    const posts = getAllBlogPosts();

    return (
        <div className="min-h-screen bg-[#020202] text-white pt-32 pb-20">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Intelligence <span className="text-brand-yellow">Blog</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Insights on AI Search Optimization (AISO), LLM brand management, and the future of digital presence in the age of generative AI.
                    </p>
                </div>

                {/* Blog Grid */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                    {posts.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group"
                        >
                            <article className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-left hover:border-brand-yellow/50 transition-all duration-300 cursor-pointer h-full flex flex-col">
                                {/* Featured Image Placeholder */}
                                <div className="h-48 bg-gradient-to-br from-brand-yellow/20 via-brand-yellow/10 to-transparent rounded-xl mb-6 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('/hero-bg-glitch.png')] opacity-20 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"></div>
                                    <div className="absolute bottom-4 left-4 bg-brand-yellow text-brand-black text-xs font-bold px-3 py-1.5 rounded-md shadow-lg uppercase tracking-wider">
                                        {post.category}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col">
                                    <div className="text-xs text-gray-500 mb-3 flex items-center gap-3">
                                        <time>{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                                        <span>•</span>
                                        <span>{post.readTime}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-yellow transition-colors leading-tight">
                                        {post.title}
                                    </h3>

                                    <p className="text-gray-400 text-sm mb-4 leading-relaxed flex-1">
                                        {post.excerpt}
                                    </p>

                                    {/* Read more link */}
                                    <div className="flex items-center gap-2 text-brand-yellow text-sm font-medium group-hover:gap-3 transition-all">
                                        Read article <ArrowRight size={16} />
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>

                {/* Empty state if no posts (shouldn't happen but good practice) */}
                {posts.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500">No blog posts yet. Check back soon!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
