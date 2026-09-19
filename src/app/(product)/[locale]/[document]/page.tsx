import { notFound } from "next/navigation";

type LegalDocument =
  | "privacy"
  | "terms"
  | "community-guidelines"
  | "support"
  | "reporting"
  | "licenses";

type Copy = {
  title: string;
  updated: string;
  sections: Array<{ heading: string; body: string }>;
};

const legalDocuments = new Set<LegalDocument>([
  "privacy",
  "terms",
  "community-guidelines",
  "support",
  "reporting",
  "licenses",
]);

const english: Record<LegalDocument, Copy> = {
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: July 22, 2026",
    sections: [
      {
        heading: "What Wahb processes",
        body: "Wahb processes account details, the content and interactions needed to provide the service, and technical information required to keep the app reliable and secure.",
      },
      {
        heading: "How it is used",
        body: "We use this information to operate the feeds, preserve your settings and saved items, prevent abuse, respond to support requests, and meet legal obligations.",
      },
      {
        heading: "Your choices",
        body: "You can browse without an account. Signed-in users can manage settings and permanently delete their account from the Wahb app. Deletion revokes access immediately and removes the IAM identity and Wahb product data asynchronously.",
      },
      {
        heading: "Contact",
        body: "For privacy questions or requests, use the Support & contact page in this section.",
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    updated: "Last updated: July 22, 2026",
    sections: [
      {
        heading: "Using Wahb",
        body: "Use Wahb lawfully and respectfully. Do not attempt to disrupt the service, bypass controls, impersonate others, or use the service to harm people.",
      },
      {
        heading: "Content",
        body: "Content may be supplied by third parties and can change or be removed. Wahb does not guarantee that all material is complete, current, or suitable for every purpose.",
      },
      {
        heading: "Accounts",
        body: "Keep your credentials private and provide accurate account information. We may limit or suspend access where necessary to protect people, the service, or comply with law.",
      },
      {
        heading: "Changes",
        body: "We may update these terms as the service evolves. Continued use after a material update is subject to the updated terms.",
      },
    ],
  },
  "community-guidelines": {
    title: "Community Guidelines",
    updated: "Last updated: July 22, 2026",
    sections: [
      {
        heading: "Be respectful",
        body: "Do not post harassment, threats, hateful conduct, sexual exploitation, or content that targets people for protected characteristics.",
      },
      {
        heading: "Keep discussion safe",
        body: "Do not post unlawful content, scams, doxxing, malicious links, spam, or material that infringes another person’s rights.",
      },
      {
        heading: "Comments and reports",
        body: "Comments are moderated. You can report content or comments from the app. We may remove content, restrict accounts, or take other action when these guidelines are violated.",
      },
    ],
  },
  support: {
    title: "Support & Contact",
    updated: "Last updated: July 22, 2026",
    sections: [
      {
        heading: "Get help",
        body: "For account access, billing, privacy, accessibility, or technical support, contact the Wahb team at support@salehspace.dev.",
      },
      {
        heading: "Include the essentials",
        body: "Tell us the email associated with your account when relevant, your app version, device model, and a short description of the issue. Never send your password or one-time verification links.",
      },
    ],
  },
  reporting: {
    title: "Reporting Information",
    updated: "Last updated: July 22, 2026",
    sections: [
      {
        heading: "Report in the app",
        body: "Open the content or comment actions and choose Report. You can report harmful or inappropriate content, misinformation, copyright concerns, broken media, incorrect language or translation, or another issue with a short explanation.",
      },
      {
        heading: "What happens next",
        body: "Reported content is hidden pods immediately where applicable and is sent to the moderation workflow for review. Reporting does not guarantee removal, but it helps us investigate.",
      },
      {
        heading: "Urgent risk",
        body: "Wahb is not an emergency service. If someone is in immediate danger, contact local emergency services.",
      },
    ],
  },
  licenses: {
    title: "Open-Source Licenses",
    updated: "Last updated: July 22, 2026",
    sections: [
      {
        heading: "Mobile app",
        body: "The Wahb mobile app uses Expo, React Native, Expo Router, TanStack Query, i18next, Zod, Lucide, Sentry, and their transitive dependencies under their respective open-source licenses.",
      },
      {
        heading: "Web service",
        body: "The Wahb web service uses Next.js, React, Tailwind CSS, Lucide, and their transitive dependencies under their respective open-source licenses.",
      },
      {
        heading: "Source notices",
        body: "The complete dependency manifests and license texts are available in the public Wahb-Mobile and Wahb-Platform source repositories. Contact support if you need a specific notice.",
      },
    ],
  },
};

const arabic: Record<LegalDocument, Copy> = {
  privacy: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: ٢٢ يوليو ٢٠٢٦",
    sections: [
      {
        heading: "ما الذي تعالجه وهب",
        body: "تعالج وهب تفاصيل الحساب والمحتوى والتفاعلات اللازمة لتقديم الخدمة والمعلومات التقنية اللازمة للحفاظ على موثوقية التطبيق وأمانه.",
      },
      {
        heading: "كيف نستخدمها",
        body: "نستخدم هذه المعلومات لتشغيل الموجزات وحفظ إعداداتك ومحفوظاتك ومنع الإساءة والاستجابة لطلبات الدعم والوفاء بالالتزامات القانونية.",
      },
      {
        heading: "خياراتك",
        body: "يمكنك التصفح بلا حساب. يستطيع المستخدم المسجل إدارة الإعدادات وحذف الحساب نهائيًا من تطبيق وهب. يلغي الحذف الوصول فورًا ثم يحذف الهوية وبيانات المنتج بشكل غير متزامن.",
      },
      {
        heading: "التواصل",
        body: "لاستفسارات الخصوصية أو طلباتها استخدم صفحة الدعم والتواصل في هذا القسم.",
      },
    ],
  },
  terms: {
    title: "شروط الاستخدام",
    updated: "آخر تحديث: ٢٢ يوليو ٢٠٢٦",
    sections: [
      {
        heading: "استخدام وهب",
        body: "استخدم وهب بطريقة قانونية ومحترمة. لا تحاول تعطيل الخدمة أو تجاوز ضوابطها أو انتحال الآخرين أو استخدام الخدمة لإيذاء الناس.",
      },
      {
        heading: "المحتوى",
        body: "قد يأتي المحتوى من أطراف ثالثة وقد يتغير أو يُزال. لا تضمن وهب اكتمال كل المواد أو حداثتها أو ملاءمتها لكل غرض.",
      },
      {
        heading: "الحسابات",
        body: "حافظ على سرية بيانات اعتمادك وقدّم معلومات حساب دقيقة. قد نقيّد الوصول أو نعلقه عند الحاجة لحماية الأشخاص أو الخدمة أو الامتثال للقانون.",
      },
      {
        heading: "التغييرات",
        body: "قد نحدّث هذه الشروط مع تطور الخدمة. يخضع استمرار الاستخدام بعد أي تحديث جوهري للشروط المحدثة.",
      },
    ],
  },
  "community-guidelines": {
    title: "إرشادات المجتمع",
    updated: "آخر تحديث: ٢٢ يوليو ٢٠٢٦",
    sections: [
      {
        heading: "كن محترمًا",
        body: "لا تنشر مضايقات أو تهديدات أو كراهية أو استغلالًا جنسيًا أو محتوى يستهدف الناس بسبب خصائصهم المحمية.",
      },
      {
        heading: "حافظ على سلامة النقاش",
        body: "لا تنشر محتوى غير قانوني أو احتيالات أو كشفًا لبيانات شخصية أو روابط ضارة أو رسائل مزعجة أو مواد تنتهك حقوق الآخرين.",
      },
      {
        heading: "التعليقات والبلاغات",
        body: "تخضع التعليقات للإشراف. يمكنك الإبلاغ عن المحتوى أو التعليقات من التطبيق. قد نزيل المحتوى أو نقيّد الحسابات أو نتخذ إجراءات أخرى عند مخالفة هذه الإرشادات.",
      },
    ],
  },
  support: {
    title: "الدعم والتواصل",
    updated: "آخر تحديث: ٢٢ يوليو ٢٠٢٦",
    sections: [
      {
        heading: "احصل على المساعدة",
        body: "للحصول على دعم الوصول للحساب أو الخصوصية أو إمكانية الوصول أو الدعم التقني، تواصل مع فريق وهب عبر support@salehspace.dev.",
      },
      {
        heading: "أرسل المعلومات الأساسية",
        body: "اذكر البريد المرتبط بحسابك عند الحاجة وإصدار التطبيق وطراز الجهاز ووصفًا مختصرًا للمشكلة. لا ترسل كلمة مرورك أو روابط التحقق المؤقتة.",
      },
    ],
  },
  reporting: {
    title: "معلومات الإبلاغ",
    updated: "آخر تحديث: ٢٢ يوليو ٢٠٢٦",
    sections: [
      {
        heading: "أبلغ من التطبيق",
        body: "افتح إجراءات المحتوى أو التعليق واختر «إبلاغ». يمكنك الإبلاغ عن محتوى ضار أو غير مناسب أو تضليل أو حقوق نشر أو وسائط معطلة أو لغة أو ترجمة غير صحيحة أو مشكلة أخرى.",
      },
      {
        heading: "ما الذي يحدث لاحقًا",
        body: "يُخفى المحتوى المبلّغ عنه عنك فورًا عند الاقتضاء ويُرسل إلى مسار الإشراف للمراجعة. لا يضمن الإبلاغ الإزالة، لكنه يساعدنا على التحقيق.",
      },
      {
        heading: "الخطر العاجل",
        body: "وهب ليست خدمة طوارئ. إذا كان شخص ما في خطر فوري، فاتصل بخدمات الطوارئ المحلية.",
      },
    ],
  },
  licenses: {
    title: "تراخيص المصادر المفتوحة",
    updated: "آخر تحديث: ٢٢ يوليو ٢٠٢٦",
    sections: [
      {
        heading: "تطبيق الجوال",
        body: "يستخدم تطبيق وهب للجوال Expo وReact Native وExpo Router وTanStack Query وi18next وZod وLucide وSentry وتبعياتها وفق تراخيص المصادر المفتوحة الخاصة بها.",
      },
      {
        heading: "خدمة الويب",
        body: "تستخدم خدمة وهب على الويب Next.js وReact وTailwind CSS وLucide وتبعياتها وفق تراخيص المصادر المفتوحة الخاصة بها.",
      },
      {
        heading: "إشعارات المصدر",
        body: "تتوفر ملفات التبعيات الكاملة ونصوص التراخيص في مستودعي Wahb-Mobile وWahb-Platform العامين. تواصل مع الدعم إذا احتجت إشعارًا محددًا.",
      },
    ],
  },
};

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; document: string }>;
}) {
  const { document, locale } = await params;
  if (
    (locale !== "ar" && locale !== "en") ||
    !legalDocuments.has(document as LegalDocument)
  )
    notFound();
  const copy = (locale === "ar" ? arabic : english)[document as LegalDocument];
  const isArabic = locale === "ar";

  return (
    <article
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-5 py-10 text-foreground"
    >
      <div className="mx-auto max-w-2xl border border-foreground bg-card p-6 sm:p-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Wahb
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight">
          {copy.title}
        </h1>
        <p className="mt-3 border-b border-foreground pb-6 text-sm text-muted-foreground">
          {copy.updated}
        </p>
        <div className="mt-8 space-y-7">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl font-bold">
                {section.heading}
              </h2>
              <p className="mt-2 whitespace-pre-line leading-7 text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
