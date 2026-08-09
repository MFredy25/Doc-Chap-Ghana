"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
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
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type PlanId =
  | "free"
  | "essential"
  | "professional"
  | "premium";

type BillingDuration =
  | 1
  | 3
  | 6
  | 12;

type BillingOption = {
  months: BillingDuration;
  label: string;
  shortLabel: string;
  discountPercent: number;
  badge?: string;
};

type SubscriptionPlan = {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  currency: "GHS";
  billingPeriod: "month";
  userLimit: number;
  badge?: string;
  icon: React.ElementType;
  iconClass: string;
  buttonClass: string;
  featured: boolean;
  features: string[];
};

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
    city?: string;
    region?: string;
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
  };

  subscription?: {
    planId?: string;
    plan?: string;
    planName?: string;
    status?: string;
    price?: number;
    currency?: string;
    billingPeriod?: string;
    userLimit?: number;
  };
};

type ClinicView = {
  name: string;
  city: string;
  verified: boolean;
  verificationStatus: string;
};

type CurrentSubscription = {
  planId: PlanId | null;
  status: string;
};

/* ============================================================
   PLANS
============================================================ */

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description:
      "A simple starting point for small clinics discovering Doc Chap Ghana.",
    price: 0,
    currency: "GHS",
    billingPeriod: "month",
    userLimit: 2,
    badge: "Start free",
    icon: Building2,
    iconClass:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    buttonClass:
      "border border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
    featured: false,
    features: [
      "Up to 2 users",
      "Clinic profile",
      "Basic patient directory",
      "Basic appointment management",
      "Basic clinic schedule",
      "Standard notifications",
      "Basic support",
    ],
  },
  {
    id: "essential",
    name: "Essential",
    description:
      "More capacity and practical tools for a clinic starting to organize daily operations.",
    price: 59,
    currency: "GHS",
    billingPeriod: "month",
    userLimit: 5,
    badge: "Best first upgrade",
    icon: Zap,
    iconClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    buttonClass:
      "bg-blue-600 text-white hover:bg-blue-500",
    featured: true,
    features: [
      "Everything in Free",
      "Up to 5 users",
      "Expanded patient management",
      "Clinic schedule & availability",
      "Healthcare team management",
      "Clinic messaging",
      "Appointment workflow",
      "Standard support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description:
      "Business and care-management tools for active clinics handling more consultations.",
    price: 129,
    currency: "GHS",
    billingPeriod: "month",
    userLimit: 10,
    badge: "Most popular",
    icon: WalletCards,
    iconClass:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    buttonClass:
      "bg-violet-600 text-white hover:bg-violet-500",
    featured: false,
    features: [
      "Everything in Essential",
      "Up to 10 users",
      "Teleconsultation management",
      "Financial dashboard",
      "Clinic statistics",
      "Insurance management",
      "Expanded messaging",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description:
      "The complete plan for larger clinics that need more users, insights and priority services.",
    price: 189,
    currency: "GHS",
    billingPeriod: "month",
    userLimit: 20,
    badge: "Maximum value",
    icon: Crown,
    iconClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    buttonClass:
      "bg-[#071b3a] text-white hover:bg-[#0b2f63] dark:bg-white dark:text-[#071b3a]",
    featured: false,
    features: [
      "Everything in Professional",
      "Up to 20 users",
      "Advanced clinic statistics",
      "Extended financial insights",
      "Priority clinic assistance",
      "Enhanced clinic visibility",
      "Priority feature access",
      "Premium support",
    ],
  },
];

const BILLING_OPTIONS: BillingOption[] = [
  {
    months: 1,
    label: "Monthly",
    shortLabel: "1 month",
    discountPercent: 0,
  },
  {
    months: 3,
    label: "3 months",
    shortLabel: "3 months",
    discountPercent: 1.5,
    badge: "Save 1.5%",
  },
  {
    months: 6,
    label: "6 months",
    shortLabel: "6 months",
    discountPercent: 3,
    badge: "Save 3%",
  },
  {
    months: 12,
    label: "12 months",
    shortLabel: "12 months",
    discountPercent: 5,
    badge: "Best value",
  },
];

/* ============================================================
   HELPERS
============================================================ */

function safeString(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function safeObject(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function mapClinic(
  raw: ClinicData | null
): ClinicView {
  const data =
    raw || {};

  const profile =
    safeObject(
      data.profile
    );

  const clinic =
    safeObject(
      data.clinic
    );

  const verificationStatus =
    safeString(
      clinic.verificationStatus
    ).toLowerCase() ||
    "pending";

  return {
    name:
      safeString(
        profile.clinicName
      ) ||
      safeString(
        profile.displayName
      ) ||
      safeString(
        profile.fullName
      ) ||
      "Clinic",

    city:
      safeString(
        profile.city
      ) ||
      safeString(
        profile.region
      ) ||
      "Ghana",

    verified:
      clinic.verified ===
        true ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",

    verificationStatus,
  };
}

function getCurrentSubscription(
  raw: ClinicData | null
): CurrentSubscription {
  const subscription =
    safeObject(
      raw?.subscription
    );

  const rawPlanId =
    safeString(
      subscription.planId ||
        subscription.plan
    ).toLowerCase();

  const planId:
    PlanId | null =
    rawPlanId ===
      "free" ||
    rawPlanId ===
      "essential" ||
    rawPlanId ===
      "professional" ||
    rawPlanId ===
      "premium"
      ? rawPlanId
      : null;

  return {
    planId,

    status:
      safeString(
        subscription.status
      ).toLowerCase() ||
      (
        planId
          ? "active"
          : "none"
      ),
  };
}

function formatPrice(
  price: number,
  currency: string
): string {
  if (
    price === 0
  ) {
    return "Free";
  }

  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(
      price
    );
  } catch {
    return `${price} ${currency}`;
  }
}


function getBillingOption(
  months: BillingDuration
): BillingOption {
  return (
    BILLING_OPTIONS.find(
      (
        option
      ) =>
        option.months ===
        months
    ) ||
    BILLING_OPTIONS[0]
  );
}

function getPlanPricing(
  monthlyPrice: number,
  months: BillingDuration
) {
  const option =
    getBillingOption(
      months
    );

  const regularTotal =
    monthlyPrice *
    months;

  if (
    monthlyPrice ===
    0
  ) {
    return {
      regularTotal: 0,
      total: 0,
      savings: 0,
      monthlyEquivalent: 0,
      discountPercent: 0,
    };
  }

  const discountAmount =
    regularTotal *
    (
      option.discountPercent /
      100
    );

  const total =
    regularTotal -
    discountAmount;

  return {
    regularTotal,
    total,
    savings:
      discountAmount,
    monthlyEquivalent:
      total /
      months,
    discountPercent:
      option.discountPercent,
  };
}

function userChipClass(
  planId: PlanId
): string {
  if (
    planId ===
    "free"
  ) {
    return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";
  }

  if (
    planId ===
    "essential"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300";
  }

  if (
    planId ===
    "professional"
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
}

/* ============================================================
   PAGE
============================================================ */

export default function SubscriptionsClient() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    uid,
    setUid,
  ] =
    useState<string | null>(
      null
    );

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

  const [
    selectedPlanCard,
    setSelectedPlanCard,
  ] =
    useState<PlanId | null>(
      null
    );

  const [
    billingDuration,
    setBillingDuration,
  ] =
    useState<BillingDuration>(
      1
    );

  /* ============================================================
     AUTH + REALTIME CLINIC
  ============================================================ */

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

      setLoading(
        false
      );

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
        (
          user
        ) => {
          unsubscribeClinic?.();
          unsubscribeClinic =
            null;

          if (
            !user?.uid
          ) {
            router.replace(
              "/clinics/login"
            );

            return;
          }

          setUid(
            user.uid
          );

          try {
            window.localStorage.setItem(
              "docchapghana:account-space",
              "clinic"
            );
          } catch {
            // Non-blocking.
          }

          unsubscribeClinic =
            onSnapshot(
              doc(
                firestoreInstance,
                "clinics",
                user.uid
              ),
              async (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {
                    // Non-blocking.
                  }

                  router.replace(
                    "/clinics/login"
                  );

                  return;
                }

                const data =
                  snapshot.data() as ClinicData;

                const clinic =
                  safeObject(
                    data.clinic
                  );

                const accountType =
                  safeString(
                    data.accountType ||
                      data.role ||
                      clinic.type
                  ).toLowerCase();

                if (
                  (
                    accountType &&
                    accountType !==
                      "clinic"
                  ) ||
                  data.active ===
                    false ||
                  safeString(
                    data.status
                  ).toLowerCase() ===
                    "disabled"
                ) {
                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {
                    // Non-blocking.
                  }

                  router.replace(
                    "/clinics/login"
                  );

                  return;
                }

                setClinicData(
                  data
                );

                setError(
                  null
                );

                setLoading(
                  false
                );
              },
              (
                realtimeError
              ) => {
                console.error(
                  "[ClinicSubscriptions] Realtime error:",
                  realtimeError
                );

                setError(
                  "Unable to load your clinic subscription."
                );

                setLoading(
                  false
                );
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();
      unsubscribeClinic?.();
    };
  }, [
    router,
  ]);

  /* ============================================================
     COMPUTED
  ============================================================ */

  const clinic =
    useMemo(
      () =>
        mapClinic(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const currentSubscription =
    useMemo(
      () =>
        getCurrentSubscription(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const currentPlan =
    SUBSCRIPTION_PLANS.find(
      (
        plan
      ) =>
        plan.id ===
        currentSubscription.planId
    ) ||
    null;

  /* ============================================================
     LOADING
  ============================================================ */

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center">
            <div className="rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Loading subscription plans...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <ClinicSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          {/* HERO */}

          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <Crown className="h-4 w-4 text-cyan-300" />

                      Subscriptions
                    </span>

                    {clinic.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified clinic
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <ShieldCheck className="h-4 w-4" />

                        Verification{" "}
                        {clinic.verificationStatus}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Choose your clinic plan
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Choose the Doc Chap Ghana subscription that best fits your clinic, healthcare team and patient activity.
                  </p>

                  <div className="mt-5 inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                    {clinic.name}
                    {" • "}
                    {clinic.city}
                  </div>
                </div>

                <Link
                  href="/clinics/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Dashboard

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* CONTENT */}

          <section className="px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {error}
              </div>
            )}

            {/* CURRENT PLAN */}

            <div className="mb-7 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    <WalletCards className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
                      Current subscription
                    </div>

                    <h2 className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
                      {currentPlan
                        ? currentPlan.name
                        : "No active plan"}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      {currentPlan
                        ? `Status: ${currentSubscription.status || "active"}`
                        : "Select one of the plans below to configure your clinic subscription."}
                    </p>
                  </div>
                </div>

                {currentPlan && (
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />

                    Selected plan
                  </span>
                )}
              </div>
            </div>

            {/* BILLING DURATION */}

            <section className="mb-7 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <WalletCards className="h-5 w-5 text-blue-600" />

                    <h2 className="text-base font-black text-zinc-950 dark:text-white">
                      Choose your billing period
                    </h2>
                  </div>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-500">
                    Commit for longer and get a progressive discount. The maximum discount is 5% for a 12-month subscription.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BILLING_OPTIONS.map(
                    (
                      option
                    ) => {
                      const selected =
                        billingDuration ===
                        option.months;

                      return (
                        <button
                          key={
                            option.months
                          }
                          type="button"
                          onClick={() =>
                            setBillingDuration(
                              option.months
                            )
                          }
                          className={`relative min-w-[118px] rounded-2xl border px-4 py-3 text-left transition ${
                            selected
                              ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/15"
                              : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-700"
                          }`}
                        >
                          <div className="text-xs font-black">
                            {option.label}
                          </div>

                          <div
                            className={`mt-1 text-[10px] font-semibold ${
                              selected
                                ? "text-blue-100"
                                : option.discountPercent >
                                  0
                                ? "text-emerald-600 dark:text-emerald-300"
                                : "text-zinc-400"
                            }`}
                          >
                            {option.discountPercent >
                            0
                              ? `Save ${option.discountPercent}%`
                              : "Standard price"}
                          </div>

                          {option.months ===
                            12 && (
                            <span
                              className={`absolute -right-2 -top-2 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${
                                selected
                                  ? "bg-amber-300 text-amber-950"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                            >
                              Best value
                            </span>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Selected period
                  </div>

                  <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                    {getBillingOption(
                      billingDuration
                    ).label}
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                    Discount
                  </div>

                  <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                    {getBillingOption(
                      billingDuration
                    ).discountPercent >
                    0
                      ? `${getBillingOption(
                          billingDuration
                        ).discountPercent}%`
                      : "No discount"}
                  </div>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/20">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                    Maximum saving
                  </div>

                  <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                    Up to 5%
                  </div>
                </div>
              </div>
            </section>

            {/* PLANS */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
              {SUBSCRIPTION_PLANS.map(
                (
                  plan
                ) => {
                  const PlanIcon =
                    plan.icon;

                  const isCurrentPlan =
                    currentSubscription.planId ===
                    plan.id;

                  const pricing =
                    getPlanPricing(
                      plan.price,
                      billingDuration
                    );

                  return (
                    <article
                      key={
                        plan.id
                      }
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() =>
                        setSelectedPlanCard(
                          plan.id
                        )
                      }
                      onMouseLeave={() =>
                        setSelectedPlanCard(
                          null
                        )
                      }
                      onFocus={() =>
                        setSelectedPlanCard(
                          plan.id
                        )
                      }
                      onBlur={() =>
                        setSelectedPlanCard(
                          null
                        )
                      }
                      onClick={() =>
                        router.push(
                          `/clinics/dashboard/subscriptions/${plan.id}?months=${billingDuration}`
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          router.push(
                            `/clinics/dashboard/subscriptions/${plan.id}?months=${billingDuration}`
                          );
                        }
                      }}
                      className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[30px] border bg-white p-5 shadow-sm transition-all duration-300 sm:p-6 dark:bg-zinc-950 ${
                        selectedPlanCard === plan.id
                          ? "border-blue-500 shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/10 -translate-y-1 dark:border-blue-500"
                          : isCurrentPlan
                          ? "border-blue-500 ring-2 ring-blue-500/10 dark:border-blue-500"
                          : plan.featured
                          ? "border-blue-300 dark:border-blue-800"
                          : "border-zinc-200 hover:shadow-lg dark:border-zinc-800"
                      }`}
                    >
                      {plan.badge && (
                        <div className="absolute right-4 top-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                              plan.featured
                                ? "bg-blue-600 text-white"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {plan.featured && (
                              <Star className="h-3 w-3 fill-current" />
                            )}

                            {plan.badge}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${plan.iconClass}`}
                      >
                        <PlanIcon className="h-6 w-6" />
                      </div>

                      <h2 className="mt-5 text-xl font-black text-zinc-950 dark:text-white">
                        {plan.name}
                      </h2>

                      <p className="mt-2 min-h-[44px] text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                        {plan.description}
                      </p>

                      <div className="mt-6 border-y border-zinc-100 py-5 dark:border-zinc-800">
                        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                          <span className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                            {plan.price ===
                            0
                              ? "Free"
                              : formatPrice(
                                  billingDuration ===
                                    1
                                    ? plan.price
                                    : pricing.total,
                                  plan.currency
                                )}
                          </span>

                          {plan.price >
                            0 && (
                            <span className="pb-1 text-xs font-semibold text-zinc-400">
                              {billingDuration ===
                              1
                                ? "/ month"
                                : `for ${billingDuration} months`}
                            </span>
                          )}
                        </div>

                        {plan.price ===
                        0 ? (
                          <p className="mt-1 text-[11px] text-zinc-400">
                            No subscription fee
                          </p>
                        ) : billingDuration ===
                          1 ? (
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Monthly clinic subscription
                          </p>
                        ) : (
                          <div className="mt-2 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] text-zinc-400 line-through">
                                {formatPrice(
                                  pricing.regularTotal,
                                  plan.currency
                                )}
                              </span>

                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                Save {pricing.discountPercent}%
                              </span>
                            </div>

                            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                              You save{" "}
                              {formatPrice(
                                pricing.savings,
                                plan.currency
                              )}
                            </p>

                            <p className="text-[11px] text-zinc-400">
                              Equivalent to{" "}
                              {formatPrice(
                                pricing.monthlyEquivalent,
                                plan.currency
                              )}{" "}
                              / month
                            </p>
                          </div>
                        )}

                        <div
                          className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${userChipClass(
                            plan.id
                          )}`}
                        >
                          <Users className="h-4 w-4" />

                          Up to {plan.userLimit} users
                        </div>
                      </div>

                      <div className="mt-5 flex-1">
                        <div className="text-xs font-black uppercase tracking-wide text-zinc-400">
                          Included
                        </div>

                        <div className="mt-4 space-y-3">
                          {plan.features.map(
                            (
                              feature
                            ) => (
                              <div
                                key={
                                  feature
                                }
                                className="flex items-start gap-2.5"
                              >
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                                  <Check className="h-3.5 w-3.5" />
                                </div>

                                <span className="text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                                  {feature}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          if (
                            isCurrentPlan
                          ) {
                            return;
                          }

                          router.push(
                            `/clinics/dashboard/subscriptions/${plan.id}?months=${billingDuration}`
                          );
                        }}
                        disabled={
                          isCurrentPlan
                        }
                        className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${plan.buttonClass}`}
                      >
                        {isCurrentPlan ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />

                            Current plan
                          </>
                        ) : (
                          <>
                            {plan.featured ? (
                              <Sparkles className="h-4 w-4" />
                            ) : (
                              <PlanIcon className="h-4 w-4" />
                            )}

                            View{" "}
                            {plan.name}{" "}
                            details
                          </>
                        )}
                      </button>
                    </article>
                  );
                }
              )}
            </div>

            {/* NOTE */}

            <div className="mt-7 rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" />

                <div>
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Secure subscription management
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Plan selection is recorded only on your clinic account. Free can be activated immediately. Paid plans support 1, 3, 6 or 12-month billing, with progressive discounts up to 5% for 12 months.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}