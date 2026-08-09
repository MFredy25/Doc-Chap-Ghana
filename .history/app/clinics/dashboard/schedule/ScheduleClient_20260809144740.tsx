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
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Plus,
  Save,
  Stethoscope,
  UserRound,
  Users,
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

type AvailabilityItem = {
  id: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  enabled?: boolean;
};

type TeamMember = {
  id: string;
  uid?: string;
  professionalId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  role?: string;
  professionalType?: string;
  specialty?: string;
  status?: string;
  active?: boolean;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    specialty?: string;
  };

  professional?: {
    type?: string;
    specialty?: string;
  };
};

type DoctorOption = {
  id: string;
  professionalId: string;
  name: string;
  specialty: string;
  role: string;
};

type DoctorScheduleItem = {
  id: string;
  clinicId?: string;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  date?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  consultationMode?: string;
  location?: string;
  note?: string;
  status?: string;
  createdAt?: unknown;
};

type ProgramForm = {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationMode: "in_person" | "video" | "phone";
  location: string;
  note: string;
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
    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
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

function getDayLabel(
  dateString: string
): string {
  if (!dateString) {
    return "";
  }

  const date =
    new Date(
      `${dateString}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      weekday: "long",
    }
  ).format(date);
}

function formatCreatedAt(
  value: unknown
): string {
  const date =
    toDate(value);

  if (!date) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-GH",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Accra",
      }
    ).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function mapDoctor(
  member: TeamMember
): DoctorOption | null {
  const profile =
    safeObject(
      member.profile
    );

  const professional =
    safeObject(
      member.professional
    );

  const professionalType =
    safeString(
      member.professionalType ||
        professional.type ||
        member.role
    ).toLowerCase();

  const role =
    safeString(
      member.role
    ).toLowerCase();

  const looksLikeDoctor =
    professionalType === "doctor" ||
    professionalType === "physician" ||
    role === "doctor" ||
    role === "physician" ||
    role === "medical_doctor" ||
    role === "medical doctor";

  if (
    !looksLikeDoctor ||
    member.active === false ||
    safeString(
      member.status
    ).toLowerCase() ===
      "disabled"
  ) {
    return null;
  }

  const firstName =
    safeString(
      member.firstName ||
        profile.firstName
    );

  const lastName =
    safeString(
      member.lastName ||
        profile.lastName
    );

  const rawName =
    safeString(
      member.fullName ||
        member.displayName ||
        profile.fullName ||
        profile.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Doctor";

  const name =
    rawName === "Doctor"
      ? rawName
      : `Dr. ${rawName.replace(
          /^dr\.?\s+/i,
          ""
        )}`;

  const specialty =
    safeString(
      member.specialty ||
        profile.specialty ||
        professional.specialty
    ) ||
    "Medical doctor";

  return {
    id:
      member.id,

    professionalId:
      safeString(
        member.professionalId ||
          member.uid
      ) ||
      member.id,

    name,

    specialty,

    role:
      role || "doctor",
  };
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
    useState(true);

  const [
    uid,
    setUid,
  ] =
    useState<string | null>(
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
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null
    );

  const [
    availability,
    setAvailability,
  ] =
    useState<AvailabilityItem[]>(
      []
    );

  const [
    teamMembers,
    setTeamMembers,
  ] =
    useState<TeamMember[]>(
      []
    );

  const [
    programs,
    setPrograms,
  ] =
    useState<DoctorScheduleItem[]>(
      []
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<ProgramForm>({
      doctorId: "",
      date: "",
      startTime: "",
      endTime: "",
      consultationMode:
        "in_person",
      location: "",
      note: "",
    });

  /* ============================================================
     AUTH / CLINIC
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
                  data.active === false ||
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
                  "[ClinicSchedule] Clinic realtime error:",
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
     AVAILABILITY
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
        "availability"
      ),
      (
        snapshot
      ) => {
        setAvailability(
          snapshot.docs.map(
            (
              item
            ) => ({
              id:
                item.id,

              ...(
                item.data() as Omit<
                  AvailabilityItem,
                  "id"
                >
              ),
            })
          )
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicSchedule] Availability realtime error:",
          snapshotError
        );
      }
    );
  }, [
    uid,
  ]);

  /* ============================================================
     CLINIC TEAM / DOCTORS
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
        "team"
      ),
      (
        snapshot
      ) => {
        setTeamMembers(
          snapshot.docs.map(
            (
              memberDocument
            ) => ({
              id:
                memberDocument.id,

              ...(
                memberDocument.data() as Omit<
                  TeamMember,
                  "id"
                >
              ),
            })
          )
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicSchedule] Team realtime error:",
          snapshotError
        );
      }
    );
  }, [
    uid,
  ]);

  /* ============================================================
     DOCTOR PROGRAMS
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
        "schedule"
      ),
      (
        snapshot
      ) => {
        const rows =
          snapshot.docs.map(
            (
              scheduleDocument
            ) => ({
              id:
                scheduleDocument.id,

              ...(
                scheduleDocument.data() as Omit<
                  DoctorScheduleItem,
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
            const aKey =
              `${safeString(
                a.date
              )} ${safeString(
                a.startTime
              )}`;

            const bKey =
              `${safeString(
                b.date
              )} ${safeString(
                b.startTime
              )}`;

            return aKey.localeCompare(
              bKey
            );
          }
        );

        setPrograms(
          rows
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicSchedule] Programs realtime error:",
          snapshotError
        );
      }
    );
  }, [
    uid,
  ]);

  /* ============================================================
     COMPUTED
  ============================================================ */

  const clinicName =
    useMemo(
      () => {
        const profile =
          safeObject(
            clinicData?.profile
          );

        return (
          safeString(
            profile.clinicName
          ) ||
          safeString(
            profile.displayName
          ) ||
          safeString(
            profile.fullName
          ) ||
          "Clinic"
        );
      },
      [
        clinicData,
      ]
    );

  const doctors =
    useMemo(
      () =>
        teamMembers
          .map(
            mapDoctor
          )
          .filter(
            (
              doctor
            ): doctor is DoctorOption =>
              doctor !== null
          ),
      [
        teamMembers,
      ]
    );

  const selectedDoctor =
    useMemo(
      () =>
        doctors.find(
          (
            doctor
          ) =>
            doctor.professionalId ===
              form.doctorId ||
            doctor.id ===
              form.doctorId
        ) ||
        null,
      [
        doctors,
        form.doctorId,
      ]
    );

  const verification =
    useMemo(
      () => {
        const clinic =
          safeObject(
            clinicData?.clinic
          );

        const status =
          safeString(
            clinic.verificationStatus
          ).toLowerCase() ||
          "pending";

        return {
          status,

          verified:
            clinic.verified === true ||
            status === "verified" ||
            status === "approved",
        };
      },
      [
        clinicData,
      ]
    );

  /* ============================================================
     FORM
  ============================================================ */

  function updateForm<
    K extends keyof ProgramForm
  >(
    key: K,
    value: ProgramForm[K]
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );

    setError(
      null
    );

    setSuccess(
      null
    );
  }

  /* ============================================================
     CREATE PROGRAM
  ============================================================ */

  async function createDoctorProgram() {
    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      saving
    ) {
      return;
    }

    const firestoreInstance =
      firestore;

    const clinicUid =
      uid;

    if (
      !selectedDoctor
    ) {
      setError(
        "Select a doctor before creating the programme."
      );

      return;
    }

    if (
      !form.date
    ) {
      setError(
        "Select a date for the doctor's programme."
      );

      return;
    }

    if (
      !form.startTime ||
      !form.endTime
    ) {
      setError(
        "Enter the start time and end time."
      );

      return;
    }

    if (
      form.endTime <=
      form.startTime
    ) {
      setError(
        "The end time must be later than the start time."
      );

      return;
    }

    const day =
      getDayLabel(
        form.date
      );

    setSaving(
      true
    );

    setError(
      null
    );

    setSuccess(
      null
    );

    try {
      await addDoc(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "schedule"
        ),
        {
          clinicId:
            clinicUid,

          clinicName,

          doctorId:
            selectedDoctor.professionalId,

          teamMemberId:
            selectedDoctor.id,

          doctorName:
            selectedDoctor.name,

          specialty:
            selectedDoctor.specialty,

          date:
            form.date,

          day,

          startTime:
            form.startTime,

          endTime:
            form.endTime,

          consultationMode:
            form.consultationMode,

          location:
            form.consultationMode ===
            "in_person"
              ? form.location.trim() ||
                clinicName
              : null,

          note:
            form.note.trim() ||
            null,

          status:
            "scheduled",

          active:
            true,

          timezone:
            "Africa/Accra",

          country:
            "GH",

          application:
            "doc_chap_ghana",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setForm({
        doctorId:
          form.doctorId,
        date: "",
        startTime: "",
        endTime: "",
        consultationMode:
          "in_person",
        location: "",
        note: "",
      });

      setSuccess(
        `Programme created successfully for ${selectedDoctor.name}.`
      );
    } catch (
      saveError
    ) {
      console.error(
        "[ClinicSchedule] Create programme error:",
        saveError
      );

      setError(
        "Unable to create the doctor's programme."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

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
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading clinic schedule...
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
                      <CalendarDays className="h-4 w-4 text-cyan-300" />

                      Clinic schedule
                    </span>

                    {verification.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified clinic
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <Building2 className="h-4 w-4" />

                        Verification{" "}
                        {verification.status}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Schedule
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Manage clinic availability and create individual work programmes for doctors linked to your clinic.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Building2 className="h-4 w-4 text-cyan-200" />

                      {clinicName}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Stethoscope className="h-4 w-4 text-emerald-200" />

                      {doctors.length} doctor
                      {doctors.length ===
                      1
                        ? ""
                        : "s"}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Clock3 className="h-4 w-4 text-violet-200" />

                      {programs.length} programme
                      {programs.length ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>

                <a
                  href="#create-doctor-programme"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />

                  Create programme
                </a>
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

            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />

                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
              {/* =================================================
                  LEFT
              ================================================= */}

              <div className="space-y-6">
                {/* DOCTOR PROGRAMMES */}

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Doctors programmes
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Programmes created by the clinic for its doctors.
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                  </div>

                  {programs.length ===
                  0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <CalendarDays className="mx-auto h-8 w-8 text-zinc-400" />

                      <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        No doctor programme created yet.
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Use the panel on the right to create the first programme.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {programs.map(
                        (
                          program
                        ) => {
                          const createdLabel =
                            formatCreatedAt(
                              program.createdAt
                            );

                          return (
                            <article
                              key={
                                program.id
                              }
                              className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                                      <Stethoscope className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                      <h3 className="truncate text-sm font-black text-zinc-950 dark:text-white">
                                        {program.doctorName ||
                                          "Doctor"}
                                      </h3>

                                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                                        {program.specialty ||
                                          "Medical doctor"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                      <CalendarDays className="h-3.5 w-3.5 text-blue-600" />

                                      {program.day ||
                                        "Day"}{" "}
                                      •{" "}
                                      {program.date ||
                                        "Date"}
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                      <Clock3 className="h-3.5 w-3.5 text-violet-600" />

                                      {program.startTime ||
                                        "—"}{" "}
                                      -{" "}
                                      {program.endTime ||
                                        "—"}
                                    </span>
                                  </div>

                                  {program.note && (
                                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                                      {program.note}
                                    </p>
                                  )}

                                  {createdLabel && (
                                    <p className="mt-3 text-[11px] text-zinc-400">
                                      Created{" "}
                                      {createdLabel}
                                    </p>
                                  )}
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                    {safeString(
                                      program.status
                                    ) ||
                                      "scheduled"}
                                  </span>

                                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                                    {safeString(
                                      program.consultationMode
                                    )
                                      .replace(
                                        /_/g,
                                        " "
                                      ) ||
                                      "in person"}
                                  </span>
                                </div>
                              </div>
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
                </section>

                {/* CLINIC AVAILABILITY */}

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Clinic weekly availability
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        General availability currently stored for your clinic.
                      </p>
                    </div>

                    <CalendarDays className="h-6 w-6 text-cyan-600" />
                  </div>

                  {availability.length ===
                  0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <Clock3 className="mx-auto h-8 w-8 text-zinc-400" />

                      <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        No clinic availability configured yet.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {availability.map(
                        (
                          item
                        ) => (
                          <article
                            key={
                              item.id
                            }
                            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-black capitalize text-zinc-950 dark:text-white">
                                  {item.day ||
                                    item.id}
                                </div>

                                <div className="mt-2 text-sm text-zinc-500">
                                  {item.startTime ||
                                    "—"}{" "}
                                  -{" "}
                                  {item.endTime ||
                                    "—"}
                                </div>
                              </div>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                  item.enabled ===
                                  false
                                    ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                }`}
                              >
                                {item.enabled ===
                                false
                                  ? "Unavailable"
                                  : "Available"}
                              </span>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* =================================================
                  RIGHT
              ================================================= */}

              <aside className="space-y-6">
                {/* CREATE PROGRAM */}

                <section
                  id="create-doctor-programme"
                  className="scroll-mt-6 rounded-[28px] border border-blue-200 bg-white p-5 shadow-sm dark:border-blue-900/40 dark:bg-zinc-950"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                      <Plus className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Create doctor programme
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Select a clinic doctor and define the working period.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Doctor
                      </span>

                      <select
                        value={
                          form.doctorId
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "doctorId",
                            event.target
                              .value
                          )
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="">
                          Select a doctor
                        </option>

                        {doctors.map(
                          (
                            doctor
                          ) => (
                            <option
                              key={
                                doctor.id
                              }
                              value={
                                doctor.professionalId
                              }
                            >
                              {doctor.name} —{" "}
                              {doctor.specialty}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Date
                      </span>

                      <input
                        type="date"
                        value={
                          form.date
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "date",
                            event.target
                              .value
                          )
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                          Start
                        </span>

                        <input
                          type="time"
                          value={
                            form.startTime
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "startTime",
                              event.target
                                .value
                            )
                          }
                          className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                          End
                        </span>

                        <input
                          type="time"
                          value={
                            form.endTime
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "endTime",
                              event.target
                                .value
                            )
                          }
                          className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Consultation mode
                      </span>

                      <select
                        value={
                          form.consultationMode
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "consultationMode",
                            event.target
                              .value as ProgramForm["consultationMode"]
                          )
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="in_person">
                          In-person consultation
                        </option>

                        <option value="video">
                          Video consultation
                        </option>

                        <option value="phone">
                          Phone consultation
                        </option>
                      </select>
                    </label>

                    {form.consultationMode ===
                      "in_person" && (
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                          Location
                        </span>

                        <div className="relative mt-2">
                          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                          <input
                            value={
                              form.location
                            }
                            onChange={(
                              event
                            ) =>
                              updateForm(
                                "location",
                                event.target
                                  .value
                              )
                            }
                            placeholder={
                              clinicName
                            }
                            className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                          />
                        </div>
                      </label>
                    )}

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Note
                      </span>

                      <textarea
                        value={
                          form.note
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "note",
                            event.target
                              .value
                          )
                        }
                        rows={4}
                        maxLength={
                          500
                        }
                        placeholder="Optional instructions for this doctor's programme..."
                        className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        void createDoctorProgram()
                      }
                      disabled={
                        saving ||
                        doctors.length ===
                          0
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />

                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />

                          Create programme
                        </>
                      )}
                    </button>
                  </div>
                </section>

                {/* DOCTORS SUMMARY */}

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <Users className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-base font-black text-zinc-950 dark:text-white">
                    Clinic doctors
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Only doctors currently linked to this clinic can be selected for a programme.
                  </p>

                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/70 p-4 dark:border-emerald-900/40 dark:bg-zinc-950/60">
                    <div className="text-3xl font-black text-zinc-950 dark:text-white">
                      {doctors.length}
                    </div>

                    <div className="mt-1 text-xs font-semibold text-zinc-500">
                      Available doctor
                      {doctors.length ===
                      1
                        ? ""
                        : "s"}
                    </div>
                  </div>

                  {doctors.length >
                    0 && (
                    <div className="mt-4 space-y-2">
                      {doctors
                        .slice(
                          0,
                          4
                        )
                        .map(
                          (
                            doctor
                          ) => (
                            <div
                              key={
                                doctor.id
                              }
                              className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 dark:bg-zinc-950/60"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                <UserRound className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <div className="truncate text-xs font-black text-zinc-950 dark:text-white">
                                  {doctor.name}
                                </div>

                                <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                                  {doctor.specialty}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </section>

                {/* INFO */}

                <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <Clock3 className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Programme timezone
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Doctor programmes are saved using Ghana time (Africa/Accra).
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