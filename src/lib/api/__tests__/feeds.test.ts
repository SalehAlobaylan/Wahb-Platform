
import { FeedRequestError, createPodsFeedSession, fetchPodsFeed, fetchNewsFeed } from '@/lib/api/feeds';
import * as mockClient from '@/lib/api/mock-client';

// Mock the mock-client module
jest.mock('@/lib/api/mock-client', () => ({
    mockFetchPodsFeed: jest.fn(),
    mockFetchNewsFeed: jest.fn(),
}));

describe('Feeds API', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('when NEXT_PUBLIC_USE_MOCK_DATA is true', () => {
        beforeEach(() => {
            process.env.NEXT_PUBLIC_USE_MOCK_DATA = 'true';
        });

        it('fetchPodsFeed calls mockFetchPodsFeed', async () => {
            await fetchPodsFeed();
            expect(mockClient.mockFetchPodsFeed).toHaveBeenCalled();
        });

        it('fetchNewsFeed calls mockFetchNewsFeed', async () => {
            await fetchNewsFeed();
            expect(mockClient.mockFetchNewsFeed).toHaveBeenCalled();
        });
    });

    describe('when NEXT_PUBLIC_USE_MOCK_DATA is false', () => {
        beforeEach(() => {
            process.env.NEXT_PUBLIC_USE_MOCK_DATA = 'false';
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: [] }),
                })
            ) as jest.Mock;
        });

        it('fetchPodsFeed calls real API', async () => {
            await fetchPodsFeed();
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/feed/pods?'));
            expect(mockClient.mockFetchPodsFeed).not.toHaveBeenCalled();
        });

        it('passes duration preference to the Pods API', async () => {
            await fetchPodsFeed(null, 15);

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('duration=15'));
        });

		it('creates and runtime-validates a frozen Pods session', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ session_id: '550e8400-e29b-41d4-a716-446655440000', expires_at: '2026-08-10T00:00:00Z', cursor: null, caught_up: false, items: [] }),
			});
			await expect(createPodsFeedSession(15)).resolves.toMatchObject({ session_id: '550e8400-e29b-41d4-a716-446655440000' });
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/feed/pods/sessions?'), { method: 'POST' });
		});

		it('rejects malformed frozen-session timestamps', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ session_id: '550e8400-e29b-41d4-a716-446655440000', expires_at: 'not-a-date', cursor: null, caught_up: false, items: [] }),
			});
			await expect(createPodsFeedSession()).rejects.toThrow('Invalid Pods session expiry');
		});

        it('exposes bounded retry metadata for a throttled feed request', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 429,
                headers: { get: (name: string) => name === 'retry-after' ? '3' : null },
            });

            await expect(fetchPodsFeed()).rejects.toMatchObject<Partial<FeedRequestError>>({
                name: 'FeedRequestError',
                status: 429,
                retryAfterMs: 3_000,
            });
        });

        it('normalizes playback_url-only Pods items with a legacy media_url fallback', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    cursor: null,
                    items: [{
                        id: 'chapter-1',
                        type: 'PODCAST',
                        title: 'Atomized chapter',
                        playback_url: 'https://cdn.example.com/chapter.m3u8',
                        playback_type: 'hls',
                        fallback_playback_url: 'https://cdn.example.com/chapter.mp4',
                    }],
                }),
            });

            const result = await fetchPodsFeed();

            expect(result.items[0]).toMatchObject({
                playback_url: 'https://cdn.example.com/chapter.m3u8',
                media_url: 'https://cdn.example.com/chapter.m3u8',
            });
        });

        it('keeps legal raw units through 40 minutes and rejects only over-limit media', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    cursor: null,
                    items: [
                        {
                            id: 'thirty-minute-parent',
                            type: 'PODCAST',
                            title: 'Thirty minute parent',
                            media_url: 'https://cdn.example.com/thirty.mp4',
                            duration_sec: 1800,
                        },
                        {
                            id: 'long-parent',
                            type: 'PODCAST',
                            title: 'Long parent',
                            media_url: 'https://cdn.example.com/parent.mp4',
                            duration_sec: 2100,
                        },
                        {
                            id: 'forty-minute-parent',
                            type: 'PODCAST',
                            title: 'Exactly forty minutes',
                            media_url: 'https://cdn.example.com/forty.mp4',
                            duration_sec: 2400,
                        },
                        {
                            id: 'over-limit-parent',
                            type: 'PODCAST',
                            title: 'Over limit',
                            media_url: 'https://cdn.example.com/over.mp4',
                            duration_sec: 2401,
                        },
                        {
                            id: 'long-chapter',
                            type: 'PODCAST',
                            title: 'Contextual chapter',
                            media_url: 'https://cdn.example.com/context.mp4',
                            parent_id: 'parent-1',
                            duration_sec: 2100,
                        },
                        {
                            id: 'chapter',
                            type: 'PODCAST',
                            title: 'Chapter',
                            media_url: 'https://cdn.example.com/chapter.mp4',
                            duration_sec: 900,
                        },
                        {
                            id: 'unknown-duration-parent',
                            type: 'PODCAST',
                            title: 'Duration unavailable',
                            media_url: 'https://cdn.example.com/unknown.mp4',
                        },
                    ],
                }),
            });

            const result = await fetchPodsFeed();

            expect(result.items.map((item) => item.id)).toEqual([
                'thirty-minute-parent',
                'long-parent',
                'forty-minute-parent',
                'long-chapter',
                'chapter',
                'unknown-duration-parent',
            ]);
        });

        it('fetchNewsFeed calls real API', async () => {
            await fetchNewsFeed(null, 'week');
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/feed/news?'));
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('window=week'));
            expect(mockClient.mockFetchNewsFeed).not.toHaveBeenCalled();
        });

        it('maps circulation story context from real API', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    cursor: null,
                    slides: [{
                        slide_id: 'slide-1',
                        featured: {
                            story_id: 'story-1',
                            lead_id: 'lead-1',
                            label: 'Major story',
                            last_member_at: '2026-06-19T11:30:00Z',
                            lifecycle: 'cooling',
                            is_carryover: true,
                            reason: 'Carryover fill',
                            title: 'Story title',
                            excerpt: 'Story excerpt',
                            published_at: '2026-06-19T08:00:00Z',
                            member_count: 4,
                            source_count: 2,
                            like_count: 1,
                            comment_count: 2,
                            share_count: 3,
                            view_count: 4,
                            members: [],
                        },
                        related: [],
                    }],
                }),
            });

            const result = await fetchNewsFeed(null, 'today');

            expect(result.slides[0].story).toMatchObject({
                updatedAt: '2026-06-19T11:30:00Z',
                lifecycle: 'cooling',
                isCarryover: true,
                reason: 'Carryover fill',
                memberCount: 4,
                sourceCount: 2,
            });
        });
    });
});
