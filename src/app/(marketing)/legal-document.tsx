import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingChrome, type MarketingLocale } from './marketing-document';

export type LegalDocument =
    | 'privacy'
    | 'terms'
    | 'community-guidelines'
    | 'support'
    | 'reporting'
    | 'licenses'
    | 'copyright';

type LegalCopy = {
    title: string;
    updated: string;
    description: string;
    sections: Array<{ heading: string; body: string }>;
};

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function formatSectionNumber(value: number, locale: MarketingLocale): string {
    const number = String(value).padStart(2, '0');
    return locale === 'ar'
        ? number.replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)] ?? digit)
        : number;
}

export const legalDocuments: LegalDocument[] = [
    'privacy',
    'terms',
    'community-guidelines',
    'support',
    'reporting',
    'licenses',
    'copyright',
];

const english: Record<LegalDocument, LegalCopy> = {
    privacy: {
        title: 'Privacy Policy',
        updated: 'Last updated: July 22, 2026',
        description: 'A concise explanation of the information Wahb uses to provide the service and protect your account.',
        sections: [
            {
                heading: 'What Wahb processes',
                body: 'Wahb processes account details, the content and interactions needed to provide the service, and technical information required to keep the app reliable and secure.',
            },
            {
                heading: 'How it is used',
                body: 'We use this information to operate the feeds, preserve your settings and saved items, prevent abuse, respond to support requests, and meet legal obligations.',
            },
            {
                heading: 'Your choices',
                body: 'You can browse without an account. Signed-in users can manage settings and permanently delete their account from the Wahb app. Deletion revokes access immediately and removes the IAM identity and Wahb product data asynchronously.',
            },
            {
                heading: 'Contact',
                body: 'For privacy questions or requests, contact salehwleed1@gmail.com.',
            },
        ],
    },
    terms: {
        title: 'Terms of Use',
        updated: 'Last updated: July 22, 2026',
        description: 'The basic terms for using Wahb responsibly and respectfully.',
        sections: [
            {
                heading: 'Using Wahb',
                body: 'Use Wahb lawfully and respectfully. Do not attempt to disrupt the service, bypass controls, impersonate others, or use the service to harm people.',
            },
            {
                heading: 'Content',
                body: 'Content may be supplied by third parties and can change or be removed. Wahb does not guarantee that all material is complete, current, or suitable for every purpose.',
            },
            {
                heading: 'Accounts',
                body: 'Keep your credentials private and provide accurate account information. We may limit or suspend access where necessary to protect people, the service, or comply with law.',
            },
            {
                heading: 'Changes',
                body: 'We may update these terms as the service evolves. Continued use after a material update is subject to the updated terms.',
            },
        ],
    },
    'community-guidelines': {
        title: 'Community Guidelines',
        updated: 'Last updated: July 22, 2026',
        description: 'The principles that keep discussion and participation on Wahb safe.',
        sections: [
            {
                heading: 'Be respectful',
                body: 'Do not post harassment, threats, hateful conduct, sexual exploitation, or content that targets people for protected characteristics.',
            },
            {
                heading: 'Keep discussion safe',
                body: 'Do not post unlawful content, scams, doxxing, malicious links, spam, or material that infringes another person’s rights.',
            },
            {
                heading: 'Comments and reports',
                body: 'Comments are moderated. You can report content or comments from the app. We may remove content, restrict accounts, or take other action when these guidelines are violated.',
            },
        ],
    },
    support: {
        title: 'Support & Contact',
        updated: 'Last updated: July 22, 2026',
        description: 'A direct line for account, privacy, accessibility, and technical questions.',
        sections: [
            {
                heading: 'Get help',
                body: 'For account access, privacy, accessibility, or technical support, contact the Wahb team at salehwleed1@gmail.com.',
            },
            {
                heading: 'Include the essentials',
                body: 'Tell us the email associated with your account when relevant, your app version, device model, and a short description of the issue. Never send your password or one-time verification links.',
            },
        ],
    },
    reporting: {
        title: 'Reporting Information',
        updated: 'Last updated: July 22, 2026',
        description: 'How to report harmful, inaccurate, broken, or rights-infringing material.',
        sections: [
            {
                heading: 'Report in the app',
                body: 'Open the content or comment actions and choose Report. You can report harmful or inappropriate content, misinformation, copyright concerns, broken media, incorrect language or translation, or another issue with a short explanation.',
            },
            {
                heading: 'What happens next',
                body: 'Reported content is hidden from your view immediately where applicable and is sent to the moderation workflow for review. Reporting does not guarantee removal, but it helps us investigate.',
            },
            {
                heading: 'Urgent risk',
                body: 'Wahb is not an emergency service. If someone is in immediate danger, contact local emergency services.',
            },
        ],
    },
    licenses: {
        title: 'Open-Source Licenses',
        updated: 'Last updated: July 22, 2026',
        description: 'Notes about the open-source software used by Wahb.',
        sections: [
            {
                heading: 'Mobile app',
                body: 'The Wahb mobile app uses Expo, React Native, Expo Router, TanStack Query, i18next, Zod, Lucide, Sentry, and their transitive dependencies under their respective open-source licenses.',
            },
            {
                heading: 'Web service',
                body: 'The Wahb web service uses Next.js, React, Tailwind CSS, Lucide, and their transitive dependencies under their respective open-source licenses.',
            },
            {
                heading: 'Source notices',
                body: 'The complete dependency manifests and license texts are available in the public Wahb-Mobile and Wahb-Platform source repositories. Contact salehwleed1@gmail.com if you need a specific notice.',
            },
        ],
    },
    copyright: {
        title: 'Copyright',
        updated: 'Last updated: July 22, 2026',
        description: 'Information for rights holders and anyone who wants to raise a copyright concern.',
        sections: [
            {
                heading: 'Respect for original work',
                body: 'Wahb identifies the original source of audio, video, articles, and other material whenever that information is available. Content remains subject to the rights of its original owners.',
            },
            {
                heading: 'A concern or request',
                body: 'If you own or represent rights in material shown on Wahb and believe it has been used incorrectly, send the source, the work in question, and a clear explanation to salehwleed1@gmail.com.',
            },
            {
                heading: 'What to expect',
                body: 'We review complete requests and may restrict, update, or remove material when appropriate. We may ask for information that confirms your relationship to the rights holder.',
            },
        ],
    },
};

