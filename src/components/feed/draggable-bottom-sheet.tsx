'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DraggableBottomSheetProps {
    /** Content shown in the collapsed state (e.g. horizontal action buttons) */
    children: ReactNode;
    /** Content revealed when the sheet is expanded (e.g. tabs for Comments/Transcript) */
    expandedContent?: ReactNode;
    /** Minimum (collapsed) height in px */
    minHeight?: number;
    /** Maximum (fully expanded) height in px */
    maxHeight?: number;
    /** Default height on mount */
    defaultHeight?: number;
    /** Additional className for the container */
    className?: string;
}

/**
 * A draggable bottom sheet that supports touch + mouse drag and double-click
 * to expand or collapse. Snaps to three positions: min, mid, max.
 */
export function DraggableBottomSheet({
    children,
    expandedContent,
    minHeight = 80,
    maxHeight = 500,
    defaultHeight = 80,
    className,
}: DraggableBottomSheetProps) {
    const [height, setHeight] = useState(defaultHeight);
    const [isDragging, setIsDragging] = useState(false);

    const startY = useRef(0);
    const startHeight = useRef(0);
    const sheetRef = useRef<HTMLDivElement>(null);
    const lastTapTime = useRef(0);

    const isExpanded = height > minHeight + 20;

    // ── Snap logic ──────────────────────────────────────────
    const snapToNearest = useCallback(
        (currentHeight: number) => {
            const range = maxHeight - minHeight;
            const third = range / 3;
            const lowThreshold = minHeight + third;
            const highThreshold = minHeight + third * 2;

            if (currentHeight < lowThreshold) return minHeight;
            if (currentHeight > highThreshold) return maxHeight;
            return minHeight + range / 2; // midpoint
        },
        [minHeight, maxHeight]
    );

    // ── Touch handlers ──────────────────────────────────────
    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            setIsDragging(true);
            startY.current = e.touches[0].clientY;
            startHeight.current = height;
        },
        [height]
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!isDragging) return;
            const currentY = e.touches[0].clientY;
            const deltaY = startY.current - currentY; // positive = dragging up
            const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight.current + deltaY));
            setHeight(newHeight);
        },
        [isDragging, minHeight, maxHeight]
    );

    const handleDoubleTap = useCallback(() => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
            // Toggle between collapsed and expanded
            setHeight((h) => (h > minHeight + 20 ? minHeight : maxHeight));
            lastTapTime.current = 0;
        } else {
            lastTapTime.current = now;
        }
    }, [minHeight, maxHeight]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        setIsDragging(false);
        setHeight((h) => snapToNearest(h));

        // Let's determine if this was a quick tap or a real drag
        const endHeight = snapToNearest(height);
        // If height barely changed during the touch interaction, it was likely a tap.
        if (Math.abs(height - startHeight.current) < 5) {
            handleDoubleTap();
        }
    }, [snapToNearest, handleDoubleTap, height]);

    // ── Mouse handlers (desktop) ────────────────────────────
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsDragging(true);
            startY.current = e.clientY;
            startHeight.current = height;
        },
        [height]
    );

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = startY.current - e.clientY;
            const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight.current + deltaY));
            setHeight(newHeight);
        };

        const handleMouseUp = (e: MouseEvent) => {
            setIsDragging(false);
            setHeight((h) => snapToNearest(h));
            // Let's check for tap again based on drag diff to keep parity
            if (Math.abs(height - startHeight.current) < 5) {
                // The click event is natively sent by the browser so we don't need to manually invoke handleDoubleTap here unless clicking was explicitly preventDefault, but mouse interaction generally handles `onClick` naturally without touch issues. 
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, minHeight, maxHeight, snapToNearest, height]);

    return (
        <div
            ref={sheetRef}
            className={cn(
                'absolute left-0 right-0 z-30',
                'bottom-0',
                'bg-card/95 backdrop-blur-xl',
                'border-t border-border/50',
                'shadow-[0px_-8px_30px_0px_rgba(0,0,0,0.4)]',
                'overflow-hidden',
                'max-w-md mx-auto rounded-t-2xl',
                'pb-[calc(env(safe-area-inset-bottom)+4rem)] md:pb-[env(safe-area-inset-bottom)]',
                className
            )}
            style={{
                height: isDragging ? 'auto' : `${height}px`,
                minHeight: `${height}px`,
                transition: isDragging ? 'none' : 'height 0.3s ease-out, min-height 0.3s ease-out',
            }}
        >
            {/* Drag handle */}
            <div
                className={cn(
                    'w-full pt-[10px] pb-[8px] flex items-center justify-center',
                    'cursor-grab active:cursor-grabbing',
                    'select-none'
                )}
                style={{ touchAction: 'none' }} // Prevent scrolling while interacting with handle
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => {
                    handleTouchEnd(e);
                    // Let the double-tap handler work by not fully preventing defaults unless dragging heavily,
                    // but we ensure touchend allows a click event to synthesize if it was just a tap.
                }}
                onMouseDown={handleMouseDown}
                onClick={handleDoubleTap}
                role="slider"
                aria-label="Drag to expand"
                aria-valuenow={height}
                aria-valuemin={minHeight}
                aria-valuemax={maxHeight}
                tabIndex={0}
            >
                <div className="w-9 h-[4px] rounded-full bg-muted-foreground/40 pointer-events-none" />
            </div>

            {/* Collapsed content (action buttons row) */}
            <div className="px-4">
                {children}
            </div>

            {/* Expanded content (tabs) — only rendered when expanded */}
            {isExpanded && expandedContent && (
                <div
                    className="flex-1 overflow-y-auto px-4 pt-2 pb-4"
                    style={{
                        height: `${height - minHeight - 10}px`,
                    }}
                >
                    {expandedContent}
                </div>
            )}
        </div>
    );
}
