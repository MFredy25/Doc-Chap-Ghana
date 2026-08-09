import {
  Suspense,
} from "react";

import SearchClient from "./SearchClient";

function SearchFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7faf9] dark:bg-black">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-500" />

        <p className="mt-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          Loading healthcare search...
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <SearchFallback />
      }
    >
      <SearchClient />
    </Suspense>
  );
}