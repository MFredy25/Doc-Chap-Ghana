"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CreditCard,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type ClinicData = {
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    clinicName?: string;
    displayName?: string;
    fullName?: string;
    city?: string;
    region?: string;
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
  };
};


type PlanId =
  | "essential"
  | "professional"
  | "premium";

type BillingDuration =
  | 1
  | 3
  | 6
  | 12;

type PaymentPlan = {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  currency: "GHS";
  userLimit: number;
  description: string;
};

const PLANS: Record<PlanId, PaymentPlan> = {
  essential: {
    id: "essential",
    name: "Essential",
    monthlyPrice: 59,
    currency: "GHS",
    userLimit: 5,
    description:
      "Practical tools for growing clinic operations.",
  },
  professional: {
    id: "professional",
    name: "Professional",
    monthlyPrice: 129,
    currency: "GHS",
    userLimit: 10,
    description:
      "Business and care-management tools for active clinics.",
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthlyPrice: 189,
    currency: "GHS",
    userLimit: 20,
    description:
      "Advanced tools, insights and priority services.",
  },
};

function s(value: unknown): string {
  return (value ?? "").toString().trim();
}

function o(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function isPlanId(
  value: string
): value is PlanId {
  return (
    value === "essential" ||
    value === "professional" ||
    value === "premium"
  );
}

function parseMonths(
  value: string | null
): BillingDuration {
  const parsed = Number(value);

  if (
    parsed === 3 ||
    parsed === 6 ||
    parsed === 12
  ) {
    return parsed;
  }

  return 1;
}

function getDiscount(
  months: BillingDuration
): number {
  if (months === 3) return 1.5;
  if (months === 6) return 3;
  if (months === 12) return 5;
  return 0;
}

function pricing(
  monthlyPrice: number,
  months: BillingDuration
) {
  const regularTotal =
    monthlyPrice * months;

  const discountPercent =
    getDiscount(months);

  const discountAmount =
    regularTotal *
    (discountPercent / 100);

  const total =
    regularTotal -
    discountAmount;

  return {
    regularTotal,
    discountPercent,
    discountAmount,
    total,
    monthlyEquivalent:
      total / months,
  };
}

function money(
  amount: number,
  currency = "GHS"
): string {
  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  } catch {
    return `${amount.toLocaleString("en-GH")} ${currency}`;
  }
}


