"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  BellRing,
  CalendarCheck2,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserRound,
  Video,
  X,
} from "lucide-react";

import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type NotificationCategory =
  | "appointment"
  | "teleconsultation"
  | "phone"
  | "payment"
  | "patient"
  | "account"
  | "system";

type NotificationSource =
  | "notification"
  | "appointment";

type NotificationItem = {
  id: string;
  sourceId: string;
  source: NotificationSource;

  title: string;
  body: string;

  category: NotificationCategory;

  read: boolean;
  createdAt: Date;

  href?: string;

  appointmentId?: string;
  patientName?: string;

  status?: string;
  amount?: number;
  currency?: string;

  synthetic?: boolean;
};

type DoctorView = {
  name: string;
  firstName: string;
  specialty: string;
  city: string;
  country: string;
  verified: boolean;
  verificationStatus: string;
};

type FilterKey =
  | "all"
  | "unread"
  | "appointment"
  | "teleconsultation"
  | "payment"
  | "account";

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

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return parsed;
    }
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in
      (value as any) &&
    typeof (value as any)
      .toDate === "function"
  ) {
    try {
      return (
        value as any
      ).toDate();
    } catch {
      return null;
    }
  }

  return null;
}

function numericValue(
  value: unknown
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const parsed =
      Number(
        value
          .replace(
            /[^0-9.,-]/g,
            ""
          )
          .replace(",", ".")
      );

    if (
      Number.isFinite(parsed)
    ) {
      return parsed;
    }
  }

  return 0;
}

function formatMoney(
  amount: number,
  currency = "GHS"
): string {
  const normalizedCurrency =
    safeString(currency)
      .toUpperCase() ||
    "GHS";

  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style: "currency",
        currency:
          normalizedCurrency,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  } catch {
    return `${amount.toFixed(
      2
    )} ${normalizedCurrency}`;
  }
}

