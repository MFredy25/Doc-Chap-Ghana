"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Crown,
  Headphones,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Video,
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
  | "essential"
  | "professional"
  | "premium";

type PlanFeatureGroup = {
  title: string;
  description: string;
  icon: React.ElementType;
  items: string[];
};

type SubscriptionPlan = {
  id: PlanId;
  name: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  currency: "GHS";
  billingPeriod: "month";
  badge?: string;
  icon: React.ElementType;
  iconClass: string;
  featured: boolean;
  highlights: string[];
  featureGroups: PlanFeatureGroup[];
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

const PLANS: Record<
  PlanId,
  SubscriptionPlan
> = {
  essential: {
    id: "essential",
    name: "Essential",
    shortDescription:
      "The essentials to manage your clinic activity on Doc Chap Ghana.",
    longDescription:
      "Essential gives your clinic the core tools needed to manage its profile, patients, appointments, schedule and basic healthcare team activity from one secure workspace.",
    price: 0,
    currency: "GHS",
    billingPeriod: "month",
    icon: Building2,
    iconClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    featured: false,
    highlights: [
      "Clinic profile",
      "Patient directory",
      "Appointment management",
      "Clinic schedule",
      "Basic healthcare team management",
      "Basic notifications",
      "Basic support",
    ],
    featureGroups: [
      {
        title: "Clinic workspace",
        description:
          "Core tools for running your clinic account.",
        icon: Building2,
        items: [
          "Clinic profile management",
          "Clinic information and settings",
          "Clinic schedule",
          "Availability overview",
        ],
      },
      {
        title: "Appointments & patients",
        description:
          "Manage clinic patients and appointments in one place.",
        icon: CalendarCheck2,
        items: [
          "Appointment list",
          "Daily clinic schedule",
          "Patient directory",
          "Appointment status tracking",
        ],
      },
      {
        title: "Healthcare team",
        description:
          "Keep the basic clinic team organized.",
        icon: Users,
        items: [
          "Healthcare team directory",
          "Doctor and staff records",
          "Basic team information",
          "Basic account notifications",
        ],
      },
      {
        title: "Support",
        description:
          "Access standard assistance for your clinic account.",
        icon: ShieldCheck,
        items: [
          "Basic support access",
          "Account settings",
          "Secure clinic workspace",
        ],
      },
    ],
  },

  professional: {
    id: "professional",
    name: "Professional",
    shortDescription:
      "A complete plan for clinics managing patients, teams and consultations every day.",
    longDescription:
      "Professional adds teleconsultation, messaging, financial visibility, statistics, insurance tools and expanded team management for clinics using Doc Chap Ghana for daily healthcare operations.",
    price: 99,
    currency: "GHS",
    billingPeriod: "month",
    badge: "Most popular",
    icon: Zap,
    iconClass:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    featured: true,
    highlights: [
      "Everything in Essential",
      "Teleconsultation management",
      "Clinic messaging",
      "Financial dashboard",
      "Clinic statistics",
      "Insurance management",
      "Expanded team tools",
      "Priority support",
    ],
    featureGroups: [
      {
        title: "Remote care",
        description:
          "Manage remote consultations from the clinic workspace.",
        icon: Video,
        items: [
          "Video teleconsultation",
          "Remote appointment overview",
          "Meeting-link access",
          "Teleconsultation activity tracking",
        ],
      },
      {
        title: "Clinic communication",
        description:
          "Communicate with doctors, patients and support.",
        icon: MessageCircle,
        items: [
          "Clinic-to-doctor messaging",
          "Clinic-to-patient messaging",
          "Support messaging",
          "Conversation history",
        ],
      },
      {
        title: "Business management",
        description:
          "Follow the operational side of your clinic.",
        icon: WalletCards,
        items: [
          "Financial dashboard",
          "Paid consultation tracking",
          "Clinic statistics",
          "Insurance partner management",
        ],
      },
      {
        title: "Healthcare team",
        description:
          "Manage a larger healthcare team from one workspace.",
        icon: Users,
        items: [
          "Expanded team management",
          "Doctor and staff organization",
          "Patient-linked clinic activity",
          "Priority support",
        ],
      },
    ],
  },

  premium: {
    id: "premium",
    name: "Premium",
    shortDescription:
      "Advanced tools and priority services for clinics with higher activity and larger teams.",
    longDescription:
      "Premium is designed for clinics that need the complete Doc Chap Ghana experience with deeper business insights, advanced statistics, enhanced clinic visibility and the highest level of support priority.",
    price: 199,
    currency: "GHS",
    billingPeriod: "month",
    badge: "Advanced",
    icon: Crown,
    iconClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    featured: false,
    highlights: [
      "Everything in Professional",
      "Advanced clinic statistics",
      "Extended financial insights",
      "Priority clinic assistance",
      "Enhanced clinic visibility",
      "Priority feature access",
      "Premium support",
    ],
    featureGroups: [
      {
        title: "Everything in Professional",
        description:
          "All core, remote-care, messaging and clinic-management capabilities.",
        icon: Sparkles,
        items: [
          "All Essential features",
          "Teleconsultation",
          "Clinic messaging",
          "Finances and insurance",
          "Expanded healthcare team tools",
        ],
      },
      {
        title: "Advanced insights",
        description:
          "A deeper view of your clinic activity and performance.",
        icon: TrendingUp,
        items: [
          "Advanced clinic statistics",
          "Extended financial insights",
          "Enhanced activity indicators",
          "Priority access to future analytics",
        ],
      },
      {
        title: "Clinic visibility",
        description:
          "Strengthen the clinic presence inside the Doc Chap ecosystem.",
        icon: BarChart3,
        items: [
          "Enhanced clinic visibility",
          "Priority feature access",
          "Premium clinic positioning tools",
        ],
      },
      {
        title: "Premium assistance",
        description:
          "Highest support priority for your clinic account.",
        icon: Headphones,
        items: [
          "Premium support",
          "Priority clinic assistance",
          "Priority support handling",
        ],
      },
    ],
  },
};

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
  const profile =
    safeObject(
      raw?.profile
    );

  const clinic =
    safeObject(
      raw?.clinic
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

function isPlanId(
  value: string
): value is PlanId {
  return (
    value === "essential" ||
    value === "professional" ||
    value === "premium"
  );
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
        maximumFractionDigits: 0,
      }
    ).format(
      price
    );
  } catch {
    return `${price} ${currency}`;
  }
}

