import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export type MarketingPageSlug = 'plus' | 'about' | 'press' | 'careers';
export type MarketingLocale = 'ar' | 'en';

type MarketingSection = {
    heading: string;
    body: string;
};

type MarketingPage = {
    label: string;
    title: string;
    accent: string;
    intro: string;
    visual: 'plus' | 'about' | 'press' | 'careers';
    visualLabel: string;
    visualMeta: string;
    visualTitle: string;
    visualItems: Array<{ label: string; value: string }>;
    sections: MarketingSection[];
    cta: string;
    ctaHref: string;
    ctaExternal?: boolean;
    metadata: { title: string; description: string };
};

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toArabicNumber(value: number): string {
    return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)] ?? digit).padStart(2, '٠');
}

const marketingPages: Record<MarketingPageSlug, MarketingPage> = {
    plus: {
        label: 'المنتج · ٠٤',
        title: 'تجربةٌ أوسع،',
        accent: 'حين يحين وقتها.',
        intro: 'وَهب+ مساحةٌ مستقبلية لمزايا إضافية حول الاستماع والقراءة. نعلن تفاصيلها عندما تكتمل التجربة وتصبح جاهزةً لك.',
        visual: 'plus',
        visualLabel: 'بطاقة وَهب+ مستقبلية تعرض سمعيات والأخبار كمساحتين متكاملتين',
        visualMeta: 'قريباً',
        visualTitle: 'وَهب+',
        visualItems: [
            { label: 'سمعيات', value: 'اكتشافٌ صوتيّ' },
            { label: 'الأخبار', value: 'قراءةٌ في سياقها' },
        ],
        sections: [
            {
                heading: 'المنتج أولاً',
                body: 'لا نعدك بميزاتٍ لم تكتمل بعد. نطوّر وَهب+ على مهل، بحيث تضيف إلى وَهب قيمةً حقيقية لا طبقةً أخرى من التعقيد.',
            },
            {
                heading: 'ابقَ قريباً',
                body: 'سجّل اهتمامك من صفحة الإطلاق، وسنخبرك عندما تصبح التجربة متاحة.',
            },
        ],
        cta: 'سجّل اهتمامك',
        ctaHref: '/#download',
        metadata: {
            title: 'وَهب+ — قريباً',
            description: 'تعرّف على وَهب+، التوسعة المستقبلية لتجربة وَهب الصوتية والإخبارية.',
        },
    },
    about: {
        label: 'الشركة · ٠١',
        title: 'نصنع مساحةً',
        accent: 'لما يستحقّ وقتك.',
        intro: 'وَهب منصةٌ عربية لاكتشاف المقاطع الصوتية والقصص الإخبارية؛ تبدأ منها مباشرةً، وتقلب حتى تجد ما يستحقّ أن تتوقف عنده.',
        visual: 'about',
        visualLabel: 'معاينة مبسطة لمساحتي سمعيات والأخبار داخل وَهب',
        visualMeta: 'منصةٌ واحدة',
        visualTitle: 'استمع · اقرأ',
        visualItems: [
            { label: 'سمعيات', value: 'مقاطعٌ صوتيةٌ تُكتشف بالتقليب' },
            { label: 'الأخبار', value: 'قصصٌ تُقرأ ضمن سياقها' },
        ],
        sections: [
            {
                heading: 'سمعيات',
                body: 'خلاصةٌ صوتيةٌ تعرض المقاطع والفصول القابلة للاستماع فوراً، مع نصٍّ متزامن حين يتوفّر.',
            },
            {
                heading: 'الأخبار',
                body: 'شريحةٌ إخباريةٌ تجمع القصة الرئيسية والتغطيات المتصلة، لتقرأ الحدث من أكثر من زاوية.',
            },
        ],
        cta: 'جرّب وَهب',
        ctaHref: '/app',
        metadata: {
            title: 'عن وَهب',
            description: 'وَهب منصة عربية لاكتشاف المقاطع الصوتية والقصص الإخبارية.',
        },
    },
    press: {
        label: 'الشركة · ٠٣',
        title: 'نبذةٌ',
        accent: 'عن وَهب.',
        intro: 'وَهب منصةٌ عربية تضع الاستماع والقراءة في خلاصةٍ واحدة: مقاطع صوتية تُكتشف بالتقليب، وأخبار تُقرأ في سياقها.',
        visual: 'press',
        visualLabel: 'بطاقة معلومات صحفية مختصرة عن وَهب',
        visualMeta: 'معلومات صحفية',
        visualTitle: 'وَهْب',
        visualItems: [
            { label: 'التركيز', value: 'الصوت · الأخبار' },
            { label: 'اللغة', value: 'العربية أولاً' },
            { label: 'الحالة', value: 'قريباً' },
        ],
        sections: [
            {
                heading: 'عن المنتج',
                body: 'يقدّم وَهب تجربتين متكاملتين: سمعيات للمقاطع الصوتية والفصول، والأخبار لقصصٍ تجمع الخبر وما يتصل به.',
            },
            {
                heading: 'للاستفسارات الصحفية',
                body: 'للحصول على نبذة أو معلومات إضافية، راسل فريق وَهب عبر البريد أدناه.',
            },
        ],
        cta: 'salehwleed1@gmail.com',
        ctaHref: 'mailto:salehwleed1@gmail.com',
        ctaExternal: true,
        metadata: {
            title: 'الصحافة — وَهب',
            description: 'نبذة صحفية مختصرة عن منصة وَهب للصوت والأخبار.',
        },
    },
    careers: {
        label: 'الشركة · ٠٤',
        title: 'نبني بهدوء،',
        accent: 'ونفتح الباب حين نجهز.',
        intro: 'وَهب في مرحلة بناء مبكرة. لا توجد وظائف معلنة حالياً، لكننا نرحّب بالتعارف مع من يهتم ببناء تجربة عربية أفضل للاستماع والقراءة.',
        visual: 'careers',
        visualLabel: 'بطاقة حالة التوظيف في وَهب تعرض عدم وجود وظائف معلنة حالياً',
        visualMeta: 'الفريق',
        visualTitle: 'لا توجد وظائف معلنة',
        visualItems: [
            { label: 'الآن', value: 'نبني المنتج الأساسي' },
            { label: 'لاحقاً', value: 'نعلن الفرص هنا' },
        ],
        sections: [
            {
                heading: 'الوضع الحالي',
                body: 'نركّز الآن على صقل تجربة سمعيات والأخبار، وعلى جعل الاكتشاف سريعاً وواضحاً ومفيداً.',
            },
            {
                heading: 'حين نفتح فرصة',
                body: 'ستظهر الوظائف هنا مع وصفها الكامل. إلى ذلك الحين، يمكنك مشاركة نبذة عنك عبر البريد.',
            },
        ],
        cta: 'تواصل معنا',
        ctaHref: 'mailto:salehwleed1@gmail.com',
        ctaExternal: true,
        metadata: {
            title: 'الوظائف — وَهب',
            description: 'تعرّف على حالة التوظيف الحالية في وَهب.',
        },
    },
};

