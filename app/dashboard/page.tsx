'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { BarChart3, TrendingUp, AlertCircle, Coins, Activity } from 'lucide-react';
import { ResultDetailsModal } from './scan/ResultDetailsModal';

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    return 'Just now';
}

interface ActivityResult {
    id: string; // Added ID just in case
    is_mentioned: boolean;
    sentiment_score: number;
    created_at: string;
    model_name: string;
    prompt_text: string;
    response_text: string; // Added for modal
}

export default function DashboardPage() {
    const supabase = createClient();
    const [feedItems, setFeedItems] = useState<ActivityResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyName, setCompanyName] = useState('Your Brand');
    const [selectedResult, setSelectedResult] = useState<ActivityResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getModelLogo = (modelName: string) => {
        const name = modelName.toLowerCase();
        if (name.includes('gpt') || name.includes('openai')) return '/logos/openai.svg';
        if (name.includes('claude') || name.includes('anthropic')) return '/logos/anthropic.svg';
        if (name.includes('gemini') || name.includes('google') || name.includes('bard')) return '/logos/google.svg';
        if (name.includes('mistral')) return '/logos/mistral.svg';
        if (name.includes('perplexity')) return '/logos/perplexity.svg';
        if (name.includes('llama') || name.includes('meta')) return '/logos/meta.svg';
        if (name.includes('cohere')) return '/logos/cohere.svg';
        if (name.includes('hugging')) return '/logos/huggingface.svg';
        if (name.includes('microsoft')) return '/logos/microsoft.svg';
        if (name.includes('nvidia')) return '/logos/nvidia.svg';
        if (name.includes('xai') || name.includes('grok')) return '/logos/xai.svg';
        return null;
    };

    const fetchFeed = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Profile for Company Name
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_name, website_url')
            .eq('id', user.id)
            .single();

        if (profile) {
            setCompanyName(profile.company_name || profile.website_url || 'Your Brand');
        }

        // Fetch recent test results
        const { data: results } = await supabase
            .from('test_results')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (results) {
            setFeedItems(results as unknown as ActivityResult[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFeed();
    }, [supabase]);

    const handleInvestigate = (item: ActivityResult) => {
        setSelectedResult(item);
        setIsModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col animate-fade-in-up md:p-6 relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen">
                <img
                    src="/backgrounds/dashboard_feed_bg.png"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent" />
            </div>

            {/* Content Container - Ensure z-index is higher */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Modal */}
                <ResultDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    result={selectedResult}
                />

                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                    <h1 className="text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-3">
                        <Activity className="text-brand-yellow" size={24} />
                        Live Feed: <span className="text-gray-400">AI Model Brand Mentions</span>
                    </h1>

                    <div className="flex items-center gap-4">
                        <select className="bg-[#111] border border-white/10 rounded px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-brand-yellow/50">
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                            <option>All Time</option>
                        </select>

                        <button
                            onClick={fetchFeed}
                            disabled={loading}
                            className="bg-brand-yellow hover:bg-brand-yellow-hover text-black font-bold text-sm px-6 py-2 rounded flex items-center gap-2 transition-all uppercase tracking-wide"
                        >
                            {loading ? 'Refreshing...' : 'Refresh Feed'}
                        </button>
                    </div>
                </div>

                {/* Feed Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-white/5 mb-2">
                    <div className="col-span-2">Time</div>
                    <div className="col-span-2">Source AI</div>
                    <div className="col-span-2">Brand</div>
                    <div className="col-span-3">Snippet</div>
                    <div className="col-span-1 text-center">Sentiment</div>
                    <div className="col-span-2 text-right">Action</div>
                </div>

                {/* Feed List */}
                <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-2">
                    {loading && feedItems.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">Loading feed...</div>
                    ) : feedItems.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 border border-white/5 rounded-xl bg-[#0a0a0a]">No mentions found yet. Run a scan.</div>
                    ) : (
                        feedItems.map((item, i) => {
                            const logoSrc = getModelLogo(item.model_name);
                            return (
                                <div key={i} className="group grid grid-cols-12 gap-4 p-4 items-center bg-[#0a0a0a] border border-white/5 rounded-lg hover:border-brand-yellow/30 hover:shadow-[0_0_20px_rgba(255,215,0,0.05)] transition-all duration-300">

                                    {/* Time */}
                                    <div className="col-span-2 flex flex-col">
                                        <span className="text-white font-mono text-sm">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
                                        <span className="text-xs text-gray-600">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>

                                    {/* Source AI */}
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 p-1.5 overflow-hidden">
                                            {logoSrc ? (
                                                <img src={logoSrc} alt={item.model_name} className="w-full h-full object-contain invert" />
                                            ) : (
                                                <span className="text-xs font-bold text-gray-400">{item.model_name.slice(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium text-sm truncate max-w-[120px]" title={item.model_name}>{item.model_name}</span>
                                            <span className="text-[10px] text-gray-500 uppercase">Provider</span>
                                        </div>
                                    </div>

                                    {/* Brand */}
                                    <div className="col-span-2">
                                        <span className="text-gray-300 uppercase tracking-wide text-xs font-bold bg-white/5 px-2 py-1 rounded border border-white/5">{companyName}</span>
                                    </div>

                                    {/* Snippet */}
                                    <div className="col-span-3">
                                        <p className="text-gray-500 text-xs italic line-clamp-2 leading-relaxed" title={item.prompt_text}>
                                            "{item.prompt_text.slice(0, 100)}..."
                                        </p>
                                    </div>

                                    {/* Sentiment */}
                                    <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                                        <div className={`w-8 h-8 rounded border flex items-center justify-center ${item.sentiment_score > 0 ? 'border-green-500/50 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                                            item.sentiment_score < 0 ? 'border-red-500/50 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                                                'border-gray-500/50 text-gray-400'
                                            }`}>
                                            {item.sentiment_score > 0 ? <TrendingUp size={16} /> : item.sentiment_score < 0 ? <TrendingUp size={16} className="rotate-180" /> : <Activity size={16} />}
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${item.sentiment_score > 0 ? 'text-green-500' :
                                            item.sentiment_score < 0 ? 'text-red-500' :
                                                'text-gray-500'
                                            }`}>
                                            {item.sentiment_score > 0 ? 'Positive' : item.sentiment_score < 0 ? 'Negative' : 'Neutral'}
                                        </span>
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-2 flex justify-end">
                                        <button
                                            onClick={() => handleInvestigate(item)}
                                            className="border border-brand-yellow/30 text-brand-yellow bg-brand-yellow/5 hover:bg-brand-yellow hover:text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,215,0,0.05)] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                                        >
                                            Investigate
                                        </button>
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
