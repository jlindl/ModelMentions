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
    id: string;
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
                    setUserPlan(profile.plan || 'free');
                    setProfileData({
                        company: profile.company_name || 'Not Configured',
                        keywords: profile.keywords || []
                    });

                    // Load selected models from Settings
                    const selectedIds = profile.selected_models || [];
                    if (selectedIds.length > 0) {
                        const { data: models } = await supabase
                            .from('available_models')
                            .select('*')
                            .in('id', selectedIds);

                        if (models) setSelectedModelsData(models);
                    }
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

    // New Scan Options
    const [basePrompt, setBasePrompt] = useState('');
    const [variationCount, setVariationCount] = useState(3);

    // Step 1: User clicks Initialize
    const handleInitialize = () => {
        if (selectedModelsData.length === 0) {
            // If they click initialize with nothing, maybe prompt? 
            // The button is disabled anyway by default, but I'll add logic to be safe
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

    const handleReset = async () => {
        setRunning(false);
        setStatus("Stopped");
        addLog('🛑 Scan Force Stopped by user.');

        // Find and cancel active run in DB
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('test_runs')
                .update({ status: 'cancelled' })
                .eq('user_id', user.id)
                .eq('status', 'running');
        }
    };

    // Reusable Scan Loop
    const executeScanLoop = async (runId: string, initialRemaining: number, totalCount: number) => {
        let remaining = initialRemaining;
        let retryCount = 0;
        const MAX_RETRIES = 5;

        while (remaining > 0) {
            const percent = totalCount > 0 ? Math.round(((totalCount - remaining) / totalCount) * 100) : 0;
            setProgress(percent);
            setStatus(`Scanning... ${percent}%`);

            try {
                // Fetch/Process Batch
                const processRes = await fetch('/api/run-test/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ runId, batchSize: 5 })
                });

                if (!processRes.ok) {
                    if (processRes.status === 401) {
                        addLog('❌ Session Expired. Please log in again.');
                        setStatus("Session Expired");
                        setRunning(false);
                        // Optional: Redirect to login after short delay
                        setTimeout(() => router.push('/auth'), 2000);
                        return;
                    }

                    retryCount++;
                    const errorText = await processRes.text();
                    console.error(`Batch processing failed (${processRes.status}): ${errorText}`);
                    addLog(`Batch Error (${processRes.status}): Retrying (${retryCount}/${MAX_RETRIES})...`);

                    if (retryCount > MAX_RETRIES) {
                        addLog('❌ Too many failures. Aborting scan.');
                        setStatus("Scan Failed");
                        setRunning(false);
                        return; // Exit function
                    }

                    await new Promise(r => setTimeout(r, 2000)); // wait 2s
                    continue;
                }

                // Reset retries on success
                retryCount = 0;

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

            } catch (networkErr) {
                console.error("Network error in batch loop", networkErr);
                addLog(`Network Error: Retrying...`);
                await new Promise(r => setTimeout(r, 3000));
                // Network errors also count towards retries to prevent infinite offline loops
                retryCount++;
                if (retryCount > MAX_RETRIES) {
                    addLog('❌ Network unstable. Aborting scan.');
                    setStatus("Network Error");
                    setRunning(false);
                    return;
                }
            }
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
                    includeCompetitors: includeCompetitors,
                    basePrompt: basePrompt || undefined,
                    variationCount: variationCount
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
            {/* Modal */}
            <ResultDetailsModal
                isOpen={!!selectedResult}
                onClose={() => setSelectedResult(null)}

                results={selectedResult ? groupedResults[selectedResult.model_name] || [] : []}
                initialResultId={selectedResult?.id}
                brandName={profileData?.company}
            />

            <UpgradeModal
                isOpen={showUpgrade}
                onClose={() => setShowUpgrade(false)}
                currentUsage={upgradeMessage}
            />

            {running && <ScanLoadingOverlay progress={progress} status={status} logs={logs} />}

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
                                    <span className="text-white font-bold">{variationCount} Prompts / Model</span>
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
                                This scan will consume approximately <span className="text-white font-bold">{selectedModelsData.length * variationCount * 0.05 * (includeCompetitors ? 2 : 1)} credits</span> based on current rates.
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

            {/* Header Area - Glassmorphism & Sticky */}
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/60 border-b border-white/10 -mx-6 -mt-6 px-6 py-6 mb-8 transition-all duration-300 shadow-2xl shadow-black/50">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>

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
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-brand-yellow animate-pulse text-sm font-mono">
                                    <Loader2 size={16} className="animate-spin" />
                                    PROCESSING SCENARIOS...
                                </div>
                                <Button
                                    onClick={handleReset}
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 text-xs bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40 hover:text-red-300"
                                >
                                    Force Stop
                                </Button>
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
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-brand-yellow/30 transition-all hover:shadow-[0_0_30px_rgba(255,215,0,0.1)]">
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

                        {/* Post-Scan Actions Bar */}
                        <div className="bg-white/5 backdrop-blur-md border border-brand-yellow/20 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-[0_0_30px_rgba(255,215,0,0.05)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-brand-yellow/5 animate-pulse opacity-20 pointer-events-none"></div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-yellow/10 rounded-lg text-brand-yellow">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Scan Complete</h3>
                                    <p className="text-xs text-gray-500">Analysis finished for {modelKeys.length} models.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setResults([]);
                                        setLogs([]);
                                        setShowConfirm(false);
                                        // Keeping settings
                                    }}
                                    className="flex-1 md:flex-none"
                                >
                                    <Search size={16} className="mr-2" /> New Configuration
                                </Button>
                                <Button
                                    onClick={confirmAndRun}
                                    className="flex-1 md:flex-none bg-brand-yellow text-black hover:bg-yellow-400 font-bold"
                                >
                                    <Play size={16} className="mr-2 fill-current" /> Run Again
                                </Button>
                            </div>
                        </div>

                        {/* Detailed Results with Enhanced Styling */}
                        <div className="space-y-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Search className="text-brand-yellow" /> Analysis by Model
                            </h2>

                            <div className="grid gap-8">
                                {modelKeys.map((modelName, i) => {
                                    const modelResults = groupedResults[modelName];
                                    const mentionsCount = modelResults.filter(r => r.is_mentioned).length;
                                    const totalCount = modelResults.length;
                                    const isMentionedAny = mentionsCount > 0;

                                    return (
                                        <div key={i} className={`p-6 rounded-2xl border transition-all duration-500 overflow-hidden relative ${isMentionedAny ? 'bg-gradient-to-br from-[#1a1a1a]/80 to-black/90 border-brand-yellow/30 shadow-[0_0_50px_rgba(255,215,0,0.05)]' : 'bg-white/5 border-white/5 backdrop-blur-sm'}`}>
                                            {isMentionedAny && <div className="absolute inset-0 bg-brand-yellow/5 pointer-events-none" />}
                                            {/* Model Header */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner ${isMentionedAny ? 'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20' : 'bg-white/5 text-gray-600 border border-white/5'
                                                        }`}>
                                                        {modelName.includes('gpt') ? 'GPT' : modelName.includes('claude') ? 'CL' : modelName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-xl flex items-center gap-2">
                                                            {modelName}
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                                            <span className={`px-2 py-0.5 rounded ${isMentionedAny ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-500'}`}>
                                                                Visibility: {Math.round((mentionsCount / totalCount) * 100)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isMentionedAny ? (
                                                    <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-5 py-3 rounded-xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                                        <CheckCircle2 size={20} /> <span className="text-sm font-bold tracking-wide">BRAND DETECTED</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-5 py-3 rounded-xl border border-red-500/20">
                                                        <AlertTriangle size={20} /> <span className="text-sm font-bold tracking-wide">NOT FOUND</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Results List - Enhanced Card Design */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {modelResults.map((res, idx) => {
                                                    const type = res.prompt_text.includes('best') ? 'DISCOVERY' : res.prompt_text.includes('leading') ? 'MARKET' : 'PROBLEM';
                                                    const isCompetitor = res.subject && res.subject !== profileData?.company;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => setSelectedResult(res)}
                                                            className={`group relative border p-5 rounded-xl transition-all cursor-pointer h-full flex flex-col hover:-translate-y-1 hover:shadow-2xl duration-300 ${isCompetitor
                                                                ? 'bg-red-950/10 border-red-900/30 hover:bg-red-900/20 hover:border-red-500/30 backdrop-blur-md'
                                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-brand-yellow/30 backdrop-blur-md'
                                                                }`}
                                                        >
                                                            {/* Semantic Tag & Status */}
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border shadow-sm ${type === 'DISCOVERY' ? 'text-blue-300 border-blue-500/30 bg-blue-500/10' :
                                                                        type === 'MARKET' ? 'text-purple-300 border-purple-500/30 bg-purple-500/10' :
                                                                            'text-orange-300 border-orange-500/30 bg-orange-500/10'
                                                                        }`}>
                                                                        {type}
                                                                    </span>
                                                                    {isCompetitor && (
                                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border text-red-300 border-red-500/30 bg-red-500/10">
                                                                            VS {res.subject}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-lg ${res.is_mentioned
                                                                    ? (isCompetitor ? 'bg-red-500 text-white border-red-400' : 'bg-brand-yellow text-black border-yellow-300')
                                                                    : 'bg-transparent border-gray-700 text-gray-600'}`}>
                                                                    {res.is_mentioned ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                                                </div>
                                                            </div>

                                                            {/* Snippet Content */}
                                                            <div className="mb-4 flex-1">
                                                                <div className="text-[11px] text-gray-500 font-mono mb-2 uppercase tracking-tight">AI Response Snippet</div>
                                                                <div className="text-sm text-gray-300 leading-relaxed max-h-24 overflow-hidden relative">
                                                                    "{res.response_text}"
                                                                    <div className={`absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t ${isCompetitor ? 'from-[#1a1111]' : 'from-black/40'} to-transparent`} />
                                                                </div>
                                                            </div>

                                                            {/* Footer Stats */}
                                                            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                                                <div className="flex gap-3 text-xs">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-gray-600 text-[10px] uppercase">Rank</span>
                                                                        <span className={`font-mono font-bold ${res.rank_position ? 'text-white' : 'text-gray-600'}`}>{res.rank_position ? `#${res.rank_position}` : 'N/A'}</span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-gray-600 text-[10px] uppercase">Sentiment</span>
                                                                        <span className={`font-bold ${res.sentiment_score > 0 ? 'text-green-400' : res.sentiment_score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                                                            {Math.round(res.sentiment_score * 100)}%
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-opacity ${isCompetitor ? 'text-red-400/70 hover:text-red-400' : 'text-brand-yellow/70 hover:text-brand-yellow'}`}>
                                                                    Inspect <ChevronRight size={10} />
                                                                </span>
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
                            <div className="space-y-6 bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 bg-brand-yellow/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-brand-yellow/10 transition-all duration-700"></div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Base Search Intent (Optional)</label>
                                    <textarea
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-yellow/50 transition-colors resize-none h-24"
                                        placeholder="E.g. 'What are the best AI tools for marketing?' (Leave empty for auto-generated broad scans)"
                                        value={basePrompt}
                                        onChange={(e) => setBasePrompt(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        We will generate variations of this prompt to test different user phrasings.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Scan Depth</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-1">
                                            {[1, 3, 5, 10].map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => setVariationCount(n)}
                                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${variationCount === n ? 'bg-brand-yellow text-black' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500">variations per model</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-sm">
                                        <div className="text-gray-400">Estimated Cost</div>
                                        <div className="text-white font-bold text-lg">
                                            ${(selectedModelsData.length * variationCount * (includeCompetitors ? 2 : 1) * 0.05).toFixed(2)}
                                        </div>
                                    </div>
                                    {/* Warnings could go here */}
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
