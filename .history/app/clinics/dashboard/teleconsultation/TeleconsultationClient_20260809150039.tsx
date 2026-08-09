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
  Clock3,
  Loader2,
  MapPin,
  MonitorPlay,
  Stethoscope,
  UserRound,
  Users,
  Video,
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
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
  };
};

type TeleconsultationItem = {
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

  meetingLink?: string;
  meetingCode?: string;
  storedMeetingLink?: string;
  dailyJoinUrl?: string;

  location?: string;
  reason?: string;
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

function getAppointmentDate(
  item: TeleconsultationItem
): Date | null {
  const startAt =
    toDate(
      item.startAt
    );

  if (startAt) {
    return startAt;
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

function formatDate(
  item: TeleconsultationItem
): string {
  const date =
    getAppointmentDate(
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
        weekday:
          "short",
        day:
          "2-digit",
        month:
          "short",
        year:
          "numeric",
        timeZone:
          "Africa/Accra",
      }
    ).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function formatTime(
  item: TeleconsultationItem
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
    getAppointmentDate(
      item
    );

  if (!date) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-GH",
      {
        hour:
          "2-digit",
        minute:
          "2-digit",
        hour12:
          true,
        timeZone:
          "Africa/Accra",
      }
    ).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

function getPatientName(
  item: TeleconsultationItem
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

function getDoctorName(
  item: TeleconsultationItem
): string {
  const rawName =
    safeString(
      item.doctorName ||
        item.professionalName
    );

  if (!rawName) {
    return "Doctor not assigned";
  }

  return /^dr\.?\s/i.test(
    rawName
  )
    ? rawName
    : `Dr. ${rawName}`;
}

function normalizeStatus(
  item: TeleconsultationItem
): string {
  return (
    safeString(
      item.status
    ).toLowerCase() ||
    "pending"
  );
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

function isCompleted(
  status: string
): boolean {
  return [
    "completed",
    "complete",
    "finished",
    "done",
  ].includes(status);
}

function isTeleconsultation(
  item: TeleconsultationItem
): boolean {
  const appointmentType =
    safeString(
      item.appointmentType
    ).toLowerCase();

  const consultationMode =
    safeString(
      item.consultationMode
    ).toLowerCase();

  return (
    appointmentType.includes(
      "video"
    ) ||
    appointmentType.includes(
      "tele"
    ) ||
    consultationMode.includes(
      "video"
    ) ||
    consultationMode.includes(
      "tele"
    ) ||
    Boolean(
      safeString(
        item.meetingLink
      )
    ) ||
    Boolean(
      safeString(
        item.meetingCode
      )
    ) ||
    Boolean(
      safeString(
        item.storedMeetingLink
      )
    ) ||
    Boolean(
      safeString(
        item.dailyJoinUrl
      )
    )
  );
}

function getMeetingLink(
  item: TeleconsultationItem
): string {
  return (
    safeString(
      item.meetingLink
    ) ||
    safeString(
      item.dailyJoinUrl
    ) ||
    safeString(
      item.storedMeetingLink
    )
  );
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
    status ===
      "confirmed" ||
    status ===
      "scheduled"
  ) {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";
  }

  if (
    status ===
      "in_progress" ||
    status ===
      "in-progress"
  ) {
    return "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300";
  }

  return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
}

/* ============================================================
   PAGE
============================================================ */

export default function TeleconsultationClient() {
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
    sessions,
    setSessions,
  ] =
    useState<TeleconsultationItem[]>(
      []
    );

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
                  "[ClinicTeleconsultation] Clinic realtime error:",
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
     TELECONSULTATIONS REALTIME
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
          snapshot.docs
            .map(
              (
                item
              ) => ({
                id:
                  item.id,

                ...(
                  item.data() as Omit<
                    TeleconsultationItem,
                    "id"
                  >
                ),
              })
            )
            .filter(
              isTeleconsultation
            );

        rows.sort(
          (
            a,
            b
          ) => {
            const aDate =
              getAppointmentDate(
                a
              )?.getTime() ||
              Number.MAX_SAFE_INTEGER;

            const bDate =
              getAppointmentDate(
                b
              )?.getTime() ||
              Number.MAX_SAFE_INTEGER;

            return (
              aDate -
              bDate
            );
          }
        );

        setSessions(
          rows
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicTeleconsultation] Sessions realtime error:",
          snapshotError
        );

        setError(
          "Unable to load teleconsultation appointments."
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

  const upcomingSessions =
    useMemo(
      () => {
        const now =
          Date.now();

        return sessions
          .filter(
            (
              session
            ) => {
              const status =
                normalizeStatus(
                  session
                );

              const date =
                getAppointmentDate(
                  session
                );

              return Boolean(
                date &&
                  date.getTime() >=
                    now &&
                  !isCancelled(
                    status
                  ) &&
                  !isCompleted(
                    status
                  )
              );
            }
          )
          .slice(
            0,
            10
          );
      },
      [
        sessions,
      ]
    );

  const stats =
    useMemo(
      () => {
        const now =
          Date.now();

        let today = 0;
        let upcoming = 0;
        let linksReady = 0;

        const doctorIds =
          new Set<string>();

        sessions.forEach(
          (
            session
          ) => {
            const status =
              normalizeStatus(
                session
              );

            const date =
              getAppointmentDate(
                session
              );

            if (
              date &&
              date.getTime() >=
                now &&
              !isCancelled(
                status
              ) &&
              !isCompleted(
                status
              )
            ) {
              upcoming += 1;

              if (
                isToday(
                  date
                )
              ) {
                today += 1;
              }
            }

            if (
              getMeetingLink(
                session
              )
            ) {
              linksReady += 1;
            }

            const doctorId =
              safeString(
                session.doctorId ||
                  session.doctorName ||
                  session.professionalName
              );

            if (
              doctorId
            ) {
              doctorIds.add(
                doctorId
              );
            }
          }
        );

        return {
          today,
          upcoming,
          linksReady,
          doctors:
            doctorIds.size,
        };
      },
      [
        sessions,
      ]
    );

  const nextSession =
    upcomingSessions[0] ||
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
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading teleconsultations...
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
                      <Video className="h-4 w-4 text-violet-200" />

                      Teleconsultation
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
                    Teleconsultation
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Follow the next video consultation appointments scheduled for your clinic.
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
                      <CalendarClock className="h-4 w-4 text-violet-200" />

                      {stats.upcoming} upcoming
                    </span>
                  </div>
                </div>

                <Link
                  href="/clinics/dashboard/appointments"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <CalendarCheck2 className="h-4 w-4" />

                  All appointments
                </Link>
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
              {/* =================================================
                  LEFT
              ================================================= */}

              <div className="space-y-6">
                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Next teleconsultations
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        The 10 next video consultation appointments scheduled for your clinic.
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                      <MonitorPlay className="h-5 w-5" />
                    </div>
                  </div>

                  {upcomingSessions.length ===
                  0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <Video className="mx-auto h-8 w-8 text-zinc-400" />

                      <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        No upcoming teleconsultation.
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Upcoming video appointments will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {upcomingSessions.map(
                        (
                          session,
                          index
                        ) => {
                          const status =
                            normalizeStatus(
                              session
                            );

                          const meetingLink =
                            getMeetingLink(
                              session
                            );

                          return (
                            <article
                              key={
                                session.id
                              }
                              className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:border-violet-200 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                                      <Video className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="truncate text-sm font-black text-zinc-950 dark:text-white">
                                          {getPatientName(
                                            session
                                          )}
                                        </h3>

                                        {index ===
                                          0 && (
                                          <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                                            Next
                                          </span>
                                        )}
                                      </div>

                                      <p className="mt-1 truncate text-xs text-zinc-500">
                                        {getDoctorName(
                                          session
                                        )}

                                        {session.specialty
                                          ? ` • ${session.specialty}`
                                          : ""}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                      <CalendarCheck2 className="h-3.5 w-3.5 text-blue-600" />

                                      {formatDate(
                                        session
                                      )}
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                      <Clock3 className="h-3.5 w-3.5 text-violet-600" />

                                      {formatTime(
                                        session
                                      )}
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 shadow-sm dark:bg-zinc-950 dark:text-violet-300">
                                      <Video className="h-3.5 w-3.5" />

                                      Video consultation
                                    </span>
                                  </div>

                                  {session.reason && (
                                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                        Reason:
                                      </span>{" "}

                                      {session.reason}
                                    </p>
                                  )}

                                  {session.meetingCode && (
                                    <p className="mt-2 text-xs text-zinc-500">
                                      Meeting code:{" "}
                                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                        {session.meetingCode}
                                      </span>
                                    </p>
                                  )}
                                </div>

                                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:min-w-[180px]">
                                  <span
                                    className={`inline-flex w-fit self-end rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                                      status
                                    )}`}
                                  >
                                    {status.replace(
                                      /_/g,
                                      " "
                                    )}
                                  </span>

                                  {meetingLink ? (
                                    <a
                                      href={
                                        meetingLink
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-500"
                                    >
                                      <Video className="h-4 w-4" />

                                      Join consultation
                                    </a>
                                  ) : (
                                    <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-center text-xs font-semibold text-zinc-500 dark:border-zinc-700">
                                      Meeting link pending
                                    </div>
                                  )}
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

              {/* =================================================
                  RIGHT
              ================================================= */}

              <aside className="space-y-5">
                {/* TODAY */}

                <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
                    <Video className="h-5 w-5" />
                  </div>

                  <div className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">
                    {stats.today}
                  </div>

                  <div className="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    Today&apos;s teleconsultations
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Video consultations scheduled for today.
                  </p>
                </section>

                {/* NEXT SESSION */}

                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <CalendarClock className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Next teleconsultation
                  </h3>

                  {nextSession ? (
                    <div className="mt-4 rounded-2xl border border-blue-200 bg-white/80 p-4 dark:border-blue-900/40 dark:bg-zinc-950/60">
                      <div className="text-sm font-black text-zinc-950 dark:text-white">
                        {getPatientName(
                          nextSession
                        )}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {getDoctorName(
                          nextSession
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                        <CalendarCheck2 className="h-4 w-4" />

                        {formatDate(
                          nextSession
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        <Clock3 className="h-4 w-4" />

                        {formatTime(
                          nextSession
                        )}
                      </div>

                      {getMeetingLink(
                        nextSession
                      ) && (
                        <a
                          href={getMeetingLink(
                            nextSession
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
                        >
                          <Video className="h-4 w-4" />

                          Open video room
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      No upcoming teleconsultation is currently scheduled.
                    </p>
                  )}
                </section>

                {/* OVERVIEW */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Teleconsultation overview
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/30">
                      <CalendarClock className="h-5 w-5 text-violet-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.upcoming}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Upcoming
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                      <MonitorPlay className="h-5 w-5 text-emerald-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.linksReady}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Rooms ready
                      </div>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                      <Users className="h-5 w-5 text-blue-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.doctors}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Doctors
                      </div>
                    </div>

                    <div className="rounded-2xl bg-cyan-50 p-4 dark:bg-cyan-950/30">
                      <Video className="h-5 w-5 text-cyan-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {sessions.length}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Total video
                      </div>
                    </div>
                  </div>
                </section>

                {/* INFORMATION */}

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <Stethoscope className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Video consultations
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    This page displays only appointments identified as video or teleconsultation sessions for this clinic.
                  </p>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <UserRound className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Next 10 appointments
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    The main list is limited to the 10 nearest upcoming teleconsultations, ordered by appointment date and time.
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