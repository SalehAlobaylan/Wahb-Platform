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
    const phone = root.querySelector<HTMLElement>('[data-phone-preview]');
    const previousView = isPhoneView(phone?.dataset.phoneState) ? phone?.dataset.phoneState : undefined;
    const direction = previousView && previousView !== view
        ? previousView === 'pods' && view === 'news' ? 'left' : 'right'
        : undefined;
    const outgoingPanel = previousView ? root.querySelector<HTMLElement>(`[data-phone-panel="${previousView}"]`) : null;
    const incomingPanel = root.querySelector<HTMLElement>(`[data-phone-panel="${view}"]`);
    const transitionToken = String(Number(phone?.dataset.phoneTransitionToken ?? '0') + 1);

    root.querySelectorAll<HTMLElement>('.phone__view.is-entering, .phone__view.is-leaving, .phone__view.is-leaving-left, .phone__view.is-leaving-right').forEach((panel) => {
        panel.classList.remove('is-entering', 'is-leaving', 'is-leaving-left', 'is-leaving-right');
    });
    if (direction) {
        incomingPanel?.classList.add('is-entering');
        outgoingPanel?.classList.add('is-leaving');
        if (phone) {
            phone.dataset.phoneTransition = direction;
            phone.dataset.phoneTransitionToken = transitionToken;
        }
    }

    phone?.setAttribute('data-phone-state', view);
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

    if (direction && incomingPanel && outgoingPanel) {
        window.requestAnimationFrame(() => {
            incomingPanel.classList.remove('is-entering');
            outgoingPanel.classList.add(`is-leaving-${direction}`);
        });
        window.setTimeout(() => {
            if (phone?.dataset.phoneTransitionToken !== transitionToken) return;
            incomingPanel.classList.remove('is-entering');
            outgoingPanel.classList.remove('is-leaving', 'is-leaving-left', 'is-leaving-right');
        }, 780);
    }
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
      <a href="#continuity">التشغيل</a>
      <a href="#chapters">الحلقات الطويلة</a>
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
        <span>بيتا · ١٫٠ · صوت وأخبار</span>
      </div>

      <h1 class="display hero__title">
        <span class="ar">من زحامِ</span>
        <span class="ar"><span class="stroke">اليومِ</span></span>
        <span class="ar">نُضيءُ <span class="accent">ما يُهمّك.</span></span>
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
          <span>سمعيات</span><small>PODS</small>
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
                  <div class="phone__badges"><span class="phone__badge phone__badge--outline">إذاعة مختلف</span><span class="phone__badge phone__badge--gold">بودكاست</span></div>
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
                  <div class="phone__badges"><span class="phone__badge phone__badge--outline">صوت</span><span class="phone__badge phone__badge--gold">بودكاست</span></div>
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
                  <div class="phone__badges"><span class="phone__badge phone__badge--outline">أثير</span><span class="phone__badge phone__badge--gold">صوت</span></div>
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
                <div class="phone__tab is-active">سمعيات</div>
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
                <div class="phone__tab">سمعيات</div>
              </div>
              <span class="phone__icon-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </span>
            </nav>
            <div class="phone__news-track">
              <article class="phone__news-card is-active" data-phone-card="0" aria-hidden="false">
                <div class="phone__news-topbar"><span class="phone__news-mark">وَهْب</span><span class="phone__news-date">١٢ نوفمبر ٢٠٢٦</span><span class="phone__news-menu">•••</span></div>
                <div class="phone__news-heading"><div class="phone__news-eyebrow">الأخبار</div><div class="phone__news-rule"></div><h3>السعودية توقّع<br>اتّفاقاً تاريخياً</h3><p>قراءةٌ مختارة، من مصادر موثوقة، في ثلاث دقائق.</p></div>
                <div class="phone__news-art"><span class="phone__news-art-sun"></span><span class="phone__news-art-arch"></span><span class="phone__news-art-line phone__news-art-line--one"></span><span class="phone__news-art-line phone__news-art-line--two"></span></div>
                <div class="phone__news-meta">REUTERS · ٣ د قراءة</div>
                <div class="phone__news-list"><article><span class="phone__news-index">٠٢</span><div><strong>الرياض تعلن حزمةً جديدةً للابتكار</strong><small>اقتصاد · ٤ دقائق</small></div></article><article><span class="phone__news-index">٠٣</span><div><strong>مشاريع الطاقة المتجددة تتوسّع</strong><small>بيئة · ٦ دقائق</small></div></article></div>
              </article>
              <article class="phone__news-card phone__news-card--sea" data-phone-card="1" aria-hidden="true">
                <div class="phone__news-topbar"><span class="phone__news-mark">وَهْب</span><span class="phone__news-date">اليوم</span><span class="phone__news-menu">•••</span></div>
                <div class="phone__news-heading"><div class="phone__news-eyebrow">البيئة</div><div class="phone__news-rule"></div><h3>مشاريعُ الطاقة<br>تفتح أفقاً جديداً</h3><p>ما الذي يتغيّر في المدن حين تصبح الطاقة أنظف؟</p></div>
                <div class="phone__news-art phone__news-art--sea"><span class="phone__news-art-sun"></span><span class="phone__news-art-arch"></span><span class="phone__news-art-line phone__news-art-line--one"></span><span class="phone__news-art-line phone__news-art-line--two"></span></div>
                <div class="phone__news-meta">ARAB NEWS · ٤ د قراءة</div>
                <div class="phone__news-list"><article><span class="phone__news-index">٠٢</span><div><strong>محطات شمسية تدعم نموّ الصناعات</strong><small>طاقة · ٥ دقائق</small></div></article><article><span class="phone__news-index">٠٣</span><div><strong>مبادرات جديدة لخفض الانبعاثات</strong><small>مناخ · ٣ دقائق</small></div></article></div>
              </article>
              <article class="phone__news-card phone__news-card--city" data-phone-card="2" aria-hidden="true">
                <div class="phone__news-topbar"><span class="phone__news-mark">وَهْب</span><span class="phone__news-date">١١ نوفمبر ٢٠٢٦</span><span class="phone__news-menu">•••</span></div>
                <div class="phone__news-heading"><div class="phone__news-eyebrow">مجتمع</div><div class="phone__news-rule"></div><h3>النقل الذكيّ<br>يعيد رسم المدينة</h3><p>رحلات أقصر، ومدنٌ أقرب إلى ناسها.</p></div>
                <div class="phone__news-art phone__news-art--city"><span class="phone__news-art-sun"></span><span class="phone__news-art-arch"></span><span class="phone__news-art-line phone__news-art-line--one"></span><span class="phone__news-art-line phone__news-art-line--two"></span></div>
                <div class="phone__news-meta">SPA · ٣ د قراءة</div>
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
    <div class="marquee__item"><span class="stroke">تحرير</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">أخبار</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">استماع</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">قصص قصيرة</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">نصّ حيّ</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">مقالات</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">سمعيات</span><span class="dot"></span></div>
    <!-- duplicate for seamless loop -->
    <div class="marquee__item"><span class="ar">بودكاست</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">تحرير</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">أخبار</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">استماع</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">قصص قصيرة</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">نصّ حيّ</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="ar">مقالات</span><span class="dot"></span></div>
    <div class="marquee__item"><span class="stroke">سمعيات</span><span class="dot"></span></div>
  </div>
