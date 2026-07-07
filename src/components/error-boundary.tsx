'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

function DefaultErrorFallback({
    error,
    onRetry,
}: {
    error?: Error;
    onRetry: () => void;
}) {
    const t = useTranslations();

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 bg-background text-foreground">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>

                <h2 className="text-xl font-bold">{t('errors.global.title')}</h2>

                <p className="text-muted-foreground text-sm">
                    {t('errors.global.description')}
                </p>

                {process.env.NODE_ENV === 'development' && error && (
                    <pre className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg overflow-auto max-w-full">
                        {error.message}
                    </pre>
                )}

                <Button
                    onClick={onRetry}
                    className="gap-2 mt-2 bg-news-accent text-white hover:bg-news-accent/90"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t('errors.global.tryAgain')}
                </Button>
            </div>
        </div>
    );
}

/**
 * Error boundary component with retry functionality
 * Catches JavaScript errors in child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <DefaultErrorFallback
                    error={this.state.error}
                    onRetry={this.handleRetry}
                />
            );
        }

        return this.props.children;
    }
}

/**
 * Feed-specific error fallback component
 */
export function FeedErrorFallback({
    onRetry,
    message = 'Failed to load feed'
}: {
    onRetry: () => void;
    message?: string;
}) {
    const t = useTranslations();
    const resolvedMessage = message === 'Failed to load feed'
        ? t('feed.error.title')
        : message;
    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>

                <h2 className="text-xl font-bold">{t('feed.error.title')}</h2>
                <p className="text-muted-foreground text-sm">{resolvedMessage}</p>

                <Button
                    onClick={onRetry}
                    className="gap-2 mt-2 bg-news-accent text-white hover:bg-news-accent/90"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t('feed.error.retry')}
                </Button>
            </div>
        </div>
    );
}
