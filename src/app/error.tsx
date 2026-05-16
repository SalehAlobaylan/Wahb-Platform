'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Catches uncaught errors thrown by server/client components anywhere in
 * the app router and renders a retry surface. Mirrors the visual language
 * of FeedErrorFallback but lives at the route boundary so a feed error
 * doesn't unmount the whole shell.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
    const t = useTranslations();
    useEffect(() => {
        // Server logs already get the error via Next's logger; surface it
        // to the browser console so devs see the stack without hunting.
        console.error('App error boundary caught:', error);
    }, [error]);

    const isDev = process.env.NODE_ENV === 'development';

    return (
        <div className="flex min-h-dvh w-full items-center justify-center bg-background px-6 text-foreground">
            <div className="max-w-md w-full flex flex-col items-center gap-6 text-center">
                <div className="size-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>

                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-serif font-bold">{t('errors.global.title')}</h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('errors.global.description')}
                    </p>
                    {isDev && (
                        <p className="mt-3 break-words rounded-lg border border-border bg-card px-3 py-2 text-left text-xs font-mono text-red-400/90">
                            {error.message}
                            {error.digest && (
                                <span className="block mt-1 text-muted-foreground">
                                    digest: {error.digest}
                                </span>
                            )}
                        </p>
                    )}
                </div>

                <div className="flex w-full gap-3">
                    <button
                        onClick={reset}
                        className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('errors.global.tryAgain')}
                    </button>
                    <Link
                        href="/"
                        className="flex-1 h-11 rounded-xl border border-border bg-card text-foreground text-sm font-semibold flex items-center justify-center hover:bg-muted active:scale-[0.98] transition-all"
                    >
                        {t('errors.global.goHome')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
