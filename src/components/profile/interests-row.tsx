'use client';

import { Sparkles, Globe, Lightbulb, Cpu, ChevronRight } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

const INTEREST_ICON_BY_LABEL: Record<string, typeof Sparkles> = {
    AI: Sparkles,
    SAUDI: Globe,
    INNOVATION: Lightbulb,
    TECH: Cpu,
};

function iconForInterest(label: string): typeof Sparkles {
    return INTEREST_ICON_BY_LABEL[label.replace(/^#/, '').toUpperCase()] ?? Sparkles;
}

/**
 * Horizontally-scrollable interest chips. Tapping any chip (or the trailing
 * chevron) opens the interests editor.
 */
export function InterestsRow({
    interests,
    onEdit,
}: {
    interests: string[];
    onEdit: () => void;
}) {
    const t = useTranslations();
    if (interests.length === 0) return null;

    return (
        <div className="relative group">
            <div className="flex gap-2 p-4 pe-10 overflow-x-auto hide-scrollbar scroll-smooth">
                {interests.map((interest, idx) => {
                    const Icon = iconForInterest(interest);
                    return (
                        <button
                            key={`${interest}-${idx}`}
                            onClick={onEdit}
                            className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-card px-4 border border-border transition-colors hover:border-primary/30 hover:bg-primary/10 group/chip cursor-pointer"
                        >
                            <Icon className="w-4 h-4 text-muted-foreground group-hover/chip:text-primary transition-colors" />
                            <span className="text-foreground group-hover/chip:text-primary text-xs font-bold tracking-wide transition-colors">
                                #{interest.replace(/^#/, '')}
                            </span>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={onEdit}
                aria-label={t('profile.interests.edit')}
                className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground cursor-pointer shadow-sm hover:bg-muted transition-colors"
            >
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </button>
        </div>
    );
}