</section>

<!-- ═════════════════ PLATFORM METHOD ═════════════════ -->
<section class="section section--dark features platform-method" id="features" data-screen-label="02 Platform">
  <div class="container">
    <div class="features__header">
      <div>
        <div class="eyebrow">المنصّة</div>
        <h2 class="features__title" style="margin-top:16px">
          من المصدرِ<br>
          <span class="serif" style="color:var(--gold)">إلى المعنى.</span>
        </h2>
      </div>
      <p class="features__lead">
        فصولٌ تستحقّ الإصغاء، وقصصٌ تستحقّ الفهم —
        في خلاصةٍ واحدةٍ تُكتشف بنظام التقليب، وتفتح لك عمقها عند الحاجة.
      </p>
    </div>

    <div class="platform-method__grid">
      <article class="platform-card platform-card--pods">
        <div class="platform-card__topline">
          <div class="platform-card__num">۰۱ — PODS</div>
          <span class="platform-card__tag">خلاصةٌ صوتيّة</span>
        </div>

        <div class="platform-card__visual platform-flow platform-flow--pods" aria-hidden="true">
          <div class="platform-flow__source">
            <span class="platform-flow__label">المصدر</span>
            <strong>حلقةٌ أطول</strong>
            <span class="platform-flow__meta">إذاعة مختلف · ٤١:٠٧</span>
            <div class="platform-wave platform-wave--source">
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
          </div>
          <div class="platform-flow__connector"><span>يقرّب</span><b>←</b></div>
          <div class="platform-flow__output platform-flow__output--pods">
            <span class="platform-flow__label">سمعيات</span>
            <strong>فصلٌ يستحقّ الإصغاء</strong>
            <span class="platform-flow__meta">٠٨:٣٢ · تشغيلٌ فوريّ</span>
            <div class="platform-output__progress"><span></span></div>
          </div>
        </div>

        <div class="platform-card__copy">
          <h3 class="platform-card__title">
            <span class="ar">من الحلقةِ إلى ما يستحقّ الإصغاء.</span>
            <span class="platform-card__subtitle">اكتشافٌ يبدأ بالصوت</span>
          </h3>
          <p class="platform-card__desc">
            محتوى صوتيّ أولاً، في مقاطع وفصولٍ تُشغّل فوراً وتُكتشف بنظام التقليب.
          </p>
        </div>
      </article>

      <article class="platform-card platform-card--news">
        <div class="platform-card__topline">
          <div class="platform-card__num">۰۲ — NEWS</div>
          <span class="platform-card__tag">خلاصةٌ إخباريّة</span>
        </div>

        <div class="platform-card__visual platform-flow platform-flow--news" aria-hidden="true">
          <div class="platform-flow__source platform-flow__source--news">
            <span class="platform-flow__label">المصادر</span>
            <div class="platform-news-source"><i></i><span>زاويةٌ أولى للخبر</span></div>
            <div class="platform-news-source"><i></i><span>تفاصيلُ جديدة</span></div>
            <div class="platform-news-source"><i></i><span>خلفيةٌ وسياق</span></div>
          </div>
          <div class="platform-flow__connector"><span>يجمع</span><b>←</b></div>
          <div class="platform-flow__output platform-flow__output--news">
            <span class="platform-flow__label">شريحةٌ قصصيّة</span>
            <strong>قصةٌ رئيسية</strong>
            <span class="platform-flow__meta">وعناوينُ ذاتُ صلة</span>
            <div class="platform-news-related"><span>ذات صلة</span><span>مصدرٌ آخر</span></div>
          </div>
        </div>

        <div class="platform-card__copy">
          <h3 class="platform-card__title">
            <span class="ar">من العناوين إلى القصة.</span>
            <span class="platform-card__subtitle">القصةُ في سياقها</span>
          </h3>
          <p class="platform-card__desc">
            نجمع التغطيات المتصلة والعناوين ذات الصلة في شريحةٍ واحدة، لتقرأ الحدث ضمن سياقه.
          </p>
        </div>
      </article>
    </div>

    <div class="platform-actions" aria-label="ما يمكنك فعله في وَهب">
      <div class="platform-actions__row">
        <article class="platform-action">
          <span class="platform-action__icon-wrap"><svg class="platform-action__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z"></path></svg></span>
          <strong>استمع</strong>
        </article>
        <article class="platform-action">
          <span class="platform-action__icon-wrap"><svg class="platform-action__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 3.75h8.2L18 7.55v12.7H6z"></path><path d="M14 3.75v4h4"></path><path d="M8.5 12h7"></path><path d="M8.5 15.5H14"></path></svg></span>
          <strong>اقرأ</strong>
        </article>
        <article class="platform-action">
          <span class="platform-action__icon-wrap"><svg class="platform-action__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6.5 4.5h11a1 1 0 0 1 1 1v15l-6.5-3.7-6.5 3.7v-15a1 1 0 0 1 1-1z"></path></svg></span>
          <strong>احفظ</strong>
        </article>
        <article class="platform-action">
          <span class="platform-action__icon-wrap"><svg class="platform-action__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 15V3"></path><path d="m7 8 5-5 5 5"></path><path d="M5 13.5v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"></path></svg></span>
          <strong>شارك</strong>
        </article>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════ HOW IT WORKS ═════════════════ -->
