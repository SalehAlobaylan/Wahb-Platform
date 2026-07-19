import { NextResponse } from 'next/server';

const packageName = 'com.salehspace.wahb';

export function GET() {
  const fingerprints = process.env.ANDROID_APP_LINK_CERT_SHA256?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!fingerprints?.length) {
    // Signing fingerprints are public deployment identifiers, but they must be
    // exact. Do not publish a placeholder association statement.
    return NextResponse.json(
      { error: 'Android App Links are not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: packageName,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Content-Type': 'application/json',
      },
    },
  );
}
