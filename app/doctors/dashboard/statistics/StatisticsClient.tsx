"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";

import { auth, db } from "@/lib/firebase/client";

import {
  Activity,
  AlertCircle,
  BadgeCheck,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  UserRound,
  Video,
} from "lucide-react";

function safeString(value: unknown): string {
  return (value ?? "").toString().trim();
}

function safeObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in (value as any) &&
    typeof (value as any).toDate === "function"
  ) {
    try {
      return (value as any).toDate();
    } catch {
      return null;
    }
  }

  return null;
}

function numericValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.,-]/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatMoney(amount: number, currency = "GHS"): string {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: safeString(currency).toUpperCase() || "GHS",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || "GHS"}`;
  }
}

function mapDoctor(raw: unknown) {
  const data = safeObject(raw);
  const profile = safeObject(data.profile);
  const professional = safeObject(data.professional);

  const firstName = safeString(profile.firstName);
  const name =
    safeString(profile.displayName) ||
    safeString(profile.fullName) ||
    `${firstName} ${safeString(profile.lastName)}`.trim() ||
    "Doctor";
  const titledName =
    name === "Doctor"
      ? name
      : `Dr. ${name.replace(/^dr\.?\s+/i, "")}`;

  const verificationStatus =
    safeString(professional.verificationStatus).toLowerCase() || "pending";

  return {
    name: titledName,
    firstName: firstName || name.split(" ")[0] || "Doctor",
    specialty:
      safeString(professional.specialty) ||
      safeString(profile.specialty) ||
      "Medical professional",
    city: safeString(profile.city) || safeString(profile.region) || "Ghana",
    verified:
      professional.verified === true ||
      verificationStatus === "verified" ||
      verificationStatus === "approved",
    verificationStatus,
  };
}

type StatAppointment = {
  id: string;
  startAt: Date | null;
  status: string;
  mode: "in_person" | "video" | "phone";
  paid: boolean;
  amount: number;
};

function appointmentMode(data: Record<string, any>): "in_person" | "video" | "phone" {
  const raw = `${safeString(data.appointmentType)} ${safeString(data.type)} ${safeString(
    data.mode
  )}`.toLowerCase();

  if (raw.includes("phone") || raw.includes("call")) return "phone";
  if (raw.includes("tele") || raw.includes("video") || raw.includes("visio")) return "video";
  return "in_person";
}

export default function StatisticsClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [items, setItems] = useState<StatAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);

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

    const unsubscribe = onAuthStateChanged(firebaseAuthInstance, async (user) => {
      if (!user?.uid) {
        router.replace("/doctors/login");
        return;
      }

      try {
        const snapshot = await getDoc(
          doc(firestoreInstance, "professionals", user.uid)
        );

        if (!snapshot.exists()) {
          await signOut(firebaseAuthInstance);
          router.replace("/doctors/login");
          return;
        }

        const data = snapshot.data();
        const professional = safeObject(data.professional);
        const professionalType = safeString(
          data.professionalType || professional.type || data.role
        ).toLowerCase();

        if (
          (professionalType && professionalType !== "doctor") ||
          data.active === false
        ) {
          await signOut(firebaseAuthInstance);
          router.replace("/doctors/login");
          return;
        }

        setUid(user.uid);
        setDoctorData(data);
        setError(null);
      } catch (authError) {
        console.error("[DoctorPage] Auth error:", authError);
        setError("Unable to verify your doctor account.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !uid) return;

    const unsubscribe = onSnapshot(
      doc(firestore, "professionals", uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setDoctorData(snapshot.data());
        }
      }
    );

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !uid) return;

    const appointmentsQuery = query(
      collection(firestore, "professionals", uid, "appointments"),
      orderBy("startAt", "desc")
    );

    const unsubscribe = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        setItems(
          snapshot.docs.map((appointmentDoc) => {
            const data = safeObject(appointmentDoc.data());
            const payment = safeObject(data.payment);
            const paymentStatus = `${safeString(data.paymentStatus)} ${safeString(
              payment.status
            )}`.toLowerCase();

            return {
              id: appointmentDoc.id,
              startAt:
                toDate(data.startAt) ||
                toDate(data.appointmentDate) ||
                toDate(data.date),
              status: safeString(data.status).toLowerCase(),
              mode: appointmentMode(data),
              paid:
                ["paid", "success", "succeeded", "completed"].some((value) =>
                  paymentStatus.includes(value)
                ) || Boolean(payment.paidAt),
              amount:
                numericValue(payment.netAmount) ||
                numericValue(payment.amount) ||
                numericValue(data.amount) ||
                numericValue(data.consultationFee),
            };
          })
        );
      },
      (statisticsError) => {
        console.error("[DoctorStatistics] Realtime error:", statisticsError);
        setItems([]);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const doctor = useMemo(() => mapDoctor(doctorData || {}), [doctorData]);

  const completed = items.filter((item) =>
    ["completed", "complete", "finished", "done"].includes(item.status)
  ).length;

  const cancelled = items.filter((item) =>
    ["cancelled", "canceled"].includes(item.status)
  ).length;

  const inPerson = items.filter((item) => item.mode === "in_person").length;
  const video = items.filter((item) => item.mode === "video").length;
  const phone = items.filter((item) => item.mode === "phone").length;

  const totalRevenue = items
    .filter((item) => item.paid)
    .reduce((total, item) => total + item.amount, 0);

  const completionRate =
    items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <DoctorSidebar />
        <div className="lg:pl-72">
          <Header />
          <main className="flex min-h-[75vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <DoctorSidebar />
      <div className="lg:pl-72">
        <Header />
        <main>

          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <BarChart3 className="h-4 w-4 text-cyan-300" />
                      Statistics
                    </span>

                    {doctor.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />
                        Verified doctor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <ShieldCheck className="h-4 w-4" />
                        Verification {doctor.verificationStatus}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Professional statistics
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Review your appointment activity, consultation modes and overall performance.
                  </p>

                  <div className="mt-5 inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                    {doctor.name} • {doctor.specialty}
                  </div>
                </div>

                <Link
                  href="/doctors/dashboard/appointments"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Appointments
                  <CalendarCheck2 className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <section className="px-4 py-7 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle className="mr-2 inline h-4 w-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                ["Appointments", items.length, CalendarCheck2, "bg-blue-600"],
                ["Completed", completed, CheckCircle2, "bg-emerald-600"],
                ["Completion rate", `${completionRate}%`, TrendingUp, "bg-violet-600"],
                ["Cancelled", cancelled, Activity, "bg-red-500"],
              ].map(([label, value, Icon, iconClass]) => {
                const CardIcon = Icon as React.ElementType;

                return (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                      <CardIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                      {String(value)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{String(label)}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                  Consultation modes
                </h2>

                <div className="mt-5 space-y-4">
                  {[
                    ["In person", inPerson, UserRound, "bg-cyan-100 text-cyan-700"],
                    ["Video", video, Video, "bg-violet-100 text-violet-700"],
                    ["Phone", phone, Smartphone, "bg-emerald-100 text-emerald-700"],
                  ].map(([label, value, Icon, iconClass]) => {
                    const ModeIcon = Icon as React.ElementType;

                    return (
                      <div
                        key={String(label)}
                        className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                          <ModeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                          {String(label)}
                        </div>
                        <div className="text-xl font-black text-zinc-950 dark:text-white">
                          {String(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <TrendingUp className="h-7 w-7 text-emerald-700" />
                <h2 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                  Revenue overview
                </h2>
                <div className="mt-3 text-3xl font-black text-emerald-700 dark:text-emerald-300">
                  {formatMoney(totalRevenue, "GHS")}
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Total revenue from paid appointments currently available in your doctor records.
                </p>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
