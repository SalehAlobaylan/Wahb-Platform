import { androidAssetLinks, appleAppAssociation } from "./mobile-associations";

describe("mobile public association documents", () => {
  it("emits a narrow AASA claim only for a valid Apple team prefix", () => {
    expect(appleAppAssociation("abc123def4")).toEqual({
      applinks: {
        apps: [],
        details: [
          {
            appID: "ABC123DEF4.com.salehspace.wahb",
            paths: ["/content/*", "/verify-email", "/reset-password"],
          },
        ],
      },
    });
    expect(appleAppAssociation("not-a-team-id")).toBeNull();
  });

  it("emits Android App Links only for complete SHA-256 certificates", () => {
    const fingerprint = Array.from({ length: 32 }, () => "ab").join(":");
    expect(androidAssetLinks(`${fingerprint}, ${fingerprint}`)).toEqual([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.salehspace.wahb",
          sha256_cert_fingerprints: [fingerprint.toUpperCase()],
        },
      },
    ]);
    expect(androidAssetLinks("AB:CD")).toBeNull();
  });
});
