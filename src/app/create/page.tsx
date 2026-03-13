'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  X,
  Settings,
  Mic,
  PenTool,
  FileText,
  FileAudio,
  ChevronRight,
  Quote,
  Activity,
  SlidersHorizontal
} from 'lucide-react';

export default function CreatePage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-gradient-to-b from-[#0A0A2E] via-[#191970] to-[#0A0A2E] text-slate-200 font-sans">
      {/* Theater Lighting Effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 50% -20%, rgba(218, 164, 40, 0.15) 0%, transparent 60%)' }}
      />
      
      {/* Top Navigation */}
      <nav className="flex items-center px-6 py-6 justify-between z-20 sticky top-0 bg-[#0A0A2E]/40 backdrop-blur-md">
        <button 
          onClick={() => router.back()}
          className="text-primary/70 flex size-10 items-center justify-center hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 flex justify-center items-center py-2">
          <Image 
            src="/images/Wahb-logo-noblue-removebg.png" 
            alt="Wahb Logo" 
            width={72} 
            height={40} 
            className="object-contain"
            priority
          />
        </div>
        <div className="flex w-10 items-center justify-end">
          <button className="flex items-center justify-center rounded-full h-10 w-10 text-primary/70 hover:text-primary transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Header Message */}
      <div className="relative px-8 pt-4 pb-10 flex flex-col items-center text-center z-10">
        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto opacity-90 italic">
          Preserving your legacy through the fine arts of voice and word.
        </p>
      </div>

      {/* Main Actions */}
      <div className="px-6 grid grid-cols-2 gap-4 mb-12 z-10">
        {/* Record Audio */}
        <button className="group relative flex flex-col items-center w-full">
          <div className="relative w-full aspect-[4/5] rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-300 group-hover:border-primary/40 group-active:scale-[0.98] bg-[#191970]/40 backdrop-blur-md border border-primary/10">
            <div className="bg-primary/10 text-primary p-4 rounded-full mb-4 border border-primary/20 group-hover:bg-primary group-hover:text-[#0A0A2E] transition-all duration-300">
              <Mic className="w-8 h-8" />
            </div>
            <span className="font-serif font-bold text-lg text-slate-100">Record</span>
            <span className="text-[10px] text-primary/60 uppercase tracking-[0.2em] mt-1.5 font-bold">Audio</span>
          </div>
        </button>

        {/* Write Something */}
        <button className="group relative flex flex-col items-center w-full">
          <div className="relative w-full aspect-[4/5] rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-300 group-hover:border-primary/40 group-active:scale-[0.98] bg-[#191970]/40 backdrop-blur-md border border-primary/10">
            <div className="bg-primary/10 text-primary p-4 rounded-full mb-4 border border-primary/20 group-hover:bg-primary group-hover:text-[#0A0A2E] transition-all duration-300">
              <PenTool className="w-8 h-8" />
            </div>
            <span className="font-serif font-bold text-lg text-slate-100">Write</span>
            <span className="text-[10px] text-primary/60 uppercase tracking-[0.2em] mt-1.5 font-bold">Something</span>
          </div>
        </button>
      </div>

      {/* Extra Features */}
      <div className="flex-1 px-6 space-y-10 pb-16 z-10">
        {/* Drafts Section */}
        <section>
          <div className="flex items-end justify-between mb-5 px-1">
            <h3 className="font-serif text-xl font-bold text-primary tracking-tight">Drafts</h3>
            <button className="text-primary/50 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">View All</button>
          </div>
          
          <div className="space-y-1">
            <div className="bg-[#191970]/40 backdrop-blur-md border border-primary/10 px-4 py-3.5 rounded-xl flex items-center gap-4 hover:bg-primary/5 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                <FileText className="text-primary/60 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-slate-200 truncate">The Summer of &apos;84</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Last edited 2h ago</p>
              </div>
              <ChevronRight className="text-slate-600 w-5 h-5" />
            </div>

            <div className="bg-[#191970]/40 backdrop-blur-md border border-primary/10 px-4 py-3.5 rounded-xl flex items-center gap-4 hover:bg-primary/5 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                <FileAudio className="text-primary/60 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-slate-200 truncate">Voicemail for Elena</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Last edited Yesterday</p>
              </div>
              <ChevronRight className="text-slate-600 w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Inspiration Feed */}
        <section>
          <h3 className="font-serif text-xl font-bold text-primary tracking-tight mb-5 px-1">Inspiration</h3>
          <div className="bg-[#191970]/40 backdrop-blur-md border border-primary/10 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute -top-1 -right-1 opacity-10">
              <Quote className="text-primary w-16 h-16" />
            </div>
            <p className="font-serif italic text-lg text-slate-200 leading-relaxed relative z-10 mb-6">
              &quot;Your legacy is every life you&apos;ve touched.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="h-px w-6 bg-primary/40"></div>
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-primary/70">Daily Prompt</span>
            </div>
          </div>
        </section>

        {/* Voice Tuning */}
        <section>
          <h3 className="font-serif text-xl font-bold text-primary tracking-tight mb-5 px-1">Voice Tuning</h3>
          <div className="bg-[#191970]/40 backdrop-blur-md border border-primary/10 divide-y divide-primary/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="text-primary/60 w-5 h-5" />
                <span className="text-sm font-medium text-slate-300">Ambient Reduction</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked type="checkbox" className="sr-only peer" />
                <div className="w-10 h-5 bg-[#242A80] border border-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-primary after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-500 after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
            </div>
            
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="text-primary/60 w-5 h-5" />
                <span className="text-sm font-medium text-slate-300">Cinematic Clarity</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-10 h-5 bg-[#242A80] border border-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-primary after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-500 after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Decorative elements */}
      <div className="fixed bottom-[-5%] -left-10 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
    </div>
  );
}
