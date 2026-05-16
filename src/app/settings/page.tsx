'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ChevronRight, User, AudioLines,
    Download, Volume2, Bell, Palette, LogOut, Shield,
    Moon, Sun, Monitor, Check, Eye,
    Trash2, Languages, Loader2,
    Clock, Play, AlertCircle, Lock,
} from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { useAuthStore } from '@/lib/stores';
import { useChangePassword, useLogout } from '@/lib/hooks/use-auth';
import { useTheme } from 'next-themes';
import { fetchWatchHistory, clearWatchHistory, type WatchHistoryItem } from '@/lib/api/feeds';
import { useI18n, useTranslations, type Locale } from '@/lib/i18n';

/* ═══════════════════════════════════════════════════════
   Sub-panel type & registry
   ═══════════════════════════════════════════════════════ */
type PanelId =
    | 'main'
    | 'profile'
    | 'change-password'
    | 'audio'
    | 'theme'
    | 'language'
    | 'security'
    | 'history';

/* ═══════════════════════════════════════════════════════
   Reusable components
   ═══════════════════════════════════════════════════════ */
function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-1">
            {children}
        </h3>
    );
}

function SettingsCard({ children, locked }: { children: ReactNode; locked?: boolean }) {
    return (
        <div
            className={cn(
                'rounded-xl overflow-hidden border',
                locked
                    ? 'border-dashed border-muted-foreground/35 bg-muted/20'
                    : 'bg-card border-border'
            )}
        >
            {children}
        </div>
    );
}

function LaterPill({ className, label = 'Later' }: { className?: string; label?: string }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md border border-border/90 bg-muted/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                className
            )}
        >
            <Lock className="w-3 h-3 shrink-0 opacity-90" aria-hidden />
            {label}
        </span>
    );
}

function Divider() {
    return <div className="h-px w-full bg-border" />;
}

function SettingsRow({
    icon,
    label,
    value,
    onClick,
    trailing,
    disabled,
    t,
}: {
    icon: ReactNode;
    label: string;
    value?: string;
    onClick?: () => void;
    trailing?: ReactNode;
    disabled?: boolean;
    t: (key: string) => string;
}) {
    const interactive = !!onClick && !disabled;
    const Wrapper = interactive ? 'button' : 'div';
    return (
        <Wrapper
            type={interactive ? 'button' : undefined}
            className={cn(
                'w-full flex items-center justify-between p-4 transition-colors group text-left',
                interactive && 'hover:bg-muted/40',
                disabled && 'cursor-not-allowed bg-muted/10'
            )}
            onClick={interactive ? onClick : undefined}
            aria-disabled={disabled || undefined}
        >
            <div className="flex items-center space-x-3 min-w-0">
                <div
                    className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1',
                        disabled
                            ? 'bg-muted/80 text-muted-foreground ring-border/70'
                            : 'bg-gold/10 text-gold ring-transparent'
                    )}
                >
                    {icon}
                </div>
                <span
                    className={cn(
                        'text-sm font-medium truncate',
                        disabled ? 'text-muted-foreground' : 'text-foreground'
                    )}
                >
                    {label}
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 pl-2">
                {disabled && <LaterPill label={t('settings.later')} />}
                {trailing ?? (
                    <>
                        {value && <span className="text-xs text-muted-foreground">{value}</span>}
                        {interactive && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
                        )}
                    </>
                )}
            </div>
        </Wrapper>
    );
}

function Toggle({
    checked,
    onChange,
    disabled,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
                disabled ? 'cursor-not-allowed opacity-55 ring-1 ring-inset ring-muted-foreground/35' : 'cursor-pointer',
                checked ? 'bg-gold/90' : 'bg-muted',
                disabled && 'grayscale-[0.35]'
            )}
        >
            <span
                className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                    checked ? 'translate-x-5' : 'translate-x-0'
                )}
            />
        </button>
    );
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border pt-12 pb-4 px-5">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-muted/60 transition-colors text-foreground active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-serif text-lg font-bold tracking-wide text-foreground">{title}</h1>
                <div className="w-9" />
            </div>
        </header>
    );
}

