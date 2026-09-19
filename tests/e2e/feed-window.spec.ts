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
  await expect(phonePreview).toHaveAttribute('data-phone-card-index', '0');
  await expect.poll(() => phonePreview.getAttribute('data-phone-card-index'), { timeout: 7_000 }).toBe('1');
  await expect(page.locator('.phone--news')).toHaveCount(0);
  const podsTab = page.getByRole('tab', { name: /لك/ });
  const newsTab = page.getByRole('tab', { name: /الأخبار/ });
  await podsTab.click();
  await expect(podsTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#phone-preview-pods')).toHaveAttribute('aria-hidden', 'false');
  await newsTab.click();
  await expect(phonePreview).toHaveAttribute('data-phone-state', 'news');
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
