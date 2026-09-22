import { expect, test } from '@playwright/test';

test('landing and feed routes render without an error boundary', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(page.locator('.wahb-landing')).toBeVisible();
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.locator('.wahb-landing .phone')).toHaveCount(1);
  const phonePreview = page.locator('[data-phone-preview]');
  await expect(phonePreview).toBeVisible();
  await expect(page.locator('#phone-preview-pods [data-phone-card]')).toHaveCount(3);
  await expect(page.locator('#phone-preview-news [data-phone-card]')).toHaveCount(3);
  const platformMethod = page.locator('#features');
  await expect(platformMethod.locator('.platform-card')).toHaveCount(2);
  await expect(platformMethod).toContainText('من المصدر');
  await expect(platformMethod.locator('.platform-action')).toHaveCount(4);
  await expect(platformMethod.locator('.platform-card__tag')).toHaveCount(2);
  await expect(platformMethod.locator('.platform-card__tag')).toContainText(['خلاصةٌ صوتيّة', 'خلاصةٌ إخباريّة']);
  await expect(platformMethod.locator('.platform-card__title .en')).toHaveCount(0);
  await expect(platformMethod.locator('.platform-card__subtitle')).toContainText(['اكتشافٌ يبدأ بالصوت', 'القصةُ في سياقها']);
  await expect(platformMethod.locator('.platform-actions')).toContainText('استمع');
  await expect(platformMethod.locator('.platform-actions')).toContainText('اقرأ');
  await expect(platformMethod.locator('.platform-actions')).toContainText('احفظ');
  await expect(platformMethod.locator('.platform-actions')).toContainText('شارك');
  await expect(platformMethod).not.toContainText('ثلاث طبقات');
  const continuity = page.locator('#continuity');
  await expect(page.getByRole('link', { name: 'التشغيل' })).toHaveAttribute('href', '#continuity');
  await expect(continuity).toContainText('أكمِل الاستماع');
  await expect(continuity).toContainText('موجزك الإخباري.');
  await expect(continuity).toContainText('اضغط المربّع المصغّر');
  await expect(continuity.locator('.continuity__device')).toHaveCount(1);
  await expect(continuity.getByRole('img', { name: /مشغّل صوتي مربع قابل للتوسيع/ })).toBeVisible();
  await expect(continuity.locator('.continuity__news-tabs .is-active')).toHaveText('الأخبار');
  await expect(continuity.locator('.continuity__news-sheet')).toHaveCount(1);
  await expect(continuity.locator('.continuity__player-popover')).toHaveCount(1);
  await expect(continuity.locator('.continuity__square-player')).toHaveCount(1);
  const chapters = page.locator('#chapters');
  await expect(page.getByRole('link', { name: 'الحلقات الطويلة' }).first()).toHaveAttribute('href', '#chapters');
  await expect(page.locator('#creators')).toHaveCount(0);
  await expect(chapters).toContainText('لا يلزم أن تبدأ');
  await expect(chapters).toContainText('من أوّل الحلقة.');
  await expect(chapters).toContainText('حين تطول الحلقة، لا تحتاج إلى أن تأخذها كلّها دفعةً واحدة');
  await expect(chapters).not.toContainText('إبداعاتي');
  await expect(chapters).not.toContainText('جارٍ المعالجة');
  await expect(chapters).not.toContainText('مادة جديدة');
  await expect(chapters.getByRole('img', { name: /حلقة صوتية طويلة تتحوّل إلى ثلاثة فصول/ })).toBeVisible();
  await expect(chapters.locator('.chapter-atlas__chapter')).toHaveCount(3);
  await expect(chapters.locator('.chapter-atlas__chapter--active')).toContainText('كيف تصنعنا الأمكنة؟');
  await expect(chapters.locator('.chapter-atlas__chapter small')).toContainText([
    'من الحلقة نفسها',
    'من الحلقة نفسها',
    'من الحلقة نفسها',
  ]);
  const discoverySection = page.locator('#how');
  await expect(discoverySection).toContainText('ابدأ مباشرةً،');
  await expect(discoverySection).toContainText('تصفّح حتى تجد ما يهمّك.');
  await expect(discoverySection).toContainText('قَلِّب، ثم توقّف.');
  await expect(discoverySection).toContainText('كل شريحةٍ تجمع الخبرَ وما يتصل به من تغطيات');
  await expect(discoverySection).toContainText('استمع، اقرأ، وناقش.');
  await expect(discoverySection).toContainText('أضف رأيك في التعليقات');
  await expect(discoverySection).not.toContainText('الخلاصة');
  await expect(discoverySection).not.toContainText('قائمة الانتظار');
  await expect(phonePreview).toHaveAttribute('data-phone-card-index', '0');
  await expect.poll(() => phonePreview.getAttribute('data-phone-card-index'), { timeout: 7_000 }).toBe('1');
  await expect(page.locator('.phone--news')).toHaveCount(0);
  const podsTab = page.getByRole('tab', { name: /سمعيات/ });
  const newsTab = page.getByRole('tab', { name: /الأخبار/ });
  await podsTab.click();
  await expect(podsTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#phone-preview-pods')).toHaveAttribute('aria-hidden', 'false');
  await newsTab.click();
  await expect(phonePreview).toHaveAttribute('data-phone-state', 'news');
  await expect(phonePreview).toHaveAttribute('data-phone-transition', 'left');
  await expect(phonePreview).toHaveAttribute('data-phone-card-index', '0');
  await expect(newsTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#phone-preview-news')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#phone-preview-pods')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('[data-phone-annotations="news"]')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('[data-phone-annotations="pods"]')).toHaveAttribute('aria-hidden', 'true');
  const newsPanel = page.locator('#phone-preview-news');
  await expect(newsPanel.locator('.phone__news-header')).toBeVisible();
  await expect(newsPanel.locator('.phone__news-footer')).toHaveCount(0);
  await expect(newsPanel.locator('.phone__news-list').first()).toContainText('الرياض تعلن');
  await podsTab.click();
  await expect(phonePreview).toHaveAttribute('data-phone-state', 'pods');
  await expect(phonePreview).toHaveAttribute('data-phone-transition', 'right');
  await expect(phonePreview).toHaveAttribute('data-phone-card-index', '0');
  await podsTab.focus();
  await podsTab.press('ArrowLeft');
  await expect(newsTab).toHaveAttribute('aria-selected', 'true');
  await expect(newsTab).toBeFocused();
  await newsTab.press('ArrowRight');
  await expect(podsTab).toHaveAttribute('aria-selected', 'true');
  await expect(podsTab).toBeFocused();
  const preview = page.getByRole('link', { name: 'معاينة' });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('href', '/app');

  const firstFaq = page.getByRole('button', { name: /هل التطبيق مجّاني/ });
  const secondFaq = page.getByRole('button', { name: /ما الفرق بين/ });
  await firstFaq.click();
  await expect(firstFaq).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#faq-answer-01')).toHaveAttribute('aria-hidden', 'false');
  await secondFaq.click();
  await expect(firstFaq).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#faq-answer-01')).toHaveAttribute('aria-hidden', 'true');
  await expect(secondFaq).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#faq-answer-02')).toHaveAttribute('aria-hidden', 'false');

  await preview.click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(page.locator('body')).not.toContainText('Application error');

  await page.goto('/news');
  await expect(page).toHaveURL(/\/news\/?$/);
  await expect(page.locator('body')).not.toContainText('Application error');

  // Saved remains protected; its unauthenticated redirect preserves the route.
  await page.goto('/saved');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fsaved$/);
  await expect(page.locator('body')).not.toContainText('Application error');

  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile$/);
  await expect(page.locator('body')).not.toContainText('Application error');

  await page.goto('/search');
  await expect(page).toHaveURL(/\/search\/?$/);
  await expect(page.locator('body')).not.toContainText('Application error');
});

