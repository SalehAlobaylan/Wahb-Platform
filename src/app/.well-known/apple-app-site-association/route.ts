import { NextResponse } from "next/server";

import { appleAppAssociation } from "@/lib/mobile-associations";

export function GET() {
  const association = appleAppAssociation(process.env.APPLE_APP_ID_PREFIX);
  if (!association) {
    // Never manufacture an Apple application identifier. A visible deployment
    // error is safer than sending device link traffic to an unrelated app.
    return NextResponse.json(
      { error: "Apple Universal Links are not configured." },
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
