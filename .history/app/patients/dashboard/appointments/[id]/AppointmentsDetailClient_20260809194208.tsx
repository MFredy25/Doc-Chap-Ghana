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
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
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
  patientNotes?: string;

  address?: string;
  location?: string;

  phone?: string;

  amount?: number;
  price?: number;
  currency?: string;

  paymentStatus?: string;

  meetingLink?: string;
  videoUrl?: string;
  dailyUrl?: string;

  createdAt?: unknown;
  updatedAt?: unknown;
};

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
  appointment: Appointment | null
): Date | null {
  if (
    !appointment
  ) {
    return null;
  }

  const start =
    toDate(
      appointment.startAt
    );

  if (
    start
  ) {
    return start;
  }

  if (
    appointment.date
  ) {
    const raw =
      appointment.startTime
        ? `${appointment.date}T${appointment.startTime}`
        : appointment.date;

    const date =
      new Date(
        raw
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date;
    }
  }

  return null;
}

function formatFullDate(
  appointment: Appointment | null
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
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      date
    );
  }

  if (
    appointment
  ) {
    return [
      appointment.date,
      appointment.startTime,
    ]
      .filter(Boolean)
      .join(" • ") ||
      "Date not available";
  }

  return "Date not available";
}

function getProviderName(
  appointment: Appointment | null
): string {
  if (
    !appointment
  ) {
    return "Healthcare appointment";
  }

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
  appointment: Appointment | null
): string {
  if (
    !appointment
  ) {
    return "General consultation";
  }

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

function getMode(
  appointment: Appointment | null
): string {
  if (
    !appointment
  ) {
    return "Consultation";
  }

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

function formatAmount(
  amount: number | undefined,
  currency: string
): string {
  if (
    typeof amount !==
      "number" ||
    Number.isNaN(
      amount
    )
  ) {
    return "Not specified";
  }

  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style:
          "currency",
        currency:
          currency ||
          "GHS",
        maximumFractionDigits:
          2,
      }
    ).format(
      amount
    );
  } catch {
    return `${amount} ${
      currency ||
      "GHS"
    }`;
  }
}

