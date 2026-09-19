'use client';

import { useEffect, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';

type PhoneView = 'pods' | 'news';
const PHONE_CARD_COUNT = 3;

const isPhoneView = (value: string | undefined): value is PhoneView => value === 'pods' || value === 'news';

const setPhoneCard = (root: HTMLElement, view: PhoneView, index: number) => {
    const cardIndex = Math.min(Math.max(0, index), PHONE_CARD_COUNT - 1);
    const phone = root.querySelector<HTMLElement>('[data-phone-preview]');
    phone?.setAttribute('data-phone-card-index', String(cardIndex));

    const panel = root.querySelector<HTMLElement>(`[data-phone-panel="${view}"]`);
    if (!panel) return;
    panel.setAttribute('data-phone-card-index', String(cardIndex));
    panel.setAttribute('aria-label', `معاينة ${view === 'pods' ? 'بودز' : 'الأخبار'}، البطاقة ${cardIndex + 1} من ${PHONE_CARD_COUNT}`);
    panel.querySelectorAll<HTMLElement>('[data-phone-card]').forEach((card) => {
        const isActive = Number(card.dataset.phoneCard) === cardIndex;
        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-hidden', String(!isActive));
    });
    panel.querySelectorAll<HTMLElement>('[data-phone-progress]').forEach((step) => {
        const isActive = Number(step.dataset.phoneProgress) === cardIndex;
        step.classList.toggle('is-active', isActive);
        step.setAttribute('aria-current', isActive ? 'step' : 'false');
    });
};

const setPhoneView = (root: HTMLElement, view: PhoneView) => {
    root.querySelector<HTMLElement>('[data-phone-preview]')?.setAttribute('data-phone-state', view);
    root.querySelectorAll<HTMLButtonElement>('[data-phone-view]').forEach((button) => {
        const isActive = button.dataset.phoneView === view;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', String(isActive));
        button.tabIndex = isActive ? 0 : -1;
    });
    root.querySelectorAll<HTMLElement>('[data-phone-panel]').forEach((panel) => {
        const isActive = panel.dataset.phonePanel === view;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', String(!isActive));
    });
    root.querySelectorAll<HTMLElement>('[data-phone-annotations]').forEach((annotationSet) => {
        const isActive = annotationSet.dataset.phoneAnnotations === view;
        annotationSet.classList.toggle('is-active', isActive);
        annotationSet.setAttribute('aria-hidden', String(!isActive));
    });
    setPhoneCard(root, view, 0);
};

const LANDING_MARKUP = String.raw`

<!-- ═════════════════ NAV ═════════════════ -->
<nav class="nav" aria-label="التنقّل الرئيسي" data-screen-label="00 Nav">
  <div class="container nav__inner">
    <a href="#" class="nav__brand">
      <img src="/images/wahb_app_icon.png" alt="وَهْب" width="36" height="36">
      <span class="nav__brand-name">وَهْب</span>
    </a>
    <div class="nav__links">
      <a href="#features">المنصة</a>
      <a href="#how">كيف تعمل</a>
      <a href="#showcase">المحتوى</a>
      <a href="#creators">للمبدعين</a>
      <a href="#faq">الأسئلة</a>
    </div>
    <div class="nav__cta">
      <a href="/app" class="btn btn--gold landing-preview" data-preview-link>معاينة</a>
<a href="#download" class="btn btn--ghost">تسجيل الدخول</a>
      <a href="#download" class="btn btn--gold">قريباً</a>
    </div>
  </div>
</nav>

<!-- ═════════════════ HERO ═════════════════ -->
<header class="hero" data-screen-label="01 Hero">
  <div class="hero__halo"></div>
  <div class="hero__grain"></div>
  <div class="container hero__inner">
    <div class="hero__copy">
      <div class="hero__pill">
        <span class="dot"></span>
        <span>BETA · 1.0 · صوت وأخبار</span>
      </div>

      <h1 class="display hero__title">
        <span class="ar">اِسمَع</span>
        <span class="ar"><span class="stroke">المنطقة</span></span>
        <span class="ar">كما لم <span class="accent">تَسمَعها</span>.</span>
      </h1>

      <p class="hero__sub">
        خلاصةٌ يوميّةٌ من البودكاست والأخبار القصيرة — مُختارةٌ بعنايةٍ للأذن العربيّة،
        تُقرأ كما تُسمَع، وتُحفظ كما تُروى. كلّ المحتوى في مكانٍ واحد، عمودياً، بلا ضوضاء.
      </p>

      <div class="hero__cta">
        <a href="#download" class="hero__store">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          <div>
            <div class="hero__store__sub">قريباً على</div>
            <div class="hero__store__main">App Store</div>
          </div>
        </a>
        <a href="#download" class="hero__store">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.205 12l2.493-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z"/></svg>
          <div>
            <div class="hero__store__sub">قريباً على</div>
            <div class="hero__store__main">Google Play</div>
          </div>
        </a>
      </div>

      <div class="hero__meta">
        <div class="hero__meta-item">
          <div class="hero__meta-num">٠</div>
          <div class="hero__meta-lbl">مستمع شهري</div>
        </div>
        <div class="hero__meta-item">
          <div class="hero__meta-num">٠</div>
          <div class="hero__meta-lbl">حلقة بودكاست</div>
        </div>
        <div class="hero__meta-item">
          <div class="hero__meta-num">٠</div>
          <div class="hero__meta-lbl">تقييم المتجر</div>
        </div>
      </div>
    </div>

    <!-- Phone mockup demonstrating Wahb's vertical discovery feeds -->
    <div class="phone-stage">
      <div class="phone-stage__annotations is-active" data-phone-annotations="pods" aria-hidden="false">
        <div class="phone-stage__annot phone-stage__annot--tl">
          <span>ثلاث محطّات، تمريرٌ واحد</span>
          <span class="line"></span>
        </div>
        <div class="phone-stage__annot phone-stage__annot--tr">
          <span class="line"></span>
          <span>وضع النص الحيّ</span>
        </div>
        <div class="phone-stage__annot phone-stage__annot--bl">
          <span>تشغيل خلفي</span>
          <span class="line"></span>
        </div>
      </div>
      <div class="phone-stage__annotations" data-phone-annotations="news" aria-hidden="true">
        <div class="phone-stage__annot phone-stage__annot--tl">
          <span>قصصٌ يوميّةٌ تُكتشف عموديّاً</span>
          <span class="line"></span>
        </div>
        <div class="phone-stage__annot phone-stage__annot--tr">
          <span class="line"></span>
          <span>مصادر موثوقة</span>
        </div>
        <div class="phone-stage__annot phone-stage__annot--bl">
          <span>اقرأ في ثلاث دقائق</span>
          <span class="line"></span>
        </div>
      </div>

      <div class="phone-stage__switcher" role="tablist" aria-label="اختَر نوع المعاينة">
        <button id="phone-tab-pods" class="phone-stage__tab is-active" type="button" role="tab" aria-selected="true" aria-controls="phone-preview-pods" data-phone-view="pods">
          <span>لك</span><small>PODS</small>
        </button>
        <button id="phone-tab-news" class="phone-stage__tab" type="button" role="tab" aria-selected="false" aria-controls="phone-preview-news" data-phone-view="news" tabindex="-1">
          <span>الأخبار</span><small>NEWS</small>
        </button>
      </div>

      <div class="phone" data-phone-preview data-phone-state="pods" data-phone-card-index="0">
        <div class="phone__notch"></div>
        <div class="phone__screen">
          <div id="phone-preview-pods" class="phone__view phone__view--pods is-active" role="tabpanel" aria-labelledby="phone-tab-pods" aria-label="معاينة بودز، البطاقة 1 من 3" aria-hidden="false" data-phone-panel="pods" data-phone-card-index="0">
            <div class="phone__pods-track">
              <article class="phone__pods-card phone__pods-card--mokhtalif is-active" data-phone-card="0" aria-hidden="false">
                <div class="phone__overlay"></div>
                <div class="phone__title-area">
                  <span class="phone__title-ar">أروقة</span>
                  <div class="phone__title-sub">لماذا تعلّمك الكتابة<br>ما لا تعلّمك الحياة</div>
                  <div class="phone__stats"><span>حلقة جديدة</span><span>·</span><span>٤٧:٣١</span></div>
                </div>
                <div class="phone__play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                <div class="phone__bottom">
                  <div class="phone__badges"><span class="phone__badge phone__badge--outline">إذاعة مختلف</span><span class="phone__badge phone__badge--gold">PODCAST</span></div>
                  <div class="phone__caption">الكتابةُ طريقةٌ أخرى لفهم الذات</div>
                  <div class="phone__author">أروقة · إذاعة مختلف · ١٢ نوفمبر</div>
                  <div class="phone__progress"><i style="width:34%"></i></div>
                  <div class="phone__time"><span>١٦:٠٩</span><span>٤٧:٣١</span></div>
                </div>
              </article>
              <article class="phone__pods-card phone__pods-card--night" data-phone-card="1" aria-hidden="true">
                <div class="phone__overlay"></div>
                <div class="phone__orb phone__orb--moon"></div>
                <div class="phone__title-area">
                  <span class="phone__title-ar">سوالف بزنس</span>
                  <div class="phone__title-sub">كيف تبني فكرةً تعيش</div>
                  <div class="phone__stats"><span>حلقة ٤٧</span><span>·</span><span>٣٦:٢٢</span></div>
                </div>
                <div class="phone__play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                <div class="phone__bottom">
                  <div class="phone__badges"><span class="phone__badge phone__badge--outline">صوت</span><span class="phone__badge phone__badge--gold">PODCAST</span></div>
                  <div class="phone__caption">المسافة بين الفكرة وأوّل خطوة</div>
                  <div class="phone__author">سوالف بزنس · اليوم</div>
                  <div class="phone__progress"><i style="width:62%"></i></div>
                  <div class="phone__time"><span>٢٢:٣١</span><span>٣٦:٢٢</span></div>
                </div>
              </article>
              <article class="phone__pods-card phone__pods-card--dawn" data-phone-card="2" aria-hidden="true">
                <div class="phone__overlay"></div>
                <div class="phone__orb phone__orb--sun"></div>
                <div class="phone__title-area">
                  <span class="phone__title-ar">فنجان</span>
                  <div class="phone__title-sub">أن نصنع وقتاً لأنفسنا</div>
                  <div class="phone__stats"><span>حديث صباحي</span><span>·</span><span>٢٨:٠٥</span></div>
                </div>
                <div class="phone__play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                <div class="phone__bottom">
                  <div class="phone__badges"><span class="phone__badge phone__badge--outline">أثير</span><span class="phone__badge phone__badge--gold">AUDIO</span></div>
                  <div class="phone__caption">هل نملك وقتنا، أم يملكه يومنا؟</div>
                  <div class="phone__author">فنجان · منذ ساعتين</div>
                  <div class="phone__progress"><i style="width:21%"></i></div>
                  <div class="phone__time"><span>٠٥:٤٨</span><span>٢٨:٠٥</span></div>
                </div>
              </article>
            </div>
            <div class="phone__header">
              <span class="phone__icon-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              </span>
              <div class="phone__tabs">
                <div class="phone__tab">المحفوظات</div>
                <div class="phone__tab">الأخبار</div>
                <div class="phone__tab is-active">لك</div>
              </div>
              <span class="phone__icon-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </span>
            </div>
            <div class="phone__side-rail">
              <span class="phone__rail-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
              </span>
              <span class="phone__rail-btn is-on" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </span>
              <span class="phone__rail-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
              </span>
            </div>

            <div class="phone__fab">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
            <div class="phone__feed-progress" aria-label="تقدّم معاينة بودز">
              <span class="is-active" data-phone-progress="0" aria-current="step"></span><span data-phone-progress="1" aria-current="false"></span><span data-phone-progress="2" aria-current="false"></span>
            </div>
          </div>

          <div id="phone-preview-news" class="phone__view phone__view--news" role="tabpanel" aria-labelledby="phone-tab-news" aria-label="معاينة الأخبار، البطاقة 1 من 3" aria-hidden="true" data-phone-panel="news" data-phone-card-index="0">
            <nav class="phone__news-header" aria-label="التنقّل الرئيسي">
              <span class="phone__icon-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              </span>
              <div class="phone__tabs">
                <div class="phone__tab">المحفوظات</div>
                <div class="phone__tab is-active">الأخبار</div>
                <div class="phone__tab">لك</div>
              </div>
              <span class="phone__icon-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </span>
            </nav>
            <div class="phone__news-track">
              <article class="phone__news-card is-active" data-phone-card="0" aria-hidden="false">
                <div class="phone__news-topbar"><span class="phone__news-mark">وَهْب</span><span class="phone__news-date">١٢ نوفمبر ٢٠٢٦</span><span class="phone__news-menu">•••</span></div>
                <div class="phone__news-heading"><div class="phone__news-eyebrow">THE WAHB DAILY · الأخبار</div><div class="phone__news-rule"></div><h3>السعودية توقّع<br>اتّفاقاً تاريخياً</h3><p>قراءةٌ مختارة، من مصادر موثوقة، في ثلاث دقائق.</p></div>
                <div class="phone__news-art"><span class="phone__news-art-sun"></span><span class="phone__news-art-arch"></span><span class="phone__news-art-line phone__news-art-line--one"></span><span class="phone__news-art-line phone__news-art-line--two"></span></div>
                <div class="phone__news-meta">REUTERS · 3M READ</div>
                <div class="phone__news-list"><article><span class="phone__news-index">٠٢</span><div><strong>الرياض تعلن حزمةً جديدةً للابتكار</strong><small>اقتصاد · ٤ دقائق</small></div></article><article><span class="phone__news-index">٠٣</span><div><strong>مشاريع الطاقة المتجددة تتوسّع</strong><small>بيئة · ٦ دقائق</small></div></article></div>
              </article>
              <article class="phone__news-card phone__news-card--sea" data-phone-card="1" aria-hidden="true">
                <div class="phone__news-topbar"><span class="phone__news-mark">وَهْب</span><span class="phone__news-date">اليوم</span><span class="phone__news-menu">•••</span></div>
                <div class="phone__news-heading"><div class="phone__news-eyebrow">البيئة · THE WAHB DAILY</div><div class="phone__news-rule"></div><h3>مشاريعُ الطاقة<br>تفتح أفقاً جديداً</h3><p>ما الذي يتغيّر في المدن حين تصبح الطاقة أنظف؟</p></div>
                <div class="phone__news-art phone__news-art--sea"><span class="phone__news-art-sun"></span><span class="phone__news-art-arch"></span><span class="phone__news-art-line phone__news-art-line--one"></span><span class="phone__news-art-line phone__news-art-line--two"></span></div>
                <div class="phone__news-meta">ARAB NEWS · 4M READ</div>
                <div class="phone__news-list"><article><span class="phone__news-index">٠٢</span><div><strong>محطات شمسية تدعم نموّ الصناعات</strong><small>طاقة · ٥ دقائق</small></div></article><article><span class="phone__news-index">٠٣</span><div><strong>مبادرات جديدة لخفض الانبعاثات</strong><small>مناخ · ٣ دقائق</small></div></article></div>
              </article>
              <article class="phone__news-card phone__news-card--city" data-phone-card="2" aria-hidden="true">
                <div class="phone__news-topbar"><span class="phone__news-mark">وَهْب</span><span class="phone__news-date">١١ نوفمبر ٢٠٢٦</span><span class="phone__news-menu">•••</span></div>
                <div class="phone__news-heading"><div class="phone__news-eyebrow">مجتمع · THE WAHB DAILY</div><div class="phone__news-rule"></div><h3>النقل الذكيّ<br>يعيد رسم المدينة</h3><p>رحلات أقصر، ومدنٌ أقرب إلى ناسها.</p></div>
                <div class="phone__news-art phone__news-art--city"><span class="phone__news-art-sun"></span><span class="phone__news-art-arch"></span><span class="phone__news-art-line phone__news-art-line--one"></span><span class="phone__news-art-line phone__news-art-line--two"></span></div>
                <div class="phone__news-meta">SPA · 3M READ</div>
                <div class="phone__news-list"><article><span class="phone__news-index">٠٢</span><div><strong>مساراتٌ جديدة تصل الأحياء ببعضها</strong><small>مدن · ٤ دقائق</small></div></article><article><span class="phone__news-index">٠٣</span><div><strong>تصميم حضريّ يقدّم المشاة أولاً</strong><small>حياة · ٦ دقائق</small></div></article></div>
              </article>
            </div>
            <div class="phone__feed-progress phone__feed-progress--news" aria-label="تقدّم معاينة الأخبار"><span class="is-active" data-phone-progress="0" aria-current="step"></span><span data-phone-progress="1" aria-current="false"></span><span data-phone-progress="2" aria-current="false"></span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</header>

<!-- ═════════════════ MARQUEE ═════════════════ -->
<section class="marquee" aria-hidden="true">
  <div class="marquee__track">
    <div class="marquee__item"><span class="ar">بودكاست</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">Editorial</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">أخبار</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">Listen</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">قصص قصيرة</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">Transcript</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">مقالات</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">For You</span><span class="dot"></span></div>
    <!-- duplicate for seamless loop -->
    <div class="marquee__item"><span class="ar">بودكاست</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">Editorial</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">أخبار</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">Listen</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">قصص قصيرة</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">Transcript</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">مقالات</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">For You</span><span class="dot"></span></div>
  </div>
</section>

<!-- ═════════════════ FEATURES ═════════════════ -->
<section class="section section--dark features" id="features" data-screen-label="02 Features">
  <div class="container">
    <div class="features__header">
      <div>
        <div class="eyebrow">المنصّة · The Platform</div>
        <h2 class="features__title" style="margin-top:16px">
          ثلاثُ تجارب،<br>
          <span class="serif" style="color:var(--gold)">قصّةٌ واحدة.</span>
        </h2>
      </div>
      <p class="features__lead">
        وَهب ليس تطبيقاً واحداً — بل ثلاث طبقات تكميليّة:
        خلاصةٌ صوتيّةٌ عموديّة، صحيفةٌ إلكترونيّةٌ بمزاج عصريّ، ووضعُ قراءةٍ يتزامن
        مع كلّ كلمةٍ تُقال.
      </p>
    </div>

    <div class="features__grid">
      <article class="feature">
        <div class="feature__num">۰۱ — FOR YOU</div>
        <div class="feature__viz viz-foryou"></div>
        <div class="feature__title">
          <span class="ar">لك</span>
          <span class="en">Vertical Audio Feed</span>
        </div>
        <p class="feature__desc">
          تصفّحٌ عموديّ بنمط TikTok للبودكاست والمقاطع الصوتية.
          اسحب للأعلى، استمع، تخطّ، احفظ. كلّ ذلك بسلاسة.
        </p>
      </article>

      <article class="feature">
        <div class="feature__num">۰۲ — NEWS</div>
        <div class="feature__viz viz-news">
          <div class="viz-news__hdr">THE WAHB DAILY</div>
          <div class="viz-news__rule"></div>
          <div class="viz-news__head">السعودية توقّع اتّفاقاً تاريخياً مع</div>
          <div class="viz-news__meta">REUTERS · 3M READ</div>
        </div>
        <div class="feature__title">
          <span class="ar">الأخبار</span>
          <span class="en">Editorial Magazine</span>
        </div>
        <p class="feature__desc">
          صحيفةٌ يوميّةٌ بطباعةٍ كلاسيكيّة. عناوينُ مختارة، مقالاتٌ ذات صلة،
          ومزاج Newsprint لا يُنسى.
        </p>
      </article>

      <article class="feature">
        <div class="feature__num">۰۳ — TRANSCRIPT</div>
        <div class="feature__viz viz-transcript">
          <div class="seg"><span class="ts">٠٠:١٠</span>في الزحام اليوميّ</div>
          <div class="seg is-active"><span class="ts">٠٠:١٤</span>نَنسى الإصغاء</div>
          <div class="seg"><span class="ts">٠٠:١٨</span>إلى أنفسنا</div>
        </div>
        <div class="feature__title">
          <span class="ar">النّصّ الحيّ</span>
          <span class="en">Live Karaoke Transcript</span>
        </div>
        <p class="feature__desc">
          اقرأ كما تُسمَع: كلُّ مقطعٍ يتضخّمُ في وقته، وتبهت الكلماتُ المحيطة.
          قابلٌ للمشاركة، قابلٌ للحفظ.
        </p>
      </article>
    </div>
  </div>
</section>

<!-- ═════════════════ HOW IT WORKS ═════════════════ -->
<section class="section section--cream how" id="how" data-screen-label="03 How">
  <div class="container">
    <div class="features__header">
      <div>
        <div class="eyebrow">كيف تعمل · How It Works</div>
        <h2 class="features__title" style="margin-top:16px;color:var(--color-navy)">
          ثلاثُ خطواتٍ<br>
          <span class="serif" style="color:var(--gold)">لتفتح أُذنيك.</span>
        </h2>
      </div>
      <p class="features__lead">
        لا تسجيلَ معقّداً، لا إعلانات، لا خوارزميّاتٍ ضبابيّة.
        فقط محتوىً مُختارٌ يدويّاً، يتحسّن كلّما استمعت أكثر.
      </p>
    </div>

    <div class="how__grid">
      <div class="how__step">
        <div class="how__num">١</div>
        <h3 class="how__title">
          <span class="ar">قريباً — سجّل اهتمامك.</span>
          <span class="en">Coming Soon — Join the Waitlist</span>
        </h3>
        <p class="how__desc">
          سجّل عبر الإيميل ليصلك الخبر فور الإطلاق، أو عُد قريباً
          لتبدأ خلاصتك بمجرّد الفتح.
        </p>
      </div>

      <div class="how__step">
        <div class="how__num">٢</div>
        <h3 class="how__title">
          <span class="ar">اختر اهتماماتك.</span>
          <span class="en">Pick Your Interests</span>
        </h3>
        <p class="how__desc">
          ثقافة، سياسة، تقنية، اقتصاد، أدب، روحانيّات.
          اختَر ما يلامسك، وستجد خلاصتَك تتشكّلُ من حولك خلال أيّامٍ معدودة.
        </p>
      </div>

      <div class="how__step">
        <div class="how__num">٣</div>
        <h3 class="how__title">
          <span class="ar">اِسمع، اقرأ، احفظ.</span>
          <span class="en">Listen, Read, Save</span>
        </h3>
        <p class="how__desc">
          اسحب للأعلى لمتابعة الخلاصة، اضغط مرّتين للحفظ، حوّل إلى وضع النّصّ
          لقراءة ما تستمعُ إليه. الأمرُ بهذه البساطة.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════ CONTENT SHOWCASE ═════════════════ -->
<section class="section section--ink showcase" id="showcase" data-screen-label="04 Showcase">
  <div class="container">
    <div class="features__header">
      <div>
        <div class="eyebrow">في الخلاصة اليوم · On The Feed</div>
        <h2 class="features__title" style="margin-top:16px">
          ما يَستحقُّ<br>
          <span class="serif" style="color:var(--gold)">إصغاءَك.</span>
        </h2>
      </div>
      <p class="features__lead">
        مختاراتُ المحرّرين هذا الأسبوع — من أرشيف ثمانيّة، الفنجان،
        فنجان قهوة، ومنتجات وَهب الأصليّة.
      </p>
    </div>

    <div class="showcase__row">
      <div class="content-card">
        <div class="content-card__art art-1">
          <div class="content-card__kind">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            بودكاست
          </div>
          <div class="content-card__dur">٤١:٠٧</div>
        </div>
        <h4 class="content-card__title">الرّكضُ في الحياة أنهَكَنا</h4>
        <div class="content-card__meta">
          <div class="left">
            <span class="content-card__avatar">ث</span>
            <span>ثمانيّة</span>
          </div>
          <span class="mono">١٢ نوف</span>
        </div>
      </div>

      <div class="content-card">
        <div class="content-card__art art-2">
          <div class="content-card__kind">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
            مقال
          </div>
          <div class="content-card__dur">٣ د قراءة</div>
        </div>
        <h4 class="content-card__title is-serif">حين تتحوّلُ المدنُ إلى ذاكرة</h4>
        <div class="content-card__meta">
          <div class="left">
            <span class="content-card__avatar">F</span>
            <span>الفنجان</span>
          </div>
          <span class="mono">١١ نوف</span>
        </div>
      </div>

      <div class="content-card">
        <div class="content-card__art art-3">
          <div class="content-card__kind">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            بودكاست
          </div>
          <div class="content-card__dur">١:١٢:٣٣</div>
        </div>
        <h4 class="content-card__title">عن صناعة القرار في الزمن السائل</h4>
        <div class="content-card__meta">
          <div class="left">
            <span class="content-card__avatar">و</span>
            <span>وَهب أصلي</span>
          </div>
          <span class="mono">١٠ نوف</span>
        </div>
      </div>

      <div class="content-card">
        <div class="content-card__art art-4">
          <div class="content-card__kind">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            عاجل
          </div>
          <div class="content-card__dur">قبل ٢س</div>
        </div>
        <h4 class="content-card__title is-serif">اتّفاقُ المنطقة الجديد — ما الذي تغيّر؟</h4>
        <div class="content-card__meta">
          <div class="left">
            <span class="content-card__avatar">R</span>
            <span>Reuters</span>
          </div>
          <span class="mono">اليوم</span>
        </div>
      </div>

      <div class="content-card">
        <div class="content-card__art art-5">
          <div class="content-card__kind">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            بودكاست
          </div>
          <div class="content-card__dur">٢٨:١٥</div>
        </div>
        <h4 class="content-card__title">الذّكاءُ الاصطناعيّ والأخلاق</h4>
        <div class="content-card__meta">
          <div class="left">
            <span class="content-card__avatar">D</span>
            <span>دكّان</span>
          </div>
          <span class="mono">٠٩ نوف</span>
        </div>
      </div>

      <div class="content-card">
        <div class="content-card__art art-6">
          <div class="content-card__kind">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
            رأي
          </div>
          <div class="content-card__dur">٦ د قراءة</div>
        </div>
        <h4 class="content-card__title is-serif">لماذا نحتاجُ بطءاً في الإصغاء؟</h4>
        <div class="content-card__meta">
          <div class="left">
            <span class="content-card__avatar">م</span>
            <span>منشورات</span>
          </div>
          <span class="mono">٠٨ نوف</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════ EDITORIAL QUOTE ═════════════════ -->
<section class="quote" data-screen-label="05 Quote">
  <div class="container">
    <span class="quote__mark">”</span>
    <p class="quote__text">
      في زمنٍ يَركضُ خلف العنوان، نُؤمنُ بأنَّ
      <span class="stroke">القصّة</span>
      تَستحقُّ
      <span class="accent">إصغاءً كاملاً.</span>
    </p>
    <div class="quote__attr">— ميثاق المنصّة · The Wahb Manifesto</div>
  </div>
</section>

<!-- ═════════════════ STATS ═════════════════ -->
<section class="section section--cream" data-screen-label="06 Stats">
  <div class="container">
    <div class="divider-rule"><span>BY THE NUMBERS · بالأرقام</span></div>
  </div>
  <div class="container" style="margin-top: 56px;">
    <div class="stats__grid">
      <div class="stat">
        <div class="stat__num">٠</div>
        <div class="stat__lbl">مستمع شهري<br>Monthly Listeners</div>
      </div>
      <div class="stat">
        <div class="stat__num">٠</div>
        <div class="stat__lbl">دقيقة إصغاء<br>Minutes Played</div>
      </div>
      <div class="stat">
        <div class="stat__num">٠</div>
        <div class="stat__lbl">نموّ أسبوعي<br>Weekly Growth</div>
      </div>
      <div class="stat">
        <div class="stat__num">٠</div>
        <div class="stat__lbl">شريك تحريري<br>Editorial Partners</div>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════ FOR CREATORS ═════════════════ -->
<section class="section creators" id="creators" data-screen-label="07 Creators">
  <div class="container creators__inner">
    <div>
      <div class="eyebrow">للمبدعين · For Creators</div>
      <h2 class="creators__title">
        صوتُك<br>
        <span class="serif" style="color:var(--gold)">يَستحقُّ سامعاً.</span>
      </h2>
      <p class="creators__lead">
        ارفع حلقاتك مرّة، ووَهب يفعل الباقي: نسخٌ نصّيّ تلقائي،
        اقتباساتٌ قابلة للمشاركة، إحصائيّاتٌ دقيقة، وتوزيعٌ على خلاصةٍ
        مُختارة بعناية.
      </p>
      <ul class="creators__bullets">
        <li class="creators__bullet">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          نسخ نصّي تلقائي
        </li>
        <li class="creators__bullet">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          اقتباسات قابلة للمشاركة كصورة وفيديو
        </li>
        <li class="creators__bullet">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          لوحة إحصاءاتٍ مباشرة لكلّ حلقة
        </li>
        <li class="creators__bullet">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          أدوات تحرير مدمجة وتعاوُن جماعي
        </li>
      </ul>
      <a href="#download" class="btn btn--gold btn--lg">قدّم على البرنامج</a>
    </div>

    <div class="creators__viz">
      <div class="creators__viz__hdr">
        <span>WAHB STUDIO · ديسمبر</span>
        <span style="color:var(--gold)">● LIVE</span>
      </div>
      <div class="creators__waves">
        <div class="creators__wave-bar" style="animation-delay:0s"></div>
        <div class="creators__wave-bar" style="animation-delay:.1s"></div>
        <div class="creators__wave-bar" style="animation-delay:.2s"></div>
        <div class="creators__wave-bar" style="animation-delay:.3s"></div>
        <div class="creators__wave-bar" style="animation-delay:.4s"></div>
        <div class="creators__wave-bar" style="animation-delay:.5s"></div>
        <div class="creators__wave-bar" style="animation-delay:.6s"></div>
        <div class="creators__wave-bar" style="animation-delay:.7s"></div>
        <div class="creators__wave-bar" style="animation-delay:.8s"></div>
        <div class="creators__wave-bar" style="animation-delay:.9s"></div>
        <div class="creators__wave-bar" style="animation-delay:1s"></div>
        <div class="creators__wave-bar" style="animation-delay:1.1s"></div>
        <div class="creators__wave-bar" style="animation-delay:1.2s"></div>
        <div class="creators__wave-bar" style="animation-delay:1.3s"></div>
        <div class="creators__wave-bar" style="animation-delay:1.4s"></div>
        <div class="creators__wave-bar" style="animation-delay:1.5s"></div>
        <div class="creators__wave-bar" style="animation-delay:1.6s"></div>
        <div class="creators__wave-bar" style="animation-delay:1.7s"></div>
        <div class="creators__wave-bar" style="animation-delay:1.8s"></div>
        <div class="creators__wave-bar" style="animation-delay:1.9s"></div>
      </div>

      <div class="creators__viz-card">
        <div class="creators__viz-thumb art-1"></div>
        <div class="creators__viz-text">
          <div class="creators__viz-title">حلقة ٤٧ — صوتُ المدينة</div>
          <div class="creators__viz-sub">نُشرت قبل ٣ أيام · ٤٢:١٥</div>
        </div>
        <div class="creators__viz-stat">٠</div>
      </div>
      <div class="creators__viz-card">
        <div class="creators__viz-thumb art-3"></div>
        <div class="creators__viz-text">
          <div class="creators__viz-title">حلقة ٤٦ — أسئلةٌ بلا أجوبة</div>
          <div class="creators__viz-sub">نُشرت قبل أسبوع · ٣٨:٤٢</div>
        </div>
        <div class="creators__viz-stat">٠</div>
      </div>
      <div class="creators__viz-card">
        <div class="creators__viz-thumb art-2"></div>
        <div class="creators__viz-text">
          <div class="creators__viz-title">حلقة ٤٥ — حوارٌ مع الزمن</div>
          <div class="creators__viz-sub">نُشرت قبل أسبوعين · ١:٠٢:١٨</div>
        </div>
        <div class="creators__viz-stat">٠</div>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════ FAQ ═════════════════ -->
<section class="section section--cream" id="faq" data-screen-label="08 FAQ">
  <div class="container">
    <div class="features__header">
      <div>
        <div class="eyebrow">الأسئلة الشّائعة · FAQ</div>
        <h2 class="features__title" style="margin-top:16px;color:var(--color-navy)">
          أسئلةٌ قد<br>
          <span class="serif" style="color:var(--gold)">تَخطُرُ ببالك.</span>
        </h2>
      </div>
      <p class="features__lead">
        إذا لم تجد إجابتك هنا، تواصَل معنا عبر
        <a href="mailto:hello@wahb.app" style="color:var(--gold);text-decoration:underline">hello@wahb.app</a>
        — نردُّ خلال ٢٤ ساعة.
      </p>
    </div>

    <div class="faq__list">
      <div class="faq__item">
        <button class="faq__q" type="button" aria-expanded="false" aria-controls="faq-answer-01">
          <span class="faq__q-num">٠١</span>
          <span class="faq__q-text">هل التطبيق مجّاني؟</span>
          <span class="faq__icon">+</span>
        </button>
        <div class="faq__a" id="faq-answer-01" aria-hidden="true"><div class="faq__a-inner">
          نعم. الإصدار الأساسيّ مجّانيٌّ بالكامل، بدون إعلانات.
          نُقدّمُ أيضاً اشتراك "وَهب+" للوصول إلى المحتوى الحصريّ
          ووضع التحميل بدون اتّصال.
        </div></div>
      </div>

      <div class="faq__item">
        <button class="faq__q" type="button" aria-expanded="false" aria-controls="faq-answer-02">
          <span class="faq__q-num">٠٢</span>
          <span class="faq__q-text">ما الفرق بين "لك" و"الأخبار"؟</span>
          <span class="faq__icon">+</span>
        </button>
        <div class="faq__a" id="faq-answer-02" aria-hidden="true"><div class="faq__a-inner">
          "لك" خلاصةٌ صوتيّة عموديّة بنمط TikTok، مخصّصةٌ لاهتماماتك.
          "الأخبار" صحيفةٌ يوميّة بمزاجٍ تحريريّ كلاسيكيّ — مقالاتٌ
          مختارة بعناية، لا خوارزميّات.
        </div></div>
      </div>

      <div class="faq__item">
        <button class="faq__q" type="button" aria-expanded="false" aria-controls="faq-answer-03">
          <span class="faq__q-num">٠٣</span>
          <span class="faq__q-text">كيف يعمل وضع النّصّ الحيّ؟</span>
          <span class="faq__icon">+</span>
        </button>
        <div class="faq__a" id="faq-answer-03" aria-hidden="true"><div class="faq__a-inner">
          كلّ بودكاست في وَهب يحمل نسخةً نصّيّةً مزامِنة. عند تشغيله،
          يُمكنك التبديل إلى وضع النّصّ ليتضخّمَ المقطعُ الحاليّ
          ويبهَتَ ما حوله — قابلٌ للقراءة، للحفظ، وللمشاركة.
        </div></div>
      </div>

      <div class="faq__item">
        <button class="faq__q" type="button" aria-expanded="false" aria-controls="faq-answer-04">
          <span class="faq__q-num">٠٤</span>
          <span class="faq__q-text">هل أحتاجُ حساباً لاستخدامه؟</span>
          <span class="faq__icon">+</span>
        </button>
        <div class="faq__a" id="faq-answer-04" aria-hidden="true"><div class="faq__a-inner">
          لا. يمكنك تصفّح المحتوى بدون حساب. التسجيلُ مفيدٌ فقط
          لتخصيص الخلاصة، حفظ المحتوى للقراءة لاحقاً، ومزامنة
          التقدّم عبر أجهزتك.
        </div></div>
      </div>

      <div class="faq__item">
        <button class="faq__q" type="button" aria-expanded="false" aria-controls="faq-answer-05">
          <span class="faq__q-num">٠٥</span>
          <span class="faq__q-text">متى يصدر التطبيق رسمياً؟</span>
          <span class="faq__icon">+</span>
        </button>
        <div class="faq__a" id="faq-answer-05" aria-hidden="true"><div class="faq__a-inner">
          نحن حالياً في مرحلة بيتا مغلقة. الإطلاقُ العامّ مُقرَّرٌ
          مطلعَ الربع الأوّل من ٢٠٢٦. سجّل في قائمة الانتظار
          لتكون من أوائل المستخدمين.
        </div></div>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════ FINAL CTA ═════════════════ -->
<section class="section final-cta" id="download" data-screen-label="09 Download">
  <div class="container final-cta__inner">
    <div class="eyebrow">جاهز للإصغاء؟ · Ready to listen?</div>
    <h2 class="final-cta__title">
      <span>افتَحْ أُذنيك.</span><br>
      <span class="stroke">وَهب</span> <span class="accent">يفعلُ الباقي.</span>
    </h2>
    <p class="final-cta__sub">
      وَهب قادمٌ قريباً إلى App Store وGoogle Play. سجّل اهتمامك
      لتكون من أوّل من يكتشف الخلاصة.
    </p>
    <div class="final-cta__actions">
      <a href="#" class="hero__store">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
        <div>
          <div class="hero__store__sub">قريباً على</div>
          <div class="hero__store__main">App Store</div>
        </div>
      </a>
      <a href="#" class="hero__store">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.205 12l2.493-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z"/></svg>
        <div>
          <div class="hero__store__sub">قريباً على</div>
          <div class="hero__store__main">Google Play</div>
        </div>
      </a>
      <a href="#" class="btn btn--gold btn--lg">انضمّ إلى قائمة الانتظار</a>
    </div>
  </div>
</section>

<!-- ═════════════════ FOOTER ═════════════════ -->
<footer class="footer" data-screen-label="10 Footer">
  <div class="container">
    <div class="footer__top">
      <div class="footer__brand">
        <div class="footer__brand-row">
          <img src="/images/wahb_app_icon.png" alt="وَهْب" width="42" height="42">
          <span class="footer__brand-name">وَهْب</span>
        </div>
        <p class="footer__tagline">
          منصّةُ الصوت والأخبار للعالم العربيّ. مُختارةٌ بعناية، مكتوبةٌ بشغف،
          ومسموعةٌ بإصغاء.
        </p>
      </div>

      <div class="footer__col">
        <h4>المنتج</h4>
        <ul>
          <li><a href="#features">المزايا</a></li>
          <li><a href="#how">كيف تعمل</a></li>
          <li><a href="#download">قريباً</a></li>
          <li><a href="#">وَهب+</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h4>الشركة</h4>
        <ul>
          <li><a href="#">عنّا</a></li>
          <li><a href="#creators">للمبدعين</a></li>
          <li><a href="#">الصحافة</a></li>
          <li><a href="#">الوظائف</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h4>قانوني</h4>
        <ul>
          <li><a href="#">سياسة الخصوصيّة</a></li>
          <li><a href="#">شروط الاستخدام</a></li>
          <li><a href="#">حقوق المؤلّف</a></li>
          <li><a href="mailto:hello@wahb.app">تواصل</a></li>
        </ul>
      </div>
    </div>

    <div class="footer__bottom">
      <div>© ٢٠٢٦ وَهْب · جميع الحقوق محفوظة</div>
      <div class="footer__socials">
        <a href="#" aria-label="X">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="#" aria-label="Instagram">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        </a>
        <a href="#" aria-label="YouTube">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

`;

export default function LandingPage() {
    const handleLandingClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const phoneTab = target.closest<HTMLButtonElement>('[data-phone-view]');
        if (phoneTab) {
            const view = phoneTab.dataset.phoneView;
            if (isPhoneView(view)) setPhoneView(event.currentTarget, view);
            return;
        }

        const faqButton = target.closest<HTMLButtonElement>('.faq__q');
        if (faqButton) {
            const item = faqButton.closest<HTMLElement>('.faq__item');
            if (!item) return;

            const wasOpen = item.classList.contains('is-open');
            event.currentTarget.querySelectorAll<HTMLElement>('.faq__item.is-open').forEach((openItem) => {
                openItem.classList.remove('is-open');
                const openQuestion = openItem.querySelector<HTMLButtonElement>('.faq__q');
                openQuestion?.setAttribute('aria-expanded', 'false');
                const answerId = openQuestion?.getAttribute('aria-controls');
                if (answerId) event.currentTarget.querySelector<HTMLElement>(`#${answerId}`)?.setAttribute('aria-hidden', 'true');
            });
            if (!wasOpen) {
                item.classList.add('is-open');
                faqButton.setAttribute('aria-expanded', 'true');
                const answerId = faqButton.getAttribute('aria-controls');
                if (answerId) event.currentTarget.querySelector<HTMLElement>(`#${answerId}`)?.setAttribute('aria-hidden', 'false');
            }
            return;
        }

        const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
        const id = anchor?.getAttribute('href');
        if (!anchor || !id || id === '#') return;
        const section = event.currentTarget.querySelector<HTMLElement>(id);
        if (!section) return;
        event.preventDefault();
        const top = section.getBoundingClientRect().top + window.scrollY - 70;
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        window.scrollTo({ top, behavior });
    };

    const handleLandingKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const phoneTab = target.closest<HTMLButtonElement>('[data-phone-view]');
        if (!phoneTab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

        const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-phone-view]'));
        const currentIndex = tabs.indexOf(phoneTab);
        if (currentIndex < 0) return;

        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? tabs.length - 1
                : event.key === 'ArrowLeft'
                    ? (currentIndex + 1) % tabs.length
                    : (currentIndex - 1 + tabs.length) % tabs.length;
        const nextTab = tabs[nextIndex];
        const view = nextTab?.dataset.phoneView;
        if (!nextTab || !isPhoneView(view)) return;

        event.preventDefault();
        setPhoneView(event.currentTarget, view);
        nextTab.focus();
    };

    useEffect(() => {
        const root = document.querySelector<HTMLElement>('.wahb-landing');
        if (!root) return;

        const cleanups: Array<() => void> = [];
        const nav = root.querySelector<HTMLElement>('.nav');
        if (nav) {
            const updateNav = () => {
                nav.style.background = window.scrollY > 40 ? 'rgba(11,11,11,0.92)' : 'rgba(11,11,11,0.6)';
            };
            updateNav();
            window.addEventListener('scroll', updateNav, { passive: true });
            cleanups.push(() => window.removeEventListener('scroll', updateNav));
        }

        const phone = root.querySelector<HTMLElement>('[data-phone-preview]');
        const phoneStage = root.querySelector<HTMLElement>('.phone-stage');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (phone && !reducedMotion.matches) {
            const pauseTarget = phoneStage ?? phone;
            const cardCycleDelay = 3400;
            const modeCycleDelay = 4800;
            let lastInteractionAt = performance.now();
            let isHoverPaused = false;
            let isFocusPaused = false;
            let isInViewport = true;
            const updatePausedState = () => {
                const isPaused = isHoverPaused || isFocusPaused || !isInViewport;
                if (isPaused) phone.dataset.phonePaused = 'true';
                else delete phone.dataset.phonePaused;
                return isPaused;
            };
            const cyclePhonePreview = () => {
                if (updatePausedState() || document.hidden) return;
                const currentView = phone.dataset.phoneState === 'news' ? 'news' : 'pods';
                const currentIndex = Number(phone.dataset.phoneCardIndex ?? '0');
                const cycleDelay = currentIndex < PHONE_CARD_COUNT - 1 ? cardCycleDelay : modeCycleDelay;
                if (performance.now() - lastInteractionAt < cycleDelay) return;
                if (currentIndex < PHONE_CARD_COUNT - 1) {
                    setPhoneCard(root, currentView, currentIndex + 1);
                } else {
                    setPhoneView(root, currentView === 'pods' ? 'news' : 'pods');
                }
                lastInteractionAt = performance.now();
            };
            const noteTabInteraction = (event: Event) => {
                const target = event.target;
                if (target instanceof Element && target.closest('[data-phone-view]')) {
                    lastInteractionAt = performance.now();
                }
            };
            const pauseOnHover = () => {
                isHoverPaused = true;
                updatePausedState();
            };
            const resumeFromHover = () => {
                isHoverPaused = false;
                updatePausedState();
            };
            const resumeAfterFocus = (event: FocusEvent) => {
                if (event.relatedTarget instanceof Node && pauseTarget.contains(event.relatedTarget)) return;
                isFocusPaused = false;
                updatePausedState();
            };
            const pauseOnFocus = () => {
                isFocusPaused = true;
                updatePausedState();
            };
            const observer = new IntersectionObserver(([entry]) => {
                isInViewport = entry?.isIntersecting ?? true;
                updatePausedState();
            }, { threshold: 0.15 });
            observer.observe(pauseTarget);
            const timer = window.setInterval(cyclePhonePreview, 250);
            pauseTarget.addEventListener('mouseenter', pauseOnHover);
            pauseTarget.addEventListener('mouseleave', resumeFromHover);
            root.addEventListener('click', noteTabInteraction);
            root.addEventListener('keydown', noteTabInteraction);
            pauseTarget.addEventListener('focusin', pauseOnFocus);
            pauseTarget.addEventListener('focusout', resumeAfterFocus);
            cleanups.push(() => {
                window.clearInterval(timer);
                observer.disconnect();
                pauseTarget.removeEventListener('mouseenter', pauseOnHover);
                pauseTarget.removeEventListener('mouseleave', resumeFromHover);
                root.removeEventListener('click', noteTabInteraction);
                root.removeEventListener('keydown', noteTabInteraction);
                pauseTarget.removeEventListener('focusin', pauseOnFocus);
                pauseTarget.removeEventListener('focusout', resumeAfterFocus);
            });
        }

        return () => cleanups.forEach((cleanup) => cleanup());
    }, []);

    return <div className="wahb-landing" lang="ar" dir="rtl" onClick={handleLandingClick} onKeyDown={handleLandingKeyDown} dangerouslySetInnerHTML={{ __html: LANDING_MARKUP }} />;
}
