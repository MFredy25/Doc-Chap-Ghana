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


export default function SettingsClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [clinicData, setClinicData] =
    useState<ClinicData | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    language: "en",
    locale: "en-GH",
    timezone: "Africa/Accra",
    currency: "GHS",
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
            console.error("[ClinicSettingsClient] Profile error:", snapshotError);
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
      doc(firestoreInstance, "clinics", clinicUid, "settings", "general"),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = o(snapshot.data());

        setForm((current) => ({
          language: s(data.language) || current.language,
          locale: s(data.locale) || current.locale,
          timezone: s(data.timezone) || current.timezone,
          currency: s(data.currency) || current.currency,
        }));
      }
    );
  }, [uid]);

  async function save() {
    const firestore = db;
    if (!firestore || !uid || saving) return;

    const firestoreInstance = firestore;
    const clinicUid = uid;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await setDoc(
        doc(firestoreInstance, "clinics", clinicUid, "settings", "general"),
        {
          ...form,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSuccess("Settings saved successfully.");
    } catch (saveError) {
      console.error("[ClinicSettingsClient] Save error:", saveError);
      setError("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }


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
                    Settings
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Manage general clinic workspace settings.
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


            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {Object.entries(form).map(([key, value]) => (
                  <label key={key} className="block">
                    <span className="text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-200">
                      {key}
                    </span>
                    <input
                      value={value}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save settings
              </button>
            </div>

          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
