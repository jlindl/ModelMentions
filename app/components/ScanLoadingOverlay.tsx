"use client";

import { useEffect, useState } from "react";
import { Loader2, Zap, Radio, Search, ShieldCheck, Database, Server } from "lucide-react";

interface ScanLoadingOverlayProps {
    status?: string;
    progress?: number;
}

export function ScanLoadingOverlay({ status, progress }: ScanLoadingOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        { text: "Initializing Neural Handshake...", icon: Zap },
        { text: "Authenticating with Model Providers...", icon: ShieldCheck },
        { text: "Allocating GPU Clusters...", icon: Server },
        { text: "Dispatching Search Agents...", icon: Search },
        { text: "Ingesting Real-time Data Streams...", icon: Database },
        { text: "Cross-referencing Sentiment Vectors...", icon: Radio },
        { text: "Synthesizing Final Report...", icon: Zap },
    ];

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 2000);

        return () => {
            clearInterval(stepInterval);
        };
    }, []);

    const CurrentIcon = steps[currentStep].icon;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in text-white cursor-wait">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">
                {/* Radar / Scanner Visual */}
                <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                    {/* Pulsing Rings */}
                    <div className="absolute inset-0 rounded-full border border-brand-yellow/20 animate-ping opacity-20 duration-[3000ms]"></div>
                    <div className="absolute inset-4 rounded-full border border-brand-yellow/40 animate-ping opacity-20 delay-300 duration-[3000ms]"></div>
                    <div className="absolute inset-12 rounded-full border border-brand-yellow/60 animate-pulse opacity-30"></div>

                    {/* Rotating Scanner Line */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/5 overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 bg-gradient-to-br from-brand-yellow/50 to-transparent origin-top-left animate-[spin_4s_linear_infinite] opacity-50 blur-md"></div>
                    </div>

                    {/* Central Core */}
                    <div className="relative bg-[#0a0a0a] w-32 h-32 rounded-full border border-brand-yellow flex items-center justify-center shadow-[0_0_50px_rgba(255,215,0,0.3)]">
                        <Loader2 className="text-brand-yellow w-12 h-12 animate-spin" />
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden relative">
                    <div
                        className="absolute top-0 left-0 h-full bg-brand-yellow shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all duration-200 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Status Text */}
                <div className="text-center space-y-2 h-20">
                    <div className="inline-flex items-center gap-2 text-brand-yellow font-mono text-sm uppercase tracking-widest bg-brand-yellow/10 px-3 py-1 rounded-full border border-brand-yellow/20 animate-pulse">
                        <CurrentIcon size={14} />
                        scan_active // executing
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                        {status || steps[currentStep].text}
                    </h2>
                </div>

                {/* Log Stream Mockup */}
                <div className="mt-8 w-full max-w-lg font-mono text-xs text-gray-500 space-y-1 opacity-50">
                    <div className="flex justify-between">
                        <span>CPU_USAGE: {70 + Math.floor(Math.random() * 20)}%</span>
                        <span>MEM_ALLOC: {40 + Math.floor(Math.random() * 30)}%</span>
                    </div>
                    <div className="border-t border-white/10 pt-1">
                        &gt; {steps[currentStep].text}
                    </div>
                    <div>
                        &gt; Optimizing query parameters...
                    </div>
                </div>
            </div>
        </div>
    );
}
