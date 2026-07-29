'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ArchiveStory = { id: string; position: number; label: string; snapshot: { title?: string; excerpt?: string; source_name?: string; original_url?: string; category?: string }; final_score: number };
type Archive = { headline: string; introduction: string; headline_ar?: string; introduction_ar?: string; month_start: string; revision: number; limited_coverage: boolean };

export default function MonthInReviewPage({ params }: { params: Promise<{ month: string }> }) {
  const [month, setMonth] = useState('');
  const [archive, setArchive] = useState<Archive | null>(null);
  const [stories, setStories] = useState<ArchiveStory[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { params.then(({ month: value }) => { setMonth(value); fetch(`/api/v1/feed/news/months/${value}/review`).then(async (response) => { if (!response.ok) throw new Error('This Month in Review is not published yet.'); return response.json(); }).then((body) => { setArchive(body.data.archive); setStories(body.data.stories ?? []); }).catch((reason) => setError(reason.message)); }); }, [params]);
  if (error) return <main className="mx-auto max-w-xl px-5 py-16"><Link className="text-sm text-primary" href="/news">← News</Link><h1 className="mt-6 text-3xl font-semibold">Month in Review</h1><p className="mt-3 text-muted-foreground">{error}</p></main>;
  const arabic = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ar');
  return <main className="mx-auto max-w-2xl px-5 py-10"><Link className="text-sm text-primary" href="/news">← Live News</Link>{!archive ? <p className="mt-8 text-muted-foreground">Loading the archive…</p> : <><p className="mt-8 text-sm uppercase tracking-[0.18em] text-muted-foreground">{new Date(archive.month_start).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · verified archive</p><h1 className="mt-3 text-4xl font-semibold tracking-tight" dir={arabic ? 'rtl' : 'ltr'}>{arabic ? archive.headline_ar ?? archive.headline : archive.headline}</h1><p className="mt-4 text-lg leading-8 text-muted-foreground" dir={arabic ? 'rtl' : 'ltr'}>{arabic ? archive.introduction_ar ?? archive.introduction : archive.introduction}</p>{archive.limited_coverage && <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">This was a sparse month, so the archive contains only stories that met the quality and diversity threshold.</p>}<ol className="mt-10 space-y-5">{stories.map((story) => <li key={story.id} className="rounded-xl border bg-card p-5"><p className="text-xs font-medium text-muted-foreground">{story.position}. {story.snapshot.category ?? 'News'} · {story.snapshot.source_name ?? 'Wahb'}</p><h2 className="mt-2 text-xl font-semibold">{story.snapshot.title ?? story.label}</h2>{story.snapshot.excerpt && <p className="mt-2 leading-7 text-muted-foreground">{story.snapshot.excerpt}</p>}{story.snapshot.original_url && <a className="mt-3 inline-block text-sm text-primary" href={story.snapshot.original_url} target="_blank" rel="noreferrer">Read original source →</a>}</li>)}</ol></>}</main>;
}
