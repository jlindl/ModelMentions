import { notFound } from 'next/navigation';
import { getBlogPost, getAllBlogPosts } from '../../lib/blog';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { BlogPostContent } from './content';

export async function generateStaticParams() {
    const posts = getAllBlogPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = getBlogPost(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#020202] text-white pt-32 pb-20">
            <article className="container mx-auto px-6 max-w-4xl">
                {/* Back button */}
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-yellow transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Blog
                </Link>

                {/* Post Header */}
                <header className="mb-12">
                    <div className="inline-block bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow text-xs font-bold px-3 py-1.5 rounded-md mb-6 uppercase tracking-wider">
                        {post.category}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                        {post.excerpt}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500 pb-8 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-brand-yellow" />
                            {post.author}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-brand-yellow" />
                            {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-brand-yellow" />
                            {post.readTime}
                        </div>
                    </div>
                </header>

                {/* Post Content */}
                <div className="prose prose-invert prose-lg max-w-none">
                    <BlogPostContent slug={post.slug} />
                </div>

                {/* Footer CTA */}
                <div className="mt-16 pt-12 border-t border-white/10">
                    <div className="bg-gradient-to-br from-brand-yellow/10 to-transparent border border-brand-yellow/20 rounded-2xl p-8 md:p-12 text-center">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Ready to Monitor Your AI Brand Presence?
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                            Join forward-thinking brands using ModelMentions to track, analyze, and optimize their presence across major LLMs.
                        </p>
                        <Link
                            href="/auth"
                            className="inline-flex items-center justify-center rounded-md font-semibold transition-all duration-300 bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)] px-8 py-4 text-lg"
                        >
                            Start Tracking for Free
                        </Link>
                    </div>
                </div>
            </article>
        </div>
    );
}
