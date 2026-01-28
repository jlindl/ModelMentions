import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Features } from "../components/Features";
import { IntelligenceGrid } from "../components/IntelligenceGrid";
import { ProductShowcase } from "../components/ProductShowcase";

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-brand-black text-white selection:bg-brand-yellow selection:text-brand-black">
            <Header />

            {/* Page Hero */}
            <section className="pt-40 pb-20 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-yellow/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-6 text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                        Complete <span className="text-brand-yellow">AI Website Optimization</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Explore the most advanced <strong>SEO services</strong> telemetry system for the Generative Web.
                        Track your brand's <strong>marketing</strong> performance across every major model and search engine.
                    </p>
                </div>
            </section>

            {/* Main Features Components */}
            <Features />

            {/* Deep Dive Grid */}
            <IntelligenceGrid />

            {/* Product Showcase / CTA */}
            <ProductShowcase />

            <Footer />
        </main>
    );
}
