import { Button } from "../components/Button";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#020202] text-white pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-center">
                    Get in <span className="text-brand-yellow">Touch</span>
                </h1>

                <form className="space-y-6 bg-[#111] p-8 rounded-2xl border border-white/10">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                        <input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow transition-colors" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                        <input type="email" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow transition-colors" placeholder="john@company.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                        <textarea className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow transition-colors min-h-[150px]" placeholder="How can we help?" />
                    </div>
                    <Button className="w-full font-bold">Send Message</Button>
                </form>
            </div>
        </div>
    );
}
