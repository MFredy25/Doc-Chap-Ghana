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

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  LineChart,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type AppointmentStatus =
  | "ongoing"
  | "upcoming"
  | "completed"
  | "cancelled";

type AppointmentMode =
  | "in_person"
  | "video";

type AppointmentPayment =
  | "paid"
  | "unpaid";

type Appointment = {
  id: string;

  patientName: string;

  reason: string;

  dateLabel: string;

  timeLabel: string;

  status: AppointmentStatus;

  mode: AppointmentMode;

  payment: AppointmentPayment;

  amount: number;

  currency: string;

  startAt: Date;
};

type NotificationItem = {
  id: string;

  title: string;

  body: string;

  read: boolean;

  createdAt: Date;
};

type DoctorView = {
  name: string;
  firstName: string;
  specialty: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  verified: boolean;
  verificationStatus: string;
};

/* ============================================================
   GENERIC HELPERS
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
    typeof value ===
      "object" &&
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
    typeof value ===
      "object" &&
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

/* ============================================================
   DATE HELPERS
============================================================ */

function startOfDay(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

function endOfDay(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
    0,
    0,
    0,
    0
  );
}

function startOfMonth(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
}

function endOfMonth(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );
}

/* ============================================================
   FORMATTERS
============================================================ */

function formatTime(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "2-digit",
      month: "short",
    }
  ).format(date);
}

function formatNotificationDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatMoney(
  amount: number,
  currency = "GHS"
) {
  const normalizedCurrency =
    safeString(
      currency
    ).toUpperCase() ||
    "GHS";

  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style: "currency",
        currency:
          normalizedCurrency,
        maximumFractionDigits:
          2,
      }
    ).format(amount);
  } catch {
    return `${amount.toFixed(
      2
    )} ${normalizedCurrency}`;
  }
}

/* ============================================================
   DOCTOR PROFILE
============================================================ */

function mapDoctor(
  data: any
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
    "Speciality not configured";

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
      "approved" ||
    verificationStatus ===
      "verified";

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
      ) || "Ghana",

    email:
      safeString(
        profile.email
      ),

    phone:
      safeString(
        profile.phone
      ),

    verified,

    verificationStatus,
  };
}

/* ============================================================
   APPOINTMENTS
============================================================ */

function isCancelled(
  raw: unknown
) {
  const value =
    safeString(
      raw
    ).toLowerCase();

  return [
    "cancelled",
    "canceled",
    "cancelled_by_doctor",
    "cancelled_by_patient",
    "canceled_by_doctor",
    "canceled_by_patient",
  ].includes(value);
}

function isCompleted(
  raw: unknown
) {
  const value =
    safeString(
      raw
    ).toLowerCase();

  return [
    "completed",
    "complete",
    "finished",
    "done",
    "termine",
    "terminé",
  ].includes(value);
}

function appointmentMode(
  data: any
): AppointmentMode {
  const root =
    safeObject(data);

  const type =
    `${safeString(
      root.appointmentType
    )} ${safeString(
      root.type
    )} ${safeString(
      root.typeV2
    )}`.toLowerCase();

  if (
    type.includes("tele") ||
    type.includes("video") ||
    type.includes("visio")
  ) {
    return "video";
  }

  return "in_person";
}

