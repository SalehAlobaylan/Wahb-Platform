'use client';

import { type ReactNode } from 'react';
import { AlertCircle, type LucideIcon } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

/** Initial-load skeleton shared by the library tabs. */
export function TabSkeleton() {
    return (
        <div className="px-5 space-y-3 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-3 flex gap-3 items-center border border-border animate-pulse">
                    <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-2.5 bg-muted rounded w-16" />
                        <div className="h-3.5 bg-muted rounded w-3/4" />
                        <div className="h-2.5 bg-muted rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Editorial centered empty-state. */
export function TabEmpty({
    icon: Icon,
    title,
    body,
    action,
}: {
    icon: LucideIcon;
    title: string;
    body?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center px-8 pt-16 pb-10 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card">
                <Icon className="h-8 w-8 text-news-accent/60" />
            </div>
            <h2 className="mb-2 font-serif text-xl font-medium text-foreground">{title}</h2>
            {body && <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">{body}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

/** Error state with a retry button. */
export function TabError({ message, onRetry }: { message: string; onRetry: () => void }) {
    const t = useTranslations();
    return (
        <div className="flex flex-col items-center justify-center py-16 px-5 text-center gap-3">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{message}</p>
            <button
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
            >
                {t('settings.history.retry')}
            </button>
        </div>
    );
}