function RadioOption({
    label,
    description,
    selected,
    onSelect,
}: {
    label: string;
    description?: string;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={cn(
                'w-full flex items-center justify-between p-4 transition-colors',
                selected ? 'bg-gold/10' : 'hover:bg-muted/40'
            )}
        >
            <div className="text-left">
                <p className="text-sm font-medium text-foreground">{label}</p>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <div
                className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                    selected ? 'border-gold bg-gold' : 'border-border'
                )}
            >
                {selected && <Check className="w-3 h-3 text-background" />}
            </div>
        </button>
    );
}

/* ═══════════════════════════════════════════════════════
   Sub-panels
   ═══════════════════════════════════════════════════════ */

function ProfilePanel({ onBack, t }: { onBack: () => void; t: (key: string) => string }) {
    const { user } = useAuthStore();
    const displayName = user?.username || t('misc.signInRequired');
    const displayEmail = user?.email || '—';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title={t('settings.panel.profile')} onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center pt-2 pb-4">
                    <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full border-2 border-gold bg-gold/10 flex items-center justify-center">
                            <span className="font-serif text-2xl font-bold text-gold">{initials}</span>
                        </div>
                    </div>
                    <h2 className="font-serif text-lg font-bold text-foreground">{displayName}</h2>
                    <p className="text-xs text-gold font-medium tracking-wide uppercase mt-0.5">{t('settings.profile.member')}</p>
                </div>

                <div>
                    <SectionTitle>{t('settings.profile.section.personal')}</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<User className="w-4 h-4" />} label={t('settings.profile.username')} value={displayName} t={t} />
                        <Divider />
                        <SettingsRow icon={<Shield className="w-4 h-4" />} label={t('settings.profile.email')} value={displayEmail} t={t} />
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
}

function AudioPanel({ onBack, t }: { onBack: () => void; t: (key: string) => string }) {
    const [quality, setQuality] = useState('high');
    const [spatialAudio, setSpatialAudio] = useState(true);
    const [autoPlay, setAutoPlay] = useState(true);

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title={t('settings.panel.audio')} onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>{t('settings.audio.section.streaming')}</SectionTitle>
                    <SettingsCard>
                        <RadioOption label={t('settings.audio.quality.low')} description={t('settings.audio.quality.low.desc')} selected={quality === 'low'} onSelect={() => setQuality('low')} />
                        <Divider />
                        <RadioOption label={t('settings.audio.quality.normal')} description={t('settings.audio.quality.normal.desc')} selected={quality === 'normal'} onSelect={() => setQuality('normal')} />
                        <Divider />
                        <RadioOption label={t('settings.audio.quality.high')} description={t('settings.audio.quality.high.desc')} selected={quality === 'high'} onSelect={() => setQuality('high')} />
                        <Divider />
                        <RadioOption label={t('settings.audio.quality.lossless')} description={t('settings.audio.quality.lossless.desc')} selected={quality === 'lossless'} onSelect={() => setQuality('lossless')} />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>{t('settings.audio.section.playback')}</SectionTitle>
                    <SettingsCard>
                        <SettingsRow
                            icon={<Volume2 className="w-4 h-4" />}
                            label={t('settings.audio.spatial')}
                            trailing={<Toggle checked={spatialAudio} onChange={setSpatialAudio} />}
                            t={t}
                        />
                        <Divider />
                        <SettingsRow
                            icon={<AudioLines className="w-4 h-4" />}
                            label={t('settings.audio.autoplay')}
                            trailing={<Toggle checked={autoPlay} onChange={setAutoPlay} />}
                            t={t}
                        />
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
}