<section class="section section--cream how" id="how" data-screen-label="03 How">
  <div class="container">
    <div class="features__header">
      <div>
        <div class="eyebrow">من أين تبدأ؟</div>
        <h2 class="features__title" style="margin-top:16px;color:var(--color-navy)">
          ابدأ مباشرةً،<br>
          <span class="serif" style="color:var(--gold)">تصفّح حتى تجد ما يهمّك.</span>
        </h2>
      </div>
      <p class="features__lead">
        لا تحتاج إلى اختيار حلقةٍ أو خبرٍ قبل أن تبدأ. حدّد مدة الاستماع التي تناسبك
        في السمعيات، أو افتح الأخبار مباشرةً؛ ثم قَلِّب حتى تجد ما يهمّك.
      </p>
    </div>

    <div class="how__grid">
      <div class="how__step">
        <div class="how__num">١</div>
        <h3 class="how__title">
          <span class="ar">اختَر مدّة الاستماع.</span>
        </h3>
        <p class="how__desc">
          في السمعيات، حدّد ما يناسب يومك؛
          وفي الأخبار، ابدأ مباشرةً.
        </p>
      </div>

      <div class="how__step">
        <div class="how__num">٢</div>
        <h3 class="how__title">
          <span class="ar">قَلِّب، ثم توقّف.</span>
        </h3>
        <p class="how__desc">
          في السمعيات، كل بطاقةٍ مقطعٌ صوتيّ؛ وفي الأخبار، كل شريحةٍ تجمع الخبرَ وما يتصل به من تغطيات.
          قَلِّب إلى التالي، وتوقّف عند ما يهمّك.
        </p>
      </div>

      <div class="how__step">
        <div class="how__num">٣</div>
        <h3 class="how__title">
          <span class="ar">استمع، اقرأ، وناقش.</span>
        </h3>
        <p class="how__desc">
          افتح النصّ أو المقال، أضف رأيك في التعليقات، واحفظه للعودة إليه أو شاركه.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════ CONTINUOUS PLAYBACK ═════════════════ -->
