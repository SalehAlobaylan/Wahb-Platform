'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  X,
  Mic,
  SlidersHorizontal,
  FileText,
  Save,
  Send,
  Timer,
  Type,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';
import { useAuthStore } from '@/lib/stores';
import { usePublishContent } from '@/lib/hooks/use-publish-content';
import { dataUrlToBlob } from '@/lib/api/content';
import { useTranslations } from '@/lib/i18n/use-translations';
import { cn } from '@/lib/utils';

const DRAFT_STORAGE_KEY = 'wahb_create_draft';

interface CreateDraft {
  title: string;
  body: string;
  audioDataUrl: string | null;
  audioMimeType: string | null;
  ambientReduction: boolean;
  warmClarity: boolean;
  updatedAt: string;
}

function formatSavedTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDraftDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CreatePage() {
  const router = useRouter();
  const hasNowPlaying = Boolean(useNowPlayingStore((state) => state.currentItem));
  const { isAuthenticated } = useAuthStore();
  const publish = usePublishContent();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTuning, setShowTuning] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [savedDraft, setSavedDraft] = useState<CreateDraft | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);
  const [ambientReduction, setAmbientReduction] = useState(true);
  const [warmClarity, setWarmClarity] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const t = useTranslations();

  const hasDraftContent = title.trim().length > 0 || body.trim().length > 0 || Boolean(audioDataUrl);
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft) as CreateDraft;
      const restoreDraft = window.setTimeout(() => {
        setSavedDraft(draft);
        setTitle(draft.title);
        setBody(draft.body);
        setAudioDataUrl(draft.audioDataUrl);
        setAudioMimeType(draft.audioMimeType);
        setAmbientReduction(draft.ambientReduction);
        setWarmClarity(draft.warmClarity);
        setLastSavedAt(formatSavedTime(draft.updatedAt));
        setStatusMessage('Loaded your saved draft.');
      }, 0);

      return () => window.clearTimeout(restoreDraft);
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const buildDraft = (): CreateDraft => ({
    title: title.trim(),
    body: body.trim(),
    audioDataUrl,
    audioMimeType,
    ambientReduction,
    warmClarity,
    updatedAt: new Date().toISOString(),
  });

  const handleSaveDraft = () => {
    const draft = buildDraft();
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setSavedDraft(draft);
    setLastSavedAt(formatSavedTime(draft.updatedAt));
    setStatusMessage('Draft saved on this device.');
  };

  const handleLoadDraft = () => {
    if (!savedDraft) {
      setStatusMessage('No saved draft yet.');
      return;
    }

    setTitle(savedDraft.title);
    setBody(savedDraft.body);
    setAudioDataUrl(savedDraft.audioDataUrl);
    setAudioMimeType(savedDraft.audioMimeType);
    setAmbientReduction(savedDraft.ambientReduction);
    setWarmClarity(savedDraft.warmClarity);
    setLastSavedAt(formatSavedTime(savedDraft.updatedAt));
    setStatusMessage('Draft restored.');
    setShowDrafts(false);
  };

  const handleDeleteDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setSavedDraft(null);
    setTitle('');
    setBody('');
    setAudioDataUrl(null);
    setAudioMimeType(null);
    setLastSavedAt(null);
    setStatusMessage('Draft deleted.');
    setShowDrafts(false);
  };

  const handleRecordClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatusMessage('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();

        reader.onloadend = () => {
          setAudioDataUrl(typeof reader.result === 'string' ? reader.result : null);
          setAudioMimeType(mimeType);
          setStatusMessage('Voice layer attached. Save the draft to keep it.');
        };

        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      setStatusMessage('Recording started.');
    } catch {
      setStatusMessage('Microphone access was blocked or unavailable.');
    }
  };

  const handleRemoveAudio = () => {
    setAudioDataUrl(null);
    setAudioMimeType(null);
    setStatusMessage('Voice layer removed.');
  };

  const draftPreview = savedDraft?.body || savedDraft?.title || 'Untitled draft';

  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const canPublish = isAuthenticated && trimmedTitle.length >= 3 && (trimmedBody.length > 0 || Boolean(audioDataUrl));

  const handlePublish = async () => {
    if (!canPublish) return;
    setStatusMessage(null);

    const audioBlob = audioDataUrl ? dataUrlToBlob(audioDataUrl) : null;
    try {
      const result = await publish.mutateAsync({
        title: trimmedTitle,
        bodyText: trimmedBody,
        audioBlob: audioBlob ?? undefined,
        audioFilename: audioMimeType
          ? `voice-layer.${audioMimeType.split('/')[1]?.split(';')[0] || 'webm'}`
          : 'voice-layer.webm',
      });

      // Drop the local draft now that the item is in CMS.
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setSavedDraft(null);

      if (result.status === 'READY') {
        toast.success('Published to your profile');
      } else {
        toast('Submitted — normalizing audio', {
          description: 'It will appear in My Audio once transcoding finishes.',
        });
      }

      const targetTab = audioBlob ? 'audio' : 'writes';
      setTimeout(() => router.push(`/profile?tab=${targetTab}`), 700);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    }
  };

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground font-sans" dir="ltr">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(circle at 100% 0%, rgba(230,57,70, 0.16) 0%, transparent 42%)' }}
      />

        <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/90 p-4 pb-2 backdrop-blur-md">
          <button
            onClick={() => router.back()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/70"
            aria-label={t('create.close')}
          >
            <X className="h-6 w-6" />
          </button>

          <h1 className="flex-1 pr-10 text-center font-serif text-xl font-bold leading-tight tracking-[-0.015em] text-primary">
            WAHB.
          </h1>
        </nav>

      <main
        className={cn(
          'relative z-10 flex-1 overflow-y-auto hide-scrollbar p-4',
          hasNowPlaying ? 'pb-24' : 'pb-6'
        )}
      >
         <div className="flex items-center justify-between px-2">
           <button
             onClick={() => setShowDrafts((value) => !value)}
             className={cn(
               'flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary',
               showDrafts ? 'text-primary' : 'text-muted-foreground'
             )}
           >
             <FileText className="h-4 w-4" />
             {t('create.drafts')}
           </button>

          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Type className="h-3.5 w-3.5" />
              {wordCount} words
            </span>
            {lastSavedAt && (
              <span className="flex items-center gap-1 text-primary">
                <Timer className="h-3.5 w-3.5" />
                {lastSavedAt}
              </span>
            )}
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-medium text-primary">
            {statusMessage}
          </div>
        )}

        {showDrafts && (
           <section className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
             <div className="flex items-start justify-between gap-3">
               <div className="min-w-0">
                 <p className="font-serif text-base font-bold text-foreground">{t('create.savedDraft')}</p>
                 {savedDraft ? (
                   <>
                     <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{draftPreview}</p>
                     <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary/70">
                       {t('create.updatedAt', { date: formatDraftDate(savedDraft.updatedAt) })}
                     </p>
                   </>
                 ) : (
                   <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('create.noSavedDraft')}</p>
                 )}
               </div>

               {savedDraft && (
                 <button
                   onClick={handleDeleteDraft}
                   className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                   aria-label={t('create.deleteDraft')}
                 >
                   <Trash2 className="h-4 w-4" />
                 </button>
               )}
             </div>

             {savedDraft && (
               <button
                 onClick={handleLoadDraft}
                 className="mt-4 h-10 w-full rounded-full bg-primary text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
               >
                 {t('create.loadDraft')}
               </button>
             )}
           </section>
         )}

        <section className="mt-5 flex min-h-[58vh] flex-col rounded-3xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">Writing Canvas</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lastSavedAt ? `Draft saved at ${lastSavedAt}` : 'Start with text. Add voice whenever it helps.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
               <button
                 onClick={handleSaveDraft}
                 disabled={!hasDraftContent}
                 className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-bold text-foreground transition-all hover:border-primary/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                 aria-label={t('create.saveDraft')}
               >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
                <button
                  onClick={handlePublish}
                  disabled={!canPublish || publish.isPending}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                  aria-label={t('create.publish')}
                  title={!isAuthenticated ? t('create.publish.signIn') : trimmedTitle.length < 3 ? t('create.publish.titleMin') : undefined}
                >
                {publish.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Publish
              </button>
            </div>
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full border-0 border-b border-border/70 bg-transparent px-0 py-4 font-serif text-2xl font-semibold text-foreground placeholder:text-foreground/35 transition-colors focus:border-primary focus:outline-none focus:ring-0"
            placeholder="Title your performance..."
            type="text"
          />

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="mt-4 min-h-[38vh] flex-1 resize-none border-0 bg-transparent p-0 text-lg leading-8 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0"
            placeholder="Begin your story here... The canvas is yours."
          />
        </section>

        <section className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', isRecording ? 'animate-pulse bg-red-500' : 'bg-primary')} />
                <p className="truncate font-serif text-base font-bold leading-tight text-foreground">
                  {isRecording ? 'Recording voice layer' : 'Audio Companion'}
                </p>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isRecording
                  ? 'Your voice note will attach to this draft. Tap the mic again to stop.'
                  : 'Add a spoken note when typing slows you down.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
               <button
                 onClick={() => setShowTuning((value) => !value)}
                 className={cn(
                   'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
                   showTuning ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                 )}
                 aria-label={t('create.tuneVoice')}
               >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
              <button
                onClick={handleRecordClick}
                className={cn(
                  'group relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-primary-foreground shadow-md transition-all active:scale-95',
                  isRecording ? 'bg-red-500 shadow-red-500/25 hover:bg-red-500/90' : 'bg-primary shadow-primary/25 hover:bg-primary/90'
                )}
                aria-label={isRecording ? 'Stop recording' : 'Record audio'}
              >
                <span className="absolute inset-0 scale-0 rounded-full bg-white/20 transition-transform duration-500 ease-out group-hover:scale-150" />
                <Mic className="relative z-10 h-6 w-6" />
              </button>
            </div>
          </div>

          {audioDataUrl && (
            <div className="mt-4 rounded-2xl border border-border bg-background/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary/70">Voice Layer</p>
                <button
                  onClick={handleRemoveAudio}
                  className="text-xs font-bold text-muted-foreground transition-colors hover:text-red-500"
                >
                  Remove
                </button>
              </div>
              <audio controls src={audioDataUrl} className="w-full" />
              {audioMimeType && <p className="mt-2 text-[10px] text-muted-foreground">{audioMimeType}</p>}
            </div>
          )}
        </section>

        {showTuning && (
          <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="font-serif text-base font-bold text-foreground">Voice tuning</p>
            <div className="mt-3 grid gap-2">
              <label className="flex items-center justify-between rounded-xl bg-background/70 px-3 py-3 text-sm">
                Ambient reduction
                <input
                  checked={ambientReduction}
                  onChange={(event) => setAmbientReduction(event.target.checked)}
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-background/70 px-3 py-3 text-sm">
                Warm clarity
                <input
                  checked={warmClarity}
                  onChange={(event) => setWarmClarity(event.target.checked)}
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                />
              </label>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
