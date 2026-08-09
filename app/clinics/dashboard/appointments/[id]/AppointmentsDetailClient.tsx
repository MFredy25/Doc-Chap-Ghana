"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  Timestamp,
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
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type AppointmentItem = {
  id: string;

  patientId?: string;
  patientName?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientEmail?: string;
  patientPhone?: string;
  phone?: string;

  patient?: {
    uid?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
  };

  providerName?: string;
  providerSpecialty?: string;

  specialty?: string;
  specialtyId?: string;
  specialtyName?: string;

  status?: string;
  bookingStatus?: string;

  appointmentType?: string;
  consultationMode?: string;

  reason?: string;
  notes?: string;

  date?: string;
  time?: string;
  startTime?: string;
  endTime?: string;

  startAt?: unknown;
  endAt?: unknown;
  startAtISO?: string;
  endAtISO?: string;

  location?: string;

  meetingLink?: string;
  meetingCode?: string;

  consultationPrice?: number;
  consultationCurrency?: string;

  createdAt?: unknown;
  updatedAt?: unknown;
};

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

function appointmentStart(
  item: AppointmentItem
): Date | null {
  return (
    toDate(
      item.startAt
    ) ||
    toDate(
      item.startAtISO
    ) ||
    (
      item.date
        ? new Date(
            `${item.date}T${
              safeString(
                item.time ||
                item.startTime
              ) || "00:00"
            }:00`
          )
        : null
    )
  );
}

function appointmentEnd(
  item: AppointmentItem
): Date | null {
  return (
    toDate(
      item.endAt
    ) ||
    toDate(
      item.endAtISO
    )
  );
}

function formatDate(
  value: Date | null
): string {
  if (!value) {
    return "Date not available";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-GH",
      {
        weekday:
          "long",
        day:
          "2-digit",
        month:
          "long",
        year:
          "numeric",
        timeZone:
          "Africa/Accra",
      }
    ).format(
      value
    );
  } catch {
    return value.toLocaleDateString();
  }
}

function formatTime(
  value: Date | null
): string {
  if (!value) {
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
    ).format(
      value
    );
  } catch {
    return value.toLocaleTimeString();
  }
}

function patientName(
  item: AppointmentItem
): string {
  const patient =
    safeObject(
      item.patient
    );

  const firstName =
    safeString(
      item.patientFirstName ||
        patient.firstName
    );

  const lastName =
    safeString(
      item.patientLastName ||
        patient.lastName
    );

  return (
    safeString(
      item.patientName ||
        patient.fullName ||
        patient.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Patient"
  );
}

function patientEmail(
  item: AppointmentItem
): string {
  const patient =
    safeObject(
      item.patient
    );

  return safeString(
    item.patientEmail ||
      patient.email
  );
}

function patientPhone(
  item: AppointmentItem
): string {
  const patient =
    safeObject(
      item.patient
    );

  return safeString(
    item.patientPhone ||
      item.phone ||
      patient.phone ||
      patient.phoneNumber
  );
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
    mode.includes(
      "tele"
    ) ||
    mode.includes(
      "video"
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

  return "In-person consultation";
}

function isTeleconsultation(
  item: AppointmentItem
): boolean {
  const mode =
    safeString(
      item.consultationMode ||
        item.appointmentType
    ).toLowerCase();

  return (
    mode.includes(
      "tele"
    ) ||
    mode.includes(
      "video"
    )
  );
}

function normalizedStatus(
  item: AppointmentItem
): string {
  return (
    safeString(
      item.status ||
        item.bookingStatus
    ).toLowerCase() ||
    "pending"
  );
}

function statusClass(
  status: string
): string {
  if (
    [
      "completed",
      "complete",
      "done",
      "finished",
    ].includes(status)
  ) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (
    [
      "cancelled",
      "canceled",
      "rejected",
    ].includes(status)
  ) {
    return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300";
  }

  if (
    status ===
    "confirmed"
  ) {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";
  }

  return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
}

function formatPrice(
  amount: unknown,
  currency: string
): string {
  const number =
    Number(amount);

  if (
    !Number.isFinite(
      number
    ) ||
    number <= 0
  ) {
    return "—";
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
        minimumFractionDigits:
          0,
        maximumFractionDigits:
          2,
      }
    ).format(
      number
    );
  } catch {
    return `${number.toLocaleString(
      "en-GH"
    )} ${
      currency ||
      "GHS"
    }`;
  }
}

