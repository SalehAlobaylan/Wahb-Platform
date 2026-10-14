import { ReadableStream } from 'node:stream/web';
import { ExperienceSessionLimiter, telemetryRuntimeMatches, readExperienceBody } from '../admission';
it('expires a full 10,000-tab budget before admitting a new tab', () => { let now = 0; const limiter = new ExperienceSessionLimiter(10000, () => now); for (let i = 0; i < 10000; i++) expect(limiter.allow(`tab${i}`)).toBe(true); expect(limiter.allow('new')).toBe(false); now = 60001; expect(limiter.allow('new')).toBe(true); });
it('beacon body runtime identity has exact bounded managed semantics', () => { expect(telemetryRuntimeMatches('launch1', 'launch1')).toBe(true); expect(telemetryRuntimeMatches('launch1', 'launch0')).toBe(false); expect(telemetryRuntimeMatches('launch1', undefined)).toBe(false); expect(telemetryRuntimeMatches(undefined, undefined)).toBe(true); });

it('rejects an oversized open tee stream immediately without awaiting its unread branch', async () => {
 const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(65537)); } });
 const [unread, clone] = stream.tee();
 const request = { headers: { get: () => null }, body: clone } as unknown as Request;
 await expect(readExperienceBody(request)).rejects.toThrow('too_large');
 await unread.cancel();
});
