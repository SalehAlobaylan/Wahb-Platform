import { NextResponse } from "next/server";

import {
  forwardRecoveryRequest,
  isSafeRecoveryToken,
} from "@/lib/auth/recovery-proxy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    !isSafeRecoveryToken(body.token) ||
    typeof body.new_password !== "string" ||
    body.new_password.length < 4 ||
    body.new_password.length > 256
  ) {
    return NextResponse.json(
      { message: "This link or password is invalid." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const result = await forwardRecoveryRequest("/auth/reset-password", {
    token: body.token,
    new_password: body.new_password,
  });
  return NextResponse.json(
    result.ok ? { success: true } : { message: result.message },
    {
      status: result.ok ? 200 : result.status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
