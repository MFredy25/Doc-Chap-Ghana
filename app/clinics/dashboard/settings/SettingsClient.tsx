"use client";

import React, {
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
} from "firebase/auth";

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Globe2,
  LayoutDashboard,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MonitorCog,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  Users,
  WalletCards,
  X,
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
    email?: string;
    phone?: string;
    city?: string;
    region?: string;
    address?: string;

    owner?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      email?: string;
      phone?: string;
    };
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
    registrationNumber?: string | null;
    licenseNumber?: string | null;
    registrationReference?: string | null;
  };

  subscription?: {
    planId?: string;
    planName?: string;
    status?: string;
    userLimit?: number;
  };
};

type ClinicSettings = {
  language: string;
  locale: string;
  timezone: string;
  currency: string;

  dateFormat: string;
  timeFormat: string;

  appointmentNotifications: boolean;
  messageNotifications: boolean;
  paymentNotifications: boolean;
  teamNotifications: boolean;
  supportNotifications: boolean;
  reminderNotifications: boolean;

  emailNotifications: boolean;
  inAppNotifications: boolean;

  compactDashboard: boolean;
  showQuickActions: boolean;
  showActivitySummary: boolean;
};

type PopupState =
  | {
      type:
        | "success"
        | "error";
      title: string;
      message: string;
    }
  | null;

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
): Record<
  string,
  unknown
