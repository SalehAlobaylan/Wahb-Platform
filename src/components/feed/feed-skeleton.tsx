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
                <Skeleton className="h-full w-1/4 bg-bronze/30" />
            </div>
        </div>
    );
}

/**
 * Loading skeleton for cinematic News slide
 */
export function NewsSlideSkeleton() {
    return (
        <div className="w-full h-full snap-start shrink-0 overflow-hidden flex flex-col bg-[#0a0a0a] relative">
            {/* ═══════ TOP HALF: Hero Skeleton ═══════ */}
            <div className="h-[50%] w-full flex flex-col px-4 pt-10 pb-4">
                {/* Category & Date */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-2.5 w-24 bg-zinc-800 rounded" />
                        <Skeleton className="h-2 w-20 bg-zinc-800/60 rounded" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="w-5 h-5 bg-zinc-800 rounded" />
                        <Skeleton className="w-5 h-5 bg-zinc-800 rounded" />
                    </div>
                </div>

                {/* Hero Image */}
                <Skeleton className="w-full h-[65%] rounded-lg bg-zinc-800/80 mb-5" />

                {/* Title */}
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full bg-zinc-800 rounded" />
                    <Skeleton className="h-8 w-3/4 bg-zinc-800 rounded" />
                </div>

                {/* Author */}
                <div className="flex items-center gap-2 mt-3">
                    <Skeleton className="w-5 h-5 rounded-full bg-zinc-800" />
                    <Skeleton className="h-3 w-28 bg-zinc-800/60 rounded" />
                </div>
            </div>

            {/* ═══════ BOTTOM HALF: Sheet Skeleton ═══════ */}
            <div className="absolute bottom-0 left-0 w-full h-[50%] bg-[#141414] rounded-t-[2rem] border-t border-white/5">
                {/* Drag handle */}
                <div className="w-full pt-4 pb-2 flex justify-center">
                    <Skeleton className="w-10 h-1 rounded-full bg-bronze/20" />
                </div>

                <div className="px-6 pt-2">
                    {/* Tab bar */}
                    <div className="flex gap-6 mb-5 border-b border-white/5 pb-3">
                        <Skeleton className="h-3 w-16 bg-zinc-800 rounded" />
                        <Skeleton className="h-3 w-20 bg-zinc-800/50 rounded" />
                    </div>

                    {/* Related cards */}
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="bg-[#1c1c1c] rounded-xl p-2.5 flex gap-3 items-center border border-white/5"
                            >
                                <Skeleton className="w-14 h-14 shrink-0 rounded-md bg-zinc-800" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-2 w-10 bg-zinc-700 rounded" />
                                        <Skeleton className="h-2 w-8 bg-zinc-800 rounded" />
                                    </div>
                                    <Skeleton className="h-4 w-full bg-zinc-800 rounded" />
                                    <Skeleton className="h-4 w-2/3 bg-zinc-800/60 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
