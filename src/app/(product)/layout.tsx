import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Providers } from '@/components/providers';
import { NowPlayingProvider } from '@/components/now-playing-provider';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { getMessages, getLocaleFromCookies } from '@/lib/i18n';

export const metadata: Metadata = {
    title: 'Wahb - Discover Audio & News',
    description: 'Mobile-first social platform with audio-first Pods and magazine-style News.',
};

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const locale = getLocaleFromCookies(cookieStore.toString());
    const messages = await getMessages(locale);

    return (
        <Providers initialLocale={locale} initialMessages={messages}>
            <div className="flex min-h-screen max-w-md mx-auto flex-col border-x border-border relative bg-background shadow-2xl">
                <main className="flex-1">
                    {children}
                </main>
            </div>
            <NowPlayingProvider />
            <GlobalNowPlayingBar />
        </Providers>
    );
}
