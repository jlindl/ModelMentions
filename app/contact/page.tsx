"use client";

import { useState } from "react";
import { Button } from "../components/Button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            setStatus('success');
            setFormData({ name: '', email: '', message: '' }); // Reset form

        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setErrorMessage(error.message || 'Something went wrong');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-center animate-fade-in-up">
                    Get in <span className="text-brand-yellow">Touch</span>
                </h1>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/10 shadow-2xl animate-fade-in relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 p-32 bg-brand-yellow/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 text-green-500 mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                            <p className="text-gray-400">Thank you for reaching out. We'll get back to you shortly.</p>
                            <Button
                                onClick={() => setStatus('idle')}
                                variant="secondary"
                                className="mt-6"
                            >
                                Send Another
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    type="text"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                                <input
                                    required
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow transition-colors"
                                    placeholder="john@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                                <textarea
                                    required
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow transition-colors min-h-[150px] resize-none"
                                    placeholder="How can we help?"
                                />
                            </div>

                            {status === 'error' && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle size={16} />
                                    {errorMessage}
                                </div>
                            )}

                            <Button
                                disabled={status === 'loading'}
                                className="w-full font-bold h-12 bg-brand-yellow text-black hover:bg-yellow-400"
                            >
                                {status === 'loading' ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" size={18} /> Sending...
                                    </span>
                                ) : (
                                    'Send Message'
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
