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
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";
import ClinicAjoutTeamMemberModal from "@/app/components/ClinicAjoutTeamMemberModal";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type ClinicData = {
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

type TeamMember = {
  id: string;

  uid?: string;
  professionalId?: string;

  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;

  email?: string;
  phone?: string;

  role?: string;
  professionalType?: string;
  specialty?: string;

  status?: string;
  active?: boolean;

  createdAt?: unknown;
  updatedAt?: unknown;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    specialty?: string;
  };

  professional?: {
    type?: string;
    specialty?: string;
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

function memberName(
  item: TeamMember
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
    "Team member"
  );
}

function memberRole(
  item: TeamMember
): string {
  const professional =
    safeObject(
      item.professional
    );

  return (
    safeString(
      item.role ||
        item.professionalType ||
        professional.type
    ) ||
    "Staff"
  );
}

function memberSpecialty(
  item: TeamMember
): string {
  const profile =
    safeObject(
      item.profile
    );

  const professional =
    safeObject(
      item.professional
    );

  return (
    safeString(
      item.specialty ||
        profile.specialty ||
        professional.specialty
    ) ||
    ""
  );
}

function memberEmail(
  item: TeamMember
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

function memberPhone(
  item: TeamMember
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

function isDoctor(
  item: TeamMember
): boolean {
  const professional =
    safeObject(
      item.professional
    );

  const type =
    safeString(
      item.professionalType ||
        professional.type ||
        item.role
    ).toLowerCase();

  return [
    "doctor",
    "physician",
    "medical_doctor",
    "medical doctor",
  ].includes(type);
}

function roleLabel(
  value: string
): string {
  const normalized =
    value
      .replace(
        /_/g,
        " "
      )
      .trim();

  if (!normalized) {
    return "Staff";
  }

  return normalized.replace(
    /\b\w/g,
    (
      character
    ) =>
      character.toUpperCase()
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function TeamClient() {
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
    useState<ClinicData | null>(
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
    items,
    setItems,
  ] =
    useState<TeamMember[]>(
      []
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] =
    useState<
      | "all"
      | "doctor"
      | "other"
    >("all");

  const [
    addMemberOpen,
    setAddMemberOpen,
  ] =
    useState(false);

  /* ============================================================
     AUTH + CLINIC
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
                  snapshot.data() as ClinicData;

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
                  "[ClinicTeam] Profile error:",
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
     TEAM REALTIME
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
        const rows =
          snapshot.docs.map(
            (
              item
            ) => ({
              id:
                item.id,

              ...(
                item.data() as Omit<
                  TeamMember,
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

        setItems(
          rows
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicTeam] Realtime error:",
          snapshotError
        );

        setError(
          "Unable to load the healthcare team."
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

  const filteredItems =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        return items.filter(
          (
            item
          ) => {
            const doctor =
              isDoctor(
                item
              );

            if (
              roleFilter ===
                "doctor" &&
              !doctor
            ) {
              return false;
            }

            if (
              roleFilter ===
                "other" &&
              doctor
            ) {
              return false;
            }

            if (!term) {
              return true;
            }

            const haystack =
              [
                memberName(
                  item
                ),
                memberRole(
                  item
                ),
                memberSpecialty(
                  item
                ),
                memberEmail(
                  item
                ),
                memberPhone(
                  item
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
        items,
        roleFilter,
        search,
      ]
    );

  const stats =
    useMemo(
      () => {
        const doctors =
          items.filter(
            isDoctor
          ).length;

        const active =
          items.filter(
            (
              item
            ) =>
              item.active !==
                false &&
              safeString(
                item.status
              ).toLowerCase() !==
                "disabled"
          ).length;

        const roles =
          new Set(
            items
              .map(
                (
                  item
                ) =>
                  memberRole(
                    item
                  )
                    .toLowerCase()
                    .trim()
              )
              .filter(
                Boolean
              )
          );

        return {
          total:
            items.length,
          doctors,
          active,
          roles:
            roles.size,
        };
      },
      [
        items,
      ]
    );

  const roleDistribution =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >();

        items.forEach(
          (
            item
          ) => {
            const role =
              memberRole(
                item
              )
                .toLowerCase()
                .trim() ||
              "staff";

            counts.set(
              role,
              (
                counts.get(
                  role
                ) ||
                0
              ) +
                1
            );
          }
        );

        return Array.from(
          counts.entries()
        )
          .sort(
            (
              a,
              b
            ) =>
              b[1] -
              a[1]
          )
          .slice(
            0,
            5
          );
      },
      [
        items,
      ]
    );

  const latestMember =
    items[0] ||
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
              <Users className="mx-auto h-8 w-8 text-blue-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading healthcare team...
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
                      <Users className="h-4 w-4 text-cyan-200" />

                      Healthcare team
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
                    Healthcare team
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Manage doctors and healthcare staff linked to your clinic.
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

                      {stats.total} member
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

                    setAddMemberOpen(
                      true
                    );
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />

                  Add team member
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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Team members
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      {filteredItems.length} member
                      {filteredItems.length ===
                      1
                        ? ""
                        : "s"}{" "}
                      displayed.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        [
                          "all",
                          "All",
                        ],
                        [
                          "doctor",
                          "Doctors",
                        ],
                        [
                          "other",
                          "Other staff",
                        ],
                      ] as const
                    ).map(
                      (
                        [
                          value,
                          label,
                        ]
                      ) => (
                        <button
                          key={
                            value
                          }
                          type="button"
                          onClick={() =>
                            setRoleFilter(
                              value
                            )
                          }
                          className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                            roleFilter ===
                            value
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
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
                    placeholder="Search by name, role, specialty or contact..."
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                {filteredItems.length ===
                0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                    <Users className="mx-auto h-8 w-8 text-zinc-400" />

                    <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      No team member found.
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Click Add team member to add the first person to your clinic team.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filteredItems.map(
                      (
                        item
                      ) => {
                        const name =
                          memberName(
                            item
                          );

                        const role =
                          memberRole(
                            item
                          );

                        const specialty =
                          memberSpecialty(
                            item
                          );

                        const email =
                          memberEmail(
                            item
                          );

                        const phone =
                          memberPhone(
                            item
                          );

                        const doctor =
                          isDoctor(
                            item
                          );

                        const active =
                          item.active !==
                            false &&
                          safeString(
                            item.status
                          ).toLowerCase() !==
                            "disabled";

                        const createdLabel =
                          formatDate(
                            item.createdAt
                          );

                        return (
                          <article
                            key={
                              item.id
                            }
                            className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                  doctor
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                                    : "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                                }`}
                              >
                                {doctor ? (
                                  <Stethoscope className="h-5 w-5" />
                                ) : (
                                  <UserRound className="h-5 w-5" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-sm font-black text-zinc-950 dark:text-white">
                                    {doctor &&
                                    !/^dr\.?\s/i.test(
                                      name
                                    )
                                      ? `Dr. ${name}`
                                      : name}
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

                                <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                                  {roleLabel(
                                    role
                                  )}
                                </p>

                                {specialty && (
                                  <p className="mt-1 text-xs text-zinc-500">
                                    {specialty}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              {email && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <Mail className="h-4 w-4" />

                                  <span className="truncate">
                                    {email}
                                  </span>
                                </div>
                              )}

                              {phone && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <Phone className="h-4 w-4" />

                                  {phone}
                                </div>
                              )}
                            </div>

                            {createdLabel && (
                              <div className="mt-4 border-t border-zinc-200 pt-3 text-[11px] text-zinc-400 dark:border-zinc-800">
                                Added{" "}
                                {createdLabel}
                              </div>
                            )}
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>

              {/* RIGHT */}

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <Users className="h-5 w-5" />
                  </div>

                  <div className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">
                    {stats.total}
                  </div>

                  <div className="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    Total team members
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Professionals and staff linked to this clinic.
                  </p>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Team overview
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                      <Stethoscope className="h-5 w-5 text-blue-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.doctors}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Doctors
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                      <BadgeCheck className="h-5 w-5 text-emerald-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.active}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Active
                      </div>
                    </div>

                    <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/30">
                      <ShieldCheck className="h-5 w-5 text-violet-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {stats.roles}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Roles
                      </div>
                    </div>

                    <div className="rounded-2xl bg-cyan-50 p-4 dark:bg-cyan-950/30">
                      <UserRound className="h-5 w-5 text-cyan-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {Math.max(
                          stats.total -
                            stats.doctors,
                          0
                        )}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        Other staff
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <Users className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Team composition
                  </h3>

                  {roleDistribution.length ===
                  0 ? (
                    <p className="mt-3 text-xs text-zinc-500">
                      No team roles yet.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {roleDistribution.map(
                        (
                          [
                            role,
                            count,
                          ]
                        ) => (
                          <div
                            key={
                              role
                            }
                            className="flex items-center justify-between rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/60"
                          >
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              {roleLabel(
                                role
                              )}
                            </span>

                            <span className="text-sm font-black text-zinc-950 dark:text-white">
                              {count}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <UserRound className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Latest member
                  </h3>

                  {latestMember ? (
                    <div className="mt-4 rounded-2xl bg-white/80 p-4 dark:bg-zinc-950/60">
                      <div className="text-sm font-black text-zinc-950 dark:text-white">
                        {memberName(
                          latestMember
                        )}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {roleLabel(
                          memberRole(
                            latestMember
                          )
                        )}
                      </div>

                      {formatDate(
                        latestMember.createdAt
                      ) && (
                        <div className="mt-3 text-[11px] text-zinc-400">
                          Added{" "}
                          {formatDate(
                            latestMember.createdAt
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">
                      No team member has been added yet.
                    </p>
                  )}
                </section>
              </aside>
            </div>
          </section>
        </main>

        {uid && (
          <ClinicAjoutTeamMemberModal
            open={
              addMemberOpen
            }
            clinicId={
              uid
            }
            clinicName={
              clinic.name
            }
            onClose={() =>
              setAddMemberOpen(
                false
              )
            }
            onCreated={(
              memberName
            ) => {
              setAddMemberOpen(
                false
              );

              setSuccess(
                `${memberName} has been added to the clinic team.`
              );
            }}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}