import Image from 'next/image';
import Link from 'next/link';
import { Button } from './Button';
import { ArrowRight, BarChart3, Globe2, Zap } from 'lucide-react';

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

                    <h1 className="text-6xl lg:text-8xl font-bold tracking-tighter text-white leading-[1] max-w-4xl">
                        Ship faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-yellow-200 to-brand-yellow animate-pulse">Metrics</span> for modern AI teams
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                        The first comprehensive analytics platform for the Large Language Model ecosystem. Track, Analyze, and Optimize your brand's AI presence with real-time data.
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
                <div className="hidden lg:block lg:col-span-4 relative h-[400px]">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl skew-y-[-2deg] hover:skew-y-0 transition-transform duration-500">
                        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            <div className="ml-auto text-xs text-gray-500 font-mono">analytics.ts</div>
                        </div>
                        <div className="space-y-2 font-mono text-sm">
                            <div className="flex gap-2">
                                <span className="text-purple-400">const</span>
                                <span className="text-blue-400">metrics</span>
                                <span className="text-white">=</span>
                                <span className="text-purple-400">await</span>
                                <span className="text-yellow-400">trackMentions</span>
                                <span className="text-gray-400">({'('}</span>
                            </div>
                            <div className="pl-4 text-green-400">'GPT-4',</div>
                            <div className="pl-4 text-green-400">'Claude-3',</div>
                            <div className="pl-4 text-green-400">'Gemini-Pro'</div>
                            <div className="text-gray-400">{')'});</div>
                            <br />
                            <div className="text-gray-500">// Result:</div>
                            <div className="text-brand-yellow">
                                {'{'} distinct_mentions: 842, sentiment: 0.92 {'}'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
