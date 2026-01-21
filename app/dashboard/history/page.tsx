
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Loader2, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

interface TestRun {
    id: string;
    status: 'running' | 'completed' | 'failed';
    created_at: string;
    model_count?: number;
}

export default function HistoryPage() {
    const [loading, setLoading] = useState(true);
    const [runs, setRuns] = useState<TestRun[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Runs
            const { data, error } = await supabase
                .from('test_runs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                // For MVP, we can't easily join count in one query without a view or rpc, 
                // so we'll just display the runs first. 
                // Advanced: could fetch results count separately or use a join if relationship defined in client
                setRuns(data as TestRun[]);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [supabase]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-brand-yellow" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Scan History</h1>
                <p className="text-gray-400">Archive of all your previous model tracking sessions.</p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-500 text-sm bg-white/5">
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Time Ago</th>
                                <th className="p-4 font-medium text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {runs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No scans found. Go to 'Mentions' to run your first test.
                                    </td>
                                </tr>
                            ) : (
                                runs.map((run) => (
                                    <tr key={run.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            {run.status === 'completed' && <div className="flex items-center gap-2 text-green-500"><CheckCircle2 size={16} /> Completed</div>}
                                            {run.status === 'failed' && <div className="flex items-center gap-2 text-red-500"><XCircle size={16} /> Failed</div>}
                                            {run.status === 'running' && <div className="flex items-center gap-2 text-brand-yellow"><Loader2 size={16} className="animate-spin" /> Running</div>}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-600" />
                                                {new Date(run.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-gray-600" />
                                                {timeAgo(run.created_at)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-xs font-mono text-gray-600 uppercase tracking-widest group-hover:text-brand-yellow transition-colors cursor-default">
                                                {run.id.slice(0, 8)}...
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
