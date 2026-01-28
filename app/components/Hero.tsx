import Image from 'next/image';
import Link from 'next/link';
import { Button } from './Button';
import { ArrowRight, BarChart3, Globe2, Zap, TrendingUp, AlertCircle } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-brand-black">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-bg-glitch.png"
                    alt="Digital Noise Background"
                    fill
                    className="object-cover opacity-60 mix-blend-screen"
                    priority
                />
                {/* Use a heavy gradient to fade the image into black at the bottom and sides for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent" />
            </div>

            <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-12 gap-12 items-center">

                {/* Content - Wider spread, less constrained */}
                <div className="lg:col-span-8 space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow text-sm font-medium backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-yellow"></span>
                        </span>
                        Live Visibility Tracking
                    </div>

                    <h1 className="text-6xl lg:text-8xl font-bold tracking-tighter text-white leading-[1] max-w-5xl">
                        The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-yellow-200 to-brand-yellow">SEO Services</span> & AI Optimization
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                        The first comprehensive analytics platform for the modern <strong>Marketing</strong> ecosystem. Track, Analyze, and Optimize your brand's AI presence with real-time data to master <strong>AI Website Optimization</strong>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link href="/auth">
                            <Button size="lg" className="gap-2 h-14 px-8 text-lg hover:scale-105 transition-transform">
                                Get started <ArrowRight size={20} />
                            </Button>
                        </Link>
                        <Button size="lg" variant="secondary" className="h-14 px-8 text-lg backdrop-blur-sm bg-black/30 border-white/20 hover:bg-white/10 text-white">
                            Read the docs
                        </Button>
                    </div>

                    <div className="pt-12 flex items-center gap-8 text-sm text-gray-500 font-medium border-t border-white/10 w-fit pr-12">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} className="text-brand-yellow" />
                            Real-time Analytics
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe2 size={18} className="text-brand-yellow" />
                            Global Coverage
                        </div>
                    </div>
                </div>

                {/* The visual is now the background, but we can keep a subtle decorative element if needed, 
            or leave this column empty to let the background shine through. 
            For Neon style, typically the right side shows code snippets or abstract visuals. 
            Let's add a code-snippet-like floating element. */}
                <div className="hidden lg:block lg:col-span-4 relative h-[400px] animate-fade-in-up delay-200">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl skew-y-[-2deg] hover:skew-y-0 transition-transform duration-500 group">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <div>
                                <h3 className="text-white font-bold">Share of Voice</h3>
                                <p className="text-xs text-gray-400">Real-time Model Visibility</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>

                        {/* List Items */}
                        <div className="space-y-4">
                            {/* Item 1 */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-yellow/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs">O</div>
                                    <div>
                                        <div className="text-sm font-medium text-white">ChatGPT-4</div>
                                        <div className="text-xs text-gray-500">Rank #1</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-green-400">94%</div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                        <TrendingUp size={10} className="text-green-500" /> +12%
                                    </div>
                                </div>
                            </div>

                            {/* Item 2 */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-yellow/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">P</div>
                                    <div>
                                        <div className="text-sm font-medium text-white">Perplexity</div>
                                        <div className="text-xs text-gray-500">Rank #3</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-yellow-400">58%</div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                        Optimization Needed
                                    </div>
                                </div>
                            </div>

                            {/* Item 3 - Critical */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">G</div>
                                    <div>
                                        <div className="text-sm font-medium text-white">Gemini Pro</div>
                                        <div className="text-xs text-red-400">Not Ranking</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-red-500">0%</div>
                                    <div className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                                        <AlertCircle size={10} /> Critical Fix
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-6 pt-4 border-t border-white/5 text-center">
                            <div className="inline-flex items-center gap-2 text-xs text-brand-yellow font-medium bg-brand-yellow/10 px-3 py-1.5 rounded-full border border-brand-yellow/20">
                                <Zap size={12} /> Auto-Optimize Strategy Ready
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