const arabic: Record<LegalDocument, LegalCopy> = {
    privacy: {
        title: 'سياسة الخصوصية',
        updated: 'آخر تحديث: ٢٢ يوليو ٢٠٢٦',
        description: 'توضيح مختصر للمعلومات التي تستخدمها وَهب لتقديم الخدمة وحماية حسابك.',
        sections: [
            {
                heading: 'ما الذي تعالجه وَهب',
                body: 'تعالج وَهب تفاصيل الحساب والمحتوى والتفاعلات اللازمة لتقديم الخدمة والمعلومات التقنية اللازمة للحفاظ على موثوقية التطبيق وأمانه.',
            },
            {
                heading: 'كيف نستخدمها',
                body: 'نستخدم هذه المعلومات لتشغيل الموجزات وحفظ إعداداتك ومحفوظاتك ومنع الإساءة والاستجابة لطلبات الدعم والوفاء بالالتزامات القانونية.',
            },
            {
                heading: 'خياراتك',
                body: 'يمكنك التصفح بلا حساب. يستطيع المستخدم المسجل إدارة الإعدادات وحذف الحساب نهائيًا من تطبيق وَهب. يلغي الحذف الوصول فورًا ثم يحذف الهوية وبيانات المنتج بشكل غير متزامن.',
            },
            {
                heading: 'التواصل',
                body: 'لاستفسارات الخصوصية أو طلباتها، تواصل عبر salehwleed1@gmail.com.',
            },
        ],
    },
    terms: {
        title: 'شروط الاستخدام',
        updated: 'آخر تحديث: ٢٢ يوليو ٢٠٢٦',
        description: 'القواعد الأساسية لاستخدام وَهب بطريقة قانونية ومحترمة.',
        sections: [
            {
                heading: 'استخدام وَهب',
                body: 'استخدم وَهب بطريقة قانونية ومحترمة. لا تحاول تعطيل الخدمة أو تجاوز ضوابطها أو انتحال الآخرين أو استخدام الخدمة لإيذاء الناس.',
            },
            {
                heading: 'المحتوى',
                body: 'قد يأتي المحتوى من أطراف ثالثة وقد يتغير أو يُزال. لا تضمن وَهب اكتمال كل المواد أو حداثتها أو ملاءمتها لكل غرض.',
            },
            {
                heading: 'الحسابات',
                body: 'حافظ على سرية بيانات اعتمادك وقدّم معلومات حساب دقيقة. قد نقيّد الوصول أو نعلقه عند الحاجة لحماية الأشخاص أو الخدمة أو الامتثال للقانون.',
            },
            {
                heading: 'التغييرات',
                body: 'قد نحدّث هذه الشروط مع تطور الخدمة. يخضع استمرار الاستخدام بعد أي تحديث جوهري للشروط المحدثة.',
            },
        ],
    },
    'community-guidelines': {
        title: 'إرشادات المجتمع',
        updated: 'آخر تحديث: ٢٢ يوليو ٢٠٢٦',
        description: 'مبادئ تساعد على إبقاء النقاش والمشاركة في وَهب آمنين.',
        sections: [
            {
                heading: 'كن محترمًا',
                body: 'لا تنشر مضايقات أو تهديدات أو كراهية أو استغلالًا جنسيًا أو محتوى يستهدف الناس بسبب خصائصهم المحمية.',
            },
            {
                heading: 'حافظ على سلامة النقاش',
                body: 'لا تنشر محتوى غير قانوني أو احتيالات أو كشفًا لبيانات شخصية أو روابط ضارة أو رسائل مزعجة أو مواد تنتهك حقوق الآخرين.',
            },
            {
                heading: 'التعليقات والبلاغات',
                body: 'تخضع التعليقات للإشراف. يمكنك الإبلاغ عن المحتوى أو التعليقات من التطبيق. قد نزيل المحتوى أو نقيّد الحسابات أو نتخذ إجراءات أخرى عند مخالفة هذه الإرشادات.',
            },
        ],
    },
    support: {
        title: 'الدعم والتواصل',
        updated: 'آخر تحديث: ٢٢ يوليو ٢٠٢٦',
        description: 'وسيلة مباشرة لأسئلة الحساب والخصوصية وإمكانية الوصول والدعم التقني.',
        sections: [
            {
                heading: 'احصل على المساعدة',
                body: 'للحصول على دعم الوصول للحساب أو الخصوصية أو إمكانية الوصول أو الدعم التقني، تواصل مع فريق وَهب عبر salehwleed1@gmail.com.',
            },
            {
                heading: 'أرسل المعلومات الأساسية',
                body: 'اذكر البريد المرتبط بحسابك عند الحاجة وإصدار التطبيق وطراز الجهاز ووصفًا مختصرًا للمشكلة. لا ترسل كلمة مرورك أو روابط التحقق المؤقتة.',
            },
        ],
    },
    reporting: {
        title: 'معلومات الإبلاغ',
        updated: 'آخر تحديث: ٢٢ يوليو ٢٠٢٦',
        description: 'كيف تبلغ عن مادة ضارة أو غير دقيقة أو معطلة أو منتهكة للحقوق.',
        sections: [
            {
                heading: 'أبلغ من التطبيق',
                body: 'افتح إجراءات المحتوى أو التعليق واختر «إبلاغ». يمكنك الإبلاغ عن محتوى ضار أو غير مناسب أو تضليل أو حقوق نشر أو وسائط معطلة أو لغة أو ترجمة غير صحيحة أو مشكلة أخرى.',
            },
            {
                heading: 'ما الذي يحدث لاحقًا',
                body: 'يُخفى المحتوى المبلّغ عنه عنك فورًا عند الاقتضاء ويُرسل إلى مسار الإشراف للمراجعة. لا يضمن الإبلاغ الإزالة، لكنه يساعدنا على التحقيق.',
            },
            {
                heading: 'الخطر العاجل',
                body: 'وَهب ليست خدمة طوارئ. إذا كان شخص ما في خطر فوري، فاتصل بخدمات الطوارئ المحلية.',
            },
        ],
    },
    licenses: {
        title: 'تراخيص المصادر المفتوحة',
        updated: 'آخر تحديث: ٢٢ يوليو ٢٠٢٦',
        description: 'ملاحظات حول البرمجيات مفتوحة المصدر التي تستخدمها وَهب.',
        sections: [
            {
                heading: 'تطبيق الجوال',
                body: 'يستخدم تطبيق وَهب للجوال Expo وReact Native وExpo Router وTanStack Query وi18next وZod وLucide وSentry وتبعياتها وفق تراخيص المصادر المفتوحة الخاصة بها.',
            },
            {
                heading: 'خدمة الويب',
                body: 'تستخدم خدمة وَهب على الويب Next.js وReact وTailwind CSS وLucide وتبعياتها وفق تراخيص المصادر المفتوحة الخاصة بها.',
            },
            {
                heading: 'إشعارات المصدر',
                body: 'تتوفر ملفات التبعيات الكاملة ونصوص التراخيص في مستودعي Wahb-Mobile وWahb-Platform العامين. تواصل مع salehwleed1@gmail.com إذا احتجت إشعارًا محددًا.',
            },
        ],
    },
    copyright: {
        title: 'حقوق المؤلّف',
        updated: 'آخر تحديث: ٢٢ يوليو ٢٠٢٦',
        description: 'معلومات لأصحاب الحقوق ولكل من يريد رفع ملاحظة تتعلق بحقوق المؤلف.',
        sections: [
            {
                heading: 'احترام العمل الأصلي',
                body: 'تذكر وَهب مصدر الصوت أو الفيديو أو المقال أو المادة الأخرى كلما توفرت معلوماته. ويبقى المحتوى خاضعًا لحقوق مالكيه الأصليين.',
            },
            {
                heading: 'ملاحظة أو طلب',
                body: 'إذا كنت تملك حقوق مادة تظهر في وَهب أو تمثّل مالكها وتعتقد أنها استُخدمت بطريقة غير صحيحة، فأرسل المصدر والمادة وشرحًا واضحًا إلى salehwleed1@gmail.com.',
            },
            {
                heading: 'ما الذي تتوقعه',
                body: 'نراجع الطلبات المكتملة، وقد نقيّد المادة أو نحدّثها أو نزيلها عند الاقتضاء. وقد نطلب معلومات تثبت صلتك بصاحب الحقوق.',
            },
        ],
    },
};

