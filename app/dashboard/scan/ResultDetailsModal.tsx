"use client";

import { X, Copy, Terminal, MessageSquare, CheckCircle2, AlertTriangle, Calendar, BrainCircuit, Activity } from 'lucide-react';
import { Button } from '../../components/Button';

export interface ResultDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    brandName?: string;
    result: {
        model_name: string;
        prompt_text: string;
        response_text: string;
        is_mentioned?: boolean;
        sentiment_score?: number;
        rank_position?: number | null;
        created_at?: string;
    } | null;
}

export function ResultDetailsModal({ isOpen, onClose, result, brandName }: ResultDetailsProps) {
    if (!isOpen || !result) return null;

    const sentimentColor = (result.sentiment_score || 0) > 0.5 ? 'text-green-400' : (result.sentiment_score || 0) < 0 ? 'text-red-400' : 'text-yellow-400';

    // Helper to highlight text
    const renderHighlightedText = (text: string, highlight?: string) => {
        if (!highlight) return text;

        // Escape special regex chars
        const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${safeHighlight})`, 'gi'));

        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ? (
                <span key={i} className="bg-brand-yellow/30 text-brand-yellow font-bold px-0.5 rounded border border-brand-yellow/20">
                    {part}
                </span>
            ) : part
        );
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in text-white font-sans">
            <div className="bg-[#050505] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 border-b border-white/5 bg-[#0a0a0a]/50 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center flex-shrink-0">
                            <BrainCircuit className="text-brand-yellow" size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-brand-yellow uppercase tracking-widest bg-brand-yellow/10 px-2 py-0.5 rounded border border-brand-yellow/20">
                                    Analysis Report
                                </span>
                                {result.created_at && (
                                    <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                        <Calendar size={10} /> {new Date(result.created_at).toLocaleString()}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                {result.model_name}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        {/* Mention Badge */}
                        <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${result.is_mentioned
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            {result.is_mentioned ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                            <span className="font-bold text-sm uppercase">{result.is_mentioned ? 'Mentioned' : 'Not Found'}</span>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area - Split View */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative z-10">

                    {/* LEFT: Prompt Context (Input) */}
                    <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 bg-[#080808] flex flex-col">
                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={14} className="text-blue-400" /> Input Context
                            </h3>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="prose prose-invert prose-sm">
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-mono text-xs">
                                    {result.prompt_text}
                                </p>
                            </div>
                        </div>
                        {/* Metadata Footer for Prompt */}
                        <div className="p-4 border-t border-white/5 bg-white/[0.02] text-xs text-gray-500 space-y-1">
                            <div className="flex justify-between">
                                <span>Token Usage:</span>
                                <span className="font-mono text-gray-400">~145 Input</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Temperature:</span>
                                <span className="font-mono text-gray-400">0.7</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Response Analysis (Output) */}
                    <div className="w-full md:w-2/3 bg-[#050505] flex flex-col relative">
                        {/* Terminal Header */}
                        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Terminal size={14} className="text-purple-400" /> Model Output
                            </h3>
                            <div className="flex items-center gap-4">
                                {result.rank_position && (
                                    <div className="text-xs font-bold text-brand-yellow bg-brand-yellow/10 px-2 py-0.5 rounded border border-brand-yellow/20">
                                        Rank #{result.rank_position}
                                    </div>
                                )}
                                <div className={`text-xs font-bold flex items-center gap-1 ${sentimentColor}`}>
                                    <Activity size={12} /> Sentiment: {Math.round((result.sentiment_score || 0) * 100)}%
                                </div>
                            </div>
                        </div>

                        {/* Terminal Body */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative group">
                            <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="secondary" size="sm" className="h-8 text-xs gap-1">
                                    <Copy size={12} /> Copy
                                </Button>
                            </div>

                            <div className="font-mono text-sm leading-7 text-gray-300 whitespace-pre-wrap">
                                {/* Highlighted response text */}
                                {renderHighlightedText(result.response_text, brandName)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 md:p-6 border-t border-white/5 bg-[#0a0a0a] flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        Generated via {result.model_name.includes('/') ? result.model_name.split('/')[0] : 'API'} Network
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2">
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
