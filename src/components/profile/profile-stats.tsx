'use client';

import { useMemo } from 'react';
import { useI18n, useTranslations } from '@/lib/i18n';
import type { UserStats } from '@/lib/hooks';
import type { ProfileTab } from './profile-tabs';

const STATS: Array<{ key: keyof UserStats; labelKey: string; tab: ProfileTab }> = [
    { key: 'saved', labelKey: 'profile.stats.saved', tab: 'saved' },
    { key: 'likes', labelKey: 'profile.stats.likes', tab: 'likes' },
    { key: 'listened', labelKey: 'profile.stats.listened', tab: 'history' },
    { key: 'created', labelKey: 'profile.stats.created', tab: 'creations' },
];

/**
 * Four real engagement counts (saved / likes / listened / created). Tapping a
 * stat jumps to its tab. Numbers are locale-formatted (Arabic numerals in AR)
 * and compacted (1.2k).
 */
export function ProfileStats({
    stats,
    isLoading,
    onSelect,
}: {
    stats?: UserStats;
    isLoading: boolean;
    onSelect: (tab: ProfileTab) => void;
}) {
    const t = useTranslations();
    const { locale } = useI18n();
    const fmt = useMemo(
        () => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }),
        [locale]
    );

    return (
        <div className="grid grid-cols-4 gap-2 px-4">
            {STATS.map(({ key, labelKey, tab }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onSelect(tab)}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-border bg-card py-3 transition-colors hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98] cursor-pointer"
                >
                    <span className="font-mono text-lg font-bold text-foreground tabular-nums">
                        {isLoading || !stats ? '—' : fmt.format(stats[key])}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t(labelKey)}
                    </span>
                </button>
            ))}
        </div>
    );
}
