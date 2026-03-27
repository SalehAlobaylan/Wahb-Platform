'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ChevronRight, User, CreditCard, AudioLines,
    Download, Volume2, Bell, Palette, LogOut, Shield, Globe,
    Moon, Sun, Monitor, Check, Eye, BellRing, BellOff,
    Wifi, WifiOff, HardDrive, Trash2, Languages, Loader2,
    Clock, Play, AlertCircle,
} from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { useAuthStore } from '@/lib/stores';
import { useLogout } from '@/lib/hooks/use-auth';
import { useTheme } from 'next-themes';
import { fetchWatchHistory, clearWatchHistory, type WatchHistoryItem } from '@/lib/api/feeds';

/* ═══════════════════════════════════════════════════════
   Sub-panel type & registry
   ═══════════════════════════════════════════════════════ */
type PanelId =
    | 'main'
    | 'profile'
    | 'payment'
    | 'audio'
    | 'downloads'
    | 'notifications'
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

function SettingsCard({ children }: { children: ReactNode }) {
    return (
        <div className="bg-card rounded-xl overflow-hidden border border-border">
            {children}
        </div>
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
}: {
    icon: ReactNode;
    label: string;
    value?: string;
    onClick?: () => void;
    trailing?: ReactNode;
}) {
    const Wrapper = onClick ? 'button' : 'div';
    return (
        <Wrapper
            className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group"
            onClick={onClick}
        >
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold shrink-0">
                    {icon}
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
            {trailing ?? (
                <div className="flex items-center space-x-2">
                    {value && <span className="text-xs text-muted-foreground">{value}</span>}
                    {onClick && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
                    )}
                </div>
            )}
        </Wrapper>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                checked ? 'bg-gold' : 'bg-muted'
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

function ProfilePanel({ onBack }: { onBack: () => void }) {
    const { user } = useAuthStore();
    const displayName = user?.username || 'Guest';
    const displayEmail = user?.email || '—';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title="Profile & Subscription" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center pt-2 pb-4">
                    <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full border-2 border-gold bg-gold/10 flex items-center justify-center">
                            <span className="font-serif text-2xl font-bold text-gold">{initials}</span>
                        </div>
                    </div>
                    <h2 className="font-serif text-lg font-bold text-foreground">{displayName}</h2>
                    <p className="text-xs text-gold font-medium tracking-wide uppercase mt-0.5">Member</p>
                </div>

                <div>
                    <SectionTitle>Personal Info</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<User className="w-4 h-4" />} label="Username" value={displayName} />
                        <Divider />
                        <SettingsRow icon={<Shield className="w-4 h-4" />} label="Email" value={displayEmail} />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>Subscription</SectionTitle>
                    <div className="bg-card rounded-xl border border-gold/20 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-serif text-base font-bold text-foreground">Patron Plan</span>
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-gold text-background font-bold uppercase tracking-wide">Active</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Unlimited access to all content, offline downloads, and spatial audio.</p>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold text-foreground">$9.99</span>
                            <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Next billing: March 15, 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PaymentPanel({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title="Payment Methods" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>Saved Cards</SectionTitle>
                    <SettingsCard>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-11 h-7 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">•••• 4829</p>
                                    <p className="text-xs text-muted-foreground">Expires 08/27</p>
                                </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-bold">Default</span>
                        </div>
                        <Divider />
                        <div className="p-4 flex items-center space-x-3">
                            <div className="w-11 h-7 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-[10px] font-bold">MC</div>
                            <div>
                                <p className="text-sm font-medium text-foreground">•••• 1053</p>
                                <p className="text-xs text-muted-foreground">Expires 12/26</p>
                            </div>
                        </div>
                    </SettingsCard>
                </div>

                <button className="w-full p-4 rounded-xl border border-dashed border-border text-muted-foreground hover:border-gold/50 hover:text-gold transition-colors flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">Add New Card</span>
                </button>

                <div>
                    <SectionTitle>Billing History</SectionTitle>
                    <SettingsCard>
                        {[
                            { date: 'Feb 15, 2026', amount: '$9.99', status: 'Paid' },
                            { date: 'Jan 15, 2026', amount: '$9.99', status: 'Paid' },
                            { date: 'Dec 15, 2025', amount: '$9.99', status: 'Paid' },
                        ].map((item, i) => (
                            <div key={i}>
                                {i > 0 && <Divider />}
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{item.date}</p>
                                        <p className="text-xs text-muted-foreground">Patron Plan</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-foreground">{item.amount}</p>
                                        <p className="text-xs text-green-500">{item.status}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
}

function AudioPanel({ onBack }: { onBack: () => void }) {
    const [quality, setQuality] = useState('high');
    const [spatialAudio, setSpatialAudio] = useState(true);
    const [autoPlay, setAutoPlay] = useState(true);

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title="Audio Quality" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>Streaming Quality</SectionTitle>
                    <SettingsCard>
                        <RadioOption label="Low" description="64 kbps · Uses less data" selected={quality === 'low'} onSelect={() => setQuality('low')} />
                        <Divider />
                        <RadioOption label="Normal" description="128 kbps · Balanced" selected={quality === 'normal'} onSelect={() => setQuality('normal')} />
                        <Divider />
                        <RadioOption label="High Fidelity" description="256 kbps · Best sound" selected={quality === 'high'} onSelect={() => setQuality('high')} />
                        <Divider />
                        <RadioOption label="Lossless" description="FLAC · Requires Patron plan" selected={quality === 'lossless'} onSelect={() => setQuality('lossless')} />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>Playback</SectionTitle>
                    <SettingsCard>
                        <SettingsRow
                            icon={<Volume2 className="w-4 h-4" />}
                            label="Spatial Audio"
                            trailing={<Toggle checked={spatialAudio} onChange={setSpatialAudio} />}
                        />
                        <Divider />
                        <SettingsRow
                            icon={<AudioLines className="w-4 h-4" />}
                            label="Autoplay"
                            trailing={<Toggle checked={autoPlay} onChange={setAutoPlay} />}
                        />
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
}

function DownloadsPanel({ onBack }: { onBack: () => void }) {
    const [wifiOnly, setWifiOnly] = useState(true);
    const [downloadQuality, setDownloadQuality] = useState('high');

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title="Downloads & Offline" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>Download Settings</SectionTitle>
                    <SettingsCard>
                        <SettingsRow
                            icon={wifiOnly ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                            label="Wi-Fi Only"
                            trailing={<Toggle checked={wifiOnly} onChange={setWifiOnly} />}
                        />
                        <Divider />
                        <RadioOption label="Standard" description="128 kbps · ~1 MB/min" selected={downloadQuality === 'standard'} onSelect={() => setDownloadQuality('standard')} />
                        <Divider />
                        <RadioOption label="High" description="256 kbps · ~2 MB/min" selected={downloadQuality === 'high'} onSelect={() => setDownloadQuality('high')} />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>Storage</SectionTitle>
                    <SettingsCard>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <HardDrive className="w-4 h-4 text-gold" />
                                    <span className="text-sm font-medium text-foreground">Used Space</span>
                                </div>
                                <span className="text-xs text-muted-foreground">1.2 GB / 4 GB</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-gold rounded-full" style={{ width: '30%' }} />
                            </div>
                        </div>
                        <Divider />
                        <SettingsRow
                            icon={<Trash2 className="w-4 h-4" />}
                            label="Clear All Downloads"
                            onClick={() => { }}
                        />
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
}

function NotificationsPanel({ onBack }: { onBack: () => void }) {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [newContent, setNewContent] = useState(true);
    const [recommendations, setRecommendations] = useState(true);
    const [weeklyDigest, setWeeklyDigest] = useState(false);
    const [liveAlerts, setLiveAlerts] = useState(true);

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title="Notifications" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>General</SectionTitle>
                    <SettingsCard>
                        <SettingsRow
                            icon={pushEnabled ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            label="Push Notifications"
                            trailing={<Toggle checked={pushEnabled} onChange={setPushEnabled} />}
                        />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>Content Alerts</SectionTitle>
                    <SettingsCard>
                        <SettingsRow
                            icon={<Bell className="w-4 h-4" />}
                            label="New Content"
                            trailing={<Toggle checked={newContent} onChange={setNewContent} />}
                        />
                        <Divider />
                        <SettingsRow
                            icon={<AudioLines className="w-4 h-4" />}
                            label="Recommendations"
                            trailing={<Toggle checked={recommendations} onChange={setRecommendations} />}
                        />
                        <Divider />
                        <SettingsRow
                            icon={<Globe className="w-4 h-4" />}
                            label="Live & Trending"
                            trailing={<Toggle checked={liveAlerts} onChange={setLiveAlerts} />}
                        />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>Email</SectionTitle>
                    <SettingsCard>
                        <SettingsRow
                            icon={<Bell className="w-4 h-4" />}
                            label="Weekly Digest"
                            trailing={<Toggle checked={weeklyDigest} onChange={setWeeklyDigest} />}
                        />
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
}

function ThemePanel({ onBack }: { onBack: () => void }) {
    const { theme, setTheme: setAppTheme } = useTheme();
    const [fontSize, setFontSize] = useState('medium');

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title="Display & Theme" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>Theme</SectionTitle>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { key: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
                            { key: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
                            { key: 'system', label: 'System', icon: <Monitor className="w-5 h-5" /> },
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
                    <SectionTitle>Text Size</SectionTitle>
                    <SettingsCard>
                        <RadioOption label="Small" description="Compact reading" selected={fontSize === 'small'} onSelect={() => setFontSize('small')} />
                        <Divider />
                        <RadioOption label="Medium" description="Default size" selected={fontSize === 'medium'} onSelect={() => setFontSize('medium')} />
                        <Divider />
                        <RadioOption label="Large" description="Easier to read" selected={fontSize === 'large'} onSelect={() => setFontSize('large')} />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>Preview</SectionTitle>
                    <div className="bg-card rounded-xl border border-border p-5">
                        <h3 className={cn(
                            'font-serif font-bold text-foreground mb-1.5',
                            fontSize === 'small' ? 'text-base' : fontSize === 'large' ? 'text-2xl' : 'text-lg'
                        )}>
                            The Art of Listening
                        </h3>
                        <p className={cn(
                            'text-muted-foreground leading-relaxed',
                            fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'
                        )}>
                            Discover how deep listening transforms our understanding of music and spoken word.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LanguagePanel({ onBack }: { onBack: () => void }) {
    const [language, setLanguage] = useState('en');

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title="Language" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>App Language</SectionTitle>
                    <SettingsCard>
                        <RadioOption label="English" description="English (US)" selected={language === 'en'} onSelect={() => setLanguage('en')} />
                        <Divider />
                        <RadioOption label="العربية" description="Arabic" selected={language === 'ar'} onSelect={() => setLanguage('ar')} />
                        <Divider />
                        <RadioOption label="Español" description="Spanish" selected={language === 'es'} onSelect={() => setLanguage('es')} />
                        <Divider />
                        <RadioOption label="Français" description="French" selected={language === 'fr'} onSelect={() => setLanguage('fr')} />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>Content Language</SectionTitle>
                    <SettingsCard>
                        <RadioOption label="Same as App" selected={true} onSelect={() => { }} />
                        <Divider />
                        <RadioOption label="All Languages" selected={false} onSelect={() => { }} />
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
}

function SecurityPanel({ onBack }: { onBack: () => void }) {
    const [biometric, setBiometric] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);

    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title="Privacy & Security" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                <div>
                    <SectionTitle>Authentication</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<Shield className="w-4 h-4" />} label="Change Password" onClick={() => { }} />
                        <Divider />
                        <SettingsRow
                            icon={<Eye className="w-4 h-4" />}
                            label="Face ID / Biometric"
                            trailing={<Toggle checked={biometric} onChange={setBiometric} />}
                        />
                        <Divider />
                        <SettingsRow
                            icon={<Shield className="w-4 h-4" />}
                            label="Two-Factor Auth"
                            trailing={<Toggle checked={twoFactor} onChange={setTwoFactor} />}
                        />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>Privacy</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<Eye className="w-4 h-4" />} label="Private Profile" trailing={<Toggle checked={false} onChange={() => { }} />} />
                        <Divider />
                        <SettingsRow icon={<Globe className="w-4 h-4" />} label="Activity Status" trailing={<Toggle checked={true} onChange={() => { }} />} />
                    </SettingsCard>
                </div>

                <div>
                    <SectionTitle>Data</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<Download className="w-4 h-4" />} label="Download My Data" onClick={() => { }} />
                        <Divider />
                        <SettingsRow icon={<Trash2 className="w-4 h-4" />} label="Delete Account" onClick={() => { }} />
                    </SettingsCard>
                </div>
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

function HistoryPanel({ onBack }: { onBack: () => void }) {
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
            <PanelHeader title="Watch History" onBack={onBack} />
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
                                    {clearMutation.isPending ? 'Clearing…' : 'Yes, clear all'}
                                </button>
                                <button
                                    onClick={() => setConfirmClear(false)}
                                    className="flex-1 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmClear(true)}
                                className="w-full py-2 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:border-destructive/30 hover:text-destructive transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear watch history
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
                        <p className="text-sm text-muted-foreground">Failed to load history</p>
                    </div>
                )}

                {!isLoading && !isError && allItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-5 text-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-serif text-base font-semibold text-foreground">Nothing here yet</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
                            Videos you watch will appear here so you can easily find them again.
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
                                {isFetchingNextPage ? 'Loading…' : 'Load more'}
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

    const goBack = () => setActivePanel('main');

    async function handleLogout() {
        await logout.mutateAsync();
        router.push('/');
    }

    if (activePanel === 'profile') return <ProfilePanel onBack={goBack} />;
    if (activePanel === 'payment') return <PaymentPanel onBack={goBack} />;
    if (activePanel === 'audio') return <AudioPanel onBack={goBack} />;
    if (activePanel === 'downloads') return <DownloadsPanel onBack={goBack} />;
    if (activePanel === 'notifications') return <NotificationsPanel onBack={goBack} />;
    if (activePanel === 'theme') return <ThemePanel onBack={goBack} />;
    if (activePanel === 'language') return <LanguagePanel onBack={goBack} />;
    if (activePanel === 'security') return <SecurityPanel onBack={goBack} />;
    if (activePanel === 'history') return <HistoryPanel onBack={goBack} />;

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
                    <h1 className="font-serif text-xl font-bold tracking-wide text-foreground">Settings</h1>
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
                                <h2 className="font-serif text-base font-semibold text-foreground">Sign In</h2>
                                <p className="text-xs text-muted-foreground">Personalize your experience</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                    </Link>
                )}

                {/* ── Account ── */}
                <div>
                    <SectionTitle>Account</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<User className="w-4 h-4" />} label="Profile & Subscription" onClick={() => setActivePanel('profile')} />
                        <Divider />
                        <SettingsRow icon={<CreditCard className="w-4 h-4" />} label="Payment Methods" onClick={() => setActivePanel('payment')} />
                        <Divider />
                        <SettingsRow icon={<Clock className="w-4 h-4" />} label="Watch History" onClick={() => setActivePanel('history')} />
                        <Divider />
                        <SettingsRow icon={<Shield className="w-4 h-4" />} label="Privacy & Security" onClick={() => setActivePanel('security')} />
                    </SettingsCard>
                </div>

                {/* ── Content & Playback ── */}
                <div>
                    <SectionTitle>Content & Playback</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<AudioLines className="w-4 h-4" />} label="Audio Quality" value="High Fidelity" onClick={() => setActivePanel('audio')} />
                        <Divider />
                        <SettingsRow icon={<Download className="w-4 h-4" />} label="Downloads & Offline" onClick={() => setActivePanel('downloads')} />
                    </SettingsCard>
                </div>

                {/* ── Preferences ── */}
                <div>
                    <SectionTitle>Preferences</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<Bell className="w-4 h-4" />} label="Notifications" onClick={() => setActivePanel('notifications')} />
                        <Divider />
                        <SettingsRow icon={<Palette className="w-4 h-4" />} label="Display & Theme" onClick={() => setActivePanel('theme')} />
                        <Divider />
                        <SettingsRow icon={<Languages className="w-4 h-4" />} label="Language" value="English" onClick={() => setActivePanel('language')} />
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
                            <span>Log Out</span>
                        </button>
                    ) : (
                        <Link href="/login">
                            <button className="w-full border border-gold/30 text-gold py-3.5 px-6 rounded-xl text-sm font-semibold hover:bg-gold/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <User className="w-4 h-4" />
                                <span>Sign In</span>
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
