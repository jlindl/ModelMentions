'use client';

import { Shield, Lock, Zap, Bell, Clock } from 'lucide-react';
import { Button } from '../../components/Button';
import { useRouter } from 'next/navigation';

export default function SentinelPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center animate-fade-in">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-brand-yellow/20 blur-3xl rounded-full" />
                <div className="relative bg-[#0a0a0a] border border-brand-yellow/30 p-6 rounded-3xl shadow-2xl">
                    <Shield size={64} className="text-brand-yellow" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-brand-yellow text-black text-[10px] font-bold px-2 py-1 rounded-md shadow-lg border border-brand-black/20">
                    BETA
                </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                Sentinel Mode: <span className="text-brand-yellow">Coming Soon</span>
            </h1>

            <p className="text-gray-400 max-w-md mx-auto mb-12 text-lg leading-relaxed">
                We are currently fine-tuning our automated brand protection engine. Sentinel will provide 24/7 autonomous monitoring of AI models.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mb-12">
                {[
                    { icon: Zap, title: "Autonomous Scanning", desc: "Daily background checks across 100+ models." },
                    { icon: Bell, title: "Instant Alerts", desc: "Get notified the second your sentiment drops." },
                    { icon: Clock, title: "Historical Drift", desc: "Track how AI perception changes over time." }
                ].map((feature, i) => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex flex-col items-center">
                        <feature.icon className="text-brand-yellow/60 mb-3" size={24} />
                        <h3 className="text-white font-bold mb-1 text-sm">{feature.title}</h3>
                        <p className="text-gray-500 text-xs">{feature.desc}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-4">
                <Button onClick={() => router.push('/dashboard')}>
                    Return to Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.open('https://www.modelmentions.co.uk', '_blank')}>
                    View Roadmap
                </Button>
            </div>

            <div className="mt-16 flex items-center gap-2 text-gray-600 text-sm">
                <Lock size={14} /> Only available for Premium & Ultra licenses upon release
            </div>
        </div>
    );
}
