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
  query,
  where,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HeartPulse,
  Loader2,
  MapPin,
  Search,
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
    phone?: string;
    city?: string | null;
    region?: string | null;
    address?: string | null;
    dob?: string | null;
    gender?: string | null;
  };

  security?: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };

  meta?: {
    profileCompleted?: boolean;
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
  date?: string;
  startAt?: unknown;
  startTime?: string;
};

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function o(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toDate(
  value: unknown
): Date | null {
  if (!value) return null;

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

function formatAppointmentDate(
  appointment: Appointment
): string {
  const date =
    toDate(
      appointment.startAt
    );

  if (date) {
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
    ).format(date);
  }

  if (
    appointment.date
  ) {
    return [
      appointment.date,
      appointment.startTime,
    ]
      .filter(Boolean)
      .join(" • ");
  }

  return "Date not available";
}

export default function DashboardClient() {
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
                    accountType !== "patient"
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
                  !firebaseAuthInstance.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientDashboard] Profile error:",
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
                    const aDate =
                      toDate(
                        a.startAt
                      )?.getTime() ||
                      0;

                    const bDate =
                      toDate(
                        b.startAt
                      )?.getTime() ||
                      0;

                    return (
                      bDate -
                      aDate
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
                  "[PatientDashboard] Appointments error:",
                  snapshotError
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
    useMemo(
      () =>
        o(
          patientData?.profile
        ),
      [
        patientData,
      ]
    );

  const firstName =
    s(
      profile.firstName
    ) ||
    s(
      firebaseUser
        ?.displayName
    ).split(
      /\s+/
    )[0] ||
    "Patient";

  const fullName =
    s(
      profile.fullName
    ) ||
    s(
      profile.displayName
    ) ||
    s(
      firebaseUser
        ?.displayName
    ) ||
    "Patient";

  const location =
    [
      s(
        profile.city
      ),
      s(
        profile.region
      ),
    ]
      .filter(Boolean)
      .join(", ") ||
    "Ghana";

  const profileCompleted =
    patientData
      ?.meta
      ?.profileCompleted ===
    true;

  const emailVerified =
    firebaseUser
      ?.emailVerified ===
      true ||
    patientData
      ?.security
      ?.emailVerified ===
      true;

  const upcomingAppointments =
    appointments
      .filter(
        (
          appointment
        ) => {
          const status =
            s(
              appointment.status
            ).toLowerCase();

          return ![
            "completed",
            "cancelled",
            "canceled",
            "failed",
          ].includes(
            status
          );
        }
      )
      .slice(
        0,
        5
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
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Loading your patient dashboard...
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    <HeartPulse className="h-4 w-4 text-emerald-100" />

                    Patient dashboard
                  </span>

                  {emailVerified && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                      <BadgeCheck className="h-4 w-4" />

                      Email verified
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                  Welcome, {firstName}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">
                  Manage your appointments, access your patient profile and continue your healthcare journey with Doc Chap Ghana.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                    <UserRound className="h-4 w-4" />

                    {fullName}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                    <MapPin className="h-4 w-4" />

                    {location}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/patients/my-account"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#063b34] shadow-xl transition hover:bg-emerald-50"
                >
                  <UserRound className="h-4 w-4" />

                  My account
                </Link>

                <Link
                  href="/doctors"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  <Search className="h-4 w-4" />

                  Find a doctor
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-10">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="mr-2 inline h-4 w-4" />

              {error}
            </div>
          )}

          {!profileCompleted && (
            <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />

                <div>
                  <div className="text-sm font-black text-zinc-950 dark:text-white">
                    Complete your patient profile
                  </div>

                  <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Add your personal and contact information so your patient account is ready for appointments.
                  </p>
                </div>
              </div>

              <Link
                href="/patients/my-account"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white"
              >
                Complete profile

                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label:
                      "Upcoming appointments",
                    value:
                      upcomingAppointments.length,
                    icon:
                      CalendarDays,
                    iconClass:
                      "bg-blue-50 text-blue-600",
                  },
                  {
                    label:
                      "Consultations",
                    value:
                      appointments.length,
                    icon:
                      Stethoscope,
                    iconClass:
                      "bg-emerald-50 text-emerald-600",
                  },
                  {
                    label:
                      "Profile",
                    value:
                      profileCompleted
                        ? "Complete"
                        : "To complete",
                    icon:
                      UserRound,
                    iconClass:
                      "bg-violet-50 text-violet-600",
                  },
                  {
                    label:
                      "Account security",
                    value:
                      emailVerified
                        ? "Verified"
                        : "Pending",
                    icon:
                      ShieldCheck,
                    iconClass:
                      "bg-amber-50 text-amber-600",
                  },
                ].map(
                  (
                    item
                  ) => {
                    const Icon =
                      item.icon;

                    return (
                      <div
                        key={
                          item.label
                        }
                        className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="mt-4 text-2xl font-black text-zinc-950 dark:text-white">
                          {item.value}
                        </div>

                        <div className="mt-1 text-xs font-semibold text-zinc-500">
                          {item.label}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <section
                id="appointments"
                className="scroll-mt-24 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Upcoming appointments
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Your next scheduled consultations.
                    </p>
                  </div>

                  <CalendarDays className="h-6 w-6 text-emerald-600" />
                </div>

                {upcomingAppointments.length ===
                0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-7 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                    <CalendarDays className="mx-auto h-8 w-8 text-zinc-400" />

                    <div className="mt-3 text-sm font-black text-zinc-800 dark:text-zinc-200">
                      No upcoming appointment
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      Find a doctor or clinic when you are ready to book.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {upcomingAppointments.map(
                      (
                        appointment
                      ) => {
                        const mode =
                          s(
                            appointment.mode ||
                              appointment.appointmentType
                          ).toLowerCase();

                        const isVideo =
                          mode.includes(
                            "video"
                          ) ||
                          mode.includes(
                            "tele"
                          );

                        return (
                          <div
                            key={
                              appointment.id
                            }
                            className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                {isVideo ? (
                                  <Video className="h-5 w-5" />
                                ) : (
                                  <Stethoscope className="h-5 w-5" />
                                )}
                              </div>

                              <div>
                                <div className="text-sm font-black text-zinc-950 dark:text-white">
                                  {s(
                                    appointment.doctorName
                                  ) ||
                                    s(
                                      appointment.clinicName
                                    ) ||
                                    "Healthcare appointment"}
                                </div>

                                <div className="mt-1 text-xs text-zinc-500">
                                  {s(
                                    appointment.specialty
                                  ) ||
                                    "Consultation"}
                                </div>

                                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                                  <Clock3 className="h-4 w-4" />

                                  {formatAppointmentDate(
                                    appointment
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                              {s(
                                appointment.status
                              ) ||
                                "Scheduled"}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                  Quick access
                </h3>

                <div className="mt-4 space-y-3">
                  {[
                    {
                      href:
                        "/doctors",
                      label:
                        "Find a doctor",
                      icon:
                        Stethoscope,
                    },
                    {
                      href:
                        "/clinics",
                      label:
                        "Find a clinic",
                      icon:
                        HeartPulse,
                    },
                    {
                      href:
                        "/patients/my-account",
                      label:
                        "My account",
                      icon:
                        UserRound,
                    },
                  ].map(
                    (
                      item
                    ) => {
                      const Icon =
                        item.icon;

                      return (
                        <Link
                          key={
                            item.href
                          }
                          href={
                            item.href
                          }
                          className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3.5 transition hover:bg-emerald-50 dark:bg-zinc-900/60"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <Icon className="h-4 w-4" />
                          </div>

                          <span className="flex-1 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            {item.label}
                          </span>

                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        </Link>
                      );
                    }
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Patient account
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Your dashboard reads only your authenticated patient profile and your patient appointment space.
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