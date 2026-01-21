import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PricingTable } from "../components/PricingTable";
import { CheckCircle2 } from "lucide-react";

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-brand-black text-white selection:bg-brand-yellow selection:text-brand-black">
            <Header />

            {/* Page Hero */}
            <section className="pt-40 pb-12 relative overflow-hidden">
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                        Simple, Transparent <span className="text-brand-yellow">Pricing</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Choose the plan that fits your brand's scale. Upgrade or downgrade at any time.
                    </p>
                </div>
            </section>

            {/* Pricing Table */}
            <PricingTable />

            {/* FAQ / Trust Section */}
            <section className="py-24 border-t border-white/5 bg-[#080808]">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Trusted by modern marketing teams</h2>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
                            {/* Placeholders for logos if needed, for now just text or generic shapes could serve, but staying text heavy for speed */}
                            <span className="text-xl font-bold tracking-widest text-white">LOGOIPSUM</span>
                            <span className="text-xl font-bold tracking-widest text-white">ACME CORP</span>
                            <span className="text-xl font-bold tracking-widest text-white">TECHFLOW</span>
                            <span className="text-xl font-bold tracking-widest text-white">DATAMINE</span>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-brand-yellow" />
                                Can I cancel anytime?
                            </h3>
                            <p className="text-gray-400 pl-7">Yes, all plans are month-to-month unless you choose an annual contract for a discount.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-brand-yellow" />
                                Do you offer custom integrations?
                            </h3>
                            <p className="text-gray-400 pl-7">Absolutely. Our Enterprise plan includes a dedicated solution engineer to build custom connections.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-brand-yellow" />
                                How accurate is the sentiment analysis?
                            </h3>
                            <p className="text-gray-400 pl-7">We use an ensemble of 3 distinct evaluator models to cross-verify sentiment scoring, achieving 94% human alignment.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-brand-yellow" />
                                What models do you track?
                            </h3>
                            <p className="text-gray-400 pl-7">We track all major foundation models including GPT-4, Claude 3, Gemini, Llama 3, and search engines like Perplexity.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
