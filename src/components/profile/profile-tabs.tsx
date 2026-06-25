'use client';

import { Bookmark, Heart, Clock, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';

export type ProfileTab = 'saved' | 'likes' | 'history' | 'creations';

const TABS: Array<{ key: ProfileTab; labelKey: string; icon: typeof Bookmark }> = [
    { key: 'saved', labelKey: 'profile.tab.saved', icon: Bookmark },
    { key: 'likes', labelKey: 'profile.tab.likes', icon: Heart },
    { key: 'history', labelKey: 'profile.tab.history', icon: Clock },
    { key: 'creations', labelKey: 'profile.tab.creations', icon: LayoutGrid },
];

/**
 * Sticky underline tab strip for the profile library (Saved · Likes · History
 * · Creations).
 */
export function ProfileTabs({
    active,
    onChange,
}: {
    active: ProfileTab;
    onChange: (tab: ProfileTab) => void;
}) {
    const t = useTranslations();
    return (
        <div
            role="tablist"
            aria-label={t('profile.title')}
            className="sticky top-14 z-10 flex border-b border-border bg-background/95 backdrop-blur-md px-2"
        >
            {TABS.map(({ key, labelKey, icon: Icon }) => {
                const isActive = active === key;
                return (
                    <button
                        key={key}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(key)}
                        className={cn(
                            'flex flex-1 flex-col items-center justify-center gap-1 pb-2.5 pt-3 transition-colors',
                            isActive
                                ? 'border-b-2 border-primary text-primary'
                                : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t(labelKey)}</span>
                    </button>
                );
            })}
        </div>
    );
}
