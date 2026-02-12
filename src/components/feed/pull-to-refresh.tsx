'use client';

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
    children: ReactNode;
    onRefresh: () => Promise<void>;
    isRefreshing?: boolean;
    threshold?: number;
    className?: string;
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
}: PullToRefreshProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPulling, setIsPulling] = useState(false);
    const [canRefresh, setCanRefresh] = useState(false);
    const startY = useRef(0);
    const pullDistance = useMotionValue(0);

    const opacity = useTransform(pullDistance, [0, threshold], [0, 1]);
    const scale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
    const rotate = useTransform(pullDistance, [0, threshold * 2], [0, 360]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    }, [isRefreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = Math.max(0, (currentY - startY.current) * 0.5);
        pullDistance.set(diff);
        setCanRefresh(diff >= threshold);
    }, [isPulling, isRefreshing, threshold, pullDistance]);

    const handleTouchEnd = useCallback(async () => {
        if (canRefresh && !isRefreshing) {
            await onRefresh();
        }
        setIsPulling(false);
        setCanRefresh(false);
        pullDistance.set(0);
    }, [canRefresh, isRefreshing, onRefresh, pullDistance]);

    return (
        <div className={cn('relative overflow-hidden', className)}>
            {/* Pull indicator */}
            <AnimatePresence>
                {(isPulling || isRefreshing) && (
                    <motion.div
                        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 py-4"
                        initial={{ y: -50 }}
                        animate={{ y: 0 }}
                        exit={{ y: -50 }}
                        style={{ opacity }}
                    >
                        <motion.div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                canRefresh || isRefreshing
                                    ? "bg-bronze"
                                    : "bg-muted"
                            )}
                            style={{ scale }}
                        >
                            <motion.div
                                style={isRefreshing ? {} : { rotate }}
                                animate={isRefreshing ? { rotate: 360 } : {}}
                                transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                            >
                                <RefreshCw className="w-5 h-5 text-white" />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div
                ref={containerRef}
                className="h-full overflow-y-auto"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
}
