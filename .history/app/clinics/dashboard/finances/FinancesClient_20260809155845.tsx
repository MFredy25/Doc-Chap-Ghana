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
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  ReceiptText,
  Search,
  Stethoscope,
  TrendingUp,
  UserRound,
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

type PaymentItem = {
  id: string;

  clinicId?: string;

  reference?: string;
  transactionId?: string;
  paymentId?: string;

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

  patientId?: string;
  patientName?: string;
  customerName?: string;

  doctorId?: string;
  doctorName?: string;
  professionalName?: string;

  appointmentId?: string;

  appointmentType?: string;
  consultationMode?: string;

  serviceId?: string;
  serviceName?: string;
  service?: string;
  title?: string;
  type?: string;

  provider?: string;
  paymentMethod?: string;
  method?: string;

  createdAt?: unknown;
  paidAt?: unknown;
  updatedAt?: unknown;

  [key: string]:
    unknown;
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
): Record<
  string,
  unknown
> {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
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
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value
        .replace(
          /[^\d.-]/g,
          ""
        )
        .trim();

    if (
      !normalized
    ) {
      return null;
    }

    const parsed =
      Number(
        normalized
      );

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

function normalizeCurrency(
  value: unknown
): string {
  const currency =
    safeString(
      value
    ).toUpperCase();

  if (
    currency ===
    "GHS"
  ) {
    return "GHS";
  }

  if (
    currency ===
    "XOF"
  ) {
    return "XOF";
  }

  if (
    currency ===
    "USD"
  ) {
    return "USD";
  }

  return currency ||
    "GHS";
}

function formatMoney(
  amount: number,
  currency = "GHS"
): string {
  const normalized =
    normalizeCurrency(
      currency
    );

  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style:
          "currency",
        currency:
          normalized,
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
    )} ${normalized}`;
  }
}

function getPaymentAmount(
  item: PaymentItem
): number {
  const directCandidates =
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
    const candidate of
    directCandidates
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
  ].includes(
    status
  );
}

function isPendingStatus(
  status: string
): boolean {
  return [
    "pending",
    "processing",
    "created",
    "initiated",
    "waiting",
  ].includes(
    status
  );
}

function isFailedStatus(
  status: string
): boolean {
  return [
    "failed",
    "cancelled",
    "canceled",
    "rejected",
    "expired",
  ].includes(
    status
  );
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

function patientName(
  item: PaymentItem
): string {
  const customer =
    safeObject(
      item.customer
    );

  return (
    safeString(
      item.patientName
    ) ||
    safeString(
      item.customerName
    ) ||
    safeString(
      customer.fullName
    ) ||
    safeString(
      customer.name
    ) ||
    "Patient"
  );
}

function doctorName(
  item: PaymentItem
): string {
  const raw =
    safeString(
      item.doctorName ||
        item.professionalName
    );

  if (!raw) {
    return "Doctor not specified";
  }

  return /^dr\.?\s/i.test(
    raw
  )
    ? raw
    : `Dr. ${raw}`;
}

function serviceName(
  item: PaymentItem
): string {
  const service =
    safeObject(
      item.service
    );

  const appointment =
    safeObject(
      item.appointment
    );

  return (
    safeString(
      item.serviceName
    ) ||
    safeString(
      service.name
    ) ||
    safeString(
      service.title
    ) ||
    safeString(
      item.title
    ) ||
    safeString(
      appointment.type
    ) ||
    safeString(
      item.appointmentType
    ) ||
    safeString(
      item.consultationMode
    ) ||
    safeString(
      item.type
    ) ||
    "Consultation"
  );
}

function paymentMethod(
  item: PaymentItem
): string {
  return (
    safeString(
      item.paymentMethod
    ) ||
    safeString(
      item.method
    ) ||
    safeString(
      item.provider
    ) ||
    "Payment"
  );
}

function paymentReference(
  item: PaymentItem
): string {
  return (
    safeString(
      item.reference
    ) ||
    safeString(
      item.transactionId
    ) ||
    safeString(
      item.paymentId
    ) ||
    item.id
  );
}

function statusClass(
  status: string
): string {
  if (
    isPaidStatus(
      status
    )
  ) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (
    isFailedStatus(
      status
    )
  ) {
    return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300";
  }

  return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
}

/* ============================================================
   PAGE
============================================================ */

export default function FinancesClient() {
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
    items,
    setItems,
  ] =
    useState<PaymentItem[]>(
      []
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<
      | "all"
      | "paid"
      | "pending"
      | "failed"
    >("all");

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
                  "[ClinicFinances] Profile error:",
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
     PAYMENTS REALTIME
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
        "payments"
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
                  PaymentItem,
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
              paymentDate(
                a
              )?.getTime() ||
              0;

            const bDate =
              paymentDate(
                b
              )?.getTime() ||
              0;

            return (
              bDate -
              aDate
            );
          }
        );

        setItems(
          rows
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicFinances] Payments realtime error:",
          snapshotError
        );

        setError(
          "Unable to load clinic financial activity."
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

  const filteredItems =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        return items.filter(
          (
            item
          ) => {
            const status =
              paymentStatus(
                item
              );

            if (
              filter ===
                "paid" &&
              !isPaidStatus(
                status
              )
            ) {
              return false;
            }

            if (
              filter ===
                "pending" &&
              !isPendingStatus(
                status
              )
            ) {
              return false;
            }

            if (
              filter ===
                "failed" &&
              !isFailedStatus(
                status
              )
            ) {
              return false;
            }

            if (!term) {
              return true;
            }

            const haystack =
              [
                paymentReference(
                  item
                ),
                patientName(
                  item
                ),
                doctorName(
                  item
                ),
                serviceName(
                  item
                ),
                paymentMethod(
                  item
                ),
                status,
              ]
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
        items,
        filter,
        search,
      ]
    );

  const currency =
    useMemo(
      () =>
        normalizeCurrency(
          items.find(
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
        items,
      ]
    );

  const stats =
    useMemo(
      () => {
        const now =
          new Date();

        let totalEarnings =
          0;

        let thisMonth =
          0;

        let paidCount =
          0;

        let pendingCount =
          0;

        let failedCount =
          0;

        items.forEach(
          (
            item
          ) => {
            const status =
              paymentStatus(
                item
              );

            const amount =
              getPaymentAmount(
                item
              );

            if (
              isPaidStatus(
                status
              )
            ) {
              totalEarnings +=
                amount;

              paidCount +=
                1;

              const date =
                paymentDate(
                  item
                );

              if (
                date &&
                date.getFullYear() ===
                  now.getFullYear() &&
                date.getMonth() ===
                  now.getMonth()
              ) {
                thisMonth +=
                  amount;
              }
            } else if (
              isPendingStatus(
                status
              )
            ) {
              pendingCount +=
                1;
            } else if (
              isFailedStatus(
                status
              )
            ) {
              failedCount +=
                1;
            }
          }
        );

        return {
          totalEarnings,
          thisMonth,
          paidCount,
          pendingCount,
          failedCount,

          average:
            paidCount >
            0
              ? totalEarnings /
                paidCount
              : 0,
        };
      },
      [
        items,
      ]
    );

  const latestPayment =
    items[0] ||
    null;

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
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading clinic finances...
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

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

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
                      <WalletCards className="h-4 w-4 text-emerald-200" />

                      Clinic finances
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
                    Finances
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Track what your clinic earns from appointments, consultations and healthcare services.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Building2 className="h-4 w-4 text-cyan-200" />

                      {clinic.name}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <MapPin className="h-4 w-4 text-emerald-200" />

                      {clinic.city}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <CreditCard className="h-4 w-4 text-violet-200" />

                      {items.length} transaction
                      {items.length ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                    Total clinic earnings
                  </div>

                  <div className="mt-2 text-3xl font-black">
                    {formatMoney(
                      stats.totalEarnings,
                      currency
                    )}
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* LEFT */}

              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Financial activity
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Earnings linked to clinic appointments, consultations and services.
                    </p>
                  </div>

                  <ReceiptText className="h-6 w-6 text-emerald-600" />
                </div>

                {/* FILTERS */}

                <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative min-w-0 flex-1">
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
                      placeholder="Search by patient, doctor, service or reference..."
                      className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        [
                          "all",
                          "All",
                        ],
                        [
                          "paid",
                          "Paid",
                        ],
                        [
                          "pending",
                          "Pending",
                        ],
                        [
                          "failed",
                          "Failed",
                        ],
                      ] as const
                    ).map(
                      (
                        [
                          value,
                          label,
                        ]
                      ) => (
                        <button
                          key={
                            value
                          }
                          type="button"
                          onClick={() =>
                            setFilter(
                              value
                            )
                          }
                          className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                            filter ===
                            value
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {filteredItems.length ===
                0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                    <WalletCards className="mx-auto h-8 w-8 text-zinc-400" />

                    <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      No financial activity found.
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Clinic payments will appear here when consultations or services are paid.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {filteredItems.map(
                      (
                        item
                      ) => {
                        const status =
                          paymentStatus(
                            item
                          );

                        const amount =
                          getPaymentAmount(
                            item
                          );

                        const itemCurrency =
                          normalizeCurrency(
                            item.currency ||
                              currency
                          );

                        const dateLabel =
                          formatDateTime(
                            item.paidAt ||
                              item.createdAt ||
                              item.updatedAt
                          );

                        return (
                          <article
                            key={
                              item.id
                            }
                            className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                          >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <Banknote className="h-5 w-5" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                                        {serviceName(
                                          item
                                        )}
                                      </h3>

                                      <span
                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusClass(
                                          status
                                        )}`}
                                      >
                                        {status.replace(
                                          /_/g,
                                          " "
                                        )}
                                      </span>
                                    </div>

                                    <p className="mt-1 text-xs text-zinc-500">
                                      Reference:{" "}
                                      <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                                        {paymentReference(
                                          item
                                        )}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-950">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                      <UserRound className="h-3.5 w-3.5" />

                                      Patient
                                    </div>

                                    <div className="mt-2 truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                      {patientName(
                                        item
                                      )}
                                    </div>
                                  </div>

                                  <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-950">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                      <Stethoscope className="h-3.5 w-3.5" />

                                      Doctor
                                    </div>

                                    <div className="mt-2 truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                      {doctorName(
                                        item
                                      )}
                                    </div>
                                  </div>

                                  <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-950">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                      <CreditCard className="h-3.5 w-3.5" />

                                      Payment
                                    </div>

                                    <div className="mt-2 truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                      {paymentMethod(
                                        item
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {dateLabel && (
                                  <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
                                    <Clock3 className="h-3.5 w-3.5" />

                                    {dateLabel}
                                  </div>
                                )}
                              </div>

                              <div className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-right dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                                  Clinic earnings
                                </div>

                                <div className="mt-2 text-xl font-black text-zinc-950 dark:text-white">
                                  {formatMoney(
                                    amount,
                                    itemCurrency
                                  )}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>

              {/* RIGHT */}

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <TrendingUp className="h-5 w-5" />
                  </div>

                  <div className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">
                    {formatMoney(
                      stats.totalEarnings,
                      currency
                    )}
                  </div>

                  <div className="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    Total earnings
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Total value of paid clinic transactions.
                  </p>
                </section>

                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <CalendarCheck2 className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    This month
                  </h3>

                  <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                    {formatMoney(
                      stats.thisMonth,
                      currency
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Paid revenue recorded during the current month.
                  </p>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Payment overview
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.paidCount}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Paid
                      </div>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/30">
                      <Clock3 className="h-5 w-5 text-amber-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.pendingCount}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Pending
                      </div>
                    </div>

                    <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-950/30">
                      <AlertCircle className="h-5 w-5 text-red-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.failedCount}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Failed
                      </div>
                    </div>

                    <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/30">
                      <ReceiptText className="h-5 w-5 text-violet-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {items.length}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Transactions
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <WalletCards className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Average transaction
                  </h3>

                  <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                    {formatMoney(
                      stats.average,
                      currency
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Average amount earned per paid transaction.
                  </p>
                </section>

                <section className="rounded-[28px] border border-cyan-200 bg-cyan-50/70 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <CreditCard className="h-6 w-6 text-cyan-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Latest payment
                  </h3>

                  {latestPayment ? (
                    <div className="mt-4 rounded-2xl bg-white/80 p-4 dark:bg-zinc-950/60">
                      <div className="text-sm font-black text-zinc-950 dark:text-white">
                        {serviceName(
                          latestPayment
                        )}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {patientName(
                          latestPayment
                        )}
                      </div>

                      <div className="mt-3 text-lg font-black text-emerald-700 dark:text-emerald-300">
                        {formatMoney(
                          getPaymentAmount(
                            latestPayment
                          ),
                          normalizeCurrency(
                            latestPayment.currency ||
                              currency
                          )
                        )}
                      </div>

                      {formatDateTime(
                        latestPayment.paidAt ||
                          latestPayment.createdAt
                      ) && (
                        <div className="mt-2 text-[11px] text-zinc-400">
                          {formatDateTime(
                            latestPayment.paidAt ||
                              latestPayment.createdAt
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">
                      No payment has been recorded yet.
                    </p>
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