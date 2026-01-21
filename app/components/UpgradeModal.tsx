
'use client';

import { X, Zap, Check } from 'lucide-react';
import { Button } from './Button';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUsage?: string;
}

export function UpgradeModal({ isOpen, onClose, currentUsage }: UpgradeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#0a0a0a] border border-brand-yellow/30 w-full max-w-2xl rounded-2xl p-8 shadow-[0_0_50px_rgba(255,215,0,0.15)] animate-fade-in-up">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-brand-yellow/10 flex items-center justify-center mb-4 border border-brand-yellow/20 shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                        <Zap size={32} className="text-brand-yellow fill-current" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Usage Limit Reached</h2>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        You've hit the monthly cap for your current plan. Upgrade to <b>Pro</b> or <b>Premium</b> to unlock more deep-dive analytics and model capacity.
                    </p>
                    {currentUsage && (
                        <div className="mt-4 px-4 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
                            {currentUsage}
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {/* Pro Plan */}
                    <div className="border border-white/10 rounded-xl p-6 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 text-xs font-bold text-gray-500">PRO</div>
                        <h3 className="text-xl font-bold text-white mb-1">Scale</h3>
                        <div className="text-2xl font-bold text-brand-yellow mb-4">$19<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                        <ul className="space-y-2 text-sm text-gray-400 mb-6">
                            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> 10 Credits Monthly</li>
                            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Priority Processing</li>
                            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Advanced Export</li>
                        </ul>
                        <Button className="w-full bg-white text-black hover:bg-gray-200">Select Scale</Button>
                    </div>

                    {/* Premium Plan */}
                    <div className="border border-brand-yellow/40 rounded-xl p-6 bg-gradient-to-b from-brand-yellow/10 to-transparent relative overflow-hidden group">
                        <div className="absolute top-0 right-0 bg-brand-yellow text-black text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                        <h3 className="text-xl font-bold text-white mb-1">Growth</h3>
                        <div className="text-2xl font-bold text-brand-yellow mb-4">$49<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                        <ul className="space-y-2 text-sm text-gray-300 mb-6">
                            <li className="flex items-center gap-2"><Check size={14} className="text-brand-yellow" /> 30 Credits Monthly</li>
                            <li className="flex items-center gap-2"><Check size={14} className="text-brand-yellow" /> All AI Models (Opus, etc)</li>
                            <li className="flex items-center gap-2"><Check size={14} className="text-brand-yellow" /> Dedicated Support</li>
                        </ul>
                        <Button className="w-full shadow-[0_0_20px_rgba(255,215,0,0.3)]">Upgrade Now</Button>
                    </div>
                </div>

                <div className="text-center">
                    <button onClick={onClose} className="text-sm text-gray-500 hover:text-white transition-colors underline">
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
