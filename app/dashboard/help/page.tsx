"use client";

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, Book, MessageCircle, Info, ScanSearch, Swords, FileText, Settings, Layers } from 'lucide-react';
import { Button } from '../../components/Button';

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const tabs = [
        { id: 'general', label: 'General', icon: Info },
        { id: 'scanning', label: 'Scanning Engine', icon: ScanSearch },
        { id: 'comparison', label: 'Competitor Analysis', icon: Swords },
        { id: 'reports', label: 'Reports & Metrics', icon: FileText },
    ];

    const contentData = {
        general: {
            title: "General Questions",
            description: "Basics about your account, credits, and support.",
            faqs: [
                {
                    question: "How are credits calculated?",
                    answer: "Credits are based on the number of AI models you query and the complexity of the prompts. Each check (one prompt to one model) costs roughly $0.05 - $0.10 depending on the model used. Premium plans get bulk discounts."
                },
                {
                    question: "Can I upgrade my plan?",
                    answer: "Yes, you can upgrade your plan at any time from the Settings page. Upgrades are prorated for the remainder of your billing cycle."
                },
                {
                    question: "How do I contact support?",
                    answer: "You can reach us via the 'Contact Support' button on this page or email support@modelmentions.com directly. We typically respond within 24 hours."
                }
            ]
        },
        scanning: {
            title: "Scanning Engine",
            description: "Understanding how we test your brand visibility.",
            faqs: [
                {
                    question: "How does the 'Real Mode' scan work?",
                    answer: "Unlike other tools that 'simulate' results, we send your exact prompt to the actual live models (GPT-4o, Claude 3, Gemini 1.5). We then use a secondary 'Judge' AI to analyze their response and determine if your brand was mentioned, ensuring 100% authentic results."
                },
                {
                    question: "Why run multiple variations?",
                    answer: "AI models can be inconsistent. Asking 'Best CRM' might give different results than 'Top CRMs for small business'. Running 3-5 variations gives you a statistically significant view of your true visibility."
                },
                {
                    question: "What does 'Optimization' do?",
                    answer: "Our optimization engine suggests changes to your website content (keywords, technical structure) to make it more likely for AI models to pick you up as a definitive source."
                }
            ]
        },
        comparison: {
            title: "Competitor Analysis",
            description: "Benchmarking against your rivals.",
            faqs: [
                {
                    question: "How do I add competitors?",
                    answer: "Go to Settings > Competitors. You can add up to 3 competitors on the Pro plan and 10 on Ultra. These will automatically be included in your 'New Scan' options."
                },
                {
                    question: "Does it cost extra?",
                    answer: "Yes. Running a scan for a competitor performs the same number of queries as scanning for yourself. If you scan 3 models with 3 prompts for yourself AND 1 competitor, the cost doubles."
                },
                {
                    question: "What is the 'Win Rate'?",
                    answer: "Win Rate is the percentage of times your brand appeared in the top 3 recommendations compared to your competitor in the same set of scenarios."
                }
            ]
        },
        reports: {
            title: "Reports & Metrics",
            description: "Interpreting your data.",
            faqs: [
                {
                    question: "What is 'Sentiment Score'?",
                    answer: "We analyze the tone of the AI's mention of your brand. +1.0 is perfect praise, 0 is neutral, and -1.0 is negative. A score above 0.5 is considered 'Positive'."
                },
                {
                    question: "What does 'Rank #1' mean?",
                    answer: "It means your brand was the very first recommendation listed by the AI. Being in the top 3 is generally considered a successful 'Share of Voice' outcome."
                },
                {
                    question: "Can I share these reports?",
                    answer: "Absolutely. Use the 'Export PDF' button in the Reports section to generate a client-ready white-labeled document."
                }
            ]
        }
    };

    const currentContent = contentData[activeTab as keyof typeof contentData];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <HelpCircle className="text-brand-yellow" size={32} /> Help & Support
                </h1>
                <p className="text-gray-400 mt-2">Documentation and guides for the ModelMentions platform.</p>
            </div>

            {/* Feature Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setOpenIndex(0); }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all font-medium text-sm ${isActive
                                    ? 'bg-[#111] text-white border-x border-t border-white/10 border-b-black mb-[-1px] z-10'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={16} className={isActive ? 'text-brand-yellow' : ''} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Content Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-2">{currentContent.title}</h2>
                        <p className="text-gray-400 text-sm mb-6">{currentContent.description}</p>

                        <div className="space-y-4">
                            {currentContent.faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className={`border border-white/5 rounded-xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-[#0a0a0a] border-brand-yellow/20' : 'bg-[#151515] hover:bg-[#1a1a1a]'}`}
                                >
                                    <button
                                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                        className="w-full flex items-center justify-between p-5 text-left"
                                    >
                                        <span className={`font-medium ${openIndex === index ? 'text-white' : 'text-gray-400'}`}>
                                            {faq.question}
                                        </span>
                                        {openIndex === index ? (
                                            <ChevronUp size={20} className="text-brand-yellow" />
                                        ) : (
                                            <ChevronDown size={20} className="text-gray-600" />
                                        )}
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-5 pt-0 text-gray-400 text-sm leading-relaxed border-t border-white/5 mt-2">
                                            {faq.answer}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Support & Resources (Sticky?) */}
                <div className="space-y-6">
                    {/* Contact Card */}
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-brand-yellow/10 transition-colors"></div>

                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 text-brand-yellow border border-white/10">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Need personal help?</h3>
                            <p className="text-gray-400 text-sm mb-6">Our support team is available Mon-Fri to assist with any technical issues or billing inquiries.</p>

                            <Button
                                className="w-full justify-center bg-white text-black hover:bg-gray-200"
                                onClick={() => window.location.href = 'mailto:support@modelmentions.com'}
                            >
                                <Mail size={16} className="mr-2" /> Contact Support
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex gap-3">
                            <Info className="text-blue-400 shrink-0" size={20} />
                            <div>
                                <h4 className="text-blue-400 font-bold text-sm mb-1">Did you know?</h4>
                                <p className="text-xs text-blue-200/70 leading-relaxed">
                                    You can verify 'Real Mode' accuracy by manually checking the prompts in ChatGPT or Gemini. Our results should match their live outputs exactly.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
