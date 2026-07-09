'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    useMuteTopic,
    usePreferences,
    useSaveDeclaredTopics,
    useTopicPicker,
} from '@/lib/hooks/use-preferences';
import type { PreferenceTopic } from '@/lib/api/preferences';

interface InterestsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function topicLabel(topic: PreferenceTopic): string {
    const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'en';
    return lang.startsWith('ar') ? topic.label_ar || topic.label_en : topic.label_en || topic.label_ar;
}

export function InterestsModal({ isOpen, onClose }: InterestsModalProps) {
    const picker = useTopicPicker();
    const prefs = usePreferences(isOpen);
    const saveDeclared = useSaveDeclaredTopics();
    const mute = useMuteTopic();
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen || !prefs.data) return;
        setSelected(prefs.data.declared.map((t) => t.id));
    }, [isOpen, prefs.data]);

    const categories = picker.data?.categories ?? [];
    const topics = picker.data?.topics ?? [];
    const grouped = useMemo(() => {
        const map = new Map<string, PreferenceTopic[]>();
        for (const topic of topics) {
            const key = topic.category_slug || 'general';
            map.set(key, [...(map.get(key) ?? []), topic]);
        }
        return map;
    }, [topics]);

    if (!isOpen) return null;

    const toggle = (id: string) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleSave = async () => {
        try {
            await saveDeclared.mutateAsync(selected);
            toast.success('Preferences saved');
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save preferences');
        }
    };

    const isLoading = picker.isLoading || prefs.isLoading;
    const isSaving = saveDeclared.isPending;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-card border-t border-border rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-serif font-bold text-foreground">Your Interests</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex h-40 items-center justify-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : topics.length === 0 ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                        Topics are being prepared. Your feed will keep using the universal ranking until the catalog is ready.
                    </div>
                ) : (
                    <div className="max-h-[55vh] space-y-5 overflow-y-auto pe-1 hide-scrollbar">
                        {categories.map((category) => {
                            const bucket = grouped.get(category.slug) ?? [];
                            if (bucket.length === 0) return null;
                            return (
                                <section key={category.slug} className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                        {topicLabel({
                                            id: category.slug,
                                            slug: category.slug,
                                            label_ar: category.label_ar,
                                            label_en: category.label_en,
                                        })}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {bucket.map((topic) => {
                                            const active = selected.includes(topic.id);
                                            return (
                                                <button
                                                    key={topic.id}
                                                    onClick={() => toggle(topic.id)}
                                                    className={cn(
                                                        'px-3.5 py-2 rounded-full text-sm font-medium transition-all border',
                                                        active
                                                            ? 'bg-news-accent/20 text-news-accent border-news-accent/40'
                                                            : 'bg-muted text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
                                                    )}
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        {active ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-50" />}
                                                        {topicLabel(topic)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}

                        {(prefs.data?.learned?.length ?? 0) > 0 && (
                            <section className="space-y-2 border-t border-border pt-4">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                    We have noticed you are into
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {prefs.data?.learned.map((topic) => (
                                        <button
                                            key={topic.id}
                                            onClick={() => mute.mutate(topic.id)}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-news-accent/50"
                                        >
                                            {topicLabel(topic)}
                                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={isSaving || isLoading || topics.length === 0}
                    className="mt-6 w-full py-3 rounded-xl bg-news-accent text-white font-bold text-sm tracking-wide hover:bg-news-accent/90 disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                    {isSaving ? 'Saving...' : `Save Interests (${selected.length})`}
                </button>
            </div>
        </div>
    );
}
