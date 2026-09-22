import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
    getMarketingMetadata,
    getMarketingPage,
    MarketingDocumentPage,
    marketingPageSlugs,
} from '../marketing-document';

export function generateStaticParams() {
    return marketingPageSlugs.map((slug) => ({ locale: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const metadata = getMarketingMetadata(locale);
    if (!metadata) notFound();
    return metadata;
}

export default async function MarketingDocumentRoute({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    if (!getMarketingPage(locale)) notFound();
    return <MarketingDocumentPage slug={locale} />;
}
