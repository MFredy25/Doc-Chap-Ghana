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
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Loader2,
  MapPin,
  Pill,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type PharmacyData = {
  uid?: string;
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    pharmacyName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string;
    owner?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
    };
  };

  pharmacy?: {
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

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
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
    pharmacyData,
    setPharmacyData,
  ] =
    useState<PharmacyData | null>(
      null
    );

  const [
    paymentsCount,
    setPaymentsCount,
  ] =
    useState(0);

  const [
    documentsCount,
    setDocumentsCount,
  ] =
    useState(0);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    if (
      !auth ||
      !db
    ) {
      setError(
        "Firebase is not initialized."
      );

      setLoading(
        false
      );

      return;
    }

    const firebaseAuth =
      auth;

    const firestore =
      db;

    let stopProfile:
      | (() => void)
      | null =
      null;

    let stopPayments:
      | (() => void)
      | null =
      null;

    let stopDocuments:
      | (() => void)
      | null =
      null;

    const stopAll =
      () => {
        stopProfile?.();
        stopPayments?.();
        stopDocuments?.();

        stopProfile =
          null;

        stopPayments =
          null;

        stopDocuments =
          null;
      };

    const stopAuth =
      onAuthStateChanged(
        firebaseAuth,
        (
          user
        ) => {
          stopAll();

          if (
            !user?.uid
          ) {
            router.replace(
              "/pharmacies/login"
            );

            return;
          }

          stopProfile =
            onSnapshot(
              doc(
                firestore,
                "pharmacies",
                user.uid
              ),
              async (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  stopAll();

                  try {
                    await signOut(
                      firebaseAuth
                    );
                  } catch {}

                  router.replace(
                    "/pharmacies/login"
                  );

                  return;
                }

                const data =
                  snapshot.data() as PharmacyData;

                const type =
                  s(
                    data.accountType ||
                      data.role ||
                      data.pharmacy?.type
                  ).toLowerCase();

                if (
                  (
                    type &&
                    type !==
                      "pharmacy"
                  ) ||
                  data.active ===
                    false ||
                  s(
                    data.status
                  ).toLowerCase() ===
                    "disabled"
                ) {
                  stopAll();

                  try {
                    await signOut(
                      firebaseAuth
                    );
                  } catch {}

                  router.replace(
                    "/pharmacies/login"
                  );

                  return;
                }

                setPharmacyData(
                  data
                );

                setError(
                  null
                );

                setLoading(
                  false
                );

                try {
                  window.localStorage.setItem(
                    "docchapghana:account-space",
                    "pharmacy"
                  );
                } catch {
                  // Non-blocking.
                }
              },
              (
                profileError
              ) => {
                console.error(
                  "[PharmacyDashboard] Profile error:",
                  profileError
                );

                setError(
                  "Unable to load your pharmacy account."
                );

                setLoading(
                  false
                );
              }
            );

          stopPayments =
            onSnapshot(
              collection(
                firestore,
                "pharmacies",
                user.uid,
                "payments"
              ),
              (
                snapshot
              ) =>
                setPaymentsCount(
                  snapshot.size
                ),
              () =>
                setPaymentsCount(
                  0
                )
            );

          stopDocuments =
            onSnapshot(
              collection(
                firestore,
                "pharmacies",
                user.uid,
                "documents"
              ),
              (
                snapshot
              ) =>
                setDocumentsCount(
                  snapshot.size
                ),
              () =>
                setDocumentsCount(
                  0
                )
            );
        }
      );

    return () => {
      stopAll();
      stopAuth();
    };
  }, [
    router,
  ]);

  const pharmacyName =
    useMemo(
      () =>
        s(
          pharmacyData
            ?.profile
            ?.pharmacyName
        ) ||
        s(
          pharmacyData
            ?.profile
            ?.displayName
        ) ||
        "Pharmacy",
      [
        pharmacyData,
      ]
    );

  const location =
    [
      s(
        pharmacyData
          ?.profile
          ?.city
      ),
      s(
        pharmacyData
          ?.profile
          ?.region
      ),
    ]
      .filter(
        Boolean
      )
      .join(
        ", "
      ) ||
    "Ghana";

  const verificationStatus =
    s(
      pharmacyData
        ?.pharmacy
        ?.verificationStatus
    ).toLowerCase() ||
    "pending";

  const verified =
    pharmacyData
      ?.pharmacy
      ?.verified ===
      true ||
    verificationStatus ===
      "verified" ||
    verificationStatus ===
      "approved";

  const profileCompleted =
    pharmacyData
      ?.meta
      ?.profileCompleted ===
      true;

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="flex min-h-[75vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative px-4 py-9 sm:px-6 sm:py-12 lg:px-10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                    <Pill className="h-4 w-4" />

                    Pharmacy dashboard
                  </span>

                  {verified ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-300/15 px-3 py-1.5 text-xs font-bold">
                      <BadgeCheck className="h-4 w-4" />

                      Verified pharmacy
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-300/15 px-3 py-1.5 text-xs font-bold">
                      <ShieldCheck className="h-4 w-4" />

                      Verification {verificationStatus}
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                  {pharmacyName}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
                  Manage your Doc Chap Ghana pharmacy account, profile and verification information.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                  <MapPin className="h-4 w-4" />

                  {location}
                </div>
              </div>

              <Link
                href="/pharmacies/my-account"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#063b34] shadow-xl transition hover:bg-emerald-50"
              >
                Manage my account

                <ArrowRight className="h-4 w-4" />
              </Link>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label:
                  "Profile",
                value:
                  profileCompleted
                    ? "Complete"
                    : "To complete",
                icon:
                  UserRound,
              },
              {
                label:
                  "Verification",
                value:
                  verified
                    ? "Verified"
                    : verificationStatus,
                icon:
                  ShieldCheck,
              },
              {
                label:
                  "Documents",
                value:
                  String(
                    documentsCount
                  ),
                icon:
                  FileCheck2,
              },
              {
                label:
                  "Payments",
                value:
                  String(
                    paymentsCount
                  ),
                icon:
                  CircleDollarSign,
              },
            ].map(
              (
                item
              ) => {
                const Icon =
                  item.icon;

                return (
                  <div
                    key={
                      item.label
                    }
                    className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white shadow-sm"
                  >
                    <Icon className="h-5 w-5" />

                    <div className="mt-4 text-2xl font-black capitalize">
                      {item.value}
                    </div>

                    <div className="mt-1 text-xs font-bold text-emerald-50">
                      {item.label}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Link
              href="/pharmacies/my-account"
              className="group rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <Building2 className="h-7 w-7 text-emerald-600" />

              <h2 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                Pharmacy profile
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Update your pharmacy name, address, contact information and professional details.
              </p>

              <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                Open profile

                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <ShieldCheck className="h-7 w-7 text-blue-600" />

              <h2 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                Verification status
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Current status:{" "}
                <strong className="capitalize">
                  {verificationStatus}
                </strong>
                .
              </p>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <CheckCircle2 className="h-7 w-7 text-violet-600" />

              <h2 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                Private account
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Your dashboard reads only the authenticated pharmacy document under your own Firebase UID.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}