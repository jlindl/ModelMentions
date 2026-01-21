export default function BlogPage() {
    return (
        <div className="min-h-screen bg-[#020202] text-white pt-32 pb-20">
            <div className="container mx-auto px-6 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
                    Intelligence <span className="text-brand-yellow">Blog</span>
                </h1>
                <p className="text-gray-400">Insights on AI Search Optimization (AISO) and LLM Brand Management.</p>

                <div className="mt-12 grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
                    {/* Placeholder Post */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-left hover:border-brand-yellow/50 transition-colors cursor-pointer group">
                        <div className="h-48 bg-white/5 rounded-xl mb-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-brand-yellow/10 group-hover:bg-brand-yellow/20 transition-colors"></div>
                        </div>
                        <div className="text-xs text-brand-yellow font-bold uppercase tracking-wider mb-2">Strategy</div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-yellow transition-colors">Understanding "Hallucinations" vs. "Brand Drift"</h3>
                        <p className="text-gray-500 text-sm">Why models get your pricing wrong and how to fix it via schema markup.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
