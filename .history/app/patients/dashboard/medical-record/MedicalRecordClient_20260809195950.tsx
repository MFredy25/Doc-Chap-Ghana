"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import {
  AlertCircle,
  CalendarDays,
  FileHeart,
  HeartPulse,
  Loader2,
  Pill,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserRound,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PatientsSidebar from "@/app/components/PatientsSidebar";
import { auth, db } from "@/lib/firebase/client";


type PatientData = {
  role?: string;
  accountType?: string;
  active?: boolean;
  status?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
  };
};

function s(value: unknown): string {
  return (value ?? "").toString().trim();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}


type MedicalRecord = {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  diagnosis?: string;
  doctorName?: string;
  clinicName?: string;
  date?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export default function MedicalRecordClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !db) {
      setError("Firebase is not initialized.");
      setLoading(false);
      return;
    }

    const firebaseAuth = auth;
    const firestore = db;
    let stopPatient: (() => void) | null = null;
    let stopRecords: (() => void) | null = null;

    const stopAll = () => {
      stopPatient?.();
      stopRecords?.();
      stopPatient = null;
      stopRecords = null;
    };

    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopAll();

      if (!user?.uid) {
        router.replace("/patients/login");
        return;
      }

      stopPatient = onSnapshot(
        doc(firestore, "patients", user.uid),
        async (snapshot) => {
          if (!snapshot.exists()) {
            stopAll();
            try { await signOut(firebaseAuth); } catch {}
            router.replace("/patients/login");
            return;
          }

          const data = snapshot.data() as PatientData;
          const accountType = s(data.accountType || data.role).toLowerCase();

          if ((accountType && accountType !== "patient") || data.active === false) {
            stopAll();
            try { await signOut(firebaseAuth); } catch {}
            router.replace("/patients/login");
            return;
          }

          setPatientData(data);
          setLoading(false);
        },
        (err) => {
          console.error("[PatientMedicalRecord] profile:", err);
          setError("Unable to load your patient profile.");
          setLoading(false);
        }
      );

      stopRecords = onSnapshot(
        collection(firestore, "patients", user.uid, "medicalRecords"),
        (snapshot) => {
          const rows = snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<MedicalRecord, "id">),
          }));

          rows.sort((a, b) => {
            const ad = toDate(a.updatedAt || a.createdAt || a.date)?.getTime() || 0;
            const bd = toDate(b.updatedAt || b.createdAt || b.date)?.getTime() || 0;
            return bd - ad;
          });

          setRecords(rows);
        },
        (err) => {
          console.error("[PatientMedicalRecord] records:", err);
        }
      );
    });

    return () => {
      stopAll();
      stopAuth();
    };
  }, [router]);

  const patientName = useMemo(() => {
    const profile = patientData?.profile;
    return (
      s(profile?.fullName) ||
      s(profile?.displayName) ||
      `${s(profile?.firstName)} ${s(profile?.lastName)}`.trim() ||
      "Patient"
    );
  }, [patientData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <PatientsSidebar />
        <div className="lg:pl-72">
          <Header />
          <main className="flex min-h-[75vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <PatientsSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          <section className="relative overflow-hidden border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                <FileHeart className="h-4 w-4" />
                Medical record
              </span>

              <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                Your medical record
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
                View the healthcare information and medical records saved in your patient account.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                <UserRound className="h-4 w-4" />
                {patientName}
              </div>
            </div>
          </section>

          <section className="px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle className="mr-2 inline h-4 w-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Medical entries", value: records.length, icon: FileHeart },
                { label: "Patient space", value: "Private", icon: ShieldCheck },
                { label: "Healthcare file", value: "Ghana", icon: HeartPulse },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                    <div className="mt-4 text-2xl font-black">{item.value}</div>
                    <div className="mt-1 text-xs font-bold text-emerald-50">{item.label}</div>
                  </div>
                );
              })}
            </div>

            <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                Medical history
              </h2>

              {records.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                  <FileHeart className="mx-auto h-9 w-9 text-zinc-400" />
                  <div className="mt-3 text-sm font-black text-zinc-800 dark:text-zinc-200">
                    No medical record available
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Medical information added to your patient file will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                          <FileHeart className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-black text-zinc-950 dark:text-white">
                            {s(record.title) || s(record.type) || "Medical record"}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {s(record.doctorName) || s(record.clinicName) || "Healthcare information"}
                          </div>
                          {(record.description || record.diagnosis) && (
                            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                              {s(record.description) || s(record.diagnosis)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}