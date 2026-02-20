'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type FeedType = 'foryou' | 'news' | 'saved';

interface FeedSwitcherProps {
    value?: FeedType;
    onChange?: (value: FeedType) => void;
    variant?: 'dark' | 'light';
}

export function FeedSwitcher({ value, onChange, variant = 'dark' }: FeedSwitcherProps) {
    const pathname = usePathname();
    const isDark = variant === 'dark';

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

    const tabs: { key: FeedType; label: string; href: string }[] = [
        { key: 'foryou', label: 'For You', href: '/' },
        { key: 'news', label: 'News', href: '/news' },
        { key: 'saved', label: 'Saved', href: '/saved' },
    ];

    return (
        <div className="flex items-center gap-6 text-sm font-semibold">
            {tabs.map((tab) => (
                <Link
                    key={tab.key}
                    href={tab.href}
                    onClick={() => handleClick(tab.key)}
                    className={cn(
                        'transition-colors pb-1',
                        activeFeed === tab.key
                            ? isDark
                                ? 'text-white border-b-2 border-bronze'
                                : 'text-bronze border-b-2 border-bronze'
                            : isDark
                                ? 'text-white/50 hover:text-white'
                                : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}
