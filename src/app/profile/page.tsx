'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Play, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';
import { useFeedStore } from '@/lib/stores';
import { useBookmarks } from '@/lib/hooks';
import { InterestsModal } from '@/components/profile/interests-modal';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import type { ContentItem } from '@/types';

const DEFAULT_INTERESTS = ['Tech', 'Music', 'AI', 'Design', 'Startup'];

export default function ProfilePage() {
    const [interests, setInterests] = useState<string[]>(DEFAULT_INTERESTS);
    const [showInterestsModal, setShowInterestsModal] = useState(false);
    const nowPlaying = useNowPlayingStore();
    const { bookmarkedIds } = useFeedStore();

    const { data: bookmarksData } = useBookmarks();
    const bookmarkedItems = useMemo(() => {
        if (!bookmarksData?.pages) return [];
        return bookmarksData.pages.flatMap((page) => page.items);
    }, [bookmarksData]);

    // Mock curated feed items (in real app, these come from an API)
    const curatedItems: { label: string; duration: string; title: string; description: string; imageUrl: string; isPlaying?: boolean }[] = [
        {
            label: 'Daily Briefing',
            duration: '12m',
            title: 'Global Markets: Shift',
            description: 'Analysis of the emerging trends in the eastern sector.',
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXtmn8hMTzcJYewWfHJbBCYkRaai53xKku-5VBvptnKj_icmv_8GIcGb0r9Dsm6xvO8orjLTzNYVIbRx3wq5qfxMKkbM-C7Q3DttomtPEaN2wX8e11ZZoWREEbFJ3-D3GYEWbc22eYP37yra4jfqPoh6YxRrT5-fiw5NpOeAT65CXqYQVGUZ2MwmPiZRHMa_cUIC-gwKudUfmbK98al48CENCX3RSLj5OFKfk0DJm4vXwVFT-CZ_XQqakQUW9Ibkj0MoyajPPNJCI',
            isPlaying: true,
        },
        {
            label: 'Commentary',
            duration: 'Comp.',
            title: "Verdi's Requiem",
            description: 'A deep dive into the choral masterpiece.',
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBX6u1gOaTPXAlZTy2bBAJsJnejCZX_F_zwR3UHvSPKpencpLDTAva0znrrXlx9rNqrYL6hcXHoSicPHndFSpQ1DLPeAGAMCxiTrSS0YXnoPqZltZpPkaet44-RZJFLvwtQFUpG3zXBewn5nY88XQmvoPlsETTiF3nFhY55VUUiP2k7PkFX00YyTgzV1VPoEe_CbqCwdYXzAtwo_QpWRLkwhxYNZADRDJGAxxxf15EEldygWOoKLJ-tmlTo_ctj-ihf94mk6buRoDQ',
        },
        {
            label: 'Interview',
            duration: '25m',
            title: 'Voices of the Past',
            description: 'Historical archives reopened for the first time.',
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0Ycgblr9t16o4BL0Po6u8kVzh9Ubb8f9f0bHWs-whcshyIECE79UI9xBpefn7ektZPRrKXNsAWoqNyDV-Lr0yGIGvM1L210T09SspmAS5bALD_FnCubCu6TFBJQFgocgCzOHBi8H3-Xns9wCVS_VTVfiTdQHoK8FbH6mYqBCaXJ7aWEhY1zOd23-STu8nbJVBuhO2fqU-P4j4uqn7doCkAggruLEn2Wkoi1tO3_o8zB_VyITwM3vHg3jiy_yNQ8DfYJGLXs439QE',
        },
        {
            label: 'Audio Drama',
            duration: '45m',
            title: 'The Golden Hour',
            description: 'Final episode of the acclaimed series.',
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-RAPRYiiEDo2MKp7iN7hpm1YpeSZ3RRkql0a0Lwc9rXiy-O_0vcsRj6rsYv72GzbHsKvWPNKfPSiQwKPATOBopzMqkYKKrmiHxr1DSttUTPoiN5cmotd4ym_mpco799A40WEG-f43PckSoEppI1agIkQBiHQd0e43obUswok8z_mVBCmRiGqTI0napxmNVHxBarrxMbrVdAGMX9UfoRWpZd5NLBebq87VQ1_MTE2YTGW0fN2swSDTRWwff7Kvahgr03d_7qMUhxs',
        },
    ];

    return (
        <>
            <div className="h-full w-full overflow-y-auto relative bg-[radial-gradient(circle_at_top_right,#3e3124_0%,#1a140e_60%)] font-serif text-white">
                {/* Noise overlay */}
                <div
                    className="fixed inset-0 pointer-events-none z-50 opacity-[0.04]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Back button */}
                <header className="sticky top-0 z-20 bg-gradient-to-b from-[#1a140e] to-transparent">
                    <div className="flex items-center justify-between p-4 pt-6">
                        <Link href="/">
                            <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
                                <ArrowLeft className="w-4.5 h-4.5 text-white" />
                            </div>
                        </Link>
                        <Link href="/settings">
                            <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
                                <Settings className="w-4.5 h-4.5 text-white" />
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="relative z-10 p-4 pb-12">
                    {/* ═══════════ BENTO GRID ═══════════ */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {/* ── Profile Card (full width) ── */}
                        <div className="col-span-2 relative rounded-2xl border border-[#5c4d3c] p-6 overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, rgba(45,36,24,0.6) 0%, rgba(26,20,14,0.9) 100%)' }}
                        >
                            {/* Glow */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#f2930d]/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex items-start justify-between">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-xl border border-[#f2930d]/30 p-1 bg-[#1a140e] shadow-lg rotate-3">
                                        <img
                                            alt="Profile"
                                            className="w-full h-full rounded-lg object-cover grayscale-[10%]"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBT3tOTd_0FQFYE_wVZS8AKG_2_1gKxMjQZLttkh3-LH78yHju7wao1AdpWvUHw4TD84VN7g06A92W2P5Ihw8CRDFshAwnuXo8M9ZcAVnEUwzZcXbBTbpIXxVdGsEDVyP0o3z0bufaxhGm5aYDYv9HNKDtDa3TzORR00Cw7XNKIFCE8E8oYS9uSppWYL-d0XEBNV29swqcx9JEi5zXUO7aj89yl48ntjkf6aVFZKqpFNXKrxwfp8qMd_3qQ8g77-D_qSmY_4swREXI"
                                        />
                                    </div>
                                </div>
                                <button className="text-xs border border-[#5c4d3c] text-[#f2930d] px-3 py-1 rounded-full hover:bg-[#f2930d] hover:text-[#1a140e] transition-colors">
                                    Edit
                                </button>
                            </div>

                            <div className="mt-4">
                                <button className="group flex items-center gap-2 text-left">
                                    <h1 className="text-3xl font-bold text-white leading-none tracking-tight group-hover:text-[#f2930d] transition-colors">
                                        Eleanor Vance
                                    </h1>
                                    <ChevronRight className="w-5 h-5 text-[#f2930d]/50 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <p className="text-sm text-[#bcaaa4] mt-1 font-light tracking-wide">
                                    @el_vance • Theatre Critic
                                </p>
                            </div>

                            <div className="mt-6 flex gap-6">
                                <div>
                                    <span className="block text-xl font-bold text-white">1.2k</span>
                                    <span className="text-[10px] uppercase tracking-widest text-[#f2930d]/60">Followers</span>
                                </div>
                                <div>
                                    <span className="block text-xl font-bold text-white">{bookmarkedIds.size || 89}</span>
                                    <span className="text-[10px] uppercase tracking-widest text-[#f2930d]/60">Saved</span>
                                </div>
                            </div>
                        </div>

                        {/* ── On Air Card ── */}
                        <div className="relative bg-[#261e16] rounded-2xl border border-[#5c4d3c] p-4 flex flex-col justify-between h-40 group hover:border-[#f2930d]/40 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="w-6 h-6 flex items-center justify-center text-[#f2930d] animate-pulse">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <rect x="4" y="8" width="2" height="8" rx="1"><animate attributeName="height" values="8;14;8" dur="0.8s" repeatCount="indefinite" /><animate attributeName="y" values="8;5;8" dur="0.8s" repeatCount="indefinite" /></rect>
                                        <rect x="8" y="6" width="2" height="12" rx="1"><animate attributeName="height" values="12;6;12" dur="0.6s" repeatCount="indefinite" /><animate attributeName="y" values="6;9;6" dur="0.6s" repeatCount="indefinite" /></rect>
                                        <rect x="12" y="4" width="2" height="16" rx="1"><animate attributeName="height" values="16;10;16" dur="0.7s" repeatCount="indefinite" /><animate attributeName="y" values="4;7;4" dur="0.7s" repeatCount="indefinite" /></rect>
                                        <rect x="16" y="7" width="2" height="10" rx="1"><animate attributeName="height" values="10;16;10" dur="0.5s" repeatCount="indefinite" /><animate attributeName="y" values="7;4;7" dur="0.5s" repeatCount="indefinite" /></rect>
                                        <rect x="20" y="9" width="2" height="6" rx="1"><animate attributeName="height" values="6;12;6" dur="0.9s" repeatCount="indefinite" /><animate attributeName="y" values="9;6;9" dur="0.9s" repeatCount="indefinite" /></rect>
                                    </svg>
                                </div>
                                <span className="text-[10px] uppercase text-[#bcaaa4] tracking-wider">On Air</span>
                            </div>
                            <div>
                                <div className="w-full h-1 bg-white/10 rounded-full mb-3 overflow-hidden">
                                    <div className="h-full bg-[#f2930d] w-2/3 rounded-full" />
                                </div>
                                <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                                    {nowPlaying.currentItem?.title || 'The Midnight Symphony'}
                                </h3>
                                <p className="text-xs text-[#bcaaa4] mt-1">
                                    {nowPlaying.currentItem?.author || 'Ep. 4'}
                                </p>
                            </div>
                        </div>

                        {/* ── Curation Pulse / Top Interests Card ── */}
                        <button
                            onClick={() => setShowInterestsModal(true)}
                            className="relative bg-[#261e16] rounded-2xl border border-[#5c4d3c] p-4 flex flex-col justify-between h-40 group hover:border-[#f2930d]/40 transition-colors overflow-hidden text-left"
                        >
                            {/* Pulse glow */}
                            <div className="absolute inset-0 opacity-50"
                                style={{ background: 'radial-gradient(circle, rgba(242,147,13,0.15) 0%, rgba(38,30,22,0) 70%)' }}
                            />
                            <div className="relative z-10 flex justify-between items-start">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-[#f2930d]" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="3" /><circle cx="4" cy="8" r="2" /><circle cx="20" cy="8" r="2" /><circle cx="4" cy="16" r="2" /><circle cx="20" cy="16" r="2" />
                                    <line x1="6" y1="8" x2="9" y2="10" /><line x1="18" y1="8" x2="15" y2="10" /><line x1="6" y1="16" x2="9" y2="14" /><line x1="18" y1="16" x2="15" y2="14" />
                                </svg>
                                <span className="text-[10px] uppercase text-[#bcaaa4] tracking-wider">Curation Pulse</span>
                            </div>
                            <div className="relative z-10 flex-1 flex flex-col justify-center items-center py-2">
                                <div className="flex flex-wrap gap-1.5 justify-center items-center">
                                    {interests.slice(0, 5).map((interest, i) => {
                                        const sizes = ['text-xs', 'text-[10px]', 'text-[11px]', 'text-[9px]', 'text-[10px]'];
                                        const delays = ['0s', '1.5s', '0.5s', '2s', '1s'];
                                        const isPrimary = i === 0 || i === 2;
                                        return (
                                            <span
                                                key={interest}
                                                className={cn(
                                                    sizes[i],
                                                    'px-2 py-0.5 rounded-full border',
                                                    isPrimary
                                                        ? 'bg-[#f2930d]/20 text-[#f2930d] border-[#f2930d]/30'
                                                        : 'bg-white/5 text-[#bcaaa4] border-white/10'
                                                )}
                                                style={{ animation: `float 6s ease-in-out infinite`, animationDelay: delays[i] }}
                                            >
                                                {interest}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="relative z-10 text-center">
                                <p className="text-[10px] text-[#bcaaa4] tracking-wide">Tap to adjust</p>
                            </div>
                        </button>
                    </div>

                    {/* ═══════════ CURATED FEED ═══════════ */}
                    <div className="flex items-center gap-4 mb-4 px-1">
                        <h2 className="text-lg font-medium tracking-widest uppercase text-white/90">Curated Feed</h2>
                        <div className="h-px bg-[#5c4d3c] flex-1 opacity-50" />
                    </div>

                    <div className="space-y-5 pb-8 px-1" style={{ perspective: '1000px' }}>
                        {curatedItems.map((item, index) => (
                            <div
                                key={index}
                                className="relative bg-[#261e16] rounded-xl border border-white/5 p-0 flex overflow-hidden group hover:border-[#f2930d]/20 transition-all"
                                style={{
                                    transformStyle: 'preserve-3d',
                                    transform: 'rotateX(5deg) scale(0.98)',
                                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                                    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'rotateX(0deg) scale(1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'rotateX(5deg) scale(0.98)';
                                }}
                            >
                                {/* Thumbnail */}
                                <div className="w-24 relative">
                                    <img
                                        alt={item.title}
                                        className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all"
                                        src={item.imageUrl}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#261e16]" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-4 flex flex-col justify-center relative z-10">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-[#f2930d] uppercase tracking-wider">{item.label}</span>
                                        <span className="text-[10px] text-[#bcaaa4]">{item.duration}</span>
                                    </div>
                                    <h3 className="text-lg text-white font-medium leading-snug mb-2">{item.title}</h3>
                                    <p className="text-xs text-[#bcaaa4] line-clamp-1">{item.description}</p>
                                </div>

                                {/* Play button */}
                                <button
                                    className={cn(
                                        'absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all z-20',
                                        item.isPlaying
                                            ? 'bg-[#f2930d] text-[#1a140e] shadow-[0_0_15px_rgba(242,147,13,0.4)] hover:scale-110'
                                            : 'border border-[#f2930d] text-[#f2930d] hover:bg-[#f2930d] hover:text-[#1a140e]'
                                    )}
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                </button>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Global Now Playing Bar */}
                <GlobalNowPlayingBar />
            </div>

            {/* Interests Modal */}
            <InterestsModal
                isOpen={showInterestsModal}
                onClose={() => setShowInterestsModal(false)}
                selected={interests}
                onSave={setInterests}
            />

        </>
    );
}
