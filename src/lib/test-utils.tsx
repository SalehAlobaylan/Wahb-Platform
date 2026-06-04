import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider, type Locale } from '@/lib/i18n';
import enMessages from '@/messages/en.json';

type Messages = Record<string, string>;

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
    locale?: Locale;
    messages?: Messages;
}

/**
 * Render a component with the providers feed components depend on at runtime:
 * React Query (mutation/query hooks) and i18n. Defaults to English messages so
 * tests can assert against readable strings.
 */
export function renderWithProviders(ui: ReactElement, options: ProviderOptions = {}) {
    const { locale = 'en', messages = enMessages as Messages, ...renderOptions } = options;

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <I18nProvider value={{ locale, messages, setLocale: () => {} }}>
                    {children}
                </I18nProvider>
            </QueryClientProvider>
        );
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}
