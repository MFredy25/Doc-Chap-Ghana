"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  ReceiptText,
  TrendingUp,
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


type Payment = {
  id: string;
  amount?: number;
  amountCents?: number;
  currency?: string;
  status?: string;
  provider?: string;
  reference?: string;
  appointmentId?: string;
  consultationType?: string;
  doctorName?: string;
  clinicName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function paymentAmount(item: Payment): number {
  if (typeof item.amount === "number") return item.amount;
  if (typeof item.amountCents === "number") return item.amountCents / 100;
  return 0;
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: currency || "GHS",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || "GHS"}`;
  }
}

export default function FinancesClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
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
    let stopPayments: (() => void) | null = null;

    const stopAll = () => {
      stopPatient?.();
      stopPayments?.();
      stopPatient = null;
      stopPayments = null;
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

      stopPayments = onSnapshot(
        collection(firestore, "patients", user.uid, "payments"),
        (snapshot) => {
          const rows = snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Payment, "id">),
          }));

          rows.sort((a, b) => {
            const ad = toDate(a.updatedAt || a.createdAt)?.getTime() || 0;
            const bd = toDate(b.updatedAt || b.createdAt)?.getTime() || 0;
            return bd - ad;
          });

          setPayments(rows);
        },
        (err) => {
          console.error("[PatientFinances] payments:", err);
          setError("Unable to load your payment history.");
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

  const paidPayments = payments.filter((item) =>
    ["paid", "succeeded", "success", "completed"].includes(s(item.status).toLowerCase())
  );

  const totalPaid = paidPayments.reduce((total, item) => total + paymentAmount(item), 0);

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
                <CreditCard className="h-4 w-4" />
                Finances
              </span>

              <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                Your healthcare payments
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
                Review what you have paid for consultations and patient follow-up services.
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
              <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white">
                <CreditCard className="h-5 w-5" />
                <div className="mt-4 text-2xl font-black">{payments.length}</div>
                <div className="mt-1 text-xs font-bold text-emerald-50">Transactions</div>
              </div>

              <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white">
                <CheckCircle2 className="h-5 w-5" />
                <div className="mt-4 text-2xl font-black">{paidPayments.length}</div>
                <div className="mt-1 text-xs font-bold text-emerald-50">Paid</div>
              </div>

              <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white">
                <TrendingUp className="h-5 w-5" />
                <div className="mt-4 text-2xl font-black">{formatAmount(totalPaid, "GHS")}</div>
                <div className="mt-1 text-xs font-bold text-emerald-50">Total paid</div>
              </div>
            </div>

            <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                Payment history
              </h2>

              {payments.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                  <ReceiptText className="mx-auto h-9 w-9 text-zinc-400" />
                  <div className="mt-3 text-sm font-black text-zinc-800 dark:text-zinc-200">
                    No payment available
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Payments linked to your patient account will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {payments.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-black text-zinc-950 dark:text-white">
                            {s(item.doctorName) || s(item.clinicName) || s(item.consultationType) || "Healthcare payment"}
                          </div>

                          <div className="mt-1 text-xs text-zinc-500">
                            {s(item.reference) || item.id}
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <div className="text-sm font-black text-zinc-950 dark:text-white">
                            {formatAmount(paymentAmount(item), s(item.currency) || "GHS")}
                          </div>

                          <div className="mt-1 text-xs font-bold text-emerald-600">
                            {s(item.status) || "Pending"}
                          </div>
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