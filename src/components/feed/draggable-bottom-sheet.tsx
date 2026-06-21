'use client';

import { forwardRef, useState, useRef, useEffect, useCallback, useImperativeHandle, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DraggableBottomSheetHandle {
    expand: () => void;
    collapse: () => void;
}

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
    /**
     * When true, slide the (collapsed) sheet off the bottom of the screen —
     * the LinkedIn/X hide-on-scroll behaviour. Ignored while expanded or being
     * dragged. Named `concealed` to avoid clashing with the DOM `hidden` attr.
     */
    concealed?: boolean;
}

/**
 * A draggable bottom sheet that supports touch + mouse drag and double-click
 * to expand or collapse. Snaps to three positions: min, mid, max.
 */
export const DraggableBottomSheet = forwardRef<DraggableBottomSheetHandle, DraggableBottomSheetProps>(function DraggableBottomSheet({
    children,
    expandedContent,
    minHeight = 80,
    maxHeight = 500,
    defaultHeight = 80,
    className,
    concealed = false,
}, ref) {
    const [height, setHeight] = useState(defaultHeight);
    const [isDragging, setIsDragging] = useState(false);

    const startY = useRef(0);
    const startHeight = useRef(0);
    const sheetRef = useRef<HTMLDivElement>(null);
    const lastTapTime = useRef(0);
    const lastTouchTapAt = useRef(0);

    const isExpanded = height > minHeight + 20;

    // Hide-on-scroll: only park the sheet off-screen when it's collapsed and the
    // user isn't mid-drag, so we never fight a deliberate interaction.
    const shouldConceal = concealed && !isExpanded && !isDragging;

    useImperativeHandle(ref, () => ({
        expand: () => setHeight(maxHeight),
        collapse: () => setHeight(minHeight),
    }), [maxHeight, minHeight]);

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

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        setHeight((h) => snapToNearest(h));

        // If height barely changed during the touch interaction, it was a tap.
        if (Math.abs(height - startHeight.current) < 5) {
            // Record the touch tap so the click synthesized right after it on
            // touch devices is ignored (see handleClick) — otherwise a single tap
            // is counted twice and mis-read as a double-tap toggle.
            lastTouchTapAt.current = Date.now();
            handleDoubleTap();
        }
    }, [snapToNearest, handleDoubleTap, height]);

    const handleClick = useCallback(() => {
        // Ignore the click synthesized immediately after a touch tap (already
        // handled in handleTouchEnd); only respond to genuine mouse clicks.
        if (Date.now() - lastTouchTapAt.current < 500) return;
        handleDoubleTap();
    }, [handleDoubleTap]);

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

        const handleMouseUp = () => {
            setIsDragging(false);
            setHeight((h) => snapToNearest(h));
            // A genuine mouse click fires onClick natively (handled by
            // handleClick), so no tap detection is needed here.
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, minHeight, maxHeight, snapToNearest]);

    return (
        <div
            ref={sheetRef}
            className={cn(
                'absolute left-0 right-0 z-30',
                'bottom-0',
                'bg-card/95 backdrop-blur-xl',
                'border-t border-border/50',
                'shadow-[0_-2px_12px_rgba(0,0,0,0.08)]',
                'overflow-visible',
                'max-w-md mx-auto rounded-t-2xl',
                'pb-[calc(env(safe-area-inset-bottom)+4rem)] md:pb-[env(safe-area-inset-bottom)]',
                className
            )}
            style={{
                height: isDragging ? 'auto' : `${height}px`,
                minHeight: `${height}px`,
                transform: shouldConceal ? 'translateY(105%)' : 'none',
                transition: isDragging
                    ? 'none'
                    : 'height 0.3s ease-out, min-height 0.3s ease-out, transform 0.3s ease-out',
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
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onClick={handleClick}
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
});