function formatNotificationDate(
  date: Date
): string {
  const now = new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const minutes =
    Math.floor(
      difference /
        (60 * 1000)
    );

  const hours =
    Math.floor(
      difference /
        (60 * 60 * 1000)
    );

  const days =
    Math.floor(
      difference /
        (24 * 60 * 60 * 1000)
    );

  if (
    minutes >= 0 &&
    minutes < 1
  ) {
    return "Just now";
  }

  if (
    minutes >= 1 &&
    minutes < 60
  ) {
    return `${minutes} min ago`;
  }

  if (
    hours >= 1 &&
    hours < 24
  ) {
    return `${hours}h ago`;
  }

  if (
    days === 1
  ) {
    return "Yesterday";
  }

  if (
    days > 1 &&
    days < 7
  ) {
    return `${days} days ago`;
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "2-digit",
      month: "short",
      year:
        date.getFullYear() !==
        now.getFullYear()
          ? "numeric"
          : undefined,
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function mapDoctor(
  data: unknown
): DoctorView {
  const root =
    safeObject(data);

  const profile =
    safeObject(
      root.profile
    );

  const professional =
    safeObject(
      root.professional
    );

  const firstName =
    safeString(
      profile.firstName
    );

  const lastName =
    safeString(
      profile.lastName
    );

  const displayName =
    safeString(
      profile.displayName
    ) ||
    safeString(
      profile.fullName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Doctor";

  const specialty =
    safeString(
      professional.specialty
    ) ||
    safeString(
      professional.speciality
    ) ||
    safeString(
      profile.specialty
    ) ||
    safeString(
      profile.speciality
    ) ||
    "Medical professional";

  const city =
    safeString(
      profile.city
    ) ||
    safeString(
      profile.region
    ) ||
    "Ghana";

  const verificationStatus =
    safeString(
      professional.verificationStatus
    ).toLowerCase() ||
    safeString(
      root.verificationStatus
    ).toLowerCase() ||
    "pending";

  const verified =
    professional.verified ===
      true ||
    verificationStatus ===
      "verified" ||
    verificationStatus ===
      "approved";

  return {
    name: displayName,

    firstName:
      firstName ||
      displayName
        .split(" ")
        .at(0) ||
      "Doctor",

    specialty,

    city,

    country:
      safeString(
        profile.country
      ) ||
      "Ghana",

    verified,

    verificationStatus,
  };
}

/* ============================================================
   NOTIFICATION MAPPING
============================================================ */

function inferCategory(
  data: Record<string, any>
): NotificationCategory {
  const raw =
    `${safeString(
      data.category
    )} ${safeString(
      data.type
    )} ${safeString(
      data.eventType
    )} ${safeString(
      data.title
    )} ${safeString(
      data.body
    )} ${safeString(
      data.message
    )}`.toLowerCase();

  if (
    raw.includes(
      "teleconsult"
    ) ||
    raw.includes("video") ||
    raw.includes("visio")
  ) {
    return "teleconsultation";
  }

  if (
    raw.includes("phone") ||
    raw.includes("call")
  ) {
    return "phone";
  }

  if (
    raw.includes("payment") ||
    raw.includes("paid") ||
    raw.includes("invoice") ||
    raw.includes("fee") ||
    raw.includes("refund")
  ) {
    return "payment";
  }

  if (
    raw.includes(
      "appointment"
    ) ||
    raw.includes("booking") ||
    raw.includes("rendez")
  ) {
    return "appointment";
  }

  if (
    raw.includes("patient")
  ) {
    return "patient";
  }

  if (
    raw.includes(
      "verification"
    ) ||
    raw.includes("account") ||
    raw.includes("profile") ||
    raw.includes("kyc")
  ) {
    return "account";
  }

  return "system";
}

function mapStoredNotification(
  id: string,
  data: Record<string, any>
): NotificationItem {
  const category =
    inferCategory(data);

  const appointmentId =
    safeString(
      data.appointmentId
    ) ||
    safeString(
      data.referenceId
    ) ||
    undefined;

  const href =
    safeString(data.href) ||
    safeString(data.url) ||
    (
      appointmentId
        ? `/doctors/dashboard/appointments/${appointmentId}`
        : category ===
            "payment"
        ? "/doctors/dashboard/finances"
        : category ===
            "teleconsultation"
        ? "/doctors/dashboard/teleconsultation"
        : undefined
    );

  return {
    id: `notification:${id}`,
    sourceId: id,
    source:
      "notification",

    title:
      safeString(
        data.title
      ) ||
      "Notification",

    body:
      safeString(
        data.body
      ) ||
      safeString(
        data.message
      ) ||
      safeString(
        data.text
      ) ||
      "You have a new notification.",

    category,

    read:
      data.read === true ||
      data.seen === true,

    createdAt:
      toDate(
        data.createdAt
      ) ||
      toDate(
        data.updatedAt
      ) ||
      new Date(),

    href,

    appointmentId,

    patientName:
      safeString(
        data.patientName
      ) ||
      safeString(
        data.patientDisplayName
      ) ||
      undefined,

    status:
      safeString(
        data.status
      ) ||
      undefined,

    amount:
      numericValue(
        data.amount
      ) || undefined,

    currency:
      safeString(
        data.currency
      ).toUpperCase() ||
      undefined,

    synthetic: false,
  };
}

/* ============================================================
   APPOINTMENT-DERIVED NOTIFICATIONS
============================================================ */

function isCancelled(
  value: unknown
): boolean {
  const normalized =
    safeString(value)
      .toLowerCase();

  return [
    "cancelled",
    "canceled",
    "cancelled_by_doctor",
    "cancelled_by_patient",
    "canceled_by_doctor",
    "canceled_by_patient",
  ].includes(normalized);
}

function isCompleted(
  value: unknown
): boolean {
  const normalized =
    safeString(value)
      .toLowerCase();

  return [
    "completed",
    "complete",
    "finished",
    "done",
    "termine",
    "terminé",
  ].includes(normalized);
}

function getAppointmentMode(
  data: Record<string, any>
): "in_person" | "video" | "phone" {
  const raw =
    `${safeString(
      data.appointmentType
    )} ${safeString(
      data.type
    )} ${safeString(
      data.typeV2
    )} ${safeString(
      data.mode
    )}`.toLowerCase();

  if (
    raw.includes("phone") ||
    raw.includes("call")
  ) {
    return "phone";
  }

  if (
    raw.includes(
      "tele"
    ) ||
    raw.includes("video") ||
    raw.includes("visio")
  ) {
    return "video";
  }

  return "in_person";
}

function getAppointmentPatientName(
  data: Record<string, any>
): string {
  const patientSummary =
    safeObject(
      data.patientSummary
    );

  return (
    safeString(
      data.patientName
    ) ||
    safeString(
      data.patientDisplayName
    ) ||
    safeString(
      patientSummary.displayName
    ) ||
    safeString(
      patientSummary.fullName
    ) ||
    "Patient"
  );
}

function getAppointmentAmount(
  data: Record<string, any>
): number {
  const payment =
    safeObject(
      data.payment
    );

  const candidates = [
    payment.netAmount,
    payment.amount,
    payment.grossAmount,
    payment.totalAmount,
    data.amount,
    data.totalAmount,
    data.consultationFee,
    data.teleconsultationFee,
  ];

  for (
    const candidate of candidates
  ) {
    const amount =
      numericValue(
        candidate
      );

    if (
      amount > 0
    ) {
      return amount;
    }
  }

  return 0;
}

function getAppointmentCurrency(
  data: Record<string, any>
): string {
  const payment =
    safeObject(
      data.payment
    );

  return (
    safeString(
      payment.currency
    ).toUpperCase() ||
    safeString(
      data.currency
    ).toUpperCase() ||
    "GHS"
  );
}

function isAppointmentPaid(
  data: Record<string, any>
): boolean {
  const payment =
    safeObject(
      data.payment
    );

  const raw =
    `${safeString(
      data.paymentStatus
    )} ${safeString(
      payment.status
    )}`.toLowerCase();

  return (
    [
      "paid",
      "success",
      "succeeded",
      "completed",
      "complete",
    ].some((status) =>
      raw.includes(status)
    ) ||
    Boolean(
      payment.paidAt
    )
  );
}

function createAppointmentNotification(
  appointmentId: string,
  data: Record<string, any>
): NotificationItem | null {
  const startAt =
    toDate(
      data.startAt
    ) ||
    toDate(
      data.appointmentDate
    ) ||
    toDate(
      data.date
    );

  if (!startAt) {
    return null;
  }

  const patientName =
    getAppointmentPatientName(
      data
    );

  const mode =
    getAppointmentMode(
      data
    );

  const now =
    new Date();

  const durationMinutes =
    Number(
      data.durationMinutes
    ) > 0
      ? Number(
          data.durationMinutes
        )
      : 30;

  const endAt =
    new Date(
      startAt.getTime() +
        durationMinutes *
          60 *
          1000
    );

  const createdAt =
    toDate(
      data.createdAt
    ) ||
    toDate(
      data.updatedAt
    ) ||
    startAt;

  const paymentAmount =
    getAppointmentAmount(
      data
    );

  const currency =
    getAppointmentCurrency(
      data
    );

  const paid =
    isAppointmentPaid(
      data
    );

  let title =
    "Appointment scheduled";

  let body =
    `${patientName} has an appointment scheduled for ${new Intl.DateTimeFormat(
      "en-GH",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(startAt)}.`;

  let category:
    NotificationCategory =
      "appointment";

  if (
    mode === "video"
  ) {
    title =
      "Teleconsultation scheduled";

    body =
      `${patientName} has a video consultation scheduled for ${new Intl.DateTimeFormat(
        "en-GH",
        {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }
      ).format(startAt)}.`;

    category =
      "teleconsultation";
  }

  if (
    mode === "phone"
  ) {
    title =
      "Phone consultation scheduled";

    body =
      `${patientName} has a phone consultation scheduled for ${new Intl.DateTimeFormat(
        "en-GH",
        {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }
      ).format(startAt)}.`;

    category = "phone";
  }

  if (
    isCancelled(
      data.status
    )
  ) {
    title =
      "Appointment cancelled";

    body =
      `${patientName}'s consultation has been cancelled.`;
  } else if (
    isCompleted(
      data.status
    ) ||
    now >= endAt
  ) {
    title =
      mode === "video"
        ? "Teleconsultation completed"
        : mode === "phone"
        ? "Phone consultation completed"
        : "Appointment completed";

    body =
      `${patientName}'s consultation is completed.`;
  } else if (
    now >= startAt &&
    now < endAt
  ) {
    title =
      mode === "video"
        ? "Teleconsultation in progress"
        : mode === "phone"
        ? "Phone consultation in progress"
        : "Appointment in progress";

    body =
      `${patientName}'s consultation is currently in progress.`;
  } else {
    const minutesUntil =
      Math.floor(
        (startAt.getTime() -
          now.getTime()) /
          (60 * 1000)
      );

    if (
      minutesUntil >= 0 &&
      minutesUntil <= 60
    ) {
      title =
        mode === "video"
          ? "Teleconsultation starting soon"
          : mode === "phone"
          ? "Phone consultation starting soon"
          : "Appointment starting soon";

      body =
        `${patientName}'s consultation starts in approximately ${Math.max(
          minutesUntil,
          1
        )} minute${
          minutesUntil === 1
            ? ""
            : "s"
        }.`;
    }
  }

  if (
    paid &&
    paymentAmount > 0
  ) {
    body += ` Payment received: ${formatMoney(
      paymentAmount,
      currency
    )}.`;
  }

  return {
    id:
      `appointment:${appointmentId}`,
    sourceId:
      appointmentId,
    source:
      "appointment",

    title,
    body,

    category,

    read: true,

    createdAt,

    href:
      `/doctors/dashboard/appointments/${appointmentId}`,

    appointmentId,

    patientName,

    status:
      safeString(
        data.status
      ) ||
      undefined,

    amount:
      paymentAmount ||
      undefined,

    currency,

    synthetic: true,
  };
}

/* ============================================================
   UI HELPERS
============================================================ */

function categoryMeta(
  category:
    NotificationCategory
): {
  label: string;
  icon: React.ElementType;
  iconClass: string;
  badgeClass: string;
} {
  if (
    category ===
    "teleconsultation"
  ) {
    return {
      label:
        "Teleconsultation",
      icon: Video,
      iconClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
      badgeClass:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-300",
    };
  }

  if (
    category === "phone"
  ) {
    return {
      label:
        "Phone consultation",
      icon: Smartphone,
      iconClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      badgeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300",
    };
  }

  if (
    category === "payment"
  ) {
    return {
      label: "Payment",
      icon: CreditCard,
      iconClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      badgeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300",
    };
  }

  if (
    category === "patient"
  ) {
    return {
      label: "Patient",
      icon: UserRound,
      iconClass:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
      badgeClass:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-300",
    };
  }

  if (
    category === "account"
  ) {
    return {
      label: "Account",
      icon: ShieldCheck,
      iconClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      badgeClass:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300",
    };
  }

  if (
    category ===
    "appointment"
  ) {
    return {
      label: "Appointment",
      icon:
        CalendarCheck2,
      iconClass:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
      badgeClass:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300",
    };
  }

  return {
    label: "System",
    icon: BellRing,
    iconClass:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    badgeClass:
      "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
  };
}

function filterLabel(
  filter: FilterKey
): string {
  if (
    filter === "all"
  ) {
    return "All";
  }

  if (
    filter === "unread"
  ) {
    return "Unread";
  }

  if (
    filter ===
    "appointment"
  ) {
    return "Appointments";
  }

  if (
    filter ===
    "teleconsultation"
  ) {
    return "Teleconsultations";
  }

  if (
    filter ===
    "payment"
  ) {
    return "Payments";
  }

  return "Account";
}

/* ============================================================
   PAGE
============================================================ */

export default function NotificationsClient() {
  const router =
    useRouter();

  const [
    authLoading,
    setAuthLoading,
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
    firebaseUser,
    setFirebaseUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    doctorData,
    setDoctorData,
  ] =
    useState<any>(null);

  const [
    accessError,
    setAccessError,
  ] =
    useState<string | null>(
      null
    );

  const [
    storedNotifications,
    setStoredNotifications,
  ] =
    useState<
      NotificationItem[]
    >([]);

  const [
    appointmentNotifications,
    setAppointmentNotifications,
  ] =
    useState<
      NotificationItem[]
    >([]);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<FilterKey>(
      "all"
    );

  const [
    markingAll,
    setMarkingAll,
  ] =
    useState(false);

  const [
    processingId,
    setProcessingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    actionError,
    setActionError,
  ] =
    useState<string | null>(
      null
    );

  /* ============================================================
     AUTH GUARD
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
      setAccessError(
        "Firebase is not initialized. Check your Firebase environment variables."
      );

      setAuthLoading(
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
            setUid(null);
            setFirebaseUser(
              null
            );

            router.replace(
              "/doctors/login"
            );

            return;
          }

          setFirebaseUser(
            user
          );

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
              professionalType &&
              professionalType !==
                "doctor"
            ) {
              await signOut(
                firebaseAuthInstance
              );

              router.replace(
                "/doctors/login"
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

            setAccessError(
              null
            );
          } catch (
            error
          ) {
            console.error(
              "[DoctorNotifications] Auth guard error:",
              error
            );

            setAccessError(
              "Unable to verify your doctor account."
            );
          } finally {
            setAuthLoading(
              false
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [router]);

  /* ============================================================
     DOCTOR PROFILE REALTIME
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

    const unsubscribe =
      onSnapshot(
        doc(
          firestoreInstance,
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
          error
        ) => {
          console.error(
            "[DoctorNotifications] Doctor realtime error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, [uid]);

  /* ============================================================
     STORED NOTIFICATIONS REALTIME
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

    const notificationsRef =
      collection(
        firestoreInstance,
        "professionals",
        uid,
        "notifications"
      );

    const notificationsQuery =
      query(
        notificationsRef,
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribe =
      onSnapshot(
        notificationsQuery,
        (
          snapshot
        ) => {
          const mapped =
            snapshot.docs.map(
              (
                notificationDoc
              ) =>
                mapStoredNotification(
                  notificationDoc.id,
                  notificationDoc.data()
                )
            );

          setStoredNotifications(
            mapped
          );
        },
        (
          error
        ) => {
          console.error(
            "[DoctorNotifications] Stored notifications error:",
            error
          );

          setStoredNotifications(
            []
          );
        }
      );

    return () =>
      unsubscribe();
  }, [uid]);

  /* ============================================================
     APPOINTMENT NOTIFICATIONS REALTIME
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

    const appointmentsRef =
      collection(
        firestoreInstance,
        "professionals",
        uid,
        "appointments"
      );

    const unsubscribe =
      onSnapshot(
        appointmentsRef,
        (
          snapshot
        ) => {
          const mapped =
            snapshot.docs
              .map(
                (
                  appointmentDoc
                ) =>
                  createAppointmentNotification(
                    appointmentDoc.id,
                    appointmentDoc.data()
                  )
              )
              .filter(
                (
                  item
                ): item is NotificationItem =>
                  item !== null
              );

          setAppointmentNotifications(
            mapped
          );
        },
        (
          error
        ) => {
          console.error(
            "[DoctorNotifications] Appointment notifications error:",
            error
          );

          setAppointmentNotifications(
            []
          );
        }
      );

    return () =>
      unsubscribe();
  }, [uid]);

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
      [doctorData]
    );

  const allNotifications =
    useMemo(() => {
      const storedAppointmentIds =
        new Set(
          storedNotifications
            .map(
              (
                notification
              ) =>
                notification.appointmentId
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        );

      const generatedWithoutDuplicates =
        appointmentNotifications.filter(
          (
            notification
          ) =>
            !notification.appointmentId ||
            !storedAppointmentIds.has(
              notification.appointmentId
            )
        );

      return [
        ...storedNotifications,
        ...generatedWithoutDuplicates,
      ].sort(
        (
          first,
          second
        ) =>
          second.createdAt.getTime() -
          first.createdAt.getTime()
      );
    }, [
      storedNotifications,
      appointmentNotifications,
    ]);

  const unreadCount =
    useMemo(
      () =>
        storedNotifications.filter(
          (
            notification
          ) =>
            !notification.read
        ).length,
      [storedNotifications]
    );

  const appointmentCount =
    useMemo(
      () =>
        allNotifications.filter(
          (
            notification
          ) =>
            notification.category ===
              "appointment" ||
            notification.category ===
              "phone" ||
            notification.category ===
              "teleconsultation"
        ).length,
      [allNotifications]
    );

  const teleconsultationCount =
    useMemo(
      () =>
        allNotifications.filter(
          (
            notification
          ) =>
            notification.category ===
            "teleconsultation"
        ).length,
      [allNotifications]
    );

  const paymentCount =
    useMemo(
      () =>
        allNotifications.filter(
          (
            notification
          ) =>
            notification.category ===
            "payment"
        ).length,
      [allNotifications]
    );

  const filteredNotifications =
    useMemo(() => {
      const queryValue =
        search
          .trim()
          .toLowerCase();

      return allNotifications.filter(
        (
          notification
        ) => {
          const matchesSearch =
            !queryValue ||
            notification.title
              .toLowerCase()
              .includes(
                queryValue
              ) ||
            notification.body
              .toLowerCase()
              .includes(
                queryValue
              ) ||
            safeString(
              notification.patientName
            )
              .toLowerCase()
              .includes(
                queryValue
              );

          if (
            !matchesSearch
          ) {
            return false;
          }

          if (
            activeFilter ===
            "all"
          ) {
            return true;
          }

          if (
            activeFilter ===
            "unread"
          ) {
            return (
              notification.source ===
                "notification" &&
              !notification.read
            );
          }

          if (
            activeFilter ===
            "appointment"
          ) {
            return (
              notification.category ===
                "appointment" ||
              notification.category ===
                "phone"
            );
          }

          return (
            notification.category ===
            activeFilter
          );
        }
      );
    }, [
      allNotifications,
      activeFilter,
      search,
    ]);

  const filters:
    {
      key: FilterKey;
      count?: number;
    }[] = [
      {
        key: "all",
        count:
          allNotifications.length,
      },
      {
        key: "unread",
        count:
          unreadCount,
      },
      {
        key:
          "appointment",
        count:
          appointmentCount,
      },
      {
        key:
          "teleconsultation",
        count:
          teleconsultationCount,
      },
      {
        key: "payment",
        count:
          paymentCount,
      },
      {
        key: "account",
      },
    ];

  /* ============================================================
     ACTIONS
  ============================================================ */

  async function markAsRead(
    notification:
      NotificationItem
  ) {
    if (
      notification.source !==
        "notification" ||
      notification.read ||
      processingId
    ) {
      return;
    }

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

    setProcessingId(
      notification.id
    );

    setActionError(
      null
    );

    try {
      await updateDoc(
        doc(
          firestoreInstance,
          "professionals",
          uid,
          "notifications",
          notification.sourceId
        ),
        {
          read: true,
          seen: true,
          readAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (
      error
    ) {
      console.error(
        "[DoctorNotifications] Mark as read error:",
        error
      );

      setActionError(
        "Unable to mark this notification as read."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }

  async function markAllAsRead() {
    if (
      markingAll ||
      unreadCount === 0
    ) {
      return;
    }

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

    const unread =
      storedNotifications.filter(
        (
          notification
        ) =>
          !notification.read
      );

    if (
      unread.length === 0
    ) {
      return;
    }

    setMarkingAll(true);
    setActionError(null);

    try {
      const batch =
        writeBatch(
          firestoreInstance
        );

      unread.forEach(
        (
          notification
        ) => {
          batch.update(
            doc(
              firestoreInstance,
              "professionals",
              uid,
              "notifications",
              notification.sourceId
            ),
            {
              read: true,
              seen: true,
              readAt:
                serverTimestamp(),
              updatedAt:
                serverTimestamp(),
            }
          );
        }
      );

      await batch.commit();
    } catch (
      error
    ) {
      console.error(
        "[DoctorNotifications] Mark all as read error:",
        error
      );

      setActionError(
        "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function openNotification(
    notification:
      NotificationItem
  ) {
    if (
      notification.source ===
        "notification" &&
      !notification.read
    ) {
      await markAsRead(
        notification
      );
    }

    if (
      notification.href
    ) {
      router.push(
        notification.href
      );
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (
    authLoading
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <DoctorSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <div className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading notifications...
              </div>

              <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Checking your Doc Chap Ghana doctor account.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ============================================================
     ACCESS ERROR
  ============================================================ */

  if (
    accessError
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <DoctorSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/40 dark:bg-zinc-950">
              <AlertCircle className="h-8 w-8 text-red-600" />

              <h1 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                Unable to open notifications
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {accessError}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.replace(
                    "/doctors/login"
                  )
                }
                className="mt-5 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Return to login
              </button>
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
              BANNER
          ===================================================== */}

          <section className="relative overflow-hidden border-b border-blue-950/25 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-36 left-[28%] h-[25rem] w-[25rem] rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-28 top-10 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />

            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
              <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                      <BellRing className="h-4 w-4 text-cyan-300" />
                      Notifications center
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
                        {doctor.verificationStatus ||
                          "pending"}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                    Stay up to date,
                    <br className="hidden sm:block" />{" "}
                    {doctor.firstName}
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                    Follow appointments, teleconsultations, phone consultations, payments, patients and important account activity from one place.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-md">
                      <Stethoscope className="h-4 w-4 text-cyan-300" />
                      {doctor.specialty}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-md">
                      <Bell className="h-4 w-4 text-red-300" />
                      {unreadCount} unread
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-md">
                      <CalendarCheck2 className="h-4 w-4 text-indigo-300" />
                      {appointmentCount} appointment updates
                    </span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:flex-col">
                  <Link
                    href="/doctors/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      void markAllAsRead()
                    }
                    disabled={
                      markingAll ||
                      unreadCount === 0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-[#071b3a] shadow-xl transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {markingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckCheck className="h-4 w-4" />
                        Mark all as read
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              KPI
          ===================================================== */}

          <section className="w-full px-4 pt-6 sm:px-6 lg:px-10">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  <BellRing className="h-5 w-5" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {unreadCount}
                </div>

                <div className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Unread
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <CalendarCheck2 className="h-5 w-5" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {appointmentCount}
                </div>

                <div className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Appointment updates
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  <Video className="h-5 w-5" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {teleconsultationCount}
                </div>

                <div className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Teleconsultations
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CreditCard className="h-5 w-5" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {paymentCount}
                </div>

                <div className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Payment updates
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              FILTERS + LIST
          ===================================================== */}

          <section className="w-full px-4 py-6 sm:px-6 lg:px-10 lg:pb-12">
            {actionError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <div className="min-w-0 flex-1">
                    {actionError}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActionError(
                        null
                      )
                    }
                    className="shrink-0"
                    aria-label="Close error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-zinc-950 dark:text-white">
                    <Filter className="h-4 w-4 text-blue-600" />
                    Notification feed
                  </div>

                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Stored notifications and appointment activity are synchronized in real time.
                  </p>
                </div>

                <div className="relative w-full xl:max-w-sm">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search notifications..."
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {filters.map(
                  (
                    filter
                  ) => (
                    <button
                      key={
                        filter.key
                      }
                      type="button"
                      onClick={() =>
                        setActiveFilter(
                          filter.key
                        )
                      }
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                        activeFilter ===
                        filter.key
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {filterLabel(
                        filter.key
                      )}

                      {typeof filter.count ===
                        "number" && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                            activeFilter ===
                            filter.key
                              ? "bg-white/20 text-white"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          {
                            filter.count
                          }
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-5">
              {filteredNotifications.length ===
              0 ? (
                <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-950">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>

                  <h2 className="mt-4 text-base font-black text-zinc-950 dark:text-white">
                    No notifications found
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    There are no notifications matching your current filters. New appointment and account activity will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map(
                    (
                      notification
                    ) => {
                      const meta =
                        categoryMeta(
                          notification.category
                        );

                      const Icon =
                        meta.icon;

                      const isProcessing =
                        processingId ===
                        notification.id;

                      return (
                        <article
                          key={
                            notification.id
                          }
                          className={`relative overflow-hidden rounded-[24px] border bg-white p-4 shadow-sm transition sm:p-5 dark:bg-zinc-950 ${
                            notification.source ===
                              "notification" &&
                            !notification.read
                              ? "border-blue-200 ring-1 ring-blue-500/5 dark:border-blue-900/50"
                              : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          {notification.source ===
                            "notification" &&
                            !notification.read && (
                              <div className="absolute inset-y-0 left-0 w-1 bg-blue-600" />
                            )}

                          <div className="flex items-start gap-3 sm:gap-4">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.iconClass}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                                      {
                                        notification.title
                                      }
                                    </h3>

                                    <span
                                      className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold ${meta.badgeClass}`}
                                    >
                                      {
                                        meta.label
                                      }
                                    </span>

                                    {notification.source ===
                                      "notification" &&
                                      !notification.read && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold text-white">
                                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                          New
                                        </span>
                                      )}

                                    {notification.synthetic && (
                                      <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                                        Live activity
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                    {
                                      notification.body
                                    }
                                  </p>

                                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-zinc-400">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock3 className="h-3.5 w-3.5" />
                                      {formatNotificationDate(
                                        notification.createdAt
                                      )}
                                    </span>

                                    {notification.patientName && (
                                      <span className="inline-flex items-center gap-1.5">
                                        <UserRound className="h-3.5 w-3.5" />
                                        {
                                          notification.patientName
                                        }
                                      </span>
                                    )}

                                    {notification.amount &&
                                      notification.amount >
                                        0 && (
                                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                                          <CreditCard className="h-3.5 w-3.5" />
                                          {formatMoney(
                                            notification.amount,
                                            notification.currency ||
                                              "GHS"
                                          )}
                                        </span>
                                      )}
                                  </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  {notification.source ===
                                    "notification" &&
                                    !notification.read && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void markAsRead(
                                            notification
                                          )
                                        }
                                        disabled={
                                          isProcessing
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                                      >
                                        {isProcessing ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Check className="h-3.5 w-3.5" />
                                        )}

                                        Mark read
                                      </button>
                                    )}

                                  {notification.href && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void openNotification(
                                          notification
                                        )
                                      }
                                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
                                    >
                                      Open
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}