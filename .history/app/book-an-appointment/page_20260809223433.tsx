


import {
  Suspense,
} from "react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import BookAnAppointmentClient from "./BookAnAppointmentClient";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
            Loading appointment booking...
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Initialising patient and healthcare provider information.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <LoadingFallback />
      }
    >
      <BookAnAppointmentClient />
    </Suspense>
  );
}