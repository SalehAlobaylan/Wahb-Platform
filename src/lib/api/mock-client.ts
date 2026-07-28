
import { PodsResponse, NewsResponse, ContentItem, Interaction, Transcript } from '@/types';
import { MOCK_PODS_ITEMS, MOCK_NEWS_SLIDES } from '@/lib/mocks/data';

const SIMULATED_DELAY_MS = 800;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockFetchPodsFeed(cursor?: string | null): Promise<PodsResponse> {
    await delay(SIMULATED_DELAY_MS);

    // Simple pagination simulation
    const pageSize = 20;
    // In a real mock we might slice the array based on cursor, 
    // but for now we'll just return the full set or a subset

    return {
        cursor: 'next-cursor-token', // Infinite scroll simulation
        items: MOCK_PODS_ITEMS,
    };
}

export async function mockFetchNewsFeed(cursor?: string | null): Promise<NewsResponse> {
    await delay(SIMULATED_DELAY_MS);

    return {
        cursor: 'next-cursor-token',
        slides: MOCK_NEWS_SLIDES,
    };
}

export async function mockFetchContentItem(id: string): Promise<ContentItem> {
    await delay(SIMULATED_DELAY_MS);

    const item = MOCK_PODS_ITEMS.find(i => i.id === id) ||
        MOCK_NEWS_SLIDES.flatMap(s => [s.featured, ...(s.coverage ?? []), ...s.related]).find(i => i.id === id);

    if (!item) {
        throw new Error('Content item not found');
    }

    return item;
}

export async function mockRecordInteraction(
    contentItemId: string,
    interactionType: Interaction['interaction_type'],
    metadata?: Record<string, unknown>
): Promise<Interaction> {
    await delay(300); // Faster interaction

    return {
        id: crypto.randomUUID(),
        content_item_id: contentItemId,
        interaction_type: interactionType,
        created_at: new Date().toISOString(),
    };
}

export async function mockRemoveInteraction(
    contentItemId: string,
    interactionType: Interaction['interaction_type']
): Promise<void> {
    await delay(300);
}

export async function mockFetchBookmarks(cursor?: string): Promise<PodsResponse> {
    await delay(SIMULATED_DELAY_MS);
    return {
        cursor: null,
        items: [], // Empty for now
    };
}

export async function mockSearchContent(query: string): Promise<ContentItem[]> {
    await delay(SIMULATED_DELAY_MS);

    if (!query.trim()) return [];

    const q = query.toLowerCase();

    // Collect all content items from both feeds
    const allItems: ContentItem[] = [
        ...MOCK_PODS_ITEMS,
        ...MOCK_NEWS_SLIDES.flatMap(s => [s.featured, ...(s.coverage ?? []), ...s.related]),
    ];

    // De-duplicate by id
    const seen = new Set<string>();
    const unique = allItems.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });

    // Fuzzy search by title, author, source, tags, body
    return unique.filter(item => {
        const fields = [
            item.title,
            item.author,
            item.source_name,
            item.body_text,
            item.excerpt,
            ...(item.topic_tags || []),
        ].filter(Boolean).map(f => f!.toLowerCase());

        return fields.some(f => f.includes(q));
    });
}

export async function mockFetchTranscript(transcriptId: string): Promise<Transcript> {
    await delay(SIMULATED_DELAY_MS);

    return {
        id: transcriptId,
        content_item_id: 'mock-content-id',
        full_text: 'Welcome to today\'s episode. We\'re going to be discussing the latest developments in technology and how they impact our daily lives. This topic is really important because it affects everyone. Let me share some insights from our research. The key takeaway here is that we need to focus on building sustainable solutions.',
        word_timestamps: [
            { start: 0, end: 8.5, text: 'Welcome to today\'s episode. We\'re going to be discussing the latest developments in technology and how they impact our daily lives.' },
            { start: 8.5, end: 15.2, text: 'This topic is really important because it affects everyone.' },
            { start: 15.2, end: 25.8, text: 'Let me share some insights from our research.' },
            { start: 25.8, end: 35.0, text: 'The key takeaway here is that we need to focus on building sustainable solutions.' },
        ],
        language: 'en',
        created_at: new Date().toISOString(),
    };
}