const chromeCopy = {
    ar: {
        home: 'العودة إلى وَهب',
        preview: 'معاينة',
        product: 'المنتج',
        company: 'الشركة',
        legal: 'قانوني',
        features: 'المزايا',
        how: 'كيف تعمل',
        soon: 'قريباً',
        plus: 'وَهب+',
        about: 'عنّا',
        chapters: 'الحلقات الطويلة',
        press: 'الصحافة',
        careers: 'الوظائف',
        privacy: 'سياسة الخصوصيّة',
        terms: 'شروط الاستخدام',
        copyright: 'حقوق المؤلّف',
        contact: 'تواصل',
        copyrightLine: '© ٢٠٢٦ وَهْب · جميع الحقوق محفوظة',
    },
    en: {
        home: 'Back to Wahb',
        preview: 'Preview',
        product: 'Product',
        company: 'Company',
        legal: 'Legal',
        features: 'Features',
        how: 'How it works',
        soon: 'Coming soon',
        plus: 'Wahb+',
        about: 'About',
        chapters: 'Long-form chapters',
        press: 'Press',
        careers: 'Careers',
        privacy: 'Privacy policy',
        terms: 'Terms of use',
        copyright: 'Copyright',
        contact: 'Contact',
        copyrightLine: '© 2026 Wahb · All rights reserved',
    },
} as const;

