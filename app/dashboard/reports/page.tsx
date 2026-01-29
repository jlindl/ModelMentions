"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Button } from '../../components/Button';
import { Calendar, Download, FileText, Loader2, Sparkles, AlertCircle, History, ChevronRight, Share2, Printer } from 'lucide-react';
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

    // Check if printing / exporting
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

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
                title: data.savedReport?.title || 'Brand Strategy Analysis',
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
        if (!reportRef.current) return;

        setIsExporting(true);

        // Wait a tick for state to update styles if needed
        await new Promise(r => setTimeout(r, 100));

        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff' // Force white background for PDF
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // If report is long, we might need multiple pages, but simple image dump is standard for MVP
            // Advanced paging logic would be needed for multi-page text
            if (pdfHeight > pdf.internal.pageSize.getHeight()) {
                // Simple multi-page support relies on splitting image, complex.
                // For now, let's scale to fit or add pages?
                // Standard approach: just add image to first page (it will shrink or crop).
                // Better approach: split logic.

                // For MVP reliability: Just save single long page as custom size if needed, OR force fit.
                // Let's assume content isn't massive logic yet.
                // Actually, let's set PDF height to match content
                const customPdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [pdfWidth, pdfHeight] // Custom format
                });
                customPdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                customPdf.save(`ModelMentions_Report_${report?.title?.replace(/ /g, '_') || 'Analysis'}.pdf`);
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`ModelMentions_Report_${report?.title?.replace(/ /g, '_') || 'Analysis'}.pdf`);
            }

        } catch (err) {
            console.error('PDF Download failed', err);
            alert('Failed to generate PDF. Please try using "Print to PDF" instead.');
        } finally {
            setIsExporting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in-up pb-20">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 print:block">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6 print:w-full">

                    {userPlan === 'free' ? (
                        <div className="print:hidden">
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
                        </div>
                    ) : report ? (
                        <div className="space-y-6">

                            {/* Toolbar */}
                            <div className="flex justify-between items-center bg-[#111] p-4 rounded-xl border border-white/10 sticky top-4 z-20 shadow-xl print:hidden animate-fade-in">
                                <div className="flex items-center gap-2 text-white">
                                    <FileText size={18} className="text-brand-yellow" />
                                    <span className="font-medium truncate max-w-[200px] md:max-w-none">{report.title}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => setReport(null)} size="sm">
                                        Close
                                    </Button>
                                    <Button variant="secondary" onClick={handlePrint} size="sm">
                                        <Printer size={16} className="mr-2" /> Print
                                    </Button>
                                    <Button onClick={downloadPDF} disabled={isExporting} size="sm">
                                        {isExporting ? <Loader2 className="animate-spin" /> : <Download size={16} className="mr-2" />}
                                        Save PDF
                                    </Button>
                                </div>
                            </div>

                            {/* Report Container (The part that gets exported) */}
                            {/* We use specific print styles here */}
                            <div
                                ref={reportRef}
                                id="report-content"
                                className="bg-white text-black p-12 md:p-16 rounded-xl shadow-2xl min-h-[800px] relative overflow-hidden font-sans"
                            >
                                {/* Decorative elements for PDF/Print look */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gray-100 rounded-bl-full opacity-50 pointer-events-none"></div>

                                <div className="relative z-10 border-b-2 border-black pb-8 mb-10 flex justify-between items-end">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4 text-brand-yellow">
                                            {/* Logo placeholder or simple circle */}
                                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                                                <div className="w-3 h-3 bg-white rounded-sm transform rotate-45"></div>
                                            </div>
                                        </div>
                                        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-black">Strategic Brand Analysis</h1>
                                        <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em]">ModelMentions Intelligence Report</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-black">{report.date}</div>
                                        <div className="text-xs text-gray-500 font-medium">CONFIDENTIAL</div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="prose prose-lg max-w-none 
                                    prose-headings:font-bold prose-headings:text-black 
                                    prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
                                    prose-p:text-gray-700 prose-p:leading-relaxed
                                    prose-li:text-gray-700 prose-li:marker:text-black
                                    prose-strong:text-black prose-strong:font-extrabold
                                    prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic
                                ">
                                    <ReactMarkdown>{report.content}</ReactMarkdown>
                                </div>

                                {/* Footer */}
                                <div className="mt-24 pt-8 border-t border-gray-200 flex justify-between items-center text-gray-400 text-xs">
                                    <p>© 2026 ModelMentions Inc.</p>
                                    <p>AI-Generated Analysis • Verified by ModelMentions Engine</p>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] print:hidden">
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
                <div className="lg:col-span-1 print:hidden">
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
