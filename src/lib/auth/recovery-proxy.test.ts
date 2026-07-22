jest.mock("server-only", () => ({}));

import { isSafeRecoveryToken } from "./recovery-proxy";

describe("recovery proxy token boundary", () => {
  it("accepts opaque URL-safe recovery credentials without parsing their contents", () => {
    expect(isSafeRecoveryToken("5eaf29ba-7597-4a48-b77c-3ee7ff8f086c")).toBe(
      true,
    );
    expect(isSafeRecoveryToken("abcdefghijklmnop.qrstuvwxyz_123456")).toBe(
      true,
    );
  });

  it("rejects missing, short, and unsafe values before IAM is called", () => {
    expect(isSafeRecoveryToken("short")).toBe(false);
    expect(isSafeRecoveryToken("token with spaces")).toBe(false);
    expect(isSafeRecoveryToken("token?query=secret")).toBe(false);
    expect(isSafeRecoveryToken(null)).toBe(false);
  });
});
