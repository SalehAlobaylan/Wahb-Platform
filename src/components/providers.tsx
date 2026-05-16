'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider, useLocale, type Locale } from '@/lib/i18n';
import { useState, type ReactNode } from 'react';
import { useUser } from '@/lib/hooks/use-auth';

const IS_DEV = process.env.NODE_ENV === 'development';

interface ProvidersProps {
    children: ReactNode;
    initialLocale?: Locale;
    initialMessages?: Record<string, string>;
}

function AuthHydrator() {
    useUser();
    return null;
}

export function Providers({ children, initialLocale, initialMessages }: ProvidersProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // With SSR, we usually want to set some default staleTime
                        // above 0 to avoid refetching immediately on the client
                        staleTime: 60 * 1000,
                        // Retry once on failure
                        retry: 1,
                        // Refetch on window focus for fresh data
                        refetchOnWindowFocus: true,
                    },
                },
            })
    );

    const locale = initialLocale ?? 'ar';
    const messages = initialMessages ?? {};
    const localeState = useLocale(locale, messages);

    return (
        <ThemeProvider>
            <I18nProvider value={{ locale: localeState.locale, messages: localeState.messages, setLocale: localeState.setLocale }}>
                <QueryClientProvider client={queryClient}>
                    <AuthHydrator />
                    {children}
                    {/* Global toast surface. position=top-center so notifications
                        don't collide with the bottom nav / now-playing bar. */}
                    <Toaster position="top-center" richColors closeButton />
                    {/* React Query devtools are dev-only — exclude them from the
                        production bundle to keep payload size down. */}
                    {IS_DEV && <ReactQueryDevtools initialIsOpen={false} />}
                </QueryClientProvider>
            </I18nProvider>
        </ThemeProvider>
    );
}