<section class="section section--ink continuity" id="continuity" data-screen-label="04 Continuous playback">
  <div class="container">
    <div class="features__header">
      <div>
        <div class="eyebrow">التشغيل المستمر</div>
        <h2 class="features__title" style="margin-top:16px">
          أكمِل الاستماع<br>
          أثناء تصفّح<br>
          <span class="serif" style="color:var(--gold)">موجزك الإخباري.</span>
        </h2>
      </div>
      <p class="features__lead">
        بعد أن تبدأ في السمعيات، يبقى المقطع معك في الأخبار. اضغط المربّع المصغّر
        لإيقافه أو تشغيله، واضغط مطوّلاً لتفتح أدواته.
      </p>
    </div>

    <div class="continuity__stage">
      <div class="continuity__halo" aria-hidden="true"></div>
      <div class="continuity__device" role="img" aria-label="معاينة هاتفية لموجز الأخبار مع مشغّل صوتي مربع قابل للتوسيع على اليسار">
        <div class="continuity__device-notch" aria-hidden="true"></div>
        <div class="continuity__device-screen">
          <nav class="continuity__news-nav" aria-hidden="true">
            <span class="continuity__news-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
            </span>
            <div class="continuity__news-tabs"><span>المحفوظات</span><span class="is-active">الأخبار</span><span>سمعيات</span></div>
            <span class="continuity__news-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </span>
          </nav>

          <article class="continuity__news-slide">
            <div class="continuity__news-topline"><span>وَهْب</span><span>الأخبار</span><span>•••</span></div>
            <div class="continuity__news-kicker">تغطية إخباريّة</div>
            <h3>المدن تعيد ترتيب علاقتها بالطاقة</h3>
            <p>كيف يلتقي النقل والمباني والشبكات في مشهدٍ واحد؟</p>
            <div class="continuity__news-art" aria-hidden="true"><i></i><b></b><em></em></div>
            <div class="continuity__news-coverage"><span>٤ تغطيات</span><i></i><span>٣ مصادر</span></div>
            <div class="continuity__news-related">
              <article><span>٠١</span><strong>النقل العام يدخل في معادلة الاستهلاك</strong></article>
              <article><span>٠٢</span><strong>المباني الذكيّة تخفّض الطلب على الشبكة</strong></article>
            </div>
          </article>

          <div class="continuity__news-sheet" aria-hidden="true"><i></i></div>

          <div class="continuity__player-popover" aria-hidden="true">
            <div class="continuity__player-popover-head">
              <span class="continuity__popover-art">م</span>
              <div><strong>الكتابةُ طريقةٌ أخرى لفهم الذات</strong><small>مختلف</small></div>
              <span class="continuity__popover-close">×</span>
            </div>
            <div class="continuity__popover-progress"><i></i></div>
            <div class="continuity__popover-time"><span>٠٣:١٦</span><span>٠٨:٣٢</span></div>
            <div class="continuity__popover-controls">
              <span class="continuity__skip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v5h5"></path></svg><b>١٥</b></span>
              <span class="continuity__popover-pause"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3v14H7zm7 0h3v14h-3z"/></svg></span>
              <span class="continuity__skip continuity__skip--forward"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v5h5"></path></svg><b>١٥</b></span>
            </div>
          </div>

          <div class="continuity__square-player" aria-hidden="true">
            <div class="continuity__square-art"><span>م</span></div>
            <svg viewBox="0 0 56 56" fill="none"><rect x="2" y="2" width="52" height="52" rx="16" stroke="rgba(255,255,255,.36)" stroke-width="2.5"></rect><rect x="2" y="2" width="52" height="52" rx="16" pathLength="100" stroke="#a93b36" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="61"></rect></svg>
            <span class="continuity__square-pause"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3v14H7zm7 0h3v14h-3z"/></svg></span>
          </div>
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
      لكلّ
      <span class="stroke">مقطعٍ امتدادُه،</span>
      ولكلّ
      <span class="accent">خبرٍ سياقُه.</span>
    </p>
    <div class="quote__attr">— ميثاق المنصّة</div>
  </div>