function isLegalDocument(value: string): value is LegalDocument {
    return legalDocuments.includes(value as LegalDocument);
}

export function getLegalCopy(locale: MarketingLocale, document: string): LegalCopy | undefined {
    if (!isLegalDocument(document)) return undefined;
    return (locale === 'ar' ? arabic : english)[document];
}

export function getLegalMetadata(locale: MarketingLocale, document: string) {
    const copy = getLegalCopy(locale, document);
    if (!copy) return undefined;
    return {
        title: `${copy.title} — وَهب`,
        description: copy.description,
    };
}

export function LegalDocumentPage({ locale, document }: { locale: MarketingLocale; document: string }) {
    const copy = getLegalCopy(locale, document);
    if (!copy) notFound();

    const isArabic = locale === 'ar';
    const related = isArabic
        ? [
            { href: '/ar/privacy', label: 'الخصوصية' },
            { href: '/ar/terms', label: 'الشروط' },
            { href: '/ar/copyright', label: 'حقوق المؤلّف' },
        ]
        : [
            { href: '/en/privacy', label: 'Privacy' },
            { href: '/en/terms', label: 'Terms' },
            { href: '/en/copyright', label: 'Copyright' },
        ];

    return (
        <MarketingChrome locale={locale}>
            <main className="wahb-marketing-legal" data-legal-document={document}>
                <div className="wahb-marketing-legal__container">
                    <header className="wahb-marketing-legal__hero">
                        <span className="wahb-marketing-legal__eyebrow">{isArabic ? 'وَهب · الوثائق' : 'Wahb · Documents'}</span>
                        <h1>{copy.title}</h1>
                        <p>{copy.description}</p>
                        <time>{copy.updated}</time>
                    </header>

                    <article className="wahb-marketing-legal__article">
                        {copy.sections.map((section, index) => (
                            <section className="wahb-marketing-legal__section" key={section.heading}>
                                <span className="wahb-marketing-legal__number">{formatSectionNumber(index + 1, locale)}</span>
                                <div>
                                    <h2>{section.heading}</h2>
                                    <p>{section.body}</p>
                                </div>
                            </section>
                        ))}
                    </article>

                    <nav className="wahb-marketing-legal__related" aria-label={isArabic ? 'وثائق ذات صلة' : 'Related documents'}>
                        <span>{isArabic ? 'وثائق ذات صلة' : 'Related documents'}</span>
                        {related.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
                    </nav>
                </div>
            </main>
        </MarketingChrome>
    );
}
