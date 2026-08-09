"use client";

import {
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
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  Loader2,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PatientsSidebar from "@/app/components/PatientsSidebar";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type PatientData = {
  role?: string;
  accountType?: string;
  active?: boolean;
  status?: string;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
  };
};

type Appointment = {
  id: string;

  doctorName?: string;
  clinicName?: string;
  specialty?: string;

  status?: string;

  appointmentType?: string;
  mode?: string;
  consultationType?: string;

  startAt?: unknown;
  endAt?: unknown;

  date?: string;
  startTime?: string;
  endTime?: string;

  meetingLink?: string;
  videoUrl?: string;
  dailyUrl?: string;
};

const ITEMS_PER_PAGE =
  10;

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function toDate(
  value: unknown
): Date | null {
  if (!value) {
    return null;
  }

  if (
    value instanceof Date
  ) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    try {
      return (
        value as {
          toDate: () => Date;
        }
      ).toDate();
    } catch {
      return null;
    }
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  return null;
}

function isTeleconsultation(
  item: Appointment
): boolean {
  const mode =
    s(
      item.mode ||
        item.appointmentType ||
        item.consultationType
    ).toLowerCase();

  return (
    mode.includes(
      "tele"
    ) ||
    mode.includes(
      "video"
    ) ||
    mode.includes(
      "online"
    )
  );
}

function appointmentDate(
  item: Appointment
): Date | null {
  const fromStart =
    toDate(
      item.startAt
    );

  if (
    fromStart
  ) {
    return fromStart;
  }

  if (
    item.date
  ) {
    const raw =
      item.startTime
        ? `${item.date}T${item.startTime}`
        : item.date;

    const parsed =
      new Date(
        raw
      );

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return parsed;
    }
  }

  return null;
}

function formatDate(
  item: Appointment
): string {
  const date =
    appointmentDate(
      item
    );

  if (
    !date
  ) {
    return [
      item.date,
      item.startTime,
    ]
      .filter(Boolean)
      .join(" • ") ||
      "Date not available";
  }

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
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    date
  );
}

function isCancelledOrCompleted(
  item: Appointment
): boolean {
  const status =
    s(
      item.status
    ).toLowerCase();

  return [
    "cancelled",
    "canceled",
    "completed",
    "done",
    "finished",
    "terminated",
    "failed",
    "rejected",
  ].includes(
    status
  );
}

function isUpcomingTeleconsultation(
  item: Appointment
): boolean {
  if (
    !isTeleconsultation(
      item
    )
  ) {
    return false;
  }

  if (
    isCancelledOrCompleted(
      item
    )
  ) {
    return false;
  }

  const date =
    appointmentDate(
      item
    );

  if (
    !date
  ) {
    return false;
  }

  return (
    date.getTime() >=
    Date.now()
  );
}

