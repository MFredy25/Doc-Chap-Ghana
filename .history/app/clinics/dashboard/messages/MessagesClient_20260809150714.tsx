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
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Headphones,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  Search,
  Send,
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

type PatientDocument = {
  id: string;
  uid?: string;
  patientId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  status?: string;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
  };
};

type TeamMemberDocument = {
  id: string;
  uid?: string;
  professionalId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  role?: string;
  professionalType?: string;
  specialty?: string;
  active?: boolean;
  status?: string;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    specialty?: string;
  };

  professional?: {
    type?: string;
    specialty?: string;
  };
};

type RecipientType =
  | "doctor"
  | "patient"
  | "support";

type RecipientOption = {
  id: string;
  sourceDocumentId: string;
  type: RecipientType;
  name: string;
  subtitle: string;
  email: string;
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
      typeof candidate === "function"
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

function mapPatient(
  item: PatientDocument
): RecipientOption | null {
  if (
    item.active === false ||
    safeString(
      item.status
    ).toLowerCase() ===
      "disabled"
  ) {
    return null;
  }

  const profile =
    safeObject(
      item.profile
    );

  const firstName =
    safeString(
      item.firstName ||
        profile.firstName
    );

  const lastName =
    safeString(
      item.lastName ||
        profile.lastName
    );

  const name =
    safeString(
      item.fullName ||
        item.displayName ||
        profile.fullName ||
        profile.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Patient";

  return {
    id:
      safeString(
        item.patientId ||
          item.uid
      ) ||
      item.id,

    sourceDocumentId:
      item.id,

    type:
      "patient",

    name,

    subtitle:
      "Clinic patient",

    email:
      safeString(
        item.email ||
          profile.email
      ),
  };
}

function mapDoctor(
  item: TeamMemberDocument
): RecipientOption | null {
  const profile =
    safeObject(
      item.profile
    );

  const professional =
    safeObject(
      item.professional
    );

  const role =
    safeString(
      item.professionalType ||
        professional.type ||
        item.role
    ).toLowerCase();

  const doctor =
    [
      "doctor",
      "physician",
      "medical_doctor",
      "medical doctor",
    ].includes(
      role
    );

  if (
    !doctor ||
    item.active === false ||
    safeString(
      item.status
    ).toLowerCase() ===
      "disabled"
  ) {
    return null;
  }

  const firstName =
    safeString(
      item.firstName ||
        profile.firstName
    );

  const lastName =
    safeString(
      item.lastName ||
        profile.lastName
    );

  const rawName =
    safeString(
      item.fullName ||
        item.displayName ||
        profile.fullName ||
        profile.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Doctor";

  const name =
    /^dr\.?\s/i.test(
      rawName
    )
      ? rawName
      : `Dr. ${rawName}`;

  const specialty =
    safeString(
      item.specialty ||
        profile.specialty ||
        professional.specialty
    ) ||
    "Medical doctor";

  return {
    id:
      safeString(
        item.professionalId ||
          item.uid
      ) ||
      item.id,

    sourceDocumentId:
      item.id,

    type:
      "doctor",

    name,

    subtitle:
      specialty,

    email:
      safeString(
        item.email ||
          profile.email
      ),
  };
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
    patientsRaw,
    setPatientsRaw,
  ] =
    useState<
      PatientDocument[]
    >([]);

  const [
    teamRaw,
    setTeamRaw,
  ] =
    useState<
      TeamMemberDocument[]
    >([]);

  const [
    recipientType,
    setRecipientType,
  ] =
    useState<RecipientType>(
      "doctor"
    );

  const [
    recipientId,
    setRecipientId,
  ] =
    useState("");

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
    search,
    setSearch,
  ] =
    useState("");

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
     MESSAGES
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
     PATIENTS
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
        "patients"
      ),
      (
        snapshot
      ) => {
        setPatientsRaw(
          snapshot.docs.map(
            (
              item
            ) => ({
              id:
                item.id,

              ...(
                item.data() as Omit<
                  PatientDocument,
                  "id"
                >
              ),
            })
          )
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicMessages] Patients realtime error:",
          snapshotError
        );
      }
    );
  }, [
    uid,
  ]);

  /* ============================================================
     TEAM / DOCTORS
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
        "team"
      ),
      (
        snapshot
      ) => {
        setTeamRaw(
          snapshot.docs.map(
            (
              item
            ) => ({
              id:
                item.id,

              ...(
                item.data() as Omit<
                  TeamMemberDocument,
                  "id"
                >
              ),
            })
          )
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicMessages] Team realtime error:",
          snapshotError
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

  const doctors =
    useMemo(
      () =>
        teamRaw
          .map(
            mapDoctor
          )
          .filter(
            (
              item
            ): item is RecipientOption =>
              item !== null
          )
          .sort(
            (
              a,
              b
            ) =>
              a.name.localeCompare(
                b.name
              )
          ),
      [
        teamRaw,
      ]
    );

  const patients =
    useMemo(
      () =>
        patientsRaw
          .map(
            mapPatient
          )
          .filter(
            (
              item
            ): item is RecipientOption =>
              item !== null
          )
          .sort(
            (
              a,
              b
            ) =>
              a.name.localeCompare(
                b.name
              )
          ),
      [
        patientsRaw,
      ]
    );

  const supportRecipient =
    useMemo<RecipientOption>(
      () => ({
        id:
          "docchap-support",

        sourceDocumentId:
          "docchap-support",

        type:
          "support",

        name:
          "Doc Chap Support",

        subtitle:
          "Platform support team",

        email:
          "support@doc-chap.com",
      }),
      []
    );

  const recipients =
    useMemo(
      () => {
        if (
          recipientType ===
          "doctor"
        ) {
          return doctors;
        }

        if (
          recipientType ===
          "patient"
        ) {
          return patients;
        }

        return [
          supportRecipient,
        ];
      },
      [
        recipientType,
        doctors,
        patients,
        supportRecipient,
      ]
    );

  const selectedRecipient =
    useMemo(
      () => {
        if (
          recipientType ===
          "support"
        ) {
          return supportRecipient;
        }

        return (
          recipients.find(
            (
              item
            ) =>
              item.id ===
              recipientId
          ) ||
          null
        );
      },
      [
        recipientType,
        recipientId,
        recipients,
        supportRecipient,
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
     SEND MESSAGE
  ============================================================ */

  async function sendMessage() {
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

    if (
      !selectedRecipient
    ) {
      setError(
        "Select a recipient."
      );

      return;
    }

    const cleanSubject =
      subject.trim();

    const cleanMessage =
      message.trim();

    if (
      !cleanSubject
    ) {
      setError(
        "Enter a subject."
      );

      return;
    }

    if (
      cleanMessage.length <
      2
    ) {
      setError(
        "Enter your message."
      );

      return;
    }

    setSending(
      true
    );

    setError(
      null
    );

    setSuccess(
      null
    );

    try {
      await addDoc(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "messages"
        ),
        {
          clinicId:
            clinicUid,

          clinicName:
            clinic.name,

          senderId:
            clinicUid,

          senderType:
            "clinic",

          senderName:
            clinic.name,

          recipientId:
            selectedRecipient.id,

          recipientDocumentId:
            selectedRecipient.sourceDocumentId,

          recipientType:
            selectedRecipient.type,

          recipientName:
            selectedRecipient.name,

          recipientEmail:
            selectedRecipient.email ||
            null,

          subject:
            cleanSubject,

          text:
            cleanMessage,

          message:
            cleanMessage,

          content:
            cleanMessage,

          direction:
            "outgoing",

          status:
            "sent",

          read:
            false,

          channel:
            "internal",

          country:
            "GH",

          locale:
            "en-GH",

          timezone:
            "Africa/Accra",

          application:
            "doc_chap_ghana",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setSubject("");
      setMessage("");

      if (
        recipientType !==
        "support"
      ) {
        setRecipientId("");
      }

      setSuccess(
        `Message sent to ${selectedRecipient.name}.`
      );
    } catch (
      sendError
    ) {
      console.error(
        "[ClinicMessages] Send message error:",
        sendError
      );

      setError(
        "Unable to send the message."
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
      <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200/80 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

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
                    Send messages to your clinic doctors, patients or the Doc Chap support team from one workspace.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Building2 className="h-4 w-4 text-cyan-200" />

                      {clinic.name}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Stethoscope className="h-4 w-4 text-emerald-200" />

                      {doctors.length} doctor
                      {doctors.length ===
                      1
                        ? ""
                        : "s"}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Users className="h-4 w-4 text-violet-200" />

                      {patients.length} patient
                      {patients.length ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
              {/* =================================================
                  LEFT
              ================================================= */}

              <div className="space-y-6">
                {/* COMPOSER */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        New message
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Choose who should receive the clinic message.
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <Send className="h-5 w-5" />
                    </div>
                  </div>

                  {/* RECIPIENT TYPE */}

                  <div className="mt-6">
                    <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Send to
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {(
                        [
                          [
                            "doctor",
                            "Doctor",
                            Stethoscope,
                            `${doctors.length} available`,
                          ],
                          [
                            "patient",
                            "Patient",
                            UserRound,
                            `${patients.length} available`,
                          ],
                          [
                            "support",
                            "Support",
                            Headphones,
                            "Doc Chap support",
                          ],
                        ] as const
                      ).map(
                        (
                          [
                            value,
                            label,
                            Icon,
                            subtitle,
                          ]
                        ) => {
                          const selected =
                            recipientType ===
                            value;

                          return (
                            <button
                              key={
                                value
                              }
                              type="button"
                              onClick={() => {
                                setRecipientType(
                                  value
                                );

                                setRecipientId(
                                  ""
                                );

                                setError(
                                  null
                                );

                                setSuccess(
                                  null
                                );
                              }}
                              className={`rounded-2xl border p-4 text-left transition ${
                                selected
                                  ? "border-blue-500 bg-blue-50 ring-4 ring-blue-500/10 dark:bg-blue-950/30"
                                  : "border-zinc-200 bg-zinc-50 hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-900/60"
                              }`}
                            >
                              <Icon
                                className={`h-5 w-5 ${
                                  selected
                                    ? "text-blue-600"
                                    : "text-zinc-500"
                                }`}
                              />

                              <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                                {label}
                              </div>

                              <div className="mt-1 text-[11px] text-zinc-500">
                                {subtitle}
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* RECIPIENT */}

                  <div className="mt-5">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Recipient
                      </span>

                      {recipientType ===
                      "support" ? (
                        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                            <Headphones className="h-5 w-5" />
                          </div>

                          <div>
                            <div className="text-sm font-black text-zinc-950 dark:text-white">
                              Doc Chap Support
                            </div>

                            <div className="mt-1 text-xs text-zinc-500">
                              Platform support team
                            </div>
                          </div>
                        </div>
                      ) : (
                        <select
                          value={
                            recipientId
                          }
                          onChange={(
                            event
                          ) => {
                            setRecipientId(
                              event.target
                                .value
                            );

                            setError(
                              null
                            );

                            setSuccess(
                              null
                            );
                          }}
                          className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        >
                          <option value="">
                            {recipientType ===
                            "doctor"
                              ? "Select a doctor"
                              : "Select a patient"}
                          </option>

                          {recipients.map(
                            (
                              recipient
                            ) => (
                              <option
                                key={
                                  `${recipient.type}:${recipient.id}`
                                }
                                value={
                                  recipient.id
                                }
                              >
                                {recipient.name} —{" "}
                                {recipient.subtitle}
                              </option>
                            )
                          )}
                        </select>
                      )}
                    </label>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4">
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

                          setSuccess(
                            null
                          );
                        }}
                        maxLength={
                          160
                        }
                        placeholder="Message subject"
                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
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

                          setSuccess(
                            null
                          );
                        }}
                        rows={7}
                        maxLength={
                          3000
                        }
                        placeholder="Write your message..."
                        className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />

                      <div className="mt-1 text-right text-[11px] text-zinc-400">
                        {message.length}
                        /3000
                      </div>
                    </label>
                  </div>

                  {selectedRecipient && (
                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
                        Selected recipient
                      </div>

                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-zinc-950">
                          {selectedRecipient.type ===
                          "doctor" ? (
                            <Stethoscope className="h-5 w-5" />
                          ) : selectedRecipient.type ===
                            "patient" ? (
                            <UserRound className="h-5 w-5" />
                          ) : (
                            <Headphones className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
                            {selectedRecipient.name}
                          </div>

                          <div className="mt-1 truncate text-xs text-zinc-500">
                            {selectedRecipient.subtitle}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      void sendMessage()
                    }
                    disabled={
                      sending
                    }
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />

                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />

                        Send message
                      </>
                    )}
                  </button>
                </section>

                {/* MESSAGE HISTORY */}

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
                        Sent messages will appear here in real time.
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
              </div>

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
                    Recipients
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
                    Select Support in the composer to send a message directly to the platform support queue.
                  </p>
                </section>

                <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <Users className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Available contacts
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/80 p-4 text-center dark:bg-zinc-950/60">
                      <div className="text-2xl font-black text-zinc-950 dark:text-white">
                        {doctors.length}
                      </div>

                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        Doctors
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/80 p-4 text-center dark:bg-zinc-950/60">
                      <div className="text-2xl font-black text-zinc-950 dark:text-white">
                        {patients.length}
                      </div>

                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        Patients
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <MessageCircle className="h-6 w-6 text-sky-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Clinic messaging
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Every message is recorded with the clinic, sender, recipient type and recipient identifier so the communication remains attached to the correct clinic account.
                  </p>
                </section>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}