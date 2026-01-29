'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Button } from '../../components/Button';
import { Save, Loader2, Building, Globe, Zap, CreditCard, BarChart2, Search, RotateCw, Check, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const supabase = createClient();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'general' | 'models' | 'billing' | 'usage'>('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile Data
    const [userId, setUserId] = useState<string | null>(null);
    const [industry, setIndustry] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [keywords, setKeywords] = useState('');
    const [competitors, setCompetitors] = useState('');
    const [userPlan, setUserPlan] = useState('free');
    const [creditsUsed, setCreditsUsed] = useState(0);

    // Model Data
    const [availableModels, setAvailableModels] = useState<{ id: string; name: string; provider: string }[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modelFilter, setModelFilter] = useState('All');

    const PLAN_CONFIG = {
        'free': { maxModels: 5, credits: 0.25 },
        'pro': { maxModels: 15, credits: 10 },
        'premium': { maxModels: 50, credits: 30 },
        'ultra': { maxModels: 100, credits: 100 }
    };

    const filteredModels = availableModels.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.provider.toLowerCase().includes(searchQuery.toLowerCase());

        if (modelFilter === 'All') return matchesSearch;
        if (modelFilter === 'Selected') return matchesSearch && selectedModels.includes(model.id);

        return matchesSearch && model.provider.toLowerCase().includes(modelFilter.toLowerCase());
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);

                // Fetch Profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setIndustry(profile.industry || '');
                    setWebsiteUrl(profile.website_url || '');
                    setKeywords(profile.keywords ? profile.keywords.join(', ') : '');
                    setCompetitors(profile.competitors ? profile.competitors.join(', ') : '');
                    setUserPlan(profile.plan || 'free');
                    setCreditsUsed(profile.credits_used || 0);
                    setSelectedModels(profile.selected_models || []);
                }

                // Fetch Available Models
                const { data: models } = await supabase
                    .from('available_models')
                    .select('*')
                    .eq('is_active', true)
                    .order('provider');

                if (models) {
                    setAvailableModels(models);
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [supabase]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        setSaving(true);
        setMessage(null);

        const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const competitorArray = competitors.split(',').map(c => c.trim()).filter(c => c.length > 0);

        const { error } = await supabase
            .from('profiles')
            .update({
                industry,
                website_url: websiteUrl,
                keywords: keywordArray,
                competitors: competitorArray,
                selected_models: selectedModels,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (error) {
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } else {
            setMessage({ type: 'success', text: 'Settings updated successfully.' });
        }
        setSaving(false);
    };

    const handleSyncModels = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/sync-models', { method: 'POST' });
            if (!res.ok) throw new Error('Sync failed');

            const data = await res.json();

            // Refresh local list
            const { data: models } = await supabase
                .from('available_models')
                .select('*')
                .eq('is_active', true)
                .order('provider');

            if (models) setAvailableModels(models);
            setMessage({ type: 'success', text: `Synced ${data.count} models.` });
        } catch (err: unknown) {
            setMessage({ type: 'error', text: 'Failed to sync models.' });
        } finally {
            setSyncing(false);
        }
    };

    const applyBundle = (type: 'BIG_3' | 'SPEED' | 'ALL' | 'CLEAR') => {
        if (type === 'CLEAR') {
            setSelectedModels([]);
            setMessage({ type: 'success', text: 'Selection cleared.' });
            return;
        }

        if (availableModels.length === 0) return;

        let filtered: any[] = [];
        switch (type) {
            case 'BIG_3':
                filtered = availableModels.filter(m =>
                    m.name.includes('GPT-4o') ||
                    m.name.includes('Claude 3.5 Sonnet') ||
                    m.name.includes('Gemini 1.5 Pro')
                );
                // Fallback
                if (filtered.length < 3) {
                    filtered = availableModels.filter(m => m.provider === 'OpenAI' || m.provider === 'Anthropic' || m.provider === 'Google').slice(0, 3);
                }
                break;
            case 'SPEED':
                filtered = availableModels.filter(m =>
                    m.name.includes('Flash') ||
                    m.name.includes('Haiku') ||
                    m.name.includes('mini')
                );
                break;
            case 'ALL':
                filtered = availableModels;
                break;
        }

        const currentPlan = userPlan as keyof typeof PLAN_CONFIG;
        const limit = PLAN_CONFIG[currentPlan]?.maxModels || 5;
        const newIds = filtered.map(m => m.id);

        if (newIds.length > limit) {
            setMessage({ type: 'error', text: `Bundle size (${newIds.length}) exceeds plan limit of ${limit}. Selection truncated.` });
            setSelectedModels(newIds.slice(0, limit));
        } else {
            setSelectedModels(newIds);
            setMessage({ type: 'success', text: `Applied bundle with ${newIds.length} models.` });
        }
    };

    const toggleModel = (modelId: string) => {
        setSelectedModels(prev => {
            if (prev.includes(modelId)) {
                return prev.filter(id => id !== modelId);
            } else {
                const currentPlan = userPlan as keyof typeof PLAN_CONFIG;
                const limit = PLAN_CONFIG[currentPlan]?.maxModels || 5;

                if (prev.length >= limit) {
                    setMessage({ type: 'error', text: `Plan limit reached. ${currentPlan.toUpperCase()} allows up to ${limit} models.` });
                    return prev;
                }

                setMessage(null); // Clear any previous error
                return [...prev, modelId];
            }
        });
    };

    const handleUpgrade = async (planName: string, priceId: string) => {
        setLoading(true); // Using loading override or create separate
        setMessage(null);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, planName }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setMessage({ type: 'error', text: 'Checkout initialization failed: ' + (data.error || 'Unknown error') });
                setLoading(false);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Checkout error.' });
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading settings...</div>;
    }

    const tabs = [
        { id: 'general', label: 'General', icon: Building },
        { id: 'models', label: 'AI Models', icon: Zap },
        { id: 'billing', label: 'Plans & Billing', icon: CreditCard },
        { id: 'usage', label: 'Usage & Credits', icon: BarChart2 },
    ];

    const currentCredits = (creditsUsed * 2).toFixed(1);

    return (
        <div className="animate-fade-in-up max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-400">Manage your tracking preferences, billing, and usage.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <nav className="space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'general' | 'models' | 'billing' | 'usage')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left font-medium ${activeTab === tab.id
                                    ? 'bg-brand-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 md:p-8">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Building size={20} className="text-brand-yellow" /> Business Profile
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Industry / Niche</label>
                                        <input
                                            type="text"
                                            value={industry}
                                            onChange={(e) => setIndustry(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 focus:outline-none transition-all"
                                            placeholder="e.g. Fintech"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <input
                                                type="url"
                                                value={websiteUrl}
                                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                                className="w-full bg-[#111] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 focus:outline-none transition-all"
                                                placeholder="https://yourcompany.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 md:p-8">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Search size={20} className="text-brand-yellow" /> Tracking Configuration
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Target Keywords</label>
                                        <p className="text-xs text-gray-500 mb-3">Separate keywords with commas.</p>
                                        <textarea
                                            value={keywords}
                                            onChange={(e) => setKeywords(e.target.value)}
                                            className="w-full h-24 bg-[#111] border border-white/10 rounded-lg p-4 text-white focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 focus:outline-none transition-all resize-none font-mono text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                            <Users size={16} className="text-gray-400" /> Competitors to Benchmark
                                        </label>
                                        <p className="text-xs text-gray-500 mb-3">Separate competitor names with commas.</p>
                                        <textarea
                                            value={competitors}
                                            onChange={(e) => setCompetitors(e.target.value)}
                                            className="w-full h-24 bg-[#111] border border-white/10 rounded-lg p-4 text-white focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 focus:outline-none transition-all resize-none font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {message.type === 'success' ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <div className="w-2 h-2 rounded-full bg-red-500" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={saving} className="min-w-[150px]">
                                    {saving ? <><Loader2 className="animate-spin mr-2" size={18} /> Saving...</> : <><Save className="mr-2" size={18} /> Save Changes</>}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* MODELS TAB */}
                    {activeTab === 'models' && (
                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                            <Zap size={20} className="text-brand-yellow" /> Active AI Models
                                        </h2>
                                        <p className="text-gray-400 text-sm">Select the models you want to include in your tracking scans.</p>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={handleSyncModels}
                                            disabled={syncing}
                                            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
                                        >
                                            <RotateCw size={14} className={syncing ? 'animate-spin' : ''} />
                                            {syncing ? 'Syncing...' : 'Refresh List'}
                                        </button>
                                        <div className="text-sm font-mono text-brand-yellow font-bold">{selectedModels.length} Selected</div>
                                    </div>
                                </div>

                                {/* Bundle Quick Select */}
                                <div className="mb-6 bg-[#111] border border-white/5 p-4 rounded-xl">
                                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Quick Select Bundles</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => applyBundle('BIG_3')} className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-yellow/30 text-xs px-3 py-2 rounded-lg transition-colors text-white flex items-center gap-2">
                                            <Zap size={14} className="text-brand-yellow" /> Top 3 SOTA
                                        </button>
                                        <button type="button" onClick={() => applyBundle('SPEED')} className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-yellow/30 text-xs px-3 py-2 rounded-lg transition-colors text-white flex items-center gap-2">
                                            <RotateCw size={14} className="text-blue-400" /> Speed/Flash
                                        </button>
                                        <button type="button" onClick={() => applyBundle('ALL')} className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-yellow/30 text-xs px-3 py-2 rounded-lg transition-colors text-white">
                                            Select All
                                        </button>
                                        <button type="button" onClick={() => applyBundle('CLEAR')} className="text-xs text-red-400 hover:text-red-300 px-3 py-2 ml-auto">
                                            Clear Selection
                                        </button>
                                    </div>
                                </div>

                                {/* Search and Filters */}
                                <div className="space-y-4 mb-6">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search models..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['All', 'OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 'Selected'].map(filter => (
                                            <button
                                                key={filter}
                                                type="button"
                                                onClick={() => setModelFilter(filter)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${modelFilter === filter
                                                    ? 'bg-brand-yellow text-black'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredModels.length === 0 ? (
                                        <div className="col-span-2 text-center py-10 text-gray-500 bg-[#111] rounded-xl border border-white/5">
                                            {modelFilter === 'Selected' && selectedModels.length === 0 ? (
                                                <div className="space-y-2">
                                                    <p>No models selected yet.</p>
                                                    <button
                                                        onClick={() => setModelFilter('All')}
                                                        className="text-brand-yellow hover:underline text-sm"
                                                    >
                                                        Browse All Models
                                                    </button>
                                                </div>
                                            ) : modelFilter === 'Selected' && selectedModels.length > 0 ? (
                                                <div className="space-y-2">
                                                    <p className="text-yellow-500">Selected models not found in current list.</p>
                                                    <p className="text-xs">Your previously selected model IDs might differ from the synchronization source.</p>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedModels([]); // Clear invalid
                                                            setModelFilter('All');
                                                        }}
                                                        className="text-white hover:underline text-sm bg-red-500/20 px-3 py-1 rounded"
                                                    >
                                                        Clear & Browse All
                                                    </button>
                                                </div>
                                            ) : (
                                                <p>No models found matching your search.</p>
                                            )}
                                        </div>
                                    ) : (
                                        filteredModels.map(model => (
                                            <div
                                                key={model.id}
                                                onClick={() => toggleModel(model.id)}
                                                className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex items-center justify-between group ${selectedModels.includes(model.id)
                                                    ? 'bg-brand-yellow/10 border-brand-yellow/50 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                                                    : 'bg-[#111] border-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${model.provider === 'OpenAI' ? 'bg-green-900/20 text-green-400' :
                                                        model.provider === 'Anthropic' ? 'bg-orange-900/20 text-orange-400' :
                                                            model.provider === 'Google' ? 'bg-blue-900/20 text-blue-400' :
                                                                'bg-gray-800 text-gray-400'
                                                        }`}>
                                                        {model.provider[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`font-bold truncate ${selectedModels.includes(model.id) ? 'text-white' : 'text-gray-400'}`} title={model.name}>
                                                            {model.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 uppercase flex items-center gap-2">
                                                            <span>{model.provider}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${selectedModels.includes(model.id)
                                                    ? 'bg-brand-yellow border-brand-yellow text-black'
                                                    : 'border-white/20 group-hover:border-white/50'
                                                    }`}>
                                                    {selectedModels.includes(model.id) && <Check size={14} strokeWidth={3} />}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {message.type === 'success' ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <div className="w-2 h-2 rounded-full bg-red-500" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={saving} className="min-w-[150px]">
                                    {saving ? <><Loader2 className="animate-spin mr-2" size={18} /> Saving...</> : <><Save className="mr-2" size={18} /> Save Changes</>}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-8">
                                <h2 className="text-xl font-bold text-white mb-2">Current Plan</h2>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-brand-yellow uppercase mb-1">{userPlan}</div>
                                        <p className="text-gray-400 text-sm">You are currently on the {userPlan} tier.</p>
                                    </div>
                                    {userPlan === 'free' && (
                                        <Button className="bg-white text-black hover:bg-gray-200">Upgrade Required</Button>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                {/* Pro Plan */}
                                <div className={`border rounded-xl p-6 relative overflow-hidden flex flex-col ${userPlan === 'pro' ? 'border-brand-yellow bg-brand-yellow/5' : 'border-white/10 bg-[#0a0a0a]'}`}>
                                    {userPlan === 'pro' && <div className="absolute top-0 right-0 bg-brand-yellow text-black text-xs font-bold px-3 py-1 rounded-bl-lg">CURRENT</div>}
                                    <h3 className="text-xl font-bold text-white mb-1">Scale (Pro)</h3>
                                    <div className="text-2xl font-bold text-gray-200 mb-4">$19<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                                    <ul className="space-y-3 text-sm text-gray-400 mb-8 flex-1">
                                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> 10 Credits Monthly</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Up to 15 AI Models</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Priority Processing</li>
                                    </ul>
                                    <Button
                                        disabled={userPlan === 'pro'}
                                        onClick={() => handleUpgrade('pro', process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_placeholder_pro')}
                                        className="w-full"
                                    >
                                        {userPlan === 'pro' ? 'Active Plan' : 'Upgrade to Scale'}
                                    </Button>
                                </div>

                                {/* Premium Plan */}
                                <div className={`border rounded-xl p-6 relative overflow-hidden flex flex-col ${userPlan === 'premium' ? 'border-brand-yellow bg-brand-yellow/5' : 'border-white/10 bg-[#0a0a0a]'}`}>
                                    {userPlan === 'premium' && <div className="absolute top-0 right-0 bg-brand-yellow text-black text-xs font-bold px-3 py-1 rounded-bl-lg">CURRENT</div>}
                                    <h3 className="text-xl font-bold text-white mb-1">Growth (Premium)</h3>
                                    <div className="text-2xl font-bold text-brand-yellow mb-4">$49<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                                    <ul className="space-y-3 text-sm text-gray-400 mb-8 flex-1">
                                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> 30 Credits Monthly</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Up to 50 AI Models</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> All Model Providers</li>
                                    </ul>
                                    <Button
                                        disabled={userPlan === 'premium'}
                                        onClick={() => handleUpgrade('premium', process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || 'price_placeholder_premium')}
                                        className="w-full shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                                    >
                                        {userPlan === 'premium' ? 'Active Plan' : 'Upgrade to Growth'}
                                    </Button>
                                </div>

                                {/* Ultra Plan */}
                                <div className={`border rounded-xl p-6 relative overflow-hidden flex flex-col ${userPlan === 'ultra' ? 'border-brand-yellow bg-brand-yellow/5' : 'border-brand-yellow/30 bg-gradient-to-b from-brand-yellow/10 to-transparent'}`}>
                                    {userPlan === 'ultra' && <div className="absolute top-0 right-0 bg-brand-yellow text-black text-xs font-bold px-3 py-1 rounded-bl-lg">CURRENT</div>}
                                    <h3 className="text-xl font-bold text-white mb-1">Power (Ultra)</h3>
                                    <div className="text-2xl font-bold text-brand-yellow mb-4">$99<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                                    <ul className="space-y-3 text-sm text-gray-300 mb-8 flex-1">
                                        <li className="flex items-center gap-2"><Check size={14} className="text-brand-yellow" /> 100 Credits Monthly</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-brand-yellow" /> Up to 100 AI Models</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-brand-yellow" /> 24/7 Priority Support</li>
                                    </ul>
                                    <Button
                                        disabled={userPlan === 'ultra'}
                                        onClick={() => handleUpgrade('ultra', process.env.NEXT_PUBLIC_STRIPE_PRICE_ULTRA || 'price_placeholder_ultra')}
                                        className="w-full shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                                    >
                                        {userPlan === 'ultra' ? 'Active Plan' : 'Upgrade to Power'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USAGE TAB */}
                    {activeTab === 'usage' && (
                        <div className="space-y-6">
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-8">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Zap size={20} className="text-brand-yellow" /> Credit Usage
                                </h2>

                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    <div className="relative w-48 h-48 flex items-center justify-center">
                                        {/* Simple Circle Vis */}
                                        <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-white">{currentCredits}</div>
                                            <div className="text-sm text-gray-500 uppercase tracking-widest mt-1">Credits Used</div>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                            <div className="text-sm text-gray-400 mb-1">Current Plan Limit</div>
                                            <div className="text-2xl font-bold text-white uppercase">{userPlan}</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                            <div className="text-sm text-gray-400 mb-1">Rate per Scan</div>
                                            <div className="text-xl font-bold text-white">~0.5 Credits <span className="text-sm font-normal text-gray-500">(varies by model)</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
