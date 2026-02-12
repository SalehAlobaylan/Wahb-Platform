'use client';

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FeedContainerProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    onScrollEnd?: () => void;
}

/**
 * Snap-scroll container for feed items
 * Uses CSS scroll-snap for satisfying full-page transitions
 */
export const FeedContainer = forwardRef<HTMLDivElement, FeedContainerProps>(
    ({ children, className, onScrollEnd, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'h-full w-full overflow-y-scroll snap-y snap-mandatory',
                    'overscroll-y-contain touch-pan-y',
                    'scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

FeedContainer.displayName = 'FeedContainer';
