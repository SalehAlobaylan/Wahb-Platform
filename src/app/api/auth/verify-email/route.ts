import { NextResponse } from "next/server";

import {
  forwardRecoveryRequest,
  isSafeRecoveryToken,
} from "@/lib/auth/recovery-proxy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !isSafeRecoveryToken(body.token)) {
    return NextResponse.json(
      { message: "This link is invalid or no longer available." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const result = await forwardRecoveryRequest("/auth/verify-email", {
    token: body.token,
  });
  return NextResponse.json(
    result.ok ? { success: true } : { message: result.message },
    {
      status: result.ok ? 200 : result.status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