export default function AppointmentsDetailClient() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const appointmentId =
    decodeURIComponent(
      safeString(
        params?.id
      )
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    uid,
    setUid,
  ] =
    useState<
      string | null
    >(
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
    appointment,
    setAppointment,
  ] =
    useState<AppointmentItem | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
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

    const authInstance =
      firebaseAuth;

    const firestoreInstance =
      firestore;

    let unsubscribeClinic:
      | (() => void)
      | null =
      null;

    let unsubscribeAppointment:
      | (() => void)
      | null =
      null;

    const unsubscribeAuth =
      onAuthStateChanged(
        authInstance,
        (
          user
        ) => {
          unsubscribeClinic?.();
          unsubscribeAppointment?.();

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
                      authInstance
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
                      authInstance
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
              },
              (
                snapshotError
              ) => {
                console.error(
                  "[ClinicAppointmentDetail] Clinic error:",
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

          if (
            !appointmentId
          ) {
            setError(
              "Appointment ID is missing."
            );

            setLoading(
              false
            );

            return;
          }

          const appointmentRef =
            doc(
              firestoreInstance,
              "clinics",
              user.uid,
              "appointments",
              appointmentId
            );

          unsubscribeAppointment =
            onSnapshot(
              appointmentRef,
              (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  setAppointment(
                    null
                  );

                  setError(
                    "Appointment not found."
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
                      AppointmentItem,
                      "id"
                    >
                  ),
                });

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
                  "[ClinicAppointmentDetail] Appointment error:",
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
      unsubscribeAuth();
      unsubscribeClinic?.();
      unsubscribeAppointment?.();
    };
  }, [
    appointmentId,
    router,
  ]);

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
          ).toLowerCase();

        return {
          name:
            safeString(
              profile.clinicName ||
                profile.displayName ||
                profile.fullName
            ) ||
            "Clinic",

          verified:
            clinicInfo.verified ===
              true ||
            verificationStatus ===
              "verified" ||
            verificationStatus ===
              "approved",
        };
      },
      [
        clinicData,
      ]
    );

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </main>

          <Footer />
        </div>
      </div>
    );
  }

  if (
    !appointment
  ) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <section className="rounded-[28px] border border-red-200 bg-white p-7 text-center shadow-sm dark:border-red-900/40 dark:bg-zinc-950">
              <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

              <h1 className="mt-4 text-2xl font-black text-zinc-950 dark:text-white">
                Appointment unavailable
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                {error ||
                  "This appointment could not be found."}
              </p>

              <Link
                href="/clinics/dashboard/appointments"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to appointments
              </Link>
            </section>
          </main>

          <Footer />
        </div>
      </div>
    );
  }

  const start =
    appointmentStart(
      appointment
    );

  const end =
    appointmentEnd(
      appointment
    );

  const status =
    normalizedStatus(
      appointment
    );

  const mode =
    consultationLabel(
      appointment
    );

  const teleconsultation =
    isTeleconsultation(
      appointment
    );

  const meetingLink =
    safeString(
      appointment.meetingLink
    );

  const specialty =
    safeString(
      appointment.specialtyName ||
        appointment.providerSpecialty ||
        appointment.specialty
    ) ||
    "General consultation";

  const email =
    patientEmail(
      appointment
    );

  const phone =
    patientPhone(
      appointment
    );

  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
      <ClinicSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#071b3a] via-[#0b2f63] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <Link
                href="/clinics/dashboard/appointments"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to appointments
              </Link>

              <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <CalendarDays className="h-4 w-4 text-cyan-300" />

                      Appointment details
                    </span>

                    {clinic.verified && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified clinic
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    {patientName(
                      appointment
                    )}
                  </h1>

                  <p className="mt-2 text-sm text-blue-100">
                    {specialty} • {mode}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black capitalize ${statusClass(
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
          </section>

          <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Patient information
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        Patient linked to this appointment
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoCard
                      label="Patient name"
                      value={
                        patientName(
                          appointment
                        )
                      }
                      icon={
                        UserRound
                      }
                    />

                    <InfoCard
                      label="Patient ID"
                      value={
                        safeString(
                          appointment.patientId ||
                            safeObject(
                              appointment.patient
                            ).uid
                        ) ||
                        "—"
                      }
                      icon={
                        CheckCircle2
                      }
                    />

                    <InfoCard
                      label="Email"
                      value={
                        email ||
                        "—"
                      }
                      icon={
                        Mail
                      }
                    />

                    <InfoCard
                      label="Phone number"
                      value={
                        phone ||
                        "—"
                      }
                      icon={
                        Phone
                      }
                    />
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <CalendarDays className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Appointment information
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        Consultation schedule and details
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoCard
                      label="Date"
                      value={
                        formatDate(
                          start
                        )
                      }
                      icon={
                        CalendarDays
                      }
                    />

                    <InfoCard
                      label="Time"
                      value={
                        end
                          ? `${formatTime(
                              start
                            )} – ${formatTime(
                              end
                            )}`
                          : formatTime(
                              start
                            )
                      }
                      icon={
                        Clock3
                      }
                    />

                    <InfoCard
                      label="Consultation type"
                      value={
                        mode
                      }
                      icon={
                        teleconsultation
                          ? Video
                          : Stethoscope
                      }
                    />

                    <InfoCard
                      label="Specialty"
                      value={
                        specialty
                      }
                      icon={
                        Stethoscope
                      }
                    />

                    <InfoCard
                      label="Price"
                      value={
                        formatPrice(
                          appointment.consultationPrice,
                          safeString(
                            appointment.consultationCurrency
                          ) ||
                          "GHS"
                        )
                      }
                      icon={
                        Building2
                      }
                    />

                    <InfoCard
                      label="Clinic"
                      value={
                        clinic.name
                      }
                      icon={
                        Building2
                      }
                    />
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-amber-600" />

                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Reason for appointment
                    </h2>
                  </div>

                  <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                    {safeString(
                      appointment.reason
                    ) ||
                    "No reason provided."}
                  </div>

                  {safeString(
                    appointment.notes
                  ) && (
                    <div className="mt-4">
                      <div className="text-xs font-black uppercase tracking-wide text-zinc-400">
                        Notes
                      </div>

                      <div className="mt-2 rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                        {appointment.notes}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <aside className="space-y-5">
                {teleconsultation && (
                  <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
                      <Video className="h-6 w-6" />
                    </div>

                    <h3 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                      Teleconsultation
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Access the online consultation room for this appointment.
                    </p>

                    {meetingLink ? (
                      <a
                        href={
                          meetingLink
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white transition hover:bg-violet-700"
                      >
                        <Video className="h-4 w-4" />

                        Access teleconsultation
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-zinc-300 px-5 py-4 text-sm font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        <Video className="h-4 w-4" />

                        Teleconsultation link unavailable
                      </button>
                    )}

                    {safeString(
                      appointment.meetingCode
                    ) && (
                      <div className="mt-4 rounded-2xl border border-violet-200 bg-white/70 p-3 dark:border-violet-900/40 dark:bg-zinc-950/50">
                        <div className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                          Meeting code
                        </div>

                        <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                          {appointment.meetingCode}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Appointment reference
                  </h3>

                  <div className="mt-3 break-all rounded-2xl bg-zinc-50 p-4 text-xs font-bold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    {appointment.id}
                  </div>

                  {safeString(
                    appointment.location
                  ) && (
                    <div className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                      {appointment.location}
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

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <Icon className="h-5 w-5 text-blue-600" />

      <div className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-black text-zinc-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}