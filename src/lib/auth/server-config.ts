import 'server-only';

/** Auth routes must never fall back to a browser-exposed service URL. */
export function getIamBaseUrl(): string | null {
  const value = process.env.IAM_API_URL?.trim();
  return value ? value.replace(/\/$/, '') : null;
}
