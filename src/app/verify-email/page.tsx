import { Suspense } from "react";

import { RecoveryFallback } from "@/components/auth/recovery-fallback";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <RecoveryFallback kind="verify" />
    </Suspense>
  );
}
