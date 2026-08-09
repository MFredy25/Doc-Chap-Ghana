"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Mail,
  Phone,
  Stethoscope,
  UserRound,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type AppointmentType =
  | "in_person"
  | "teleconsultation"
  | "phone";

type ConfirmationData = {
  appointmentId: string;
  clinicId: string;
  clinicName: string;
  specialty: string;
  date: string;
  startAt: string;
  endAt: string;
  appointmentType: AppointmentType;
  reason: string;
};

type PatientInformation = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const STORAGE_KEY =
  "docchapghana:clinic-appointment-confirmed";

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function objectValue(
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

function isAppointmentType(
  value: unknown
): value is AppointmentType {
  return (
    value === "in_person" ||
    value === "teleconsultation" ||
    value === "phone"
  );
}

function parseConfirmation(
  value: string | null
): ConfirmationData | null {
  if (!value) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(
        value
      ) as Partial<ConfirmationData>;

    if (
      !s(
        parsed.appointmentId
      ) ||
      !s(
        parsed.clinicId
      ) ||
      !s(
        parsed.clinicName
      ) ||
      !s(
        parsed.date
      ) ||
      !s(
        parsed.startAt
      ) ||
      !s(
        parsed.endAt
      ) ||
      !isAppointmentType(
        parsed.appointmentType
      )
    ) {
      return null;
    }

    return {
      appointmentId:
        s(
          parsed.appointmentId
        ),

      clinicId:
        s(
          parsed.clinicId
        ),

      clinicName:
        s(
          parsed.clinicName
        ),

      specialty:
        s(
          parsed.specialty
        ),

      date:
        s(
          parsed.date
        ),

      startAt:
        s(
          parsed.startAt
        ),

      endAt:
        s(
          parsed.endAt
        ),

      appointmentType:
        parsed.appointmentType,

      reason:
        s(
          parsed.reason
        ),
    };
  } catch {
    return null;
  }
}

function formatDate(
  date: string
): string {
  const parsed =
    new Date(
      `${date}T12:00:00.000Z`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      timeZone:
        "Africa/Accra",

      weekday:
        "long",

      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    parsed
  );
}

function formatTime(
  value: string
): string {
  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      timeZone:
        "Africa/Accra",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        true,
    }
  ).format(
    parsed
  );
}

function appointmentTypeLabel(
  value: AppointmentType
): string {
  if (
    value === "in_person"
  ) {
    return "In-person consultation";
  }

  if (
    value === "teleconsultation"
  ) {
    return "Teleconsultation";
  }

  return "Phone consultation";
}

