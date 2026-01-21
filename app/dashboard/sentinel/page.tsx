'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Button } from '../../components/Button';
import { Shield, Bell, Zap, Clock, Trash2, Plus, AlertTriangle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PremiumGate } from '../../components/PremiumGate';

export default function SentinelPage() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [monitors, setMonitors] = useState<any[]>([]);
    const [userPlan, setUserPlan] = useState<string>('free');
    const [newMonitorQuery, setNewMonitorQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Log History Modal State
    const [selectedMonitorLogs, setSelectedMonitorLogs] = useState<any[] | null>(null);
    const [viewingLogsFor, setViewingLogsFor] = useState<string | null>(null);

    const handleViewLogs = async (monitorId: string, query: string) => {
        setViewingLogsFor(query);
        const { data } = await supabase
            .from('monitor_logs')
            .select('*')
            .eq('monitor_id', monitorId)
            .order('created_at', { ascending: false });
        setSelectedMonitorLogs(data || []);
    };

    const closeLogs = () => {
        setSelectedMonitorLogs(null);
        setViewingLogsFor(null);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Plan
        const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
        const plan = profile?.plan || 'free';
        setUserPlan(plan);

        // Get Monitors
        if (plan !== 'free') {
            const { data } = await supabase.from('monitors').select('*').order('created_at', { ascending: false });
            if (data) setMonitors(data);
        }
        setLoading(false);
    };

    const handleCreateMonitor = async () => {
        if (!newMonitorQuery.trim()) return;
        setIsCreating(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error } = await supabase.from('monitors').insert({
                user_id: user.id,
                query: newMonitorQuery,
                frequency: 'daily',
                alert_threshold: 50
            });

            if (!error) {
                setNewMonitorQuery('');
                fetchData(); // Refresh
            }
        }
        setIsCreating(false);
    };

    const handleDelete = async (id: string) => {
        await supabase.from('monitors').delete().eq('id', id);
        setMonitors(monitors.filter(m => m.id !== id));
    };

    if (loading) return <div className="p-8 text-white">Loading Sentinel...</div>;

    // PREMIUM GATE
    if (userPlan === 'free') {
        return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in-up pb-20">
                <div className="flex items-center gap-3 mb-8 text-gray-400">
                    <Shield className="text-gray-500" /> Sentinel Protection
                </div>

                <PremiumGate
                    title="Activate Sentinel Mode"
                    description="Automated brand protection is a premium feature. Sentinel monitors LLMs 24/7 and alerts you instantly when your visibility drops."
                    features={[
                        "Daily Automated Scans (GPT-4 & Claude)",
                        "Instant Visibility Drop Alerts",
                        "Competitor Watchlists & Tracking",
                        "Historical Event Logs"
                    ]}
                />
            </div>
        );
    }

    // ACTIVE VIEW
    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in-up pb-20">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-2">
                        <Shield className="text-brand-yellow fill-brand-yellow/20" /> Sentinel Monitors
                    </h1>
                    <p className="text-gray-400">Automated protection for your brand entities.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-[#111] px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 text-sm text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> System Active
                    </div>
                </div>
            </div>

            {/* Create New Monitor */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 mb-8">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Plus size={18} /> Add New Brand Monitor</h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="e.g. 'Best CRM software' or 'MyBrand pricing'"
                        value={newMonitorQuery}
                        onChange={(e) => setNewMonitorQuery(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow transition-colors"
                    />
                    <Button onClick={handleCreateMonitor} disabled={isCreating || !newMonitorQuery}>
                        {isCreating ? 'Adding...' : 'Start Watching'}
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Sentinel will check this query daily across GPT-4 and Claude 3.</p>
            </div>

            {/* Active Monitors List */}
            <div className="space-y-4">
                {monitors.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                        <Shield size={40} className="text-gray-600 mx-auto mb-4" />
                        <h3 className="text-gray-400 font-bold">No Active Monitors</h3>
                        <p className="text-gray-600 text-sm mt-1">Add a query above to start protecting your brand.</p>
                    </div>
                ) : (
                    monitors.map((monitor) => (
                        <div key={monitor.id} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-brand-yellow/30 transition-all">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-white">{monitor.query}</h3>
                                    <span className="bg-brand-yellow/10 text-brand-yellow text-[10px] uppercase font-bold px-2 py-0.5 rounded">Daily</span>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Clock size={14} /> Last check: {monitor.last_run ? new Date(monitor.last_run).toLocaleDateString() : 'Pending'}</span>
                                    <span className="flex items-center gap-1"><AlertTriangle size={14} /> Alert if visibility &lt; {monitor.alert_threshold}%</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right hidden md:block">
                                    <div className="text-xs text-gray-500 uppercase tracking-widest">Status</div>
                                    <div className="text-green-400 font-bold text-sm">Protector Active</div>
                                </div>
                                <Button variant="secondary" size="sm" onClick={() => handleViewLogs(monitor.id, monitor.query)}>
                                    View Logs
                                </Button>
                                <Button variant="secondary" onClick={() => handleDelete(monitor.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20">
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>


            {/* Log History Modal */}
            {
                selectedMonitorLogs && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Sentinel Logs</h3>
                                    <p className="text-sm text-gray-500">History for "{viewingLogsFor}"</p>
                                </div>
                                <button onClick={closeLogs} className="text-gray-400 hover:text-white"><div className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">✕</div></button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                {selectedMonitorLogs.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">No logs recorded yet.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedMonitorLogs.map((log) => (
                                            <div key={log.id} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-start gap-4">
                                                <div className={`w-2 h-2 mt-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-sm font-bold ${log.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                                            {log.status === 'success' ? 'Secure' : 'Alert Triggered'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-gray-300 text-sm mb-2">{log.message}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-brand-yellow transition-all duration-500" style={{ width: `${log.visibility_score}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-mono text-brand-yellow">{log.visibility_score}% Vis</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
