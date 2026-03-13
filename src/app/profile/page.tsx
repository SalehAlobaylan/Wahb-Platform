'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, 
    MoreHorizontal, 
    MapPin, 
    Sparkles, 
    Globe, 
    Lightbulb, 
    Cpu, 
    ChevronRight, 
    AudioLines, 
    FileText, 
    Play,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InterestsModal } from '@/components/profile/interests-modal';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';

const DEFAULT_INTERESTS = [
    { label: '#AI', icon: Sparkles },
    { label: '#Saudi', icon: Globe },
    { label: '#Innovation', icon: Lightbulb },
    { label: '#Tech', icon: Cpu },
];

export default function ProfilePage() {
    const [interests, setInterests] = useState<string[]>(DEFAULT_INTERESTS.map(i => i.label.replace('#', '')));
    const [showInterestsModal, setShowInterestsModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'audio' | 'writes'>('audio');
    
    // Map current interests back to the default objects for icons (simplification)
    const displayedInterests = interests.map(interest => {
        const found = DEFAULT_INTERESTS.find(di => di.label.replace('#', '') === interest);
        return found || { label: `#${interest}`, icon: Sparkles };
    });

    const mockContentItems = [
        { id: 1, views: '12K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCZaHVXBUdmGQt7_Sm67aNr0uMbd4GlYEjjIfpDMBMCU2tCgfMoCsvo4v5XNkVAxq93TvLXTe_-YORZN5bmCdJ67084Mbl3GvKY_HY8daOf2EaVXV5S344ecidhnpqCJrClsqBC2k9nDDVWN5Ypyy2BR4_RVhqU0oFUVjdtJM_n4UvWsgNRRo6naJEo5iDnGN0TZ6EMRxxh9dXTGQdFvovhoeuL7EI6TehtulFZomxG9pi7eTBjpv59vB3Hssg5wX240NIMDesn0A' },
        { id: 2, views: '8.4K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-nsOyN7Ecd1nskptC2QrCO_gEAs13vk9rn2DvW7sSy_cw-xZx5MeDrxo013TMqV810fi1lHsv7TBkM-8ZQjPw7oNvX6hbVpC14E-gV8PxOzSVbMcUJC9neSpqVlKtIC6NRq3pb62BpWL5ayuoV1G3v9DWwK8_hUCn7i1TfzwENyRoiPl_r8Dqvv4x2yidmUwSfWMDGliajUwZxNEKQJ9pYu_JO1sdMeKMWKZBIGk4fYAFL7KlZeZaeqb8jjTeY8prDAec4AOOEOM' },
        { id: 3, views: '15.1K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLxGrhufjbUYjE8sFPleFDHl0qC13lVK6gyIDVUwZl3j4LSgxzhEeXdK6eHJ49w_KQg7ZPzfz2vIoQ1nbOZeY9GR5Q-Lx_U1hon--OoMeSKJq5d90AsOhaRfJtsGmAt-r7_oivw39k5Bt9cqgzpJtnEcxwWADh9twIqkbjdoe8rpM4Yda8qdi9uozylIsTaAM-plWQWLvkMdz1KSYFdCPIdAWlTi-RjNVnm_646altdaWYoUdSs9RBFcskhCUCM4S1g_bbojpO6cs' },
        { id: 4, views: '9.2K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOKLfWp2l29JHMHHrbsLa5jTUIv6ijL6O-QJXycC1nZdynapJIjl6RthvZCpht0e8sao0T-jrVL8205BimLhp4Cg48--5ad3R8QqYnKe2g4ign5ip0JQGLFIT8NCDQx7XoU6sxGPqIiNQohkBZtQH7_yHSJFdpuaGByNCJS_cpTN4n_KkBHpJSKrdJzxqCCZsOX6r8J079OZG1P6Qz-jK673WbgEfn87LQV_a9wHtVQm3XRnjqJfKrj0gz2ad7jBJvTXUhXukQU3Q' },
        { id: 5, views: '22K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQmB1x-vTjAP7iXi9alNhHYRhqk7lagfFRmUkgTl9yItno1lFeJOIYKSYiygJ6BerR3LoMuTtNwcpGI1gh2YyVga7VJBzq24xsM7uaDcacCqnylANY3ZssEDdOooCmj-ON2Ucay8cXedDq3CmsFnQGW8q74OYjnrdZlNjwWB-Z-Y3prtNDqwvc9yhkY2YgnywG_0u2jFFIFQNT5sRIG1z2xW6M8UZp0BKqX_at3vHiPBmpIVce-zb3NSoj9EeuFhrG-mTiOBSfZDU' },
        { id: 6, views: '4.7K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEgNn3Ck2JePE4eDhmLZU0qsbQlCdmuY7U6tgJAz2wDWBgRqWK3wBEhVO344Ru1SBMiz26nyI_1ehK42msr9hUuFwtgp3v0XNqWb8gd0iebx282BcLf0SSayWAvemQfpAmaOAdOG2OrcxcNxrDfWVhDW5cNOF_maDYoiWwR5hkeQP5j_g6bKUHgB4tGcbRNPQkaAh8KKKdF8MrXeezG8UUf44aNrm0Yhlnp6FXQTTUwdgP28UBnXIRFaAlcRRpjch4wZ3m1DPz9M8' },
        { id: 7, views: '11K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAD1ehDs132KIiNpi3Odp5wpoTOdkfpoqgP1pLnpvKwnhvRgOymexe6CVV7MSi8v7GAdC5uTA8PZYwrkTEkkfFX3Lg2jNdF9fm1_FDA3s2ZDJpunMk8Wokvhjgf2CLwx3Uls43U0OEX0l-HqVC1VPuFsf5yK1aDs4i50qrTlHFzJM9ukTZ2TLQ2AUOv2QKpmUpOAIeLhFJend2sHsxiCprnqRQNsEZ4mhTSIpPIykNNe2gEok0L6fGf6nR4wA3oKTmW8yahLmYC0zw' },
        { id: 8, views: '18K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAw81iBUCjZn6Z9SrI4ZMr2sklvaJN_qK0f9bYTr2Z5x2w9ZDw8cxmyCAnUXQn056q9HjEuaeVNYfmh7j58Sb9Jjtl7zuUk0Vm0z2Gh9-cjfLE1VdGP8humIv7GQ487LiTaQcoVo34GS1zDdzSfka0pFhD_oAWQ6wiD4wNP998slEjBjzpyShRRl5MgObWsYUv7MG1iHqbBBh7-HOED2Nnu5qz1G0p0T24zFoODYA-adjsDm60qajCek57WehiA5dmltg6ut5Sh7Qg' },
        { id: 9, views: '3.3K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHKxouG3H98kXvemWC81EJW6ECNPUpKqHYJjkPdG4Ps3TGHz7TyYl1aYRKU2ESSK-sgJAy-pijOH3uzP3LglGJh4-I90YgDQkPlyURKIE-pTRRO_1eIz1Cx9IxlmsbLtAhD_5zMq4ZBudThrHm2UhfZqLaF98EeTp9MNGjZYfR4lkd9GRCfA31K7hwc1lrIrKD7cikmwDuTIfS7vrLyWHXi-QAkmb-NolcljKden_NOHJ0z4zrYAzlm57qRo8d8TgRJRxZhsU-UEc' },
    ];

    return (
        <>
            <div className="relative flex h-auto min-h-screen w-full flex-col bg-background max-w-md mx-auto shadow-2xl overflow-x-hidden pb-16">
                
                {/* Header / Top Bar */}
                <div className="flex items-center bg-background p-4 pb-2 justify-between sticky top-0 z-20 border-b-border/40">
                    <Link href="/" className="text-foreground flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-muted/50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-foreground text-lg font-bold font-serif leading-tight tracking-tight flex-1 text-center">@julianne_gold</h2>
                    <div className="flex w-10 items-center justify-end cursor-pointer text-foreground hover:bg-muted/50 rounded-full h-10 transition-colors">
                        <MoreHorizontal className="w-6 h-6" />
                    </div>
                </div>

                {/* Profile Info */}
                <div className="flex p-4 pt-2">
                    <div className="flex w-full flex-col gap-6 items-center">
                        <div className="flex gap-4 flex-col items-center">
                            <div className="relative">
                                <div 
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-28 w-28 ring-4 ring-foreground ring-offset-2 ring-offset-background" 
                                    style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBvaAb-RDBJqC4FEK2L-Ry5Ua9Jn0OjsivyRAVc9uzh4JigcUNqmlVU83CnKnITvNou2fV86IOk86HoIFWXRF0P0An772gDU4QSh6sdpnqKOfQDC32kgmCq1DPL59AMnqKWpxhUfx1IQ76Gr5AMCWc8_mgzorL5s96206vVdB9c2Wq-zxxkKaQzRid1FHrWqdFhhTJGJPxLHBoho34O0cS0Uaob-M8b2g69SKI9RBFH0i6qyzJW4Qu1p_tgn7mqWWc7yTBYVX9DXdA")'}}
                                />
                                <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1 border-2 border-background shadow-sm flex items-center justify-center">
                                    <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center text-center px-6">
                                <h1 className="text-foreground text-3xl font-black font-serif leading-tight mb-2">Julianne Gold</h1>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-xs">
                                    Curating the intersection of AI and Saudi innovation. Playfair enthusiast & Audio Storyteller.
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <p className="text-xs font-bold tracking-wider uppercase">Riyadh, Saudi Arabia</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex w-full gap-3 px-4">
                            <button className="flex-1 cursor-pointer flex items-center justify-center rounded-lg h-11 bg-foreground text-background text-sm font-bold tracking-wide transition-all hover:opacity-90 shadow-md">
                                Follow
                            </button>
                            <button className="flex-1 cursor-pointer flex items-center justify-center rounded-lg h-11 border-2 border-border bg-card text-foreground text-sm font-bold tracking-wide transition-all hover:bg-muted">
                                Share Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="flex gap-4 px-6 py-4 justify-center">
                    <div className="flex flex-col items-center text-center">
                        <p className="text-foreground text-xl font-bold leading-tight">12.5K</p>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Followers</p>
                    </div>
                    <div className="w-[1px] h-8 bg-border self-center"></div>
                    <div className="flex flex-col items-center text-center">
                        <p className="text-foreground text-xl font-bold leading-tight">842</p>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Following</p>
                    </div>
                    <div className="w-[1px] h-8 bg-border self-center"></div>
                    <div className="flex flex-col items-center text-center">
                        <p className="text-primary text-xl font-bold leading-tight">3.1K</p>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Impact</p>
                    </div>
                </div>

                {/* Interests Chips (Horizontally Scrollable) */}
                <div className="relative group">
                    <div className="flex gap-2 p-4 pr-10 overflow-x-auto hide-scrollbar scroll-smooth">
                        {displayedInterests.map((interest, idx) => {
                            const Icon = interest.icon;
                            return (
                                <button 
                                    key={idx}
                                    onClick={() => setShowInterestsModal(true)}
                                    className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-foreground/5 px-4 border border-foreground/5 transition-colors hover:bg-foreground hover:text-background group/chip cursor-pointer"
                                >
                                    <Icon className="w-4 h-4 text-foreground group-hover/chip:text-background transition-colors" />
                                    <span className="text-foreground group-hover/chip:text-background text-xs font-bold tracking-wide transition-colors">
                                        {interest.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    
                    <button 
                        onClick={() => setShowInterestsModal(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground cursor-pointer shadow-sm hover:bg-muted transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs Section */}
                <div className="mt-2">
                    <div className="flex border-b border-border px-4">
                        <button 
                            onClick={() => setActiveTab('audio')}
                            className={cn(
                                "flex flex-col items-center justify-center pb-3 pt-4 flex-1 group transition-colors",
                                activeTab === 'audio' 
                                    ? "border-b-2 border-foreground text-foreground" 
                                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <AudioLines className="w-6 h-6 mb-1" />
                            <p className="text-xs font-bold uppercase tracking-widest">My Audio</p>
                        </button>
                        <button 
                            onClick={() => setActiveTab('writes')}
                            className={cn(
                                "flex flex-col items-center justify-center pb-3 pt-4 flex-1 transition-colors",
                                activeTab === 'writes' 
                                    ? "border-b-2 border-foreground text-foreground" 
                                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <FileText className="w-6 h-6 mb-1" />
                            <p className="text-xs font-bold uppercase tracking-widest">My Writes</p>
                        </button>
                    </div>
                </div>

                {/* Content Grid (TikTok-style cinematic grid) */}
                <div className="grid grid-cols-3 gap-[2px] bg-border pt-[2px] min-h-[50vh]">
                    {activeTab === 'audio' ? (
                        mockContentItems.map((item) => (
                            <div key={item.id} className="aspect-[3/4] relative bg-card overflow-hidden group cursor-pointer w-full h-full">
                                <img 
                                    alt={`Content ${item.id}`}
                                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" 
                                    src={item.img}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white">
                                    <Play className="w-3 h-3 fill-current" />
                                    <span className="text-[10px] font-bold">{item.views}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 flex flex-col items-center justify-center py-20 text-muted-foreground bg-background">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No writes yet</p>
                        </div>
                    )}
                </div>

                <div className="h-10 bg-background"></div>
            </div>

            <GlobalNowPlayingBar />

             {/* Interests Modal */}
             <InterestsModal
                isOpen={showInterestsModal}
                onClose={() => setShowInterestsModal(false)}
                selected={interests}
                onSave={setInterests}
            />
        </>
    );
}
