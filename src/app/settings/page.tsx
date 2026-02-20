'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, ChevronRight, User, CreditCard, AudioLines,
    Download, Volume2, Bell, Palette, LogOut, Shield, Globe,
    Moon, Sun, Monitor, Check, X, Eye, BellRing, BellOff,
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
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#9e8e78] mb-4 ml-2">
            {children}
        </h3>
    );
}

function SettingsCard({ children }: { children: ReactNode }) {
    return (
        <div className="bg-[#2d2418] rounded-xl overflow-hidden border border-[#ec9c13]/10 shadow-lg shadow-black/20">
            {children}
        </div>
    );
}

function Divider() {
    return <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ec9c13]/20 to-transparent" />;
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
            className="w-full flex items-center justify-between p-4 hover:bg-[#ec9c13]/5 transition-colors group"
            onClick={onClick}
        >
            <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-lg bg-[#ec9c13]/10 flex items-center justify-center text-[#ec9c13]">
                    {icon}
                </div>
                <span className="text-base font-medium text-white">{label}</span>
            </div>
            {trailing ?? (
                <div className="flex items-center space-x-2">
                    {value && <span className="text-sm text-[#9e8e78]">{value}</span>}
                    {onClick && (
                        <ChevronRight className="w-5 h-5 text-[#ec9c13]/60 group-hover:text-[#ec9c13] group-hover:translate-x-1 transition-all" />
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
                checked ? 'bg-[#ec9c13]' : 'bg-[#4a3c2a]'
            )}
        >
            <span
                className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform',
                    checked ? 'translate-x-5' : 'translate-x-0'
                )}
            />
        </button>
    );
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <header className="sticky top-0 z-20 bg-[#221b10]/95 backdrop-blur-md border-b border-[#ec9c13]/20 pt-6 pb-4 px-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-[#ec9c13]/10 transition-colors text-[#ec9c13] active:scale-95"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="font-serif text-xl font-bold tracking-wide text-white">{title}</h1>
                <div className="w-10" />
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
                selected ? 'bg-[#ec9c13]/10' : 'hover:bg-[#ec9c13]/5'
            )}
        >
            <div className="text-left">
                <p className="text-base font-medium text-white">{label}</p>
                {description && <p className="text-xs text-[#9e8e78] mt-0.5">{description}</p>}
            </div>
            <div
                className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    selected ? 'border-[#ec9c13] bg-[#ec9c13]' : 'border-[#4a3c2a]'
                )}
            >
                {selected && <Check className="w-3 h-3 text-[#221b10]" />}
            </div>
        </button>
    );
}

/* ═══════════════════════════════════════════════════════
   Sub-panels
   ═══════════════════════════════════════════════════════ */

