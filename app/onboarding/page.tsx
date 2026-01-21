'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';
import { Button } from '../components/Button';
import { ArrowRight, CheckCircle2, Building, Globe, Search, Users } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Form State
    const [industry, setIndustry] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [keywords, setKeywords] = useState('');
    const [competitors, setCompetitors] = useState('');

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            setUserId(user.id);
        };
        checkUser();
    }, [router, supabase]); // Safe to ignore lint for createClient usually, but removing it from dep array if static is better, keeping for now.

    const handleNext = () => {
        setStep(step + 1);
    };

    const handleComplete = async () => {
        if (!userId) return;
        setLoading(true);

        const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const competitorArray = competitors.split(',').map(c => c.trim()).filter(c => c.length > 0);

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                industry,
                website_url: websiteUrl,
                keywords: keywordArray,
                competitors: competitorArray,
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            console.error('Error saving onboarding data:', error);
            alert('Failed to save data. Please try again.');
        } else {
            router.push('/dashboard');
        }
        setLoading(false);
    };

    const steps = [
        { id: 1, title: 'Business Profile', icon: Building },
        { id: 2, title: 'Tracking Priorities', icon: Search },
        { id: 3, title: 'Competitive Landscape', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-4 relative text-white">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-yellow/5 via-brand-black to-brand-black pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10">
                {/* Progress Steps */}
                <div className="mb-12 flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/10 -z-10" />
                    {steps.map((s) => (
                        <div key={s.id} className={`flex flex-col items-center gap-2 ${step >= s.id ? 'text-brand-yellow' : 'text-gray-600'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-brand-black ${step >= s.id ? 'border-brand-yellow text-brand-yellow shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'border-white/10 text-gray-600'
                                }`}>
                                <s.icon size={18} />
                            </div>
                            <span className="text-xs font-medium uppercase tracking-wider">{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* Content Card */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl min-h-[400px] flex flex-col">

                    {step === 1 && (
                        <div className="flex-1 space-y-6 animate-fade-in-up">
                            <h2 className="text-2xl font-bold">Tell us about your business</h2>
                            <p className="text-gray-400">This helps us tailor the AI tracking to your specific market.</p>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Industry / Niche</label>
                                <input
                                    type="text"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 rounded-lg py-4 px-4 text-white focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 focus:outline-none transition-all"
                                    placeholder="e.g. Fintech, Healthcare, SaaS..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                    <input
                                        type="url"
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 focus:outline-none transition-all"
                                        placeholder="https://yourcompany.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex-1 space-y-6 animate-fade-in-up">
                            <h2 className="text-2xl font-bold">What keywords matter to you?</h2>
                            <p className="text-gray-400">We'll track how frequently these terms trigger mentions of your brand.</p>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Keywords (comma separated)</label>
                                <textarea
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="w-full h-32 bg-[#111] border border-white/10 rounded-lg p-4 text-white focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 focus:outline-none transition-all resize-none"
                                    placeholder="e.g. Best CRM, Marketing Automation, AI Writing Tool..."
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex-1 space-y-6 animate-fade-in-up">
                            <h2 className="text-2xl font-bold">Who are your competitors?</h2>
                            <p className="text-gray-400">We'll benchmark your AI visibility against these companies.</p>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Competitors (comma separated)</label>
                                <textarea
                                    value={competitors}
                                    onChange={(e) => setCompetitors(e.target.value)}
                                    className="w-full h-32 bg-[#111] border border-white/10 rounded-lg p-4 text-white focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 focus:outline-none transition-all resize-none"
                                    placeholder="e.g. Salesforce, HubSpot, Zoho..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/10">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                Back
                            </button>
                        ) : (
                            <div /> // Spacer
                        )}

                        {step < 3 ? (
                            <Button onClick={handleNext} disabled={!industry && !websiteUrl && !keywords}>
                                Next Step <ArrowRight size={18} className="ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleComplete} disabled={loading || !competitors}>
                                {loading ? 'Finalizing...' : 'Complete Setup'} <CheckCircle2 size={18} className="ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
