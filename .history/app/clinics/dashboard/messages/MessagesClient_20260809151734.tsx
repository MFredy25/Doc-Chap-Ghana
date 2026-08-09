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
} from "firebase/auth";

import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Headphones,
  Mail,
  MessageCircle,
  MessagesSquare,
  Plus,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";
import ClinicCreateNewMessageModal from "@/app/components/ClinicCreateNewMessageModal";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type ClinicProfileData = {
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
    email?: string;
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
  };
};

type MessageItem = {
  id: string;

  clinicId?: string;
  clinicName?: string;

  senderId?: string;
  senderType?: string;
  senderName?: string;

  recipientId?: string;
  recipientDocumentId?: string;
  recipientType?: string;
  recipientName?: string;

  subject?: string;

  text?: string;
  message?: string;
  content?: string;

  read?: boolean;
  direction?: string;
  status?: string;

  createdAt?: unknown;
  updatedAt?: unknown;
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
    value instanceof Timestamp
  ) {
    return value.toDate();
  }

  if (
    value instanceof Date
  ) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
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
    typeof value === "object" &&
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

function formatDateTime(
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

function recipientBadgeClass(
  type: string
): string {
  if (
    type === "doctor"
  ) {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";
  }

  if (
    type === "patient"
  ) {
    return "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300";
  }

  return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
}

function messageBody(
  item: MessageItem
): string {
  return (
    safeString(
      item.text
    ) ||
    safeString(
      item.message
    ) ||
    safeString(
      item.content
    ) ||
    "Message"
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function MessagesClient() {
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
    useState<ClinicProfileData | null>(
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
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null
    );

  const [
    messages,
    setMessages,
  ] =
    useState<MessageItem[]>(
      []
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    createMessageOpen,
    setCreateMessageOpen,
  ] =
    useState(false);

  /* ============================================================
     AUTHENTICATION + CLINIC
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
                  snapshot.data() as ClinicProfileData;

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
                  "[ClinicMessages] Clinic realtime error:",
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
     MESSAGES REALTIME
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

    return onSnapshot(
      collection(
        firestoreInstance,
        "clinics",
        clinicUid,
        "messages"
      ),
      (
        snapshot
      ) => {
        const rows =
          snapshot.docs.map(
            (
              item
            ) => ({
              id:
                item.id,

              ...(
                item.data() as Omit<
                  MessageItem,
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
            const aDate =
              toDate(
                a.createdAt
              )?.getTime() ||
              0;

            const bDate =
              toDate(
                b.createdAt
              )?.getTime() ||
              0;

            return (
              bDate -
              aDate
            );
          }
        );

        setMessages(
          rows
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicMessages] Messages realtime error:",
          snapshotError
        );

        setError(
          "Unable to load clinic messages."
        );
      }
    );
  }, [
    uid,
  ]);

  /* ============================================================
     COMPUTED
  ============================================================ */

  const clinic =
    useMemo(
      () => {
        const profile =
          safeObject(
            clinicData?.profile
          );

        const clinicInfo =
          safeObject(
            clinicData?.clinic
          );

        const verificationStatus =
          safeString(
            clinicInfo.verificationStatus
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

          email:
            safeString(
              profile.email
            ),

          verified:
            clinicInfo.verified ===
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

  const filteredMessages =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return messages;
        }

        return messages.filter(
          (
            item
          ) => {
            const haystack =
              [
                item.senderName,
                item.recipientName,
                item.recipientType,
                item.subject,
                messageBody(
                  item
                ),
              ]
                .map(
                  safeString
                )
                .join(
                  " "
                )
                .toLowerCase();

            return haystack.includes(
              term
            );
          }
        );
      },
      [
        messages,
        search,
      ]
    );

  const stats =
    useMemo(
      () => ({
        total:
          messages.length,

        doctors:
          messages.filter(
            (
              item
            ) =>
              safeString(
                item.recipientType
              ).toLowerCase() ===
              "doctor"
          ).length,

        patients:
          messages.filter(
            (
              item
            ) =>
              safeString(
                item.recipientType
              ).toLowerCase() ===
              "patient"
          ).length,

        support:
          messages.filter(
            (
              item
            ) =>
              safeString(
                item.recipientType
              ).toLowerCase() ===
              "support"
          ).length,
      }),
      [
        messages,
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
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200/80 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <MessagesSquare className="mx-auto h-8 w-8 text-blue-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading clinic messages...
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

            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
              <Link
                href="/clinics/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                Dashboard
              </Link>

              <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <MessagesSquare className="h-4 w-4 text-cyan-200" />

                      Clinic messaging
                    </span>

                    {clinic.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified clinic
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <Building2 className="h-4 w-4" />

                        Verification{" "}
                        {clinic.verificationStatus}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Messages
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Follow your clinic communications and create secure messages for doctors, patients or Doc Chap support.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Building2 className="h-4 w-4 text-cyan-200" />

                      {clinic.name}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <MessageCircle className="h-4 w-4 text-violet-200" />

                      {messages.length} message
                      {messages.length ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError(
                      null
                    );

                    setSuccess(
                      null
                    );

                    setCreateMessageOpen(
                      true
                    );
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />

                  Create new message
                </button>
              </div>
            </div>
          </section>

          {/* =====================================================
              CONTENT
          ===================================================== */}

          <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />

                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* =================================================
                  LEFT - HISTORY
              ================================================= */}

              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Message history
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Messages recorded under your clinic account.
                    </p>
                  </div>

                  <MessageCircle className="h-6 w-6 text-sky-600" />
                </div>

                <div className="relative mt-5">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search messages..."
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                {filteredMessages.length ===
                0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                    <MessageCircle className="mx-auto h-8 w-8 text-zinc-400" />

                    <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      No messages found.
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Click Create new message to start a conversation.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {filteredMessages.map(
                      (
                        item
                      ) => {
                        const type =
                          safeString(
                            item.recipientType
                          ).toLowerCase() ||
                          "recipient";

                        const dateLabel =
                          formatDateTime(
                            item.createdAt
                          );

                        return (
                          <article
                            key={
                              item.id
                            }
                            className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-sm font-black text-zinc-950 dark:text-white">
                                    {safeString(
                                      item.recipientName
                                    ) ||
                                      safeString(
                                        item.senderName
                                      ) ||
                                      "Conversation"}
                                  </h3>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${recipientBadgeClass(
                                      type
                                    )}`}
                                  >
                                    {type}
                                  </span>
                                </div>

                                {item.subject && (
                                  <p className="mt-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                    {item.subject}
                                  </p>
                                )}
                              </div>

                              {dateLabel && (
                                <span className="shrink-0 text-[11px] text-zinc-400">
                                  {dateLabel}
                                </span>
                              )}
                            </div>

                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                              {messageBody(
                                item
                              )}
                            </p>

                            <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-zinc-400">
                              <Mail className="h-3.5 w-3.5" />

                              {safeString(
                                item.status
                              ) ||
                                "sent"}
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>

              {/* =================================================
                  RIGHT
              ================================================= */}

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <MessagesSquare className="h-5 w-5" />
                  </div>

                  <div className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">
                    {stats.total}
                  </div>

                  <div className="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    Total messages
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Messages stored for this clinic.
                  </p>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Message recipients
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-3 dark:bg-blue-950/30">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <Stethoscope className="h-4 w-4 text-blue-600" />

                        Doctors
                      </div>

                      <span className="text-sm font-black text-zinc-950 dark:text-white">
                        {stats.doctors}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-violet-50 p-3 dark:bg-violet-950/30">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <UserRound className="h-4 w-4 text-violet-600" />

                        Patients
                      </div>

                      <span className="text-sm font-black text-zinc-950 dark:text-white">
                        {stats.patients}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <Headphones className="h-4 w-4 text-emerald-600" />

                        Support
                      </div>

                      <span className="text-sm font-black text-zinc-950 dark:text-white">
                        {stats.support}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <Headphones className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Doc Chap Support
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Use Create new message and select Support to contact the Doc Chap support team.
                  </p>
                </section>

                <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <MessageCircle className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    One messaging workspace
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Doctors, clinic patients and platform support can all be selected from the new message modal.
                  </p>
                </section>
              </aside>
            </div>
          </section>
        </main>

        {uid && (
          <ClinicCreateNewMessageModal
            open={
              createMessageOpen
            }
            clinicId={
              uid
            }
            clinicName={
              clinic.name
            }
            clinicEmail={
              clinic.email
            }
            onClose={() =>
              setCreateMessageOpen(
                false
              )
            }
            onCreated={() => {
              setCreateMessageOpen(
                false
              );

              setSuccess(
                "Message sent successfully."
              );
            }}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}