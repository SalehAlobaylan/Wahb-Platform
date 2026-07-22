import { NextResponse } from "next/server";

import { androidAssetLinks } from "@/lib/mobile-associations";

export function GET() {
  const association = androidAssetLinks(
    process.env.ANDROID_APP_LINK_CERT_SHA256,
  );
  if (!association) {
    // Signing fingerprints are public deployment identifiers, but they must be
    // exact. Do not publish a placeholder association statement.
    return NextResponse.json(
      { error: "Android App Links are not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(association, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/json",
    },
  });
}
