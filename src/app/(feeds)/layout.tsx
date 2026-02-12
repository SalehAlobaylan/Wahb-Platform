'use client';

import { ReactNode } from 'react';

interface FeedsLayoutProps {
    children: ReactNode;
}

/**
 * Shared layout for feed pages (For You and News)
 * Provides full-screen container for snap-scroll feeds
 */
export default function FeedsLayout({ children }: FeedsLayoutProps) {
    return (
        <div className="h-screen w-full overflow-hidden">
            {children}
        </div>
    );
}
