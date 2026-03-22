'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, Lock, User } from 'lucide-react';
import { useRegister } from '@/lib/hooks/use-auth';

export default function RegisterPage() {
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const register = useRegister();

    const passwordsMatch = password === confirmPassword;
    const isValid = email.includes('@') && password.length >= 4 && passwordsMatch;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!passwordsMatch) {
            setError('Passwords do not match');
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
            setError(err instanceof Error ? err.message : 'Registration failed');
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
                    <h1 className="font-serif text-3xl font-bold text-foreground tracking-wide">Create Account</h1>
                    <p className="text-sm text-muted-foreground mt-2">Join Wahb to save your preferences</p>
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
                            Username <span className="normal-case text-muted-foreground/50">(optional)</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
                                autoComplete="username"
                                className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

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
                                autoComplete="new-password"
                                className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat your password"
                                autoComplete="new-password"
                                className={`w-full h-12 pl-10 pr-4 rounded-xl bg-card border text-foreground placeholder:text-muted-foreground/50 focus:ring-1 outline-none transition-all text-sm ${
                                    confirmPassword && !passwordsMatch
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                                        : 'border-border focus:border-gold focus:ring-gold/30'
                                }`}
                            />
                        </div>
                        {confirmPassword && !passwordsMatch && (
                            <p className="text-xs text-red-400 ml-1">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!isValid || register.isPending}
                        className="w-full h-12 rounded-xl bg-gold text-background font-semibold text-sm hover:bg-gold/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {register.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                {/* Login link */}
                <div className="pt-8 pb-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-gold font-medium hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
