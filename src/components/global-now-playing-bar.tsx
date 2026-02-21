'use client';

import { usePathname } from 'next/navigation';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';

/** Routes where the global bar should NOT appear */
const HIDDEN_ROUTES = ['/', '/news'];

/**
 * Root-level Now Playing bar that only renders when:
 *  - The user is NOT on the For You page (they're already at the audio source)
 *  - The user is NOT on the News page (the bottom sheet handles playback there)
 */
export function GlobalNowPlayingBar() {
    const pathname = usePathname();
    const bottomSheetMounted = useNowPlayingStore((s) => s.bottomSheetMounted);

    // Hide on For You and News pages, or if a bottom sheet is mounted
    if (HIDDEN_ROUTES.includes(pathname) || bottomSheetMounted) return null;

    return <NowPlayingBar />;
}

