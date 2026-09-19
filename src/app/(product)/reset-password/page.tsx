import { Suspense } from "react";

import { RecoveryFallback } from "@/components/auth/recovery-fallback";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <RecoveryFallback kind="reset" />
    </Suspense>
  );
}
