'use client';

import { useState, useRef, useCallback, type ReactNode, type RefObject } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, useReducedMotion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
    children: ReactNode;
    onRefresh: () => Promise<void>;
    isRefreshing?: boolean;
    threshold?: number;
    className?: string;
    /**
     * When set, scrollTop is read from this element instead of the component's
     * own wrapper. Use this when the actual scroll container is provided by a
     * descendant (e.g. snap-scroll feeds where wrapping in another overflow
     * container would conflict with snap behavior).
     */
    externalScrollRef?: RefObject<HTMLDivElement | null>;
}

/**
 * Pull-to-refresh container with animated indicator
 */
export function PullToRefresh({
    children,
    onRefresh,
    isRefreshing = false,
    threshold = 80,
    className,
    externalScrollRef,
}: PullToRefreshProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPulling, setIsPulling] = useState(false);
    const [canRefresh, setCanRefresh] = useState(false);
    const startY = useRef(0);
    const pullDistance = useMotionValue(0);
    const shouldReduceMotion = useReducedMotion();

    const opacity = useTransform(pullDistance, [0, threshold], [0, 1]);
    const scale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
    const rotate = useTransform(pullDistance, [0, threshold * 2], [0, 360]);

    const getScrollTop = useCallback((): number => {
        if (externalScrollRef?.current) return externalScrollRef.current.scrollTop;
        return containerRef.current?.scrollTop ?? 0;
    }, [externalScrollRef]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (getScrollTop() === 0 && !isRefreshing) {
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    }, [isRefreshing, getScrollTop]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = Math.max(0, (currentY - startY.current) * 0.5);
        pullDistance.set(diff);
        setCanRefresh(diff >= threshold);
    }, [isPulling, isRefreshing, threshold, pullDistance]);

    const handleTouchEnd = useCallback(async () => {
        try {
            if (canRefresh && !isRefreshing) {
                await onRefresh();
            }
        } finally {
            setIsPulling(false);
            setCanRefresh(false);
            pullDistance.set(0);
        }
    }, [canRefresh, isRefreshing, onRefresh, pullDistance]);

    return (
        <div className={cn('relative overflow-hidden', className)}>
            {/* Pull indicator */}
            <AnimatePresence>
                {(isPulling || isRefreshing) && (
                    <motion.div
                        className="absolute top-0 inset-x-0 flex items-center justify-center z-10 py-4"
                        initial={shouldReduceMotion ? false : { y: -50 }}
                        animate={{ y: 0 }}
                        exit={shouldReduceMotion ? undefined : { y: -50 }}
                        style={{ opacity }}
                    >
                        <motion.div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                canRefresh || isRefreshing
                                    ? "bg-news-accent"
                                    : "bg-muted"
                            )}
                            style={{ scale }}
                        >
                            <motion.div
                                style={isRefreshing || shouldReduceMotion ? {} : { rotate }}
                                animate={isRefreshing && !shouldReduceMotion ? { rotate: 360 } : {}}
                                transition={isRefreshing && !shouldReduceMotion ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                            >
                                <RefreshCw className="w-5 h-5 text-white" />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content. When an external scroll container is provided we let
                the descendant own the overflow; otherwise this wrapper scrolls. */}
            <div
                ref={containerRef}
                className={cn('h-full', !externalScrollRef && 'overflow-y-auto')}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
}
