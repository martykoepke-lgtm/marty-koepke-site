import { Suspense } from "react";
import { AuthCallbackClient } from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Suspense
        fallback={
          <div className="w-full max-w-sm border border-rule-strong bg-paper rounded-md p-6 text-sm text-charcoal">
            Completing password reset...
          </div>
        }
      >
        <AuthCallbackClient />
      </Suspense>
    </main>
  );
}
