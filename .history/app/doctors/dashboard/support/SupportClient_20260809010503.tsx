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
  CheckCircle2,
  Headphones,
  HelpCircle,
  LifeBuoy,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
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

type SupportCategory =
  | "technical"
  | "account"
  | "appointments"
  | "payments"
  | "other";

export default function SupportClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<SupportCategory>("technical");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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

  const doctor = useMemo(() => mapDoctor(doctorData || {}), [doctorData]);

  async function sendTicket() {
    const firestore = db;

    if (!firestore || !uid || sending) return;

    if (!subject.trim() || !message.trim()) {
      setError("Enter a subject and a message before sending your request.");
      return;
    }

    setSending(true);
    setSent(false);
    setError(null);

    try {
      await addDoc(
        collection(firestore, "professionals", uid, "supportTickets"),
        {
          doctorId: uid,
          doctorName: doctor.name,
          category,
          subject: subject.trim(),
          message: message.trim(),
          status: "open",
          priority: "normal",
          application: "doc_chap_ghana",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      setSubject("");
      setMessage("");
      setSent(true);
    } catch (sendError) {
      console.error("[DoctorSupport] Send error:", sendError);
      setError("Unable to send your support request.");
    } finally {
      setSending(false);
    }
  }

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
                      <LifeBuoy className="h-4 w-4 text-cyan-300" />
                      Support
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
                    Doctor support
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Contact the Doc Chap Ghana support team for account, technical, appointment or payment assistance.
                  </p>

                  <div className="mt-5 inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                    {doctor.name} • {doctor.specialty}
                  </div>
                </div>

                <Link
                  href="/doctors/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Dashboard
                  <HelpCircle className="h-4 w-4" />
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

            {sent && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />
                Your support request has been sent.
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
              <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                  Submit a support request
                </h2>

                <div className="mt-5 space-y-5">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Category
                    </span>
                    <select
                      value={category}
                      onChange={(event) =>
                        setCategory(event.target.value as SupportCategory)
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    >
                      <option value="technical">Technical issue</option>
                      <option value="account">Account</option>
                      <option value="appointments">Appointments</option>
                      <option value="payments">Payments</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Subject
                    </span>
                    <input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="Briefly describe your request"
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Message
                    </span>
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={7}
                      placeholder="Explain what you need help with..."
                      className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void sendTicket()}
                    disabled={sending}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send request
                  </button>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <Headphones className="h-6 w-6 text-blue-700" />
                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Support center
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Your request is stored directly under your doctor account so the support team can follow the case.
                  </p>
                </div>

                <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <Mail className="h-6 w-6 text-violet-600" />
                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Before contacting support
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Include the appointment reference or payment reference when your request is related to a specific transaction.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}