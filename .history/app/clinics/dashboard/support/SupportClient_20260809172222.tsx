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
  Timestamp,
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";
import ClinicNewSupportMessageModal from "@/app/components/ClinicNewSupportMessageModal";

import {
  auth,
  db,
} from "@/lib/firebase/client";

import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Headphones,
  HelpCircle,
  LifeBuoy,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

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

    firstName?: string;
    lastName?: string;

    email?: string;
    phone?: string;

    city?: string;
    region?: string;
    address?: string;

    country?: string;
    countryIso2?: string;

    owner?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      email?: string;
      phone?: string;
    };
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
    registrationNumber?: string | null;
    licenseNumber?: string | null;
    registrationReference?: string | null;
  };

  meta?: {
    profileCompleted?: boolean;
  };
};


type SupportTicket = {
  id: string;
  clinicId?: string;
  clinicName?: string;
  category?: string;
  subject?: string;
  message?: string;
  status?: string;
  priority?: string;
  createdAt?: unknown;
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

function toDate(
  value: unknown
): Date | null {
  if (
    value instanceof
    Timestamp
  ) {
    return value.toDate();
  }

  if (
    value instanceof Date
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    const parsed =
      new Date(value);

    return Number.isNaN(
      parsed.getTime()
    )
      ? null
      : parsed;
  }

  if (
    value &&
    typeof value ===
      "object" &&
    "toDate" in value
  ) {
    const candidate =
      (
        value as {
          toDate?: unknown;
        }
      ).toDate;

    if (
      typeof candidate ===
      "function"
    ) {
      try {
        return (
          candidate as () => Date
        )();
      } catch {
        return null;
      }
    }
  }

  return null;
}

function formatDate(
  value: unknown
): string {
  const date =
    toDate(value);

  if (!date) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-GH",
      {
        dateStyle:
          "medium",
        timeStyle:
          "short",
        timeZone:
          "Africa/Accra",
      }
    ).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function mapClinic(
  raw: ClinicData | null
) {
  const data =
    safeObject(raw);

  const profile =
    safeObject(
      data.profile
    );

  const clinic =
    safeObject(
      data.clinic
    );

  const owner =
    safeObject(
      profile.owner
    );

  const clinicName =
    safeString(
      profile.clinicName
    ) ||
    safeString(
      profile.displayName
    ) ||
    safeString(
      profile.fullName
    ) ||
    "Clinic";

  const ownerName =
    safeString(
      owner.fullName
    ) ||
    safeString(
      profile.contactName
    ) ||
    `${safeString(
      owner.firstName ||
        profile.firstName
    )} ${safeString(
      owner.lastName ||
        profile.lastName
    )}`.trim() ||
    "Clinic administrator";

  const verificationStatus =
    safeString(
      clinic.verificationStatus
    ).toLowerCase() ||
    "pending";

  return {
    name:
      clinicName,

    ownerName,

    city:
      safeString(
        profile.city
      ) ||
      safeString(
        profile.region
      ) ||
      "Ghana",

    email:
      safeString(
        profile.email
      ),

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

/* ============================================================
   PAGE
============================================================ */

export default function SupportClient() {
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
    newRequestOpen,
    setNewRequestOpen,
  ] =
    useState(false);

  const [
    sent,
    setSent,
  ] =
    useState(false);

  const [
    tickets,
    setTickets,
  ] =
    useState<
      SupportTicket[]
    >([]);

  /* ============================================================
     AUTHENTICATION + CLINIC PROFILE
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
            setUid(
              null
            );

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
                snapshotError
              ) => {
                console.error(
                  "[ClinicSupport] Profile realtime error:",
                  snapshotError
                );

                setError(
                  "Unable to verify your clinic account."
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
     SUPPORT TICKETS REALTIME
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

    const firestoreInstance =
      firestore;

    const clinicUid =
      uid;

    const unsubscribe =
      onSnapshot(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "supportTickets"
        ),
        (
          snapshot
        ) => {
          const rows =
            snapshot.docs.map(
              (
                ticketDocument
              ) => ({
                id:
                  ticketDocument.id,

                ...(
                  ticketDocument.data() as Omit<
                    SupportTicket,
                    "id"
                  >
                ),
              })
            );

          rows.sort(
            (
              a,
              b
            ) => {
              const dateA =
                toDate(
                  a.createdAt
                )
                  ?.getTime() ||
                0;

              const dateB =
                toDate(
                  b.createdAt
                )
                  ?.getTime() ||
                0;

              return (
                dateB -
                dateA
              );
            }
          );

          setTickets(
            rows
          );
        },
        (
          snapshotError
        ) => {
          console.error(
            "[ClinicSupport] Tickets realtime error:",
            snapshotError
          );
        }
      );

    return () =>
      unsubscribe();
  }, [
    uid,
  ]);

  /* ============================================================
     VIEW
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

  /* ============================================================
     LOADING
  ============================================================ */

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

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <ClinicSidebar />

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
                      <LifeBuoy className="h-4 w-4 text-cyan-300" />

                      Support
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
                    Clinic support
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Contact the Doc Chap Ghana support team for clinic account, technical, appointment, payment or team assistance.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <UserRound className="h-4 w-4 text-violet-200" />

                      {clinic.name}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <MapPin className="h-4 w-4 text-emerald-200" />

                      {clinic.city}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setSent(
                        false
                      );

                      setError(
                        null
                      );

                      setNewRequestOpen(
                        true
                      );
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    <Headphones className="h-4 w-4" />

                    New support request
                  </button>

                  <Link
                    href="/clinics/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
                  >
                    Dashboard

                    <HelpCircle className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              CONTENT
          ===================================================== */}

          <section className="px-4 py-7 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {error}
              </div>
            )}

            {sent && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />

                Your clinic support request has been sent.
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
              {/* LEFT */}

              <div className="space-y-6">
                {/* SUPPORT HISTORY */}

                <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Support requests
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Follow every request previously submitted by your clinic.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSent(
                          false
                        );

                        setError(
                          null
                        );

                        setNewRequestOpen(
                          true
                        );
                      }}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"
                    >
                      <Headphones className="h-4 w-4" />

                      New request
                    </button>
                  </div>

                  {tickets.length ===
                  0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <LifeBuoy className="mx-auto h-8 w-8 text-zinc-400" />

                      <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        No support request yet.
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Your submitted requests will appear here.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setNewRequestOpen(
                            true
                          )
                        }
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"
                      >
                        <Headphones className="h-4 w-4" />

                        Create your first request
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {tickets.map(
                        (
                          ticket
                        ) => {
                          const status =
                            safeString(
                              ticket.status
                            ).toLowerCase() ||
                            "open";

                          const statusClass =
                            status ===
                              "resolved" ||
                            status ===
                              "closed"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : status ===
                                  "in_progress" ||
                                status ===
                                  "in-progress"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";

                          const createdAtLabel =
                            formatDate(
                              ticket.createdAt
                            );

                          return (
                            <article
                              key={
                                ticket.id
                              }
                              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="font-black text-zinc-950 dark:text-white">
                                    {ticket.subject ||
                                      "Support request"}
                                  </div>

                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                    <span className="capitalize">
                                      {ticket.category ||
                                        "other"}
                                    </span>

                                    {createdAtLabel && (
                                      <>
                                        <span>
                                          •
                                        </span>

                                        <span>
                                          {createdAtLabel}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <span
                                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass}`}
                                >
                                  {status.replace(
                                    /_/g,
                                    " "
                                  )}
                                </span>
                              </div>

                              {ticket.message && (
                                <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
                                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                    Message sent
                                  </div>

                                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                    {ticket.message}
                                  </p>
                                </div>
                              )}
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT */}

              <aside className="space-y-5">
                <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                    <Headphones className="h-6 w-6" />
                  </div>

                  <h3 className="mt-4 text-base font-black text-zinc-950 dark:text-white">
                    Need assistance?
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Create a support request and keep the full request history directly on this page.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSent(
                        false
                      );

                      setError(
                        null
                      );

                      setNewRequestOpen(
                        true
                      );
                    }}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-500"
                  >
                    <Headphones className="h-5 w-5" />

                    New support request
                  </button>
                </div>

                <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <Headphones className="h-6 w-6 text-blue-700 dark:text-blue-300" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Support center
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Every request is stored under your clinic account so the Doc Chap support team can follow the case securely.
                  </p>
                </div>

                <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <Mail className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Before contacting support
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Include the appointment reference, payment reference or team member name when your request concerns a specific clinic operation.
                  </p>
                </div>

                <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Clinic account
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Clinic
                      </div>

                      <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                        {clinic.name}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Administrator
                      </div>

                      <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                        {clinic.ownerName}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Location
                      </div>

                      <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                        {clinic.city}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </main>

        {uid && (
          <ClinicNewSupportMessageModal
            open={
              newRequestOpen
            }
            clinicId={
              uid
            }
            clinicName={
              clinic.name
            }
            clinicOwner={
              clinic.ownerName
            }
            onClose={() =>
              setNewRequestOpen(
                false
              )
            }
            onCreated={() => {
              setNewRequestOpen(
                false
              );

              setSent(
                true
              );

              setError(
                null
              );
            }}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}