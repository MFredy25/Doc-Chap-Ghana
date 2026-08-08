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
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  UserRound,
  Video,
  WalletCards,
  Zap,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";

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

type DoctorView = {
  name: string;
  firstName: string;
  specialty: string;
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
      "The essentials to manage your medical activity on Doc Chap Ghana.",
    longDescription:
      "Essential gives you the core tools required to manage your professional profile, patients, schedule and appointments from one secure doctor workspace.",
    price: 0,
    currency: "GHS",
    billingPeriod: "month",
    icon: Stethoscope,
    iconClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    featured: false,
    highlights: [
      "Professional doctor profile",
      "Patient directory",
      "Appointment management",
      "Doctor schedule",
      "Basic notifications",
      "Basic support",
    ],
    featureGroups: [
      {
        title: "Professional workspace",
        description:
          "Core tools for managing your daily activity.",
        icon: Stethoscope,
        items: [
          "Professional doctor profile",
          "Profile and practice information",
          "Doctor schedule",
          "Availability management",
        ],
      },
      {
        title: "Appointments & patients",
        description:
          "Manage your patients and consultations in one place.",
        icon: CalendarCheck2,
        items: [
          "Appointment list",
          "Daily schedule",
          "Patient directory",
          "Appointment status tracking",
        ],
      },
      {
        title: "Account tools",
        description:
          "Basic tools to keep your account organized.",
        icon: ShieldCheck,
        items: [
          "Basic notifications",
          "Account settings",
          "Basic support access",
        ],
      },
    ],
  },

  professional: {
    id: "professional",
    name: "Professional",
    shortDescription:
      "A complete plan for doctors who manage consultations every day.",
    longDescription:
      "Professional adds remote care, messaging, financial visibility, statistics and insurance tools for doctors who actively use Doc Chap Ghana for day-to-day patient care.",
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
      "Teleconsultation",
      "Phone consultations",
      "Patient messaging",
      "Financial dashboard",
      "Professional statistics",
      "Insurance settings",
      "Priority support",
    ],
    featureGroups: [
      {
        title: "Remote consultations",
        description:
          "Offer care beyond in-person appointments.",
        icon: Video,
        items: [
          "Video teleconsultation",
          "Phone consultation",
          "Remote appointment management",
          "Meeting-link access",
        ],
      },
      {
        title: "Patient communication",
        description:
          "Stay connected with patients from your workspace.",
        icon: MessageCircle,
        items: [
          "Patient messaging",
          "Conversation history",
          "Patient-linked communications",
          "Appointment notifications",
        ],
      },
      {
        title: "Business management",
        description:
          "Follow the operational side of your medical activity.",
        icon: WalletCards,
        items: [
          "Financial dashboard",
          "Paid consultation tracking",
          "Professional statistics",
          "Insurance settings",
        ],
      },
      {
        title: "Support",
        description:
          "Get faster assistance when you need it.",
        icon: ShieldCheck,
        items: [
          "Priority support",
          "Support tickets",
          "WhatsApp support access",
        ],
      },
    ],
  },

  premium: {
    id: "premium",
    name: "Premium",
    shortDescription:
      "Advanced tools and priority services for high-volume medical activity.",
    longDescription:
      "Premium is designed for doctors who need the complete Doc Chap Ghana experience with deeper insights, enhanced visibility and priority access to support and future professional tools.",
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
      "Advanced statistics",
      "Extended financial insights",
      "Priority account assistance",
      "Enhanced professional visibility",
      "Priority feature access",
      "Premium support",
    ],
    featureGroups: [
      {
        title: "Everything in Professional",
        description:
          "All core, remote-care and business-management capabilities.",
        icon: Sparkles,
        items: [
          "All Essential features",
          "Teleconsultation",
          "Phone consultation",
          "Patient messaging",
          "Finances and insurance",
        ],
      },
      {
        title: "Advanced insights",
        description:
          "A deeper view of your professional activity.",
        icon: TrendingUp,
        items: [
          "Advanced statistics",
          "Extended financial insights",
          "Enhanced activity indicators",
          "Priority access to future analytics",
        ],
      },
      {
        title: "Professional visibility",
        description:
          "Strengthen your visibility inside the Doc Chap ecosystem.",
        icon: UserRound,
        items: [
          "Enhanced professional visibility",
          "Priority feature access",
          "Premium profile positioning tools",
        ],
      },
      {
        title: "Premium assistance",
        description:
          "Highest support priority for your doctor account.",
        icon: Crown,
        items: [
          "Premium support",
          "Priority account assistance",
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
): Record<string, any> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      any
    >;
  }

  return {};
}

