'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores';
import { useUpdateProfile } from '@/lib/hooks/use-auth';
import { useTranslations } from '@/lib/i18n';
import type { AuthUser } from '@/types';

const MAX_BIO = 500;

export default function ProfileEditPage() {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const t = useTranslations();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (!isAuthenticated || !user) {
        // The middleware should normally prevent this, but render a soft
        // fallback in case hydration runs before the redirect lands.
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Link href="/login" className="text-primary underline">
                    {t('profile.edit.signIn')}
                </Link>
            </div>
        );
    }

    return <ProfileEditForm key={user.id} user={user} />;
}

function ProfileEditForm({ user }: { user: AuthUser }) {
    const router = useRouter();
    const updateProfile = useUpdateProfile();
    const t = useTranslations();
    const [username, setUsername] = useState(user.username ?? '');
    const [bio, setBio] = useState(user.bio ?? '');
    const [interestsText, setInterestsText] = useState((user.interests ?? []).join(', '));
    const [error, setError] = useState<string | null>(null);

    const initial = (username || user.email).charAt(0).toUpperCase();
    const isSubmitting = updateProfile.isPending;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 2) {
            setError(t('profile.edit.error.username'));
            return;
        }
        if (bio.length > MAX_BIO) {
            setError(t('profile.edit.error.bio', { max: MAX_BIO }));
            return;
        }

        const interests = interestsText
            .split(',')
            .map((tag) => tag.trim().replace(/^#/, ''))
            .filter(Boolean);

        try {
            await updateProfile.mutateAsync({
                username: trimmedUsername,
                bio,
                interests,
            });
            toast.success(t('profile.edit.success'));
            setTimeout(() => router.push('/profile'), 400);
        } catch (err) {
            const message = err instanceof Error ? err.message : t('profile.edit.failed');
            setError(message);
            toast.error(message);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background max-w-md mx-auto shadow-2xl overflow-x-hidden pb-16">
            <div className="flex items-center bg-background p-4 pb-2 justify-between sticky top-0 z-20 border-b-border/40">
                <Link
                    href="/profile"
                    className="text-foreground flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-muted/50 rounded-full transition-colors"
                    aria-label="Back to profile"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h2 className="text-foreground text-lg font-bold font-serif leading-tight tracking-tight flex-1 text-center">
                    {t('profile.edit.title')}
                </h2>
                <div className="w-10" />
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-6 p-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="aspect-square rounded-full size-24 ring-4 ring-primary/30 ring-offset-2 ring-offset-background bg-card border border-border flex items-center justify-center">
                        <span className="text-3xl font-black font-serif text-primary uppercase">
                            {initial}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('profile.edit.avatarSoon')}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="username" className="text-sm font-semibold text-foreground">
                        {t('profile.edit.username')}
                    </label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none focus:border-primary"
                        autoComplete="off"
                        required
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="bio" className="text-sm font-semibold text-foreground">
                        {t('profile.edit.bio')}
                    </label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
                        rows={4}
                        placeholder={t('profile.edit.bioPlaceholder')}
                        className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary resize-none"
                    />
                    <div className="flex justify-end text-xs text-muted-foreground">
                        {bio.length}/{MAX_BIO}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="interests" className="text-sm font-semibold text-foreground">
                        {t('profile.edit.interests')}
                    </label>
                    <input
                        id="interests"
                        type="text"
                        value={interestsText}
                        onChange={(e) => setInterestsText(e.target.value)}
                        placeholder={t('profile.edit.interestsPlaceholder')}
                        className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('profile.edit.interestsHelp')}
                    </p>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> {t('profile.edit.saving')}
                        </>
                    ) : (
                        t('profile.edit.save')
                    )}
                </button>
            </form>
        </div>
    );
}
