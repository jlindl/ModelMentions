"use client";

import Image from "next/image";
import { Cpu, Network, Search, ArrowRight } from "lucide-react";

export function IntelligenceGrid() {
    const categories = [
        {
            title: "Frontier Models",
            description: "Deep probing of the world's most capable closed-source models including GPT-4, Claude 3, and Gemini 1.5 Pro.",
            icon: <Cpu className="text-brand-yellow" size={24} />,
            image: "/frontier-ai.png",
            models: ["OpenAI GPT-4o", "Anthropic Claude 3.5", "Google Gemini 1.5"]
        },
        {
            title: "Open Source Ecosystem",
            description: " Comprehensive tracking of the decentralized intelligence layer, covering Llama 3, Mistral, and Mixtral variants.",
            icon: <Network className="text-blue-400" size={24} />,
            image: "/open-source.png",
            models: ["Meta Llama 3", "Mistral Large", "Falcon 180B"]
        },
        {
            title: "Search & RAG Systems",
            description: "Monitor visibility in AI-powered search engines that combine retrieval with generation for factual grounding.",
            icon: <Search className="text-purple-400" size={24} />,
            image: "/search-rag.png",
            models: ["Perplexity", "Google SGE", "Bing Chat"]
        }
    ];

    return (
        <section className="py-24 bg-[#050505] relative border-t border-white/5">
            <div className="container mx-auto px-6">

                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Complete <span className="text-brand-yellow">Intelligence Grid</span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        We don't just scrape the surface. Our probing engine navigates the complex topography of the modern AI landscape to find where your brand lives.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {categories.map((item, index) => (
                        <div key={index} className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-brand-yellow/30 transition-all duration-500 hover:-translate-y-2">

                            {/* Image Container */}
                            <div className="relative h-48 w-full overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-8 relative z-20">
                                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-6 backdrop-blur-sm group-hover:bg-brand-yellow/10 group-hover:border-brand-yellow/20 transition-colors">
                                    {item.icon}
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-yellow transition-colors">{item.title}</h3>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    {item.description}
                                </p>

                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    {item.models.map((model, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow/50" />
                                            {model}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 flex items-center gap-2 text-brand-yellow text-sm font-medium opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    View Coverage <ArrowRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
