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
  Banknote,
  BarChart3,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Mail,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserRound,
  Users,
  Video,
  WalletCards,
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
    city?: string;
    region?: string;
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
  };
};

type GenericDocument = {
  id: string;
  [key: string]: unknown;
};

type AppointmentItem = GenericDocument & {
  patientId?: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  professionalName?: string;

  status?: string;

  appointmentType?: string;
  consultationMode?: string;

  date?: string;
  time?: string;
  startTime?: string;

  startAt?: unknown;
  createdAt?: unknown;
};

type PaymentItem = GenericDocument & {
  status?: string;
  paymentStatus?: string;

  amount?: unknown;
  amountCents?: unknown;
  total?: unknown;
  totalAmount?: unknown;
  grossAmount?: unknown;
  netAmount?: unknown;
  clinicAmount?: unknown;
  clinicEarnings?: unknown;
  clinicRevenue?: unknown;

  currency?: string;

  createdAt?: unknown;
  paidAt?: unknown;
  updatedAt?: unknown;
};

type TeamItem = GenericDocument & {
  active?: boolean;
  status?: string;

  role?: string;
  professionalType?: string;

  createdAt?: unknown;
};

type MessageItem = GenericDocument & {
  recipientType?: string;
  direction?: string;
  status?: string;
  read?: boolean;
  createdAt?: unknown;
};

type PatientItem = GenericDocument & {
  active?: boolean;
  status?: string;
  createdAt?: unknown;
};

type InsuranceItem = GenericDocument & {
  active?: boolean;
  status?: string;
  createdAt?: unknown;
};

type MonthlyPoint = {
  key: string;
  label: string;
  appointments: number;
  patients: number;
  revenue: number;
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

function toNumber(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const cleaned =
      value
        .replace(
          /[^\d.-]/g,
          ""
        )
        .trim();

    if (!cleaned) {
      return null;
    }

    const parsed =
      Number(cleaned);

    return Number.isFinite(
      parsed
    )
      ? parsed
      : null;
  }

  return null;
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

function appointmentDate(
  item: AppointmentItem
): Date | null {
  const direct =
    toDate(
      item.startAt
    );

  if (direct) {
    return direct;
  }

  const date =
    safeString(
      item.date
    );

  if (!date) {
    return toDate(
      item.createdAt
    );
  }

  const time =
    safeString(
      item.time ||
        item.startTime
    ) ||
    "00:00";

  const parsed =
    new Date(
      `${date}T${time}:00`
    );

  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;
}

function paymentDate(
  item: PaymentItem
): Date | null {
  return (
    toDate(
      item.paidAt
    ) ||
    toDate(
      item.createdAt
    ) ||
    toDate(
      item.updatedAt
    )
  );
}

function paymentStatus(
  item: PaymentItem
): string {
  return (
    safeString(
      item.paymentStatus ||
        item.status
    ).toLowerCase() ||
    "pending"
  );
}

function isPaidStatus(
  status: string
): boolean {
  return [
    "paid",
    "succeeded",
    "success",
    "completed",
    "complete",
    "confirmed",
  ].includes(status);
}

function getPaymentAmount(
  item: PaymentItem
): number {
  const candidates =
    [
      item.clinicEarnings,
      item.clinicRevenue,
      item.clinicAmount,
      item.netAmount,
      item.amount,
      item.totalAmount,
      item.total,
      item.grossAmount,
    ];

  for (
    const candidate of candidates
  ) {
    const parsed =
      toNumber(
        candidate
      );

    if (
      parsed !== null
    ) {
      return parsed;
    }
  }

  const cents =
    toNumber(
      item.amountCents
    );

  if (
    cents !== null
  ) {
    return cents / 100;
  }

  return 0;
}

function normalizeCurrency(
  value: unknown
): string {
  return (
    safeString(
      value
    ).toUpperCase() ||
    "GHS"
  );
}

function formatMoney(
  amount: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style:
          "currency",
        currency:
          normalizeCurrency(
            currency
          ),
        maximumFractionDigits:
          2,
      }
    ).format(amount);
  } catch {
    return `${amount.toLocaleString(
      "en-GH",
      {
        maximumFractionDigits:
          2,
      }
    )} ${normalizeCurrency(
      currency
    )}`;
  }
}

