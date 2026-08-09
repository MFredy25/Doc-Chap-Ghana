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
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
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

type InsuranceItem = {
  id: string;

  clinicId?: string;

  name?: string;
  insurerName?: string;
  companyName?: string;

  contactName?: string;
  email?: string;
  phone?: string;

  reference?: string;
  contractReference?: string;

  status?: string;
  active?: boolean;

  notes?: string;

  createdAt?: unknown;
  updatedAt?: unknown;
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

function insuranceName(
  item: InsuranceItem
): string {
  return (
    safeString(
      item.insurerName
    ) ||
    safeString(
      item.companyName
    ) ||
    safeString(
      item.name
    ) ||
    "Insurance company"
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function InsuranceClient() {
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
    useState<InsuranceItem[]>(
      []
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    insurerName,
    setInsurerName,
  ] =
    useState("");

  const [
    contactName,
    setContactName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    contractReference,
    setContractReference,
  ] =
    useState("");

  const [
    notes,
    setNotes,
  ] =
    useState("");

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
                  "[ClinicInsurance] Profile error:",
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
     INSURANCE REALTIME
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
        "insurance"
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
                  InsuranceItem,
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
          "[ClinicInsurance] Realtime error:",
          snapshotError
        );

        setError(
          "Unable to load clinic insurance partners."
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

        if (!term) {
          return items;
        }

        return items.filter(
          (
            item
          ) => {
            const haystack =
              [
                insuranceName(
                  item
                ),
                item.contactName,
                item.email,
                item.phone,
                item.reference,
                item.contractReference,
                item.status,
              ]
                .map(
                  safeString
                )
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
        search,
      ]
    );

  const stats =
    useMemo(
      () => ({
        total:
          items.length,

        active:
          items.filter(
            (
              item
            ) =>
              item.active !==
                false &&
              safeString(
                item.status
              ).toLowerCase() !==
                "inactive"
          ).length,

        withEmail:
          items.filter(
            (
              item
            ) =>
              Boolean(
                safeString(
                  item.email
                )
              )
          ).length,

        withPhone:
          items.filter(
            (
              item
            ) =>
              Boolean(
                safeString(
                  item.phone
                )
              )
          ).length,
      }),
      [
        items,
      ]
    );

  const latestInsurance =
    items[0] ||
    null;

  /* ============================================================
     CREATE INSURANCE PARTNER
  ============================================================ */

  async function addInsurancePartner() {
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

    const cleanName =
      insurerName.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (
      cleanName.length <
      2
    ) {
      setError(
        "Enter the insurance company name."
      );
      return;
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      setError(
        "Enter a valid email address."
      );
      return;
    }

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
          "insurance"
        ),
        {
          clinicId:
            clinicUid,

          clinicName:
            clinic.name,

          name:
            cleanName,

          insurerName:
            cleanName,

          companyName:
            cleanName,

          contactName:
            contactName.trim() ||
            null,

          email:
            cleanEmail ||
            null,

          phone:
            phone.trim() ||
            null,

          reference:
            contractReference.trim() ||
            null,

          contractReference:
            contractReference.trim() ||
            null,

          notes:
            notes.trim() ||
            null,

          status:
            "active",

          active:
            true,

          country:
            "GH",

          locale:
            "en-GH",

          timezone:
            "Africa/Accra",

          application:
            "doc_chap_ghana",

          source:
            "clinic_dashboard",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setInsurerName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setContractReference("");
      setNotes("");

      setSuccess(
        `${cleanName} has been added to your insurance partners.`
      );
    } catch (
      createError
    ) {
      console.error(
        "[ClinicInsurance] Create insurance error:",
        createError
      );

      setError(
        "Unable to add the insurance company."
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
                Loading clinic insurance...
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
                      <ShieldCheck className="h-4 w-4 text-cyan-200" />

                      Insurance partners
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
                    Insurance
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Register the insurance companies your clinic works with and keep their contact information in one place.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <Building2 className="h-4 w-4 text-cyan-200" />

                      {clinic.name}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                      <ShieldCheck className="h-4 w-4 text-violet-200" />

                      {stats.total} insurer
                      {stats.total ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
              {/* LEFT */}

              <div className="space-y-6">
                {/* ADD INSURANCE */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Add insurance company
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Add an insurer your clinic currently works with.
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <Plus className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Insurance company name *
                      </span>

                      <input
                        value={
                          insurerName
                        }
                        onChange={(
                          event
                        ) =>
                          setInsurerName(
                            event.target
                              .value
                          )
                        }
                        placeholder="Insurance company"
                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Contact person
                      </span>

                      <div className="relative mt-2">
                        <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                        <input
                          value={
                            contactName
                          }
                          onChange={(
                            event
                          ) =>
                            setContactName(
                              event.target
                                .value
                            )
                          }
                          placeholder="Contact person"
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Contract / reference
                      </span>

                      <div className="relative mt-2">
                        <FileText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                        <input
                          value={
                            contractReference
                          }
                          onChange={(
                            event
                          ) =>
                            setContractReference(
                              event.target
                                .value
                            )
                          }
                          placeholder="Optional reference"
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Email
                      </span>

                      <div className="relative mt-2">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                        <input
                          type="email"
                          value={
                            email
                          }
                          onChange={(
                            event
                          ) =>
                            setEmail(
                              event.target
                                .value
                            )
                          }
                          placeholder="insurance@example.com"
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Phone
                      </span>

                      <div className="relative mt-2">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                        <input
                          value={
                            phone
                          }
                          onChange={(
                            event
                          ) =>
                            setPhone(
                              event.target
                                .value
                            )
                          }
                          placeholder="+233..."
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Internal note
                      </span>

                      <textarea
                        value={
                          notes
                        }
                        onChange={(
                          event
                        ) =>
                          setNotes(
                            event.target
                              .value
                          )
                        }
                        rows={4}
                        maxLength={
                          1000
                        }
                        placeholder="Optional note about this insurance relationship..."
                        className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void addInsurancePartner()
                    }
                    disabled={
                      saving
                    }
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />

                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />

                        Add insurance company
                      </>
                    )}
                  </button>
                </section>

                {/* INSURANCE LIST */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                        Insurance partners
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        {filteredItems.length} insurance compan
                        {filteredItems.length ===
                        1
                          ? "y"
                          : "ies"}{" "}
                        displayed.
                      </p>
                    </div>

                    <ShieldCheck className="h-6 w-6 text-blue-600" />
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
                      placeholder="Search insurance company..."
                      className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>

                  {filteredItems.length ===
                  0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <ShieldCheck className="mx-auto h-8 w-8 text-zinc-400" />

                      <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        No insurance company added yet.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {filteredItems.map(
                        (
                          item
                        ) => {
                          const active =
                            item.active !==
                              false &&
                            safeString(
                              item.status
                            ).toLowerCase() !==
                              "inactive";

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
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                                  <ShieldCheck className="h-5 w-5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-sm font-black text-zinc-950 dark:text-white">
                                      {insuranceName(
                                        item
                                      )}
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

                                  {item.contactName && (
                                    <p className="mt-1 text-xs text-zinc-500">
                                      Contact:{" "}
                                      {item.contactName}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                {item.email && (
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Mail className="h-4 w-4" />

                                    {item.email}
                                  </div>
                                )}

                                {item.phone && (
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Phone className="h-4 w-4" />

                                    {item.phone}
                                  </div>
                                )}

                                {(item.contractReference ||
                                  item.reference) && (
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <FileText className="h-4 w-4" />

                                    {item.contractReference ||
                                      item.reference}
                                  </div>
                                )}
                              </div>

                              {item.notes && (
                                <p className="mt-3 text-xs leading-5 text-zinc-500">
                                  {item.notes}
                                </p>
                              )}

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
              </div>

              {/* RIGHT */}

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">
                    {stats.total}
                  </div>

                  <div className="mt-1 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    Total insurers
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Insurance companies linked to this clinic.
                  </p>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                    Insurance overview
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
                      <FileText className="h-5 w-5 text-violet-600" />

                      <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                        {items.filter(
                          (
                            item
                          ) =>
                            Boolean(
                              safeString(
                                item.contractReference ||
                                  item.reference
                              )
                            )
                        ).length}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        With reference
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Latest insurer
                  </h3>

                  {latestInsurance ? (
                    <div className="mt-4 rounded-2xl bg-white/80 p-4 dark:bg-zinc-950/60">
                      <div className="text-sm font-black text-zinc-950 dark:text-white">
                        {insuranceName(
                          latestInsurance
                        )}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {latestInsurance.contactName ||
                          latestInsurance.email ||
                          latestInsurance.phone ||
                          "No contact information"}
                      </div>

                      {formatDate(
                        latestInsurance.createdAt
                      ) && (
                        <div className="mt-3 text-[11px] text-zinc-400">
                          Added{" "}
                          {formatDate(
                            latestInsurance.createdAt
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">
                      No insurance company has been added yet.
                    </p>
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