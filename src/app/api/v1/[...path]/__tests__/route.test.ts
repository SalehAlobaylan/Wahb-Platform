import {
  buildProxyRequestHeaders,
  buildProxyResponseHeaders,
  buildProxyTargetUrl,
  resolveProxyPath,
} from '../proxy-helpers';

describe('/api/v1 proxy helpers', () => {
  it('normalizes safe public CMS paths', () => {
    expect(resolveProxyPath(['feed', 'foryou'])).toBe('feed/foryou');
    expect(resolveProxyPath(['content', 'item%201'])).toBe('content/item%201');
    expect(resolveProxyPath(['interactions', 'bookmarks'])).toBe('interactions/bookmarks');
    expect(resolveProxyPath(['transcripts', 'transcript-1'])).toBe('transcripts/transcript-1');
    expect(resolveProxyPath(['topics', 'picker'])).toBe('topics/picker');
    expect(resolveProxyPath(['preferences'])).toBe('preferences');
    expect(resolveProxyPath(['preferences', 'topics', 'topic-1', 'mute'])).toBe('preferences/topics/topic-1/mute');
  });

  it('rejects path traversal, slash smuggling, and non-public CMS roots', () => {
    expect(resolveProxyPath(['..', 'internal'])).toBeNull();
    expect(resolveProxyPath(['feed', '..'])).toBeNull();
    expect(resolveProxyPath(['feed', '%2e%2e'])).toBeNull();
    expect(resolveProxyPath(['feed', 'foo%2Fbar'])).toBeNull();
    expect(resolveProxyPath(['internal', 'media-atomization'])).toBeNull();
    expect(resolveProxyPath(['admin', 'media-atomization'])).toBeNull();
  });

  it('keeps proxy targets under the configured public API base', () => {
    expect(buildProxyTargetUrl(
      'https://cms.example.com/api/v1',
      'feed/foryou',
      '?limit=20'
    )).toBe('https://cms.example.com/api/v1/feed/foryou?limit=20');
  });

  it('bridges the httpOnly cookie token and strips client-supplied forwarding headers', () => {
    const headers = buildProxyRequestHeaders(new Headers({
      authorization: 'Bearer attacker-token',
      cookie: 'wahb_refresh_token=secret; arbitrary=value',
      origin: 'https://attacker.example',
      'x-forwarded-for': '203.0.113.1',
      'x-forwarded-host': 'evil.example',
      'x-arbitrary-client-header': 'do-not-forward',
      'content-type': 'application/json',
    }), 'cookie-token');

    expect(headers.get('authorization')).toBe('Bearer cookie-token');
    expect(headers.get('cookie')).toBeNull();
    expect(headers.get('origin')).toBeNull();
    expect(headers.get('x-forwarded-for')).toBeNull();
    expect(headers.get('x-forwarded-host')).toBeNull();
    expect(headers.get('x-arbitrary-client-header')).toBeNull();
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('does not forward upstream Set-Cookie or transport headers to the browser', () => {
    const headers = buildProxyResponseHeaders(new Headers({
      'set-cookie': 'cms_session=secret',
      'content-length': '123',
      'content-type': 'application/json',
    }));

    expect(headers.get('set-cookie')).toBeNull();
    expect(headers.get('content-length')).toBeNull();
    expect(headers.get('content-type')).toBe('application/json');
  });
});
