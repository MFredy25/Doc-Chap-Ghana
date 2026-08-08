"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
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

type SubscriptionPlan = {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  currency: "GHS";
  billingPeriod: "month";
  badge?: string;
  icon: React.ElementType;
  iconClass: string;
  buttonClass: string;
  featured: boolean;
  features: string[];
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
   CONSTANTS
============================================================ */

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "essential",
    name: "Essential",
    description:
      "The essentials to manage your medical activity on Doc Chap Ghana.",
    price: 0,
    currency: "GHS",
    billingPeriod: "month",
    icon: Stethoscope,
    iconClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    buttonClass:
      "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
    featured: false,
    features: [
      "Professional doctor profile",
      "Patient directory",
      "Appointment management",
      "Doctor schedule",
      "Basic notifications",
      "Basic support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description:
      "A complete plan for doctors who manage consultations every day.",
    price: 99,
    currency: "GHS",
    billingPeriod: "month",
    badge: "Most popular",
    icon: Zap,
    iconClass:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    buttonClass:
      "bg-blue-600 text-white hover:bg-blue-500",
    featured: true,
    features: [
      "Everything in Essential",
      "Teleconsultation",
      "Phone consultations",
      "Patient messaging",
      "Financial dashboard",
      "Professional statistics",
      "Insurance settings",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description:
      "Advanced tools and priority services for high-volume medical activity.",
    price: 199,
    currency: "GHS",
    billingPeriod: "month",
    badge: "Advanced",
    icon: Crown,
    iconClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    buttonClass:
      "bg-[#071b3a] text-white hover:bg-[#0b2f63] dark:bg-white dark:text-[#071b3a]",
    featured: false,
    features: [
      "Everything in Professional",
      "Advanced statistics",
      "Extended financial insights",
      "Priority account assistance",
      "Enhanced professional visibility",
      "Priority feature access",
      "Premium support",
    ],
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

  const titledName =
    name === "Doctor"
      ? name
      : `Dr. ${name.replace(/^dr\.?\s+/i, "")}`;

  const verificationStatus =
    safeString(
      professional.verificationStatus
    ).toLowerCase() ||
    "pending";

  return {
    name: titledName,

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

export default function SubscriptionsClient() {
  const router =
    useRouter();

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
    selectedPlanCard,
    setSelectedPlanCard,
  ] =
    useState<PlanId | null>(
      null
    );

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
            const professionalRef =
              doc(
                firestoreInstance,
                "professionals",
                user.uid
              );

            const snapshot =
              await getDoc(
                professionalRef
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
              "[DoctorSubscriptions] Auth error:",
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
     REALTIME PROFESSIONAL DATA
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
        },
        (
          realtimeError
        ) => {
          console.error(
            "[DoctorSubscriptions] Realtime error:",
            realtimeError
          );
        }
      );

    return () =>
      unsubscribe();
  }, [
    uid,
  ]);

  /* ============================================================
     COMPUTED
  ============================================================ */

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
        <DoctorSidebar />

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

                      Subscriptions
                    </span>

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
                    Choose your plan
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Choose the Doc Chap Ghana subscription that best fits your medical activity and the tools you need every day.
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
                  href="/doctors/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Dashboard

                  <ArrowRight className="h-4 w-4" />
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
                        : "Select one of the plans below to configure your subscription."}
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

            {/* PLANS */}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              {SUBSCRIPTION_PLANS.map(
                (
                  plan
                ) => {
                  const PlanIcon =
                    plan.icon;

                  const isCurrentPlan =
                    currentSubscription.planId ===
                    plan.id;


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
                          `/doctors/dashboard/subscriptions/${plan.id}`
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          router.push(
                            `/doctors/dashboard/subscriptions/${plan.id}`
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

                            {
                              plan.badge
                            }
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${plan.iconClass}`}
                      >
                        <PlanIcon className="h-6 w-6" />
                      </div>

                      <h2 className="mt-5 text-xl font-black text-zinc-950 dark:text-white">
                        {
                          plan.name
                        }
                      </h2>

                      <p className="mt-2 min-h-[44px] text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                        {
                          plan.description
                        }
                      </p>

                      <div className="mt-6 border-y border-zinc-100 py-5 dark:border-zinc-800">
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
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

                        <p className="mt-1 text-[11px] text-zinc-400">
                          {plan.price ===
                          0
                            ? "No monthly subscription fee"
                            : "Monthly subscription"}
                        </p>
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
                                  {
                                    feature
                                  }
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
                            `/doctors/dashboard/subscriptions/${plan.id}`
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
                            {
                              plan.name
                            }{" "}
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
                    Paid plan selection is recorded on your doctor account. The actual payment and automatic activation should be connected to your subscription payment provider when that flow is implemented.
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
