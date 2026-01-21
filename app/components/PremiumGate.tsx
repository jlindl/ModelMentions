'use client';

import { Lock, Check } from 'lucide-react';
import { Button } from './Button';
import { useRouter } from 'next/navigation';

interface PremiumGateProps {
    title: string;
    description: string;
    features: string[];
    buttonText?: string;
}

export function PremiumGate({
    title,
    description,
    features,
    buttonText = "Upgrade to Unlock"
}: PremiumGateProps) {
    const router = useRouter();

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden group">
            {/* Background Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-yellow/10 transition-colors duration-700"></div>

            <div className="w-24 h-24 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-yellow/20 relative z-10 animate-fade-in">
                <Lock size={40} className="text-brand-yellow" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-4 relative z-10">{title}</h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8 relative z-10 text-lg">
                {description}
            </p>

            <ul className="text-left text-gray-300 space-y-3 mb-10 relative z-10 border border-white/10 p-6 rounded-xl bg-[#111]/50 backdrop-blur-sm">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                        <Check size={16} className="text-brand-yellow shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                size="lg"
                onClick={() => router.push('/pricing')}
                className="relative z-10 bg-brand-yellow text-black hover:bg-yellow-400 font-bold px-10 py-4 text-lg shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all"
            >
                {buttonText}
            </Button>
        </div>
    );
}
