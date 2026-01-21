"use client";

import Image from "next/image";
import { Settings, Send, BrainCircuit, LineChart } from "lucide-react";

export function ProcessWorkflow() {
    const steps = [
        {
            id: 1,
            title: "Ingestion & Calibration",
            subtitle: "Defining your Brand DNA",
            description: "The process begins with a comprehensive audit of your brand assets. We ingest your core messaging, value propositions, and key facts to establish a 'Ground Truth' dataset against which all AI outputs will be measured.",
            icon: <Settings className="text-brand-yellow" size={32} />,
            image: "/process-calibration.png",
            stats: ["Multi-format ingestion", "Fact extraction", "Tone matching"]
        },
        {
            id: 2,
            title: "Multi-Model Dispatch",
            subtitle: "Global Telemetry Probes",
            description: "Our engine simultaneously dispatches thousands of organic, context-aware prompts to the top 20 foundation models. We simulate diverse user personas asking questions about your industry to capture authentic model behavior.",
            icon: <Send className="text-blue-400" size={32} />,
            image: "/process-dispatch.png",
            stats: ["20+ Models probed", "10k+ Daily prompts", "Persona simulation"]
        },
        {
            id: 3,
            title: "Semantic Analysis",
            subtitle: "Decoding the Black Box",
            description: "Raw model outputs are fed into our proprietary evaluation layer. Using a specialized ensemble of analyzer models, we decode sentiment, accuracy, hallucination rate, and comparative positioning vs. competitors.",
            icon: <BrainCircuit className="text-purple-400" size={32} />,
            image: "/process-analysis.png",
            stats: ["Sentiment scoring", "Hallucination detection", "Competitor mapping"]
        },
        {
            id: 4,
            title: "Strategic Intelligence",
            subtitle: "Actionable Insights",
            description: "Data transforms into strategy. View real-time dashboards that show your 'Share of Voice' in the AI economy. Download executive reports and get specific optimization checklists to improve your standing.",
            icon: <LineChart className="text-green-400" size={32} />,
            image: "/process-intelligence.png",
            stats: ["Real-time dashboards", "PDF Reports", "Optimization checklists"]
        }
    ];

    return (
        <section className="py-24 bg-[#050505] relative border-t border-white/5 overflow-hidden">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2" />

            <div className="container mx-auto px-6 relative z-10">

                <div className="text-center max-w-3xl mx-auto mb-32">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        The <span className="text-brand-yellow">Telemetry Loop</span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Our proprietary 4-stage engine turns the chaos of generative AI into a structured, measurable marketing channel.
                    </p>
                </div>

                <div className="space-y-32">
                    {steps.map((step, index) => (
                        <div key={index} className={`flex flex-col md:flex-row gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>

                            {/* Image Side */}
                            <div className="flex-1 w-full relative group">
                                <div className={`absolute -inset-1 bg-gradient-to-r ${index % 2 === 0 ? 'from-brand-yellow/20 to-purple-600/20' : 'from-blue-500/20 to-green-500/20'} rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000`}></div>
                                <div className="relative aspect-[4/3] bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                                    <Image
                                        src={step.image}
                                        alt={step.title}
                                        fill
                                        className="object-cover transform transition-transform duration-700 group-hover:scale-105"
                                    />

                                    {/* Overlay Stats */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                                        <div className="flex gap-4 overflow-x-auto pb-1">
                                            {step.stats.map((stat, i) => (
                                                <span key={i} className="text-xs font-mono text-brand-yellow/80 border border-brand-yellow/20 rounded-full px-3 py-1 bg-brand-yellow/5 whitespace-nowrap">
                                                    {stat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="flex-1 space-y-8 relative">
                                {/* Step Indicator */}
                                <div className={`hidden md:flex absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#050505] border border-white/20 items-center justify-center text-xl font-bold text-white z-10 ${index % 2 === 0 ? '-right-[88px]' : '-left-[88px]'}`}>
                                    {step.id}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-brand-yellow/30 transition-colors">
                                            {step.icon}
                                        </div>
                                        <div className="h-px flex-1 bg-white/10" />
                                    </div>

                                    <div>
                                        <h3 className="text-brand-yellow font-mono text-sm mb-2">{step.subtitle}</h3>
                                        <h2 className="text-3xl md:text-4xl font-bold text-white">{step.title}</h2>
                                    </div>

                                    <p className="text-gray-400 leading-relaxed text-lg">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
