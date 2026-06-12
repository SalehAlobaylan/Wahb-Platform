
import type {
  ForYouResponse,
  NewsResponse,
  NewsSlide,
  ContentItem,
  ContentType,
  Interaction,
  Transcript,
  StoryNewsResponse,
  StoryNewsSlide,
  StoryMember,
  StorySummary,
  CommentsResponse,
} from '@/types';
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

const API_BASE = '/api/v1';

function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    const stored = sessionStorage.getItem('wahb_session_id');
    if (stored) return stored;

    const newId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    sessionStorage.setItem('wahb_session_id', newId);
    return newId;
  } catch {
    return '';
  }
}

// Identity for interaction/feed calls. For authenticated users we send NO
// identity field: the /api/v1 proxy injects the user's JWT from the httpOnly
// cookie and CMS derives the user id from that verified token. Sending a
// client-supplied user_id is both pointless (the server ignores it) and was
// the vector for an IDOR — so we never send it. Anonymous users still send
// their local session_id for session-scoped engagement.
function getIdentityParams(): URLSearchParams {
  const params = new URLSearchParams();
  const { user, isAuthenticated } = useAuthStore.getState();
  if (!(isAuthenticated && user) && typeof window !== 'undefined') {
    const sessionId = getAnonymousSessionId();
    if (sessionId) params.set('session_id', sessionId);
  }
  return params;
}

function getIdentityBody(): Record<string, string> {
  const { user, isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated && user) {
    return {};
  }
  if (typeof window !== 'undefined') {
    const sessionId = getAnonymousSessionId();
    if (sessionId) return { session_id: sessionId };
  }
  return {};
}

/**
 * Fetch the authenticated user's own content (PODCAST or ARTICLE).
 * Hits CMS /api/v1/content/mine. Cursor pagination matches the For You feed.
 */
export interface MyContentItem {
  id: string;
  type: string;
  status: string;
  title?: string;
  excerpt?: string;
  media_url?: string;
  thumbnail_url?: string;
  duration_sec?: number;
  like_count: number;
  comment_count: number;
  published_at?: string;
}

export interface MyContentResponse {
  cursor: string | null;
  items: MyContentItem[];
}

