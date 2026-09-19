import type { Metadata } from 'next';
import LandingPage from './landing-page';

export const metadata: Metadata = {
    title: 'وَهْب — Wahb · Audio & News',
    description: 'استمع. اقرأ. اكتشف. منصة الصوت والأخبار للعالم العربي.',
};

export default function MarketingHomePage() {
    return <LandingPage />;
}
