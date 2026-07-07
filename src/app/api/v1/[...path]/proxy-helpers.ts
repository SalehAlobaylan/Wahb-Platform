const ALLOWED_PROXY_ROOTS = new Set(['feed', 'content', 'interactions', 'transcripts']);
const STRIPPED_REQUEST_HEADERS = [
  'host',
  'content-length',
  'connection',
  'transfer-encoding',
  'keep-alive',
  'accept-encoding',
  'authorization',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
  'x-real-ip',
  'forwarded',
];
const STRIPPED_RESPONSE_HEADERS = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
];

export function resolveProxyPath(path: string[]): string | null {
  if (path.length === 0) return null;

  const decodedSegments: string[] = [];
  for (const segment of path) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return null;
    }

    if (
      decoded === '' ||
      decoded === '.' ||
      decoded === '..' ||
      decoded.includes('/') ||
      decoded.includes('\\') ||
      /[\u0000-\u001f\u007f]/.test(decoded)
    ) {
      return null;
    }
    decodedSegments.push(decoded);
  }

  if (!ALLOWED_PROXY_ROOTS.has(decodedSegments[0])) return null;
  return decodedSegments.map(encodeURIComponent).join('/');
}

export function buildProxyTargetUrl(baseUrl: string, safePath: string, search: string): string {
  const target = new URL(safePath, `${baseUrl.replace(/\/$/, '')}/`);
  target.search = search;
  return target.toString();
}

export function buildProxyRequestHeaders(incoming: Headers, accessToken?: string): Headers {
  const requestHeaders = new Headers(incoming);
  for (const header of STRIPPED_REQUEST_HEADERS) {
    requestHeaders.delete(header);
  }
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }
  return requestHeaders;
}

export function buildProxyResponseHeaders(incoming: Headers): Headers {
  const responseHeaders = new Headers(incoming);
  for (const header of STRIPPED_RESPONSE_HEADERS) {
    responseHeaders.delete(header);
  }
  return responseHeaders;
}