function ThemePanel({ onBack, t }: { onBack: () => void; t: (key: string) => string }) {
    const { theme, setTheme: setAppTheme } = useTheme();
    const [fontSize, setFontSize] = useState('medium');

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title={t('settings.panel.theme')} onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>{t('settings.theme.section')}</SectionTitle>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { key: 'dark', label: t('settings.theme.dark'), icon: <Moon className="w-5 h-5" /> },
                            { key: 'light', label: t('settings.theme.light'), icon: <Sun className="w-5 h-5" /> },
                            { key: 'system', label: t('settings.theme.system'), icon: <Monitor className="w-5 h-5" /> },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setAppTheme(t.key)}
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                                    theme === t.key
                                        ? 'bg-gold/10 border-gold/40 text-gold'
                                        : 'bg-card border-border text-muted-foreground hover:border-gold/20'
                                )}
                            >
                                {t.icon}
                                <span className="text-xs font-medium">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <SectionTitle>{t('settings.theme.textSize')}</SectionTitle>
                    <SettingsCard>
                        <RadioOption label={t('settings.theme.size.small')} description={t('settings.theme.size.small.desc')} selected={fontSize === 'small'} onSelect={() => setFontSize('small')} />
                        <Divider />
                        <RadioOption label={t('settings.theme.size.medium')} description={t('settings.theme.size.medium.desc')} selected={fontSize === 'medium'} onSelect={() => setFontSize('medium')} />
                        <Divider />
                        <RadioOption label={t('settings.theme.size.large')} description={t('settings.theme.size.large.desc')} selected={fontSize === 'large'} onSelect={() => setFontSize('large')} />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>{t('settings.theme.preview')}</SectionTitle>
                    <div className="bg-card rounded-xl border border-border p-5">
                        <h3 className={cn(
                            'font-serif font-bold text-foreground mb-1.5',
                            fontSize === 'small' ? 'text-base' : fontSize === 'large' ? 'text-2xl' : 'text-lg'
                        )}>
                            {t('settings.theme.preview.title')}
                        </h3>
                        <p className={cn(
                            'text-muted-foreground leading-relaxed',
                            fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'
                        )}>
                            {t('settings.theme.preview.body')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LanguagePanel({ onBack, t }: { onBack: () => void; t: (key: string) => string }) {
    const { locale, setLocale } = useI18n();
    const [language, setLanguage] = useState<Locale>(locale);

    const handleSelect = (next: Locale) => {
        setLanguage(next);
        setLocale(next);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title={t('settings.language.title')} onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>{t('settings.language.app')}</SectionTitle>
                    <SettingsCard>
                        <RadioOption label={t('settings.language.english')} description="English (US)" selected={language === 'en'} onSelect={() => handleSelect('en')} />
                        <Divider />
                        <RadioOption label={t('settings.language.arabic')} description="Arabic" selected={language === 'ar'} onSelect={() => handleSelect('ar')} />
                    </SettingsCard>
                    <p className="mt-3 text-xs text-muted-foreground">{t('settings.language.help')}</p>
                </div>

                <div>
                    <SectionTitle>{t('settings.language.content')}</SectionTitle>
                    <SettingsCard>
                        <RadioOption label={t('settings.language.sameAsApp')} selected={true} onSelect={() => { }} />
                        <Divider />
                        <RadioOption label={t('settings.language.all')} selected={false} onSelect={() => { }} />
                    </SettingsCard>
                    <p className="mt-3 text-xs text-muted-foreground">{t('settings.language.moreSoon')}</p>
                </div>
            </div>
        </div>
    );
}

function SecurityPanel({
    onBack,
    onChangePassword,
    t,
}: {
    onBack: () => void;
    onChangePassword: () => void;
    t: (key: string) => string;
}) {
    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title={t('settings.panel.security')} onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>{t('settings.section.authentication')}</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<Shield className="w-4 h-4" />} label={t('settings.row.changePassword')} onClick={onChangePassword} t={t} />
                        <Divider />
                        <SettingsRow
                            icon={<Eye className="w-4 h-4" />}
                            label={t('settings.row.faceId')}
                            disabled
                            trailing={<Toggle checked={false} onChange={() => { }} disabled />}
                            t={t}
                        />
                        <Divider />
                        <SettingsRow
                            icon={<Shield className="w-4 h-4" />}
                            label={t('settings.row.twoFactor')}
                            disabled
                            trailing={<Toggle checked={false} onChange={() => { }} disabled />}
                            t={t}
                        />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>{t('settings.section.privacy')}</SectionTitle>
                    <SettingsCard locked>
                        <SettingsRow
                            icon={<Eye className="w-4 h-4" />}
                            label={t('settings.row.privateProfile')}
                            disabled
                            trailing={<Toggle checked={false} onChange={() => { }} disabled />}
                            t={t}
                        />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>{t('settings.section.data')}</SectionTitle>
                    <SettingsCard locked>
                        <SettingsRow icon={<Download className="w-4 h-4" />} label={t('settings.row.downloadData')} disabled t={t} />
                        <Divider />
                        <SettingsRow icon={<Trash2 className="w-4 h-4" />} label={t('settings.row.deleteAccount')} disabled t={t} />
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
}

