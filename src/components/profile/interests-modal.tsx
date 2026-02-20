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
            <div className="relative w-full max-w-md bg-[#261e16] border-t border-[#5c4d3c] rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-serif font-bold text-white">Your Interests</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs text-[#bcaaa4] mb-5 tracking-wide">
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
                                        ? 'bg-[#f2930d]/20 text-[#f2930d] border-[#f2930d]/40 shadow-[0_0_10px_rgba(242,147,13,0.15)]'
                                        : 'bg-white/5 text-[#bcaaa4] border-white/10 hover:border-white/20 hover:text-white'
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
                    className="w-full py-3 rounded-xl bg-[#f2930d] text-[#1a140e] font-bold text-sm tracking-wide hover:bg-[#f2930d]/90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(242,147,13,0.3)]"
                >
                    Save Interests ({localSelected.length})
                </button>
            </div>
        </div>
    );
}
