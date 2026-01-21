import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#020202] text-white pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
                    Our <span className="text-brand-yellow">Mission</span>
                </h1>
                <div className="prose prose-invert prose-lg">
                    <p>
                        ModelMentions was founded to give brands visibility into the "Black Box" of AI.
                        As Large Language Models become the new search engines, it is critical for companies to understand how they are perceived by these neural networks.
                    </p>
                    <p>
                        Our platform provides the first comprehensive analytics suite for the AI ecosystem, empowering you to track, analyze, and optimize your brand's presence across GPT-4, Claude, Gemini, and more.
                    </p>
                </div>
            </div>
        </div>
    );
}
