import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
    getLegalCopy,
    getLegalMetadata,
    LegalDocumentPage,
    legalDocuments,
    type LegalDocument,
} from '../../legal-document';
import type { MarketingLocale } from '../../marketing-document';

const locales: MarketingLocale[] = ['ar', 'en'];

export function generateStaticParams() {
    return locales.flatMap((locale) => legalDocuments.map((document) => ({ locale, document })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; document: string }> }): Promise<Metadata> {
    const { locale, document } = await params;
    if (!locales.includes(locale as MarketingLocale) || !getLegalCopy(locale as MarketingLocale, document)) notFound();
    return getLegalMetadata(locale as MarketingLocale, document) ?? {};
}

export default async function MarketingLegalRoute({ params }: { params: Promise<{ locale: string; document: string }> }) {
    const { locale, document } = await params;
    if (!locales.includes(locale as MarketingLocale) || !legalDocuments.includes(document as LegalDocument)) notFound();
    return <LegalDocumentPage locale={locale as MarketingLocale} document={document} />;
}
