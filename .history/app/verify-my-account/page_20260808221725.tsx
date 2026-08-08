import { Suspense } from "react";

import VerifiyMyAccountClient from "./VerifiyMyAccountClient";

function LoadingVerificationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-4">
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 text-sm font-semibold text-zinc-700 shadow-sm">
        Loading account verification...
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingVerificationPage />}>
      <VerifiyMyAccountClient />
    </Suspense>
  );
}