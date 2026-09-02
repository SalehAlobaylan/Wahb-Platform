
import type {
  PodsResponse,
  PodsSessionResponse,
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
  NewsWindow,
} from '@/types';
import {
  mockFetchPodsFeed,
  mockFetchNewsFeed,
  mockFetchContentItem,
  mockRecordInteraction,
  mockRemoveInteraction,
  mockFetchBookmarks,
  mockSearchContent,
  mockFetchTranscript,
} from './mock-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getAnonymousSessionId } from '@/lib/identity/session';
import { normalizePodsFeedItem, withLegacyMediaUrl } from '@/lib/utils/playback';

const API_BASE = '/api/v1';
export type PodsDurationPreference = 5 | 10 | 15 | 20 | 30 | 40;

/** Bounded transport signal consumed by feed pagination admission. */
export class FeedRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'FeedRequestError';
  }
}

function retryAfterMs(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : undefined;
}

function isContentItem(item: ContentItem | null): item is ContentItem {
  return item !== null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
 * Hits CMS /api/v1/content/mine. Cursor pagination matches the Pods feed.
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
  const payload = data.data || data;
  return {
    ...payload,
    items: (payload.items || []).map(withLegacyMediaUrl),
  };
}

/**
 * Fetch Pods feed items
 */
export async function fetchPodsFeed(cursor?: string | null, duration?: PodsDurationPreference | null): Promise<PodsResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockFetchPodsFeed(cursor);
  }

  const params = getIdentityParams();
  if (cursor) params.set('cursor', cursor);
  if (duration) params.set('duration', String(duration));
  params.set('limit', '20');
  params.set('exclude_seen', 'true');

  const response = await fetch(`${API_BASE}/feed/pods?${params}`);

  if (!response.ok) {
    throw new FeedRequestError('Pods feed request failed', response.status, retryAfterMs(response.headers.get('retry-after')));
  }

  const data = await response.json();
  const payload = data.data || data;
  return {
    ...payload,
    items: (payload.items || []).map(normalizePodsFeedItem).filter(isContentItem),
  };
}

function parsePodsSessionResponse(value: unknown): PodsSessionResponse {
  const payload = value && typeof value === 'object' && 'data' in value
    ? (value as { data?: unknown }).data
    : value;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid Pods session response');
  const raw = payload as Record<string, unknown>;
  if (typeof raw.session_id !== 'string' || !UUID_PATTERN.test(raw.session_id)) throw new Error('Invalid Pods session identity');
  if (typeof raw.expires_at !== 'string' || !Number.isFinite(Date.parse(raw.expires_at))) throw new Error('Invalid Pods session expiry');
  if (raw.cursor !== null && typeof raw.cursor !== 'string') throw new Error('Invalid Pods session cursor');
  if (typeof raw.caught_up !== 'boolean' || !Array.isArray(raw.items)) throw new Error('Invalid Pods session payload');
  const items = raw.items.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const candidate = item as ContentItem;
    if (typeof candidate.id !== 'string' || !UUID_PATTERN.test(candidate.id)) return null;
    return normalizePodsFeedItem(candidate);
  }).filter(isContentItem);
  if (items.length !== raw.items.length) throw new Error('Invalid Pods session item');
  return { session_id: raw.session_id, expires_at: raw.expires_at, cursor: raw.cursor as string | null, caught_up: raw.caught_up, items };
}

export async function createPodsFeedSession(duration?: PodsDurationPreference | null): Promise<PodsSessionResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    const page = await mockFetchPodsFeed();
    return {
      ...page,
      session_id: '00000000-0000-4000-8000-000000000001',
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      caught_up: page.items.length === 0,
    };
  }
  const params = getIdentityParams();
  if (duration) params.set('duration', String(duration));
  params.set('limit', '20');
  const response = await fetch(`${API_BASE}/feed/pods/sessions?${params}`, { method: 'POST' });
  if (!response.ok) throw new FeedRequestError('Pods session creation failed', response.status, retryAfterMs(response.headers.get('retry-after')));
  return parsePodsSessionResponse(await response.json());
}

export async function fetchPodsFeedSession(sessionId: string, cursor?: string | null): Promise<PodsSessionResponse> {
  if (!UUID_PATTERN.test(sessionId)) throw new Error('Invalid Pods session identity');
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    const page = await mockFetchPodsFeed(cursor);
    return {
      ...page,
      session_id: sessionId,
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      caught_up: page.items.length === 0,
    };
  }
  const params = getIdentityParams();
  params.set('limit', '20');
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(`${API_BASE}/feed/pods/sessions/${encodeURIComponent(sessionId)}?${params}`);
  if (!response.ok) throw new FeedRequestError('Pods session page failed', response.status, retryAfterMs(response.headers.get('retry-after')));
  return parsePodsSessionResponse(await response.json());
}

