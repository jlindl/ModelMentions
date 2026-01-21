"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { TrendLineChart, ModelComparisonChart, RadialScore } from "../../components/charts/DashboardCharts"; // Ensure these exist
import { ArrowUp, ArrowDown, Activity, Eye, TrendingUp, Calendar, Zap, Target, BarChart2, PieChart, Sparkles } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'; // Assuming recharts is installed

export default function OverviewPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();

            // 1. Get User Profile for Company Name
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('company_name')
                .eq('id', user.id)
                .single();

            const myBrand = profile?.company_name || 'My Company';

            // 2. Fetch Test Results
            const { data: results } = await supabase
                .from('test_results')
                .select('*')
                .order('created_at', { ascending: true });

            if (!results || results.length === 0) {
                setLoading(false);
                return;
            }

            // --- Aggregations ---

            // Split Results
            const myResults = results.filter(r => !r.subject || r.subject === myBrand);
            const competitorResults = results.filter(r => r.subject && r.subject !== myBrand);

            // A. My Visibility
            const myTotal = myResults.length;
            const myMentioned = myResults.filter(r => r.is_mentioned).length;
            const visibilityScore = myTotal > 0 ? Math.round((myMentioned / myTotal) * 100) : 0;

            // B. Competitor Avg Visibility
            const compTotal = competitorResults.length;
            const compMentioned = competitorResults.filter(r => r.is_mentioned).length;
            const compVisibilityScore = compTotal > 0 ? Math.round((compMentioned / compTotal) * 100) : 0;

            // C. Share of Voice (Mentions Count Comparison)
            // Group by subject (My Brand vs Specific Competitors)
            const subjectCounts: Record<string, number> = { [myBrand]: myMentioned };

            competitorResults.forEach(r => {
                if (r.is_mentioned && r.subject) {
                    subjectCounts[r.subject] = (subjectCounts[r.subject] || 0) + 1;
                }
            });

            // Format for Chart
            const shareOfVoiceData = Object.keys(subjectCounts).map(subject => ({
                name: subject,
                value: subjectCounts[subject]
            })).filter(d => d.value > 0);


            // D. Sentiment (My Brand)
            const avgSentiment = myResults.reduce((acc, r) => acc + (r.sentiment_score || 0), 0) / (myTotal || 1);
            const sentimentPercent = Math.round(((avgSentiment + 1) / 2) * 100);

            // E. Model Performance (My Brand)
            const modelGroups: Record<string, { total: number, mentions: number }> = {};
            myResults.forEach(r => {
                let name = r.model_name.split('/').pop() || r.model_name;
                name = name.replace(/-/g, ' ').toUpperCase();

                if (!modelGroups[name]) modelGroups[name] = { total: 0, mentions: 0 };
                modelGroups[name].total++;
                if (r.is_mentioned) modelGroups[name].mentions++;
            });

            const modelData = Object.keys(modelGroups).map(name => ({
                label: name,
                value: (modelGroups[name].mentions / modelGroups[name].total) * 100,
                subValue: `${modelGroups[name].mentions}/${modelGroups[name].total}`
            })).sort((a, b) => b.value - a.value);

            // F. Trend Data (My Brand)
            const dateGroups: Record<string, { count: number, mentions: number }> = {};
            myResults.forEach(r => {
                const date = new Date(r.created_at).toLocaleDateString();
                if (!dateGroups[date]) dateGroups[date] = { count: 0, mentions: 0 };
                dateGroups[date].count++;
                if (r.is_mentioned) dateGroups[date].mentions++;
            });

            const trendData = Object.keys(dateGroups).map(date => ({
                label: date,
                value: (dateGroups[date].mentions / dateGroups[date].count) * 100
            }));
            if (trendData.length === 1) trendData.unshift({ label: 'Start', value: 0 });

            setStats({
                totalScans: results.length,
                visibilityScore,
                sentimentPercent,
                modelData: modelData.slice(0, 5),
                trendData,
                latestScanDate: new Date(results[results.length - 1].created_at).toLocaleDateString(),
                compVisibilityScore,
                shareOfVoiceData,
                brandName: myBrand
            });

            setLoading(false);
        };

        fetchData();
    }, []);

    // ... (Loading and Empty states remain similar but updated)

    if (loading) return <div className="p-8 text-white flex items-center gap-2" suppressHydrationWarning><div className="animate-spin w-5 h-5 border-2 border-brand-yellow border-t-transparent rounded-full" /> Calculating Analytics...</div>;
    if (!stats) return <div className="p-12 text-center text-gray-500">No data available. Run a scan.</div>;

    const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Platform Overview</h1>
                    <p className="text-gray-400">Strategic intelligence for <span className="text-white font-bold">{stats.brandName}</span></p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-[#111] px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Total Scans</div>
                        <div className="text-xl font-bold text-white">{stats.totalScans}</div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Visibility */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Eye size={60} /></div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">My Visibility</div>
                    <div className="text-4xl font-bold text-white mb-1">{stats.visibilityScore}%</div>
                    <div className="text-xs text-blue-400 flex items-center gap-1">
                        Across {stats.modelData.length} Models
                    </div>
                </div>

                {/* 2. Competitor Benchmark */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Target size={60} /></div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Vs. Competitors</div>
                    <div className="text-4xl font-bold text-white mb-1">{stats.compVisibilityScore > 0 ? `${stats.compVisibilityScore}%` : 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                        {stats.compVisibilityScore > 0
                            ? stats.visibilityScore > stats.compVisibilityScore
                                ? <span className="text-green-400 flex items-center gap-1"><ArrowUp size={12} /> Leading by {stats.visibilityScore - stats.compVisibilityScore}%</span>
                                : <span className="text-red-400 flex items-center gap-1"><ArrowDown size={12} /> Trailing by {stats.compVisibilityScore - stats.visibilityScore}%</span>
                            : 'No competitor data'
                        }
                    </div>
                </div>

                {/* 3. Sentiment */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={60} /></div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Brand Sentiment</div>
                    <div className="text-4xl font-bold text-white mb-1">{stats.sentimentPercent}%</div>
                    <div className="text-xs text-gray-500">Positive/Neutral Ratio</div>
                </div>

                {/* 4. Active Trend */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={60} /></div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">30-Day Trend</div>
                    <div className="h-12 w-full mt-2 opacity-50">
                        <TrendLineChart data={stats.trendData} height={50} />
                    </div>
                </div>
            </div>

            {/* Split Section: Share of Voice & Model Breakdown */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Share of Voice */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <PieChart size={20} className="text-purple-400" /> Share of Voice
                    </h3>
                    <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
                        {stats.shareOfVoiceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPie>
                                    <Pie
                                        data={stats.shareOfVoiceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.shareOfVoiceData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === stats.brandName ? '#FFD700' : COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-500 text-sm">Not enough data for comparison. Run precise "Direct Comparison" scans vs competitors.</div>
                        )}
                        {/* Legend Overlay */}
                        {stats.shareOfVoiceData.length > 0 && (
                            <div className="absolute bottom-0 right-0 bg-black/50 p-2 rounded text-xs text-gray-300">
                                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-brand-yellow"></span> {stats.brandName}</div>
                                {stats.shareOfVoiceData.filter((d: any) => d.name !== stats.brandName).slice(0, 3).map((d: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span> {d.name}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Model Performance */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Zap size={20} className="text-brand-yellow" /> Model Performance
                    </h3>
                    <ModelComparisonChart data={stats.modelData} />
                </div>
            </div>

            {/* AI Strategic Insights */}
            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Sparkles size={20} className="text-brand-yellow" /> Artificial Intelligence Strategy
                    </h3>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-brand-yellow/30 transition-colors">
                            <div className="text-brand-yellow font-bold text-sm mb-2 uppercase tracking-wide">Optimization</div>
                            <p className="text-sm text-gray-300">
                                {stats.visibilityScore < 50
                                    ? "Your visibility is low. Models are struggling to recall your brand entities. Recommended: Increase structured data on your homepage and clean up schema markup."
                                    : "High visibility detected. To maintain this, ensure your unique value propositions are clearly stated in your metadata to prevent drift in model descriptions."}
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-brand-yellow/30 transition-colors">
                            <div className="text-blue-400 font-bold text-sm mb-2 uppercase tracking-wide">Competitive Edge</div>
                            <p className="text-sm text-gray-300">
                                {stats.compVisibilityScore > stats.visibilityScore
                                    ? "Competitors are outranking you in generative results. Analyse their 'About Us' pages and Wikipedia presence (if any). They likely have stronger entity grounding."
                                    : "You are leading the conversation. Use this authority to branch into adjacent topics (e.g. 'Best [Industry] Tools') to widen your net."}
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-brand-yellow/30 transition-colors">
                            <div className="text-green-400 font-bold text-sm mb-2 uppercase tracking-wide">Content Focus</div>
                            <p className="text-sm text-gray-300">
                                {stats.sentimentPercent < 80
                                    ? "Sentiment is neutral. LLMs view you as a 'player' but not a 'leader'. Publish more case studies and authoritative whitepapers to improve qualitative associations."
                                    : "Excellent sentiment resonance. Your brand is associated with positive descriptors. Double down on this messaging in your verified profiles."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
