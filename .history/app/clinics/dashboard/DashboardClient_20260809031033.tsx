"use client";

import {
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
  getDoc,
  onSnapshot,
} from "firebase/firestore";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Loader2,
  MapPin,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

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
  return value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
    ? (value as Record<
        string,
        any
      >)
    : {};
}

export default function DashboardClient() {
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
    useState<
      string | null
    >(null);

  const [
    clinicData,
    setClinicData,
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

    const unsubscribe =
      onAuthStateChanged(
        firebaseAuth,
        async (
          user
        ) => {
          if (
            !user?.uid
          ) {
            router.replace(
              "/clinics/login"
            );

            return;
          }

          try {
            const snapshot =
              await getDoc(
                doc(
                  firestore,
                  "clinics",
                  user.uid
                )
              );

            if (
              !snapshot.exists()
            ) {
              await signOut(
                firebaseAuth
              );

              router.replace(
                "/clinics/login"
              );

              return;
            }

            const data =
              snapshot.data();

            if (
              data.active ===
              false
            ) {
              await signOut(
                firebaseAuth
              );

              router.replace(
                "/clinics/login"
              );

              return;
            }

            setUid(
              user.uid
            );

            setClinicData(
              data
            );
          } catch (
            dashboardError
          ) {
            console.error(
              "[ClinicDashboard] Auth error:",
              dashboardError
            );

            setError(
              "Unable to load your clinic account."
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
          "clinics",
          uid
        ),
        (
          snapshot
        ) => {
          if (
            snapshot.exists()
          ) {
            setClinicData(
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

  const view =
    useMemo(
      () => {
        const profile =
          safeObject(
            clinicData?.profile
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

        return {
          name:
            safeString(
              profile.clinicName
            ) ||
            safeString(
              profile.displayName
            ) ||
            "Clinic",

          contactName:
            safeString(
              profile.contactName
            ) ||
            "Clinic administrator",

          city:
            safeString(
              profile.city
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
      },
      [
        clinicData,
      ]
    );

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <Header />

        <main className="flex min-h-[75vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
          <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    <Building2 className="h-4 w-4 text-cyan-300" />
                    Clinic dashboard
                  </span>

                  {view.verified ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                      <BadgeCheck className="h-4 w-4" />
                      Verified clinic
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                      <ShieldCheck className="h-4 w-4" />
                      Verification {view.verificationStatus}
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                  {view.name}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                  Manage your clinic information, team and healthcare activity from your Doc Chap Ghana workspace.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                    <UserRound className="h-4 w-4 text-cyan-300" />
                    {view.contactName}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                    <MapPin className="h-4 w-4 text-emerald-300" />
                    {view.city}
                  </span>
                </div>
              </div>

              <Link
                href="/clinics/my-account"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:bg-blue-50"
              >
                My clinic account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Clinic profile",
                "Complete and manage clinic information.",
                Building2,
                "bg-blue-600",
              ],
              [
                "Healthcare team",
                "Manage professionals linked to your clinic.",
                Stethoscope,
                "bg-emerald-600",
              ],
              [
                "Patients",
                "Follow patient activity from one space.",
                Users,
                "bg-violet-600",
              ],
              [
                "Appointments",
                "Review clinic appointment activity.",
                CalendarCheck2,
                "bg-cyan-600",
              ],
            ].map(
              (
                [
                  title,
                  description,
                  Icon,
                  iconClass,
                ]
              ) => {
                const CardIcon =
                  Icon as React.ElementType;

                return (
                  <article
                    key={
                      String(
                        title
                      )
                    }
                    className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>
                      <CardIcon className="h-5 w-5 text-white" />
                    </div>

                    <h2 className="mt-4 text-base font-black text-zinc-950 dark:text-white">
                      {String(title)}
                    </h2>

                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {String(description)}
                    </p>
                  </article>
                );
              }
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <Settings className="h-6 w-6 text-blue-600" />

              <h2 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                Complete your clinic profile
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Add your clinic address, registration information and contact details.
              </p>

              <Link
                href="/clinics/my-account"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"
              >
                Open my account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-700" />

              <h2 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                Clinic workspace ready
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Your clinic account is active and ready to be configured.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}