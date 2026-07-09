export interface PreferenceTopic {
  id: string;
  slug: string;
  label_ar: string;
  label_en: string;
  category_slug?: string;
  score?: number;
  state?: string;
}

export interface TopicCategory {
  slug: string;
  label_ar: string;
  label_en: string;
  sort_order: number;
}

export interface TopicPickerResponse {
  categories: TopicCategory[];
  topics: PreferenceTopic[];
}

export interface PreferencesResponse {
  declared: PreferenceTopic[];
  learned: PreferenceTopic[];
  muted: PreferenceTopic[];
}

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || res.statusText);
  }
  return (data?.data ?? data) as T;
}

export async function fetchTopicPicker(): Promise<TopicPickerResponse> {
  const res = await fetch('/api/v1/topics/picker');
  return readJson<TopicPickerResponse>(res);
}

export async function fetchPreferences(): Promise<PreferencesResponse> {
  const res = await fetch('/api/v1/preferences');
  return readJson<PreferencesResponse>(res);
}

export async function saveDeclaredTopics(topicIds: string[]): Promise<PreferencesResponse> {
  const res = await fetch('/api/v1/preferences/topics', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic_ids: topicIds }),
  });
  return readJson<PreferencesResponse>(res);
}

export async function muteTopic(topicId: string): Promise<PreferencesResponse> {
  const res = await fetch(`/api/v1/preferences/topics/${topicId}/mute`, { method: 'POST' });
  return readJson<PreferencesResponse>(res);
}

export async function unmuteTopic(topicId: string): Promise<PreferencesResponse> {
  const res = await fetch(`/api/v1/preferences/topics/${topicId}/mute`, { method: 'DELETE' });
  return readJson<PreferencesResponse>(res);
}
