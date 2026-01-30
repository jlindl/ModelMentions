"use client";

import { useState } from "react";
import { MessageSquare, X, Send, Star, Loader2, CheckCircle } from "lucide-react";

export function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [rating, setRating] = useState(0);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Feedback User', // Automated name for feedback
                    email: email || 'anonymous@feedback.com',
                    message: `[RATING: ${rating}/5] ${message}`
                })
            });

            if (!res.ok) throw new Error('Failed to send');

            setStatus('success');
            setTimeout(() => {
                setIsOpen(false);
                setStatus('idle');
                setMessage("");
                setRating(0);
                setEmail("");
            }, 2000);

        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%-40px)] hover:translate-x-0 transition-transform duration-300 z-50 bg-[#111] border border-white/10 border-r-0 rounded-l-xl p-3 shadow-lg group flex items-center gap-3 ${isOpen ? 'translate-x-[100%]' : ''}`}
            >
                <div className="flex flex-col items-center gap-1">
                    <span className="[writing-mode:vertical-rl] text-xs font-bold tracking-widest text-gray-400 group-hover:text-brand-yellow uppercase py-2">Feedback</span>
                    <MessageSquare size={16} className="text-brand-yellow" />
                </div>
            </button>

            {/* Modal / Popover */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center sm:justify-end sm:items-end sm:p-6 p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Widget Card */}
                    <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:mr-4 sm:mb-20">
                        {/* Header */}
                        <div className="bg-white/5 p-4 flex justify-between items-center border-b border-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <MessageSquare size={16} className="text-brand-yellow" />
                                Send Feedback
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {status === 'success' ? (
                                <div className="py-8 text-center space-y-3">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-500/20">
                                        <CheckCircle size={24} />
                                    </div>
                                    <h4 className="font-bold text-white">Thank You!</h4>
                                    <p className="text-xs text-gray-400">Your feedback helps us improve.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-2">How would you rate your experience?</label>
                                        <div className="flex gap-2 justify-center bg-white/5 p-3 rounded-xl border border-white/5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className={`transition-all hover:scale-110 ${rating >= star ? 'text-brand-yellow fill-brand-yellow' : 'text-gray-600'}`}
                                                >
                                                    <Star size={20} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Message</label>
                                        <textarea
                                            required
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="What's on your mind? (Bugs, features, etc)"
                                            className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-yellow resize-none placeholder-gray-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Email (Optional)</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="For us to reply..."
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-yellow"
                                        />
                                    </div>

                                    <button
                                        disabled={status === 'loading'}
                                        className="w-full bg-brand-yellow text-black font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        Send Feedback
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