> {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function safeBoolean(
  value: unknown,
  fallback: boolean
): boolean {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
}

function safeNumber(
  value: unknown,
  fallback: number
): number {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

function settingsFromData(
  value: unknown
): ClinicSettings {
  const data =
    safeObject(
      value
    );

  return {
    language:
      safeString(
        data.language
      ) ||
      "en",

    locale:
      safeString(
        data.locale
      ) ||
      "en-GH",

    timezone:
      safeString(
        data.timezone
      ) ||
      "Africa/Accra",

    currency:
      safeString(
        data.currency
      ) ||
      "GHS",

    dateFormat:
      safeString(
        data.dateFormat
      ) ||
      "DD/MM/YYYY",

    timeFormat:
      safeString(
        data.timeFormat
      ) ||
      "24h",

    appointmentNotifications:
      safeBoolean(
        data.appointmentNotifications,
        true
      ),

    messageNotifications:
      safeBoolean(
        data.messageNotifications,
        true
      ),

    paymentNotifications:
      safeBoolean(
        data.paymentNotifications,
        true
      ),

    teamNotifications:
      safeBoolean(
        data.teamNotifications,
        true
      ),

    supportNotifications:
      safeBoolean(
        data.supportNotifications,
        true
      ),

    reminderNotifications:
      safeBoolean(
        data.reminderNotifications,
        true
      ),

    emailNotifications:
      safeBoolean(
        data.emailNotifications,
        true
      ),

    inAppNotifications:
      safeBoolean(
        data.inAppNotifications,
        true
      ),

    compactDashboard:
      safeBoolean(
        data.compactDashboard,
        false
      ),

    showQuickActions:
      safeBoolean(
        data.showQuickActions,
        true
      ),

    showActivitySummary:
      safeBoolean(
        data.showActivitySummary,
        true
      ),
  };
}

function getClinicView(
  data: ClinicData | null
) {
  const profile =
    safeObject(
      data?.profile
    );

  const clinic =
    safeObject(
      data?.clinic
    );

  const owner =
    safeObject(
      profile.owner
    );

  const subscription =
    safeObject(
      data?.subscription
    );

  const verificationStatus =
    safeString(
      clinic.verificationStatus
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

    email:
      safeString(
        profile.email
      ),

    phone:
      safeString(
        profile.phone
      ),

    city:
      safeString(
        profile.city
      ) ||
      safeString(
        profile.region
      ) ||
      "Ghana",

    address:
      safeString(
        profile.address
      ),

    ownerName:
      safeString(
        owner.fullName
      ) ||
      `${safeString(
        owner.firstName
      )} ${safeString(
        owner.lastName
      )}`.trim() ||
      "Clinic administrator",

    verified:
      clinic.verified ===
        true ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",

    verificationStatus,

    registrationReference:
      safeString(
        clinic.registrationReference ||
          clinic.registrationNumber ||
          clinic.licenseNumber
      ),

    subscriptionName:
      safeString(
        subscription.planName ||
          subscription.planId
      ) ||
      "No plan",

    subscriptionStatus:
      safeString(
        subscription.status
      ) ||
      "none",

    userLimit:
      safeNumber(
        subscription.userLimit,
        0
      ),
  };
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function ToggleSetting({
  title,
  description,
  checked,
  onChange,
  icon: Icon,
  iconClass,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-zinc-950 dark:text-white">
          {title}
        </div>

        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={
          checked
        }
        onClick={() =>
          onChange(
            !checked
          )
        }
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-blue-600"
            : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  description,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  description?: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (
    value: string
  ) => void;
  icon: React.ElementType;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        <Icon className="h-4 w-4 text-blue-600" />

        {label}
      </span>

      {description && (
        <span className="mt-1 block text-xs leading-5 text-zinc-500">
          {description}
        </span>
      )}

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
      >
        {options.map(
          (
            option
          ) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function SettingsClient() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

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
    settings,
    setSettings,
  ] =
    useState<ClinicSettings>(
      settingsFromData(
        null
      )
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    popup,
    setPopup,
  ] =
    useState<PopupState>(
      null
    );

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
                  "[ClinicSettings] Profile realtime error:",
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
     SETTINGS REALTIME
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
      doc(
        firestoreInstance,
        "clinics",
        clinicUid,
        "settings",
        "general"
      ),
      (
        snapshot
      ) => {
        if (
          !snapshot.exists()
        ) {
          return;
        }

        setSettings(
          settingsFromData(
            snapshot.data()
          )
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicSettings] Settings realtime error:",
          snapshotError
        );

        setError(
          "Unable to load clinic settings."
        );
      }
    );
  }, [
    uid,
  ]);

  /* ============================================================
     SETTERS
  ============================================================ */

  function updateTextSetting(
    key:
      | "language"
      | "locale"
      | "timezone"
      | "currency"
      | "dateFormat"
      | "timeFormat",
    value: string
  ) {
    setSettings(
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
  }

  function updateBooleanSetting(
    key:
      | "appointmentNotifications"
      | "messageNotifications"
      | "paymentNotifications"
      | "teamNotifications"
      | "supportNotifications"
      | "reminderNotifications"
      | "emailNotifications"
      | "inAppNotifications"
      | "compactDashboard"
      | "showQuickActions"
      | "showActivitySummary",
    value: boolean
  ) {
    setSettings(
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
  }

  /* ============================================================
     SAVE
  ============================================================ */

  async function saveSettings() {
    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      saving
    ) {
      return;
    }

    setSaving(
      true
    );

    setError(
      null
    );

    try {
      await setDoc(
        doc(
          firestore,
          "clinics",
          uid,
          "settings",
          "general"
        ),
        {
          ...settings,

          clinicId:
            uid,

          accountType:
            "clinic",

          application:
            "doc_chap_ghana",

          country:
            "GH",

          updatedAt:
            serverTimestamp(),
        },
        {
          merge:
            true,
        }
      );

      setPopup({
        type:
          "success",

        title:
          "Settings saved",

        message:
          "Your clinic workspace settings have been updated successfully.",
      });
    } catch (
      saveError
    ) {
      console.error(
        "[ClinicSettings] Save error:",
        saveError
      );

      setError(
        "Unable to save clinic settings."
      );

      setPopup({
        type:
          "error",

        title:
          "Settings not saved",

        message:
          "We could not save your clinic settings. Please try again.",
      });
    } finally {
      setSaving(
        false
      );
    }
  }

  /* ============================================================
     COMPUTED
  ============================================================ */

  const clinic =
    useMemo(
      () =>
        getClinicView(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const enabledNotificationTypes =
    [
      settings.appointmentNotifications,
      settings.messageNotifications,
      settings.paymentNotifications,
      settings.teamNotifications,
      settings.supportNotifications,
      settings.reminderNotifications,
    ].filter(Boolean)
      .length;

  const deliveryChannels =
    [
      settings.emailNotifications,
      settings.inAppNotifications,
    ].filter(Boolean)
      .length;

  /* ============================================================
     LOADING
  ============================================================ */

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <p className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Loading clinic settings...
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
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <ClinicSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          {/* HERO */}

          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#071b3a] via-[#0b2f63] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <Settings2 className="h-4 w-4 text-cyan-200" />

                      Clinic settings
                    </span>

                    {clinic.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified clinic
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <ShieldCheck className="h-4 w-4" />

                        Verification{" "}
                        {clinic.verificationStatus}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Settings
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                    Manage your clinic workspace preferences, notifications, display and regional settings.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                      <Building2 className="h-4 w-4 text-cyan-200" />

                      {clinic.name}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                      <MapPin className="h-4 w-4 text-emerald-200" />

                      {clinic.city}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/clinics/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
                  >
                    <ArrowLeft className="h-4 w-4" />

                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      void saveSettings()
                    }
                    disabled={
                      saving
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:bg-blue-50 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />

                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />

                        Save settings
                      </>
                    )}
                  </button>
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              {/* LEFT */}

              <div className="space-y-6">
                {/* REGIONAL */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <Globe2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-black text-zinc-950 dark:text-white">
                        Regional & workspace
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Set how dates, times, language and money are displayed in the clinic workspace.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <SelectField
                      label="Language"
                      description="Language used across the clinic workspace."
                      value={
                        settings.language
                      }
                      options={[
                        {
                          value:
                            "en",
                          label:
                            "English",
                        },
                      ]}
                      onChange={(
                        value
                      ) =>
                        updateTextSetting(
                          "language",
                          value
                        )
                      }
                      icon={
                        Globe2
                      }
                    />

                    <SelectField
                      label="Locale"
                      description="Regional formatting used by the clinic."
                      value={
                        settings.locale
                      }
                      options={[
                        {
                          value:
                            "en-GH",
                          label:
                            "English (Ghana)",
                        },
                      ]}
                      onChange={(
                        value
                      ) =>
                        updateTextSetting(
                          "locale",
                          value
                        )
                      }
                      icon={
                        MapPin
                      }
                    />

                    <SelectField
                      label="Timezone"
                      description="Timezone used for appointments and clinic activity."
                      value={
                        settings.timezone
                      }
                      options={[
                        {
                          value:
                            "Africa/Accra",
                          label:
                            "Africa/Accra",
                        },
                      ]}
                      onChange={(
                        value
                      ) =>
                        updateTextSetting(
                          "timezone",
                          value
                        )
                      }
                      icon={
                        Clock3
                      }
                    />

                    <SelectField
                      label="Currency"
                      description="Currency used for clinic pricing and financial displays."
                      value={
                        settings.currency
                      }
                      options={[
                        {
                          value:
                            "GHS",
                          label:
                            "GHS — Ghanaian Cedi",
                        },
                      ]}
                      onChange={(
                        value
                      ) =>
                        updateTextSetting(
                          "currency",
                          value
                        )
                      }
                      icon={
                        WalletCards
                      }
                    />

                    <SelectField
                      label="Date format"
                      description="Choose how dates are displayed."
                      value={
                        settings.dateFormat
                      }
                      options={[
                        {
                          value:
                            "DD/MM/YYYY",
                          label:
                            "DD/MM/YYYY",
                        },
                        {
                          value:
                            "YYYY-MM-DD",
                          label:
                            "YYYY-MM-DD",
                        },
                        {
                          value:
                            "MMM D, YYYY",
                          label:
                            "MMM D, YYYY",
                        },
                      ]}
                      onChange={(
                        value
                      ) =>
                        updateTextSetting(
                          "dateFormat",
                          value
                        )
                      }
                      icon={
                        CalendarDays
                      }
                    />

                    <SelectField
                      label="Time format"
                      description="Choose between 12-hour and 24-hour time."
                      value={
                        settings.timeFormat
                      }
                      options={[
                        {
                          value:
                            "24h",
                          label:
                            "24-hour",
                        },
                        {
                          value:
                            "12h",
                          label:
                            "12-hour",
                        },
                      ]}
                      onChange={(
                        value
                      ) =>
                        updateTextSetting(
                          "timeFormat",
                          value
                        )
                      }
                      icon={
                        Clock3
                      }
                    />
                  </div>
                </section>

                {/* NOTIFICATION TYPES */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                      <BellRing className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-black text-zinc-950 dark:text-white">
                        Notification preferences
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Choose which clinic activities should generate notifications.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ToggleSetting
                      title="Appointment notifications"
                      description="Receive updates for created, confirmed, moved or cancelled appointments."
                      checked={
                        settings.appointmentNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "appointmentNotifications",
                          value
                        )
                      }
                      icon={
                        CalendarDays
                      }
                      iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                    />

                    <ToggleSetting
                      title="Message notifications"
                      description="Receive notifications for new clinic conversations and replies."
                      checked={
                        settings.messageNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "messageNotifications",
                          value
                        )
                      }
                      icon={
                        MessageCircle
                      }
                      iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                    />

                    <ToggleSetting
                      title="Payment notifications"
                      description="Receive updates for clinic payment activity."
                      checked={
                        settings.paymentNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "paymentNotifications",
                          value
                        )
                      }
                      icon={
                        CreditCard
                      }
                      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    />

                    <ToggleSetting
                      title="Team notifications"
                      description="Receive updates related to healthcare team activity."
                      checked={
                        settings.teamNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "teamNotifications",
                          value
                        )
                      }
                      icon={
                        Users
                      }
                      iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300"
                    />

                    <ToggleSetting
                      title="Support notifications"
                      description="Receive updates when support requests change status or receive a reply."
                      checked={
                        settings.supportNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "supportNotifications",
                          value
                        )
                      }
                      icon={
                        ShieldCheck
                      }
                      iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                    />

                    <ToggleSetting
                      title="Reminder notifications"
                      description="Receive reminders related to upcoming clinic activity."
                      checked={
                        settings.reminderNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "reminderNotifications",
                          value
                        )
                      }
                      icon={
                        Clock3
                      }
                      iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
                    />
                  </div>
                </section>

                {/* CHANNELS */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Mail className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-black text-zinc-950 dark:text-white">
                        Notification channels
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Choose where enabled clinic notifications should be delivered.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ToggleSetting
                      title="Email notifications"
                      description="Allow supported clinic notifications to be sent by email."
                      checked={
                        settings.emailNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "emailNotifications",
                          value
                        )
                      }
                      icon={
                        Mail
                      }
                      iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                    />

                    <ToggleSetting
                      title="In-app notifications"
                      description="Display supported notifications inside the Doc Chap clinic workspace."
                      checked={
                        settings.inAppNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "inAppNotifications",
                          value
                        )
                      }
                      icon={
                        Smartphone
                      }
                      iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                    />
                  </div>
                </section>

                {/* DISPLAY */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300">
                      <MonitorCog className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-black text-zinc-950 dark:text-white">
                        Workspace display
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Adjust how the clinic dashboard is presented to clinic users.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ToggleSetting
                      title="Compact dashboard"
                      description="Use a more compact layout for clinic dashboard information."
                      checked={
                        settings.compactDashboard
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "compactDashboard",
                          value
                        )
                      }
                      icon={
                        LayoutDashboard
                      }
                      iconClass="bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    />

                    <ToggleSetting
                      title="Show quick actions"
                      description="Display clinic quick-action shortcuts on the dashboard."
                      checked={
                        settings.showQuickActions
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "showQuickActions",
                          value
                        )
                      }
                      icon={
                        Sparkles
                      }
                      iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                    />

                    <ToggleSetting
                      title="Show activity summary"
                      description="Display clinic activity overview and recent operational indicators."
                      checked={
                        settings.showActivitySummary
                      }
                      onChange={(
                        value
                      ) =>
                        updateBooleanSetting(
                          "showActivitySummary",
                          value
                        )
                      }
                      icon={
                        Eye
                      }
                      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    />
                  </div>
                </section>

                {/* SAVE */}

                <button
                  type="button"
                  onClick={() =>
                    void saveSettings()
                  }
                  disabled={
                    saving
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#0b2f63] disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      Saving settings...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />

                      Save clinic settings
                    </>
                  )}
                </button>
              </div>

              {/* RIGHT */}

              <aside className="space-y-5">
                {/* CLINIC SUMMARY */}

                <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                      <Building2 className="h-7 w-7" />
                    </div>

                    <h3 className="mt-4 text-lg font-black">
                      {clinic.name}
                    </h3>

                    <p className="mt-1 text-sm text-blue-100">
                      {clinic.city}
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        Administrator
                      </div>

                      <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                        {clinic.ownerName}
                      </div>
                    </div>

                    {clinic.email && (
                      <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                          Clinic email
                        </div>

                        <div className="mt-1 break-all text-sm font-bold text-zinc-950 dark:text-white">
                          {clinic.email}
                        </div>
                      </div>
                    )}

                    {clinic.phone && (
                      <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                          Clinic phone
                        </div>

                        <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                          {clinic.phone}
                        </div>
                      </div>
                    )}

                    {clinic.registrationReference && (
                      <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                          Registration / licence
                        </div>

                        <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                          {clinic.registrationReference}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* SUBSCRIPTION */}

                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-sm font-black text-zinc-950 dark:text-white">
                    Clinic subscription
                  </h3>

                  <div className="mt-4 rounded-2xl bg-white/80 p-4 dark:bg-zinc-950/60">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                      Current plan
                    </div>

                    <div className="mt-1 capitalize text-lg font-black text-zinc-950 dark:text-white">
                      {clinic.subscriptionName}
                    </div>

                    <div className="mt-1 text-xs capitalize text-zinc-500">
                      {clinic.subscriptionStatus}
                    </div>

                    {clinic.userLimit >
                      0 && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        <Users className="h-4 w-4" />

                        Up to{" "}
                        {clinic.userLimit}{" "}
                        users
                      </div>
                    )}
                  </div>

                  <Link
                    href="/clinics/dashboard/subscriptions"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
                  >
                    Manage subscription
                  </Link>
                </section>

                {/* NOTIFICATIONS SUMMARY */}

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <BellRing className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Notification summary
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-violet-50 p-4 text-center dark:bg-violet-950/20">
                      <div className="text-2xl font-black text-zinc-950 dark:text-white">
                        {enabledNotificationTypes}
                      </div>

                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        Types enabled
                      </div>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-4 text-center dark:bg-blue-950/20">
                      <div className="text-2xl font-black text-zinc-950 dark:text-white">
                        {deliveryChannels}
                      </div>

                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        Channels
                      </div>
                    </div>
                  </div>
                </section>

                {/* SETTINGS SUMMARY */}

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <Settings2 className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Workspace summary
                  </h3>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2.5 dark:bg-zinc-950/50">
                      <span className="text-xs text-zinc-500">
                        Language
                      </span>

                      <span className="text-xs font-black text-zinc-900 dark:text-white">
                        English
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2.5 dark:bg-zinc-950/50">
                      <span className="text-xs text-zinc-500">
                        Timezone
                      </span>

                      <span className="text-xs font-black text-zinc-900 dark:text-white">
                        {settings.timezone}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2.5 dark:bg-zinc-950/50">
                      <span className="text-xs text-zinc-500">
                        Currency
                      </span>

                      <span className="text-xs font-black text-zinc-900 dark:text-white">
                        {settings.currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2.5 dark:bg-zinc-950/50">
                      <span className="text-xs text-zinc-500">
                        Date / time
                      </span>

                      <span className="text-xs font-black text-zinc-900 dark:text-white">
                        {settings.dateFormat}
                        {" • "}
                        {settings.timeFormat}
                      </span>
                    </div>
                  </div>
                </section>

                {/* INFO */}

                <section className="rounded-[28px] border border-cyan-200 bg-cyan-50/70 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <Sparkles className="h-6 w-6 text-cyan-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Clinic-only settings
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    These preferences apply only to the clinic workspace. Medical activity, specialties, consultation modes and prices remain managed from Clinic Configuration.
                  </p>
                </section>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* POPUP */}

      {popup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPopup(
                null
              );
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-zinc-950">
            <button
              type="button"
              onClick={() =>
                setPopup(
                  null
                )
              }
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                popup.type ===
                "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {popup.type ===
              "success" ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : (
                <AlertCircle className="h-7 w-7" />
              )}
            </div>

            <h2 className="mt-5 pr-10 text-xl font-black text-zinc-950 dark:text-white">
              {popup.title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {popup.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setPopup(
                  null
                )
              }
              className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white ${
                popup.type ===
                "success"
                  ? "bg-emerald-600"
                  : "bg-red-600"
              }`}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}