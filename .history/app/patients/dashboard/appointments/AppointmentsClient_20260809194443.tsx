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
  type User,
} from "firebase/auth";

import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Loader2,
  MapPin,
  Phone,
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
  uid?: string;
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
  };
};

type Appointment = {
  id: string;

  doctorId?: string;
  doctorName?: string;

  professionalId?: string;
  professionalName?: string;

  clinicId?: string;
  clinicName?: string;

  specialty?: string;
  specialtyName?: string;

  status?: string;

  appointmentType?: string;
  mode?: string;
  consultationType?: string;

  date?: string;
  startAt?: unknown;
  endAt?: unknown;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;

  reason?: string;
  notes?: string;

  address?: string;
  location?: string;

  phone?: string;

  amount?: number;
  currency?: string;

  meetingLink?: string;
  videoUrl?: string;

  createdAt?: unknown;
  updatedAt?: unknown;
};

type FilterKey =
  | "all"
  | "upcoming"
  | "completed"
  | "cancelled";

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

function getAppointmentDate(
  appointment: Appointment
): Date | null {
  const startDate =
    toDate(
      appointment.startAt
    );

  if (
    startDate
  ) {
    return startDate;
  }

  if (
    appointment.date
  ) {
    const combined =
      appointment.startTime
        ? `${appointment.date}T${appointment.startTime}`
        : appointment.date;

    const parsed =
      new Date(
        combined
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
  appointment: Appointment
): string {
  const date =
    getAppointmentDate(
      appointment
    );

  if (
    date
  ) {
    return new Intl.DateTimeFormat(
      "en-GH",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      date
    );
  }

  return [
    appointment.date,
    appointment.startTime,
  ]
    .filter(Boolean)
    .join(" • ") ||
    "Date not available";
}

function getStatus(
  appointment: Appointment
): string {
  return s(
    appointment.status
  ).toLowerCase();
}

function isCompleted(
  appointment: Appointment
): boolean {
  return [
    "completed",
    "done",
    "finished",
    "terminated",
  ].includes(
    getStatus(
      appointment
    )
  );
}

function isCancelled(
  appointment: Appointment
): boolean {
  return [
    "cancelled",
    "canceled",
    "failed",
    "rejected",
  ].includes(
    getStatus(
      appointment
    )
  );
}

function isUpcoming(
  appointment: Appointment
): boolean {
  if (
    isCompleted(
      appointment
    ) ||
    isCancelled(
      appointment
    )
  ) {
    return false;
  }

  const date =
    getAppointmentDate(
      appointment
    );

  if (
    !date
  ) {
    return true;
  }

  return (
    date.getTime() >=
    Date.now() -
      60 *
        60 *
        1000
  );
}

function getMode(
  appointment: Appointment
): string {
  const mode =
    s(
      appointment.mode ||
        appointment.appointmentType ||
        appointment.consultationType
    ).toLowerCase();

  if (
    mode.includes(
      "video"
    ) ||
    mode.includes(
      "tele"
    )
  ) {
    return "Teleconsultation";
  }

  if (
    mode.includes(
      "phone"
    )
  ) {
    return "Phone consultation";
  }

  if (
    mode.includes(
      "home"
    )
  ) {
    return "Home visit";
  }

  return "In-person consultation";
}

function getProviderName(
  appointment: Appointment
): string {
  return (
    s(
      appointment.doctorName
    ) ||
    s(
      appointment.professionalName
    ) ||
    s(
      appointment.clinicName
    ) ||
    "Healthcare appointment"
  );
}

function getSpecialty(
  appointment: Appointment
): string {
  return (
    s(
      appointment.specialty
    ) ||
    s(
      appointment.specialtyName
    ) ||
    "General consultation"
  );
}

function statusClasses(
  status: string
): string {
  const normalized =
    status.toLowerCase();

  if (
    [
      "completed",
      "done",
      "finished",
      "terminated",
    ].includes(
      normalized
    )
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300";
  }

  if (
    [
      "cancelled",
      "canceled",
      "failed",
      "rejected",
    ].includes(
      normalized
    )
  ) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300";
  }

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

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300";
}

export default function AppointmentsClient() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    firebaseUser,
    setFirebaseUser,
  ] =
    useState<User | null>(
      null
    );

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
    filter,
    setFilter,
  ] =
    useState<FilterKey>(
      "all"
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

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

    let unsubscribePatient:
      | (() => void)
      | null =
      null;

    let unsubscribeAppointments:
      | (() => void)
      | null =
      null;

    const stopListeners =
      () => {
        unsubscribePatient?.();
        unsubscribeAppointments?.();

        unsubscribePatient =
          null;

        unsubscribeAppointments =
          null;
      };

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuthInstance,
        (
          user
        ) => {
          stopListeners();

          if (
            !user?.uid
          ) {
            setFirebaseUser(
              null
            );

            setPatientData(
              null
            );

            router.replace(
              "/patients/login"
            );

            return;
          }

          setFirebaseUser(
            user
          );

          const patientUid =
            user.uid;

          unsubscribePatient =
            onSnapshot(
              doc(
                firestoreInstance,
                "patients",
                patientUid
              ),
              async (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  stopListeners();

                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {
                    // Non-blocking.
                  }

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
                  stopListeners();

                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {
                    // Non-blocking.
                  }

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
                  !firebaseAuthInstance.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientAppointments] Patient profile error:",
                  snapshotError
                );

                setError(
                  "Unable to load your patient account."
                );

                setLoading(
                  false
                );
              }
            );

          unsubscribeAppointments =
            onSnapshot(
              collection(
                firestoreInstance,
                "patients",
                patientUid,
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
                          Appointment,
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
                    const aTime =
                      getAppointmentDate(
                        a
                      )?.getTime() ||
                      0;

                    const bTime =
                      getAppointmentDate(
                        b
                      )?.getTime() ||
                      0;

                    return (
                      bTime -
                      aTime
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
                  !firebaseAuthInstance.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientAppointments] Appointments error:",
                  snapshotError
                );

                setError(
                  "Unable to load your appointments."
                );
              }
            );
        }
      );

    return () => {
      stopListeners();
      unsubscribeAuth();
    };
  }, [
    router,
  ]);

  const profile =
    patientData
      ?.profile;

  const patientName =
    s(
      profile?.fullName
    ) ||
    s(
      profile?.displayName
    ) ||
    `${s(
      profile?.firstName
    )} ${s(
      profile?.lastName
    )}`.trim() ||
    s(
      firebaseUser
        ?.displayName
    ) ||
    "Patient";

  const counts =
    useMemo(
      () => ({
        all:
          appointments.length,

        upcoming:
          appointments.filter(
            isUpcoming
          ).length,

        completed:
          appointments.filter(
            isCompleted
          ).length,

        cancelled:
          appointments.filter(
            isCancelled
          ).length,
      }),
      [
        appointments,
      ]
    );

  const filteredAppointments =
    useMemo(
      () => {
        if (
          filter ===
          "upcoming"
        ) {
          return appointments.filter(
            isUpcoming
          );
        }

        if (
          filter ===
          "completed"
        ) {
          return appointments.filter(
            isCompleted
          );
        }

        if (
          filter ===
          "cancelled"
        ) {
          return appointments.filter(
            isCancelled
          );
        }

        return appointments;
      },
      [
        appointments,
        filter,
      ]
    );

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
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />

              <p className="mt-4 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                Loading your appointments...
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
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                    <CalendarDays className="h-4 w-4" />

                    My appointments
                  </span>

                  <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                    Your appointments
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-violet-100 sm:text-base">
                    View your consultations and open any appointment to see its full details.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                    <UserRound className="h-4 w-4" />

                    {patientName}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/doctors"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#24104f] shadow-xl transition hover:bg-violet-50"
                  >
                    <Stethoscope className="h-4 w-4" />

                    Find a doctor
                  </Link>

                  <Link
                    href="/clinics"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    <Building2 className="h-4 w-4" />

                    Find a clinic
                  </Link>
                </div>
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

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  key:
                    "all" as FilterKey,
                  label:
                    "All",
                  value:
                    counts.all,
                },
                {
                  key:
                    "upcoming" as FilterKey,
                  label:
                    "Upcoming",
                  value:
                    counts.upcoming,
                },
                {
                  key:
                    "completed" as FilterKey,
                  label:
                    "Completed",
                  value:
                    counts.completed,
                },
                {
                  key:
                    "cancelled" as FilterKey,
                  label:
                    "Cancelled",
                  value:
                    counts.cancelled,
                },
              ].map(
                (
                  item
                ) => (
                  <button
                    key={
                      item.key
                    }
                    type="button"
                    onClick={() =>
                      setFilter(
                        item.key
                      )
                    }
                    className={`rounded-[22px] border p-4 text-left transition ${
                      filter ===
                      item.key
                        ? "border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-600/15"
                        : "border-zinc-200 bg-white text-zinc-900 hover:border-violet-200 hover:bg-violet-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:border-violet-900/50 dark:hover:bg-violet-950/20"
                    }`}
                  >
                    <div className="text-2xl font-black">
                      {item.value}
                    </div>

                    <div
                      className={`mt-1 text-xs font-bold ${
                        filter ===
                        item.key
                          ? "text-violet-100"
                          : "text-zinc-500"
                      }`}
                    >
                      {item.label}
                    </div>
                  </button>
                )
              )}
            </div>

            <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    {filter ===
                    "all"
                      ? "All appointments"
                      : filter ===
                        "upcoming"
                      ? "Upcoming appointments"
                      : filter ===
                        "completed"
                      ? "Completed appointments"
                      : "Cancelled appointments"}
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Click an appointment to view all its details.
                  </p>
                </div>

                <CalendarDays className="h-6 w-6 text-violet-600" />
              </div>

              {filteredAppointments.length ===
              0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                  <CalendarDays className="mx-auto h-9 w-9 text-zinc-400" />

                  <div className="mt-3 text-sm font-black text-zinc-800 dark:text-zinc-200">
                    No appointment found
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    There is no appointment in this category yet.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {filteredAppointments.map(
                    (
                      appointment
                    ) => {
                      const mode =
                        getMode(
                          appointment
                        );

                      const isVideo =
                        mode ===
                        "Teleconsultation";

                      const status =
                        s(
                          appointment.status
                        ) ||
                        "Scheduled";

                      return (
                        <Link
                          key={
                            appointment.id
                          }
                          href={`/patients/dashboard/appointments/${encodeURIComponent(
                            appointment.id
                          )}`}
                          className="group block rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-violet-900/60 dark:hover:bg-violet-950/10"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                  isVideo
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300"
                                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
                                }`}
                              >
                                {isVideo ? (
                                  <Video className="h-5 w-5" />
                                ) : (
                                  <Stethoscope className="h-5 w-5" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
                                  {getProviderName(
                                    appointment
                                  )}
                                </div>

                                <div className="mt-1 text-xs font-semibold text-zinc-500">
                                  {getSpecialty(
                                    appointment
                                  )}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                    <Clock3 className="h-3.5 w-3.5" />

                                    {formatDate(
                                      appointment
                                    )}
                                  </span>

                                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                    {isVideo ? (
                                      <Video className="h-3.5 w-3.5" />
                                    ) : (
                                      <MapPin className="h-3.5 w-3.5" />
                                    )}

                                    {mode}
                                  </span>
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

                              <span className="inline-flex items-center gap-1 text-xs font-black text-violet-700 transition group-hover:translate-x-0.5 dark:text-violet-300">
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
              )}
            </section>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}