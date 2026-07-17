import { expect, test } from '@playwright/test';

test('feed routes render without an error boundary', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText('Application error');
  await page.goto('/news');
  await expect(page.locator('body')).not.toContainText('Application error');
});
