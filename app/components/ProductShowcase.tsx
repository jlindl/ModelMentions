"use client";

import Image from "next/image";
import { Check } from "lucide-react";

export function ProductShowcase() {
    return (
        <section className="py-24 bg-[#050505] relative border-t border-white/5">
            <div className="container mx-auto px-6">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Your Command Center for the <span className="text-brand-yellow">AI Web</span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Stop flying blind. Get granular visibility into how specific models perceive your brand, products, and services in real-time.
                    </p>
                </div>

                {/* Showcase 1: Live Feed */}
                <div className="relative mb-32">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-yellow/20 to-purple-600/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                                <Image
                                    src="/dashboard_live_feed_v3_1769001584125.png"
                                    alt="Live Feed Dashboard"
                                    width={800}
                                    height={450}
                                    className="w-full h-auto transform transition-transform duration-700 group-hover:scale-[1.02]"
                                />
                            </div>
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <h3 className="text-3xl font-bold text-white">Real-Time Mention Streams</h3>
                            <p className="text-gray-400 leading-relaxed">
                                See mentions as they happen. Our system continuously probes major LLMs to capture every instance of your brand being discussed, recommended, or critiqued.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow"><Check size={14} /></div>
                                    Detect hallucinations instantly
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow"><Check size={14} /></div>
                                    Filter by model (GPT-4, Claude 3, etc.)
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow"><Check size={14} /></div>
                                    One-click drill down analysis
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Showcase 2: Analytics */}
                <div className="relative">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h3 className="text-3xl font-bold text-white">Deep Strategic Analytics</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Move beyond vanity metrics. Understand your "Share of Voice" in the generative economy and track sentiment trends over time.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow"><Check size={14} /></div>
                                    Competitor win/loss analysis
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow"><Check size={14} /></div>
                                    Sentiment velocity tracking
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow"><Check size={14} /></div>
                                    Exportable executive reports
                                </li>
                            </ul>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-l from-brand-yellow/20 to-blue-600/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                                <Image
                                    src="/dashboard_analytics_view_1769001226320.png"
                                    alt="Analytics Dashboard"
                                    width={800}
                                    height={450}
                                    className="w-full h-auto transform transition-transform duration-700 group-hover:scale-[1.02]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
