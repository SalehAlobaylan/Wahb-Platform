'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type FeedType = 'foryou' | 'news';

interface FeedSwitcherProps {
    value?: FeedType;
    onChange?: (value: FeedType) => void;
    variant?: 'dark' | 'light';
}

export function FeedSwitcher({ value, onChange, variant = 'dark' }: FeedSwitcherProps) {
    const pathname = usePathname();
    const isDark = variant === 'dark';

    // Determine active feed from pathname if value not provided
    const activeFeed: FeedType = value ?? (pathname === '/news' ? 'news' : 'foryou');

    const handleClick = (feed: FeedType) => {
        if (onChange) {
            onChange(feed);
        }
    };

    return (
        <div className="flex items-center gap-6 text-sm font-semibold">
            <Link
                href="/"
                onClick={() => handleClick('foryou')}
                className={cn(
                    'transition-colors pb-1',
                    activeFeed === 'foryou'
                        ? isDark
                            ? 'text-white border-b-2 border-white'
                            : 'text-foreground border-b-2 border-foreground'
                        : isDark
                            ? 'text-white/50 hover:text-white'
                            : 'text-muted-foreground hover:text-foreground'
                )}
            >
                For You
            </Link>
            <Link
                href="/news"
                onClick={() => handleClick('news')}
                className={cn(
                    'transition-colors pb-1',
                    activeFeed === 'news'
                        ? isDark
                            ? 'text-white border-b-2 border-bronze'
                            : 'text-bronze border-b-2 border-bronze'
                        : isDark
                            ? 'text-white/50 hover:text-white'
                            : 'text-muted-foreground hover:text-foreground'
                )}
            >
                News
            </Link>
        </div>
    );
}

