"use client";

import { Check, X, Loader2 } from "lucide-react";
import { Button } from "./Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase/client";

export function PricingTable() {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleCheckout = async (planName: string, priceId: string) => {
        setLoading(planName);
        try {
            // Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login?redirect=/pricing');
                return;
            }
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, planName }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Checkout failed: ' + (data.error || 'Unknown error'));
                setLoading(null);
            }
        } catch (err) {
            console.error(err);
            alert('Checkout error. Please try again.');
            setLoading(null);
        }
    };

    const plans = [
        {
            name: "Scale",
            price: "$19",
            period: "/month",
            description: "Essential visibility for emerging brands.",
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_placeholder_pro',
            id: 'pro',
            features: [
                "10 Credits Monthly",
                "Up to 15 AI Models",
                "10 Intelligent Reports / mo",
                "10 Deep Website Audits / mo",
                "Priority Processing",
                "Basic Sentiment Analysis",
                "Email Support"
            ],
            notIncluded: [
                "Competitor Benchmarking",
                "Real-time Alerts",
                "API Access"
            ],
            cta: "Get Started",
            variant: "outline"
        },
        {
            name: "Growth",
            price: "$49",
            period: "/month",
            description: "Comprehensive intelligence for scaling teams.",
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || 'price_placeholder_premium',
            id: 'premium',
            features: [
                "30 Credits Monthly",
                "Up to 50 AI Models",
                "30 Intelligent Reports / mo",
                "30 Deep Website Audits / mo",
                "All Model Providers",
                "Advanced Sentiment & Hallucination Detection",
                "Competitor Benchmarking",
                "Dedicated Support"
            ],
            notIncluded: [
                "Custom Model Fine-tuning",
                "On-premise Deployment"
            ],
            cta: "Start Free Trial",
            variant: "primary",
            popular: true
        },
        {
            name: "Power",
            price: "$99",
            period: "/month",
            description: "Full-spectrum dominance for global organizations.",
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ULTRA || 'price_placeholder_ultra',
            id: 'ultra',
            features: [
                "100 Credits Monthly",
                "Up to 100 AI Models",
                "200 Intelligent Reports / mo",
                "200 Deep Website Audits / mo",
                "24/7 Priority Support",
                "Custom API Integration",
                "White-label Dashboards",
                "Strategy Workshops",
            ],
            notIncluded: [],
            cta: "Contact Sales",
            variant: "outline"
        }
    ];

    return (
        <section className="py-24 bg-[#050505] relative">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2
                                ${plan.popular
                                    ? 'bg-[#0a0a0a] border-brand-yellow/50 shadow-[0_0_50px_rgba(255,215,0,0.1)]'
                                    : 'bg-[#0a0a0a] border-white/10 hover:border-white/20'
                                }
                            `}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-yellow text-brand-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-brand-yellow' : 'text-white'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    <span className="text-gray-500">{plan.period}</span>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-brand-yellow/10 text-brand-yellow' : 'bg-white/5 text-gray-400'}`}>
                                            <Check size={12} />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                                {plan.notIncluded.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-gray-600">
                                            <X size={12} />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={plan.variant as any}
                                className={`w-full justify-center ${plan.popular ? 'bg-brand-yellow hover:bg-brand-yellow-hover text-brand-black' : ''}`}
                                onClick={() => handleCheckout(plan.id, plan.priceId)}
                                disabled={loading !== null}
                            >
                                {loading === plan.id ? <><Loader2 className="animate-spin mr-2" /> Processing...</> : plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
