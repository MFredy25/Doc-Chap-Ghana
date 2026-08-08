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
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Loader2,
  Search,
  ShieldCheck,
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

type TeleconsultationStatus =
  | "ongoing"
  | "upcoming"
  | "completed"
  | "cancelled";

type TeleconsultationItem = {
  id: string;
  patientName: string;
  reason: string;
  startAt: Date;
  endAt: Date;
  status: TeleconsultationStatus;
  meetingUrl?: string;
  meetingCode?: string;
};

type DoctorView = {
  name: string;
  firstName: string;
  specialty: string;
  verified: boolean;
  verificationStatus: string;
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

function isVideoConsultation(
  data: Record<string, any>
): boolean {
  const raw =
    `${safeString(
      data.appointmentType
    )} ${safeString(
      data.type
    )} ${safeString(
      data.mode
    )}`.toLowerCase();

  return (
    raw.includes(
      "tele"
    ) ||
    raw.includes(
      "video"
    ) ||
    raw.includes(
      "visio"
    )
  );
}

function getTeleconsultationStatus(
  data: Record<string, any>,
  startAt: Date,
  endAt: Date
): TeleconsultationStatus {
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

function mapTeleconsultation(
  id: string,
  raw: unknown
): TeleconsultationItem | null {
  const data =
    safeObject(raw);

  if (
    !isVideoConsultation(
      data
    )
  ) {
    return null;
  }

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

  const visioDaily =
    safeObject(
      data.visioDaily
    );

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
      "Teleconsultation",

    startAt,
    endAt,

    status:
      getTeleconsultationStatus(
        data,
        startAt,
        endAt
      ),

    meetingUrl:
      safeString(
        data.meetingLink
      ) ||
      safeString(
        data.storedMeetingLink
      ) ||
      safeString(
        data.dailyJoinUrl
      ) ||
      safeString(
        visioDaily.joinUrl
      ) ||
      undefined,

    meetingCode:
      safeString(
        data.meetingCode
      ) ||
      safeString(
        visioDaily.roomName
      ) ||
      undefined,
  };
}

function mapDoctor(
  raw: unknown
): DoctorView {
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

  const verificationStatus =
    safeString(
      professional.verificationStatus
    ).toLowerCase() ||
    "pending";

  return {
    name,

    firstName:
      firstName ||
      name.split(" ")[0] ||
      "Doctor",

    specialty:
      safeString(
        professional.specialty
      ) ||
      safeString(
        profile.specialty
      ) ||
      "Medical professional",

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

function statusClass(
  status: TeleconsultationStatus
): string {
  if (
    status ===
    "ongoing"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (
    status ===
    "upcoming"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300";
  }

  if (
    status ===
    "cancelled"
  ) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
}

function formatDate(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    date
  );
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
    teleconsultations,
    setTeleconsultations,
  ] =
    useState<
      TeleconsultationItem[]
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

    const firebaseAuthInstance =
      firebaseAuth;

    const firestoreInstance =
      firestore;

    const unsubscribe =
      onAuthStateChanged(
        firebaseAuthInstance,
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
                  firestoreInstance,
                  "professionals",
                  user.uid
                )
              );

            if (
              !snapshot.exists()
            ) {
              await signOut(
                firebaseAuthInstance
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

            const professionalType =
              safeString(
                data.professionalType ||
                  professional.type ||
                  data.role
              ).toLowerCase();

            if (
              (
                professionalType &&
                professionalType !==
                  "doctor"
              ) ||
              data.active ===
                false
            ) {
              await signOut(
                firebaseAuthInstance
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
              "[DoctorTeleconsultation] Auth error:",
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
      unsubscribe();
  }, [
    router,
  ]);

  /* ============================================================
     REALTIME DATA
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

    const unsubscribeProfile =
      onSnapshot(
        doc(
          firestoreInstance,
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
        },
        (
          profileError
        ) => {
          console.error(
            "[DoctorTeleconsultation] Profile realtime error:",
            profileError
          );
        }
      );

    const appointmentsQuery =
      query(
        collection(
          firestoreInstance,
          "professionals",
          uid,
          "appointments"
        ),
        orderBy(
          "startAt",
          "desc"
        )
      );

    const unsubscribeAppointments =
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
                  mapTeleconsultation(
                    appointmentDoc.id,
                    appointmentDoc.data()
                  )
              )
              .filter(
                (
                  item
                ): item is TeleconsultationItem =>
                  item !==
                  null
              );

          setTeleconsultations(
            mapped
          );
        },
        (
          appointmentsError
        ) => {
          console.error(
            "[DoctorTeleconsultation] Appointments realtime error:",
            appointmentsError
          );

          setTeleconsultations(
            []
          );
        }
      );

    return () => {
      unsubscribeProfile();
      unsubscribeAppointments();
    };
  }, [
    uid,
  ]);

  /* ============================================================
     COMPUTED
  ============================================================ */

  const doctor =
    useMemo(
      () =>
        mapDoctor(
          doctorData ||
            {}
        ),
      [
        doctorData,
      ]
    );

  const filteredTeleconsultations =
    useMemo(() => {
      const queryValue =
        search
          .trim()
          .toLowerCase();

      if (
        !queryValue
      ) {
        return teleconsultations;
      }

      return teleconsultations.filter(
        (
          item
        ) =>
          item.patientName
            .toLowerCase()
            .includes(
              queryValue
            ) ||
          item.reason
            .toLowerCase()
            .includes(
              queryValue
            ) ||
          formatDate(
            item.startAt
          )
            .toLowerCase()
            .includes(
              queryValue
            )
      );
    }, [
      teleconsultations,
      search,
    ]);

  const upcomingCount =
    teleconsultations.filter(
      (
        item
      ) =>
        item.status ===
        "upcoming"
    ).length;

  const ongoingCount =
    teleconsultations.filter(
      (
        item
      ) =>
        item.status ===
        "ongoing"
    ).length;

  const completedCount =
    teleconsultations.filter(
      (
        item
      ) =>
        item.status ===
        "completed"
    ).length;

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
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <Video className="h-4 w-4 text-cyan-300" />
                      Teleconsultation
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

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Video consultations
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Manage your remote consultations and access available meeting links from your professional space.
                  </p>

                  <div className="mt-5 inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                    {doctor.name}
                    {" • "}
                    {
                      doctor.specialty
                    }
                  </div>
                </div>

                <Link
                  href="/doctors/dashboard/appointments"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Appointments
                  <CalendarCheck2 className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* =====================================================
              CONTENT
          ===================================================== */}

          <section className="px-4 py-7 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {
                  error
                }
              </div>
            )}

            {/* KPI */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <CalendarCheck2 className="h-5 w-5 text-white" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {
                    upcomingCount
                  }
                </div>

                <div className="mt-1 text-xs font-medium text-zinc-500">
                  Upcoming
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                  <Video className="h-5 w-5 text-white" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {
                    ongoingCount
                  }
                </div>

                <div className="mt-1 text-xs font-medium text-zinc-500">
                  Ongoing
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {
                    completedCount
                  }
                </div>

                <div className="mt-1 text-xs font-medium text-zinc-500">
                  Completed
                </div>
              </div>
            </div>

            {/* LIST */}

            <div className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    Teleconsultation appointments
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Only video consultations are displayed here.
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
                    placeholder="Search patient..."
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {filteredTeleconsultations.length ===
              0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                    <Video className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-sm font-black text-zinc-950 dark:text-white">
                    No teleconsultations found
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Your video consultation appointments will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredTeleconsultations.map(
                    (
                      item
                    ) => (
                      <article
                        key={
                          item.id
                        }
                        className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <Video className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-black text-zinc-950 dark:text-white">
                                {
                                  item.patientName
                                }
                              </h3>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(
                                  item.status
                                )}`}
                              >
                                {
                                  item.status
                                }
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                              {
                                item.reason
                              }
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarCheck2 className="h-3.5 w-3.5" />

                                {formatDate(
                                  item.startAt
                                )}
                              </span>

                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5" />

                                {formatTime(
                                  item.startAt
                                )}
                                {" - "}
                                {formatTime(
                                  item.endAt
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/doctors/dashboard/appointments/${item.id}`
                              )
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                          >
                            <UserRound className="h-4 w-4" />

                            Appointment details
                          </button>

                          {item.meetingUrl ? (
                            <a
                              href={
                                item.meetingUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500"
                            >
                              <Video className="h-4 w-4" />

                              Join video call
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-zinc-200 px-3 py-2.5 text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            >
                              <Video className="h-4 w-4" />

                              Link not available
                            </button>
                          )}
                        </div>

                        {item.meetingCode && (
                          <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-[11px] font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                            Meeting code:{" "}
                            {
                              item.meetingCode
                            }
                          </div>
                        )}
                      </article>
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}