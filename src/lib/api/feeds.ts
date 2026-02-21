
import type { ForYouResponse, NewsResponse, ContentItem, Interaction } from '@/types';
import {
  mockFetchForYouFeed,
  mockFetchNewsFeed,
  mockFetchContentItem,
  mockRecordInteraction,
  mockRemoveInteraction,
  mockFetchBookmarks,
  mockSearchContent,
} from './mock-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/**
 * Fetch For You feed items
 */
export async function fetchForYouFeed(cursor?: string | null): Promise<ForYouResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockFetchForYouFeed(cursor);
  }

  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const response = await fetch(`${API_BASE}/feed/foryou?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch For You feed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Fetch News feed slides
 */
export async function fetchNewsFeed(cursor?: string | null): Promise<NewsResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockFetchNewsFeed(cursor);
  }

  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '10');

  const response = await fetch(`${API_BASE}/feed/news?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch News feed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Fetch single content item by ID
 */
export async function fetchContentItem(id: string): Promise<ContentItem> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockFetchContentItem(id);
  }

  const response = await fetch(`${API_BASE}/content/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch content item: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Record user interaction (like, bookmark, share, view, complete)
 */
export async function recordInteraction(
  contentItemId: string,
  interactionType: Interaction['interaction_type'],
  metadata?: Record<string, unknown>
): Promise<Interaction> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockRecordInteraction(contentItemId, interactionType, metadata);
  }

  const response = await fetch(`${API_BASE}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content_item_id: contentItemId,
      interaction_type: interactionType,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to record interaction: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Remove an interaction (unlike, unbookmark)
 */
export async function removeInteraction(
  contentItemId: string,
  interactionType: Interaction['interaction_type']
): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockRemoveInteraction(contentItemId, interactionType);
  }

  const response = await fetch(
    `${API_BASE}/interactions?content_item_id=${contentItemId}&type=${interactionType}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw new Error(`Failed to remove interaction: ${response.statusText}`);
  }
}

/**
 * Fetch user's bookmarked items
 */
export async function fetchBookmarks(cursor?: string): Promise<ForYouResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockFetchBookmarks(cursor);
  }

  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const response = await fetch(`${API_BASE}/interactions/bookmarks?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Search content items
 */
export async function searchContent(query: string): Promise<ContentItem[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockSearchContent(query);
  }

  const params = new URLSearchParams();
  params.set('q', query);
  params.set('limit', '30');

  const response = await fetch(`${API_BASE}/content/search?${params}`);

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.items || data.items || data;
}