export async function fetchMyContent(
  type: 'PODCAST' | 'ARTICLE' | 'VIDEO',
  cursor?: string | null,
): Promise<MyContentResponse> {
  const params = new URLSearchParams();
  params.set('type', type);
  params.set('limit', '20');
  if (cursor) params.set('cursor', cursor);

  const response = await fetch(`${API_BASE}/content/mine?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user content: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data || data;
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

// ─── Phase 13: story → editorial slide adapter ─────────────────────────────
// The CMS News feed returns story-slides (a featured story + its members +
// related stories). The News UI renders the editorial NewsSlide shape, so we
// map at the fetch boundary: featured = the story's top member (it already
// carries the headline/image), related = the story's other members (same-event
// coverage) + the related-story headlines.

function memberToContentItem(m: StoryMember): ContentItem {
  return {
    id: m.id,
    // The member's format (ARTICLE/TWEET/COMMENT) carries the content shape the
    // magazine badges key off; fall back to the kind (NEWS) when absent.
    type: (m.format as ContentType) || m.type,
    title: m.title,
    body_text: m.body_text,
    excerpt: m.excerpt,
    thumbnail_url: m.thumbnail_url || m.source_image_url,
    author: m.author,
    source_name: m.source_name,
    source_image_url: m.source_image_url,
    like_count: m.like_count,
    comment_count: m.comment_count,
    share_count: m.share_count,
    view_count: m.view_count,
    published_at: m.published_at,
    created_at: m.published_at,
  };
}

function storySummaryToContentItem(s: StorySummary): ContentItem {
  return {
    // Target the lead member's content id, NOT story_id (a topic id) — so
    // open / like / bookmark hit a real content row instead of 404ing.
    id: s.lead_id || s.story_id,
    type: 'NEWS',
    title: s.title || s.label,
    excerpt: s.excerpt,
    thumbnail_url: s.thumbnail_url || s.source_image_url,
    source_name: s.source_name,
    source_image_url: s.source_image_url,
    topic_tags: s.label ? [s.label] : undefined,
    like_count: s.like_count,
    comment_count: s.comment_count,
    share_count: s.share_count,
    view_count: s.view_count,
    published_at: s.published_at,
    created_at: s.published_at,
  };
}

function storySlideToNewsSlide(slide: StoryNewsSlide): NewsSlide {
  const f = slide.featured;
  // The headline/image/engagement come from the lead (top-engagement) member,
  // which may differ from members[0] (newest). Resolve it for id/body/author.
  const lead = f.members?.find((m) => m.id === f.lead_id) ?? f.members?.[0];
  const featured: ContentItem = {
    id: f.lead_id || lead?.id || f.story_id,
    type: (lead?.format as ContentType) || lead?.type || 'NEWS',
    title: f.title || f.label,
    excerpt: f.excerpt,
    body_text: lead?.body_text,
    thumbnail_url: f.thumbnail_url || f.source_image_url,
    author: lead?.author,
    source_name: f.source_name,
    source_image_url: f.source_image_url,
    topic_tags: f.label ? [f.label] : undefined,
    like_count: f.like_count,
    comment_count: f.comment_count,
    share_count: f.share_count,
    view_count: f.view_count,
    published_at: f.published_at,
    created_at: f.published_at,
  };
  // Other members (the story's remaining coverage), excluding the lead shown as
  // featured, then the related-story headlines.
  const otherMembers = (f.members ?? [])
    .filter((m) => m.id !== f.lead_id)
    .map(memberToContentItem);
  const relatedStories = (slide.related ?? []).map(storySummaryToContentItem);
  return {
    slide_id: slide.slide_id,
    featured,
    related: [...otherMembers, ...relatedStories],
    // Aggregation signal for the "N posts · N sources" chip — only meaningful
    // when the story actually groups multiple posts.
    story:
      f.member_count > 1
        ? {
            label: f.label,
            memberCount: f.member_count,
            sourceCount: f.source_count ?? 1,
          }
        : undefined,
  };
}

function storyNewsResponseToNews(raw: StoryNewsResponse): NewsResponse {
  return {
    cursor: raw.cursor ?? null,
    slides: (raw.slides ?? []).map(storySlideToNewsSlide),
  };
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
  const raw = (data.data || data) as StoryNewsResponse;
  return storyNewsResponseToNews(raw);
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
 * Fetch comments for a content item (newest first, cursor-paginated).
 * Identity params let the server mark the caller's own comments (is_mine).
 */
export async function fetchComments(
  contentId: string,
  cursor?: string | null
): Promise<CommentsResponse> {
  const params = getIdentityParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const response = await fetch(`${API_BASE}/content/${contentId}/comments?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Post a comment on a content item. Comments ride the generic interactions
 * endpoint with the text (and optional display name) in metadata.
 */
export async function postComment(
  contentId: string,
  text: string,
  author?: string
): Promise<Interaction> {
  return recordInteraction(contentId, 'comment', {
    text,
    ...(author ? { author } : {}),
  });
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
export type BookmarkFeedFilter = 'all' | 'foryou' | 'news';
export type BookmarkSort = 'saved_desc' | 'saved_asc';

export interface FetchBookmarksOptions {
  cursor?: string;
  feed?: BookmarkFeedFilter;
  sort?: BookmarkSort;
  q?: string;
}

export async function fetchBookmarks(options: FetchBookmarksOptions = {}): Promise<ForYouResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockFetchBookmarks(options.cursor);
  }

  const params = getIdentityParams();
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.feed && options.feed !== 'all') params.set('feed', options.feed);
  if (options.sort) params.set('sort', options.sort);
  if (options.q?.trim()) params.set('q', options.q.trim());
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

export async function requestRestore(
  contentItemId: string
): Promise<{ status: string; message: string; retry_after_seconds?: number }> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    await new Promise(r => setTimeout(r, 800));
    return { status: 'pending', message: 'Restore requested (mock)' };
  }

  const response = await fetch(`${API_BASE}/content/${contentItemId}/request-restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    return {
      status: 'throttled',
      message: data.message ?? 'Restore already requested recently',
      retry_after_seconds: data.retry_after_seconds,
    };
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `Failed to request restore: ${response.statusText}`);
  }

  return response.json();
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
