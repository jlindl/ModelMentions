import { Button } from "../components/Button";
import Link from 'next/link';

export default function IntegrationsPage() {
    return (
        <div className="min-h-screen bg-[#020202] text-white pt-32 pb-20">
            <div className="container mx-auto px-6 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                    Seamless <span className="text-brand-yellow">Integrations</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                    Connect ModelMentions with your existing <strong>marketing</strong> workflow. Support for Slack, Discord, and Linear is coming soon.
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/auth">
                        <Button size="lg">Get Notified</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
