"use client";

import { useState, useEffect } from 'react';
import { X, Copy, Terminal, MessageSquare, CheckCircle2, AlertTriangle, Calendar, BrainCircuit, Activity, ChevronRight } from 'lucide-react';
import { Button } from '../../components/Button';
import ReactMarkdown from 'react-markdown';

export interface ResultDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    brandName?: string;
    results: any[]; // List of all results for this model
    initialResultId?: string;
}

export function ResultDetailsModal({ isOpen, onClose, results, initialResultId, brandName }: ResultDetailsProps) {
    const [selectedId, setSelectedId] = useState<string | undefined>(initialResultId);

    useEffect(() => {
        if (isOpen && initialResultId) {
            setSelectedId(initialResultId);
        }
    }, [isOpen, initialResultId]);

    if (!isOpen || !results || results.length === 0) return null;

    const selectedResult = results.find(r => r.id === selectedId) || results[0];

    // Helper to extract clean user prompt
    const getCleanPrompt = (raw: string) => {
        // Fallback for previous format if sticking around, 
        // but mostly we expect raw queries now.
        if (raw.includes("USER QUERY:")) {
            return raw.split("USER QUERY:")[1].trim().replace(/^['"]|['"]$/g, '');
        }
        return raw;
    };

    const cleanPromptText = getCleanPrompt(selectedResult.prompt_text);
    const sentimentPercent = Math.round((selectedResult.sentiment_score || 0) * 100);
    const sentimentLabel = sentimentPercent > 20 ? 'Positive' : sentimentPercent < -20 ? 'Negative' : 'Neutral';

    // Helper to highlight text in markdown
    // Custom renderer for ReactMarkdown to highlight text
    const components = {
        p: ({ node, children, ...props }: any) => {
            // This simple highlighting is tricky with ReactMarkdown children structure.
            // For now, simpler to just wrap the whole renderer or rely on simple text rendering if highlighting is critical.
            // BUT user asked for "Improve styling of LLM output", which implies Markdown is more important than highlighted text logic which was just a simple split.
            return <p className="mb-4 text-gray-300 leading-relaxed" {...props}>{children}</p>;
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white font-sans">
            <div className="bg-[#090909] border border-white/10 rounded-2xl w-full max-w-6xl h-[85vh] flex shadow-2xl relative overflow-hidden">

                {/* Sidebar - Navigation */}
                <div className="w-64 bg-[#111] border-r border-white/5 flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Test Scenarios</h3>
                        <p className="text-xs text-gray-500 mt-1">{results.length} Variations</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {results.map((res, idx) => {
                            const isSelected = res.id === selectedResult.id;
                            const promptSnippet = getCleanPrompt(res.prompt_text).substring(0, 40) + "...";
                            return (
                                <button
                                    key={res.id}
                                    onClick={() => setSelectedId(res.id)}
                                    className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-center gap-2 ${isSelected
                                            ? 'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 font-bold'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                        }`}
                                >
                                    {res.is_mentioned ? <CheckCircle2 size={12} className="text-green-500 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-gray-600 shrink-0" />}
                                    <span className="truncate">{promptSnippet}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-full bg-[#090909]">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#111]">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <BrainCircuit className="text-gray-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">
                                    {selectedResult.model_name}
                                </h2>
                                <span className="text-xs text-gray-500 font-medium">Analysis Report</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1.5 rounded-md border flex items-center gap-2 ${selectedResult.is_mentioned
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {selectedResult.is_mentioned ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                <span className="font-bold text-xs uppercase tracking-wide">{selectedResult.is_mentioned ? 'Mentioned' : 'Not Found'}</span>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Report Content Split */}
                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                        {/* LEFT: Prompt & Stats */}
                        <div className="w-full md:w-1/3 border-r border-white/5 bg-[#0c0c0c] flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Copy size={12} /> User Query
                                    </h3>
                                    <div className="bg-[#151515] p-4 rounded-xl border border-white/5 shadow-inner">
                                        <p className="text-gray-300 text-sm italic leading-relaxed">"{cleanPromptText}"</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Activity size={12} /> Metrics
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-[#151515] p-3 rounded-lg border border-white/5">
                                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Rank</span>
                                            <span className={`text-lg font-mono font-bold ${selectedResult.rank_position ? 'text-white' : 'text-gray-600'}`}>
                                                {selectedResult.rank_position ? `#${selectedResult.rank_position}` : '-'}
                                            </span>
                                        </div>
                                        <div className="bg-[#151515] p-3 rounded-lg border border-white/5">
                                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Sentiment</span>
                                            <span className={`text-lg font-bold ${sentimentLabel === 'Positive' ? 'text-green-400' : sentimentLabel === 'Negative' ? 'text-red-400' : 'text-gray-400'}`}>
                                                {sentimentPercent}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-xs text-gray-600">
                                        Scan ID: <span className="font-mono text-gray-500">{selectedResult.id.slice(0, 8)}</span>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Date: {new Date(selectedResult.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Output */}
                        <div className="w-full md:w-2/3 bg-[#090909] flex flex-col">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#090909]">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare size={14} /> Model Response
                                </h3>
                                {/* Copy Button Logic can be added here */}
                            </div>

                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown components={components}>
                                        {selectedResult.response_text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
