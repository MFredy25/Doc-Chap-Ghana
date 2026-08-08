"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
  Video,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type AppointmentMode =
  | "in_person"
  | "video"
  | "phone";

type AppointmentStatus =
  | "ongoing"
  | "upcoming"
  | "completed"
  | "cancelled";

type Appointment = {
  id: string;
  patientName: string;
  reason: string;
  startAt: Date;
  endAt: Date;
  mode: AppointmentMode;
  status: AppointmentStatus;
  paid: boolean;
  amount: number;
  currency: string;
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
): Record<string, any> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      any
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
    "toDate" in
      (value as any) &&
    typeof (value as any)
      .toDate === "function"
  ) {
    try {
      return (
        value as any
      ).toDate();
    } catch {
      return null;
    }
  }

  return null;
}

function numberValue(
  value: unknown
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const parsed =
      Number(
        value
          .replace(
            /[^0-9.,-]/g,
            ""
          )
          .replace(
            ",",
            "."
          )
      );

    return Number.isFinite(
      parsed
    )
      ? parsed
      : 0;
  }

  return 0;
}

function formatMoney(
  amount: number,
  currency = "GHS"
): string {
  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style: "currency",
        currency:
          safeString(
            currency
          ).toUpperCase() ||
          "GHS",
        maximumFractionDigits: 2,
      }
    ).format(
      amount
    );
  } catch {
    return `${amount.toFixed(
      2
    )} ${currency}`;
  }
}

function formatTime(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(
    date
  );
}

function dayStart(
  date: Date
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function dayEnd(
  date: Date
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );
}

function getAppointmentMode(
  data: Record<string, any>
): AppointmentMode {
  const raw =
    `${safeString(
      data.appointmentType
    )} ${safeString(
      data.type
    )} ${safeString(
      data.mode
    )}`.toLowerCase();

  if (
    raw.includes(
      "phone"
    ) ||
    raw.includes(
      "call"
    )
  ) {
    return "phone";
  }

  if (
    raw.includes(
      "tele"
    ) ||
    raw.includes(
      "video"
    ) ||
    raw.includes(
      "visio"
    )
  ) {
    return "video";
  }

  return "in_person";
}

function getAppointmentStatus(
  data: Record<string, any>,
  startAt: Date,
  endAt: Date
): AppointmentStatus {
  const rawStatus =
    safeString(
      data.status
    ).toLowerCase();

  if (
    [
      "cancelled",
      "canceled",
      "cancelled_by_patient",
      "cancelled_by_doctor",
    ].includes(
      rawStatus
    )
  ) {
    return "cancelled";
  }

  if (
    [
      "completed",
      "complete",
      "finished",
      "done",
    ].includes(
      rawStatus
    )
  ) {
    return "completed";
  }

  const now =
    new Date();

  if (
    now >= startAt &&
    now < endAt
  ) {
    return "ongoing";
  }

  if (
    now >= endAt
  ) {
    return "completed";
  }

  return "upcoming";
}

function mapAppointment(
  id: string,
  raw: unknown
): Appointment | null {
  const data =
    safeObject(raw);

  const startAt =
    toDate(
      data.startAt
    ) ||
    toDate(
      data.appointmentDate
    ) ||
    toDate(
      data.date
    );

  if (
    !startAt
  ) {
    return null;
  }

  const durationMinutes =
    Number(
      data.durationMinutes
    ) > 0
      ? Number(
          data.durationMinutes
        )
      : 30;

  const endAt =
    new Date(
      startAt.getTime() +
        durationMinutes *
          60_000
    );

  const patient =
    safeObject(
      data.patientSummary
    );

  const payment =
    safeObject(
      data.payment
    );

  const paymentStatus =
    `${safeString(
      data.paymentStatus
    )} ${safeString(
      payment.status
    )}`.toLowerCase();

  return {
    id,

    patientName:
      safeString(
        data.patientName
      ) ||
      safeString(
        data.patientDisplayName
      ) ||
      safeString(
        patient.displayName
      ) ||
      safeString(
        patient.fullName
      ) ||
      "Patient",

    reason:
      safeString(
        data.reason
      ) ||
      safeString(
        data.motif
      ) ||
      "Consultation",

    startAt,
    endAt,

    mode:
      getAppointmentMode(
        data
      ),

    status:
      getAppointmentStatus(
        data,
        startAt,
        endAt
      ),

    paid:
      [
        "paid",
        "success",
        "succeeded",
        "completed",
      ].some(
        (
          status
        ) =>
          paymentStatus.includes(
            status
          )
      ) ||
      Boolean(
        payment.paidAt
      ),

    amount:
      numberValue(
        payment.netAmount
      ) ||
      numberValue(
        payment.amount
      ) ||
      numberValue(
        data.amount
      ) ||
      numberValue(
        data.consultationFee
      ),

    currency:
      safeString(
        payment.currency
      ).toUpperCase() ||
      safeString(
        data.currency
      ).toUpperCase() ||
      "GHS",
  };
}

