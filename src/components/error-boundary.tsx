'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
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
                <div className="flex flex-col items-center justify-center h-full w-full p-6 bg-background text-foreground">
                    <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>

                        <h2 className="text-xl font-bold">Something went wrong</h2>

                        <p className="text-muted-foreground text-sm">
                            We encountered an unexpected error. Please try again.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg overflow-auto max-w-full">
                                {this.state.error.message}
                            </pre>
                        )}

                        <Button
                            onClick={this.handleRetry}
                            className="gap-2 mt-2 bg-bronze text-white hover:bg-bronze/90"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </Button>
                    </div>
                </div>
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
    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>

                <h2 className="text-xl font-bold">Oops!</h2>
                <p className="text-muted-foreground text-sm">{message}</p>

                <Button
                    onClick={onRetry}
                    className="gap-2 mt-2 bg-bronze text-white hover:bg-bronze/90"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </Button>
            </div>
        </div>
    );
}
