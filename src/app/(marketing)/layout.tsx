import type { Metadata, Viewport } from 'next';
import './landing.css';

export const metadata: Metadata = {
    title: 'وَهْب — Wahb · Audio & News',
    description: 'استمع. اقرأ. اكتشف. منصة الصوت والأخبار للعالم العربي.',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#0b0b0b',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
