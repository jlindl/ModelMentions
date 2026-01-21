'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Button } from '../../components/Button';
import { Calendar, Download, FileText, Loader2, Sparkles, AlertCircle, History, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PremiumGate } from '../../components/PremiumGate';

export default function ReportsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<{ id?: string, content: string, title?: string, date?: string } | null>(null);
    const [range, setRange] = useState('7'); // '7', '30', '90'
    const [savedReports, setSavedReports] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [userPlan, setUserPlan] = useState<string>('free');

    // Fetch history on load
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoadingHistory(true);

        // 1. Get User Plan
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
            if (profile) setUserPlan(profile.plan || 'free');
        }

        const { data } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setSavedReports(data);
        setLoadingHistory(false);
    };

    const generateReport = async () => {
        setLoading(true);
        setReport(null);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(range));

        try {
            const res = await fetch('/api/generate-report', {
                method: 'POST',
                body: JSON.stringify({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                })
            });

            if (!res.ok) throw new Error('Failed to generate report');

            const data = await res.json();
            setReport({
                content: data.report,
                title: data.savedReport?.title || 'New Analysis',
                date: new Date().toLocaleDateString()
            });

            // Refresh history
            fetchHistory();

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadReport = (saved: any) => {
        setReport({
            id: saved.id,
            content: saved.content,
            title: saved.title,
            date: new Date(saved.created_at).toLocaleDateString()
        });
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const downloadPDF = async () => {
        const input = document.getElementById('report-content');
        if (!input) return;

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`ModelMentions_Report_${report?.title?.replace(/ /g, '_') || 'Analysis'}.pdf`);
        } catch (err) {
            console.error('PDF Download failed', err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <FileText className="text-brand-yellow" /> Intelligence Reports
                    </h1>
                    <p className="text-gray-400">Generate AI-powered analysis of your brand's standing in the model ecosystem.</p>
                </div>

                <div className="flex items-center gap-3 bg-[#111] p-1.5 rounded-lg border border-white/10">
                    {['7', '30', '90'].map((d) => (
                        <button
                            key={d}
                            onClick={() => setRange(d)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${range === d
                                ? 'bg-brand-yellow text-black shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Last {d} Days
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {userPlan === 'free' ? (
                        <PremiumGate
                            title="Unlock Strategic Reports"
                            description="Generating comprehensive PDF analysis of your brand's AI performance is exclusively available to PRO members."
                            features={[
                                "AI-Powered Strategic Analysis (GPT-5)",
                                "Exportable PDF Reports",
                                "Deep Sentiment Breakdown",
                                "Actionable Recommendations"
                            ]}
                        />
                    ) : report ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-[#111] p-4 rounded-xl border border-white/10 sticky top-4 z-10 shadow-xl">
                                <div className="flex items-center gap-2 text-white">
                                    <FileText size={18} className="text-brand-yellow" />
                                    <span className="font-medium truncate max-w-[200px] md:max-w-none">{report.title}</span>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setReport(null)}>
                                        Close
                                    </Button>
                                    <Button onClick={downloadPDF} className="flex items-center gap-2">
                                        <Download size={18} /> <span className="hidden md:inline">Download PDF</span>
                                    </Button>
                                </div>
                            </div>

                            <div id="report-content" className="bg-white text-black p-12 rounded-xl shadow-2xl min-h-[800px]">
                                {/* Header for PDF */}
                                <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end">
                                    <div>
                                        <h1 className="text-4xl font-bold tracking-tight mb-2">Brand Visibility Report</h1>
                                        <p className="text-gray-600 font-mono text-sm uppercase tracking-widest">Generated by ModelMentions Intelligence</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{report.date}</div>
                                        <div className="text-xs text-gray-500">Privileged & Confidential</div>
                                    </div>
                                </div>

                                {/* Markdown Content */}
                                <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-gray-700 prose-li:text-gray-700">
                                    <ReactMarkdown>{report.content}</ReactMarkdown>
                                </div>

                                {/* Footer for PDF */}
                                <div className="mt-20 pt-8 border-t border-gray-200 text-center text-gray-400 text-xs">
                                    <p>© 2026 ModelMentions Inc. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <div className="w-20 h-20 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-yellow/20">
                                <Sparkles size={40} className="text-brand-yellow" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Ready to Analyze</h2>
                            <p className="text-gray-400 max-w-md mx-auto mb-8">
                                Our AI Analyst (GPT-5.2) will review all your recent test runs, mentioned stats, and sentiment scores to produce a strategic PDF report.
                            </p>
                            <Button
                                size="lg"
                                onClick={generateReport}
                                disabled={loading}
                                className="shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:shadow-[0_0_50px_rgba(255,215,0,0.4)] transition-all"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin mr-2" /> Generating Analysis...</>
                                ) : (
                                    <><Sparkles className="mr-2" /> Generate Report</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Sidebar History */}
                <div className="lg:col-span-1">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 sticky top-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <History size={14} /> Past Reports
                        </h3>

                        {loadingHistory ? (
                            <div className="text-center py-8 text-gray-500">
                                <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                                Loading...
                            </div>
                        ) : savedReports.length === 0 ? (
                            <div className="text-center py-8 text-gray-600 text-sm">
                                No reports generated yet.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                                {savedReports.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => loadReport(item)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all group ${report?.id === item.id
                                            ? 'bg-brand-yellow/10 border-brand-yellow/50 text-white'
                                            : 'bg-[#111] border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/20 hover:text-white'
                                            }`}
                                    >
                                        <div className="font-medium text-sm mb-1 truncate">{item.title}</div>
                                        <div className="text-xs text-gray-500 flex justify-between items-center">
                                            {new Date(item.created_at).toLocaleDateString()}
                                            <ChevronRight size={12} className={`transition-transform ${report?.id === item.id ? 'translate-x-1 text-brand-yellow' : 'opacity-0 group-hover:opacity-100'}`} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
