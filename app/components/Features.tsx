import { Search, BarChart2, Zap, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export function Features() {
    return (
        <section className="py-24 bg-[#050505] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-yellow/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="max-w-xl">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Intelligence for the <span className="text-brand-yellow">Post-Search</span> World
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Standard SEO tools can't see inside LLMs. We provide the first purpose-built telemetry system for the generative web.
                        </p>
                    </div>
                    <div>
                        <button className="group flex items-center gap-2 text-white font-medium hover:text-brand-yellow transition-colors border-b border-brand-yellow/30 hover:border-brand-yellow pb-1">
                            Explore all features <ArrowUpRight size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">

                    {/* Feature 1: Universal Tracking (Large Span) */}
                    <div className="md:col-span-2 group bg-[#0a0a0a] rounded-3xl p-8 border border-white/5 hover:border-brand-yellow/20 transition-all duration-500 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Search size={120} />
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="w-12 h-12 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow mb-4">
                                <Search size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Universal Model Tracking</h3>
                            <p className="text-gray-400 max-w-md">Monitor your brand's presence across every major foundation model. We dispatch organic prompts to ChatGPT, Claude, Gemini, and Perplexity to see exactly what they say about you.</p>
                        </div>

                        {/* Visualization: Model Nodes */}
                        <div className="mt-8 flex gap-4 overflow-hidden relative opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                            {/* Simulation of "Cards" sliding or static */}
                            <div className="flex-1 bg-[#111] border border-white/10 rounded-xl p-4 flex items-center gap-3 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">AI</div>
                                <div className="space-y-1">
                                    <div className="w-20 h-2 bg-white/20 rounded-full" />
                                    <div className="w-12 h-2 bg-white/10 rounded-full" />
                                </div>
                            </div>
                            <div className="flex-1 bg-[#111] border border-white/10 rounded-xl p-4 flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">G</div>
                                <div className="space-y-1">
                                    <div className="w-24 h-2 bg-white/20 rounded-full" />
                                    <div className="w-16 h-2 bg-white/10 rounded-full" />
                                </div>
                            </div>
                            <div className="flex-1 bg-[#111] border border-white/10 rounded-xl p-4 flex items-center gap-3 transform translate-y-12 group-hover:translate-y-0 transition-transform duration-500 delay-150">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">C</div>
                                <div className="space-y-1">
                                    <div className="w-16 h-2 bg-white/20 rounded-full" />
                                    <div className="w-8 h-2 bg-white/10 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Optimization (Tall) */}
                    <div className="md:row-span-1 bg-[#0a0a0a] rounded-3xl p-8 border border-white/5 hover:border-brand-yellow/20 transition-all duration-500 flex flex-col relative overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="w-12 h-12 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow mb-6">
                            <Zap size={24} />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3">Optimization Insights</h3>
                        <p className="text-gray-400 mb-8">Get actionable checklists to improve your visibility in RAG systems.</p>

                        {/* Visual: Checklist */}
                        <div className="flex-1 bg-[#111] rounded-xl border border-white/5 p-5 space-y-4 group">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="text-brand-yellow w-5 h-5 flex-shrink-0" />
                                <div className="text-sm text-gray-300">Update schema markup</div>
                            </div>
                            <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity delay-100">
                                <CheckCircle2 className="text-gray-600 w-5 h-5 flex-shrink-0" />
                                <div className="text-sm text-gray-500">Refresh "About" page</div>
                            </div>
                            <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity delay-200">
                                <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0" />
                                <div className="text-sm text-white">Fix hallucinations</div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Sentiment (Standard) */}
                    <div className="bg-[#0a0a0a] rounded-3xl p-8 border border-white/5 hover:border-brand-yellow/20 transition-all duration-500 flex flex-col overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
                                <BarChart2 size={24} />
                            </div>
                            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20">+12%</span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Sentiment Analysis</h3>
                        <p className="text-gray-400 text-sm mb-6">Track how AI "feels" about your brand.</p>

                        {/* Visual: Gauge/Chart */}
                        <div className="mt-auto flex items-end justify-between gap-2 h-32">
                            <div className="w-full bg-[#151515] rounded-t-lg h-[40%] group-hover:h-[50%] transition-all duration-500 bg-gradient-to-t from-white/5 to-white/10" />
                            <div className="w-full bg-[#151515] rounded-t-lg h-[60%] group-hover:h-[85%] transition-all duration-500 delay-75 bg-gradient-to-t from-brand-yellow/20 to-brand-yellow/50" />
                            <div className="w-full bg-[#151515] rounded-t-lg h-[30%] group-hover:h-[45%] transition-all duration-500 delay-150 bg-gradient-to-t from-white/5 to-white/10" />
                            <div className="w-full bg-[#151515] rounded-t-lg h-[75%] group-hover:h-[60%] transition-all duration-500 delay-100 bg-gradient-to-t from-white/5 to-white/10" />
                        </div>
                    </div>

                    {/* Feature 4: Competitor Benchmarking (Standard) */}
                    <div className="md:col-span-2 bg-[#0a0a0a] rounded-3xl p-8 border border-white/5 hover:border-brand-yellow/20 transition-all duration-500 flex items-center justify-between relative overflow-hidden group">

                        <div className="relative z-10 max-w-sm">
                            <div className="w-12 h-12 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow mb-6">
                                <BarChart2 size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Competitor Benchmarking</h3>
                            <p className="text-gray-400">
                                Stop guessing. See exactly where your competitors are ranking for your target keywords in Generative Search.
                            </p>
                        </div>

                        {/* Visual: Vs Card */}
                        <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 gap-4">
                            <div className="w-48 bg-[#111] border border-white/10 rounded-xl p-4 rotate-3 group-hover:rotate-0 transition-transform duration-500 origin-bottom-left shadow-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-brand-yellow/50" />
                                    <div className="h-2 w-20 bg-white/20 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-white/5 rounded-full" />
                                    <div className="h-2 w-3/4 bg-white/5 rounded-full" />
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                                    <div className="text-brand-yellow font-mono text-sm">#1 RANK</div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </section>
    );
}
