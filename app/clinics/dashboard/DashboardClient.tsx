"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
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
    contactName?: string;
    email?: string;
    phone?: string;
    city?: string;
    region?: string;
    address?: string;

    owner?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
    };
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
    registrationNumber?: string | null;
    licenseNumber?: string | null;
  };

  meta?: {
    profileCompleted?: boolean;
  };
};

type DashboardStats = {
  appointments: number;
  patients: number;
  team: number;
  messages: number;
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

/* ============================================================
   PAGE
============================================================ */

export default function DashboardClient() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    firebaseUser,
    setFirebaseUser,
  ] =
    useState<User | null>(
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
    stats,
    setStats,
  ] =
    useState<DashboardStats>({
      appointments: 0,
      patients: 0,
      team: 0,
      messages: 0,
    });

  /* ============================================================
     AUTH + REALTIME CLINIC PROFILE
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
        (
          user
        ) => {
          unsubscribeClinic?.();
          unsubscribeClinic =
            null;

          if (
            !user?.uid
          ) {
            setFirebaseUser(
              null
            );

            router.replace(
              "/clinics/login"
            );

            return;
          }

          setFirebaseUser(
            user
          );

          try {
            window.localStorage.setItem(
              "docchapghana:account-space",
              "clinic"
            );
          } catch {
            // Non-blocking.
          }

          const clinicRef =
            doc(
              firestoreInstance,
              "clinics",
              user.uid
            );

          unsubscribeClinic =
            onSnapshot(
              clinicRef,
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
                  accountType &&
                  accountType !==
                    "clinic"
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

                if (
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
                snapshotError
              ) => {
                console.error(
                  "[ClinicDashboard] Clinic realtime error:",
                  snapshotError
                );

                setError(
                  "Unable to load your clinic account."
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
     REALTIME KPI COUNTS
  ============================================================ */

  useEffect(() => {
    const firestore =
      db;

    const uid =
      firebaseUser?.uid;

    if (
      !firestore ||
      !uid
    ) {
      return;
    }

    /*
     * Keep non-null references outside the nested listener.
     * TypeScript otherwise widens `firestore` back to
     * `Firestore | null` inside listenCount().
     */
    const firestoreInstance =
      firestore;

    const clinicUid =
      uid;

    const cleanups:
      Array<
        () => void
      > = [];

    function listenCount(
      collectionName:
        | "appointments"
        | "patients"
        | "team"
        | "messages",
      key:
        keyof DashboardStats
    ) {
      const collectionRef =
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          collectionName
        );

      const unsubscribe =
        onSnapshot(
          collectionRef,
          (
            snapshot
          ) => {
            setStats(
              (
                current
              ) => ({
                ...current,
                [key]:
                  snapshot.size,
              })
            );
          },
          (
            countError
          ) => {
            console.warn(
              `[ClinicDashboard] Unable to count ${collectionName}:`,
              countError
            );
          }
        );

      cleanups.push(
        unsubscribe
      );
    }

    listenCount(
      "appointments",
      "appointments"
    );

    listenCount(
      "patients",
      "patients"
    );

    listenCount(
      "team",
      "team"
    );

    listenCount(
      "messages",
      "messages"
    );

    return () => {
      cleanups.forEach(
        (
          cleanup
        ) =>
          cleanup()
      );
    };
  }, [
    firebaseUser,
  ]);

  /* ============================================================
     VIEW MODEL
  ============================================================ */

  const view =
    useMemo(
      () => {
        const profile =
          safeObject(
            clinicData?.profile
          );

        const owner =
          safeObject(
            profile.owner
          );

        const clinic =
          safeObject(
            clinicData?.clinic
          );

        const verificationStatus =
          safeString(
            clinic.verificationStatus
          ).toLowerCase() ||
          "pending";

        const ownerName =
          safeString(
            owner.fullName
          ) ||
          safeString(
            profile.contactName
          ) ||
          `${safeString(
            owner.firstName
          )} ${safeString(
            owner.lastName
          )}`.trim() ||
          "Clinic administrator";

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
            safeString(
              firebaseUser
                ?.displayName
            ) ||
            "Clinic",

          ownerName,

          city:
            safeString(
              profile.city
            ) ||
            "Ghana",

          email:
            safeString(
              profile.email
            ) ||
            safeString(
              firebaseUser?.email
            ),

          verified:
            clinic.verified ===
              true ||
            verificationStatus ===
              "verified" ||
            verificationStatus ===
              "approved",

          verificationStatus,

          profileCompleted:
            clinicData?.meta
              ?.profileCompleted ===
            true,
        };
      },
      [
        clinicData,
        firebaseUser,
      ]
    );

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200/80 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <div className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading your clinic dashboard...
              </div>
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
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
      <ClinicSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          {/* =====================================================
              HERO
          ===================================================== */}

          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#071b3a] via-[#0b2f63] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-blue-300/15 blur-3xl" />

            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
              <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                      <Building2 className="h-4 w-4 text-cyan-300" />

                      Clinic dashboard
                    </span>

                    {view.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-md">
                        <BadgeCheck className="h-4 w-4" />

                        Verified clinic
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-md">
                        <ShieldCheck className="h-4 w-4" />

                        Verification{" "}
                        {view.verificationStatus}
                      </span>
                    )}

                    {view.profileCompleted && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 backdrop-blur-md">
                        <CheckCircle2 className="h-4 w-4" />

                        Profile completed
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex items-start gap-4">
                    <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-md sm:flex">
                      <Building2 className="h-8 w-8 text-cyan-200" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-blue-100">
                        Clinic workspace
                      </p>

                      <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                        {view.name}
                      </h1>

                      <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                        Manage your clinic, healthcare team, patients and appointments from one secure Doc Chap Ghana workspace.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold backdrop-blur-md">
                      <UserRound className="h-4 w-4 text-violet-200" />

                      {view.ownerName}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold backdrop-blur-md">
                      <MapPin className="h-4 w-4 text-emerald-200" />

                      {view.city}
                    </span>
                  </div>
                </div>

                <Link
                  href="/clinics/my-account"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  My clinic account

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* =====================================================
              CONTENT
          ===================================================== */}

          <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

            {/* KPI */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label:
                    "Appointments",
                  value:
                    stats.appointments,
                  subtitle:
                    "Clinic appointments",
                  icon:
                    CalendarCheck2,
                  iconClass:
                    "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
                },
                {
                  label:
                    "Patients",
                  value:
                    stats.patients,
                  subtitle:
                    "Linked patients",
                  icon:
                    Users,
                  iconClass:
                    "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
                },
                {
                  label:
                    "Healthcare team",
                  value:
                    stats.team,
                  subtitle:
                    "Team members",
                  icon:
                    Stethoscope,
                  iconClass:
                    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
                },
                {
                  label:
                    "Messages",
                  value:
                    stats.messages,
                  subtitle:
                    "Clinic messages",
                  icon:
                    MessageCircle,
                  iconClass:
                    "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300",
                },
              ].map(
                (
                  item
                ) => {
                  const Icon =
                    item.icon;

                  return (
                    <article
                      key={
                        item.label
                      }
                      className="rounded-[26px] border border-zinc-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <span className="text-3xl font-black text-zinc-950 dark:text-white">
                          {item.value}
                        </span>
                      </div>

                      <h2 className="mt-5 text-sm font-bold text-zinc-950 dark:text-white">
                        {item.label}
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        {item.subtitle}
                      </p>
                    </article>
                  );
                }
              )}
            </div>

            {/* QUICK ACCESS */}

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Quick access
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Open the main tools of your clinic workspace.
                    </p>
                  </div>

                  <Clock3 className="h-6 w-6 text-blue-600" />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      href:
                        "/clinics/dashboard/appointments",
                      title:
                        "Appointments",
                      description:
                        "Review and manage clinic appointments.",
                      icon:
                        CalendarCheck2,
                      iconClass:
                        "bg-blue-600",
                    },
                    {
                      href:
                        "/clinics/dashboard/team",
                      title:
                        "Healthcare team",
                      description:
                        "Manage professionals linked to your clinic.",
                      icon:
                        Stethoscope,
                      iconClass:
                        "bg-emerald-600",
                    },
                    {
                      href:
                        "/clinics/dashboard/patients",
                      title:
                        "Patients",
                      description:
                        "Access and follow your clinic patients.",
                      icon:
                        Users,
                      iconClass:
                        "bg-violet-600",
                    },
                    {
                      href:
                        "/clinics/dashboard/finances",
                      title:
                        "Finances",
                      description:
                        "Follow your clinic financial activity.",
                      icon:
                        CircleDollarSign,
                      iconClass:
                        "bg-cyan-600",
                    },
                  ].map(
                    (
                      item
                    ) => {
                      const Icon =
                        item.icon;

                      return (
                        <Link
                          key={
                            item.title
                          }
                          href={
                            item.href
                          }
                          className="group rounded-[24px] border border-zinc-200 bg-zinc-50/60 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                        >
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconClass}`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>

                          <h3 className="mt-4 text-sm font-black text-zinc-950 dark:text-white">
                            {item.title}
                          </h3>

                          <p className="mt-2 text-xs leading-5 text-zinc-500">
                            {item.description}
                          </p>

                          <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                            Open

                            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          </div>
                        </Link>
                      );
                    }
                  )}
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <Settings className="h-6 w-6 text-blue-600" />

                  <h2 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                    Clinic profile
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Keep your clinic identity, registration, location and owner details up to date.
                  </p>

                  <Link
                    href="/clinics/my-account"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    Open my account

                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div
                  className={`rounded-[28px] border p-5 ${
                    view.verified
                      ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                      : "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
                  }`}
                >
                  {view.verified ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-amber-700" />
                  )}

                  <h2 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                    {view.verified
                      ? "Clinic verified"
                      : "Clinic verification"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {view.verified
                      ? "Your clinic has been verified on Doc Chap Ghana."
                      : `Your clinic verification status is currently ${view.verificationStatus}.`}
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