'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, MessageSquare, History, Settings, LogOut, Loader2, BarChart3, Search, User, Zap, Swords, Shield } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/Button';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [userData, setUserData] = useState<{ name: string, plan: string }>({ name: '', plan: '' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            // We still fetch user data for display, but we don't need to redirect (Middleware does it)
            // However, checking onboarding status is still useful UX.
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('onboarding_completed, company_name, plan')
                        .eq('id', user.id)
                        .single();

                    if (profile) {
                        setUserData({
                            name: profile.company_name || user.email?.split('@')[0] || 'User',
                            plan: profile.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : 'Free'
                        });
                    }

                    if ((error || (profile && !profile.onboarding_completed)) && pathname !== '/onboarding') {
                        // Keep this for Onboarding flow, as Middleware doesn't know about onboarding status (it's in DB)
                        router.push('/onboarding');
                    }
                }
            } catch (error) {
                console.error("Error fetching user data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [pathname, router, supabase]);



    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    const navItems = [
        { name: 'Overview', href: '/dashboard/overview', icon: BarChart3 },
        { name: 'Insights', href: '/dashboard/insights', icon: Zap },
        { name: 'Sentinel', href: '/dashboard/sentinel', icon: Shield }, // Retention Feature
        { name: 'Battlecard', href: '/dashboard/compare', icon: Swords },
        { name: 'Live Feed', href: '/dashboard', icon: LayoutDashboard },
        { name: 'New Scan', href: '/dashboard/scan', icon: Search },
        { name: 'History', href: '/dashboard/history', icon: History },
        { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-[#020202] text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 flex flex-col hidden md:flex bg-[#050505] relative z-20">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
                        <span className="text-brand-yellow">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                        ModelMentions
                    </Link>
                </div>

                <div className="px-3 mb-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] pl-4 mb-3">Dashboard</p>
                    <nav className="space-y-1">
                        {navItems.slice(0, 2).map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 group ${isActive
                                        ? 'text-white bg-gradient-to-r from-white/10 to-transparent border-l-2 border-brand-yellow'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                                        }`}
                                >
                                    <item.icon size={18} className={`transition-colors ${isActive ? 'text-brand-yellow drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="px-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] pl-4 mb-3 mt-6">Analysis</p>
                    <nav className="space-y-1">
                        {navItems.slice(2).map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 group ${isActive
                                        ? 'text-white bg-gradient-to-r from-white/10 to-transparent border-l-2 border-brand-yellow'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                                        }`}
                                >
                                    <item.icon size={18} className={`transition-colors ${isActive ? 'text-brand-yellow drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>


                <div className="mt-auto p-4 border-t border-white/5 space-y-4">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5" suppressHydrationWarning>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-yellow to-yellow-600 flex items-center justify-center text-black font-bold border border-brand-yellow/20 shadow-lg">
                            <User size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            {isLoading ? (
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-24 bg-white/10" />
                                    <Skeleton className="h-3 w-16 bg-white/10" />
                                </div>
                            ) : (
                                <>
                                    <div className="text-white font-bold text-sm truncate" suppressHydrationWarning>{userData.name}</div>
                                    <div className="text-xs text-brand-yellow flex items-center gap-1" suppressHydrationWarning><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {userData.plan} License</div>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
                    >
                        <LogOut size={16} className="group-hover:text-red-400 transition-colors" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative bg-[#020202]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111] via-[#020202] to-[#020202] pointer-events-none" />
                <div className="relative z-10 h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
