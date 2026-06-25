'use client';

import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { shareProfile } from '@/lib/utils/share';

/**
 * Edit + Share actions under the profile hero. Share uses the native sheet
 * (mobile) or copies a link.
 */
export function ProfileActions({ displayName }: { displayName: string }) {
    const t = useTranslations();

    return (
        <div className="flex w-full gap-3 px-4">
            <Link href="/profile/edit" className="flex-1">
                <button className="w-full cursor-pointer flex items-center justify-center rounded-lg h-11 bg-primary text-primary-foreground text-sm font-bold tracking-wide transition-all hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/20">
                    {t('profile.edit')}
                </button>
            </Link>
            <button
                type="button"
                onClick={() => shareProfile(displayName, t)}
                className="flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-lg h-11 border border-border bg-card text-foreground text-sm font-bold tracking-wide transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary active:scale-[0.98]"
            >
                <Share2 className="w-4 h-4" />
                {t('profile.share')}
            </button>
        </div>
    );
}
