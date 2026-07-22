const bundleId = "com.salehspace.wahb";
const packageName = bundleId;

const applePrefixPattern = /^[A-Z0-9]{10}$/;
const androidFingerprintPattern = /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/;

export function appleAppAssociation(appIdPrefix: string | undefined) {
  const prefix = appIdPrefix?.trim().toUpperCase();
  if (!prefix || !applePrefixPattern.test(prefix)) {
    return null;
  }

  return {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${prefix}.${bundleId}`,
          paths: ["/content/*", "/verify-email", "/reset-password"],
        },
      ],
    },
  };
}

export function androidAssetLinks(certificates: string | undefined) {
  const fingerprints = certificates
    ?.split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  if (
    !fingerprints?.length ||
    fingerprints.some(
      (fingerprint) => !androidFingerprintPattern.test(fingerprint),
    )
  ) {
    return null;
  }

  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: [...new Set(fingerprints)],
      },
    },
  ];
}