export default function PaymentsClient() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    clinicData,
    setClinicData,
  ] =
    useState<ClinicData | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const rawPlan =
    s(
      searchParams.get("plan")
    ).toLowerCase();

  const months =
    parseMonths(
      searchParams.get("months")
    );

  const plan =
    isPlanId(rawPlan)
      ? PLANS[rawPlan]
      : null;

  const price =
    plan
      ? pricing(
          plan.monthlyPrice,
          months
        )
      : null;

  useEffect(() => {
    const firebaseAuth =
      auth;

    const firestore =
      db;

    if (
      !firebaseAuth ||
      !firestore
    ) {
      setError(
        "Firebase is not initialized."
      );
      setLoading(false);
      return;
    }

    const firebaseAuthInstance =
      firebaseAuth;

    const firestoreInstance =
      firestore;

    let unsubscribeClinic:
      | (() => void)
      | null =
      null;

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuthInstance,
        (user) => {
          unsubscribeClinic?.();
          unsubscribeClinic = null;

          if (!user?.uid) {
            router.replace(
              "/clinics/login"
            );
            return;
          }

          unsubscribeClinic =
            onSnapshot(
              doc(
                firestoreInstance,
                "clinics",
                user.uid
              ),
              async (snapshot) => {
                if (!snapshot.exists()) {
                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {}

                  router.replace(
                    "/clinics/login"
                  );
                  return;
                }

                const data =
                  snapshot.data() as ClinicData;

                const clinic =
                  o(data.clinic);

                const accountType =
                  s(
                    data.accountType ||
                      data.role ||
                      clinic.type
                  ).toLowerCase();

                if (
                  (
                    accountType &&
                    accountType !== "clinic"
                  ) ||
                  data.active === false ||
                  s(data.status).toLowerCase() ===
                    "disabled"
                ) {
                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {}

                  router.replace(
                    "/clinics/login"
                  );
                  return;
                }

                setClinicData(data);
                setLoading(false);
              },
              (realtimeError) => {
                console.error(
                  "[ClinicSubscriptionPayments] Clinic error:",
                  realtimeError
                );
                setError(
                  "Unable to load your clinic account."
                );
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

  const clinic =
    useMemo(() => {
      const profile =
        o(clinicData?.profile);

      const clinicInfo =
        o(clinicData?.clinic);

      const verificationStatus =
        s(
          clinicInfo.verificationStatus
        ).toLowerCase();

      return {
        name:
          s(profile.clinicName) ||
          s(profile.displayName) ||
          s(profile.fullName) ||
          "Clinic",

        city:
          s(profile.city) ||
          s(profile.region) ||
          "Ghana",

        verified:
          clinicInfo.verified === true ||
          verificationStatus === "verified" ||
          verificationStatus === "approved",
      };
    }, [clinicData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </main>
        </div>
      </div>
    );
  }

  if (
    !plan ||
    !price
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-7 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <AlertCircle className="mx-auto h-9 w-9 text-red-500" />

              <h1 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                Invalid subscription
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Select a paid clinic plan before continuing.
              </p>

              <Link
                href="/clinics/dashboard/subscriptions"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to plans
              </Link>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    );
  }

  const checkoutQuery =
    new URLSearchParams();

  checkoutQuery.set(
    "plan",
    plan.id
  );

  checkoutQuery.set(
    "months",
    String(months)
  );

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <ClinicSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <Link
                href={`/clinics/dashboard/subscriptions/${plan.id}?months=${months}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                Plan details
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  <ReceiptText className="h-4 w-4 text-cyan-200" />

                  Payment summary
                </span>

                {clinic.verified && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                    <BadgeCheck className="h-4 w-4" />

                    Verified clinic
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                Review your subscription
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                Review your plan, billing period and discount before checkout.
              </p>
            </div>
          </section>

          <section className="px-4 py-7 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-5">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Sparkles className="h-6 w-6" />
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Selected plan
                      </div>

                      <h2 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
                        {plan.name}
                      </h2>

                      <p className="mt-2 text-sm text-zinc-500">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div className="mt-3 text-sm font-black dark:text-white">
                        Up to {plan.userLimit} users
                      </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                      <CalendarDays className="h-5 w-5 text-violet-600" />
                      <div className="mt-3 text-sm font-black dark:text-white">
                        {months === 1 ? "Monthly" : `${months} months`}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                      <WalletCards className="h-5 w-5 text-emerald-600" />
                      <div className="mt-3 text-sm font-black dark:text-white">
                        {money(plan.monthlyPrice)} / month
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    Billing details
                  </h2>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                      <span className="text-sm text-zinc-500">
                        {plan.name} × {months} month{months === 1 ? "" : "s"}
                      </span>

                      <span className="text-sm font-black dark:text-white">
                        {money(price.regularTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                      <span className="text-sm text-zinc-500">
                        Discount
                      </span>

                      <span className="text-sm font-black text-emerald-600">
                        {price.discountPercent > 0
                          ? `-${price.discountPercent}%`
                          : "No discount"}
                      </span>
                    </div>

                    {price.discountAmount > 0 && (
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                        <span className="text-sm text-zinc-500">
                          You save
                        </span>

                        <span className="text-sm font-black text-emerald-600">
                          -{money(price.discountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-end justify-between pt-2">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                          Total to pay
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          {months > 1
                            ? `${money(price.monthlyEquivalent)} / month equivalent`
                            : "Monthly subscription"}
                        </div>
                      </div>

                      <div className="text-3xl font-black dark:text-white">
                        {money(price.total)}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <Building2 className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-3 text-sm font-black dark:text-white">
                    {clinic.name}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    {clinic.city}
                  </p>
                </section>

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black dark:text-white">
                    Secure checkout
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Continue to enter the billing contact and payment method.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/clinics/dashboard/subscriptions/payments/checkout?${checkoutQuery.toString()}`
                      )
                    }
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-500"
                  >
                    <CreditCard className="h-4 w-4" />

                    Pay now
                  </button>
                </section>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}