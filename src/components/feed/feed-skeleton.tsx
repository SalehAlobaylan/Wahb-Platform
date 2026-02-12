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
 * Loading skeleton for News slide
 */
export function NewsSlideSkeleton() {
    return (
        <div className="w-full h-full snap-start shrink-0 overflow-hidden flex flex-col bg-secondary">
            {/* Header skeleton */}
            <header className="px-6 pt-14 pb-3 border-b-2 border-foreground flex justify-between items-center shrink-0">
                <Skeleton className="h-3 w-24 bg-muted-foreground/20" />
                <Skeleton className="h-3 w-16 bg-muted-foreground/20" />
            </header>

            {/* Main Content skeleton */}
            <main className="px-6 py-4 flex flex-col flex-grow overflow-hidden">
                {/* Featured Article skeleton */}
                <article className="mb-4 border-b-2 border-foreground pb-4 shrink-0">
                    {/* Featured Image */}
                    <Skeleton className="h-40 w-full bg-muted mb-4 rounded-sm" />

                    {/* Meta info */}
                    <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-3 w-20 bg-muted-foreground/20" />
                        <Skeleton className="h-3 w-2 bg-muted-foreground/20 rounded-full" />
                        <Skeleton className="h-3 w-14 bg-muted-foreground/20" />
                    </div>

                    {/* Title */}
                    <Skeleton className="h-8 w-full bg-muted-foreground/20 mb-2" />
                    <Skeleton className="h-8 w-3/4 bg-muted-foreground/20 mb-2" />

                    {/* Excerpt */}
                    <Skeleton className="h-4 w-full bg-muted-foreground/15 mb-1" />
                    <Skeleton className="h-4 w-4/5 bg-muted-foreground/15 mb-3" />

                    {/* Author */}
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24 bg-muted-foreground/20" />
                        <Skeleton className="h-5 w-5 bg-muted-foreground/20" />
                    </div>
                </article>

                {/* Related Section Header skeleton */}
                <div className="flex justify-between items-end border-b border-foreground mb-2 pb-1 shrink-0">
                    <Skeleton className="h-6 w-32 bg-muted-foreground/20" />
                    <Skeleton className="h-3 w-12 bg-muted-foreground/20" />
                </div>

                {/* Related Items skeleton */}
                <div className="flex flex-col space-y-1 overflow-hidden flex-1">
                    {[1, 2, 3].map((i) => (
                        <article key={i} className="py-3 border-b border-foreground/20 flex flex-col px-2">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <Skeleton className="h-2 w-12 bg-muted-foreground/20" />
                                <Skeleton className="h-2 w-16 bg-muted-foreground/20" />
                            </div>
                            <Skeleton className="h-5 w-full bg-muted-foreground/20 mb-1" />
                            <Skeleton className="h-3 w-16 bg-muted-foreground/10" />
                        </article>
                    ))}
                </div>

                {/* Footer decoration skeleton */}
                <div className="mt-auto pt-4 text-center shrink-0">
                    <Skeleton className="w-8 h-1 mx-auto rounded-full bg-bronze/20" />
                </div>
            </main>
        </div>
    );
}