function mapDoctor(
  raw: unknown
): DoctorView {
  const data =
    safeObject(raw);

  const profile =
    safeObject(
      data.profile
    );

  const professional =
    safeObject(
      data.professional
    );

  const firstName =
    safeString(
      profile.firstName
    );

  const lastName =
    safeString(
      profile.lastName
    );

  const name =
    safeString(
      profile.displayName
    ) ||
    safeString(
      profile.fullName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Doctor";

  const verificationStatus =
    safeString(
      professional.verificationStatus
    ).toLowerCase() ||
    "pending";

  return {
    name,

    firstName:
      firstName ||
      name.split(" ")[0] ||
      "Doctor",

    specialty:
      safeString(
        professional.specialty
      ) ||
      safeString(
        profile.specialty
      ) ||
      "Medical professional",

    verified:
      professional.verified ===
        true ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",

    verificationStatus,
  };
}

function getCurrentSubscription(
  raw: unknown
): CurrentSubscription {
  const data =
    safeObject(raw);

  const subscription =
    safeObject(
      data.subscription
    );

  const rawPlanId =
    safeString(
      subscription.planId ||
        subscription.plan
    ).toLowerCase();

  const planId:
    PlanId | null =
    rawPlanId === "essential" ||
    rawPlanId === "professional" ||
    rawPlanId === "premium"
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
    useState(
      true
    );

  const [
    uid,
    setUid,
  ] =
    useState<
      string | null
    >(null);

  const [
    doctorData,
    setDoctorData,
  ] =
    useState<any>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    selecting,
    setSelecting,
  ] =
    useState(
      false
    );

  const [
    success,
    setSuccess,
  ] =
    useState<
      string | null
    >(null);

  /* ============================================================
     AUTH
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

    const unsubscribe =
      onAuthStateChanged(
        firebaseAuthInstance,
        async (
          user
        ) => {
          if (
            !user?.uid
          ) {
            router.replace(
              "/doctors/login"
            );

            return;
          }

          try {
            const snapshot =
              await getDoc(
                doc(
                  firestoreInstance,
                  "professionals",
                  user.uid
                )
              );

            if (
              !snapshot.exists()
            ) {
              await signOut(
                firebaseAuthInstance
              );

              router.replace(
                "/doctors/login"
              );

              return;
            }

            const data =
              snapshot.data();

            const professional =
              safeObject(
                data.professional
              );

            const professionalType =
              safeString(
                data.professionalType ||
                  professional.type ||
                  data.role
              ).toLowerCase();

            if (
              (
                professionalType &&
                professionalType !==
                  "doctor"
              ) ||
              data.active ===
                false
            ) {
              await signOut(
                firebaseAuthInstance
              );

              router.replace(
                "/doctors/login"
              );

              return;
            }

            setUid(
              user.uid
            );

            setDoctorData(
              data
            );

            setError(
              null
            );
          } catch (
            authError
          ) {
            console.error(
              "[SubscriptionDetail] Auth error:",
              authError
            );

            setError(
              "Unable to verify your doctor account."
            );
          } finally {
            setLoading(
              false
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [
    router,
  ]);

  /* ============================================================
     REALTIME
  ============================================================ */

  useEffect(() => {
    const firestore =
      db;

    if (
      !firestore ||
      !uid
    ) {
      return;
    }

    const unsubscribe =
      onSnapshot(
        doc(
          firestore,
          "professionals",
          uid
        ),
        (
          snapshot
        ) => {
          if (
            snapshot.exists()
          ) {
            setDoctorData(
              snapshot.data()
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [
    uid,
  ]);

  const doctor =
    useMemo(
      () =>
        mapDoctor(
          doctorData ||
            {}
        ),
      [
        doctorData,
      ]
    );

  const currentSubscription =
    useMemo(
      () =>
        getCurrentSubscription(
          doctorData ||
            {}
        ),
      [
        doctorData,
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
          "professionals",
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
          : `${plan.name} plan selected successfully. Payment activation can be connected when the subscription payment flow is ready.`
      );
    } catch (
      selectError
    ) {
      console.error(
        "[SubscriptionDetail] Select error:",
        selectError
      );

      setError(
        "Unable to update your subscription plan."
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

  /* ============================================================
     INVALID PLAN
  ============================================================ */

  if (
    !plan
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <DoctorSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-7 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <AlertCircle className="mx-auto h-9 w-9 text-red-500" />

              <h1 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                Subscription plan not found
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                The requested plan does not exist.
              </p>

              <Link
                href="/doctors/dashboard/subscriptions"
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
      <DoctorSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          {/* =====================================================
              HERO
          ===================================================== */}

          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <Crown className="h-4 w-4 text-cyan-300" />

                      Subscription plan
                    </span>

                    {plan.badge && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                        {plan.featured && (
                          <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                        )}

                        {
                          plan.badge
                        }
                      </span>
                    )}

                    {doctor.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified doctor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <ShieldCheck className="h-4 w-4" />

                        Verification{" "}
                        {
                          doctor.verificationStatus
                        }
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    {
                      plan.name
                    }
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    {
                      plan.shortDescription
                    }
                  </p>

                  <div className="mt-5 inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                    {
                      doctor.name
                    }
                    {" • "}
                    {
                      doctor.specialty
                    }
                  </div>
                </div>

                <Link
                  href="/doctors/dashboard/subscriptions"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <ArrowLeft className="h-4 w-4" />

                  All plans
                </Link>
              </div>
            </div>
          </section>

          {/* =====================================================
              CONTENT
          ===================================================== */}

          <section className="px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {
                  error
                }
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />

                {
                  success
                }
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
                        {
                          plan.name
                        }{" "}
                        plan
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                        {
                          plan.longDescription
                        }
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
                            {
                              feature
                            }
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
                    Detailed tools and services included in this subscription.
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
                              {
                                group.title
                              }
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                              {
                                group.description
                              }
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
                                      {
                                        item
                                      }
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
                    {
                      plan.name
                    }
                  </h3>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
                      {formatPrice(
                        plan.price,
                        plan.currency
                      )}
                    </span>

                    {plan.price >
                      0 && (
                      <span className="pb-1 text-xs font-semibold text-zinc-400">
                        / month
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-xs leading-5 text-zinc-500">
                    {plan.price ===
                    0
                      ? "No monthly subscription fee."
                      : "Monthly subscription. Payment integration will be connected to the activation flow."}
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

                        Choose{" "}
                        {
                          plan.name
                        }
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <ShieldCheck className="h-6 w-6 text-blue-700 dark:text-blue-300" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Secure subscription
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Your selected plan is stored directly on your authenticated doctor profile.
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