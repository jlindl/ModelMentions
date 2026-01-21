import Link from 'next/link';

export function Footer() {
    return (
        <footer className="bg-brand-black border-t border-white/10 pt-20 pb-10">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="text-2xl font-bold tracking-tighter text-white mb-6 block">
                            Model<span className="text-brand-yellow">Mentions</span>
                        </Link>
                        <p className="text-gray-500 max-w-sm">
                            The first comprehensive analytics platform for the Large Language Model ecosystem. Track, Analyze, and Optimize your brand's AI presence.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Product</h4>
                        <ul className="space-y-4">
                            <li><Link href="/features" className="text-gray-500 hover:text-brand-yellow transition-colors">Features</Link></li>
                            <li><Link href="/integrations" className="text-gray-500 hover:text-brand-yellow transition-colors">Integrations</Link></li>
                            <li><Link href="/pricing" className="text-gray-500 hover:text-brand-yellow transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><Link href="/about" className="text-gray-500 hover:text-brand-yellow transition-colors">About</Link></li>
                            <li><Link href="/blog" className="text-gray-500 hover:text-brand-yellow transition-colors">Blog</Link></li>
                            <li><Link href="/contact" className="text-gray-500 hover:text-brand-yellow transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-sm">
                        © {new Date().getFullYear()} ModelMentions Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="text-gray-600 hover:text-white text-sm">Privacy Policy</Link>
                        <Link href="/terms" className="text-gray-600 hover:text-white text-sm">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
