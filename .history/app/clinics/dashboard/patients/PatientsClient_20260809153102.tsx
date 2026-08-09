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
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";
import ClinicAddNewPatientModal from "@/app/components/ClinicAddNewPatientModal";

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

type PatientItem = {
  id: string;

  uid?: string;
  patientId?: string;

  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;

  email?: string;
  phone?: string;

  gender?: string;
  dateOfBirth?: string;

  status?: string;
  active?: boolean;

  city?: string;
  address?: string;

  createdAt?: unknown;
  updatedAt?: unknown;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    city?: string;
    address?: string;
  };
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

function formatDate(
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
        dateStyle:
          "medium",
        timeZone:
          "Africa/Accra",
      }
    ).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function patientName(
  item: PatientItem
): string {
  const profile =
    safeObject(
      item.profile
    );

  const firstName =
    safeString(
      item.firstName ||
        profile.firstName
    );

  const lastName =
    safeString(
      item.lastName ||
        profile.lastName
    );

  return (
    safeString(
      item.fullName ||
        item.displayName ||
        profile.fullName ||
        profile.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Patient"
  );
}

function patientEmail(
  item: PatientItem
): string {
  const profile =
    safeObject(
      item.profile
    );

  return safeString(
    item.email ||
      profile.email
  );
}

function patientPhone(
  item: PatientItem
): string {
  const profile =
    safeObject(
      item.profile
    );

  return safeString(
    item.phone ||
      profile.phone
  );
}

function patientGender(
  item: PatientItem
): string {
  const profile =
    safeObject(
      item.profile
    );

  return (
    safeString(
      item.gender ||
        profile.gender
    ) ||
    "Not specified"
  );
}

function patientDateOfBirth(
  item: PatientItem
): string {
  const profile =
    safeObject(
      item.profile
    );

  return safeString(
    item.dateOfBirth ||
      profile.dateOfBirth
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
    useState<
      string | null
    >(null);

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
    patients,
    setPatients,
  ] =
    useState<PatientItem[]>(
      []
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  const [
    addPatientOpen,
    setAddPatientOpen,
  ] =
    useState(false);

  const pageSize =
    10;

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
                  data.active ===
                    false ||
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
                  "[ClinicPatients] Profile error:",
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
     PATIENTS REALTIME
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
        "patients"
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
                  PatientItem,
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
                a.createdAt
              )?.getTime() ||
              0;

            const bDate =
              toDate(
                b.createdAt
              )?.getTime() ||
              0;

            return (
              bDate -
              aDate
            );
          }
        );

        setPatients(
          rows
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicPatients] Patients realtime error:",
          snapshotError
        );

        setError(
          "Unable to load clinic patients."
        );
      }
    );
  }, [
    uid,
  ]);

  /* ============================================================
     COMPUTED
  ============================================================ */

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
          ).toLowerCase() ||
          "pending";

        return {
          name:
            safeString(
              profile.clinicName
            ) ||
            safeString(
              profile.displayName
            ) ||
            safeString(
              profile.fullName
            ) ||
            "Clinic",

          city:
            safeString(
              profile.city
            ) ||
            safeString(
              profile.region
            ) ||
            "Ghana",

          verified:
            clinicInfo.verified ===
              true ||
            verificationStatus ===
              "verified" ||
            verificationStatus ===
              "approved",

          verificationStatus,
        };
      },
      [
        clinicData,
      ]
    );

  const filteredPatients =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return patients;
        }

        return patients.filter(
          (
            patient
          ) => {
            const haystack =
              [
                patientName(
                  patient
                ),
                patientEmail(
                  patient
                ),
                patientPhone(
                  patient
                ),
                patientGender(
                  patient
                ),
                patientDateOfBirth(
                  patient
                ),
              ]
                .join(
                  " "
                )
                .toLowerCase();

            return haystack.includes(
              term
            );
          }
        );
      },
      [
        patients,
        search,
      ]
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredPatients.length /
          pageSize
      )
    );

  useEffect(() => {
    setCurrentPage(
      1
    );
  }, [
    search,
  ]);

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

  const paginatedPatients =
    useMemo(
      () => {
        const start =
          (
            currentPage -
            1
          ) *
          pageSize;

        return filteredPatients.slice(
          start,
          start +
            pageSize
        );
      },
      [
        filteredPatients,
        currentPage,
      ]
    );

  const stats =
    useMemo(
      () => ({
        total:
          patients.length,

        active:
          patients.filter(
            (
              patient
            ) =>
              patient.active !==
                false &&
              safeString(
                patient.status
              ).toLowerCase() !==
                "disabled"
          ).length,

        withEmail:
          patients.filter(
            (
              patient
            ) =>
              Boolean(
                patientEmail(
                  patient
                )
              )
          ).length,

        withPhone:
          patients.filter(
            (
              patient
            ) =>
              Boolean(
                patientPhone(
                  patient
                )
              )
          ).length,
      }),
      [
        patients,
      ]
    );

  const latestPatient =
    patients[0] ||
    null;

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
              <Users className="mx-auto h-8 w-8 text-violet-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading clinic patients...
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
          {/* HERO */}

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
                      <Users className="h-4 w-4 text-violet-200" />

                      Clinic patients
                    </span>

                    {clinic.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified clinic
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <Building2 className="h-4 w-4" />

                        Verification{" "}
                        {clinic.verificationStatus}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Patients
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Manage patients linked to your clinic and make them available for appointment booking.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Building2 className="h-4 w-4 text-cyan-200" />

                      {clinic.name}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <MapPin className="h-4 w-4 text-emerald-200" />

                      {clinic.city}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Users className="h-4 w-4 text-violet-200" />

                      {stats.total} patient
                      {stats.total ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError(
                      null
                    );

                    setSuccess(
                      null
                    );

                    setAddPatientOpen(
                      true
                    );
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />

                  Add new patient
                </button>
              </div>
            </div>
          </section>

          {/* CONTENT */}

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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* LEFT */}

              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Clinic patients
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Showing up to 10 patients per page.
                    </p>
                  </div>

                  <Users className="h-6 w-6 text-violet-600" />
                </div>

                <div className="relative mt-5">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search patient by name, email, phone..."
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                {paginatedPatients.length ===
                0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                    <Users className="mx-auto h-8 w-8 text-zinc-400" />

                    <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      No patients found.
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Add a patient so the clinic can select them when creating an appointment.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {paginatedPatients.map(
                      (
                        patient
                      ) => {
                        const name =
                          patientName(
                            patient
                          );

                        const email =
                          patientEmail(
                            patient
                          );

                        const phone =
                          patientPhone(
                            patient
                          );

                        const gender =
                          patientGender(
                            patient
                          );

                        const dateOfBirth =
                          patientDateOfBirth(
                            patient
                          );

                        const active =
                          patient.active !==
                            false &&
                          safeString(
                            patient.status
                          ).toLowerCase() !==
                            "disabled";

                        const createdLabel =
                          formatDate(
                            patient.createdAt
                          );

                        return (
                          <article
                            key={
                              patient.id
                            }
                            className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:border-violet-200 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                                  <UserRound className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-sm font-black text-zinc-950 dark:text-white">
                                      {name}
                                    </h3>

                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                        active
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                      }`}
                                    >
                                      {active
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                                    {email && (
                                      <span className="inline-flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />

                                        {email}
                                      </span>
                                    )}

                                    {phone && (
                                      <span className="inline-flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5" />

                                        {phone}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-zinc-600 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                      {gender}
                                    </span>

                                    {dateOfBirth && (
                                      <span className="rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-zinc-600 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                                        DOB:{" "}
                                        {dateOfBirth}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {createdLabel && (
                                <span className="shrink-0 text-[11px] text-zinc-400">
                                  Added{" "}
                                  {createdLabel}
                                </span>
                              )}
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}

                {/* PAGINATION */}

                <div className="mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                  <div className="text-xs font-semibold text-zinc-500">
                    Page{" "}
                    {currentPage} of{" "}
                    {totalPages} •{" "}
                    {filteredPatients.length} patient
                    {filteredPatients.length ===
                    1
                      ? ""
                      : "s"}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (
                            current
                          ) =>
                            Math.max(
                              1,
                              current -
                                1
                            )
                        )
                      }
                      disabled={
                        currentPage <=
                        1
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      <ChevronLeft className="h-4 w-4" />

                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (
                            current
                          ) =>
                            Math.min(
                              totalPages,
                              current +
                                1
                            )
                        )
                      }
                      disabled={
                        currentPage >=
                        totalPages
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next

                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* RIGHT */}

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
                    <Users className="h-5 w-5" />
                  </div>

                  <div className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">
                    {stats.total}
                  </div>

                  <div className="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    Total patients
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Patients currently linked to this clinic.
                  </p>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Patient overview
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                      <BadgeCheck className="h-5 w-5 text-emerald-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.active}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Active
                      </div>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                      <Mail className="h-5 w-5 text-blue-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.withEmail}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        With email
                      </div>
                    </div>

                    <div className="rounded-2xl bg-cyan-50 p-4 dark:bg-cyan-950/30">
                      <Phone className="h-5 w-5 text-cyan-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.withPhone}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        With phone
                      </div>
                    </div>

                    <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/30">
                      <UserRound className="h-5 w-5 text-violet-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {Math.max(
                          stats.total -
                            stats.active,
                          0
                        )}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Inactive
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <UserRound className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Latest patient
                  </h3>

                  {latestPatient ? (
                    <div className="mt-4 rounded-2xl bg-white/80 p-4 dark:bg-zinc-950/60">
                      <div className="text-sm font-black text-zinc-950 dark:text-white">
                        {patientName(
                          latestPatient
                        )}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {patientEmail(
                          latestPatient
                        ) ||
                          patientPhone(
                            latestPatient
                          ) ||
                          "No contact information"}
                      </div>

                      {formatDate(
                        latestPatient.createdAt
                      ) && (
                        <div className="mt-3 text-[11px] text-zinc-400">
                          Added{" "}
                          {formatDate(
                            latestPatient.createdAt
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">
                      No patient has been added yet.
                    </p>
                  )}
                </section>

                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Appointment booking
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Patients added here become available in the clinic appointment creation modal.
                  </p>
                </section>
              </aside>
            </div>
          </section>
        </main>

        {uid && (
          <ClinicAddNewPatientModal
            open={
              addPatientOpen
            }
            clinicId={
              uid
            }
            clinicName={
              clinic.name
            }
            onClose={() =>
              setAddPatientOpen(
                false
              )
            }
            onCreated={(
              patientName
            ) => {
              setAddPatientOpen(
                false
              );

              setCurrentPage(
                1
              );

              setSuccess(
                `${patientName} has been added to the clinic patients.`
              );
            }}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}