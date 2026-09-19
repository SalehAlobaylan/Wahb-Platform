'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Mail, Lock, User } from 'lucide-react';
import { useRegister } from '@/lib/hooks/use-auth';
import { isValidEmail } from '@/lib/validation/email';
import { useTranslations } from '@/lib/i18n';

export default function RegisterPage() {
    const router = useRouter();
    const t = useTranslations();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const register = useRegister();

    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);

    const emailValid = isValidEmail(email);
    const passwordValid = password.length >= 4;
    const passwordsMatch = password === confirmPassword;
    const isValid = emailValid && passwordValid && passwordsMatch;

    const emailError = emailTouched && email.length > 0 && !emailValid;
    const passwordError = passwordTouched && password.length > 0 && !passwordValid;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!passwordsMatch) {
            setError(t('auth.register.mismatch'));
            return;
        }

        if (!isValid) return;

        try {
            await register.mutateAsync({
                email,
                password,
                ...(username.trim() && { username: username.trim() }),
            });
            router.push('/login?registered=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : t('auth.register.error'));
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="pt-12 pb-4 px-5">
                <Link href="/login">
                    <button className="p-2 -ml-2 rounded-full hover:bg-muted/60 transition-colors text-foreground active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
            </header>

            <main className="flex-1 px-5 flex flex-col">
                {/* Branding */}
                <div className="pt-6 pb-8 text-center">
                    <Image
                        src="/images/wahb_app_icon.png"
                        alt=""
                        width={72}
                        height={72}
                        priority
                        className="mx-auto mb-4 h-[72px] w-[72px] rounded-2xl object-contain shadow-lg shadow-news-accent/15"
                    />
                    <h1 className="font-serif text-3xl font-bold text-foreground tracking-wide">{t('auth.register.title')}</h1>
                    <p className="text-sm text-muted-foreground mt-2">{t('auth.register.subtitle')}</p>
                </div>

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
                            {t('auth.register.username')} <span className="normal-case text-muted-foreground/50">{t('auth.register.usernameOptional')}</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            placeholder={t('auth.register.usernamePlaceholder')}
                                autoComplete="username"
                                className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-news-accent focus:ring-1 focus:ring-news-accent/30 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                            {t('auth.register.email')}
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => setEmailTouched(true)}
                            placeholder={t('auth.register.emailPlaceholder')}
                                autoComplete="email"
                                aria-invalid={emailError || undefined}
                                className={`w-full h-12 pl-10 pr-4 rounded-xl bg-card border text-foreground placeholder:text-muted-foreground/50 focus:ring-1 outline-none transition-all text-sm ${emailError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border focus:border-news-accent focus:ring-news-accent/30'}`}
                            />
                        </div>
                        {emailError && (
                            <p className="text-xs text-red-400 ml-1">{t('auth.register.emailError')}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                            {t('auth.register.password')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => setPasswordTouched(true)}
                            placeholder={t('auth.register.passwordPlaceholder')}
                                autoComplete="new-password"
                                aria-invalid={passwordError || undefined}
                                className={`w-full h-12 pl-10 pr-4 rounded-xl bg-card border text-foreground placeholder:text-muted-foreground/50 focus:ring-1 outline-none transition-all text-sm ${passwordError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border focus:border-news-accent focus:ring-news-accent/30'}`}
                            />
                        </div>
                        {passwordError && (
                            <p className="text-xs text-red-400 ml-1">{t('auth.register.passwordError')}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                            {t('auth.register.confirm')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('auth.register.confirmPlaceholder')}
                                autoComplete="new-password"
                                className={`w-full h-12 pl-10 pr-4 rounded-xl bg-card border text-foreground placeholder:text-muted-foreground/50 focus:ring-1 outline-none transition-all text-sm ${
                                    confirmPassword && !passwordsMatch
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                                        : 'border-border focus:border-news-accent focus:ring-news-accent/30'
                                }`}
                            />
                        </div>
                        {confirmPassword && !passwordsMatch && (
                            <p className="text-xs text-red-400 ml-1">{t('auth.register.mismatch')}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!isValid || register.isPending}
                        className="w-full h-12 rounded-xl bg-news-accent text-background font-semibold text-sm hover:bg-news-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {register.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('auth.register.submitting')}
                            </>
                        ) : (
                            t('auth.register.submit')
                        )}
                    </button>
                </form>

                {/* Login link */}
                <div className="pt-8 pb-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('auth.register.already')}{' '}
                        <Link href="/login" className="text-news-accent font-medium hover:underline">
                            {t('auth.register.signIn')}
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
