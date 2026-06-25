'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadAvatar } from '@/lib/hooks';
import { useTranslations } from '@/lib/i18n';
import type { AuthUser } from '@/types';
import { ProfileActions } from './profile-actions';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

function dicebearAvatar(seed: string): string {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}

/**
 * Identity hero — avatar (with upload), display name, handle · member-since,
 * bio, and the Edit / Share actions.
 */
export function ProfileHero({ user }: { user: AuthUser }) {
    const t = useTranslations();
    const upload = useUploadAvatar();
    const fileRef = useRef<HTMLInputElement>(null);
    // Track which URL failed to load (rather than a boolean) so a fresh upload
    // automatically gets another chance — no effect needed.
    const [erroredUrl, setErroredUrl] = useState<string | null>(null);

    const displayName = user.username || user.email.split('@')[0];
    const handle = `@${user.username || user.email.split('@')[0]}`;
    const memberSince = new Date(user.created_at).getFullYear();

    const hasUploaded = !!user.avatar_url && user.avatar_url !== erroredUrl;
    const avatarSrc = hasUploaded ? user.avatar_url! : dicebearAvatar(displayName);

    function handlePick(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error(t('profile.avatar.badType'));
            return;
        }
        if (file.size > MAX_BYTES) {
            toast.error(t('profile.avatar.tooLarge'));
            return;
        }

        upload.mutate(file, {
            onSuccess: () => toast.success(t('profile.avatar.updated')),
            onError: (err) =>
                toast.error(err instanceof Error ? err.message : t('profile.avatar.failed')),
        });
    }

    return (
        <div className="flex w-full flex-col gap-6 items-center px-4 pt-2">
            <div className="flex gap-4 flex-col items-center">
                <div className="relative">
                    <div className="aspect-square rounded-full min-h-28 w-28 ring-4 ring-primary/30 ring-offset-2 ring-offset-background bg-card border border-border overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={avatarSrc}
                            alt={displayName}
                            className="h-full w-full object-cover"
                            onError={() => setErroredUrl(user.avatar_url ?? null)}
                        />
                    </div>

                    {/* Upload affordance */}
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={upload.isPending}
                        aria-label={t('profile.avatar.upload')}
                        className="absolute bottom-1 end-1 bg-primary rounded-full p-2 border-2 border-background shadow-sm flex items-center justify-center text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 cursor-pointer"
                    >
                        {upload.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Camera className="w-3.5 h-3.5" />
                        )}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handlePick}
                    />
                </div>

                <div className="flex flex-col items-center justify-center text-center px-6">
                    <h1 dir="auto" className="text-foreground text-3xl font-black font-serif leading-tight mb-1.5">
                        {displayName}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                        <span>{handle}</span>
                        <span className="opacity-50">·</span>
                        <span className="uppercase tracking-wider">
                            {t('profile.memberSince', { year: memberSince })}
                        </span>
                    </div>
                    {user.bio && (
                        <p dir="auto" className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
                            {user.bio}
                        </p>
                    )}
                </div>
            </div>

            <ProfileActions displayName={displayName} />
        </div>
    );
}
