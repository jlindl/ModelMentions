"use client";

import Image from "next/image";

// Placeholder list - User will provide SVGs in public/logos/
const BRANDS = [
    { name: "OpenAI", src: "/logos/openai.svg" },
    { name: "Google", src: "/logos/google.svg" },
    { name: "Anthropic", src: "/logos/anthropic.svg" },
    { name: "Meta", src: "/logos/meta.svg" },
    { name: "Mistral", src: "/logos/mistral.svg" },
    { name: "Perplexity", src: "/logos/perplexity.svg" },
    { name: "XAI", src: "/logos/xai.svg" },
    { name: "Cohere", src: "/logos/cohere.svg" },
    { name: "Hugging Face", src: "/logos/huggingface.svg" },
    { name: "Microsoft", src: "/logos/microsoft.svg" },
    { name: "Nvidia", src: "/logos/nvidia.svg" },
];

export function LogoCarousel() {
    return (
        <section className="w-full bg-[#050505] py-12 border-y border-white/5 overflow-hidden">
            {/* Force animation styles locally to ensure they load */}
            <style jsx global>{`
                @keyframes infinite-scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-infinite-scroll {
                    animation: infinite-scroll 60s linear infinite;
                }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-[0.2em] animate-pulse">
                    Tracking visibility across all major LLMs
                </p>
            </div>

            <div className="relative w-full overflow-hidden">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none"></div>

                <div className="flex w-[200%] animate-infinite-scroll">
                    {/* First Loop */}
                    <div className="flex w-1/2 justify-around items-center min-w-max gap-16 px-8">
                        {BRANDS.map((brand, i) => (
                            <div key={i} className="relative h-10 w-28 md:w-32 flex items-center justify-center opacity-50 grayscale">
                                <Image
                                    src={brand.src}
                                    alt={brand.name}
                                    width={120}
                                    height={40}
                                    className="object-contain h-full w-full invert brightness-0"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Second Loop (Duplicate) */}
                    <div className="flex w-1/2 justify-around items-center min-w-max gap-16 px-8">
                        {BRANDS.map((brand, i) => (
                            <div key={`dup-${i}`} className="relative h-10 w-28 md:w-32 flex items-center justify-center opacity-50 grayscale">
                                <Image
                                    src={brand.src}
                                    alt={brand.name}
                                    width={120}
                                    height={40}
                                    className="object-contain h-full w-full invert brightness-0"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
