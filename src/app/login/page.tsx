'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, Lock, Zap, Settings } from 'lucide-react';
import { useLogin } from '@/lib/hooks/use-auth';
import { isValidEmail } from '@/lib/validation/email';
import { useTranslations } from '@/lib/i18n';

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered') === 'true';
    const t = useTranslations();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);

    const login = useLogin();

    const emailValid = isValidEmail(email);
    const passwordValid = password.length >= 4;
    const isValid = emailValid && passwordValid;
    const emailError = emailTouched && email.length > 0 && !emailValid;
    const passwordError = passwordTouched && password.length > 0 && !passwordValid;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!isValid) return;

        try {
            await login.mutateAsync({ email, password });
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : t('auth.login.error'));
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="pt-12 pb-4 px-5 flex items-center justify-between">
                <button
                    type="button"
                    aria-label="Back"
                    onClick={() => router.push('/news')}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors text-foreground active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    aria-label={t('settings.title')}
                    onClick={() => router.push('/settings')}
                    className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-1 px-5 flex flex-col">
                {/* Branding */}
                <div className="pt-8 pb-10 text-center">
                    <h1 className="font-serif text-3xl font-bold text-foreground tracking-wide">{t('auth.login.title')}</h1>
                    <p className="text-sm text-muted-foreground mt-2">{t('auth.login.subtitle')}</p>
                </div>

                {/* Success message from registration */}
                {registered && (
                    <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                        <p className="text-sm text-green-400">{t('auth.login.success')}</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                            {t('auth.login.email')}
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => setEmailTouched(true)}
                            placeholder={t('auth.login.emailPlaceholder')}
                                autoComplete="email"
                                aria-invalid={emailError || undefined}
                                className={`w-full h-12 pl-10 pr-4 rounded-xl bg-card border text-foreground placeholder:text-muted-foreground/50 focus:ring-1 outline-none transition-all text-sm ${emailError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border focus:border-gold focus:ring-gold/30'}`}
                            />
                        </div>
                        {emailError && (
                            <p className="text-xs text-red-400 ml-1">{t('auth.login.emailError')}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                            {t('auth.login.password')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => setPasswordTouched(true)}
                            placeholder={t('auth.login.passwordPlaceholder')}
                                autoComplete="current-password"
                                aria-invalid={passwordError || undefined}
                                className={`w-full h-12 pl-10 pr-4 rounded-xl bg-card border text-foreground placeholder:text-muted-foreground/50 focus:ring-1 outline-none transition-all text-sm ${passwordError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border focus:border-gold focus:ring-gold/30'}`}
                            />
                        </div>
                        {passwordError && (
                            <p className="text-xs text-red-400 ml-1">{t('auth.login.passwordError')}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!isValid || login.isPending}
                        className="w-full h-12 rounded-xl bg-gold text-background font-semibold text-sm hover:bg-gold/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {login.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('auth.login.submitting')}
                            </>
                        ) : (
                            t('auth.login.submit')
                        )}
                    </button>
                </form>

                {/* Quick Sign In — same default user as Platform Console */}
                <div className="pt-6">
                    <div className="relative flex items-center py-3">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="mx-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{t('auth.login.or')}</span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            setError('');
                            try {
                                await login.mutateAsync({ email: 'admin@gmail.com', password: 'admin' });
                                router.push('/');
                            } catch (err) {
                                setError(err instanceof Error ? err.message : t('auth.login.quickFail'));
                            }
                        }}
                        disabled={login.isPending}
                        className="w-full h-12 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Zap className="w-4 h-4 text-gold" />
                        {t('auth.login.quick')}
                    </button>
                    <p className="text-[10px] text-muted-foreground/40 text-center mt-2">{t('auth.login.quickHint')}</p>
                </div>

                {/* Register link */}
                <div className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('auth.login.registerPrompt')}{' '}
                        <Link href="/register" className="text-gold font-medium hover:underline">
                            {t('auth.login.registerAction')}
                        </Link>
                    </p>
                </div>

                {/* Skip */}
                <div className="pt-4 pb-8 text-center">
                    <Link href="/" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        {t('auth.login.skip')}
                    </Link>
                </div>
            </main>
        </div>
    );
}
