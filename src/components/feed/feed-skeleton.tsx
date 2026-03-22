'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for For You feed cards
 */
export function ForYouSkeleton() {
    return (
        <div className="relative w-full h-full snap-start shrink-0 overflow-hidden bg-background">
            {/* Background skeleton */}
            <Skeleton className="absolute inset-0 bg-muted" />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />

            {/* Content info skeleton */}
            <div className="absolute bottom-20 left-0 right-16 p-4 space-y-3">
                {/* Type badge */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-full bg-muted-foreground/20" />
                    <Skeleton className="h-5 w-16 rounded-full bg-muted-foreground/10" />
                </div>

                {/* Title */}
                <Skeleton className="h-7 w-4/5 bg-muted-foreground/20" />
                <Skeleton className="h-7 w-3/5 bg-muted-foreground/20" />

                {/* Author */}
                <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full bg-muted-foreground/30" />
                    <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
                </div>

                {/* Duration */}
                <Skeleton className="h-3 w-12 bg-muted-foreground/10" />
            </div>

            {/* Action buttons skeleton (right side) */}
            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <Skeleton className="w-11 h-11 rounded-full bg-muted-foreground/15" />
                        {i <= 2 && <Skeleton className="h-3 w-6 bg-muted-foreground/10" />}
                    </div>
                ))}
            </div>

            {/* Progress bar skeleton */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/15">
                <Skeleton className="h-full w-1/4 bg-gold/30" />
            </div>
        </div>
    );
}

/**
 * Loading skeleton for cinematic News slide
 */
export function NewsSlideSkeleton() {
    return (
        <div className="w-full h-full snap-start shrink-0 overflow-hidden flex flex-col bg-background">
            {/* ═══════ TOP: Hero Skeleton ═══════ */}
            <div className="shrink-0 w-full flex flex-col px-4 pt-14 pb-3">
                {/* Hero Image */}
                <Skeleton className="w-full aspect-[2/1] rounded-sm bg-muted/80 mb-3" />

                {/* Title */}
                <div className="space-y-2 mb-2">
                    <Skeleton className="h-6 w-full bg-muted rounded" />
                    <Skeleton className="h-6 w-3/4 bg-muted rounded" />
                </div>

                {/* Author */}
                <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full bg-muted" />
                    <Skeleton className="h-3 w-28 bg-muted/60 rounded" />
                </div>
            </div>

            {/* ═══════ Divider ═══════ */}
            <div className="shrink-0 mx-4">
                <div className="h-px bg-border" />
            </div>

            {/* ═══════ BOTTOM: Related Skeleton ═══════ */}
            <div className="flex-1 min-h-0 flex flex-col px-4 pt-3 pb-24">
                {/* Section heading */}
                <Skeleton className="shrink-0 h-2.5 w-24 bg-muted rounded mb-2" />

                {/* Related cards */}
                <div className="flex-1 min-h-0 overflow-hidden space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-muted/50 rounded-sm p-2.5 flex gap-3 items-center border border-border"
                        >
                            <Skeleton className="w-14 h-14 shrink-0 rounded-md bg-muted" />
                            <div className="flex-1 space-y-1.5">
                                <div className="flex justify-between">
                                    <Skeleton className="h-2 w-10 bg-muted rounded" />
                                    <Skeleton className="h-2 w-8 bg-muted rounded" />
                                </div>
                                <Skeleton className="h-4 w-full bg-muted rounded" />
                                <Skeleton className="h-4 w-2/3 bg-muted/60 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
