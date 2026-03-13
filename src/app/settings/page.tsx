'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, ChevronRight, User, CreditCard, AudioLines,
    Download, Volume2, Bell, Palette, LogOut, Shield, Globe,
    Moon, Sun, Monitor, Check, Eye, BellRing, BellOff,
    Wifi, WifiOff, HardDrive, Trash2, Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';

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
    | 'security';

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
    return (
        <div className="flex flex-col h-full bg-background">
            <PanelHeader title="Profile & Subscription" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center pt-2 pb-4">
                    <div className="relative mb-3">
                        <img
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gold"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWifIO0mY4d7zfoU55ltGA6oiYG1wc_ceQz9O-IiH7KeMn9_1kADzxojHjKIe2nCx-ObvDuZqBROCPmCD79Thbf3meKVEUnLakIXdEfneyDp78sa1kPzcJFsqcg6kggR6f8xqJW6rYbVsCPZ2nFXgjPcOP8HyrenU1qv9ei0YCKF-7LvxHqWaSuKRJ06j4hz2NKs_aSGWsIYKX3bu_Y8-mFUIk-SweXiCOZEB-GLgb_F7-b1zHeeJwtqGZWD46uF779L2VWoV_ewE"
                        />
                        <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gold flex items-center justify-center text-background shadow">
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <h2 className="font-serif text-lg font-bold text-foreground">Julian Sterling</h2>
                    <p className="text-xs text-gold font-medium tracking-wide uppercase mt-0.5">Patron Member</p>
                </div>

                <div>
                    <SectionTitle>Personal Info</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<User className="w-4 h-4" />} label="Full Name" value="Julian Sterling" />
                        <Divider />
                        <SettingsRow icon={<Globe className="w-4 h-4" />} label="Username" value="@julian_s" />
                        <Divider />
                        <SettingsRow icon={<Shield className="w-4 h-4" />} label="Email" value="j.sterling@mail.com" />
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
    const [theme, setTheme] = useState('dark');
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
                                onClick={() => setTheme(t.key)}
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

/* ═══════════════════════════════════════════════════════
   Main Settings Page
   ═══════════════════════════════════════════════════════ */
export default function SettingsPage() {
    const [activePanel, setActivePanel] = useState<PanelId>('main');

    const goBack = () => setActivePanel('main');

    if (activePanel === 'profile') return <ProfilePanel onBack={goBack} />;
    if (activePanel === 'payment') return <PaymentPanel onBack={goBack} />;
    if (activePanel === 'audio') return <AudioPanel onBack={goBack} />;
    if (activePanel === 'downloads') return <DownloadsPanel onBack={goBack} />;
    if (activePanel === 'notifications') return <NotificationsPanel onBack={goBack} />;
    if (activePanel === 'theme') return <ThemePanel onBack={goBack} />;
    if (activePanel === 'language') return <LanguagePanel onBack={goBack} />;
    if (activePanel === 'security') return <SecurityPanel onBack={goBack} />;

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
                <button
                    onClick={() => setActivePanel('profile')}
                    className="w-full flex items-center space-x-4 bg-card p-4 rounded-xl border border-border hover:border-gold/30 transition-colors group"
                >
                    <div className="relative shrink-0">
                        <img
                            alt="Profile"
                            className="w-14 h-14 rounded-full object-cover border-2 border-gold"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWifIO0mY4d7zfoU55ltGA6oiYG1wc_ceQz9O-IiH7KeMn9_1kADzxojHjKIe2nCx-ObvDuZqBROCPmCD79Thbf3meKVEUnLakIXdEfneyDp78sa1kPzcJFsqcg6kggR6f8xqJW6rYbVsCPZ2nFXgjPcOP8HyrenU1qv9ei0YCKF-7LvxHqWaSuKRJ06j4hz2NKs_aSGWsIYKX3bu_Y8-mFUIk-SweXiCOZEB-GLgb_F7-b1zHeeJwtqGZWD46uF779L2VWoV_ewE"
                        />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gold rounded-full border-2 border-background" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <h2 className="font-serif text-base font-semibold text-foreground">Julian Sterling</h2>
                        <p className="text-xs text-gold font-medium tracking-wide uppercase">Patron Member</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* ── Account ── */}
                <div>
                    <SectionTitle>Account</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<User className="w-4 h-4" />} label="Profile & Subscription" onClick={() => setActivePanel('profile')} />
                        <Divider />
                        <SettingsRow icon={<CreditCard className="w-4 h-4" />} label="Payment Methods" onClick={() => setActivePanel('payment')} />
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
                    <button className="w-full border border-gold/30 text-gold py-3.5 px-6 rounded-xl text-sm font-semibold hover:bg-gold/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                        <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Log Out</span>
                    </button>
                    <p className="text-center text-[10px] text-muted-foreground">Version 2.4.0 (Build 1082)</p>
                </div>
            </main>

            <GlobalNowPlayingBar />
        </div>
    );
}