export async function fetchPodsFeedSessionFreshness(
  sessionId: string,
  duration?: PodsDurationPreference | null,
): Promise<boolean> {
  if (!UUID_PATTERN.test(sessionId)) throw new Error('Invalid Pods session identity');
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') return false;
  const params = getIdentityParams();
  if (duration) params.set('duration', String(duration));
  const response = await fetch(`${API_BASE}/feed/pods/sessions/${encodeURIComponent(sessionId)}/freshness?${params}`);
  if (!response.ok) throw new FeedRequestError('Pods session freshness failed', response.status, retryAfterMs(response.headers.get('retry-after')));
  const value: unknown = await response.json();
  const payload = value && typeof value === 'object' && 'data' in value ? (value as { data?: unknown }).data : value;
  if (!payload || typeof payload !== 'object' || typeof (payload as { has_new_content?: unknown }).has_new_content !== 'boolean') throw new Error('Invalid Pods freshness response');
  return (payload as { has_new_content: boolean }).has_new_content;
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
    source: m.source,
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
    // Badge a related-story card by its LEAD post's real type (article/tweet/
    // comment); fall back to NEWS when the lead format is absent.
    type: (s.format as ContentType) || 'NEWS',
    source: s.source,
    category: s.category,
    title: s.title || s.label,
    excerpt: s.excerpt,
    thumbnail_url: s.thumbnail_url || s.source_image_url,
    source_name: s.source_name,
    source_image_url: s.source_image_url,
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
    source: lead?.source,
    title: f.title || f.label,
    excerpt: f.excerpt,
    body_text: lead?.body_text,
    // POST media only — do NOT fall back to the source image here. The slide
    // distinguishes a real post image (full banner) from a source-logo fallback
    // (slim band); getDisplayImageUrl handles the source/favicon fallback chain.
    thumbnail_url: f.thumbnail_url,
    author: lead?.author,
    source_name: f.source_name,
    source_image_url: f.source_image_url,
    like_count: f.like_count,
    comment_count: f.comment_count,
    share_count: f.share_count,
    view_count: f.view_count,
    published_at: f.published_at,
    created_at: f.published_at,
  };
  // Coverage = the story's OTHER member posts (each an actual source covering
  // the same event), kept SEPARATE from related-story headlines so the UI can
  // show "who is covering this" transparently instead of a mysterious count.
  const otherMembers = (f.members ?? [])
    .filter((m) => m.id !== f.lead_id)
    .map(memberToContentItem);
  const relatedStories = (slide.related ?? []).map(storySummaryToContentItem);
  return {
    slide_id: slide.slide_id,
    featured,
    coverage: otherMembers,
    related: relatedStories,
    story: {
      label: f.label,
      memberCount: f.member_count,
      sourceCount: f.source_count ?? 1,
      updatedAt: f.last_member_at,
      lifecycle: f.lifecycle,
      isCarryover: f.is_carryover,
      reason: f.reason,
      summary: f.summary,
      bullets: f.bullets,
      category: f.category,
    },
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
export async function fetchNewsFeed(cursor?: string | null, window: NewsWindow = 'today'): Promise<NewsResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return mockFetchNewsFeed(cursor);
  }

  const params = getIdentityParams();
  if (cursor) params.set('cursor', cursor);
  params.set('window', window);
  params.set('limit', '10');
  params.set('exclude_seen', 'true');

  const response = await fetch(`${API_BASE}/feed/news?${params}`);

  if (!response.ok) {
    throw new FeedRequestError('News feed request failed', response.status, retryAfterMs(response.headers.get('retry-after')));
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
export type BookmarkFeedFilter = 'all' | 'pods' | 'news';
export type BookmarkSort = 'saved_desc' | 'saved_asc';

export interface FetchBookmarksOptions {
  cursor?: string;
  feed?: BookmarkFeedFilter;
  sort?: BookmarkSort;
  q?: string;
}

export async function fetchBookmarks(options: FetchBookmarksOptions = {}): Promise<PodsResponse> {
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
 * Fetch the current user's liked content, newest-like first. Mirrors the
 * bookmarks endpoint shape (PodsResponse) so it can reuse the same row UI.
 */
export async function fetchMyLikes(cursor?: string | null): Promise<PodsResponse> {
  const params = getIdentityParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const response = await fetch(`${API_BASE}/interactions/likes?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch likes: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

export interface UserStats {
  saved: number;
  likes: number;
  listened: number;
  created: number;
}

/**
 * Fetch the authenticated user's aggregate profile counts.
 */
export async function fetchUserStats(): Promise<UserStats> {
  const response = await fetch(`${API_BASE}/interactions/stats`);

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
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