</section>

<!-- ═════════════════ STATS ═════════════════ -->
<section class="section section--cream" data-screen-label="06 Stats">
  <div class="container">
      <div class="divider-rule"><span>بالأرقام</span></div>
  </div>
  <div class="container" style="margin-top: 56px;">
    <div class="stats__grid">
      <div class="stat">
        <div class="stat__num">٠</div>
        <div class="stat__lbl">مستمع شهري</div>
      </div>
      <div class="stat">
        <div class="stat__num">٠</div>
        <div class="stat__lbl">دقيقة إصغاء</div>
      </div>
      <div class="stat">
        <div class="stat__num">٠</div>
        <div class="stat__lbl">نموّ أسبوعي</div>
      </div>
      <div class="stat">
        <div class="stat__num">٠</div>
        <div class="stat__lbl">شريك تحريري</div>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════ LONG-FORM CHAPTERS ═════════════════ -->
<section class="section chapters" id="chapters" data-screen-label="07 Chapters">
  <div class="container chapters__inner">
    <div>
      <div class="eyebrow">الحلقات الطويلة</div>
      <h2 class="chapters__title">
        لا يلزم أن تبدأ<br>
        <span class="serif" style="color:var(--gold)">من أوّل الحلقة.</span>
      </h2>
      <p class="chapters__lead">
        حين تطول الحلقة، لا تحتاج إلى أن تأخذها كلّها دفعةً واحدة. في سمعيات، تظهر
        فصولٌ منها بعناوينها ومددها، ومعها اسم البرنامج الذي جاءت منه.
      </p>
      <div class="chapters__note">
        <span>فصلٌ يُكتشف وحده</span><i aria-hidden="true"></i><span>وأصلُه يبقى واضحاً</span>
      </div>
      <a href="#download" class="btn btn--gold btn--lg">قريباً</a>
    </div>

    <div class="chapter-atlas" role="img" aria-label="معاينة لحلقة صوتية طويلة تتحوّل إلى ثلاثة فصول مستقلة في سمعيات، مع بقاء صلتها بالحلقة الأصلية">
      <div class="chapter-atlas__head" aria-hidden="true">
        <span>حلقةٌ واحدة</span>
        <span>١:١٤:٣٠</span>
      </div>
      <div class="chapter-atlas__parent" aria-hidden="true">
        <div class="chapter-atlas__parent-art"><span>م</span><i></i><b></b></div>
        <div class="chapter-atlas__parent-copy">
          <span>مِداد · بودكاست</span>
          <strong>أصواتٌ لا تمرّ عابرة</strong>
          <small>حلقةٌ كاملة · ١:١٤:٣٠</small>
        </div>
        <div class="chapter-atlas__parent-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      <div class="chapter-atlas__timeline" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="chapter-atlas__caption" aria-hidden="true"><span>فصولٌ تظهر في سمعيات</span><i></i></div>
      <div class="chapter-atlas__chapters" aria-hidden="true">
        <article class="chapter-atlas__chapter chapter-atlas__chapter--active">
          <div class="chapter-atlas__chapter-meta"><span>الفصل ٠١</span><time>١١:٢٤</time></div>
          <div class="chapter-atlas__chapter-art"><span></span><i></i><b></b></div>
          <strong>كيف تصنعنا الأمكنة؟</strong>
          <small><i></i> مِداد · من الحلقة نفسها</small>
        </article>
        <article class="chapter-atlas__chapter">
          <div class="chapter-atlas__chapter-meta"><span>الفصل ٠٢</span><time>٠٩:٤٨</time></div>
          <div class="chapter-atlas__chapter-art"><span></span><i></i><b></b></div>
          <strong>حين تتغيّر المدينة</strong>
          <small><i></i> مِداد · من الحلقة نفسها</small>
        </article>
        <article class="chapter-atlas__chapter">
          <div class="chapter-atlas__chapter-meta"><span>الفصل ٠٣</span><time>١٢:١٧</time></div>
          <div class="chapter-atlas__chapter-art"><span></span><i></i><b></b></div>
          <strong>ما يبقى من الطريق</strong>
          <small><i></i> مِداد · من الحلقة نفسها</small>
        </article>
      </div>
    </div>
  </div>
