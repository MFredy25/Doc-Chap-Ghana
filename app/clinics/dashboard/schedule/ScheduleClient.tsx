"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Loader2,
  CalendarDays,
  Clock3,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";
import { auth, db } from "@/lib/firebase/client";


type ClinicProfileData = {
  uid?: string;
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;
  profile?: {
    clinicName?: string;
    displayName?: string;
    fullName?: string;
    city?: string;
  };
  clinic?: {
    type?: string;
  };
};

function safeString(value: unknown): string {
  return (value ?? "").toString().trim();
}

function safeObject(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }
  return {};
}



type ScheduleItem = {
  id: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  enabled?: boolean;
};


export default function ScheduleClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [clinicData, setClinicData] =
    useState<ClinicProfileData | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  const [items, setItems] =
    useState<ScheduleItem[]>([]);



  useEffect(() => {
    const firebaseAuth = auth;
    const firestore = db;

    if (!firebaseAuth || !firestore) {
      setError("Firebase is not initialized.");
      setLoading(false);
      return;
    }

    const firebaseAuthInstance = firebaseAuth;
    const firestoreInstance = firestore;

    let unsubscribeClinic: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      firebaseAuthInstance,
      (user) => {
        unsubscribeClinic?.();
        unsubscribeClinic = null;

        if (!user?.uid) {
          router.replace("/clinics/login");
          return;
        }

        setUid(user.uid);

        try {
          window.localStorage.setItem(
            "docchapghana:account-space",
            "clinic"
          );
        } catch {
          // Non-blocking.
        }

        const clinicRef = doc(
          firestoreInstance,
          "clinics",
          user.uid
        );

        unsubscribeClinic = onSnapshot(
          clinicRef,
          async (snapshot) => {
            if (!snapshot.exists()) {
              try {
                await signOut(firebaseAuthInstance);
              } catch {}

              router.replace("/clinics/login");
              return;
            }

            const data =
              snapshot.data() as ClinicProfileData;

            const clinic = safeObject(data.clinic);

            const accountType = safeString(
              data.accountType ||
                data.role ||
                clinic.type
            ).toLowerCase();

            if (
              accountType &&
              accountType !== "clinic"
            ) {
              try {
                await signOut(firebaseAuthInstance);
              } catch {}

              router.replace("/clinics/login");
              return;
            }

            if (
              data.active === false ||
              safeString(data.status).toLowerCase() === "disabled"
            ) {
              try {
                await signOut(firebaseAuthInstance);
              } catch {}

              router.replace("/clinics/login");
              return;
            }

            setClinicData(data);
            setError(null);
            setLoading(false);
          },
          (snapshotError) => {
            console.error(
              "[ClinicPage] Clinic realtime error:",
              snapshotError
            );
            setError("Unable to load your clinic account.");
            setLoading(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeClinic?.();
    };
  }, [router]);



  useEffect(() => {
    const firestore = db;
    if (!firestore || !uid) return;

    const firestoreInstance = firestore;
    const clinicUid = uid;

    return onSnapshot(
      collection(
        firestoreInstance,
        "clinics",
        clinicUid,
        "availability"
      ),
      (snapshot) => {
        setItems(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<ScheduleItem, "id">),
          }))
        );
      }
    );
  }, [uid]);


  const clinicName = useMemo(() => {
    const profile = safeObject(clinicData?.profile);
    return (
      safeString(profile.clinicName) ||
      safeString(profile.displayName) ||
      safeString(profile.fullName) ||
      "Clinic"
    );
  }, [clinicData]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
        <ClinicSidebar />
        <div className="lg:pl-72">
          <Header />
          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200/80 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading clinic workspace...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
      <ClinicSidebar />
      <div className="lg:pl-72">
        <Header />

        <main>
          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#071b3a] via-[#0b2f63] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
              <Link
                href="/clinics/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>

              <div className="mt-6 flex items-start gap-4">
                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex">
                  <Building2 className="h-7 w-7 text-cyan-200" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-100">
                    {clinicName}
                  </p>

                  <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                    Schedule
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Manage your clinic availability and opening times.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <AlertCircle className="mr-2 inline h-4 w-4" />
                {error}
              </div>
            )}

            
            <div className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    Weekly availability
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Availability currently stored for your clinic.
                  </p>
                </div>
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>

              {items.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                  <Clock3 className="mx-auto h-8 w-8 text-zinc-400" />
                  <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No clinic availability configured yet.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      <div className="text-sm font-black text-zinc-950 dark:text-white">
                        {item.day || item.id}
                      </div>
                      <div className="mt-2 text-sm text-zinc-500">
                        {item.startTime || "—"} - {item.endTime || "—"}
                      </div>
                      <div className="mt-3 text-xs font-semibold text-blue-600">
                        {item.enabled === false ? "Unavailable" : "Available"}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
