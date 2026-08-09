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
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  CircleX,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Stethoscope,
  UserRound,
  Users,
  Video,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";
import ClinicCreateAppointmentModal from "@/app/components/ClinicCreateAppointmentModal";

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
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
  };
};

type AppointmentItem = {
  id: string;

  patientId?: string;
  patientName?: string;
  patientFirstName?: string;
  patientLastName?: string;

  doctorId?: string;
  doctorName?: string;
  professionalName?: string;
  specialty?: string;

  status?: string;
  appointmentType?: string;
  consultationMode?: string;

  date?: string;
  time?: string;
  startTime?: string;
  endTime?: string;

  startAt?: unknown;
  endAt?: unknown;
  createdAt?: unknown;

  location?: string;
  reason?: string;
  notes?: string;

  phone?: string;
  patientPhone?: string;

  meetingLink?: string;
  meetingCode?: string;
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

function appointmentDate(
  item: AppointmentItem
): Date | null {
  const fromStartAt =
    toDate(
      item.startAt
    );

  if (fromStartAt) {
    return fromStartAt;
  }

  const date =
    safeString(
      item.date
    );

  if (!date) {
    return null;
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

function formatAppointmentDate(
  item: AppointmentItem
): string {
  const date =
    appointmentDate(
      item
    );

  if (!date) {
    return (
      safeString(
        item.date
      ) ||
      "Date not set"
    );
  }

  try {
    return new Intl.DateTimeFormat(
      "en-GH",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Accra",
      }
    ).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function appointmentTime(
  item: AppointmentItem
): string {
  const explicit =
    safeString(
      item.time ||
        item.startTime
    );

  if (explicit) {
    return explicit;
  }

  const date =
    appointmentDate(
      item
    );

  if (!date) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-GH",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Africa/Accra",
      }
    ).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

function patientName(
  item: AppointmentItem
): string {
  return (
    safeString(
      item.patientName
    ) ||
    `${safeString(
      item.patientFirstName
    )} ${safeString(
      item.patientLastName
    )}`.trim() ||
    "Patient"
  );
}

function doctorName(
  item: AppointmentItem
): string {
  const raw =
    safeString(
      item.doctorName ||
        item.professionalName
    );

  if (!raw) {
    return "Doctor not assigned";
  }

  return /^dr\.?\s/i.test(
    raw
  )
    ? raw
    : `Dr. ${raw}`;
}

function normalizedStatus(
  item: AppointmentItem
): string {
  return (
    safeString(
      item.status
    ).toLowerCase() ||
    "pending"
  );
}

function isCompleted(
  status: string
): boolean {
  return [
    "completed",
    "complete",
    "done",
    "finished",
  ].includes(status);
}

function isCancelled(
  status: string
): boolean {
  return [
    "cancelled",
    "canceled",
    "rejected",
  ].includes(status);
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

function statusClass(
  status: string
): string {
  if (
    isCompleted(status)
  ) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (
    isCancelled(status)
  ) {
    return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300";
  }

  if (
    status === "confirmed"
  ) {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";
  }

  return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
}

function consultationLabel(
  item: AppointmentItem
): string {
  const mode =
    safeString(
      item.consultationMode ||
        item.appointmentType
    )
      .toLowerCase()
      .replace(
        /_/g,
        " "
      );

  if (
    mode.includes("video") ||
    mode.includes("tele")
  ) {
    return "Video";
  }

  if (
    mode.includes("phone")
  ) {
    return "Phone";
  }

  return mode
    ? mode.replace(
        /\b\w/g,
        (
          char
        ) =>
          char.toUpperCase()
      )
    : "In person";
}

/* ============================================================
   PAGE
============================================================ */

export default function AppointmentsClient() {
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
    useState<string | null>(
      null
    );

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
    appointments,
    setAppointments,
  ] =
    useState<AppointmentItem[]>(
      []
    );

  const [
    filter,
    setFilter,
  ] =
    useState<
      | "all"
      | "today"
      | "upcoming"
      | "completed"
      | "cancelled"
    >("all");

  const [
    createAppointmentOpen,
    setCreateAppointmentOpen,
  ] =
    useState(false);

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
                  "[ClinicAppointments] Clinic realtime error:",
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
     APPOINTMENTS REALTIME
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
        "appointments"
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
                  AppointmentItem,
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
              appointmentDate(
                a
              )?.getTime() ||
              Number.MAX_SAFE_INTEGER;

            const bDate =
              appointmentDate(
                b
              )?.getTime() ||
              Number.MAX_SAFE_INTEGER;

            return (
              aDate -
              bDate
            );
          }
        );

        setAppointments(
          rows
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicAppointments] Appointments realtime error:",
          snapshotError
        );

        setError(
          "Unable to load clinic appointments."
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

  const stats =
    useMemo(
      () => {
        const now =
          new Date();

        let today = 0;
        let upcoming = 0;
        let completed = 0;
        let cancelled = 0;
        let video = 0;
        let phone = 0;
        let inPerson = 0;

        appointments.forEach(
          (
            item
          ) => {
            const date =
              appointmentDate(
                item
              );

            const status =
              normalizedStatus(
                item
              );

            if (
              isToday(date)
            ) {
              today += 1;
            }

            if (
              date &&
              date.getTime() >
                now.getTime() &&
              !isCompleted(
                status
              ) &&
              !isCancelled(
                status
              )
            ) {
              upcoming += 1;
            }

            if (
              isCompleted(
                status
              )
            ) {
              completed += 1;
            }

            if (
              isCancelled(
                status
              )
            ) {
              cancelled += 1;
            }

            const mode =
              consultationLabel(
                item
              );

            if (
              mode === "Video"
            ) {
              video += 1;
            } else if (
              mode === "Phone"
            ) {
              phone += 1;
            } else {
              inPerson += 1;
            }
          }
        );

        return {
          today,
          upcoming,
          completed,
          cancelled,
          video,
          phone,
          inPerson,
        };
      },
      [
        appointments,
      ]
    );

  const filteredAppointments =
    useMemo(
      () => {
        const now =
          new Date();

        return appointments.filter(
          (
            item
          ) => {
            const status =
              normalizedStatus(
                item
              );

            const date =
              appointmentDate(
                item
              );

            if (
              filter === "today"
            ) {
              return isToday(
                date
              );
            }

            if (
              filter ===
              "upcoming"
            ) {
              return Boolean(
                date &&
                  date.getTime() >
                    now.getTime() &&
                  !isCompleted(
                    status
                  ) &&
                  !isCancelled(
                    status
                  )
              );
            }

            if (
              filter ===
              "completed"
            ) {
              return isCompleted(
                status
              );
            }

            if (
              filter ===
              "cancelled"
            ) {
              return isCancelled(
                status
              );
            }

            return true;
          }
        );
      },
      [
        appointments,
        filter,
      ]
    );

  const nextAppointment =
    useMemo(
      () => {
        const now =
          Date.now();

        return (
          appointments.find(
            (
              item
            ) => {
              const status =
                normalizedStatus(
                  item
                );

              const date =
                appointmentDate(
                  item
                );

              return Boolean(
                date &&
                  date.getTime() >=
                    now &&
                  !isCompleted(
                    status
                  ) &&
                  !isCancelled(
                    status
                  )
              );
            }
          ) ||
          null
        );
      },
      [
        appointments,
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
                Loading clinic appointments...
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
                      <CalendarCheck2 className="h-4 w-4 text-cyan-300" />

                      Appointments
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
                    Clinic appointments
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Review patients, assigned doctors, consultation types and upcoming appointments for your clinic.
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
                      <CalendarCheck2 className="h-4 w-4 text-violet-200" />

                      {appointments.length} appointment
                      {appointments.length ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCreateAppointmentOpen(
                      true
                    )
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />

                  Create appointment
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* LEFT */}

              <div className="space-y-6">
                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Appointments
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        {filteredAppointments.length} appointment
                        {filteredAppointments.length ===
                        1
                          ? ""
                          : "s"}{" "}
                        displayed.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          [
                            "all",
                            "All",
                          ],
                          [
                            "today",
                            "Today",
                          ],
                          [
                            "upcoming",
                            "Upcoming",
                          ],
                          [
                            "completed",
                            "Completed",
                          ],
                          [
                            "cancelled",
                            "Cancelled",
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
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {label}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {filteredAppointments.length ===
                  0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <CalendarCheck2 className="mx-auto h-8 w-8 text-zinc-400" />

                      <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        No appointments found.
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Clinic appointments will appear here in real time.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {filteredAppointments.map(
                        (
                          appointment
                        ) => {
                          const status =
                            normalizedStatus(
                              appointment
                            );

                          const mode =
                            consultationLabel(
                              appointment
                            );

                          return (
                            <article
                              key={
                                appointment.id
                              }
                              className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                                      <UserRound className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                      <h3 className="truncate text-sm font-black text-zinc-950 dark:text-white">
                                        {patientName(
                                          appointment
                                        )}
                                      </h3>

                                      <p className="mt-1 truncate text-xs text-zinc-500">
                                        {doctorName(
                                          appointment
                                        )}
                                        {appointment.specialty
                                          ? ` • ${appointment.specialty}`
                                          : ""}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                      <CalendarClock className="h-3.5 w-3.5 text-blue-600" />

                                      {formatAppointmentDate(
                                        appointment
                                      )}
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                      <Clock3 className="h-3.5 w-3.5 text-violet-600" />

                                      {appointmentTime(
                                        appointment
                                      )}
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                      {mode ===
                                      "Video" ? (
                                        <Video className="h-3.5 w-3.5 text-cyan-600" />
                                      ) : mode ===
                                        "Phone" ? (
                                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                      ) : (
                                        <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                                      )}

                                      {mode}
                                    </span>
                                  </div>

                                  {appointment.reason && (
                                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                                      <span className="font-bold text-zinc-600 dark:text-zinc-300">
                                        Reason:
                                      </span>{" "}
                                      {appointment.reason}
                                    </p>
                                  )}

                                  {appointment.location && (
                                    <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                                      <MapPin className="h-3.5 w-3.5" />

                                      {appointment.location}
                                    </p>
                                  )}
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                                      status
                                    )}`}
                                  >
                                    {status.replace(
                                      /_/g,
                                      " "
                                    )}
                                  </span>
                                </div>
                              </div>
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* RIGHT */}

              <aside className="space-y-5">
                {/* TODAY */}

                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <CalendarCheck2 className="h-5 w-5" />
                  </div>

                  <div className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">
                    {stats.today}
                  </div>

                  <div className="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    Today&apos;s appointments
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Appointments scheduled for today at this clinic.
                  </p>
                </section>

                {/* STATUS KPI */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Appointment overview
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFilter(
                          "upcoming"
                        )
                      }
                      className="rounded-2xl bg-blue-50 p-4 text-left transition hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                    >
                      <CalendarClock className="h-5 w-5 text-blue-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.upcoming}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Upcoming
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFilter(
                          "completed"
                        )
                      }
                      className="rounded-2xl bg-emerald-50 p-4 text-left transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.completed}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Completed
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFilter(
                          "cancelled"
                        )
                      }
                      className="rounded-2xl bg-red-50 p-4 text-left transition hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                    >
                      <CircleX className="h-5 w-5 text-red-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.cancelled}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Cancelled
                      </div>
                    </button>

                    <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/30">
                      <Users className="h-5 w-5 text-violet-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {appointments.length}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Total
                      </div>
                    </div>
                  </div>
                </section>

                {/* NEXT APPOINTMENT */}

                <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <CalendarClock className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Next appointment
                  </h3>

                  {nextAppointment ? (
                    <div className="mt-4 rounded-2xl border border-violet-200 bg-white/70 p-4 dark:border-violet-900/40 dark:bg-zinc-950/60">
                      <div className="text-sm font-black text-zinc-950 dark:text-white">
                        {patientName(
                          nextAppointment
                        )}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {doctorName(
                          nextAppointment
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300">
                        <CalendarCheck2 className="h-4 w-4" />

                        {formatAppointmentDate(
                          nextAppointment
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        <Clock3 className="h-4 w-4" />

                        {appointmentTime(
                          nextAppointment
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      No upcoming appointment is currently scheduled.
                    </p>
                  )}
                </section>

                {/* CONSULTATION MODES */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Consultation types
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-3 dark:bg-blue-950/30">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <Stethoscope className="h-4 w-4 text-blue-600" />

                        In person
                      </div>

                      <span className="text-sm font-black text-zinc-950 dark:text-white">
                        {stats.inPerson}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-violet-50 p-3 dark:bg-violet-950/30">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <Video className="h-4 w-4 text-violet-600" />

                        Video
                      </div>

                      <span className="text-sm font-black text-zinc-950 dark:text-white">
                        {stats.video}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <Phone className="h-4 w-4 text-emerald-600" />

                        Phone
                      </div>

                      <span className="text-sm font-black text-zinc-950 dark:text-white">
                        {stats.phone}
                      </span>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </section>
        </main>

        {uid && (
          <ClinicCreateAppointmentModal
            open={
              createAppointmentOpen
            }
            clinicId={
              uid
            }
            clinicName={
              clinic.name
            }
            onClose={() =>
              setCreateAppointmentOpen(
                false
              )
            }
            onCreated={() => {
              setCreateAppointmentOpen(
                false
              );
              setFilter(
                "all"
              );
            }}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}