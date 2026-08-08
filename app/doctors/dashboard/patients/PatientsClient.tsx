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
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  Users,
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

type PatientRecord = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  city: string;
  photoUrl: string;
  lastAppointmentAt: Date | null;
  appointmentCount: number;
  source:
    | "patient_record"
    | "appointment";
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

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return parsed;
    }
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

function formatPatientDate(
  date: Date | null
): string {
  if (!date) {
    return "No appointment yet";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function mapPatientRecord(
  id: string,
  rawData: unknown
): PatientRecord {
  const data =
    safeObject(rawData);

  const profile =
    safeObject(
      data.profile
    );

  const firstName =
    safeString(
      data.firstName
    ) ||
    safeString(
      profile.firstName
    );

  const lastName =
    safeString(
      data.lastName
    ) ||
    safeString(
      profile.lastName
    );

  const fullName =
    safeString(
      data.fullName
    ) ||
    safeString(
      data.displayName
    ) ||
    safeString(
      profile.fullName
    ) ||
    safeString(
      profile.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Patient";

  return {
    id,

    fullName,

    firstName:
      firstName ||
      fullName
        .split(" ")[0] ||
      "",

    lastName,

    email:
      safeString(
        data.email
      ) ||
      safeString(
        profile.email
      ),

    phone:
      safeString(
        data.phone
      ) ||
      safeString(
        profile.phone
      ),

    gender:
      safeString(
        data.gender
      ) ||
      safeString(
        profile.gender
      ),

    city:
      safeString(
        data.city
      ) ||
      safeString(
        profile.city
      ) ||
      safeString(
        profile.region
      ),

    photoUrl:
      safeString(
        data.photoUrl
      ) ||
      safeString(
        data.photoURL
      ) ||
      safeString(
        profile.photoUrl
      ) ||
      safeString(
        profile.photoURL
      ),

    lastAppointmentAt:
      toDate(
        data.lastAppointmentAt
      ) ||
      toDate(
        data.updatedAt
      ) ||
      toDate(
        data.createdAt
      ),

    appointmentCount:
      typeof data.appointmentCount ===
        "number" &&
      Number.isFinite(
        data.appointmentCount
      )
        ? data.appointmentCount
        : 0,

    source:
      "patient_record",
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

function mergePatients(
  directPatients:
    PatientRecord[],
  appointmentPatients:
    PatientRecord[]
): PatientRecord[] {
  const map =
    new Map<
      string,
      PatientRecord
    >();

  [
    ...appointmentPatients,
    ...directPatients,
  ].forEach(
    (
      patient
    ) => {
      const existing =
        map.get(
          patient.id
        );

      if (
        !existing
      ) {
        map.set(
          patient.id,
          patient
        );

        return;
      }

      map.set(
        patient.id,
        {
          ...existing,
          ...patient,

          fullName:
            patient.fullName ||
            existing.fullName,

          email:
            patient.email ||
            existing.email,

          phone:
            patient.phone ||
            existing.phone,

          city:
            patient.city ||
            existing.city,

          photoUrl:
            patient.photoUrl ||
            existing.photoUrl,

          appointmentCount:
            Math.max(
              patient.appointmentCount,
              existing.appointmentCount
            ),

          lastAppointmentAt:
            patient.lastAppointmentAt &&
            (
              !existing.lastAppointmentAt ||
              patient.lastAppointmentAt >
                existing.lastAppointmentAt
            )
              ? patient.lastAppointmentAt
              : existing.lastAppointmentAt,
        }
      );
    }
  );

  return Array.from(
    map.values()
  ).sort(
    (
      first,
      second
    ) =>
      (
        second.lastAppointmentAt
          ?.getTime() ||
        0
      ) -
      (
        first.lastAppointmentAt
          ?.getTime() ||
        0
      )
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function PatientsClient() {
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
    doctorData,
    setDoctorData,
  ] =
    useState<any>(null);

  const [
    directPatients,
    setDirectPatients,
  ] =
    useState<
      PatientRecord[]
    >([]);

  const [
    appointmentPatients,
    setAppointmentPatients,
  ] =
    useState<
      PatientRecord[]
    >([]);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

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
              "[DoctorPatients] Auth error:",
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
  }, [router]);

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
        }
      );

    const unsubscribePatients =
      onSnapshot(
        collection(
          firestoreInstance,
          "professionals",
          uid,
          "patients"
        ),
        (
          snapshot
        ) => {
          const mapped =
            snapshot.docs.map(
              (
                patientDoc
              ) =>
                mapPatientRecord(
                  patientDoc.id,
                  patientDoc.data()
                )
            );

          setDirectPatients(
            mapped
          );
        },
        (
          patientsError
        ) => {
          console.error(
            "[DoctorPatients] Patients collection error:",
            patientsError
          );

          setDirectPatients(
            []
          );
        }
      );

    const unsubscribeAppointments =
      onSnapshot(
        collection(
          firestoreInstance,
          "professionals",
          uid,
          "appointments"
        ),
        (
          snapshot
        ) => {
          const grouped =
            new Map<
              string,
              PatientRecord
            >();

          snapshot.docs.forEach(
            (
              appointmentDoc
            ) => {
              const data =
                safeObject(
                  appointmentDoc.data()
                );

              const patientSummary =
                safeObject(
                  data.patientSummary
                );

              const patientId =
                safeString(
                  data.patientId
                ) ||
                safeString(
                  patientSummary.uid
                ) ||
                safeString(
                  patientSummary.id
                );

              if (
                !patientId
              ) {
                return;
              }

              const fullName =
                safeString(
                  data.patientName
                ) ||
                safeString(
                  data.patientDisplayName
                ) ||
                safeString(
                  patientSummary.displayName
                ) ||
                safeString(
                  patientSummary.fullName
                ) ||
                "Patient";

              const appointmentDate =
                toDate(
                  data.startAt
                ) ||
                toDate(
                  data.appointmentDate
                ) ||
                toDate(
                  data.date
                );

              const existing =
                grouped.get(
                  patientId
                );

              grouped.set(
                patientId,
                {
                  id:
                    patientId,

                  fullName,

                  firstName:
                    safeString(
                      patientSummary.firstName
                    ) ||
                    fullName
                      .split(" ")[0] ||
                    "",

                  lastName:
                    safeString(
                      patientSummary.lastName
                    ),

                  email:
                    safeString(
                      patientSummary.email
                    ),

                  phone:
                    safeString(
                      patientSummary.phone
                    ),

                  gender:
                    safeString(
                      patientSummary.gender
                    ),

                  city:
                    safeString(
                      patientSummary.city
                    ) ||
                    safeString(
                      patientSummary.region
                    ),

                  photoUrl:
                    safeString(
                      patientSummary.photoUrl
                    ) ||
                    safeString(
                      patientSummary.photoURL
                    ),

                  lastAppointmentAt:
                    appointmentDate &&
                    (
                      !existing
                        ?.lastAppointmentAt ||
                      appointmentDate >
                        existing.lastAppointmentAt
                    )
                      ? appointmentDate
                      : existing
                          ?.lastAppointmentAt ||
                        null,

                  appointmentCount:
                    (
                      existing
                        ?.appointmentCount ||
                      0
                    ) + 1,

                  source:
                    "appointment",
                }
              );
            }
          );

          setAppointmentPatients(
            Array.from(
              grouped.values()
            )
          );
        },
        (
          appointmentsError
        ) => {
          console.error(
            "[DoctorPatients] Appointment patients error:",
            appointmentsError
          );

          setAppointmentPatients(
            []
          );
        }
      );

    return () => {
      unsubscribeProfile();
      unsubscribePatients();
      unsubscribeAppointments();
    };
  }, [uid]);

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
      [doctorData]
    );

  const patients =
    useMemo(
      () =>
        mergePatients(
          directPatients,
          appointmentPatients
        ),
      [
        directPatients,
        appointmentPatients,
      ]
    );

  const filteredPatients =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (
        !query
      ) {
        return patients;
      }

      return patients.filter(
        (
          patient
        ) =>
          patient.fullName
            .toLowerCase()
            .includes(
              query
            ) ||
          patient.email
            .toLowerCase()
            .includes(
              query
            ) ||
          patient.phone
            .toLowerCase()
            .includes(
              query
            ) ||
          patient.city
            .toLowerCase()
            .includes(
              query
            )
      );
    }, [
      patients,
      search,
    ]);

  const withPhone =
    patients.filter(
      (
        patient
      ) =>
        Boolean(
          patient.phone
        )
    ).length;

  const withEmail =
    patients.filter(
      (
        patient
      ) =>
        Boolean(
          patient.email
        )
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
                      <Users className="h-4 w-4 text-cyan-300" />
                      Patients
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
                    Your patients
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Access patients linked to your consultations and follow their appointment activity from your professional space.
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
                {error}
              </div>
            )}

            {/* KPI */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <Users className="h-5 w-5 text-white" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {
                    patients.length
                  }
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Patients
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                  <Phone className="h-5 w-5 text-white" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {
                    withPhone
                  }
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  With phone
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                  <Mail className="h-5 w-5 text-white" />
                </div>

                <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                  {
                    withEmail
                  }
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  With email
                </div>
              </div>
            </div>

            {/* DIRECTORY */}

            <div className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    Patient directory
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Patients from your doctor records and appointments.
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
                    placeholder="Search patients..."
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {filteredPatients.length ===
              0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
                  <UserRound className="mx-auto h-8 w-8 text-zinc-400" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    No patients found
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Patients linked to your appointments will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredPatients.map(
                    (
                      patient
                    ) => (
                      <article
                        key={
                          patient.id
                        }
                        className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            {patient.photoUrl ? (
                              <img
                                src={
                                  patient.photoUrl
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-black text-zinc-950 dark:text-white">
                              {
                                patient.fullName
                              }
                            </h3>

                            <p className="mt-1 text-xs text-zinc-500">
                              {
                                patient.appointmentCount
                              }{" "}
                              appointment
                              {patient.appointmentCount ===
                              1
                                ? ""
                                : "s"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-xs">
                          {patient.phone && (
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600" />

                              <span className="truncate">
                                {
                                  patient.phone
                                }
                              </span>
                            </div>
                          )}

                          {patient.email && (
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-violet-600" />

                              <span className="truncate">
                                {
                                  patient.email
                                }
                              </span>
                            </div>
                          )}

                          {patient.city && (
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" />

                              <span className="truncate">
                                {
                                  patient.city
                                }
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 rounded-xl bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500 dark:bg-zinc-900">
                          Last appointment:{" "}
                          {formatPatientDate(
                            patient.lastAppointmentAt
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/doctors/dashboard/patients/${encodeURIComponent(
                                patient.id
                              )}`
                            )
                          }
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"
                        >
                          View patient

                          <ArrowRight className="h-4 w-4" />
                        </button>
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
