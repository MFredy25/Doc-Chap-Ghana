import { Suspense } from "react";

import PaymentsClient from "./PaymentsClient";

function PaymentsFallback() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f6f8fc] px-4 dark:bg-black">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-800 dark:border-t-blue-500" />

        <p className="mt-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          Loading payment summary...
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PaymentsFallback />}>
      <PaymentsClient />
    </Suspense>
  );
}