function ProfilePanel({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Profile & Subscription" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <img
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-2 border-[#ec9c13]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWifIO0mY4d7zfoU55ltGA6oiYG1wc_ceQz9O-IiH7KeMn9_1kADzxojHjKIe2nCx-ObvDuZqBROCPmCD79Thbf3meKVEUnLakIXdEfneyDp78sa1kPzcJFsqcg6kggR6f8xqJW6rYbVsCPZ2nFXgjPcOP8HyrenU1qv9ei0YCKF-7LvxHqWaSuKRJ06j4hz2NKs_aSGWsIYKX3bu_Y8-mFUIk-SweXiCOZEB-GLgb_F7-b1zHeeJwtqGZWD46uF779L2VWoV_ewE"
                        />
                        <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#ec9c13] flex items-center justify-center text-[#221b10] shadow-lg">
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                    <h2 className="text-xl font-serif font-bold text-white">Julian Sterling</h2>
                    <p className="text-sm text-[#ec9c13]">Patron Member</p>
                </div>

                <SectionTitle>Personal Info</SectionTitle>
                <SettingsCard>
                    <SettingsRow icon={<User className="w-4 h-4" />} label="Full Name" value="Julian Sterling" />
                    <Divider />
                    <SettingsRow icon={<Globe className="w-4 h-4" />} label="Username" value="@julian_s" />
                    <Divider />
                    <SettingsRow icon={<Shield className="w-4 h-4" />} label="Email" value="j.sterling@mail.com" />
                </SettingsCard>

                <div className="mt-8">
                    <SectionTitle>Subscription</SectionTitle>
                    <div className="bg-gradient-to-br from-[#ec9c13]/20 to-[#2d2418] rounded-xl border border-[#ec9c13]/30 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-serif font-bold text-white">Patron Plan</span>
                            <span className="text-xs px-3 py-1 rounded-full bg-[#ec9c13] text-[#221b10] font-bold">ACTIVE</span>
                        </div>
                        <p className="text-sm text-[#9e8e78] mb-4">Unlimited access to all content, offline downloads, and spatial audio.</p>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-white">$9.99</span>
                            <span className="text-sm text-[#9e8e78]">/month</span>
                        </div>
                        <p className="text-xs text-[#9e8e78]">Next billing date: March 15, 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PaymentPanel({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Payment Methods" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <SectionTitle>Saved Cards</SectionTitle>
                <SettingsCard>
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
                            <div>
                                <p className="text-sm font-medium text-white">•••• •••• •••• 4829</p>
                                <p className="text-xs text-[#9e8e78]">Expires 08/27</p>
                            </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#ec9c13]/20 text-[#ec9c13] border border-[#ec9c13]/30">Default</span>
                    </div>
                    <Divider />
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-8 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-[10px] font-bold">MC</div>
                            <div>
                                <p className="text-sm font-medium text-white">•••• •••• •••• 1053</p>
                                <p className="text-xs text-[#9e8e78]">Expires 12/26</p>
                            </div>
                        </div>
                    </div>
                </SettingsCard>

                <button className="w-full mt-6 p-4 rounded-xl border border-dashed border-[#4a3c2a] text-[#9e8e78] hover:border-[#ec9c13]/40 hover:text-[#ec9c13] transition-colors flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">Add New Card</span>
                </button>

                <div className="mt-8">
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
                                        <p className="text-sm font-medium text-white">{item.date}</p>
                                        <p className="text-xs text-[#9e8e78]">Patron Plan</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-white">{item.amount}</p>
                                        <p className="text-xs text-green-400">{item.status}</p>
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
        <div className="flex flex-col h-full">
            <PanelHeader title="Audio Quality" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <SectionTitle>Streaming Quality</SectionTitle>
                <SettingsCard>
                    <RadioOption label="Low" description="64 kbps • Uses less data" selected={quality === 'low'} onSelect={() => setQuality('low')} />
                    <Divider />
                    <RadioOption label="Normal" description="128 kbps • Balanced" selected={quality === 'normal'} onSelect={() => setQuality('normal')} />
                    <Divider />
                    <RadioOption label="High Fidelity" description="256 kbps • Best sound" selected={quality === 'high'} onSelect={() => setQuality('high')} />
                    <Divider />
                    <RadioOption label="Lossless" description="FLAC • Requires Patron plan" selected={quality === 'lossless'} onSelect={() => setQuality('lossless')} />
                </SettingsCard>

                <div className="mt-8">
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
        <div className="flex flex-col h-full">
            <PanelHeader title="Downloads & Offline" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <SectionTitle>Download Settings</SectionTitle>
                <SettingsCard>
                    <SettingsRow
                        icon={wifiOnly ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        label="Wi-Fi Only"
                        trailing={<Toggle checked={wifiOnly} onChange={setWifiOnly} />}
                    />
                    <Divider />
                    <RadioOption label="Standard" description="128 kbps • ~1 MB/min" selected={downloadQuality === 'standard'} onSelect={() => setDownloadQuality('standard')} />
                    <Divider />
                    <RadioOption label="High" description="256 kbps • ~2 MB/min" selected={downloadQuality === 'high'} onSelect={() => setDownloadQuality('high')} />
                </SettingsCard>

                <div className="mt-8">
                    <SectionTitle>Storage</SectionTitle>
                    <SettingsCard>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <HardDrive className="w-4 h-4 text-[#ec9c13]" />
                                    <span className="text-sm font-medium text-white">Used Space</span>
                                </div>
                                <span className="text-sm text-[#9e8e78]">1.2 GB / 4 GB</span>
                            </div>
                            <div className="w-full h-2 bg-[#4a3c2a] rounded-full overflow-hidden">
                                <div className="h-full bg-[#ec9c13] rounded-full" style={{ width: '30%' }} />
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
        <div className="flex flex-col h-full">
            <PanelHeader title="Notifications" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <SectionTitle>General</SectionTitle>
                <SettingsCard>
                    <SettingsRow
                        icon={pushEnabled ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        label="Push Notifications"
                        trailing={<Toggle checked={pushEnabled} onChange={setPushEnabled} />}
                    />
                </SettingsCard>

                <div className="mt-8">
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

                <div className="mt-8">
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
        <div className="flex flex-col h-full">
            <PanelHeader title="Display & Theme" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <SectionTitle>Theme</SectionTitle>
                <div className="grid grid-cols-3 gap-3 mb-8">
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
                                    ? 'bg-[#ec9c13]/10 border-[#ec9c13]/40 text-[#ec9c13]'
                                    : 'bg-[#2d2418] border-[#4a3c2a] text-[#9e8e78] hover:border-[#ec9c13]/20'
                            )}
                        >
                            {t.icon}
                            <span className="text-xs font-medium">{t.label}</span>
                        </button>
                    ))}
                </div>

                <SectionTitle>Text Size</SectionTitle>
                <SettingsCard>
                    <RadioOption label="Small" description="Compact reading" selected={fontSize === 'small'} onSelect={() => setFontSize('small')} />
                    <Divider />
                    <RadioOption label="Medium" description="Default size" selected={fontSize === 'medium'} onSelect={() => setFontSize('medium')} />
                    <Divider />
                    <RadioOption label="Large" description="Easier to read" selected={fontSize === 'large'} onSelect={() => setFontSize('large')} />
                </SettingsCard>

                {/* Preview */}
                <div className="mt-8">
                    <SectionTitle>Preview</SectionTitle>
                    <div className="bg-[#2d2418] rounded-xl border border-[#4a3c2a] p-5">
                        <h3 className={cn(
                            'font-serif font-bold text-white mb-2',
                            fontSize === 'small' ? 'text-base' : fontSize === 'large' ? 'text-2xl' : 'text-lg'
                        )}>
                            The Art of Listening
                        </h3>
                        <p className={cn(
                            'text-[#9e8e78] leading-relaxed',
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
        <div className="flex flex-col h-full">
            <PanelHeader title="Language" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-6 py-6">
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

                <SectionTitle>Content Language</SectionTitle>
                <div className="mt-4">
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
        <div className="flex flex-col h-full">
            <PanelHeader title="Privacy & Security" onBack={onBack} />
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <SectionTitle>Authentication</SectionTitle>
                <SettingsCard>
                    <SettingsRow
                        icon={<Shield className="w-4 h-4" />}
                        label="Change Password"
                        onClick={() => { }}
                    />
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

                <div className="mt-8">
                    <SectionTitle>Privacy</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<Eye className="w-4 h-4" />} label="Private Profile" trailing={<Toggle checked={false} onChange={() => { }} />} />
                        <Divider />
                        <SettingsRow icon={<Globe className="w-4 h-4" />} label="Activity Status" trailing={<Toggle checked={true} onChange={() => { }} />} />
                    </SettingsCard>
                </div>

                <div className="mt-8">
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

    // Sub-panels
    if (activePanel === 'profile') return <ProfilePanel onBack={goBack} />;
    if (activePanel === 'payment') return <PaymentPanel onBack={goBack} />;
    if (activePanel === 'audio') return <AudioPanel onBack={goBack} />;
    if (activePanel === 'downloads') return <DownloadsPanel onBack={goBack} />;
    if (activePanel === 'notifications') return <NotificationsPanel onBack={goBack} />;
    if (activePanel === 'theme') return <ThemePanel onBack={goBack} />;
    if (activePanel === 'language') return <LanguagePanel onBack={goBack} />;
    if (activePanel === 'security') return <SecurityPanel onBack={goBack} />;

    return (
        <div className="h-full w-full overflow-y-auto bg-[#221b10] font-sans text-white">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#221b10]/95 backdrop-blur-md border-b border-[#ec9c13]/20 pt-6 pb-4 px-6">
                <div className="flex items-center justify-between">
                    <Link href="/">
                        <button className="p-2 -ml-2 rounded-full hover:bg-[#ec9c13]/10 transition-colors text-[#ec9c13] active:scale-95">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </Link>
                    <h1 className="font-serif text-2xl font-bold tracking-wide text-white">Settings</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="px-6 py-6">
                {/* Profile Teaser */}
                <button
                    onClick={() => setActivePanel('profile')}
                    className="w-full mb-10 flex items-center space-x-4 bg-[#2d2418]/40 p-4 rounded-xl border border-[#ec9c13]/10 hover:border-[#ec9c13]/30 transition-colors group"
                >
                    <div className="relative">
                        <img
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover border-2 border-[#ec9c13]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWifIO0mY4d7zfoU55ltGA6oiYG1wc_ceQz9O-IiH7KeMn9_1kADzxojHjKIe2nCx-ObvDuZqBROCPmCD79Thbf3meKVEUnLakIXdEfneyDp78sa1kPzcJFsqcg6kggR6f8xqJW6rYbVsCPZ2nFXgjPcOP8HyrenU1qv9ei0YCKF-7LvxHqWaSuKRJ06j4hz2NKs_aSGWsIYKX3bu_Y8-mFUIk-SweXiCOZEB-GLgb_F7-b1zHeeJwtqGZWD46uF779L2VWoV_ewE"
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#ec9c13] rounded-full border-2 border-[#221b10]" />
                    </div>
                    <div className="flex-1 text-left">
                        <h2 className="font-serif text-xl font-semibold text-white">Julian Sterling</h2>
                        <p className="text-sm text-[#ec9c13]">Patron Member</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#9e8e78] group-hover:text-[#ec9c13] group-hover:translate-x-1 transition-all" />
                </button>

                {/* ── Section: Account ── */}
                <div className="mb-8">
                    <SectionTitle>Account</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<User className="w-4 h-4" />} label="Profile & Subscription" onClick={() => setActivePanel('profile')} />
                        <Divider />
                        <SettingsRow icon={<CreditCard className="w-4 h-4" />} label="Payment Methods" onClick={() => setActivePanel('payment')} />
                        <Divider />
                        <SettingsRow icon={<Shield className="w-4 h-4" />} label="Privacy & Security" onClick={() => setActivePanel('security')} />
                    </SettingsCard>
                </div>

                {/* ── Section: Content & Playback ── */}
                <div className="mb-8">
                    <SectionTitle>Content & Playback</SectionTitle>
                    <SettingsCard>
                        <SettingsRow icon={<AudioLines className="w-4 h-4" />} label="Audio Quality" value="High Fidelity" onClick={() => setActivePanel('audio')} />
                        <Divider />
                        <SettingsRow icon={<Download className="w-4 h-4" />} label="Downloads & Offline" onClick={() => setActivePanel('downloads')} />
                    </SettingsCard>
                </div>

                {/* ── Section: Preferences ── */}
                <div className="mb-12">
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
                <div className="mb-10 flex flex-col items-center space-y-4">
                    <button className="w-full bg-transparent border border-[#ec9c13]/30 text-[#ec9c13] py-4 px-6 rounded-xl font-semibold hover:bg-[#ec9c13]/10 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Log Out</span>
                    </button>
                    <p className="text-xs text-[#9e8e78]">Version 2.4.0 (Build 1082)</p>
                </div>
            </main>

            <GlobalNowPlayingBar />
        </div>
    );
}
