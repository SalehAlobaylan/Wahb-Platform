
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
    });
});
