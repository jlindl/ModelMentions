'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react'; // Assuming legacy-react installed, otherwise standard icons
import { useState } from 'react';
import { Button } from './Button';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-brand-black/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between relative z-10">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <img
                        src="/MMLOGO.png"
                        alt="ModelMentions"
                        style={{
                            filter: 'drop-shadow(0 0 20px rgba(255,215,0,1)) drop-shadow(0 0 40px rgba(255,215,0,0.8)) drop-shadow(0 0 60px rgba(255,215,0,0.6))'
                        }}
                        className="h-20 w-auto translate-y-2"
                    />
                    <span className="text-2xl font-bold tracking-tighter text-white hidden sm:block">
                        Model<span className="text-brand-yellow">Mentions</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/features" className="text-sm font-medium text-gray-400 hover:text-brand-yellow transition-colors">
                        Features
                    </Link>
                    <Link href="/how-it-works" className="text-sm font-medium text-gray-400 hover:text-brand-yellow transition-colors">
                        How it works
                    </Link>
                    <Link href="/blog" className="text-sm font-medium text-gray-400 hover:text-brand-yellow transition-colors">
                        Blog
                    </Link>
                    <Link href="/pricing" className="text-sm font-medium text-gray-400 hover:text-brand-yellow transition-colors">
                        Pricing
                    </Link>
                    <Link href="/auth">
                        <Button size="sm" variant="primary">
                            Start Tracking
                        </Button>
                    </Link>
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-gray-400 hover:text-white"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 right-0 bg-brand-black border-b border-white/10 p-6 flex flex-col gap-4 animate-fade-in-up">
                    <Link href="/features" className="text-base font-medium text-gray-400 hover:text-brand-yellow" onClick={() => setIsMenuOpen(false)}>
                        Features
                    </Link>
                    <Link href="/how-it-works" className="text-base font-medium text-gray-400 hover:text-brand-yellow" onClick={() => setIsMenuOpen(false)}>
                        How it works
                    </Link>
                    <Link href="/blog" className="text-base font-medium text-gray-400 hover:text-brand-yellow" onClick={() => setIsMenuOpen(false)}>
                        Blog
                    </Link>
                    <Link href="/pricing" className="text-base font-medium text-gray-400 hover:text-brand-yellow" onClick={() => setIsMenuOpen(false)}>
                        Pricing
                    </Link>
                    <Link href="/auth" className="w-full">
                        <Button className="w-full">Start Tracking</Button>
                    </Link>
                </div>
            )}
        </header>
    );
}
