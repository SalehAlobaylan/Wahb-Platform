
import { fetchForYouFeed, fetchNewsFeed } from '@/lib/api/feeds';
import * as mockClient from '@/lib/api/mock-client';

// Mock the mock-client module
jest.mock('@/lib/api/mock-client', () => ({
    mockFetchForYouFeed: jest.fn(),
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

        it('fetchForYouFeed calls mockFetchForYouFeed', async () => {
            await fetchForYouFeed();
            expect(mockClient.mockFetchForYouFeed).toHaveBeenCalled();
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

        it('fetchForYouFeed calls real API', async () => {
            await fetchForYouFeed();
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/feed/foryou?'));
            expect(mockClient.mockFetchForYouFeed).not.toHaveBeenCalled();
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