function InfoRow({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          {label}
        </div>

        <div className="mt-1 break-words text-sm font-black text-zinc-900 dark:text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsDetailClient({
  appointmentId,
}: {
  appointmentId: string;
}) {
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
    appointment,
    setAppointment,
  ] =
    useState<Appointment | null>(
      null
    );

  const [
    notFound,
    setNotFound,
  ] =
    useState(false);

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

    let unsubscribeAppointment:
      | (() => void)
      | null =
      null;

    const stopListeners =
      () => {
        unsubscribePatient?.();
        unsubscribeAppointment?.();

        unsubscribePatient =
          null;

        unsubscribeAppointment =
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
                  "[PatientAppointmentDetail] Patient profile error:",
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

          /*
           * SECURITY:
           * The appointment is read ONLY under the currently
           * authenticated patient's own Firestore subtree.
           *
           * patients/{currentUid}/appointments/{appointmentId}
           *
           * We never search globally by appointmentId.
           */
          unsubscribeAppointment =
            onSnapshot(
              doc(
                firestoreInstance,
                "patients",
                patientUid,
                "appointments",
                appointmentId
              ),
              (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  setAppointment(
                    null
                  );

                  setNotFound(
                    true
                  );

                  setLoading(
                    false
                  );

                  return;
                }

                setAppointment({
                  id:
                    snapshot.id,
                  ...(
                    snapshot.data() as Omit<
                      Appointment,
                      "id"
                    >
                  ),
                });

                setNotFound(
                  false
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
                  "[PatientAppointmentDetail] Appointment error:",
                  snapshotError
                );

                setError(
                  "Unable to load this appointment."
                );

                setLoading(
                  false
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
    appointmentId,
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
          s(
            firebaseUser
              ?.displayName
          ) ||
          "Patient"
        );
      },
      [
        firebaseUser,
        patientData,
      ]
    );

  const providerName =
    getProviderName(
      appointment
    );

  const specialty =
    getSpecialty(
      appointment
    );

  const mode =
    getMode(
      appointment
    );

  const status =
    s(
      appointment
        ?.status
    ) ||
    "Scheduled";

  const address =
    s(
      appointment
        ?.address
    ) ||
    s(
      appointment
        ?.location
    );

  const meetingLink =
    s(
      appointment
        ?.meetingLink
    ) ||
    s(
      appointment
        ?.videoUrl
    ) ||
    s(
      appointment
        ?.dailyUrl
    );

  const reason =
    s(
      appointment
        ?.reason
    );

  const notes =
    s(
      appointment
        ?.patientNotes
    ) ||
    s(
      appointment
        ?.notes
    );

  const amount =
    typeof appointment
      ?.amount ===
      "number"
      ? appointment.amount
      : appointment
          ?.price;

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
                Loading appointment details...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (
    notFound
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <PatientsSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />

              <h1 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                Appointment not found
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                This appointment does not exist in your patient account or is no longer available.
              </p>

              <Link
                href="/patients/dashboard/appointments"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to my appointments
              </Link>
            </div>
          </main>

          <Footer />
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
          <section className="relative overflow-hidden border-b border-violet-950/20 bg-gradient-to-br from-[#24104f] via-[#5b21b6] to-[#7c3aed] text-white">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <Link
                href="/patients/dashboard/appointments"
                className="inline-flex items-center gap-2 text-sm font-bold text-violet-100 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                My appointments
              </Link>

              <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                      <CalendarDays className="h-4 w-4" />

                      Appointment details
                    </span>

                    <span
                      className={`inline-flex rounded-full border bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${statusClasses(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                    {providerName}
                  </h1>

                  <p className="mt-2 text-sm font-bold text-violet-100">
                    {specialty}
                  </p>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-violet-100">
                    Review the information attached to this appointment.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                    <UserRound className="h-4 w-4" />

                    {patientName}
                  </div>
                </div>

                {meetingLink &&
                  mode ===
                    "Teleconsultation" && (
                    <a
                      href={
                        meetingLink
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#24104f] shadow-xl transition hover:bg-violet-50"
                    >
                      <Video className="h-4 w-4" />

                      Join teleconsultation
                    </a>
                  )}
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
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
                      <CalendarDays className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-black text-zinc-950 dark:text-white">
                        Appointment information
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        Date, consultation type and healthcare provider.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoRow
                      icon={
                        CalendarDays
                      }
                      label="Date and time"
                      value={
                        formatFullDate(
                          appointment
                        )
                      }
                      iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300"
                    />

                    <InfoRow
                      icon={
                        mode ===
                        "Teleconsultation"
                          ? Video
                          : Stethoscope
                      }
                      label="Consultation type"
                      value={
                        mode
                      }
                      iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300"
                    />

                    <InfoRow
                      icon={
                        Stethoscope
                      }
                      label="Healthcare provider"
                      value={
                        providerName
                      }
                      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
                    />

                    <InfoRow
                      icon={
                        HeartPulse
                      }
                      label="Specialty"
                      value={
                        specialty
                      }
                      iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300"
                    />

                    {appointment
                      ?.durationMinutes !==
                      undefined && (
                      <InfoRow
                        icon={
                          Clock3
                        }
                        label="Duration"
                        value={`${appointment.durationMinutes} minutes`}
                        iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300"
                      />
                    )}

                    <InfoRow
                      icon={
                        CheckCircle2
                      }
                      label="Status"
                      value={
                        status
                      }
                      iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300"
                    />
                  </div>
                </section>

                {(reason ||
                  notes) && (
                  <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-base font-black text-zinc-950 dark:text-white">
                          Consultation information
                        </h2>

                        <p className="mt-1 text-xs text-zinc-500">
                          Reason or notes attached to this appointment.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {reason && (
                        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                            Reason for consultation
                          </div>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                            {reason}
                          </p>
                        </div>
                      )}

                      {notes && (
                        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                            Notes
                          </div>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                            {notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {(address ||
                  appointment
                    ?.phone) && (
                  <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300">
                        <MapPin className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-base font-black text-zinc-950 dark:text-white">
                          Location & contact
                        </h2>

                        <p className="mt-1 text-xs text-zinc-500">
                          Practical information for this consultation.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {address && (
                        <InfoRow
                          icon={
                            MapPin
                          }
                          label="Location"
                          value={
                            address
                          }
                          iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300"
                        />
                      )}

                      {appointment
                        ?.phone && (
                        <InfoRow
                          icon={
                            Phone
                          }
                          label="Phone"
                          value={
                            appointment.phone
                          }
                          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
                        />
                      )}
                    </div>
                  </section>
                )}
              </div>

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white">
                    {mode ===
                    "Teleconsultation" ? (
                      <Video className="h-7 w-7" />
                    ) : (
                      <Stethoscope className="h-7 w-7" />
                    )}
                  </div>

                  <h3 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                    {providerName}
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-zinc-500">
                    {specialty}
                  </p>

                  <div className="mt-5">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${statusClasses(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />

                    <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                      Payment
                    </h3>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <span className="text-xs text-zinc-500">
                        Amount
                      </span>

                      <span className="text-xs font-black text-zinc-900 dark:text-white">
                        {formatAmount(
                          amount,
                          s(
                            appointment
                              ?.currency
                          ) ||
                            "GHS"
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <span className="text-xs text-zinc-500">
                        Payment status
                      </span>

                      <span className="text-xs font-black text-zinc-900 dark:text-white">
                        {s(
                          appointment
                            ?.paymentStatus
                        ) ||
                          "Not specified"}
                      </span>
                    </div>
                  </div>
                </section>

                {meetingLink &&
                  mode ===
                    "Teleconsultation" && (
                    <a
                      href={
                        meetingLink
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <Video className="h-4 w-4" />

                      Join teleconsultation
                    </a>
                  )}

                <Link
                  href="/patients/dashboard/appointments"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300"
                >
                  <ArrowLeft className="h-4 w-4" />

                  Back to appointments
                </Link>

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <BadgeCheck className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Private appointment
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    This page opens the appointment only from your authenticated patient account.
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