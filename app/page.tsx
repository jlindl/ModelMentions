import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { LogoCarousel } from "./components/LogoCarousel";
import { Features } from "./components/Features";
import { IntelligenceGrid } from "./components/IntelligenceGrid";
import { ProductShowcase } from "./components/ProductShowcase";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-black text-white selection:bg-brand-yellow selection:text-brand-black">
      <Header />
      <Hero />
      <LogoCarousel />
      <Features />
      <IntelligenceGrid />
      <ProductShowcase />
      <Footer />
    </main>
  );
}
