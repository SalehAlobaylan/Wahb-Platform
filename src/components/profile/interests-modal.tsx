'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Check, Plus } from 'lucide-react';

const ALL_INTERESTS = [
    'Tech', 'AI', 'Music', 'Design', 'Startup', 'Science',
    'Politics', 'Business', 'Culture', 'Health', 'Sports', 'Gaming',
    'Film', 'Books', 'Travel', 'Food', 'Fashion', 'Art',
    'History', 'Education', 'Environment', 'Finance', 'Crypto', 'Space',
];

interface InterestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selected: string[];
    onSave: (interests: string[]) => void;
}

export function InterestsModal({ isOpen, onClose, selected, onSave }: InterestsModalProps) {
    const [localSelected, setLocalSelected] = useState<string[]>(selected);

    if (!isOpen) return null;

    const toggle = (interest: string) => {
        setLocalSelected((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : [...prev, interest]
        );
    };

    const handleSave = () => {
        onSave(localSelected);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-serif font-bold text-foreground">Your Interests</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs text-muted-foreground mb-5 tracking-wide">
                    Select topics you&apos;re interested in. We&apos;ll personalize your feed accordingly.
                </p>

                {/* Interest chips grid */}
                <div className="flex flex-wrap gap-2 mb-8 max-h-[300px] overflow-y-auto hide-scrollbar">
                    {ALL_INTERESTS.map((interest) => {
                        const isSelected = localSelected.includes(interest);
                        return (
                            <button
                                key={interest}
                                onClick={() => toggle(interest)}
                                className={cn(
                                    'px-3.5 py-2 rounded-full text-sm font-medium transition-all border',
                                    isSelected
                                        ? 'bg-gold/20 text-gold border-gold/40 shadow-[0_0_10px_rgba(218,164,40,0.15)]'
                                        : 'bg-muted text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
                                )}
                            >
                                <span className="flex items-center gap-1.5">
                                    {isSelected ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        <Plus className="w-3.5 h-3.5 opacity-50" />
                                    )}
                                    {interest}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    className="w-full py-3 rounded-xl bg-gold text-white font-bold text-sm tracking-wide hover:bg-gold/90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(218,164,40,0.3)]"
                >
                    Save Interests ({localSelected.length})
                </button>
            </div>
        </div>
    );
}
