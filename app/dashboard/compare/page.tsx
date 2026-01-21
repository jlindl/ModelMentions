'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Button } from '../../components/Button';
import { Swords, Trophy, Loader2, AlertCircle, ArrowRight, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ComparePage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [competitors, setCompetitors] = useState<string[]>([]);
    const [selectedCompetitor, setSelectedCompetitor] = useState('');
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('competitors')
                    .eq('id', user.id)
                    .single();

                if (profile?.competitors) {
                    setCompetitors(profile.competitors);
                    if (profile.competitors.length > 0) setSelectedCompetitor(profile.competitors[0]);
                }
            }
        };
        fetchProfile();
    }, []);

    const runBattle = async () => {
        if (!selectedCompetitor || !topic) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/run-comparison', {
                method: 'POST',
                body: JSON.stringify({
                    competitorName: selectedCompetitor,
                    topic: topic,
                    model: 'openai/gpt-4o' // Default for now
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Battle failed');

            setResult(data);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <Swords className="text-brand-yellow" /> Competitor Battlecard
                </h1>
                <p className="text-gray-400">Head-to-head AI analysis of your brand vs. the competition.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Battle Setup</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Opponent</label>
                                {competitors.length > 0 ? (
                                    <select
                                        value={selectedCompetitor}
                                        onChange={(e) => setSelectedCompetitor(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:border-brand-yellow/50 focus:outline-none"
                                    >
                                        {competitors.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                ) : (
                                    <div className="text-sm text-gray-500 p-3 bg-white/5 rounded-lg border border-dashed border-white/10">
                                        No competitors found. Add them in Settings.
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Topic / Feature</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Pricing, API Latency..."
                                    className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:border-brand-yellow/50 focus:outline-none"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5" />
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={runBattle}
                                disabled={loading || !selectedCompetitor || !topic}
                                className="w-full justify-center shadow-[0_0_20px_rgba(255,215,0,0.1)]"
                            >
                                {loading ? <><Loader2 className="animate-spin mr-2" /> Analyzing...</> : <><Swords className="mr-2" size={18} /> Fight!</>}
                            </Button>

                            <p className="text-xs text-center text-gray-500">Cost: 1 Credit per Battle</p>
                        </div>
                    </div>
                </div>

                {/* Arena / Results */}
                <div className="lg:col-span-2">
                    {result ? (
                        <div className="space-y-6">
                            {/* Winner Banner */}
                            <div className={`p-6 rounded-xl border ${result.winner === 'Challenger' ? 'bg-green-900/20 border-green-500/30' :
                                    result.winner === 'Defender' ? 'bg-red-900/20 border-red-500/30' :
                                        'bg-gray-800/30 border-gray-600/30'
                                } flex items-center gap-4`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${result.winner === 'Challenger' ? 'bg-green-500 text-black' :
                                        result.winner === 'Defender' ? 'bg-red-500 text-white' :
                                            'bg-gray-500 text-white'
                                    }`}>
                                    <Trophy />
                                </div>
                                <div>
                                    <div className="text-sm font-bold uppercase tracking-widest opacity-70">Winner</div>
                                    <div className="text-2xl font-bold text-white">{result.winner_name}</div>
                                </div>
                            </div>

                            {/* Verdict */}
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-white mb-6">The Verdict</h3>
                                <div className="text-lg text-gray-300 italic border-l-4 border-brand-yellow pl-6 mb-8">
                                    "{result.reason}"
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="flex items-center gap-2 text-green-400 font-bold mb-4">
                                            <Shield size={18} /> Your Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.challenger_strengths?.map((s: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                                                    <ArrowRight size={14} className="mt-1 text-green-500" /> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 text-red-400 font-bold mb-4">
                                            <Swords size={18} /> Opponent Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.defender_strengths?.map((s: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                                                    <ArrowRight size={14} className="mt-1 text-red-500" /> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Deep Dive */}
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-white mb-4">Deep Analysis</h3>
                                <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                                    <ReactMarkdown>{result.detailed_analysis}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-[#0a0a0a] border border-white/10 rounded-xl border-dashed">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <Swords size={40} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-500 mb-2">Ready for Battle</h3>
                            <p className="text-gray-600 max-w-xs text-center">
                                Select a competitor and a topic to let GPT-4o determine the true winner.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
