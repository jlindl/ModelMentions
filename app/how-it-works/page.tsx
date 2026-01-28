import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ProcessWorkflow } from "../components/ProcessWorkflow";
import { ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
    return (
        <main className="min-h-screen bg-brand-black text-white selection:bg-brand-yellow selection:text-brand-black">
            <Header />

            {/* Page Hero */}
            <section className="pt-40 pb-20 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-brand-yellow/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-6 text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                        Anatomy of <span className="text-brand-yellow">AI Tracking</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
                        We&apos;ve built the world&apos;s first active telemetry network for the generative web. See how we turn black-box model outputs into actionable data.
                    </p>

                    <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-medium transition-all backdrop-blur-sm border border-white/5 flex items-center gap-2 mx-auto">
                        Read the Technical Whitepaper <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* Main Process Workflow */}
            <ProcessWorkflow />

            {/* Simplified Footer / CTA */}
            <section className="py-24 bg-[#080808] border-t border-white/5">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to calibrate your brand?</h2>
                    <p className="text-gray-400 mb-10 max-w-xl mx-auto">
                        Join the leading enterprises who are already managing their reputation in the age of AI.
                    </p>
                    <button className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover px-8 py-4 rounded-full font-bold text-lg transition-colors">
                        Start Your Audit
                    </button>
                </div>
            </section>

            <Footer />
        </main>
    );
}