function PasswordInput({
    label,
    value,
    onChange,
    autoComplete,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: string;
    placeholder: string;
}) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                {label}
            </label>
            <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="password"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all text-sm"
                />
            </div>
        </div>
    );
}

function ChangePasswordPanel({ onBack, t }: { onBack: () => void; t: (key: string) => string }) {
    const { isAuthenticated } = useAuthStore();
    const changePassword = useChangePassword();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const passwordsMatch = newPassword === confirmPassword;
    const isValid =
        isAuthenticated &&
        currentPassword.length >= 4 &&
        newPassword.length >= 4 &&
        passwordsMatch &&
        currentPassword !== newPassword;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!isAuthenticated) {
            setError(t('settings.password.error.signIn'));
            return;
        }

        if (!passwordsMatch) {
            setError(t('settings.password.error.mismatch'));
            return;
        }

        if (newPassword.length < 4) {
            setError(t('settings.password.error.min'));
            return;
        }

        if (currentPassword === newPassword) {
            setError(t('settings.password.error.same'));
            return;
        }

        try {
            await changePassword.mutateAsync({ currentPassword, newPassword });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSuccess(t('settings.password.success'));
        } catch (err) {
            setError(err instanceof Error ? err.message : t('settings.password.error.failed'));
        }
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title={t('settings.password.title')} onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                {!isAuthenticated && (
                    <div className="rounded-xl border border-gold/20 bg-gold/10 p-4">
                        <p className="text-sm font-medium text-foreground">{t('settings.password.signInRequired.title')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('settings.password.signInRequired.body')}
                        </p>
                        <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-gold hover:text-gold/80">
                            {t('settings.password.signInRequired.action')}
                        </Link>
                    </div>
                )}

                {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
                        <p className="text-sm text-green-400">{success}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <PasswordInput
                        label={t('settings.password.current')}
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        placeholder={t('settings.password.placeholder.current')}
                        autoComplete="current-password"
                    />
                    <PasswordInput
                        label={t('settings.password.new')}
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder={t('settings.password.placeholder.new')}
                        autoComplete="new-password"
                    />
                    <PasswordInput
                        label={t('settings.password.confirm')}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder={t('settings.password.placeholder.confirm')}
                        autoComplete="new-password"
                    />

                    {confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-red-400 ml-1">{t('settings.password.mismatch')}</p>
                    )}

                    <button
                        type="submit"
                        disabled={!isValid || changePassword.isPending}
                        className="w-full h-12 rounded-xl bg-gold text-background font-semibold text-sm hover:bg-gold/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {changePassword.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('settings.password.updating')}
                            </>
                        ) : (
                            t('settings.password.update')
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

function formatRelativeTime(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function formatDuration(sec?: number): string {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function HistoryPanel({ onBack, t }: { onBack: () => void; t: (key: string) => string }) {
    const queryClient = useQueryClient();
    const [confirmClear, setConfirmClear] = useState(false);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['watch-history'],
        queryFn: ({ pageParam }) => fetchWatchHistory(pageParam),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.cursor,
    });

    const clearMutation = useMutation({
        mutationFn: clearWatchHistory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watch-history'] });
            setConfirmClear(false);
        },
    });

    const allItems: WatchHistoryItem[] = data?.pages.flatMap((p) => p.items) ?? [];

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title={t('settings.history.title')} onBack={onBack} />
            <div className="flex-1 overflow-y-auto">
                {/* Clear button */}
                {allItems.length > 0 && (
                    <div className="px-5 pt-4 pb-2">
                        {confirmClear ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => clearMutation.mutate()}
                                    disabled={clearMutation.isPending}
                                    className="flex-1 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                                >
                                    {clearMutation.isPending ? t('settings.history.loading') : t('settings.history.confirm')}
                                </button>
                                <button
                                    onClick={() => setConfirmClear(false)}
                                    className="flex-1 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                                >
                                    {t('settings.history.cancel')}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmClear(true)}
                                className="w-full py-2 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:border-destructive/30 hover:text-destructive transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t('settings.history.clear')}
                            </button>
                        )}
                    </div>
                )}

                {/* States */}
                {isLoading && (
                    <div className="flex flex-col gap-3 px-5 pt-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-20 h-14 rounded-lg bg-muted shrink-0" />
                                <div className="flex-1 space-y-2 pt-1">
                                    <div className="h-3 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isError && (
                    <div className="flex flex-col items-center justify-center py-16 px-5 text-center gap-3">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{t('settings.history.failed')}</p>
                    </div>
                )}

                {!isLoading && !isError && allItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-5 text-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-serif text-base font-semibold text-foreground">{t('settings.history.empty.title')}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
                            {t('settings.history.empty.body')}
                        </p>
                    </div>
                )}

                {/* Item list */}
                {allItems.length > 0 && (
                    <div className="px-5 py-3 space-y-1">
                        {allItems.map((item, i) => (
                            <div key={`${item.content_id}-${i}`} className="flex gap-3 py-2.5 border-b border-border/50 last:border-0">
                                {/* Thumbnail */}
                                <div className="w-20 h-14 rounded-lg bg-muted shrink-0 overflow-hidden relative">
                                    {item.thumbnail_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={item.thumbnail_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Play className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    {item.duration_sec && (
                                        <span className="absolute bottom-1 right-1 text-[10px] font-medium bg-black/70 text-white px-1 rounded">
                                            {formatDuration(item.duration_sec)}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                                        {item.title || 'Untitled'}
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {item.source_name && (
                                            <span className="text-[11px] text-gold font-medium truncate max-w-[100px]">
                                                {item.source_name}
                                            </span>
                                        )}
                                        {item.source_name && (
                                            <span className="text-[11px] text-muted-foreground">·</span>
                                        )}
                                        <span className="text-[11px] text-muted-foreground">
                                            {formatRelativeTime(item.viewed_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Load more */}
                        {hasNextPage && (
                            <button
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="w-full py-3 text-sm text-gold font-medium hover:text-gold/80 transition-colors disabled:opacity-50"
                            >
                                {isFetchingNextPage ? t('settings.history.loading') : t('settings.history.loadMore')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Main Settings Page
   ═══════════════════════════════════════════════════════ */
export default function SettingsPage() {
    const [activePanel, setActivePanel] = useState<PanelId>('main');
    const { user, isAuthenticated } = useAuthStore();
    const logout = useLogout();
    const router = useRouter();
    const t = useTranslations();
    const { locale } = useI18n();

    const languageValue = useMemo(() => {
        return locale === 'ar'
            ? t('settings.language.value.arabic')
            : t('settings.language.value.english');
    }, [locale, t]);

    const goBack = () => setActivePanel('main');

    async function handleLogout() {
        await logout.mutateAsync();
        router.push('/');
    }

    if (activePanel === 'change-password') return <ChangePasswordPanel onBack={() => setActivePanel('security')} t={t} />;
    if (activePanel === 'profile') return <ProfilePanel onBack={goBack} t={t} />;
    if (activePanel === 'audio') return <AudioPanel onBack={goBack} t={t} />;
    if (activePanel === 'theme') return <ThemePanel onBack={goBack} t={t} />;
    if (activePanel === 'language') return <LanguagePanel onBack={goBack} t={t} />;
    if (activePanel === 'security') return <SecurityPanel onBack={goBack} onChangePassword={() => setActivePanel('change-password')} t={t} />;
    if (activePanel === 'history') return <HistoryPanel onBack={goBack} t={t} />;

    return (
        <div className="h-full w-full overflow-y-auto bg-background text-foreground font-sans">
            {/* ── Header ── */}
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border pt-12 pb-4 px-5">
                <div className="flex items-center justify-between">
                    <Link href="/">
                        <button className="p-2 -ml-2 rounded-full hover:bg-muted/60 transition-colors text-foreground active:scale-95">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </Link>
                    <h1 className="font-serif text-xl font-bold tracking-wide text-foreground">{t('settings.title')}</h1>
                    <div className="w-9" />
                </div>
            </header>

            <main className="px-5 py-6 space-y-8">
                {/* ── Profile Teaser ── */}
                {isAuthenticated && user ? (
                    <button
                        onClick={() => setActivePanel('profile')}
                        className="w-full flex items-center space-x-4 bg-card p-4 rounded-xl border border-border hover:border-gold/30 transition-colors group"
                    >
                        <div className="relative shrink-0">
                            <div className="w-14 h-14 rounded-full border-2 border-gold bg-gold/10 flex items-center justify-center">
                                <span className="font-serif text-lg font-bold text-gold">
                                    {user.username.slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gold rounded-full border-2 border-background" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <h2 className="font-serif text-base font-semibold text-foreground">{user.username}</h2>
                            <p className="text-xs text-gold font-medium tracking-wide uppercase">Member</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                ) : (
                    <Link href="/login" className="block">
                        <div className="w-full flex items-center space-x-4 bg-card p-4 rounded-xl border border-dashed border-gold/30 hover:border-gold/50 transition-colors group">
                            <div className="w-14 h-14 rounded-full border-2 border-border bg-muted/30 flex items-center justify-center shrink-0">
                                <User className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h2 className="font-serif text-base font-semibold text-foreground">{t('settings.signIn')}</h2>
                                <p className="text-xs text-muted-foreground">{t('auth.login.subtitle')}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                    </Link>
                )}

                {/* ── Account ── */}
                <div>
                    <SectionTitle>{t('settings.section.account')}</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<Clock className="w-4 h-4" />} label={t('settings.row.watchHistory')} onClick={() => setActivePanel('history')} t={t} />
                        <Divider />
                        <SettingsRow icon={<Shield className="w-4 h-4" />} label={t('settings.row.privacySecurity')} onClick={() => setActivePanel('security')} t={t} />
                    </SettingsCard>
                </div>

                {/* ── Content & Playback ── */}
                <div>
                    <SectionTitle>{t('settings.section.content')}</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<AudioLines className="w-4 h-4" />} label={t('settings.row.audioQuality')} value={t('settings.audio.quality.high')} onClick={() => setActivePanel('audio')} t={t} />
                        <Divider />
                        <SettingsRow icon={<Download className="w-4 h-4" />} label={t('settings.row.downloads')} disabled t={t} />
                    </SettingsCard>
                </div>

                {/* ── Preferences ── */}
                <div>
                    <SectionTitle>{t('settings.section.preferences')}</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<Bell className="w-4 h-4" />} label={t('settings.row.notifications')} disabled t={t} />
                        <Divider />
                        <SettingsRow icon={<Palette className="w-4 h-4" />} label={t('settings.row.displayTheme')} onClick={() => setActivePanel('theme')} t={t} />
                        <Divider />
                        <SettingsRow icon={<Languages className="w-4 h-4" />} label={t('settings.row.language')} value={languageValue} onClick={() => setActivePanel('language')} t={t} />
                    </SettingsCard>
                </div>

                {/* ── Logout ── */}
                <div className="pb-8 space-y-3">
                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            disabled={logout.isPending}
                            className="w-full border border-gold/30 text-gold py-3.5 px-6 rounded-xl text-sm font-semibold hover:bg-gold/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {logout.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            )}
                            <span>{t('settings.logout')}</span>
                        </button>
                    ) : (
                        <Link href="/login">
                            <button className="w-full border border-gold/30 text-gold py-3.5 px-6 rounded-xl text-sm font-semibold hover:bg-gold/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{t('settings.signIn')}</span>
                            </button>
                        </Link>
                    )}
                    <p className="text-center text-[10px] text-muted-foreground">Version 2.4.0 (Build 1082)</p>
                </div>
            </main>

            <GlobalNowPlayingBar />
        </div>
    );
}
