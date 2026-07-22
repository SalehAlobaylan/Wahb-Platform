import "server-only";

import { getIamBaseUrl } from "./server-config";

const recoveryTokenPattern = /^[A-Za-z0-9._~-]{16,512}$/;

export function isSafeRecoveryToken(value: unknown): value is string {
  return typeof value === "string" && recoveryTokenPattern.test(value);
}

export type RecoveryProxyResult =
  { ok: true } | { ok: false; status: 400 | 429 | 503; message: string };

/**
 * Proxies one-time recovery tokens only server-to-server. Upstream response
 * bodies are intentionally never returned or logged because they can reveal
 * account state or token lifecycle details.
 */
export async function forwardRecoveryRequest(
  path: "/auth/verify-email" | "/auth/reset-password",
  body: Record<string, string>,
): Promise<RecoveryProxyResult> {
  const iamUrl = getIamBaseUrl();
  if (!iamUrl) {
    return {
      ok: false,
      status: 503,
      message: "Recovery is unavailable right now.",
    };
  }
  try {
    const upstream = await fetch(`${iamUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (upstream.ok) return { ok: true };
    if (upstream.status === 429) {
      return {
        ok: false,
        status: 429,
        message: "Please wait before trying again.",
      };
    }
    if (upstream.status >= 500) {
      return {
        ok: false,
        status: 503,
        message: "Recovery is unavailable right now.",
      };
    }
    return {
      ok: false,
      status: 400,
      message: "This link is invalid or no longer available.",
    };
  } catch {
    return {
      ok: false,
      status: 503,
      message: "Recovery is unavailable right now.",
    };
  }
}