function appointmentStatus(
  data: any,
  startAt: Date
): AppointmentStatus {
  if (
    isCancelled(
      data?.status
    )
  ) {
    return "cancelled";
  }

  if (
    isCompleted(
      data?.status
    )
  ) {
    return "completed";
  }

  const durationMinutes =
    Number(
      data?.durationMinutes
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

  const now =
    new Date();

  if (
    now >= startAt &&
    now < endAt
  ) {
    return "ongoing";
  }

  if (
    now >= endAt
  ) {
    return "completed";
  }

  return "upcoming";
}

function isPaid(
  data: any
) {
  const payment =
    safeObject(
      data?.payment
    );

  const status =
    `${safeString(
      data?.paymentStatus
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
    ].some((value) =>
      status.includes(
        value
      )
    ) ||
    Boolean(
      payment.paidAt
    )
  );
}

function numericValue(
  value: unknown
): number {
  if (
    typeof value ===
      "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value ===
      "string"
  ) {
    const parsed =
      Number(
        value
          .replace(
            /[^0-9.,-]/g,
            ""
          )
          .replace(
            ",",
            "."
          )
      );

    if (
      Number.isFinite(
        parsed
      )
    ) {
      return parsed;
    }
  }

  return 0;
}

function appointmentAmount(
  data: any
) {
  const payment =
    safeObject(
      data?.payment
    );

  const candidates = [
    payment.netAmount,
    payment.amount,
    payment.grossAmount,
    payment.totalAmount,
    data?.amount,
    data?.totalAmount,
    data?.consultationFee,
    data?.teleconsultationFee,
  ];

  for (const candidate of candidates) {
    const amount =
      numericValue(
        candidate
      );

    if (amount > 0) {
      return amount;
    }
  }

  return 0;
}

function appointmentCurrency(
  data: any
) {
  const payment =
    safeObject(
      data?.payment
    );

  return (
    safeString(
      payment.currency
    ).toUpperCase() ||
    safeString(
      data?.currency
    ).toUpperCase() ||
    "GHS"
  );
}

function mapAppointment(
  id: string,
  data: any
): Appointment | null {
  const root =
    safeObject(data);

  const startAt =
    toDate(
      root.startAt
    ) ||
    toDate(
      root.appointmentDate
    ) ||
    toDate(root.date);

  if (!startAt) {
    return null;
  }

  const patientSummary =
    safeObject(
      root.patientSummary
    );

  const patientName =
    safeString(
      root.patientName
    ) ||
    safeString(
      root.patientDisplayName
    ) ||
    safeString(
      patientSummary.displayName
    ) ||
    safeString(
      patientSummary.fullName
    ) ||
    "Patient";

  const durationMinutes =
    Number(
      root.durationMinutes
    ) > 0
      ? Number(
          root.durationMinutes
        )
      : 30;

  const endAt =
    new Date(
      startAt.getTime() +
        durationMinutes *
          60 *
          1000
    );

  return {
    id,

    patientName,

    reason:
      safeString(
        root.reason
      ) ||
      safeString(
        root.motif
      ) ||
      safeString(
        root.title
      ) ||
      "Consultation",

    dateLabel:
      formatDate(
        startAt
      ),

    timeLabel: `${formatTime(
      startAt
    )} - ${formatTime(
      endAt
    )}`,

    status:
      appointmentStatus(
        root,
        startAt
      ),

    mode:
      appointmentMode(
        root
      ),

    payment:
      isPaid(root)
        ? "paid"
        : "unpaid",

    amount:
      appointmentAmount(
        root
      ),

    currency:
      appointmentCurrency(
        root
      ),

    startAt,
  };
}

/* ============================================================
   BADGES
============================================================ */

function appointmentStatusClass(
  status: AppointmentStatus
) {
  if (
    status === "ongoing"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200";
  }

  if (
    status === "upcoming"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200";
  }

  if (
    status === "cancelled"
  ) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
}

function appointmentStatusLabel(
  status: AppointmentStatus
) {
  if (
    status === "ongoing"
  ) {
    return "Ongoing";
  }

  if (
    status === "upcoming"
  ) {
    return "Upcoming";
  }

  if (
    status === "cancelled"
  ) {
    return "Cancelled";
  }

  return "Completed";
}

/* ============================================================
   UI COMPONENTS
============================================================ */

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/6 via-indigo-500/4 to-transparent" />

      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>

        <div className="min-w-0">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </div>

          <div className="mt-1 truncate text-lg font-bold text-black dark:text-white">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/7 via-indigo-500/4 to-transparent" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600">
              <Icon className="h-5 w-5 text-white" />
            </div>

            <div>
              <div className="text-base font-semibold text-black dark:text-white">
                {title}
              </div>

              {subtitle && (
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {action}
        </div>

        <div className="mt-5">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

export default function DoctorDashboardClient() {
  const router =
    useRouter();

  const [authLoading, setAuthLoading] =
    useState(true);

  const [uid, setUid] =
    useState<string | null>(
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
    appointments,
    setAppointments,
  ] =
    useState<Appointment[]>(
      []
    );

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      NotificationItem[]
    >([]);

  const [
    unreadCount,
    setUnreadCount,
  ] =
    useState(0);

  const [
    monthRevenue,
    setMonthRevenue,
  ] = useState(0);

  const [
    monthCurrency,
    setMonthCurrency,
  ] =
    useState("GHS");

  const [
    search,
    setSearch,
  ] =
    useState("");

  /* ============================================================
     AUTH GUARD
  ============================================================ */

  useEffect(() => {
    const firebaseAuth = auth;
    const firestore = db;

    if (
      !firebaseAuth ||
      !firestore
    ) {
      setAccessError(
        "Firebase is not initialized. Check the Firebase environment variables."
      );

      setAuthLoading(
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
            setUid(null);

            router.replace(
              "/doctors/login"
            );

            return;
          }

          try {
            const professionalRef =
              doc(
                firestore,
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
                firebaseAuth
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
                firebaseAuth
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
                firebaseAuth
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
          } catch (error) {
            console.error(
              "[DoctorDashboard] Auth guard error:",
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
    const firestore = db;

    if (
      !firestore ||
      !uid
    ) {
      return;
    }

    const reference =
      doc(
        firestore,
        "professionals",
        uid
      );

    const unsubscribe =
      onSnapshot(
        reference,
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
        (error) => {
          console.error(
            "[DoctorDashboard] Doctor realtime error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, [uid]);

  /* ============================================================
     TODAY APPOINTMENTS
  ============================================================ */

  useEffect(() => {
    const firestore = db;

    if (
      !firestore ||
      !uid
    ) {
      return;
    }

    const now =
      new Date();

    const from =
      startOfDay(now);

    const to =
      endOfDay(now);

    const appointmentsRef =
      collection(
        firestore,
        "professionals",
        uid,
        "appointments"
      );

    const appointmentsQuery =
      query(
        appointmentsRef,

        where(
          "startAt",
          ">=",
          Timestamp.fromDate(
            from
          )
        ),

        where(
          "startAt",
          "<",
          Timestamp.fromDate(
            to
          )
        ),

        orderBy(
          "startAt",
          "asc"
        )
      );

    const unsubscribe =
      onSnapshot(
        appointmentsQuery,
        (
          snapshot
        ) => {
          const mapped =
            snapshot.docs
              .map(
                (
                  appointmentDoc
                ) =>
                  mapAppointment(
                    appointmentDoc.id,
                    appointmentDoc.data()
                  )
              )
              .filter(
                Boolean
              ) as Appointment[];

          setAppointments(
            mapped
          );
        },
        (error) => {
          console.error(
            "[DoctorDashboard] Today appointments error:",
            error
          );

          setAppointments(
            []
          );
        }
      );

    return () =>
      unsubscribe();
  }, [uid]);

  /* ============================================================
     MONTH REVENUE
  ============================================================ */

  useEffect(() => {
    const firestore = db;

    if (
      !firestore ||
      !uid
    ) {
      return;
    }

    const now =
      new Date();

    const from =
      startOfMonth(
        now
      );

    const to =
      endOfMonth(now);

    const appointmentsRef =
      collection(
        firestore,
        "professionals",
        uid,
        "appointments"
      );

    const appointmentsQuery =
      query(
        appointmentsRef,

        where(
          "startAt",
          ">=",
          Timestamp.fromDate(
            from
          )
        ),

        where(
          "startAt",
          "<",
          Timestamp.fromDate(
            to
          )
        ),

        orderBy(
          "startAt",
          "asc"
        )
      );

    const unsubscribe =
      onSnapshot(
        appointmentsQuery,
        (
          snapshot
        ) => {
          let total =
            0;

          let currency =
            "GHS";

          snapshot.docs.forEach(
            (
              appointmentDoc
            ) => {
              const data =
                appointmentDoc.data();

              if (
                !isPaid(
                  data
                )
              ) {
                return;
              }

              total +=
                appointmentAmount(
                  data
                );

              currency =
                appointmentCurrency(
                  data
                );
            }
          );

          setMonthRevenue(
            total
          );

          setMonthCurrency(
            currency ||
              "GHS"
          );
        },
        (error) => {
          console.error(
            "[DoctorDashboard] Revenue error:",
            error
          );

          setMonthRevenue(
            0
          );

          setMonthCurrency(
            "GHS"
          );
        }
      );

    return () =>
      unsubscribe();
  }, [uid]);

  /* ============================================================
     NOTIFICATIONS
  ============================================================ */

  useEffect(() => {
    const firestore = db;

    if (
      !firestore ||
      !uid
    ) {
      return;
    }

    const notificationsRef =
      collection(
        firestore,
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
              ) => {
                const data =
                  notificationDoc.data();

                const createdAt =
                  toDate(
                    data.createdAt
                  ) ||
                  new Date();

                const read =
                  data.read ===
                    true ||
                  data.seen ===
                    true;

                return {
                  id:
                    notificationDoc.id,

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

                  read,

                  createdAt,
                } satisfies NotificationItem;
              }
            );

          setNotifications(
            mapped.slice(
              0,
              5
            )
          );

          setUnreadCount(
            mapped.filter(
              (
                notification
              ) =>
                !notification.read
            ).length
          );
        },
        (error) => {
          console.error(
            "[DoctorDashboard] Notifications error:",
            error
          );

          setNotifications(
            []
          );

          setUnreadCount(
            0
          );
        }
      );

    return () =>
      unsubscribe();
  }, [uid]);

  /* ============================================================
     COMPUTED DATA
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

  const videoCount =
    useMemo(
      () =>
        appointments.filter(
          (
            appointment
          ) =>
            appointment.mode ===
            "video"
        ).length,
      [appointments]
    );

  const upcomingCount =
    useMemo(
      () =>
        appointments.filter(
          (
            appointment
          ) =>
            appointment.status ===
              "upcoming" ||
            appointment.status ===
              "ongoing"
        ).length,
      [appointments]
    );

  const filteredAppointments =
    useMemo(() => {
      const queryValue =
        search
          .trim()
          .toLowerCase();

      if (
        !queryValue
      ) {
        return appointments;
      }

      return appointments.filter(
        (
          appointment
        ) =>
          appointment.patientName
            .toLowerCase()
            .includes(
              queryValue
            ) ||
          appointment.reason
            .toLowerCase()
            .includes(
              queryValue
            ) ||
          appointment.timeLabel
            .toLowerCase()
            .includes(
              queryValue
            )
      );
    }, [
      appointments,
      search,
    ]);

  const revenueLabel =
    useMemo(
      () =>
        formatMoney(
          monthRevenue,
          monthCurrency
        ),
      [
        monthRevenue,
        monthCurrency,
      ]
    );

  /* ============================================================
     LOADING
  ============================================================ */

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <DoctorSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <div className="mt-5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Loading your doctor
                dashboard...
              </div>

              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Checking your Doc Chap
                Ghana professional account.
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

  if (accessError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <DoctorSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/40 dark:bg-zinc-950">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <div>
                  <div className="font-semibold text-zinc-950 dark:text-white">
                    Unable to open the
                    dashboard
                  </div>

                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {accessError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.replace(
                    "/doctors/login"
                  )
                }
                className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <DoctorSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          {/* =====================================================
              HERO / DOCTOR DASHBOARD BANNER
          ===================================================== */}

          <section className="relative overflow-hidden border-b border-blue-950/25 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 left-[30%] h-[26rem] w-[26rem] rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />

            <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
              <div className="absolute left-[8%] top-10 h-24 w-24 rounded-full border border-white" />
              <div className="absolute right-[10%] top-16 h-20 w-20 rotate-12 rounded-3xl border border-white" />
              <div className="absolute bottom-10 left-[46%] h-16 w-16 rounded-full border border-white" />
            </div>

            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
              <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)] xl:items-stretch">
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                        <Stethoscope className="h-4 w-4 text-cyan-300" />
                        Doctor dashboard
                      </span>

                      {doctor.verified ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-md">
                          <BadgeCheck className="h-4 w-4" />
                          Verified doctor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-md">
                          <ShieldCheck className="h-4 w-4" />
                          Verification{" "}
                          {doctor.verificationStatus || "pending"}
                        </span>
                      )}
                    </div>

                    <div className="mt-6 flex items-start gap-4">
                      <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/20 bg-white/10 shadow-xl backdrop-blur-md sm:flex">
                        <Stethoscope className="h-8 w-8 text-cyan-200" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-blue-100">
                          Welcome back
                        </p>

                        <h1 className="mt-1 break-words text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                          {doctor.name}
                        </h1>

                        <p className="mt-3 text-sm leading-7 text-blue-100 sm:text-base">
                          {doctor.specialty}
                          {" • "}
                          {doctor.city}
                          {" • "}
                          {doctor.country}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100/95 sm:text-base">
                      Manage your consultations, patients, schedule, payments and professional activity from your Doc Chap Ghana workspace.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md">
                        <ShieldCheck className="h-4 w-4 text-emerald-300" />
                        Secure access
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md">
                        <Sparkles className="h-4 w-4 text-violet-300" />
                        Teleconsultation
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md">
                        <LineChart className="h-4 w-4 text-cyan-300" />
                        Activity tracking
                      </span>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      href="/doctors/dashboard/appointments"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                    >
                      View appointments
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/doctors/my-account"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15"
                    >
                      Complete my profile
                      <Stethoscope className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/doctors/dashboard/configuration"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/15 px-5 py-3.5 text-sm font-semibold text-cyan-50 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-cyan-400/20"
                    >
                      Professional configuration
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-black text-white">
                          Today&apos;s overview
                        </div>

                        <div className="mt-1 text-xs leading-5 text-blue-100">
                          Appointments, notifications and activity at a glance.
                        </div>
                      </div>

                      <Link
                        href="/doctors/dashboard/notifications"
                        className={`relative inline-flex min-w-12 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-bold backdrop-blur-md transition hover:bg-white/15 ${
                          unreadCount > 0
                            ? "border-red-300/40 bg-red-400/20 text-red-50"
                            : "border-white/20 bg-white/10 text-white"
                        }`}
                      >
                        <Bell className="h-4 w-4" />
                        {unreadCount}
                      </Link>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/90 shadow-lg">
                          <CalendarCheck2 className="h-5 w-5 text-white" />
                        </div>

                        <div className="mt-4 text-2xl font-black text-white">
                          {appointments.length}
                        </div>

                        <div className="mt-1 text-xs font-medium leading-5 text-blue-100">
                          Today&apos;s appointments
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/90 shadow-lg">
                          <Clock className="h-5 w-5 text-white" />
                        </div>

                        <div className="mt-4 text-2xl font-black text-white">
                          {upcomingCount}
                        </div>

                        <div className="mt-1 text-xs font-medium leading-5 text-blue-100">
                          Upcoming
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/90 shadow-lg">
                          <Video className="h-5 w-5 text-white" />
                        </div>

                        <div className="mt-4 text-2xl font-black text-white">
                          {videoCount}
                        </div>

                        <div className="mt-1 text-xs font-medium leading-5 text-blue-100">
                          Video consultations
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/90 shadow-lg">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>

                        <div className="mt-4 break-words text-xl font-black text-white sm:text-2xl">
                          {revenueLabel}
                        </div>

                        <div className="mt-1 text-xs font-medium leading-5 text-blue-100">
                          Monthly revenue
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#06172f]/25 px-4 py-3 backdrop-blur-md">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
                          Notifications
                        </div>

                        <div className="mt-1 text-sm font-bold text-white">
                          {unreadCount > 0
                            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                            : "You're all caught up"}
                        </div>
                      </div>

                      <Link
                        href="/doctors/dashboard/notifications"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                        aria-label="Open notifications"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              MAIN CONTENT
          ===================================================== */}

          <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_.8fr]">
              {/* APPOINTMENTS */}

              <SectionCard
                title="Today's appointments"
                subtitle="Appointments scheduled for today"
                icon={
                  CalendarCheck2
                }
                action={
                  <Link
                    href="/doctors/dashboard/appointments"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                  >
                    View all
                  </Link>
                }
              >
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <Search className="h-4 w-4 text-zinc-400" />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Search patient, reason or time..."
                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
                  />
                </div>

                {filteredAppointments.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                    <Calendar className="mx-auto h-8 w-8 text-zinc-400" />

                    <div className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      No appointments
                      found
                    </div>

                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Your appointments
                      scheduled for today
                      will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAppointments.map(
                      (
                        appointment
                      ) => (
                        <button
                          key={
                            appointment.id
                          }
                          type="button"
                          onClick={() =>
                            router.push(
                              `/doctors/dashboard/appointments/${appointment.id}`
                            )
                          }
                          className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-900/60 dark:hover:bg-blue-950/10"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-black dark:text-white">
                                  {
                                    appointment.patientName
                                  }
                                </div>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${appointmentStatusClass(
                                    appointment.status
                                  )}`}
                                >
                                  {appointmentStatusLabel(
                                    appointment.status
                                  )}
                                </span>
                              </div>

                              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                {
                                  appointment.reason
                                }
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                                <span>
                                  {
                                    appointment.dateLabel
                                  }
                                </span>

                                <span>
                                  •
                                </span>

                                <span>
                                  {
                                    appointment.timeLabel
                                  }
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  appointment.mode ===
                                  "video"
                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                    : "border-teal-200 bg-teal-50 text-teal-700"
                                }`}
                              >
                                {appointment.mode ===
                                "video" ? (
                                  <Video className="h-3 w-3" />
                                ) : (
                                  <Stethoscope className="h-3 w-3" />
                                )}

                                {appointment.mode ===
                                "video"
                                  ? "Video"
                                  : "In person"}
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  appointment.payment ===
                                  "paid"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                }`}
                              >
                                {appointment.payment ===
                                "paid"
                                  ? "Paid"
                                  : "Unpaid"}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}
              </SectionCard>

              {/* NOTIFICATIONS */}

              <SectionCard
                title="Notifications"
                subtitle={`${unreadCount} unread`}
                icon={Bell}
                action={
                  <Link
                    href="/doctors/dashboard/notifications"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                  >
                    View all
                  </Link>
                }
              >
                {notifications.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
                    <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" />

                    <div className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      No notifications
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      You&apos;re all
                      caught up.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(
                      (
                        notification
                      ) => (
                        <div
                          key={
                            notification.id
                          }
                          className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                                {
                                  notification.title
                                }
                              </div>

                              <div className="mt-1 text-[11px] text-zinc-400">
                                {formatNotificationDate(
                                  notification.createdAt
                                )}
                              </div>
                            </div>

                            {!notification.read && (
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                            )}
                          </div>

                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                            {
                              notification.body
                            }
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* ===================================================
                QUICK ACCESS
            =================================================== */}

            <div className="mt-6">
              <SectionCard
                title="Quick access"
                subtitle="Your main Doc Chap Ghana tools"
                icon={
                  ShieldCheck
                }
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Link
                    href="/doctors/dashboard/calendar"
                    className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-blue-950/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>

                    <div className="mt-3 text-sm font-semibold text-black dark:text-white">
                      Calendar
                    </div>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Manage your
                      availability and
                      schedule.
                    </p>
                  </Link>

                  <Link
                    href="/doctors/dashboard/patients"
                    className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:bg-indigo-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-indigo-950/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600">
                      <Users className="h-5 w-5 text-white" />
                    </div>

                    <div className="mt-3 text-sm font-semibold text-black dark:text-white">
                      Patients
                    </div>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Access patient
                      information and
                      follow-up.
                    </p>
                  </Link>

                  <Link
                    href="/doctors/dashboard/appointments"
                    className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:bg-violet-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-violet-950/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600">
                      <CalendarCheck2 className="h-5 w-5 text-white" />
                    </div>

                    <div className="mt-3 text-sm font-semibold text-black dark:text-white">
                      Appointments
                    </div>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Review and manage
                      your consultations.
                    </p>
                  </Link>

                  <Link
                    href="/doctors/dashboard/finances"
                    className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-emerald-950/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>

                    <div className="mt-3 text-sm font-semibold text-black dark:text-white">
                      Finances
                    </div>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      View payments and
                      monthly revenue.
                    </p>
                  </Link>
                </div>
              </SectionCard>
            </div>
          </section>

          {/* =====================================================
              PROFILE CTA
          ===================================================== */}

          <section className="w-full px-4 pb-12 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/6 to-transparent" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-black sm:text-2xl dark:text-white">
                    Complete your
                    professional profile
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base dark:text-zinc-400">
                    Add your medical
                    speciality, address,
                    consultation fees,
                    availability and
                    professional
                    information so
                    patients can find and
                    book you more easily.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/doctors/my-account"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
                  >
                    My account

                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  >
                    Support
                  </Link>
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