'use client';

import { NowPlayingBar } from '@/components/now-playing-bar';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';

/**
 * Root-level Now Playing bar that only renders when NO bottom sheet
 * is mounted (the bottom sheet renders its own inline copy).
 */
export function GlobalNowPlayingBar() {
    const bottomSheetMounted = useNowPlayingStore((s) => s.bottomSheetMounted);

    if (bottomSheetMounted) return null;

    return <NowPlayingBar />;
}
