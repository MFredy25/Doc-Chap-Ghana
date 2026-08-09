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
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";

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
  Send,
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

type SupportCategory =
  | "technical"
  | "account"
  | "appointments"
  | "payments"
  | "team"
  | "other";

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

function WhatsAppIcon({
  className =
    "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={
        className
      }
      aria-hidden="true"
    >
      <path d="M19.11 17.47c-.27-.14-1.58-.78-1.82-.87-.24-.09-.42-.14-.6.14-.18.27-.69.87-.85 1.05-.16.18-.31.2-.58.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.56.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.14-.6-1.45-.82-1.98-.22-.52-.44-.45-.6-.46h-.51c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22 0 1.31.95 2.57 1.09 2.75.14.18 1.87 2.85 4.53 4 .63.27 1.12.43 1.5.55.63.2 1.2.17 1.65.1.5-.07 1.58-.65 1.8-1.27.22-.62.22-1.16.15-1.27-.06-.11-.24-.18-.51-.32Z" />
      <path d="M16.03 3C8.84 3 3 8.77 3 15.88c0 2.27.6 4.49 1.74 6.43L3 29l6.88-1.79a13.1 13.1 0 0 0 6.14 1.54h.01C23.22 28.75 29 22.98 29 15.87 29 8.77 23.22 3 16.03 3Zm0 23.58h-.01a10.9 10.9 0 0 1-5.55-1.51l-.4-.24-4.08 1.06 1.09-3.93-.26-.41a10.6 10.6 0 0 1-1.65-5.67c0-5.91 4.87-10.72 10.86-10.72 5.98 0 10.84 4.81 10.84 10.72 0 5.9-4.86 10.7-10.84 10.7Z" />
    </svg>
  );
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
    category,
    setCategory,
  ] =
    useState<SupportCategory>(
      "technical"
    );

  const [
    subject,
    setSubject,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    sending,
    setSending,
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
     SEND SUPPORT TICKET
  ============================================================ */

  async function sendTicket() {
    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      sending
    ) {
      return;
    }

    const firestoreInstance =
      firestore;

    const clinicUid =
      uid;

    const cleanSubject =
      subject.trim();

    const cleanMessage =
      message.trim();

    if (
      !cleanSubject ||
      !cleanMessage
    ) {
      setError(
        "Enter a subject and a message before sending your request."
      );

      return;
    }

    if (
      cleanSubject.length <
      3
    ) {
      setError(
        "Please enter a more descriptive subject."
      );

      return;
    }

    if (
      cleanMessage.length <
      10
    ) {
      setError(
        "Please provide a little more detail about your request."
      );

      return;
    }

    setSending(
      true
    );

    setSent(
      false
    );

    setError(
      null
    );

    try {
      await addDoc(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "supportTickets"
        ),
        {
          clinicId:
            clinicUid,

          clinicName:
            clinic.name,

          clinicOwner:
            clinic.ownerName,

          category,

          subject:
            cleanSubject,

          message:
            cleanMessage,

          status:
            "open",

          priority:
            "normal",

          application:
            "doc_chap_ghana",

          accountType:
            "clinic",

          country:
            "GH",

          locale:
            "en-GH",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setSubject("");
      setMessage("");
      setCategory(
        "technical"
      );
      setSent(true);
    } catch (
      sendError
    ) {
      console.error(
        "[ClinicSupport] Send error:",
        sendError
      );

      setError(
        "Unable to send your support request."
      );
    } finally {
      setSending(
        false
      );
    }
  }

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

                <Link
                  href="/clinics/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Dashboard

                  <HelpCircle className="h-4 w-4" />
                </Link>
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
                <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    Submit a support request
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Tell us what your clinic needs help with. Your request will be stored directly under your clinic account.
                  </p>

                  <div className="mt-5 space-y-5">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Category
                      </span>

                      <select
                        value={
                          category
                        }
                        onChange={(
                          event
                        ) =>
                          setCategory(
                            event.target
                              .value as SupportCategory
                          )
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="technical">
                          Technical issue
                        </option>

                        <option value="account">
                          Clinic account
                        </option>

                        <option value="appointments">
                          Appointments
                        </option>

                        <option value="payments">
                          Payments
                        </option>

                        <option value="team">
                          Healthcare team
                        </option>

                        <option value="other">
                          Other
                        </option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Subject
                      </span>

                      <input
                        value={
                          subject
                        }
                        onChange={(
                          event
                        ) => {
                          setSubject(
                            event.target
                              .value
                          );

                          setError(
                            null
                          );

                          setSent(
                            false
                          );
                        }}
                        placeholder="Briefly describe your request"
                        maxLength={
                          160
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />

                      <div className="mt-1 text-right text-[11px] text-zinc-400">
                        {subject.length}
                        /160
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Message
                      </span>

                      <textarea
                        value={
                          message
                        }
                        onChange={(
                          event
                        ) => {
                          setMessage(
                            event.target
                              .value
                          );

                          setError(
                            null
                          );

                          setSent(
                            false
                          );
                        }}
                        rows={7}
                        maxLength={
                          2500
                        }
                        placeholder="Explain what your clinic needs help with..."
                        className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />

                      <div className="mt-1 text-right text-[11px] text-zinc-400">
                        {message.length}
                        /2500
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        void sendTicket()
                      }
                      disabled={
                        sending
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />

                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />

                          Send request
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SUPPORT HISTORY */}

                <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Support requests
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Follow requests previously submitted by your clinic.
                      </p>
                    </div>

                    <LifeBuoy className="h-6 w-6 text-blue-600" />
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
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                                  {ticket.message}
                                </p>
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
                <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                    <WhatsAppIcon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-base font-black text-zinc-950 dark:text-white">
                    WhatsApp support
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Need quick assistance? Contact the Doc Chap support team directly on WhatsApp.
                  </p>

                  <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-white/70 px-4 py-3 dark:border-emerald-900/40 dark:bg-zinc-950/60">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      Support number
                    </div>

                    <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                      +225 07 48 31 65 44
                    </div>
                  </div>

                  <a
                    href="https://wa.me/2250748316544?text=Hello%20Doc%20Chap%20Support%2C%20I%20need%20assistance%20with%20my%20clinic%20account."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600"
                  >
                    <WhatsAppIcon className="h-5 w-5" />

                    Contact on WhatsApp
                  </a>
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

        <Footer />
      </div>
    </div>
  );
}