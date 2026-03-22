'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, Lock, Zap } from 'lucide-react';
import { useLogin } from '@/lib/hooks/use-auth';

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

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const login = useLogin();

    const isValid = email.includes('@') && password.length >= 4;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!isValid) return;

        try {
            await login.mutateAsync({ email, password });
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="pt-12 pb-4 px-5">
                <Link href="/">
                    <button className="p-2 -ml-2 rounded-full hover:bg-muted/60 transition-colors text-foreground active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
            </header>

            <main className="flex-1 px-5 flex flex-col">
                {/* Branding */}
                <div className="pt-8 pb-10 text-center">
                    <h1 className="font-serif text-3xl font-bold text-foreground tracking-wide">Wahb</h1>
                    <p className="text-sm text-muted-foreground mt-2">Sign in to personalize your feed</p>
                </div>

                {/* Success message from registration */}
                {registered && (
                    <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                        <p className="text-sm text-green-400">Account created! Sign in to continue.</p>
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
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 4 characters"
                                autoComplete="current-password"
                                className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!isValid || login.isPending}
                        className="w-full h-12 rounded-xl bg-gold text-background font-semibold text-sm hover:bg-gold/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {login.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Quick Sign In — same default user as Platform Console */}
                <div className="pt-6">
                    <div className="relative flex items-center py-3">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="mx-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">or</span>
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
                                setError(err instanceof Error ? err.message : 'Quick sign in failed');
                            }
                        }}
                        disabled={login.isPending}
                        className="w-full h-12 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Zap className="w-4 h-4 text-gold" />
                        Quick Sign In
                    </button>
                    <p className="text-[10px] text-muted-foreground/40 text-center mt-2">admin@gmail.com</p>
                </div>

                {/* Register link */}
                <div className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-gold font-medium hover:underline">
                            Register
                        </Link>
                    </p>
                </div>

                {/* Skip */}
                <div className="pt-4 pb-8 text-center">
                    <Link href="/" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        Continue without signing in
                    </Link>
                </div>
            </main>
        </div>
    );
}