test('landing preview remains still for reduced-motion visitors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const phonePreview = page.locator('[data-phone-preview]');
  await expect(phonePreview).toHaveAttribute('data-phone-state', 'pods');
  await expect(phonePreview).toHaveAttribute('data-phone-card-index', '0');
  await page.waitForTimeout(5_400);
  await expect(phonePreview).toHaveAttribute('data-phone-state', 'pods');
  await expect(phonePreview).toHaveAttribute('data-phone-card-index', '0');
});

test('footer links open concise marketing and legal pages', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');

  const footer = page.locator('.footer');
  await expect(footer.getByRole('link', { name: 'المزايا' })).toHaveAttribute('href', '/#features');
  await expect(footer.getByRole('link', { name: 'كيف تعمل' })).toHaveAttribute('href', '/#how');
  await expect(footer.getByRole('link', { name: 'قريباً' })).toHaveAttribute('href', '/#download');
  await expect(footer.getByRole('link', { name: 'الحلقات الطويلة' })).toHaveAttribute('href', '/#chapters');
  await expect(footer.getByRole('link', { name: 'وَهب+' })).toHaveAttribute('href', '/plus');
  await expect(footer.getByRole('link', { name: 'عنّا' })).toHaveAttribute('href', '/about');
  await expect(footer.getByRole('link', { name: 'الصحافة' })).toHaveAttribute('href', '/press');
  await expect(footer.getByRole('link', { name: 'الوظائف' })).toHaveAttribute('href', '/careers');
  await expect(footer.getByRole('link', { name: 'سياسة الخصوصيّة' })).toHaveAttribute('href', '/ar/privacy');
  await expect(footer.getByRole('link', { name: 'شروط الاستخدام' })).toHaveAttribute('href', '/ar/terms');
  await expect(footer.getByRole('link', { name: 'حقوق المؤلّف' })).toHaveAttribute('href', '/ar/copyright');
  await expect(footer.getByRole('link', { name: 'تواصل' })).toHaveAttribute('href', 'mailto:salehwleed1@gmail.com');

  for (const route of ['/plus', '/about', '/press', '/careers']) {
    await page.goto(route);
    await expect(page.locator('.marketing-doc__main')).toBeVisible();
    await expect(page.locator('.wahb-landing')).toHaveCount(0);
    await expect(page.locator('video')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Application error');
  }

  await page.goto('/ar/privacy');
  await expect(page.locator('.wahb-marketing-legal')).toBeVisible();
  await expect(page.locator('.wahb-marketing-doc')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('[data-legal-document="privacy"]')).toContainText('سياسة الخصوصية');
  await expect(page.locator('[data-legal-document="privacy"]')).toContainText('salehwleed1@gmail.com');
  await expect(page.locator('.wahb-landing')).toHaveCount(0);

  await page.goto('/en/terms');
  await expect(page.locator('.wahb-marketing-doc')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('[data-legal-document="terms"]')).toContainText('Terms of Use');

  await page.goto('/ar/copyright');
  await expect(page.locator('[data-legal-document="copyright"]')).toContainText('حقوق المؤلّف');
  await expect(page.locator('[data-legal-document="copyright"]')).toContainText('طلبات');
});
