
import type { ForYouResponse, NewsResponse, ContentItem, Interaction, Transcript } from '@/types';
import {
  mockFetchForYouFeed,
  mockFetchNewsFeed,
  mockFetchContentItem,
  mockRecordInteraction,
  mockRemoveInteraction,
  mockFetchBookmarks,
  mockSearchContent,
  mockFetchTranscript,
} from './mock-client';
import { useAuthStore } from '@/lib/stores/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

function getIdentityParams(): URLSearchParams {
  const params = new URLSearchParams();
  const { user, isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated && user) {
    params.set('user_id', user.id);
  } else if (typeof window !== 'undefined') {
    const sessionId = sessionStorage.getItem('wahb_session_id') || '';
    if (sessionId) params.set('session_id', sessionId);
  }
  return params;
}

function getIdentityBody(): Record<string, string> {
  const { user, isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated && user) {
    return { user_id: user.id };
  }
  if (typeof window !== 'undefined') {
    const sessionId = sessionStorage.getItem('wahb_session_id') || '';
    if (sessionId) return { session_id: sessionId };
  }
  return {};
}

/**
 * Fetch For You feed items
 */
export async function fetchForYouFeed(cursor?: string | null): Promise<ForYouResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockFetchForYouFeed(cursor);
  }

  const params = getIdentityParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');
  params.set('exclude_seen', 'true');

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

  const params = getIdentityParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '10');
  params.set('exclude_seen', 'true');

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
      ...getIdentityBody(),
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

  const idParams = getIdentityParams();
  idParams.set('content_item_id', contentItemId);
  idParams.set('type', interactionType);

  const response = await fetch(
    `${API_BASE}/interactions?${idParams}`,
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

  const params = getIdentityParams();
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

/**
 * Fetch transcript by ID (lazy-loaded when user opens transcript tab)
 */
export async function fetchTranscript(transcriptId: string): Promise<Transcript> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockFetchTranscript(transcriptId);
  }

  const response = await fetch(`${API_BASE}/transcripts/${transcriptId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch transcript: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Request transcript generation for a content item (logged-in users only).
 * Calls our Next.js API proxy which reads the JWT from httpOnly cookie
 * and forwards it to CMS with proper Authorization header.
 * CMS validates the JWT, extracts user_id from the token, and triggers
 * the Enrichment Service asynchronously.
 */
export interface WatchHistoryItem {
  content_id: string;
  viewed_at: string;
  type: string;
  title: string;
  thumbnail_url?: string;
  media_url?: string;
  duration_sec?: number;
  author?: string;
  source_name?: string;
}

export interface WatchHistoryResponse {
  cursor: string | null;
  items: WatchHistoryItem[];
}

/**
 * Fetch the current user's watch history (viewed items), paginated.
 */
export async function fetchWatchHistory(cursor?: string | null): Promise<WatchHistoryResponse> {
  const params = getIdentityParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const response = await fetch(`${API_BASE}/interactions/history?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch watch history: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Clear the current user's watch history.
 */
export async function clearWatchHistory(): Promise<void> {
  const params = getIdentityParams();
  const response = await fetch(`${API_BASE}/interactions/history?${params}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Failed to clear history: ${response.statusText}`);
  }
}

export async function requestTranscription(contentItemId: string): Promise<{ status: string; message: string }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2000));
    return { status: 'processing', message: 'Transcript generation started' };
  }

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content_id: contentItemId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to request transcription: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}
