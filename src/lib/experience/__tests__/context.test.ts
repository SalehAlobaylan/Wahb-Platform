import { getClientContext } from '../context';
import {
  RUX_BROWSER_FAMILIES,
  RUX_DEVICE_CLASSES,
  RUX_NETWORK_CLASSES,
} from '../types';

// Reset the module-level cache between UA fixtures.
function withUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
  jest.resetModules();
}

describe('RUX client context detection', () => {
  const cases: Array<[string, string, number]> = [
    ['Safari iOS 18', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 18],
    ['Chrome Android', 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36', 126],
    ['Edge desktop', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', 126],
    ['Firefox desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0', 128],
  ];

  it.each(cases)('detects %s within allowlisted enums', async (_label, ua, major) => {
    withUserAgent(ua);
    const { getClientContext: fresh } = await import('../context');
    const ctx = fresh();
    expect(RUX_BROWSER_FAMILIES).toContain(ctx.browser_family);
    expect(RUX_DEVICE_CLASSES).toContain(ctx.device_class);
    expect(RUX_NETWORK_CLASSES).toContain(ctx.network_class);
    expect(ctx.browser_major).toBe(major);
    expect(ctx.browser_major).toBeGreaterThanOrEqual(0);
    expect(ctx.browser_major).toBeLessThanOrEqual(999);
  });

  it('never emits a free-form cohort value', () => {
    const ctx = getClientContext();
    expect(RUX_BROWSER_FAMILIES).toContain(ctx.browser_family);
    expect(typeof ctx.installed_pwa).toBe('boolean');
  });
});
