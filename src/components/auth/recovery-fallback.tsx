"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type RecoveryKind = "verify" | "reset";

const copy = {
  verify: {
    eyebrow: "Account dispatch",
    title: "Verify your email",
    description: "Confirm this address, then return to Wahb.",
    action: "Verify email",
    success: "Your email is verified. You can sign in now.",
    endpoint: "/api/auth/verify-email",
  },
  reset: {
    eyebrow: "Account dispatch",
    title: "Set a new password",
    description: "Choose a new password for this Wahb account.",
    action: "Update password",
    success: "Your password is updated. Sign in with the new password.",
    endpoint: "/api/auth/reset-password",
  },
} as const;

/** Public browser recovery when a Universal Link opens without the native app. */
export function RecoveryFallback({ kind }: { kind: RecoveryKind }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const text = copy[kind];
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    token ? null : "This link is invalid or no longer available.",
  );
  const [completed, setCompleted] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!token) {
      setMessage("This link is invalid or no longer available.");
      return;
    }
    if (
      kind === "reset" &&
      (password.length < 4 || password !== confirmPassword)
    ) {
      setMessage("Enter matching passwords with at least 4 characters.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(text.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "reset" ? { token, new_password: password } : { token },
        ),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(
          typeof result?.message === "string"
            ? result.message
            : "This request could not be completed right now.",
        );
        return;
      }
      setCompleted(true);
    } catch {
      setMessage("This request could not be completed right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <section className="mx-auto max-w-md border-y-2 border-foreground py-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-news-accent">
          {text.eyebrow}
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight">
          {text.title}
        </h1>
        <p className="mt-3 border-l-2 border-news-accent pl-3 text-sm leading-6 text-muted-foreground">
          {completed ? text.success : text.description}
        </p>

        {!completed ? (
          <form className="mt-8 space-y-4" onSubmit={submit}>
            {kind === "reset" ? (
              <>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  New password
                  <input
                    autoComplete="new-password"
                    className="mt-2 h-12 w-full border border-foreground bg-transparent px-3 text-base outline-none focus:border-news-accent focus:ring-1 focus:ring-news-accent"
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    value={password}
                  />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Confirm password
                  <input
                    autoComplete="new-password"
                    className="mt-2 h-12 w-full border border-foreground bg-transparent px-3 text-base outline-none focus:border-news-accent focus:ring-1 focus:ring-news-accent"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type="password"
                    value={confirmPassword}
                  />
                </label>
              </>
            ) : null}
            {message ? (
              <p className="text-sm text-red-600" role="alert">
                {message}
              </p>
            ) : null}
            <button
              className="h-12 w-full bg-news-accent px-4 text-sm font-bold text-white transition-colors hover:bg-news-accent/90 disabled:opacity-50"
              disabled={pending || !token}
              type="submit"
            >
              {pending ? "Working…" : text.action}
            </button>
          </form>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium">
          <Link
            className="underline decoration-news-accent underline-offset-4"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="underline decoration-news-accent underline-offset-4"
            href="/register"
          >
            Create an account
          </Link>
          <Link
            className="underline decoration-news-accent underline-offset-4"
            href="/news"
          >
            Browse Wahb
          </Link>
        </div>
      </section>
    </main>
  );
}