/* ============================================================
   PAGE
============================================================ */

export default function SubscriptionsDetailClient() {
  const router =
    useRouter();

  const params =
    useParams<{
      Id: string;
    }>();

  const rawId =
    safeString(
      params?.Id
    ).toLowerCase();

  const plan =
    isPlanId(
      rawId
    )
      ? PLANS[
          rawId
        ]
      : null;

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
    selecting,
    setSelecting,
  ] =
    useState(false);

  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null
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
                  "[ClinicSubscriptionDetail] Realtime error:",
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

  const isCurrentPlan =
    Boolean(
      plan &&
      currentSubscription.planId ===
        plan.id
    );

  /* ============================================================
     SELECT PLAN
  ============================================================ */

  async function selectPlan() {
    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      !plan ||
      selecting ||
      isCurrentPlan
    ) {
      return;
    }

    setSelecting(
      true
    );

    setError(
      null
    );

    setSuccess(
      null
    );

    try {
      await setDoc(
        doc(
          firestore,
          "clinics",
          uid
        ),
        {
          subscription: {
            planId:
              plan.id,

            planName:
              plan.name,

            status:
              plan.price ===
              0
                ? "active"
                : "selected",

            price:
              plan.price,

            currency:
              plan.currency,

            billingPeriod:
              plan.billingPeriod,

            selectedAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },

          meta: {
            updatedAt:
              serverTimestamp(),
          },
        },
        {
          merge:
            true,
        }
      );

      setSuccess(
        plan.price ===
          0
          ? `${plan.name} plan activated successfully.`
          : `${plan.name} plan selected successfully. Payment activation can be connected when the clinic subscription payment flow is ready.`
      );
    } catch (
      selectError
    ) {
      console.error(
        "[ClinicSubscriptionDetail] Select error:",
        selectError
      );

      setError(
        "Unable to update your clinic subscription plan."
      );
    } finally {
      setSelecting(
        false
      );
    }
  }

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
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </main>
        </div>
      </div>
    );
  }

  /* ============================================================
     INVALID PLAN
  ============================================================ */

  if (
    !plan
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-7 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <AlertCircle className="mx-auto h-9 w-9 text-red-500" />

              <h1 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                Subscription plan not found
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                The requested clinic plan does not exist.
              </p>

              <Link
                href="/clinics/dashboard/subscriptions"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to subscriptions
              </Link>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    );
  }

  const PlanIcon =
    plan.icon;

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

                      Clinic subscription plan
                    </span>

                    {plan.badge && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                        {plan.featured && (
                          <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                        )}

                        {plan.badge}
                      </span>
                    )}

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
                    {plan.name}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    {plan.shortDescription}
                  </p>

                  <div className="mt-5 inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                    {clinic.name}
                    {" • "}
                    {clinic.city}
                  </div>
                </div>

                <Link
                  href="/clinics/dashboard/subscriptions"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <ArrowLeft className="h-4 w-4" />

                  All plans
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

            {success && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />

                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
              {/* LEFT */}

              <div className="space-y-6">
                <div className="rounded-[30px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${plan.iconClass}`}
                    >
                      <PlanIcon className="h-7 w-7" />
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-zinc-950 dark:text-white">
                        About the{" "}
                        {plan.name}{" "}
                        plan
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                        {plan.longDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {plan.highlights.map(
                      (
                        feature
                      ) => (
                        <div
                          key={
                            feature
                          }
                          className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
                        >
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <Check className="h-4 w-4" />
                          </div>

                          <span className="text-sm font-semibold leading-6 text-zinc-700 dark:text-zinc-300">
                            {feature}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    Plan characteristics
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Detailed tools and services included in this clinic subscription.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {plan.featureGroups.map(
                      (
                        group
                      ) => {
                        const GroupIcon =
                          group.icon;

                        return (
                          <article
                            key={
                              group.title
                            }
                            className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              <GroupIcon className="h-5 w-5" />
                            </div>

                            <h3 className="mt-4 text-base font-black text-zinc-950 dark:text-white">
                              {group.title}
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                              {group.description}
                            </p>

                            <div className="mt-4 space-y-2.5">
                              {group.items.map(
                                (
                                  item
                                ) => (
                                  <div
                                    key={
                                      item
                                    }
                                    className="flex items-start gap-2.5"
                                  >
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                                    <span className="text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                                      {item}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT */}

              <aside className="space-y-5">
                <div
                  className={`rounded-[30px] border bg-white p-6 shadow-sm dark:bg-zinc-950 ${
                    isCurrentPlan
                      ? "border-blue-500 ring-4 ring-blue-500/10 dark:border-blue-500"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${plan.iconClass}`}
                    >
                      <PlanIcon className="h-6 w-6" />
                    </div>

                    {isCurrentPlan && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />

                        Current plan
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-black text-zinc-950 dark:text-white">
                    {plan.name}
                  </h3>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
                      {formatPrice(
                        plan.price,
                        plan.currency
                      )}
                    </span>

                    {plan.price > 0 && (
                      <span className="pb-1 text-xs font-semibold text-zinc-400">
                        / month
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-xs leading-5 text-zinc-500">
                    {plan.price === 0
                      ? "No monthly subscription fee."
                      : "Monthly clinic subscription. Payment integration can be connected to the activation flow."}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void selectPlan()
                    }
                    disabled={
                      selecting ||
                      isCurrentPlan
                    }
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {selecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />

                        Updating...
                      </>
                    ) : isCurrentPlan ? (
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

                        {plan.price === 0
                          ? "Activate Essential"
                          : `Choose ${plan.name}`}
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <ShieldCheck className="h-5 w-5 text-blue-700 dark:text-blue-300" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Secure clinic subscription
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    The selected plan is attached only to the authenticated clinic document.
                  </p>
                </div>

                <div className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <Users className="h-5 w-5 text-violet-700 dark:text-violet-300" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Built for clinic teams
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Plans are adapted to patient management, appointments, healthcare teams, finances, insurance and clinic communication.
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