export default function AppointmentConfirmed() {
  const router =
    useRouter();

  const [
    confirmation,
    setConfirmation,
  ] =
    useState<ConfirmationData | null>(
      null
    );

  const [
    patient,
    setPatient,
  ] =
    useState<PatientInformation>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });

  const [
    patientLoading,
    setPatientLoading,
  ] =
    useState(
      true
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  useEffect(() => {
    const data =
      parseConfirmation(
        window.sessionStorage.getItem(
          STORAGE_KEY
        )
      );

    setConfirmation(
      data
    );

    setLoading(
      false
    );
  }, []);


  useEffect(() => {
    const firebaseAuth =
      auth;

    const firestore =
      db;

    if (
      !firebaseAuth ||
      !firestore
    ) {
      setPatientLoading(
        false
      );

      return;
    }

    const unsubscribe =
      onAuthStateChanged(
        firebaseAuth,
        async (
          currentUser
        ) => {
          if (
            !currentUser
          ) {
            setPatientLoading(
              false
            );

            return;
          }

          try {
            const snapshot =
              await getDoc(
                doc(
                  firestore,
                  "patients",
                  currentUser.uid
                )
              );

            const data =
              snapshot.exists()
                ? objectValue(
                    snapshot.data()
                  )
                : {};

            const profile =
              objectValue(
                data.profile
              );

            const firstName =
              s(
                profile.firstName ||
                data.firstName
              );

            const lastName =
              s(
                profile.lastName ||
                data.lastName
              );

            const displayName =
              s(
                profile.displayName ||
                profile.fullName ||
                data.displayName ||
                data.fullName ||
                currentUser.displayName
              );

            const fallbackNames =
              displayName
                .split(/\s+/)
                .filter(
                  Boolean
                );

            setPatient({
              firstName:
                firstName ||
                fallbackNames[0] ||
                "",

              lastName:
                lastName ||
                fallbackNames
                  .slice(1)
                  .join(" "),

              email:
                s(
                  profile.email ||
                  data.email ||
                  currentUser.email
                ),

              phone:
                s(
                  profile.phone ||
                  profile.phoneNumber ||
                  data.phone ||
                  data.phoneNumber ||
                  currentUser.phoneNumber
                ),
            });
          } catch (
            patientError
          ) {
            console.error(
              "[ClinicAppointmentConfirmed] Patient information error:",
              patientError
            );

            const displayName =
              s(
                currentUser.displayName
              );

            const names =
              displayName
                .split(/\s+/)
                .filter(
                  Boolean
                );

            setPatient({
              firstName:
                names[0] ||
                "",

              lastName:
                names
                  .slice(1)
                  .join(" "),

              email:
                s(
                  currentUser.email
                ),

              phone:
                s(
                  currentUser.phoneNumber
                ),
            });
          } finally {
            setPatientLoading(
              false
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

            <p className="mt-4 text-sm font-bold text-zinc-700 dark:text-zinc-200">
              Loading appointment confirmation...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (
    !confirmation
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <section className="rounded-[30px] border border-zinc-200 bg-white p-7 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-9">
            <CalendarDays className="mx-auto h-10 w-10 text-zinc-400" />

            <h1 className="mt-5 text-2xl font-black text-zinc-950 dark:text-white">
              Appointment confirmation unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              We could not retrieve the confirmed appointment information.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/search/clinic"
                )
              }
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to clinics
            </button>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="overflow-hidden rounded-[34px] border border-emerald-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-emerald-900/40 dark:bg-zinc-950">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] px-6 py-10 text-center text-white sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/15 shadow-xl backdrop-blur">
                <CheckCircle2 className="h-11 w-11" />
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
                Appointment confirmed
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
                Your appointment with {confirmation.clinicName} has been successfully confirmed.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex items-center gap-4 rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Building2 className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                  Clinic
                </div>

                <div className="mt-1 truncate text-base font-black text-zinc-950 dark:text-white">
                  {confirmation.clinicName}
                </div>

                {confirmation.specialty && (
                  <div className="mt-1 text-xs font-semibold text-zinc-500">
                    {confirmation.specialty}
                  </div>
                )}
              </div>
            </div>

            <section className="mt-6 rounded-[24px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <div className="text-sm font-black text-zinc-950 dark:text-white">
                    Patient information
                  </div>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Details linked to this appointment
                  </p>
                </div>
              </div>

              {patientLoading ? (
                <div className="mt-5 flex min-h-24 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                      First name
                    </div>

                    <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                      {patient.firstName ||
                        "—"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                      Last name
                    </div>

                    <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                      {patient.lastName ||
                        "—"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </div>

                    <div className="mt-1 break-all text-sm font-semibold text-zinc-950 dark:text-white">
                      {patient.email ||
                        "—"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                      <Phone className="h-3.5 w-3.5" />
                      Phone number
                    </div>

                    <div className="mt-1 text-sm font-semibold text-zinc-950 dark:text-white">
                      {patient.phone ||
                        "—"}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <CalendarDays className="h-5 w-5 text-emerald-600" />

                <div className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                  Date
                </div>

                <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                  {formatDate(
                    confirmation.date
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <Clock3 className="h-5 w-5 text-blue-600" />

                <div className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                  Time
                </div>

                <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                  {formatTime(
                    confirmation.startAt
                  )}{" "}
                  –{" "}
                  {formatTime(
                    confirmation.endAt
                  )}
                </div>

                <div className="mt-1 text-xs font-semibold text-zinc-500">
                  Ghana time
                </div>
              </div>

              <div className="rounded-[22px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <Stethoscope className="h-5 w-5 text-violet-600" />

                <div className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                  Appointment type
                </div>

                <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                  {appointmentTypeLabel(
                    confirmation.appointmentType
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <FileText className="h-5 w-5 text-amber-600" />

                <div className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                  Reason
                </div>

                <div className="mt-1 text-sm font-semibold leading-6 text-zinc-700 dark:text-zinc-300">
                  {confirmation.reason ||
                    "No reason provided."}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[22px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Appointment reference
              </div>

              <div className="mt-2 break-all text-sm font-black text-emerald-900 dark:text-emerald-100">
                {confirmation.appointmentId}
              </div>
            </div>

            <Link
              href="/patients/dashboard"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700"
            >
              <CalendarDays className="h-5 w-5" />

              Go to my appointments
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}