export function MarketingChrome({ children, locale = 'ar' }: { children: React.ReactNode; locale?: MarketingLocale }) {
    const copy = chromeCopy[locale];
    const isArabic = locale === 'ar';

    return (
        <div className="wahb-marketing-doc" lang={locale} dir={isArabic ? 'rtl' : 'ltr'}>
            <header className="marketing-doc__nav">
                <div className="marketing-doc__nav-inner">
                    <Link className="marketing-doc__brand" href="/" aria-label={copy.home}>
                        <Image src="/images/wahb_app_icon.png" alt="وَهْب" width={38} height={38} priority />
                        <span>وَهْب</span>
                    </Link>
                    <div className="marketing-doc__nav-actions">
                        <Link className="marketing-doc__home-link" href="/">
                            {copy.home}
                        </Link>
                        <Link className="marketing-doc__preview" href="/app">
                            {copy.preview}
                        </Link>
                    </div>
                </div>
            </header>

            {children}

            <footer className="marketing-doc__footer">
                <div className="marketing-doc__footer-inner">
                    <Link className="marketing-doc__footer-brand" href="/">
                        <Image src="/images/wahb_app_icon.png" alt="وَهْب" width={34} height={34} />
                        <span>وَهْب</span>
                    </Link>
                    <nav className="marketing-doc__footer-links" aria-label={isArabic ? 'روابط وَهب' : 'Wahb links'}>
                        <div>
                            <span>{copy.product}</span>
                            <Link href="/#features">{copy.features}</Link>
                            <Link href="/#how">{copy.how}</Link>
                            <Link href="/#download">{copy.soon}</Link>
                            <Link href="/plus">{copy.plus}</Link>
                        </div>
                        <div>
                            <span>{copy.company}</span>
                            <Link href="/about">{copy.about}</Link>
                            <Link href="/#chapters">{copy.chapters}</Link>
                            <Link href="/press">{copy.press}</Link>
                            <Link href="/careers">{copy.careers}</Link>
                        </div>
                        <div>
                            <span>{copy.legal}</span>
                            <Link href={`/${locale}/privacy`}>{copy.privacy}</Link>
                            <Link href={`/${locale}/terms`}>{copy.terms}</Link>
                            <Link href={`/${locale}/copyright`}>{copy.copyright}</Link>
                            <a href="mailto:salehwleed1@gmail.com">{copy.contact}</a>
                        </div>
                    </nav>
                </div>
                <div className="marketing-doc__footer-bottom">
                    <span>{copy.copyrightLine}</span>
                    <a href="mailto:salehwleed1@gmail.com">salehwleed1@gmail.com</a>
                </div>
            </footer>
        </div>
    );
}

function MarketingVisual({ page }: { page: MarketingPage }) {
    return (
        <div className={`marketing-doc__visual marketing-doc__visual--${page.visual}`} role="img" aria-label={page.visualLabel}>
            <div className="marketing-doc__visual-glow" aria-hidden="true" />
            <div className="marketing-doc__visual-card">
                <div className="marketing-doc__visual-topline">
                    <span>{page.visualMeta}</span>
                    <span className="marketing-doc__visual-dot" aria-hidden="true" />
                </div>
                <div className="marketing-doc__visual-title">{page.visualTitle}</div>
                <div className="marketing-doc__visual-rule" aria-hidden="true" />
                <div className="marketing-doc__visual-items">
                    {page.visualItems.map((item) => (
                        <div className="marketing-doc__visual-item" key={item.label}>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>
                    ))}
                </div>
                <div className="marketing-doc__visual-wave" aria-hidden="true">
                    {Array.from({ length: 13 }, (_, index) => <i key={index} style={{ height: `${22 + ((index * 17) % 42)}%` }} />)}
                </div>
            </div>
            <span className="marketing-doc__visual-stamp" aria-hidden="true">وَهْب</span>
        </div>
    );
}

export function getMarketingPage(slug: string): MarketingPage | undefined {
    return marketingPages[slug as MarketingPageSlug];
}

export function getMarketingMetadata(slug: string) {
    return getMarketingPage(slug)?.metadata;
}

export function MarketingDocumentPage({ slug }: { slug: string }) {
    const page = getMarketingPage(slug);
    if (!page) notFound();

    return (
        <MarketingChrome>
            <main className="marketing-doc__main" data-marketing-page={slug}>
                <div className="marketing-doc__container">
                    <section className="marketing-doc__hero" aria-labelledby="marketing-doc-title">
                        <div className="marketing-doc__hero-copy">
                            <span className="marketing-doc__eyebrow">{page.label}</span>
                            <h1 id="marketing-doc-title">
                                {page.title}<br />
                                <em>{page.accent}</em>
                            </h1>
                            <p>{page.intro}</p>
                            <div className="marketing-doc__actions">
                                {page.ctaExternal ? (
                                    <a className="marketing-doc__primary" href={page.ctaHref}>{page.cta}</a>
                                ) : (
                                    <Link className="marketing-doc__primary" href={page.ctaHref}>{page.cta}</Link>
                                )}
                                <Link className="marketing-doc__secondary" href="/">العودة إلى الصفحة الرئيسية</Link>
                            </div>
                        </div>
                        <MarketingVisual page={page} />
                    </section>

                    <section className="marketing-doc__sections" aria-label="تفاصيل الصفحة">
                        {page.sections.map((section, index) => (
                            <article className="marketing-doc__section" key={section.heading}>
                                <span className="marketing-doc__section-number">{toArabicNumber(index + 1)}</span>
                                <div>
                                    <h2>{section.heading}</h2>
                                    <p>{section.body}</p>
                                </div>
                            </article>
                        ))}
                    </section>
                </div>
            </main>
        </MarketingChrome>
    );
}

export const marketingPageSlugs = Object.keys(marketingPages) as MarketingPageSlug[];
