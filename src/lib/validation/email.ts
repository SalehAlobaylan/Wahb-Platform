/**
 * Pragmatic email validation. Not RFC-perfect — RFC 5322 allows a wider
 * surface than any product actually wants — but rejects the obvious junk
 * (`x@y`, missing TLD, internal spaces, etc.) that the previous
 * `email.includes('@')` check let through.
 */
const EMAIL_REGEX =
    /^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isValidEmail(value: string): boolean {
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > 254) return false;
    return EMAIL_REGEX.test(trimmed);
}
