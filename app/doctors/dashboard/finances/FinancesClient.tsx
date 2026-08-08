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
  AlertCircle,
  BadgeCheck,
  CalendarCheck2,
  CreditCard,
  Loader2,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  WalletCards,
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

  const verificationStatus =
    safeString(professional.verificationStatus).toLowerCase() || "pending";

  return {
    name,
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

type FinanceItem = {
  id: string;
  patientName: string;
  startAt: Date | null;
  status: string;
  paid: boolean;
  amount: number;
  currency: string;
};

export default function FinancesClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [items, setItems] = useState<FinanceItem[]>([]);
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
        const mapped = snapshot.docs.map((appointmentDoc) => {
          const data = safeObject(appointmentDoc.data());
          const payment = safeObject(data.payment);
          const patient = safeObject(data.patientSummary);

          const paymentStatus = `${safeString(data.paymentStatus)} ${safeString(
            payment.status
          )}`.toLowerCase();

          const amount =
            numericValue(payment.netAmount) ||
            numericValue(payment.amount) ||
            numericValue(data.amount) ||
            numericValue(data.consultationFee);

          return {
            id: appointmentDoc.id,
            patientName:
              safeString(data.patientName) ||
              safeString(data.patientDisplayName) ||
              safeString(patient.displayName) ||
              safeString(patient.fullName) ||
              "Patient",
            startAt:
              toDate(data.startAt) ||
              toDate(data.appointmentDate) ||
              toDate(data.date),
            status: safeString(data.status) || "unknown",
            paid:
              ["paid", "success", "succeeded", "completed"].some((value) =>
                paymentStatus.includes(value)
              ) || Boolean(payment.paidAt),
            amount,
            currency:
              safeString(payment.currency).toUpperCase() ||
              safeString(data.currency).toUpperCase() ||
              "GHS",
          } satisfies FinanceItem;
        });

        setItems(mapped);
      },
      (financeError) => {
        console.error("[DoctorFinances] Realtime error:", financeError);
        setItems([]);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const doctor = useMemo(() => mapDoctor(doctorData || {}), [doctorData]);
  const paidItems = items.filter((item) => item.paid);
  const pendingItems = items.filter((item) => !item.paid);
  const totalRevenue = paidItems.reduce((total, item) => total + item.amount, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyRevenue = paidItems
    .filter((item) => item.startAt && item.startAt >= monthStart)
    .reduce((total, item) => total + item.amount, 0);

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
                      <WalletCards className="h-4 w-4 text-cyan-300" />
                      Finances
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
                    Financial overview
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Track consultation payments and revenue linked to your appointments.
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total revenue", formatMoney(totalRevenue, items[0]?.currency || "GHS"), WalletCards, "bg-blue-600"],
                ["This month", formatMoney(monthlyRevenue, items[0]?.currency || "GHS"), TrendingUp, "bg-emerald-600"],
                ["Paid", paidItems.length, CreditCard, "bg-violet-600"],
                ["Pending", pendingItems.length, ReceiptText, "bg-amber-500"],
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
                    <div className="mt-3 text-xl font-black text-zinc-950 dark:text-white">
                      {String(value)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{String(label)}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                Payment activity
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Latest payments derived from your appointment records.
              </p>

              {items.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
                  <ReceiptText className="mx-auto h-8 w-8 text-zinc-400" />
                  <div className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
                    No financial activity yet
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
                    >
                      <div>
                        <div className="text-sm font-black text-zinc-950 dark:text-white">
                          {item.patientName}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {item.startAt
                            ? new Intl.DateTimeFormat("en-GH", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }).format(item.startAt)
                            : "Date unavailable"}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                            item.paid
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.paid ? "Paid" : "Pending"}
                        </span>

                        <span className="text-sm font-black text-zinc-950 dark:text-white">
                          {item.amount > 0
                            ? formatMoney(item.amount, item.currency)
                            : "—"}
                        </span>
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