function isToday(
  date: Date | null
): boolean {
  if (!date) {
    return false;
  }

  const now =
    new Date();

  return (
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate()
  );
}

function normalizeAppointmentStatus(
  item: AppointmentItem
): string {
  return (
    safeString(
      item.status
    ).toLowerCase() ||
    "pending"
  );
}

function isTeleconsultation(
  item: AppointmentItem
): boolean {
  const type =
    safeString(
      item.appointmentType
    ).toLowerCase();

  const mode =
    safeString(
      item.consultationMode
    ).toLowerCase();

  return (
    type.includes(
      "video"
    ) ||
    type.includes(
      "tele"
    ) ||
    mode.includes(
      "video"
    ) ||
    mode.includes(
      "tele"
    )
  );
}

function isDoctor(
  item: TeamItem
): boolean {
  const professional =
    safeObject(
      item.professional
    );

  const type =
    safeString(
      item.professionalType ||
        professional.type ||
        item.role
    ).toLowerCase();

  return [
    "doctor",
    "physician",
    "medical_doctor",
    "medical doctor",
  ].includes(type);
}

function monthKey(
  date: Date
): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(
    2,
    "0"
  )}`;
}

function getLastSixMonths(): Array<{
  key: string;
  label: string;
}> {
  const result: Array<{
    key: string;
    label: string;
  }> = [];

  const current =
    new Date();

  for (
    let offset = 5;
    offset >= 0;
    offset -= 1
  ) {
    const date =
      new Date(
        current.getFullYear(),
        current.getMonth() -
          offset,
        1
      );

    result.push({
      key:
        monthKey(
          date
        ),

      label:
        new Intl.DateTimeFormat(
          "en-GH",
          {
            month:
              "short",
          }
        ).format(date),
    });
  }

  return result;
}

function percent(
  value: number,
  max: number
): number {
  if (
    max <= 0
  ) {
    return 0;
  }

  return Math.max(
    4,
    Math.min(
      100,
      (
        value /
        max
      ) *
        100
    )
  );
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function KpiCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: typeof Users;
}) {
  return (
    <article className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-3xl font-black text-zinc-950 dark:text-white">
            {value}
          </div>

          <div className="mt-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">
            {title}
          </div>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {helper}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function StatisticsClient() {
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
    appointments,
    setAppointments,
  ] =
    useState<AppointmentItem[]>(
      []
    );

  const [
    patients,
    setPatients,
  ] =
    useState<PatientItem[]>(
      []
    );

  const [
    team,
    setTeam,
  ] =
    useState<TeamItem[]>(
      []
    );

  const [
    messages,
    setMessages,
  ] =
    useState<MessageItem[]>(
      []
    );

  const [
    payments,
    setPayments,
  ] =
    useState<PaymentItem[]>(
      []
    );

  const [
    insurance,
    setInsurance,
  ] =
    useState<InsuranceItem[]>(
      []
    );

  /* ============================================================
     AUTH / CLINIC
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
                  "[ClinicStatistics] Profile error:",
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
     REALTIME DATA
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

    const cleanups: Array<
      () => void
    > = [];

    cleanups.push(
      onSnapshot(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "appointments"
        ),
        (
          snapshot
        ) => {
          setAppointments(
            snapshot.docs.map(
              (
                item
              ) => ({
                id:
                  item.id,

                ...(
                  item.data() as Omit<
                    AppointmentItem,
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
            "[ClinicStatistics] Appointments error:",
            snapshotError
          );
        }
      )
    );

    cleanups.push(
      onSnapshot(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "patients"
        ),
        (
          snapshot
        ) => {
          setPatients(
            snapshot.docs.map(
              (
                item
              ) => ({
                id:
                  item.id,

                ...(
                  item.data() as Omit<
                    PatientItem,
                    "id"
                  >
                ),
              })
            )
          );
        }
      )
    );

    cleanups.push(
      onSnapshot(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "team"
        ),
        (
          snapshot
        ) => {
          setTeam(
            snapshot.docs.map(
              (
                item
              ) => ({
                id:
                  item.id,

                ...(
                  item.data() as Omit<
                    TeamItem,
                    "id"
                  >
                ),
              })
            )
          );
        }
      )
    );

    cleanups.push(
      onSnapshot(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "messages"
        ),
        (
          snapshot
        ) => {
          setMessages(
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
            )
          );
        }
      )
    );

    cleanups.push(
      onSnapshot(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "payments"
        ),
        (
          snapshot
        ) => {
          setPayments(
            snapshot.docs.map(
              (
                item
              ) => ({
                id:
                  item.id,

                ...(
                  item.data() as Omit<
                    PaymentItem,
                    "id"
                  >
                ),
              })
            )
          );
        }
      )
    );

    cleanups.push(
      onSnapshot(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "insurance"
        ),
        (
          snapshot
        ) => {
          setInsurance(
            snapshot.docs.map(
              (
                item
              ) => ({
                id:
                  item.id,

                ...(
                  item.data() as Omit<
                    InsuranceItem,
                    "id"
                  >
                ),
              })
            )
          );
        }
      )
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
    uid,
  ]);

  /* ============================================================
     CLINIC
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

  /* ============================================================
     GLOBAL STATS
  ============================================================ */

  const currency =
    useMemo(
      () =>
        normalizeCurrency(
          payments.find(
            (
              item
            ) =>
              Boolean(
                safeString(
                  item.currency
                )
              )
          )?.currency ||
            "GHS"
        ),
      [
        payments,
      ]
    );

  const revenue =
    useMemo(
      () =>
        payments.reduce(
          (
            total,
            item
          ) => {
            const status =
              paymentStatus(
                item
              );

            if (
              !isPaidStatus(
                status
              )
            ) {
              return total;
            }

            return (
              total +
              getPaymentAmount(
                item
              )
            );
          },
          0
        ),
      [
        payments,
      ]
    );

  const monthRevenue =
    useMemo(
      () => {
        const now =
          new Date();

        return payments.reduce(
          (
            total,
            item
          ) => {
            const status =
              paymentStatus(
                item
              );

            if (
              !isPaidStatus(
                status
              )
            ) {
              return total;
            }

            const date =
              paymentDate(
                item
              );

            if (
              !date ||
              date.getFullYear() !==
                now.getFullYear() ||
              date.getMonth() !==
                now.getMonth()
            ) {
              return total;
            }

            return (
              total +
              getPaymentAmount(
                item
              )
            );
          },
          0
        );
      },
      [
        payments,
      ]
    );

  const todayAppointments =
    useMemo(
      () =>
        appointments.filter(
          (
            item
          ) =>
            isToday(
              appointmentDate(
                item
              )
            )
        ).length,
      [
        appointments,
      ]
    );

  const activeTeam =
    useMemo(
      () =>
        team.filter(
          (
            item
          ) =>
            item.active !==
              false &&
            safeString(
              item.status
            ).toLowerCase() !==
              "disabled"
        ).length,
      [
        team,
      ]
    );

  const doctorsCount =
    useMemo(
      () =>
        team.filter(
          isDoctor
        ).length,
      [
        team,
      ]
    );

  const teleconsultations =
    useMemo(
      () =>
        appointments.filter(
          isTeleconsultation
        ).length,
      [
        appointments,
      ]
    );

  const activeInsurance =
    useMemo(
      () =>
        insurance.filter(
          (
            item
          ) =>
            item.active !==
              false &&
            safeString(
              item.status
            ).toLowerCase() !==
              "inactive"
        ).length,
      [
        insurance,
      ]
    );

  /* ============================================================
     APPOINTMENT STATUS
  ============================================================ */

  const appointmentStatuses =
    useMemo(
      () => {
        const counts =
          {
            confirmed:
              0,
            pending:
              0,
            completed:
              0,
            cancelled:
              0,
          };

        appointments.forEach(
          (
            item
          ) => {
            const status =
              normalizeAppointmentStatus(
                item
              );

            if (
              [
                "completed",
                "complete",
                "finished",
                "done",
              ].includes(
                status
              )
            ) {
              counts.completed +=
                1;
              return;
            }

            if (
              [
                "cancelled",
                "canceled",
                "rejected",
              ].includes(
                status
              )
            ) {
              counts.cancelled +=
                1;
              return;
            }

            if (
              [
                "confirmed",
                "scheduled",
              ].includes(
                status
              )
            ) {
              counts.confirmed +=
                1;
              return;
            }

            counts.pending +=
              1;
          }
        );

        return counts;
      },
      [
        appointments,
      ]
    );

  /* ============================================================
     MONTHLY DATA
  ============================================================ */

  const monthlyData =
    useMemo<MonthlyPoint[]>(
      () => {
        const months =
          getLastSixMonths();

        return months.map(
          (
            month
          ) => {
            const appointmentCount =
              appointments.filter(
                (
                  item
                ) => {
                  const date =
                    appointmentDate(
                      item
                    );

                  return Boolean(
                    date &&
                      monthKey(
                        date
                      ) ===
                        month.key
                  );
                }
              ).length;

            const patientCount =
              patients.filter(
                (
                  item
                ) => {
                  const date =
                    toDate(
                      item.createdAt
                    );

                  return Boolean(
                    date &&
                      monthKey(
                        date
                      ) ===
                        month.key
                  );
                }
              ).length;

            const monthPaymentRevenue =
              payments.reduce(
                (
                  total,
                  item
                ) => {
                  const status =
                    paymentStatus(
                      item
                    );

                  const date =
                    paymentDate(
                      item
                    );

                  if (
                    !isPaidStatus(
                      status
                    ) ||
                    !date ||
                    monthKey(
                      date
                    ) !==
                      month.key
                  ) {
                    return total;
                  }

                  return (
                    total +
                    getPaymentAmount(
                      item
                    )
                  );
                },
                0
              );

            return {
              key:
                month.key,

              label:
                month.label,

              appointments:
                appointmentCount,

              patients:
                patientCount,

              revenue:
                monthPaymentRevenue,
            };
          }
        );
      },
      [
        appointments,
        patients,
        payments,
      ]
    );

  const maxMonthlyActivity =
    useMemo(
      () =>
        Math.max(
          1,
          ...monthlyData.map(
            (
              item
            ) =>
              Math.max(
                item.appointments,
                item.patients
              )
          )
        ),
      [
        monthlyData,
      ]
    );

  const maxMonthlyRevenue =
    useMemo(
      () =>
        Math.max(
          1,
          ...monthlyData.map(
            (
              item
            ) =>
              item.revenue
          )
        ),
      [
        monthlyData,
      ]
    );

  /* ============================================================
     CONSULTATION TYPES
  ============================================================ */

  const consultationTypes =
    useMemo(
      () => {
        let video =
          0;
        let phone =
          0;
        let inPerson =
          0;

        appointments.forEach(
          (
            item
          ) => {
            const value =
              safeString(
                item.consultationMode ||
                  item.appointmentType
              ).toLowerCase();

            if (
              value.includes(
                "video"
              ) ||
              value.includes(
                "tele"
              )
            ) {
              video +=
                1;
            } else if (
              value.includes(
                "phone"
              )
            ) {
              phone +=
                1;
            } else {
              inPerson +=
                1;
            }
          }
        );

        return {
          video,
          phone,
          inPerson,
        };
      },
      [
        appointments,
      ]
    );

  const maxConsultationType =
    Math.max(
      1,
      consultationTypes.video,
      consultationTypes.phone,
      consultationTypes.inPerson
    );

  /* ============================================================
     LATEST ACTIVITY
  ============================================================ */

  const latestActivity =
    useMemo(
      () => {
        const activities: Array<{
          id: string;
          type: string;
          label: string;
          date: Date;
        }> = [];

        appointments.forEach(
          (
            item
          ) => {
            const date =
              appointmentDate(
                item
              );

            if (date) {
              activities.push({
                id:
                  `appointment-${item.id}`,
                type:
                  "Appointment",
                label:
                  safeString(
                    item.patientName
                  ) ||
                  "Clinic appointment",
                date,
              });
            }
          }
        );

        patients.forEach(
          (
            item
          ) => {
            const date =
              toDate(
                item.createdAt
              );

            if (date) {
              const profile =
                safeObject(
                  item.profile
                );

              activities.push({
                id:
                  `patient-${item.id}`,
                type:
                  "Patient",
                label:
                  safeString(
                    item.fullName ||
                      item.displayName ||
                      profile.fullName ||
                      profile.displayName
                  ) ||
                  "New patient",
                date,
              });
            }
          }
        );

        payments.forEach(
          (
            item
          ) => {
            const date =
              paymentDate(
                item
              );

            if (
              date &&
              isPaidStatus(
                paymentStatus(
                  item
                )
              )
            ) {
              activities.push({
                id:
                  `payment-${item.id}`,
                type:
                  "Payment",
                label:
                  formatMoney(
                    getPaymentAmount(
                      item
                    ),
                    normalizeCurrency(
                      item.currency ||
                        currency
                    )
                  ),
                date,
              });
            }
          }
        );

        return activities
          .sort(
            (
              a,
              b
            ) =>
              b.date.getTime() -
              a.date.getTime()
          )
          .slice(
            0,
            5
          );
      },
      [
        appointments,
        patients,
        payments,
        currency,
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
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading clinic statistics...
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
          {/* HERO */}

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
                      <BarChart3 className="h-4 w-4 text-cyan-200" />

                      Clinic statistics
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
                    Statistics
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Review your clinic activity, patients, appointments, revenue, team and communications in real time.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Building2 className="h-4 w-4 text-cyan-200" />

                      {clinic.name}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Users className="h-4 w-4 text-violet-200" />

                      {patients.length} patients
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <WalletCards className="h-4 w-4 text-emerald-200" />

                      {formatMoney(
                        revenue,
                        currency
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CONTENT */}

          <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {error}
              </div>
            )}

            {/* KPI — preserved and expanded */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <KpiCard
                title="Patients"
                value={
                  patients.length
                }
                helper="Patients linked to the clinic"
                icon={
                  Users
                }
              />

              <KpiCard
                title="Appointments"
                value={
                  appointments.length
                }
                helper="All clinic appointments"
                icon={
                  CalendarCheck2
                }
              />

              <KpiCard
                title="Clinic earnings"
                value={formatMoney(
                  revenue,
                  currency
                )}
                helper="Revenue from paid transactions"
                icon={
                  Banknote
                }
              />

              <KpiCard
                title="Team members"
                value={
                  team.length
                }
                helper={`${doctorsCount} doctor${doctorsCount === 1 ? "" : "s"}`}
                icon={
                  Stethoscope
                }
              />

              <KpiCard
                title="Messages"
                value={
                  messages.length
                }
                helper="Clinic communications"
                icon={
                  MessageCircle
                }
              />

              <KpiCard
                title="Insurance"
                value={
                  insurance.length
                }
                helper="Insurance partners"
                icon={
                  ShieldCheck
                }
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* LEFT */}

              <div className="space-y-6">
                {/* ACTIVITY CHART */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Clinic activity
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Appointments and new patients over the last 6 months.
                      </p>
                    </div>

                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <div className="min-w-[620px]">
                      <div className="flex h-64 items-end gap-4 border-b border-zinc-200 px-2 pb-4 dark:border-zinc-800">
                        {monthlyData.map(
                          (
                            month
                          ) => (
                            <div
                              key={
                                month.key
                              }
                              className="flex min-w-0 flex-1 flex-col items-center justify-end"
                            >
                              <div className="flex h-48 w-full items-end justify-center gap-2">
                                <div
                                  className="w-6 rounded-t-xl bg-blue-600"
                                  style={{
                                    height:
                                      `${percent(
                                        month.appointments,
                                        maxMonthlyActivity
                                      )}%`,
                                  }}
                                  title={`${month.appointments} appointments`}
                                />

                                <div
                                  className="w-6 rounded-t-xl bg-violet-500"
                                  style={{
                                    height:
                                      `${percent(
                                        month.patients,
                                        maxMonthlyActivity
                                      )}%`,
                                  }}
                                  title={`${month.patients} patients`}
                                />
                              </div>

                              <div className="mt-3 text-xs font-bold text-zinc-500">
                                {month.label}
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-500">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          Appointments
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                          New patients
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* REVENUE CHART */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Revenue evolution
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Paid clinic revenue over the last 6 months.
                      </p>
                    </div>

                    <Banknote className="h-6 w-6 text-emerald-600" />
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <div className="min-w-[620px]">
                      <div className="flex h-64 items-end gap-4 border-b border-zinc-200 px-2 pb-4 dark:border-zinc-800">
                        {monthlyData.map(
                          (
                            month
                          ) => (
                            <div
                              key={
                                month.key
                              }
                              className="flex min-w-0 flex-1 flex-col items-center justify-end"
                            >
                              <div className="mb-2 text-[10px] font-bold text-zinc-400">
                                {month.revenue >
                                0
                                  ? formatMoney(
                                      month.revenue,
                                      currency
                                    )
                                  : "—"}
                              </div>

                              <div className="flex h-44 w-full items-end justify-center">
                                <div
                                  className="w-10 rounded-t-2xl bg-emerald-500"
                                  style={{
                                    height:
                                      `${percent(
                                        month.revenue,
                                        maxMonthlyRevenue
                                      )}%`,
                                  }}
                                  title={formatMoney(
                                    month.revenue,
                                    currency
                                  )}
                                />
                              </div>

                              <div className="mt-3 text-xs font-bold text-zinc-500">
                                {month.label}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* APPOINTMENTS + TYPES */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Appointment status
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Current appointment distribution.
                    </p>

                    <div className="mt-6 space-y-4">
                      {[
                        {
                          label:
                            "Confirmed",
                          value:
                            appointmentStatuses.confirmed,
                          className:
                            "bg-blue-600",
                        },
                        {
                          label:
                            "Pending",
                          value:
                            appointmentStatuses.pending,
                          className:
                            "bg-amber-500",
                        },
                        {
                          label:
                            "Completed",
                          value:
                            appointmentStatuses.completed,
                          className:
                            "bg-emerald-500",
                        },
                        {
                          label:
                            "Cancelled",
                          value:
                            appointmentStatuses.cancelled,
                          className:
                            "bg-red-500",
                        },
                      ].map(
                        (
                          row
                        ) => {
                          const total =
                            Math.max(
                              1,
                              appointments.length
                            );

                          return (
                            <div
                              key={
                                row.label
                              }
                            >
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-zinc-600 dark:text-zinc-300">
                                  {row.label}
                                </span>

                                <span className="font-black text-zinc-950 dark:text-white">
                                  {row.value}
                                </span>
                              </div>

                              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                                <div
                                  className={`h-full rounded-full ${row.className}`}
                                  style={{
                                    width:
                                      `${Math.min(
                                        100,
                                        (
                                          row.value /
                                          total
                                        ) *
                                          100
                                      )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Consultation types
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Appointment channels used by the clinic.
                    </p>

                    <div className="mt-6 space-y-5">
                      {[
                        {
                          label:
                            "In person",
                          value:
                            consultationTypes.inPerson,
                          icon:
                            Stethoscope,
                          className:
                            "bg-blue-600",
                        },
                        {
                          label:
                            "Video",
                          value:
                            consultationTypes.video,
                          icon:
                            Video,
                          className:
                            "bg-violet-500",
                        },
                        {
                          label:
                            "Phone",
                          value:
                            consultationTypes.phone,
                          icon:
                            CreditCard,
                          className:
                            "bg-cyan-500",
                        },
                      ].map(
                        (
                          row
                        ) => {
                          const Icon =
                            row.icon;

                          return (
                            <div
                              key={
                                row.label
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                  <Icon className="h-4 w-4" />

                                  {row.label}
                                </div>

                                <span className="text-sm font-black text-zinc-950 dark:text-white">
                                  {row.value}
                                </span>
                              </div>

                              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                                <div
                                  className={`h-full rounded-full ${row.className}`}
                                  style={{
                                    width:
                                      `${percent(
                                        row.value,
                                        maxConsultationType
                                      )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </section>
                </div>
              </div>

              {/* RIGHT */}

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <Banknote className="h-5 w-5" />
                  </div>

                  <div className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">
                    {formatMoney(
                      revenue,
                      currency
                    )}
                  </div>

                  <div className="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    Total clinic revenue
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Revenue from paid clinic transactions.
                  </p>

                  <div className="mt-4 rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/60">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                      This month
                    </div>

                    <div className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-300">
                      {formatMoney(
                        monthRevenue,
                        currency
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Today
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                      <CalendarCheck2 className="h-5 w-5 text-blue-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {todayAppointments}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Appointments
                      </div>
                    </div>

                    <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/30">
                      <Video className="h-5 w-5 text-violet-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {teleconsultations}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Video total
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <Stethoscope className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Healthcare team
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/80 p-4 text-center dark:bg-zinc-950/60">
                      <div className="text-2xl font-black text-zinc-950 dark:text-white">
                        {activeTeam}
                      </div>

                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        Active
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/80 p-4 text-center dark:bg-zinc-950/60">
                      <div className="text-2xl font-black text-zinc-950 dark:text-white">
                        {doctorsCount}
                      </div>

                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        Doctors
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <MessageCircle className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Communications
                  </h3>

                  <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                    {messages.length}
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    Total clinic messages recorded.
                  </p>
                </section>

                <section className="rounded-[28px] border border-cyan-200 bg-cyan-50/70 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <ShieldCheck className="h-6 w-6 text-cyan-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Insurance partners
                  </h3>

                  <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                    {insurance.length}
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    {activeInsurance} active insurance partner
                    {activeInsurance ===
                    1
                      ? ""
                      : "s"}.
                  </p>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                      Latest activity
                    </h3>

                    <Clock3 className="h-5 w-5 text-zinc-400" />
                  </div>

                  {latestActivity.length ===
                  0 ? (
                    <p className="mt-4 text-xs text-zinc-500">
                      No recent activity yet.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {latestActivity.map(
                        (
                          item
                        ) => (
                          <div
                            key={
                              item.id
                            }
                            className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                                {item.type}
                              </span>

                              <span className="text-[10px] text-zinc-400">
                                {new Intl.DateTimeFormat(
                                  "en-GH",
                                  {
                                    day:
                                      "2-digit",
                                    month:
                                      "short",
                                    timeZone:
                                      "Africa/Accra",
                                  }
                                ).format(
                                  item.date
                                )}
                              </span>
                            </div>

                            <div className="mt-1 truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              {item.label}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
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