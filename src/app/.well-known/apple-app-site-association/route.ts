import { NextResponse } from 'next/server';

const bundleId = 'com.salehspace.wahb';

export function GET() {
  const appIdPrefix = process.env.APPLE_APP_ID_PREFIX?.trim();
  if (!appIdPrefix) {
    // Never manufacture an Apple application identifier. A visible deployment
    // error is safer than sending device link traffic to an unrelated app.
    return NextResponse.json(
      { error: 'Apple Universal Links are not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${appIdPrefix}.${bundleId}`,
            paths: ['/content/*', '/verify-email', '/reset-password'],
          },
        ],
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Content-Type': 'application/json',
      },
    },
  );
}
