"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Zap, ShieldCheck, Database, Server, Terminal, Lock, Activity } from "lucide-react";

interface ScanLoadingOverlayProps {
    status?: string;
    progress?: number;
    logs?: string[];
}

export function ScanLoadingOverlay({ status, progress = 0, logs = [] }: ScanLoadingOverlayProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [elapsed, setElapsed] = useState(0);

    // Auto-scroll logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setElapsed(p => p + 0.1), 100);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        return seconds.toFixed(1) + "s";
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl animate-fade-in text-white cursor-wait overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-brand-yellow/5 via-transparent to-brand-yellow/5 pointer-events-none"></div>

            {/* Ambient Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-yellow/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            <div className="relative z-10 w-full max-w-4xl px-6 grid md:grid-cols-2 gap-12 items-center">

                {/* Visual Side */}
                <div className="flex flex-col items-center">
                    {/* Radar / Scanner Visual */}
                    <div className="relative w-80 h-80 mb-8 flex items-center justify-center">
                        {/* Spinning Rings */}
                        <div className="absolute inset-0 border border-brand-yellow/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                        <div className="absolute inset-4 border border-brand-yellow/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                        <div className="absolute inset-0 border-t-2 border-brand-yellow/50 rounded-full animate-[spin_2s_linear_infinite]"></div>

                        {/* Scanning Plane */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-brand-yellow/50 blur-[2px] animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_20px_rgba(255,215,0,0.5)]"></div>
                        </div>

                        {/* Central HUD */}
                        <div className="bg-black/80 backdrop-blur-md w-40 h-40 rounded-full border border-brand-yellow/30 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,215,0,0.15)] relative">
                            <div className="text-4xl font-bold font-mono text-white tracking-tighter">
                                {Math.round(progress)}<span className="text-brand-yellow text-lg">%</span>
                            </div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Completion</div>

                            <div className="absolute bottom-4 flex gap-1">
                                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping delay-100"></div>
                                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping delay-200"></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-black">
                            {status || "Initializing..."}
                        </h2>
                        <div className="flex items-center gap-4 justify-center text-xs text-gray-500 font-mono">
                            <span className="flex items-center gap-1 text-green-400"><ShieldCheck size={12} /> SECURE_CONN</span>
                            <span className="flex items-center gap-1 text-brand-yellow"><Activity size={12} /> NET_ACTIVE</span>
                            <span className="flex items-center gap-1"><Zap size={12} /> {formatTime(elapsed)}</span>
                        </div>
                    </div>
                </div>

                {/* Terminal Side */}
                <div className="w-full">
                    <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
                        {/* Terminal Header */}
                        <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-gray-400" />
                                <span className="text-xs font-mono text-gray-400">Scan_Diagnostic_Stream.log</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                            </div>
                        </div>

                        {/* Logs Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 custom-scrollbar"
                        >
                            <div className="text-gray-600 italic mb-2"># Establishing connection to model mesh...</div>
                            {logs.map((log, i) => (
                                <div key={i} className="text-gray-300 border-l-2 border-white/10 pl-2 hover:border-brand-yellow/50 transition-colors animate-fade-in-right">
                                    <span className="text-brand-yellow/50 mr-2 opacity-50">[{formatTime(elapsed)}]</span>
                                    {log.replace(/\[.*?\] /, '')} {/* Remove timestamp from log string if present, since we add custom timer */}
                                </div>
                            ))}
                            <div className="animate-pulse text-brand-yellow">_</div>
                        </div>

                        {/* Terminal Footer */}
                        <div className="bg-white/5 px-4 py-2 border-t border-white/5 flex justify-between text-[10px] text-gray-500 font-mono">
                            <span>MEM: 402MB</span>
                            <span>THREADS: 8 Active</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
