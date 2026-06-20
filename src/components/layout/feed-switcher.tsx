'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';

type FeedType = 'foryou' | 'news' | 'saved';

interface NewsWindowOption {
    value: string;
    labelKey: string;
}

interface FeedSwitcherProps {
    value?: FeedType;
    onChange?: (value: FeedType) => void;
    variant?: 'dark' | 'light';
    // When provided, the News tab doubles as the time-range trigger: on the News
    // page it shows a dropdown arrow and opens this today/week/month menu when
    // tapped (instead of re-navigating to a page it's already on).
    newsWindowOptions?: NewsWindowOption[];
    newsWindowValue?: string;
    onNewsWindowChange?: (value: string) => void;
}

export function FeedSwitcher({
    value,
    onChange,
    variant = 'dark',
    newsWindowOptions,
    newsWindowValue,
    onNewsWindowChange,
}: FeedSwitcherProps) {
    const pathname = usePathname();
    const isDark = variant === 'dark';
    const t = useTranslations();
    const [windowMenuOpen, setWindowMenuOpen] = useState(false);

    // Determine active feed from pathname if value not provided
    const activeFeed: FeedType = value ?? (
        pathname === '/news' ? 'news' :
            pathname === '/saved' ? 'saved' :
                'foryou'
    );

    const handleClick = (feed: FeedType) => {
        if (onChange) {
            onChange(feed);
        }
    };

    const hasWindowMenu = Boolean(newsWindowOptions && newsWindowOptions.length > 0 && onNewsWindowChange);

    const tabs: { key: FeedType; label: string; href: string }[] = [
        { key: 'foryou', label: t('feeds.foryou'), href: '/' },
        { key: 'news', label: t('feeds.news'), href: '/news' },
        { key: 'saved', label: t('feeds.saved'), href: '/saved' },
    ];

    const tabClass = (active: boolean) =>
        cn(
            'transition-colors pb-1',
            active
                ? isDark
                    ? 'text-white border-b-2 border-gold'
                    : 'text-news-accent border-b-2 border-news-accent'
                : isDark
                    ? 'text-white/50 hover:text-white'
                    : 'text-muted-foreground hover:text-foreground'
        );

    return (
        <div className="flex items-center gap-6 text-sm font-semibold">
            {tabs.map((tab) => {
                const active = activeFeed === tab.key;

                // News tab on the News page → trigger the time-range dropdown
                // instead of a no-op navigation.
                if (tab.key === 'news' && active && hasWindowMenu) {
                    return (
                        <div key={tab.key} className="relative">
                            <button
                                type="button"
                                onClick={() => setWindowMenuOpen((o) => !o)}
                                className={cn(tabClass(true), 'inline-flex items-center gap-1')}
                                aria-haspopup="listbox"
                                aria-expanded={windowMenuOpen}
                            >
                                {tab.label}
                                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', windowMenuOpen && 'rotate-180')} />
                            </button>
                            {windowMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setWindowMenuOpen(false)} />
                                    <div className="absolute start-1/2 -translate-x-1/2 mt-2 z-20 min-w-[7rem] rounded-sm border border-foreground/15 bg-background/95 backdrop-blur shadow-md p-0.5">
                                        {newsWindowOptions!.map((option) => {
                                            const selected = option.value === newsWindowValue;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => { onNewsWindowChange!(option.value); setWindowMenuOpen(false); }}
                                                    className={cn(
                                                        'w-full text-start h-8 rounded-sm px-3 text-[11px] font-bold transition-colors',
                                                        selected
                                                            ? 'bg-news-accent text-white shadow-sm'
                                                            : 'text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
                                                    )}
                                                    aria-pressed={selected}
                                                >
                                                    {t(option.labelKey)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                }

                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        onClick={() => handleClick(tab.key)}
                        className={tabClass(active)}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
