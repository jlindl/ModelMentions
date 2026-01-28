'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/Button';
import { createClient } from '../../utils/supabase/client';
import { Play, Loader2, CheckCircle2, AlertTriangle, TrendingUp, BarChart, Eye, Search, Target, Zap, ChevronRight, Sparkles } from 'lucide-react';
import { UpgradeModal } from '../../components/UpgradeModal';
import { ResultDetailsModal } from './ResultDetailsModal';
import { ScanLoadingOverlay } from '../../components/ScanLoadingOverlay';

interface TestResult {
    model_name: string;
    response_text: string;
    is_mentioned: boolean;
    sentiment_score: number;
    rank_position: number | null;
    prompt_text: string;
    created_at?: string;
    subject?: string;
}

export default function ScanPage() {
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [results, setResults] = useState<TestResult[]>([]);
    const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState('');

    const [selectedModelsData, setSelectedModelsData] = useState<any[]>([]);
    const [loadingModels, setLoadingModels] = useState(true);

    // Confirmation State
    const [showConfirm, setShowConfirm] = useState(false);
    const [profileData, setProfileData] = useState<{ company: string, keywords: string[] } | null>(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("Idle");

    const router = useRouter();

    useEffect(() => {
        const fetchModels = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Get Profile to see selected IDs and Company Settings
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('selected_models, company_name, keywords, plan')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserPlan(profile.plan || 'free'); // Create state for this
                    setProfileData({
                        company: profile.company_name || 'Not Configured',
                        keywords: profile.keywords || []
                    });
                }

                const selectedIds = profile?.selected_models || [];

                if (selectedIds.length > 0) {
                    // Fetch details for these IDs
                    const { data: models } = await supabase
                        .from('available_models')
                        .select('*')
                        .in('id', selectedIds);

                    if (models) setSelectedModelsData(models);
                }
            }
            setLoadingModels(false);
        };
        fetchModels();
    }, []);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    // Competitor Mode Logic
    const [includeCompetitors, setIncludeCompetitors] = useState(false);
    const [userPlan, setUserPlan] = useState('free');

    // Step 1: User clicks Initialize
    const handleInitialize = () => {
        if (selectedModelsData.length === 0) {
            router.push('/dashboard/settings');
            return;
        }
        setShowConfirm(true);
    };

    // Check for active runs on mount
    useEffect(() => {
        const checkActiveRun = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Find any run that is 'running'
            const { data: activeRun } = await supabase
                .from('test_runs')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'running')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (activeRun) {
                // Found an interrupted run
                addLog('⚠️ Detected interrupted scan. Resuming automatically...');

                // Get count of pending items
                const { count } = await supabase
                    .from('test_results')
                    .select('*', { count: 'exact', head: true })
                    .eq('run_id', activeRun.id)
                    .eq('status', 'pending');

                // Also get total count to estimate progress
                const { count: total } = await supabase
                    .from('test_results')
                    .select('*', { count: 'exact', head: true })
                    .eq('run_id', activeRun.id);

                if (count && count > 0) {
                    setRunning(true);
                    setStatus("Resuming Scan...");
                    // Trigger processing loop
                    executeScanLoop(activeRun.id, count, total || count);
                } else {
                    // It says running but nothing pending? Mark complete.
                    await supabase.from('test_runs').update({ status: 'completed' }).eq('id', activeRun.id);
                    addLog('Previous run had no pending items. Marked as complete.');
                }
            }
        };
        checkActiveRun();
    }, []);

    // Reusable Scan Loop
    const executeScanLoop = async (runId: string, initialRemaining: number, totalCount: number) => {
        let remaining = initialRemaining;

        while (remaining > 0) {
            const percent = totalCount > 0 ? Math.round(((totalCount - remaining) / totalCount) * 100) : 0;
            setProgress(percent);
            setStatus(`Scanning... ${percent}%`);

            // Fetch/Process Batch
            const processRes = await fetch('/api/run-test/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId, batchSize: 5 })
            });

            if (!processRes.ok) {
                console.error("Batch processing failed, retrying...");
                addLog("Retrying batch...");
                await new Promise(r => setTimeout(r, 2000)); // wait 2s
                continue; // Retry indefinitely (or could add max retries)
            }

            const processData = await processRes.json();

            // Check if backend says we are done (e.g. strict boolean)
            if (processData.completed) {
                remaining = 0;
                break;
            }

            const processedInBatch = processData.processed || 0;
            if (processedInBatch > 0) {
                addLog(`Processed ${processedInBatch} prompts...`);
            }

            // Update remaining from server response to be accurate
            remaining = processData.remaining;
        }

        setProgress(100);
        setStatus("Finalizing...");
        addLog('All batches complete. Fetching final report...');

        // Fetch Final Results
        const supabase = createClient();
        const { data: runResults, error: dbError } = await supabase
            .from('test_results')
            .select('*')
            .eq('run_id', runId)
            .order('created_at', { ascending: true });

        if (runResults) {
            setResults(runResults as TestResult[]);
        }
        setRunning(false);
        addLog('Analysis Complete.');
    };

    // Step 2: User confirms and runs
    const confirmAndRun = async () => {
        setShowConfirm(false);
        setRunning(true);
        setLogs([]);
        setResults([]);
        setProgress(0);
        setStatus("Initializing...");

        const mode = includeCompetitors ? 'PREMIUM COMPETITOR SCAN' : 'STANDARD SCAN';
        addLog(`Initializing ${mode} Engine on ${selectedModelsData.length} models...`);

        try {
            // 1. Initialize Scan
            const response = await fetch('/api/run-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    includeCompetitors: includeCompetitors
                })
            });

            if (!response.ok) {
                const err = await response.json();
                if (response.status === 403) {
                    setUpgradeMessage(err.error);
                    setShowUpgrade(true);
                    addLog('Testing halted: Usage limit exceeded or Upgrade Required.');
                    setRunning(false);
                    return;
                }
                throw new Error(err.error || 'API Error');
            }

            const data = await response.json();
            const { runId, count } = data;

            addLog(`Scan Run ID: ${runId}`);
            addLog(`Queued ${count} checks. Starting batch processing...`);

            // 2. Start Processing Loop
            await executeScanLoop(runId, count, count);

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            addLog(`Error: ${msg}`);
            setRunning(false);
        }
    };

    // Group results by model
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.model_name]) {
            acc[result.model_name] = [];
        }
        acc[result.model_name].push(result);
        return acc;
    }, {} as Record<string, TestResult[]>);

    const modelKeys = Object.keys(groupedResults);

    const stats = {
        total: results.length,
        mentioned: results.filter(r => r.is_mentioned).length,
        sentiment: results.reduce((acc, r) => acc + r.sentiment_score, 0) / (results.length || 1),
        avgRank: results.filter(r => r.rank_position).reduce((acc, r) => acc + (r.rank_position || 0), 0) / (results.filter(r => r.rank_position).length || 1)
    };

    return (
        <div className="space-y-8 animate-fade-in-up flex flex-col relative min-h-screen pb-20">
            <ResultDetailsModal
                isOpen={!!selectedResult}
                onClose={() => setSelectedResult(null)}
                result={selectedResult}
                brandName={profileData?.company}
            />

            <UpgradeModal
                isOpen={showUpgrade}
                onClose={() => setShowUpgrade(false)}
                currentUsage={upgradeMessage}
            />

            {running && <ScanLoadingOverlay progress={progress} status={status} />}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#111] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="text-brand-yellow" /> Confirm Scan Configuration
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-gray-400 text-sm">Target Brand</span>
                                    <span className="text-white font-bold">{profileData?.company}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-gray-400 text-sm">Keywords</span>
                                    <div className="flex gap-1 justify-end flex-wrap max-w-[200px]">
                                        {profileData?.keywords.length ? (
                                            profileData.keywords.slice(0, 5).map(k => <span key={k} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 transform hover:scale-105 transition-transform">{k}</span>)
                                        ) : <span className="text-red-400 text-xs">None Configured</span>}
                                        {(profileData?.keywords.length || 0) > 5 && <span className="text-[10px] text-gray-500">+{profileData!.keywords.length - 5} more</span>}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-gray-400 text-sm">Scan Depth</span>
                                    <span className="text-white font-bold">3 Prompts / Model</span>
                                </div>
                                <div className="flex justify-between items-start pt-1">
                                    <span className="text-gray-400 text-sm">Selected Models</span>
                                    <div className="text-right">
                                        <span className="text-brand-yellow font-bold text-lg">{selectedModelsData.length}</span>
                                        <div className="text-[10px] text-gray-500 max-w-[150px] leading-tight mt-1 flex flex-wrap justify-end gap-1">
                                            {selectedModelsData.map(m => (
                                                <span key={m.id} className="bg-white/5 px-1 py-0.5 rounded">{m.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-center text-gray-500">
                                This scan will consume approximately <span className="text-white font-bold">{selectedModelsData.length * 3 * 0.1 * (includeCompetitors ? 2 : 1)} credits</span> based on current rates.
                            </p>
                        </div>

                        {/* Premium Competitor Toggle */}
                        <div className={`mb-6 p-4 rounded-xl border transition-all ${includeCompetitors ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-[#1a1a1a] border-white/10'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-white flex items-center gap-2">
                                        <Target size={16} className={includeCompetitors ? "text-indigo-400" : "text-gray-500"} />
                                        Include Competitor Analysis
                                        {userPlan === 'free' || userPlan === 'pro' ? <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase">Premium</span> : null}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Runs prompts against your top 3 competitors (2x Cost).</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={includeCompetitors}
                                        disabled={userPlan === 'free' || userPlan === 'pro'}
                                        onChange={(e) => setIncludeCompetitors(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setShowConfirm(false)} className="flex-1 h-12">
                                Cancel
                            </Button>
                            <Button onClick={confirmAndRun} className="flex-1 font-bold h-12 bg-gradient-to-r from-brand-yellow to-yellow-500 text-black border-none hover:shadow-lg hover:from-yellow-400 hover:to-yellow-500">
                                <Play size={16} className="mr-2 fill-current" /> Launch Scan Now
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="bg-[#0a0a0a] border-b border-white/10 -mx-6 -mt-6 px-6 py-8 mb-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-brand-yellow uppercase tracking-widest border border-brand-yellow/30 px-2 py-0.5 rounded-full bg-brand-yellow/10">v2.4 Engine</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Active Scan</h1>

                        {/* Selected Models Display */}
                        <div className="mt-4">
                            {loadingModels ? (
                                <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="animate-spin" size={14} /> Loading configuration...</div>
                            ) : selectedModelsData.length > 0 ? (
                                <div className="flex flex-wrap gap-2 animate-fade-in-up">
                                    <span className="text-sm text-gray-400 py-1">Scanning across:</span>
                                    {selectedModelsData.map(m => (
                                        <span key={m.id} className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                                            {m.provider === 'OpenAI' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                            {m.provider === 'Anthropic' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                            {m.provider === 'Google' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                            {m.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 inline-flex items-center gap-4">
                                    <div className="text-red-400 text-sm font-bold flex items-center gap-2">
                                        <AlertTriangle size={16} /> No Models Selected
                                    </div>
                                    <Button
                                        onClick={() => router.push('/dashboard/settings')}
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 text-xs bg-red-500/20 hover:bg-red-500/30 text-white border-none"
                                    >
                                        Configure Models
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {running && (
                            <div className="flex items-center gap-2 text-brand-yellow animate-pulse text-sm font-mono">
                                <Loader2 size={16} className="animate-spin" />
                                PROCESSING SCENARIOS...
                            </div>
                        )}
                        <Button
                            onClick={handleInitialize}
                            disabled={running || selectedModelsData.length === 0}
                            size="lg"
                            className={`px-8 h-14 text-base font-bold shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:shadow-[0_0_60px_rgba(255,215,0,0.5)] transition-all border border-brand-yellow/20 bg-gradient-to-r from-brand-yellow to-yellow-400 text-black ${selectedModelsData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {running ? 'Scanning Neural Networks...' : 'INITIALIZE SCAN'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto w-full space-y-8">

                {/* Results Section */}
                {results.length > 0 ? (
                    <div className="space-y-8 animate-fade-in-up">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-brand-yellow/30 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Target size={40} /></div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Visibility</div>
                                <div className="text-4xl font-bold text-white flex items-baseline gap-2">
                                    {Math.round((stats.mentioned / (stats.total || 1)) * 100)}<span className="text-2xl text-brand-yellow">%</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Share of Voice</div>
                            </div>
                            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-brand-yellow/30 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={40} /></div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Sentiment</div>
                                <div className={`text-4xl font-bold flex items-baseline gap-2 ${stats.sentiment > 0.7 ? 'text-green-400' : stats.sentiment > 0.4 ? 'text-brand-yellow' : 'text-red-400'}`}>
                                    {Math.round(stats.sentiment * 100)}<span className="text-sm opacity-50">/100</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Brand Perception</div>
                            </div>
                            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-brand-yellow/30 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><BarChart size={40} /></div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Avg Rank</div>
                                <div className="text-4xl font-bold text-white flex items-baseline gap-2">
                                    #{stats.avgRank > 0 ? (Math.round(stats.avgRank * 10) / 10) : '-'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Position in Lists</div>
                            </div>
                            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-brand-yellow/30 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Zap size={40} /></div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Models</div>
                                <div className="text-4xl font-bold text-white flex items-baseline gap-2">
                                    {modelKeys.length}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Tested Engines</div>
                            </div>
                        </div>

                        {/* Console Logs Mockup (Smaller now) */}
                        <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-500 max-h-32 overflow-y-auto">
                            <div className="mb-2 text-green-500 font-bold flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> SYSTEM LOGS</div>
                            {logs.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}
                        </div>

                        {/* Detailed Results */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Search className="text-brand-yellow" /> Analysis by Model
                            </h2>

                            <div className="grid gap-6">
                                {modelKeys.map((modelName, i) => {
                                    const modelResults = groupedResults[modelName];
                                    const mentionsCount = modelResults.filter(r => r.is_mentioned).length;
                                    const totalCount = modelResults.length;
                                    const isMentionedAny = mentionsCount > 0;

                                    return (
                                        <div key={i} className={`p-6 rounded-2xl border transition-all duration-300 ${isMentionedAny ? 'bg-gradient-to-br from-[#1a1a1a] to-black border-brand-yellow/30 shadow-[0_0_20px_rgba(255,215,0,0.05)]' : 'bg-[#111] border-white/5 opacity-80'}`}>
                                            {/* Model Header */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner ${isMentionedAny ? 'bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/20' : 'bg-white/10 text-gray-600'
                                                        }`}>
                                                        {modelName.includes('gpt') ? 'GPT' : modelName.includes('claude') ? 'CL' : modelName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                                            {modelName}
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                                            <span className={isMentionedAny ? 'text-green-400' : 'text-gray-500'}>
                                                                Mention Rate: {Math.round((mentionsCount / totalCount) * 100)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isMentionedAny ? (
                                                    <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg border border-green-500/20">
                                                        <CheckCircle2 size={16} /> <span className="text-sm font-bold">BRAND DETECTED</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-lg border border-red-500/20">
                                                        <AlertTriangle size={16} /> <span className="text-sm font-bold">NOT FOUND</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Scenarios Grid */}
                                            {/* Results List */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {modelResults.map((res, idx) => {
                                                    const type = res.prompt_text.includes('best') ? 'DISCOVERY' : res.prompt_text.includes('leading') ? 'MARKET' : 'PROBLEM';
                                                    const isCompetitor = res.subject && res.subject !== profileData?.company;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => setSelectedResult(res)}
                                                            className={`group relative border p-4 rounded-xl transition-all cursor-pointer h-full flex flex-col hover:shadow-lg ${isCompetitor
                                                                ? 'bg-[#1a1111] border-red-900/30 hover:bg-[#2a1a1a] hover:border-red-500/30'
                                                                : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-brand-yellow/30'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex gap-2">
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${type === 'DISCOVERY' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                                                                        type === 'MARKET' ? 'text-purple-400 border-purple-400/20 bg-purple-400/10' :
                                                                            'text-orange-400 border-orange-400/20 bg-orange-400/10'
                                                                        }`}>
                                                                        {type}
                                                                    </span>
                                                                    {isCompetitor && (
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border text-red-400 border-red-400/20 bg-red-400/10">
                                                                            COMPETITOR
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {res.is_mentioned ? <CheckCircle2 size={16} className={isCompetitor ? "text-red-500" : "text-brand-yellow"} /> : <div className="w-4 h-4 rounded-full border border-gray-600" />}
                                                            </div>

                                                            {isCompetitor && (
                                                                <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Target: {res.subject}</div>
                                                            )}

                                                            <div className="text-sm text-gray-300 line-clamp-3 mb-4 flex-1">
                                                                "{res.response_text}"
                                                            </div>

                                                            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                                                                <span>Rank: <span className="text-white font-mono">{res.rank_position ? `#${res.rank_position}` : '-'}</span></span>
                                                                <span className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isCompetitor ? 'text-red-400' : 'text-brand-yellow'}`}>View Details <ChevronRight size={12} /></span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                ) : (
                    // Empty State / Initial View
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-white">Ready to inspect your brand's presence?</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Our Neural Scan Engine will query your selected AI models with various "intent-based" prompts (e.g. "Best Fintech APIs", "Top Insurance Providers") to see if your brand appears in their recommended set.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-[#111] p-4 rounded-xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><Search size={20} /></div>
                                    <div>
                                        <div className="font-bold text-white">Discovery Prompts</div>
                                        <div className="text-sm text-gray-500">"Who are the top players in..."</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-[#111] p-4 rounded-xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Target size={20} /></div>
                                    <div>
                                        <div className="font-bold text-white">Direct Comparisons</div>
                                        <div className="text-sm text-gray-500">"Compare X vs Y vs YourBrand..."</div>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleInitialize}
                                size="lg"
                                className="w-full md:w-auto mt-4 h-14 text-base font-bold shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                            >
                                <Play className="mr-2 fill-current" /> Initialize Scan
                            </Button>
                        </div>

                        <div className="relative h-[400px] bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl overflow-hidden flex items-center justify-center group">
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20"></div>
                            {/* Animated Pulse Ring */}
                            <div className="absolute w-64 h-64 bg-brand-yellow/5 rounded-full animate-pulse filter blur-xl"></div>
                            <div className="relative z-10 text-center">
                                <div className="w-24 h-24 bg-[#1a1a1a] rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-500 group-hover:border-brand-yellow/50 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                                    <Sparkles size={40} className="text-brand-yellow" />
                                </div>
                                <div className="font-mono text-sm text-gray-500">SYSTEM IDLE</div>
                                <div className="text-white font-bold text-xl mt-2">Awaiting Command</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