</section>

<!-- ═════════════════ FAQ ═════════════════ -->
<section class="section section--cream" id="faq" data-screen-label="08 FAQ">
  <div class="container">
    <div class="features__header">
      <div>
        <div class="eyebrow">الأسئلة الشّائعة</div>
        <h2 class="features__title" style="margin-top:16px;color:var(--color-navy)">
          أسئلةٌ قد<br>
          <span class="serif" style="color:var(--gold)">تَخطُرُ ببالك.</span>
        </h2>
      </div>
      <p class="features__lead">
        إذا لم تجد إجابتك هنا، تواصَل معنا عبر
        <a href="mailto:salehwleed1@gmail.com" style="color:var(--gold);text-decoration:underline">salehwleed1@gmail.com</a>
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
          <span class="faq__q-text">ما الفرق بين "سمعيات" و"الأخبار"؟</span>
          <span class="faq__icon">+</span>
        </button>
        <div class="faq__a" id="faq-answer-02" aria-hidden="true"><div class="faq__a-inner">
          "سمعيات" خلاصةٌ صوتيّةٌ أولاً، في مقاطع وفصولٍ تُكتشف بنظام التقليب وتُشغّل فوراً.
          "الأخبار" خلاصةٌ إخباريّةٌ حيّة تجمع القصةَ الرئيسية وعناوينَ ذات صلةٍ من مصادرَ متعددة،
          لتصلَ إلى الحدث ضمن سياقه.
        </div></div>
      </div>

      <div class="faq__item">
        <button class="faq__q" type="button" aria-expanded="false" aria-controls="faq-answer-03">
          <span class="faq__q-num">٠٣</span>
          <span class="faq__q-text">كيف أتعمّق في المحتوى؟</span>
          <span class="faq__icon">+</span>
        </button>
        <div class="faq__a" id="faq-answer-03" aria-hidden="true"><div class="faq__a-inner">
          في السمعيات، يرافقك النصّ المتزامن حين يتوفّر، ويمكنك فتح التفاصيل والتعليقات.
          وفي الأخبار، يفتح قارئ المقال القصة كاملة. احفظ وشارك ما يستحقّ العودة.
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
    <div class="eyebrow">قريباً · البداية</div>
    <h2 class="final-cta__title">
      <span>ما يهمّك،</span><br>
      <span class="accent">لا يضيع في الزحام.</span>
    </h2>
    <p class="final-cta__sub">
      وَهب قادمٌ قريباً إلى App Store وGoogle Play. سجّل اهتمامك
      لتكون قريباً من البداية.
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
          <li><a href="/#features">المزايا</a></li>
          <li><a href="/#how">كيف تعمل</a></li>
          <li><a href="/#download">قريباً</a></li>
          <li><a href="/plus">وَهب+</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h4>الشركة</h4>
        <ul>
          <li><a href="/about">عنّا</a></li>
          <li><a href="/#chapters">الحلقات الطويلة</a></li>
          <li><a href="/press">الصحافة</a></li>
          <li><a href="/careers">الوظائف</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h4>قانوني</h4>
        <ul>
          <li><a href="/ar/privacy">سياسة الخصوصيّة</a></li>
          <li><a href="/ar/terms">شروط الاستخدام</a></li>
          <li><a href="/ar/copyright">حقوق المؤلّف</a></li>
          <li><a href="mailto:salehwleed1@gmail.com">تواصل</a></li>
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

        const anchor = target.closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
        const href = anchor?.getAttribute('href');
        const id = href?.startsWith('/#') ? href.slice(1) : href;
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
