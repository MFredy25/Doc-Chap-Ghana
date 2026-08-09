"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Loader2,
  Stethoscope,
  UserRound,
  Video,
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


type Appointment = {
  id: string;
  doctorName?: string;
  clinicName?: string;
  specialty?: string;
  status?: string;
  appointmentType?: string;
  mode?: string;
  consultationType?: string;
  startAt?: unknown;
  date?: string;
  startTime?: string;
  meetingLink?: string;
  videoUrl?: string;
  dailyUrl?: string;
};

function isTeleconsultation(item: Appointment): boolean {
  const mode = s(
    item.mode ||
    item.appointmentType ||
    item.consultationType
  ).toLowerCase();

  return mode.includes("tele") || mode.includes("video");
}

function appointmentDate(item: Appointment): Date | null {
  const fromStart = toDate(item.startAt);
  if (fromStart) return fromStart;

  if (item.date) {
    const raw = item.startTime ? `${item.date}T${item.startTime}` : item.date;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function formatDate(item: Appointment): string {
  const date = appointmentDate(item);
  if (!date) return [item.date, item.startTime].filter(Boolean).join(" • ") || "Date not available";

  return new Intl.DateTimeFormat("en-GH", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function TeleconsultationClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
    let stopAppointments: (() => void) | null = null;

    const stopAll = () => {
      stopPatient?.();
      stopAppointments?.();
      stopPatient = null;
      stopAppointments = null;
    };

    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopAll();

      if (!user?.uid) {
        router.replace("/patients/login");
        return;
      }

      stopPatient = onSnapshot(doc(firestore, "patients", user.uid), async (snapshot) => {
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
      });

      stopAppointments = onSnapshot(
        collection(firestore, "patients", user.uid, "appointments"),
        (snapshot) => {
          const rows = snapshot.docs
            .map((item) => ({
              id: item.id,
              ...(item.data() as Omit<Appointment, "id">),
            }))
            .filter(isTeleconsultation);

          rows.sort((a, b) => {
            const ad = appointmentDate(a)?.getTime() || 0;
            const bd = appointmentDate(b)?.getTime() || 0;
            return bd - ad;
          });

          setAppointments(rows);
        },
        (err) => {
          console.error("[PatientTeleconsultation] appointments:", err);
          setError("Unable to load your teleconsultations.");
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
                <Video className="h-4 w-4" />
                Teleconsultation
              </span>

              <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                Your teleconsultations
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
                Access only the appointments scheduled as online or video consultations.
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white">
                <Video className="h-5 w-5" />
                <div className="mt-4 text-2xl font-black">{appointments.length}</div>
                <div className="mt-1 text-xs font-bold text-emerald-50">Teleconsultations</div>
              </div>

              <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white">
                <CalendarDays className="h-5 w-5" />
                <div className="mt-4 text-2xl font-black">
                  {appointments.filter((item) => {
                    const date = appointmentDate(item);
                    return date ? date.getTime() >= Date.now() : true;
                  }).length}
                </div>
                <div className="mt-1 text-xs font-bold text-emerald-50">Upcoming</div>
              </div>
            </div>

            <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                Teleconsultation appointments
              </h2>

              {appointments.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                  <Video className="mx-auto h-9 w-9 text-zinc-400" />
                  <div className="mt-3 text-sm font-black text-zinc-800 dark:text-zinc-200">
                    No teleconsultation
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {appointments.map((item) => {
                    const meetingLink = s(item.meetingLink) || s(item.videoUrl) || s(item.dailyUrl);

                    return (
                      <Link
                        key={item.id}
                        href={`/patients/dashboard/appointments/${encodeURIComponent(item.id)}`}
                        className="group block rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-sky-300 hover:bg-sky-50/50 dark:border-zinc-800 dark:bg-zinc-900/50"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                              <Video className="h-5 w-5" />
                            </div>

                            <div>
                              <div className="text-sm font-black text-zinc-950 dark:text-white">
                                {s(item.doctorName) || s(item.clinicName) || "Teleconsultation"}
                              </div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {s(item.specialty) || "Online consultation"}
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                                <Clock3 className="h-4 w-4" />
                                {formatDate(item)}
                              </div>
                            </div>
                          </div>

                          <span className="text-xs font-black text-sky-700">
                            View appointment
                          </span>
                        </div>
                      </Link>
                    );
                  })}
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