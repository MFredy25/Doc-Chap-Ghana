"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";
import { auth, db } from "@/lib/firebase/client";


type ClinicData = {
  uid?: string;
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;
  profile?: {
    clinicName?: string;
    displayName?: string;
    fullName?: string;
  };
  clinic?: {
    type?: string;
  };
};

function s(value: unknown): string {
  return (value ?? "").toString().trim();
}

function o(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}


export default function StatisticsClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [clinicData, setClinicData] =
    useState<ClinicData | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] =
    useState<string | null>(null);

  const [counts, setCounts] = useState({
    appointments: 0,
    patients: 0,
    team: 0,
    messages: 0,
  });


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

            const data = snapshot.data() as ClinicData;
            const clinic = o(data.clinic);

            const accountType = s(
              data.accountType ||
              data.role ||
              clinic.type
            ).toLowerCase();

            if (
              (accountType && accountType !== "clinic") ||
              data.active === false ||
              s(data.status).toLowerCase() === "disabled"
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
            console.error("[ClinicStatisticsClient] Profile error:", snapshotError);
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
    const cleanups: Array<() => void> = [];

    ([
      ["appointments", "appointments"],
      ["patients", "patients"],
      ["team", "team"],
      ["messages", "messages"],
    ] as const).forEach(([collectionName, key]) => {
      cleanups.push(
        onSnapshot(
          collection(firestoreInstance, "clinics", clinicUid, collectionName),
          (snapshot) => {
            setCounts((current) => ({
              ...current,
              [key]: snapshot.size,
            }));
          }
        )
      );
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [uid]);


  const clinicName = useMemo(() => {
    const profile = o(clinicData?.profile);

    return (
      s(profile.clinicName) ||
      s(profile.displayName) ||
      s(profile.fullName) ||
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
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
              <Link
                href="/clinics/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>

              <div className="mt-6 flex items-start gap-4">
                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex">
                  <Building2 className="h-7 w-7 text-cyan-200" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-100">
                    {clinicName}
                  </p>

                  <h1 className="mt-1 text-3xl font-black sm:text-4xl lg:text-5xl">
                    Statistics
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Review key clinic activity indicators.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle className="mr-2 inline h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />
                {success}
              </div>
            )}


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Object.entries(counts).map(([key, value]) => (
                <article
                  key={key}
                  className="rounded-[24px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="text-4xl font-black text-zinc-950 dark:text-white">
                    {value}
                  </div>
                  <div className="mt-2 capitalize text-sm font-semibold text-zinc-500">
                    {key}
                  </div>
                </article>
              ))}
            </div>

          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
