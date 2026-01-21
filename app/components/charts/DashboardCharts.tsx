"use client";

import { useMemo } from "react";

// --- Simple Line Chart ---
interface LineChartProps {
    data: { label: string; value: number }[];
    color?: string;
    height?: number;
}

export function TrendLineChart({ data, color = "#FFD700", height = 200 }: LineChartProps) {
    const points = useMemo(() => {
        if (!data.length) return "";
        const max = Math.max(...data.map(d => d.value));
        const min = Math.min(...data.map(d => d.value));
        const range = max - min || 1;

        return data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            // Normalize y (invert because SVG y=0 is top)
            // scale 0-100
            const y = 100 - ((d.value - min) / range) * 80 - 10; // keep some padding
            return `${x},${y}`;
        }).join(" ");
    }, [data]);

    return (
        <div className="w-full relative" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <path d={`M0,100 ${points.replace(/,/g, ' ')} 100,100`} fill="url(#line-gradient)" />

                {/* The Line */}
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    points={points}
                    className="drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]"
                />

                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    // Only show dots on hover or specific points could be better, for now showing all for debug visual
                    return null;
                })}
            </svg>

            {/* Tooltip-like overlay could go here */}
        </div>
    );
}


// --- Bar Chart for Model Comparison ---
interface BarChartProps {
    data: { label: string; value: number; subValue?: string }[];
}

export function ModelComparisonChart({ data }: BarChartProps) {
    const maxVal = Math.max(...data.map(d => d.value)) || 1;

    return (
        <div className="space-y-4">
            {data.map((item, i) => (
                <div key={i} className="group">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span className="font-bold text-white group-hover:text-brand-yellow transition-colors">{item.label}</span>
                        <span>{item.subValue || `${Math.round(item.value)}%`}</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden relative">
                        <div
                            className="h-full bg-gradient-to-r from-brand-yellow/50 to-brand-yellow rounded-full transition-all duration-1000 ease-out group-hover:shadow-[0_0_10px_rgba(255,215,0,0.3)]"
                            style={{ width: `${(item.value / maxVal) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Radial Progress ---
export function RadialScore({ score, label, size = 120 }: { score: number, label: string, size?: number }) {
    const r = 40;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r={r} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                <circle
                    cx="50%" cy="50%" r={r}
                    stroke="currentColor" strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`text-brand-yellow transition-all duration-1000 ${score > 50 ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]' : ''}`}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{score}</span>
                <span className="text-[10px] uppercase text-gray-500">{label}</span>
            </div>
        </div>
    );
}