function doctorView(
  raw: unknown
) {
  const data =
    safeObject(raw);

  const profile =
    safeObject(
      data.profile
    );

  const professional =
    safeObject(
      data.professional
    );

  const firstName =
    safeString(
      profile.firstName
    );

  const name =
    safeString(
      profile.displayName
    ) ||
    safeString(
      profile.fullName
    ) ||
    `${firstName} ${safeString(
      profile.lastName
    )}`.trim() ||
    "Doctor";

  const titledName =
    name === "Doctor"
      ? name
      : `Dr. ${name.replace(/^dr\.?\s+/i, "")}`;

  const verificationStatus =
    safeString(
      professional.verificationStatus
    ).toLowerCase() ||
    "pending";

  return {
    name: titledName,

    firstName:
      firstName ||
      name.split(
        " "
      )[0] ||
      "Doctor",

    specialty:
      safeString(
        professional.specialty
      ) ||
      safeString(
        profile.specialty
      ) ||
      "Medical professional",

    city:
      safeString(
        profile.city
      ) ||
      safeString(
        profile.region
      ) ||
      "Ghana",

    verified:
      professional.verified ===
        true ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",

    verificationStatus,
  };
}

function modeMeta(
  value: AppointmentMode
) {
  if (
    value === "video"
  ) {
    return {
      label:
        "Video",
      icon:
        Video,
      cls:
        "border-violet-200 bg-violet-50 text-violet-700",
    };
  }

  if (
    value === "phone"
  ) {
    return {
      label:
        "Phone",
      icon:
        Smartphone,
      cls:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label:
      "In person",
    icon:
      UserRound,
    cls:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
  };
}

function statusClass(
  value: AppointmentStatus
): string {
  if (
    value ===
    "ongoing"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    value ===
    "upcoming"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    value ===
    "cancelled"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

/* ============================================================
   PAGE
============================================================ */

export default function ScheduleClient() {
  const router =
    useRouter();

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
    >(null);

  const [
    doctorData,
    setDoctorData,
  ] =
    useState<any>(
      null
    );

  const [
    appointments,
    setAppointments,
  ] =
    useState<
      Appointment[]
    >([]);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  /* ============================================================
     AUTH
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

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuth,
        async (
          user
        ) => {
          if (
            !user?.uid
          ) {
            router.replace(
              "/doctors/login"
            );

            return;
          }

          try {
            const snapshot =
              await getDoc(
                doc(
                  firestore,
                  "professionals",
                  user.uid
                )
              );

            if (
              !snapshot.exists()
            ) {
              await signOut(
                firebaseAuth
              );

              router.replace(
                "/doctors/login"
              );

              return;
            }

            const data =
              snapshot.data();

            const professional =
              safeObject(
                data.professional
              );

            const type =
              safeString(
                data.professionalType ||
                  professional.type ||
                  data.role
              ).toLowerCase();

            if (
              (
                type &&
                type !==
                  "doctor"
              ) ||
              data.active ===
                false
            ) {
              await signOut(
                firebaseAuth
              );

              router.replace(
                "/doctors/login"
              );

              return;
            }

            setUid(
              user.uid
            );

            setDoctorData(
              data
            );

            setError(
              null
            );
          } catch (
            authError
          ) {
            console.error(
              authError
            );

            setError(
              "Unable to verify your doctor account."
            );
          } finally {
            setLoading(
              false
            );
          }
        }
      );

    return () =>
      unsubscribeAuth();
  }, [
    router,
  ]);

  /* ============================================================
     DOCTOR PROFILE REALTIME
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

    const unsubscribe =
      onSnapshot(
        doc(
          firestore,
          "professionals",
          uid
        ),
        (
          snapshot
        ) => {
          if (
            snapshot.exists()
          ) {
            setDoctorData(
              snapshot.data()
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [
    uid,
  ]);

  /* ============================================================
     TODAY APPOINTMENTS
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

    const now =
      new Date();

    const appointmentsQuery =
      query(
        collection(
          firestore,
          "professionals",
          uid,
          "appointments"
        ),
        where(
          "startAt",
          ">=",
          Timestamp.fromDate(
            dayStart(
              now
            )
          )
        ),
        where(
          "startAt",
          "<",
          Timestamp.fromDate(
            dayEnd(
              now
            )
          )
        ),
        orderBy(
          "startAt",
          "asc"
        )
      );

    const unsubscribe =
      onSnapshot(
        appointmentsQuery,
        (
          snapshot
        ) => {
          const mapped =
            snapshot.docs
              .map(
                (
                  appointmentDoc
                ) =>
                  mapAppointment(
                    appointmentDoc.id,
                    appointmentDoc.data()
                  )
              )
              .filter(
                (
                  appointment
                ): appointment is Appointment =>
                  appointment !==
                  null
              );

          setAppointments(
            mapped
          );
        },
        (
          appointmentsError
        ) => {
          console.error(
            appointmentsError
          );

          setAppointments(
            []
          );
        }
      );

    return () =>
      unsubscribe();
  }, [
    uid,
  ]);

  /* ============================================================
     COMPUTED
  ============================================================ */

  const doctor =
    useMemo(
      () =>
        doctorView(
          doctorData ||
            {}
        ),
      [
        doctorData,
      ]
    );

  const filteredAppointments =
    useMemo(() => {
      const queryValue =
        search
          .trim()
          .toLowerCase();

      if (
        !queryValue
      ) {
        return appointments;
      }

      return appointments.filter(
        (
          appointment
        ) =>
          appointment.patientName
            .toLowerCase()
            .includes(
              queryValue
            ) ||
          appointment.reason
            .toLowerCase()
            .includes(
              queryValue
            ) ||
          formatTime(
            appointment.startAt
          ).includes(
            queryValue
          )
      );
    }, [
      appointments,
      search,
    ]);

  const upcoming =
    appointments.filter(
      (
        appointment
      ) =>
        appointment.status ===
          "upcoming" ||
        appointment.status ===
          "ongoing"
    ).length;

  const videoCount =
    appointments.filter(
      (
        appointment
      ) =>
        appointment.mode ===
        "video"
    ).length;

  const phoneCount =
    appointments.filter(
      (
        appointment
      ) =>
        appointment.mode ===
        "phone"
    ).length;

  const revenue =
    appointments
      .filter(
        (
          appointment
        ) =>
          appointment.paid
      )
      .reduce(
        (
          total,
          appointment
        ) =>
          total +
          appointment.amount,
        0
      );

  const availability =
    safeObject(
      doctorData
        ?.availability
    );

  const week =
    safeObject(
      availability.week
    );

  const todayKey =
    [
      "sun",
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
    ][
      new Date().getDay()
    ];

  const todayAvailability =
    safeObject(
      week[
        todayKey
      ]
    );

  const configuration =
    safeObject(
      doctorData
        ?.configuration
    );

  /* ============================================================
     LOADING
  ============================================================ */

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <DoctorSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </main>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <DoctorSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          {/* =====================================================
              HERO
          ===================================================== */}

          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                      <CalendarDays className="h-4 w-4 text-cyan-300" />

                      Doctor schedule
                    </span>

                    {doctor.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified doctor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <ShieldCheck className="h-4 w-4" />

                        Verification{" "}
                        {
                          doctor.verificationStatus
                        }
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                    Today&apos;s schedule
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Welcome,{" "}
                    {
                      doctor.name
                    }
                    . Review today&apos;s appointments and your current consultation availability.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                      {
                        doctor.specialty
                      }
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                      <MapPin className="h-4 w-4 text-emerald-300" />

                      {
                        doctor.city
                      }
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/doctors/dashboard/appointments"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/15"
                  >
                    All appointments

                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/doctors/dashboard/configuration"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:bg-blue-50"
                  >
                    Availability settings

                    <Clock3 className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              CONTENT
          ===================================================== */}

          <section className="px-4 py-7 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {
                  error
                }
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
              {/* LEFT */}

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    [
                      "Today",
                      appointments.length,
                      CalendarCheck2,
                      "bg-blue-600",
                    ],
                    [
                      "Upcoming",
                      upcoming,
                      Clock3,
                      "bg-indigo-600",
                    ],
                    [
                      "Video",
                      videoCount,
                      Video,
                      "bg-violet-600",
                    ],
                    [
                      "Phone",
                      phoneCount,
                      Smartphone,
                      "bg-emerald-600",
                    ],
                  ].map(
                    (
                      [
                        label,
                        value,
                        Icon,
                        iconClass,
                      ]
                    ) => {
                      const CardIcon =
                        Icon as React.ElementType;

                      return (
                        <div
                          key={
                            String(
                              label
                            )
                          }
                          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                          >
                            <CardIcon className="h-5 w-5 text-white" />
                          </div>

                          <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                            {
                              String(
                                value
                              )
                            }
                          </div>

                          <div className="mt-1 text-xs text-zinc-500">
                            {
                              String(
                                label
                              )
                            }
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Today&apos;s appointments
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        Your consultations scheduled for today.
                      </p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                      <input
                        value={
                          search
                        }
                        onChange={(
                          event
                        ) =>
                          setSearch(
                            event.target.value
                          )
                        }
                        placeholder="Search..."
                        className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {filteredAppointments.length ===
                  0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

                      <div className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
                        No appointments found
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {filteredAppointments.map(
                        (
                          appointment
                        ) => {
                          const meta =
                            modeMeta(
                              appointment.mode
                            );

                          const ModeIcon =
                            meta.icon;

                          return (
                            <button
                              key={
                                appointment.id
                              }
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/doctors/dashboard/appointments/${appointment.id}`
                                )
                              }
                              className="w-full rounded-2xl border border-zinc-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-black text-zinc-950 dark:text-white">
                                      {
                                        appointment.patientName
                                      }
                                    </span>

                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(
                                        appointment.status
                                      )}`}
                                    >
                                      {
                                        appointment.status
                                      }
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    {
                                      appointment.reason
                                    }
                                  </p>

                                  <div className="mt-2 text-xs text-zinc-500">
                                    {formatTime(
                                      appointment.startAt
                                    )}
                                    {" - "}
                                    {formatTime(
                                      appointment.endAt
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.cls}`}
                                  >
                                    <ModeIcon className="h-3.5 w-3.5" />

                                    {
                                      meta.label
                                    }
                                  </span>

                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                                      appointment.paid
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-amber-200 bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {appointment.paid
                                      ? "Paid"
                                      : "Unpaid"}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT */}

              <aside className="space-y-5">
                <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
                    <Clock3 className="h-7 w-7" />

                    <h3 className="mt-4 text-lg font-black">
                      Today&apos;s availability
                    </h3>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                      <span className="text-sm font-semibold">
                        Status
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          todayAvailability.open ===
                          true
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-200 text-zinc-600"
                        }`}
                      >
                        {todayAvailability.open ===
                        true
                          ? "Open"
                          : "Closed"}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                      <div className="text-xs text-zinc-500">
                        Consultation hours
                      </div>

                      <div className="mt-1 text-base font-black dark:text-white">
                        {todayAvailability.open ===
                        true
                          ? `${safeString(
                              todayAvailability.start
                            ) || "09:00"} – ${
                              safeString(
                                todayAvailability.end
                              ) || "17:00"
                            }`
                          : "Not available today"}
                      </div>
                    </div>

                    <Link
                      href="/doctors/dashboard/configuration"
                      className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                    >
                      Manage availability

                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black dark:text-white">
                    Consultation modes
                  </h3>

                  <div className="mt-4 space-y-3">
                    {[
                      [
                        "In-person",
                        configuration.inPersonEnabled !==
                          false,
                        UserRound,
                      ],
                      [
                        "Video",
                        configuration.teleconsultationEnabled !==
                          false,
                        Video,
                      ],
                      [
                        "Phone",
                        configuration.phoneConsultationEnabled ===
                          true,
                        Smartphone,
                      ],
                    ].map(
                      (
                        [
                          label,
                          enabled,
                          Icon,
                        ]
                      ) => {
                        const ModeIcon =
                          Icon as React.ElementType;

                        return (
                          <div
                            key={
                              String(
                                label
                              )
                            }
                            className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
                          >
                            <ModeIcon className="h-4 w-4 text-blue-600" />

                            <span className="flex-1 text-xs font-semibold dark:text-zinc-300">
                              {
                                String(
                                  label
                                )
                              }
                            </span>

                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                enabled
                                  ? "bg-emerald-500"
                                  : "bg-zinc-300"
                              }`}
                            />
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <CreditCard className="h-6 w-6 text-emerald-700" />

                  <div className="mt-3 text-sm font-black dark:text-white">
                    Today&apos;s paid revenue
                  </div>

                  <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {formatMoney(
                      revenue,
                      appointments[0]
                        ?.currency ||
                        "GHS"
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