function statusClasses(
  status: string
): string {
  const normalized =
    status.toLowerCase();

  if (
    [
      "confirmed",
      "scheduled",
      "accepted",
    ].includes(
      normalized
    )
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300";
  }

  if (
    [
      "pending",
      "waiting",
    ].includes(
      normalized
    )
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
}

export default function TeleconsultationClient() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    patientData,
    setPatientData,
  ] =
    useState<PatientData | null>(
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
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    if (
      !auth ||
      !db
    ) {
      setError(
        "Firebase is not initialized."
      );

      setLoading(
        false
      );

      return;
    }

    const firebaseAuth =
      auth;

    const firestore =
      db;

    let stopPatient:
      | (() => void)
      | null =
      null;

    let stopAppointments:
      | (() => void)
      | null =
      null;

    const stopAll =
      () => {
        stopPatient?.();
        stopAppointments?.();

        stopPatient =
          null;

        stopAppointments =
          null;
      };

    const stopAuth =
      onAuthStateChanged(
        firebaseAuth,
        (
          user
        ) => {
          stopAll();

          if (
            !user?.uid
          ) {
            router.replace(
              "/patients/login"
            );

            return;
          }

          stopPatient =
            onSnapshot(
              doc(
                firestore,
                "patients",
                user.uid
              ),
              async (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  stopAll();

                  try {
                    await signOut(
                      firebaseAuth
                    );
                  } catch {}

                  router.replace(
                    "/patients/login"
                  );

                  return;
                }

                const data =
                  snapshot.data() as PatientData;

                const accountType =
                  s(
                    data.accountType ||
                      data.role
                  ).toLowerCase();

                if (
                  (
                    accountType &&
                    accountType !==
                      "patient"
                  ) ||
                  data.active === false ||
                  s(
                    data.status
                  ).toLowerCase() ===
                    "disabled"
                ) {
                  stopAll();

                  try {
                    await signOut(
                      firebaseAuth
                    );
                  } catch {}

                  router.replace(
                    "/patients/login"
                  );

                  return;
                }

                setPatientData(
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
                if (
                  !firebaseAuth.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientTeleconsultation] profile:",
                  snapshotError
                );

                setError(
                  "Unable to load your patient profile."
                );

                setLoading(
                  false
                );
              }
            );

          stopAppointments =
            onSnapshot(
              collection(
                firestore,
                "patients",
                user.uid,
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
                            Appointment,
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
                      appointmentDate(
                        a
                      )?.getTime() ||
                      0;

                    const bDate =
                      appointmentDate(
                        b
                      )?.getTime() ||
                      0;

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
                if (
                  !firebaseAuth.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientTeleconsultation] appointments:",
                  snapshotError
                );

                setError(
                  "Unable to load your teleconsultations."
                );
              }
            );
        }
      );

    return () => {
      stopAll();
      stopAuth();
    };
  }, [
    router,
  ]);

  const patientName =
    useMemo(
      () => {
        const profile =
          patientData
            ?.profile;

        return (
          s(
            profile
              ?.fullName
          ) ||
          s(
            profile
              ?.displayName
          ) ||
          `${s(
            profile
              ?.firstName
          )} ${s(
            profile
              ?.lastName
          )}`.trim() ||
          "Patient"
        );
      },
      [
        patientData,
      ]
    );

  const upcomingAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            isUpcomingTeleconsultation
          )
          .sort(
            (
              a,
              b
            ) => {
              const aDate =
                appointmentDate(
                  a
                )?.getTime() ||
                0;

              const bDate =
                appointmentDate(
                  b
                )?.getTime() ||
                0;

              return (
                aDate -
                bDate
              );
            }
          ),
      [
        appointments,
      ]
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        upcomingAppointments.length /
          ITEMS_PER_PAGE
      )
    );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedAppointments =
    useMemo(
      () => {
        const start =
          (
            currentPage -
            1
          ) *
          ITEMS_PER_PAGE;

        return upcomingAppointments.slice(
          start,
          start +
            ITEMS_PER_PAGE
        );
      },
      [
        currentPage,
        upcomingAppointments,
      ]
    );

  const firstVisible =
    upcomingAppointments.length ===
    0
      ? 0
      : (
          currentPage -
          1
        ) *
          ITEMS_PER_PAGE +
        1;

  const lastVisible =
    Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      upcomingAppointments.length
    );

  const nextAppointment =
    upcomingAppointments[0] ||
    null;

  const confirmedUpcoming =
    upcomingAppointments.filter(
      (
        item
      ) =>
        [
          "confirmed",
          "scheduled",
          "accepted",
        ].includes(
          s(
            item.status
          ).toLowerCase()
        )
    ).length;

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <PatientsSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

              <p className="mt-4 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                Loading your teleconsultations...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <PatientsSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          <section className="relative overflow-hidden border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                    <Video className="h-4 w-4" />

                    Teleconsultation
                  </span>

                  <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                    Upcoming teleconsultations
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">
                    View your upcoming online consultations and open each appointment to access its details.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                    <UserRound className="h-4 w-4" />

                    {patientName}
                  </div>
                </div>

                <Link
                  href="/patients/dashboard/appointments"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#063b34] shadow-xl transition hover:bg-emerald-50"
                >
                  <CalendarDays className="h-4 w-4" />

                  All appointments
                </Link>
              </div>
            </div>
          </section>

          <section className="px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white shadow-sm">
                    <Video className="h-5 w-5" />

                    <div className="mt-4 text-2xl font-black">
                      {upcomingAppointments.length}
                    </div>

                    <div className="mt-1 text-xs font-bold text-emerald-50">
                      Upcoming teleconsultations
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />

                    <div className="mt-4 text-2xl font-black">
                      {confirmedUpcoming}
                    </div>

                    <div className="mt-1 text-xs font-bold text-emerald-50">
                      Confirmed
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white shadow-sm">
                    <CalendarDays className="h-5 w-5" />

                    <div className="mt-4 text-2xl font-black">
                      {totalPages}
                    </div>

                    <div className="mt-1 text-xs font-bold text-emerald-50">
                      Page{totalPages > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Upcoming appointments
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        10 teleconsultations per page.
                      </p>
                    </div>

                    {upcomingAppointments.length >
                      0 && (
                      <div className="rounded-xl bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-500 dark:bg-zinc-900">
                        {firstVisible}–{lastVisible} of{" "}
                        {upcomingAppointments.length}
                      </div>
                    )}
                  </div>

                  {upcomingAppointments.length ===
                  0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <Video className="mx-auto h-9 w-9 text-zinc-400" />

                      <div className="mt-3 text-sm font-black text-zinc-800 dark:text-zinc-200">
                        No upcoming teleconsultation
                      </div>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Your next online consultation will appear here once it is scheduled.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mt-5 space-y-3">
                        {paginatedAppointments.map(
                          (
                            item
                          ) => {
                            const status =
                              s(
                                item.status
                              ) ||
                              "Scheduled";

                            return (
                              <Link
                                key={
                                  item.id
                                }
                                href={`/patients/dashboard/appointments/${encodeURIComponent(
                                  item.id
                                )}`}
                                className="group block rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-900/60 dark:hover:bg-emerald-950/10"
                              >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300">
                                      <Video className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
                                        {s(
                                          item.doctorName
                                        ) ||
                                          s(
                                            item.clinicName
                                          ) ||
                                          "Teleconsultation"}
                                      </div>

                                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                                        {s(
                                          item.specialty
                                        ) ||
                                          "Online consultation"}
                                      </div>

                                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                                        <Clock3 className="h-4 w-4" />

                                        {formatDate(
                                          item
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                                    <span
                                      className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${statusClasses(
                                        status
                                      )}`}
                                    >
                                      {status}
                                    </span>

                                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 transition group-hover:translate-x-0.5 dark:text-emerald-300">
                                      View details

                                      <ArrowRight className="h-4 w-4" />
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            );
                          }
                        )}
                      </div>

                      <div className="mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage(
                              (
                                page
                              ) =>
                                Math.max(
                                  1,
                                  page -
                                    1
                                )
                            )
                          }
                          disabled={
                            currentPage ===
                            1
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                        >
                          <ArrowLeft className="h-4 w-4" />

                          Previous
                        </button>

                        <div className="text-center text-xs font-bold text-zinc-500">
                          Page{" "}
                          <span className="text-zinc-900 dark:text-white">
                            {currentPage}
                          </span>{" "}
                          of{" "}
                          <span className="text-zinc-900 dark:text-white">
                            {totalPages}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage(
                              (
                                page
                              ) =>
                                Math.min(
                                  totalPages,
                                  page +
                                    1
                                )
                            )
                          }
                          disabled={
                            currentPage ===
                            totalPages
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next

                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300">
                    <Video className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-sm font-black text-zinc-950 dark:text-white">
                    Next teleconsultation
                  </h3>

                  {nextAppointment ? (
                    <>
                      <div className="mt-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                        <div className="text-sm font-black text-zinc-950 dark:text-white">
                          {s(
                            nextAppointment.doctorName
                          ) ||
                            s(
                              nextAppointment.clinicName
                            ) ||
                            "Online consultation"}
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          {s(
                            nextAppointment.specialty
                          ) ||
                            "Teleconsultation"}
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          <Clock3 className="h-4 w-4 text-emerald-600" />

                          {formatDate(
                            nextAppointment
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/patients/dashboard/appointments/${encodeURIComponent(
                          nextAppointment.id
                        )}`}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
                      >
                        View appointment

                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  ) : (
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      No upcoming teleconsultation is currently scheduled.
                    </p>
                  )}
                </section>

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Before your consultation
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Connect a few minutes before your appointment and make sure your internet connection, camera and microphone are working properly.
                  </p>
                </section>

                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <Info className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Teleconsultation access
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Open the appointment details to access the consultation information and the video link when it is available.
                  </p>
                </section>

                <Link
                  href="/patients/dashboard/appointments"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-zinc-950 dark:text-emerald-300"
                >
                  <CalendarDays className="h-4 w-4" />

                  View all appointments
                </Link>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <Stethoscope className="h-4 w-4" />
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-zinc-950 dark:text-white">
                        {upcomingAppointments.length}
                      </div>

                      <div className="text-[11px] font-bold text-zinc-500">
                        Upcoming online visits
                      </div>
                    </div>
                  </div>
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