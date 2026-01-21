"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { Lightbulb, Target, Trophy, AlertTriangle, ArrowRight, ShieldCheck, TrendingUp, CheckCircle2, Globe, Search, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "../../components/Button";

interface StrategyCardProps {
    title: string;
    description: string;
    type: "opportunity" | "warning" | "success";
    action?: string;
}

function StrategyCard({ title, description, type, action }: StrategyCardProps) {
    const colors = {
        opportunity: "border-blue-500/30 bg-blue-500/5 text-blue-400",
        warning: "border-red-500/30 bg-red-500/5 text-red-400",
        success: "border-green-500/30 bg-green-500/5 text-green-400"
    };

    const icons = {
        opportunity: Lightbulb,
        warning: AlertTriangle,
        success: ShieldCheck
    };

    const Icon = icons[type];

    return (
        <div className={`p-6 rounded-2xl border ${colors[type]} relative overflow-hidden group hover:border-opacity-60 transition-all`}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform`}>
                <Icon size={40} />
            </div>
            <div className="relative z-10">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Icon size={18} /> {title}
                </h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                    {description}
                </p>
                {action && (
                    <Button size="sm" variant="secondary" className="h-8 text-xs bg-white/5 hover:bg-white/10 border-none text-white">
                        {action} <ArrowRight size={12} className="ml-1" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// Sub-components for Audit
function ContentAuditModule({ userPlan }: { userPlan: string }) {
    const [auditData, setAuditData] = useState<any>(null);
    const [auditing, setAuditing] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'technical'>('overview');
    const isPro = userPlan !== 'free';

    const runAudit = async () => {
        if (!isPro) return;
        setAuditing(true);
        setError('');
        try {
            const res = await fetch('/api/audit-website', { method: 'POST', body: JSON.stringify({}) });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Audit failed');
            }
            const data = await res.json();
            setAuditData(data);
        } catch (e: any) {
            setError(e.message);
        }
        setAuditing(false);
    };
    return (
        <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                        <Globe className="text-brand-yellow" /> Neural Site Architecture
                        {!isPro && <span className="text-xs bg-brand-yellow text-black px-2 py-0.5 rounded font-bold uppercase ml-2">PRO Only</span>}
                    </h2>
                    <p className="text-gray-400 max-w-xl">
                        Deep scan your content's "Knowledge Graph" clarity. We analyze how effectively your site communicates entities, relationships, and technical facts to AI models.
                    </p>
                </div>
                <div>
                    {!isPro ? (
                        <Button
                            onClick={() => window.location.href = '/pricing'}
                            className="bg-white/10 text-white hover:bg-white/20 font-bold px-6 h-12 border border-white/20 backdrop-blur-sm"
                        >
                            Upgrade to Unlock
                        </Button>
                    ) : auditing ? (
                        <div className="px-6 py-3 bg-brand-yellow/20 text-brand-yellow rounded-lg flex items-center gap-2 font-bold animate-pulse">
                            <Loader2 className="animate-spin" size={18} /> Extracting Neural Map...
                        </div>
                    ) : (
                        <Button
                            onClick={runAudit}
                            disabled={!!auditData}
                            className="bg-brand-yellow text-black hover:bg-yellow-400 font-bold px-6 h-12 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                        >
                            {auditData ? 'Re-Scan Architecture' : 'Run Neural Audit'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Locked State Overlay */}
            {!isPro && (
                <div className="absolute inset-0 top-24 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent z-20 flex items-center justify-center pointer-events-none">
                    <div className="text-center p-8 pointer-events-auto">
                        <Trophy size={48} className="text-brand-yellow mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">Unlock Neural Architecture Map</h3>
                        <p className="text-gray-400 mb-6 max-w-md">
                            See the exact Knowledge Graph entities your site is projecting, extract valid JSON-LD Schema, and get Machine Readability scores.
                        </p>
                        <Button onClick={() => window.location.href = '/pricing'} className="bg-brand-yellow text-black hover:bg-yellow-400 font-bold w-full">
                            View Plans
                        </Button>
                    </div>
                </div>
            )}

            {/* Blurry Placeholder only shown if NOT Pro and NOT auditing */}
            {!isPro && !auditData && (
                <div className="space-y-6 opacity-20 filter blur-sm select-none pointer-events-none" aria-hidden="true">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="h-10 bg-white/10 rounded w-full"></div>
                        <div className="h-10 bg-white/10 rounded w-full"></div>
                        <div className="h-10 bg-white/10 rounded w-full"></div>
                    </div>
                    <div className="bg-[#111] border border-white/5 p-6 rounded-xl flex items-center gap-6">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="w-full h-full rounded-full border-8 border-gray-800"></div>
                        </div>
                        <div>
                            <div className="h-6 w-32 bg-gray-800 rounded mb-2"></div>
                            <div className="h-4 w-64 bg-gray-800 rounded"></div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertTriangle size={18} /> {error}
                </div>
            )}

            {auditData && (
                <div className="space-y-6 animate-fade-in-up">

                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-lg w-fit">
                        {['overview', 'entities', 'technical'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all ${activeTab === tab
                                        ? 'bg-brand-yellow text-black shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-[#111] border border-white/5 p-6 rounded-xl flex items-center gap-6">
                                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="50%" cy="50%" r="40" stroke="#333" strokeWidth="8" fill="transparent" />
                                        <circle
                                            cx="50%" cy="50%" r="40"
                                            stroke={auditData.score > 70 ? '#4ade80' : auditData.score > 40 ? '#facc15' : '#f87171'}
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 * (1 - auditData.score / 100)}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute text-2xl font-bold text-white">{auditData.score}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Machine Readability Score</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{auditData.summary}</p>
                                </div>
                            </div>
                            <div className="grid gap-4">
                                {auditData.recommendations.map((rec: any, i: number) => (
                                    <div key={i} className="bg-[#111] border border-white/5 p-5 rounded-xl hover:border-brand-yellow/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white group-hover:text-brand-yellow transition-colors">{rec.title}</h4>
                                            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${rec.priority === 'high' ? 'text-red-400 border-red-400/20 bg-red-400/10' :
                                                    rec.priority === 'medium' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' :
                                                        'text-blue-400 border-blue-400/20 bg-blue-400/10'
                                                }`}>{rec.priority} Priority</span>
                                        </div>
                                        <p className="text-sm text-gray-500 leading-relaxed">{rec.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ENTITIES TAB */}
                    {activeTab === 'entities' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-[#111] border border-white/5 p-6 rounded-xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Target className="text-brand-yellow" size={20} /> Extracted Knowledge Graph
                                </h3>
                                <p className="text-sm text-gray-400 mb-6">
                                    These are the unambiguous entities an LLM detects on your page. If your core product isn't here, the models can't "see" it.
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    {auditData.knowledge_graph?.entities?.map((ent: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 pr-4 rounded-full overflow-hidden">
                                            <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${ent.confidence === 'High' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {ent.type}
                                            </div>
                                            <span className="text-white font-medium">{ent.name}</span>
                                        </div>
                                    ))}
                                    {(!auditData.knowledge_graph?.entities || auditData.knowledge_graph.entities.length === 0) && (
                                        <div className="text-gray-500 italic">No clear entities extracted. Content may be too vague.</div>
                                    )}
                                </div>

                                {auditData.knowledge_graph?.missing_topics?.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                                            <AlertTriangle size={14} /> Missing Contextual Topics
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {auditData.knowledge_graph.missing_topics.map((topic: string, i: number) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded border border-red-500/20 bg-red-500/5 text-red-300">
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TECHNICAL TAB */}
                    {activeTab === 'technical' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-[#111] border border-white/5 p-6 rounded-xl">
                                    <h3 className="font-bold text-white mb-4">Schema Status</h3>
                                    <div className={`flex items-center gap-3 text-lg font-bold mb-2 ${auditData.tech_check?.has_schema ? 'text-green-400' : 'text-red-400'}`}>
                                        {auditData.tech_check?.has_schema ? <CheckCircle2 /> : <AlertTriangle />}
                                        {auditData.tech_check?.has_schema ? 'Valid JSON-LD Detected' : 'No Structured Data Found'}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {auditData.tech_check?.has_schema
                                            ? `Good job! We found valid schema of type: ${auditData.tech_check.schema_type}`
                                            : "Your site lacks structured data, making it harder for models to parse your 'About' content confidently."}
                                    </p>
                                </div>
                                <div className="bg-[#111] border border-white/5 p-6 rounded-xl">
                                    <h3 className="font-bold text-white mb-4">Meta Efficiency</h3>
                                    {auditData.tech_check?.missing_meta?.length === 0 ? (
                                        <div className="text-green-400 flex items-center gap-2"><CheckCircle2 size={18} /> All core tags present</div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-400 mb-2">Missing recommended tags:</p>
                                            {auditData.tech_check?.missing_meta?.map((tag: string, i: number) => (
                                                <div key={i} className="text-red-400 text-sm flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {tag}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Code Generator */}
                            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <div className="text-xs bg-brand-yellow text-black px-1.5 py-0.5 rounded font-mono">JSON-LD</div>
                                        {auditData.tech_check?.has_schema ? 'Your Current Snippet' : 'Auto-Generated Fix'}
                                    </h3>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs"
                                        onClick={() => navigator.clipboard.writeText(auditData.schema_suggestion?.code || '')}
                                    >
                                        Copy Code
                                    </Button>
                                </div>
                                <div className="p-6 bg-black/50 overflow-x-auto">
                                    <pre className="text-xs font-mono text-gray-300 leading-relaxed">
                                        {auditData.schema_suggestion?.code || '// No schema suggestion available'}
                                    </pre>
                                </div>
                                <div className="px-6 py-4 bg-yellow-500/5 border-t border-white/5 text-xs text-yellow-200/70">
                                    <strong className="text-yellow-400">Why this matters:</strong> {auditData.schema_suggestion?.explanation}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function InsightsPage() {
    const [loading, setLoading] = useState(true);
    const [competitors, setCompetitors] = useState<{ name: string, count: number }[]>([]);
    const [strategies, setStrategies] = useState<StrategyCardProps[]>([]);
    const [stats, setStats] = useState<{ shareOfVoice: number, sentiment: number } | null>(null);
    const [userPlan, setUserPlan] = useState<string>('free');

    useEffect(() => {
        const analyzeData = async () => {
            const supabase = createClient();

            // Fetch User Profile for Plan
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
                if (profile) setUserPlan(profile.plan || 'free');
            }

            // 1. Fetch data
            const { data: results } = await supabase
                .from('test_results')
                .select('response_text, is_mentioned, sentiment_score, model_name')
                .limit(100); // Analyze last 100 for performance

            if (!results || results.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Mock NER / Competitor Extraction (Heuristic: Common capitalized words in failed scans)
            // In a real app, this would use an NLP service or a predefined list.
            const failedScans = results.filter(r => !r.is_mentioned);
            const wordMap: Record<string, number> = {};

            // Helper to ignore common non-nouns
            const stopWords = new Set(['The', 'A', 'An', 'This', 'That', 'There', 'Here', 'I', 'You', 'We', 'They', 'It', 'In', 'On', 'At', 'For', 'To', 'Of', 'With', 'By', 'As', 'But', 'Or', 'And', 'If', 'When', 'While', 'However', 'Therefore', 'Thus', 'So', 'Then', 'Who', 'What', 'Where', 'Why', 'How', 'AI', 'LLM', 'API', 'GPT']);

            failedScans.forEach(scan => {
                const text = scan.response_text;
                // Regex for capitalized words inside text
                const matches = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g);
                if (matches) {
                    matches.forEach((word: string) => {
                        if (word.length > 3 && !stopWords.has(word)) {
                            wordMap[word] = (wordMap[word] || 0) + 1;
                        }
                    });
                }
            });

            // Filter noise (must appear in at least 10% of failed scans if sample is small, or just top count)
            const sortedCompetitors = Object.entries(wordMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Start with raw top 5

            setCompetitors(sortedCompetitors);

            // 3. Generate Strategies
            const total = results.length;
            const mentioned = results.filter(r => r.is_mentioned).length;
            const shareOfVoice = Math.round((mentioned / total) * 100);
            const avgSentiment = results.reduce((acc, r) => acc + (r.sentiment_score || 0), 0) / total;

            const newStrategies: StrategyCardProps[] = [];

            // A. Visibility Check
            if (shareOfVoice < 20) {
                newStrategies.push({
                    title: "Critical Visibility Gap",
                    description: "Your brand is missing from >80% of relevant AI conversations. The algorithms don't associate your brand with your core keywords yet.",
                    type: "warning",
                    action: "Review Keyword Strategy"
                });
            } else if (shareOfVoice < 50) {
                newStrategies.push({
                    title: "Growing Presence",
                    description: "You are appearing in nearly half of the searches. To dominate, you need to be citing in high-authority technical documentation.",
                    type: "opportunity",
                    action: "View Content Plan"
                });
            } else {
                newStrategies.push({
                    title: "Market Leader Status",
                    description: "You are the dominant answer for your category. Focus on maintaining this position defensively.",
                    type: "success"
                });
            }

            // B. Sentiment Check
            if (avgSentiment < 0.2) {
                newStrategies.push({
                    title: "Neutral/Negative Sentiment",
                    description: "Models are mentioning you, but without enthusiasm. This usually means you appear in lists but lack 'opinionated' reviews.",
                    type: "opportunity",
                    action: "Launch Review Campaign"
                });
            }

            // C. Model Specific
            const openAiMentions = results.filter(r => r.model_name.includes('gpt') && r.is_mentioned).length;
            const anthropicMentions = results.filter(r => r.model_name.includes('claude') && r.is_mentioned).length;

            if (openAiMentions > 0 && anthropicMentions === 0) {
                newStrategies.push({
                    title: "Anthropic Blindspot",
                    description: "You perform well on GPT-4 but are invisible to Claude. Claude prioritizes different training data sets (more academic/technical papers).",
                    type: "warning",
                    action: "Target Technical Whitepapers"
                });
            }

            setStrategies(newStrategies);
            setStats({ shareOfVoice, sentiment: avgSentiment });
            setLoading(false);
        };

        analyzeData();
    }, []);

    if (loading) return <div className="p-8 text-white flex items-center gap-2">Analyzing Strategic Vectors...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in-up pb-20">
            {/* Context Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Strategic Intelligence</h1>
                <p className="text-gray-400 max-w-2xl">
                    Our heuristics engine analyzes your scan failures to identify who is beating you and why.
                    Use these insights to reverse-engineer their visibility.
                </p>
            </div>

            {/* Strategic Advice Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {strategies.map((s, i) => (
                    <StrategyCard key={i} {...s} />
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Competitor Recon */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="text-brand-yellow" /> Common Competitors
                    </h2>
                    <p className="text-sm text-gray-500">
                        Entities that frequently appear in responses where your brand was <strong>missing</strong>.
                    </p>

                    {competitors.length > 0 ? (
                        <div className="space-y-3">
                            {competitors.map((comp, i) => (
                                <div key={i} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-brand-yellow/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400">
                                            {i + 1}
                                        </div>
                                        <span className="font-bold text-white">{comp.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Seen {comp.count} times
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 border border-white/10 border-dashed rounded-xl text-center text-gray-500 text-sm">
                            Not enough failure data to identify clear competitors yet.
                        </div>
                    )}
                </div>

                {/* Optimization Checklist */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="text-brand-yellow" /> Optimization Checklist
                    </h2>
                    <p className="text-sm text-gray-500">
                        Recommended actions to improve your neural rank position.
                    </p>

                    <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                            <div className="mt-0.5 w-5 h-5 rounded border border-white/20 flex items-center justify-center group-hover:border-brand-yellow/50">
                                <div className="w-2.5 h-2.5 bg-brand-yellow rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <div className="text-white font-medium text-sm group-hover:text-brand-yellow">Update Wikipedia & Wikidata</div>
                                <div className="text-xs text-gray-500 mt-1">Ensure your entity is clearly defined in knowledge graphs used by LLMs.</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                            <div className="mt-0.5 w-5 h-5 rounded border border-white/20 flex items-center justify-center group-hover:border-brand-yellow/50">
                                <div className="w-2.5 h-2.5 bg-brand-yellow rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <div className="text-white font-medium text-sm group-hover:text-brand-yellow">Get Listed in "Best of" Roundups</div>
                                <div className="text-xs text-gray-500 mt-1">LLMs heavily weight listicle content for "discovery" usage patterns.</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                            <div className="mt-0.5 w-5 h-5 rounded border border-white/20 flex items-center justify-center group-hover:border-brand-yellow/50">
                                <div className="w-2.5 h-2.5 bg-brand-yellow rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <div className="text-white font-medium text-sm group-hover:text-brand-yellow">Technical Documentation SEO</div>
                                <div className="text-xs text-gray-500 mt-1">For developer-focused prompts, stack overflow and docs are key training data.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deep Content Audit Section */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <ContentAuditModule userPlan={userPlan} />
            </div>
        </div>
    );
}
