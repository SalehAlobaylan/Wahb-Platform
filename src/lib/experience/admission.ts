export const RUX_MAX_BODY_BYTES = 64 * 1024;
export function telemetryRuntimeMatches(expected: string | undefined, captured: unknown): boolean {
  return !expected || typeof captured === 'string' && captured.length <= 160 && captured === expected;
}
export async function readExperienceBody(request: Request): Promise<string> {
  if (Number(request.headers.get('content-length')) > RUX_MAX_BODY_BYTES) throw new Error('too_large');
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => { deadline = setTimeout(() => reject(new Error('body_timeout')), 5000); });
  try {
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), timedOut]);
      if (done) break;
      size += value.byteLength;
      if (size > RUX_MAX_BODY_BYTES) { void reader.cancel().catch(() => undefined); throw new Error('too_large'); }
      chunks.push(value);
    }
  } finally { clearTimeout(deadline); void reader.cancel().catch(() => undefined); reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}
export class ExperienceSessionLimiter {
  private windows = new Map<string, { count: number; resetAt: number }>();
  constructor(private capacity = 10000, private now = Date.now) {}
  allow(session: string): boolean {
    const now = this.now();
    // Sweep before capacity admission, including the fully occupied case.
    for (const [key, entry] of this.windows) if (entry.resetAt <= now) this.windows.delete(key);
    const entry = this.windows.get(session);
    if (entry) { if (entry.count >= 60) return false; entry.count++; return true; }
    if (this.windows.size >= this.capacity) return false;
    this.windows.set(session, { count: 1, resetAt: now + 60000 });
    return true;
  }
}
