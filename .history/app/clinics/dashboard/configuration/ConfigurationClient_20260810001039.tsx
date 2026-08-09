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
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  BellRing,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Globe2,
  LayoutDashboard,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
  Trash2,
  Video,
  X,
  CalendarDays,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";
import ClinicDisponibilitiesModal from "@/app/components/ClinicDisponibilitiesModal";

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
    phone?: string;
    email?: string;
    city?: string;
    region?: string;
    address?: string;
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
  };
};

type ClinicConfiguration = {
  clinicVisible: boolean;
  acceptsNewPatients: boolean;

  inPersonEnabled: boolean;
  teleconsultationEnabled: boolean;
  phoneConsultationEnabled: boolean;

  messagingEnabled: boolean;

  showPhone: boolean;
  showAddress: boolean;

  autoConfirmAppointments: boolean;
  appointmentRemindersEnabled: boolean;

  defaultConsultationDuration: string;

  language: string;
  locale: string;
  timezone: string;
  currency: string;
};

type ClinicSpecialty = {
  id: string;
  clinicId?: string;
  name?: string;
  normalizedName?: string;
  description?: string;
  active?: boolean;
  status?: string;

  pricing?: {
    currency?: string;

    inPerson?: {
      enabled?: boolean;
      amount?: number;
    };

    video?: {
      enabled?: boolean;
      amount?: number;
    };

    phone?: {
      enabled?: boolean;
      amount?: number;
    };
  };

  createdAt?: unknown;
  updatedAt?: unknown;
};

type SpecialtyForm = {
  name: string;
  description: string;

  inPersonEnabled: boolean;
  inPersonPrice: string;

  videoEnabled: boolean;
  videoPrice: string;

  phoneEnabled: boolean;
  phonePrice: string;
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

function getClinicName(
  data: ClinicData | null
): string {
  const profile =
    safeObject(
      data?.profile
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
}

function getClinicLocation(
  data: ClinicData | null
): string {
  const profile =
    safeObject(
      data?.profile
    );

  return (
    [
      safeString(
        profile.city
      ),
      safeString(
        profile.region
      ),
    ]
      .filter(Boolean)
      .join(", ") ||
    "Ghana"
  );
}

function getVerificationStatus(
  data: ClinicData | null
): string {
  const clinic =
    safeObject(
      data?.clinic
    );

  return (
    safeString(
      clinic.verificationStatus
    ).toLowerCase() ||
    "pending"
  );
}

function isVerifiedClinic(
  data: ClinicData | null
): boolean {
  const clinic =
    safeObject(
      data?.clinic
    );

  const status =
    getVerificationStatus(
      data
    );

  return (
    clinic.verified ===
      true ||
    status ===
      "verified" ||
    status ===
      "approved"
  );
}

function configurationFromData(
  value: unknown
): ClinicConfiguration {
  const config =
    safeObject(
      value
    );

  return {
    clinicVisible:
      safeBoolean(
        config.clinicVisible,
        true
      ),

    acceptsNewPatients:
      safeBoolean(
        config.acceptsNewPatients,
        true
      ),

    inPersonEnabled:
      safeBoolean(
        config.inPersonEnabled,
        true
      ),

    teleconsultationEnabled:
      safeBoolean(
        config.teleconsultationEnabled,
        true
      ),

    phoneConsultationEnabled:
      safeBoolean(
        config.phoneConsultationEnabled,
        false
      ),

    messagingEnabled:
      safeBoolean(
        config.messagingEnabled,
        true
      ),

    showPhone:
      safeBoolean(
        config.showPhone,
        true
      ),

    showAddress:
      safeBoolean(
        config.showAddress,
        true
      ),

    autoConfirmAppointments:
      safeBoolean(
        config.autoConfirmAppointments,
        false
      ),

    appointmentRemindersEnabled:
      safeBoolean(
        config.appointmentRemindersEnabled,
        true
      ),

    defaultConsultationDuration:
      String(
        safeNumber(
          config.defaultConsultationDuration,
          30
        )
      ),

    language:
      safeString(
        config.language
      ) ||
      "en",

    locale:
      safeString(
        config.locale
      ) ||
      "en-GH",

    timezone:
      safeString(
        config.timezone
      ) ||
      "Africa/Accra",

    currency:
      safeString(
        config.currency
      ) ||
      "GHS",
  };
}


function emptySpecialtyForm(
  configuration: ClinicConfiguration
): SpecialtyForm {
  return {
    name: "",
    description: "",

    inPersonEnabled:
      configuration.inPersonEnabled,
    inPersonPrice: "",

    videoEnabled:
      configuration.teleconsultationEnabled,
    videoPrice: "",

    phoneEnabled:
      configuration.phoneConsultationEnabled,
    phonePrice: "",
  };
}

function specialtyPrice(
  value: string
): number {
  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function formatGhs(
  amount: number
): string {
  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style: "currency",
        currency: "GHS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(
      amount
    );
  } catch {
    return `${amount.toLocaleString(
      "en-GH"
    )} GHS`;
  }
}

/* ============================================================
   UI COMPONENTS
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

function NumberField({
  label,
  value,
  onChange,
  suffix,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  suffix: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {label}
      </span>

      <div className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3.5 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <input
          type="number"
          min="0"
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
          className="h-12 w-full min-w-0 bg-transparent text-sm text-zinc-900 outline-none dark:text-white"
        />

        <span className="shrink-0 text-xs font-semibold text-zinc-400">
          {suffix}
        </span>
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {label}
      </span>

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
        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
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

export default function ConfigurationClient() {
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
    configuration,
    setConfiguration,
  ] =
    useState<ClinicConfiguration>(
      configurationFromData(
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

  const [
    availabilitiesModalOpen,
    setAvailabilitiesModalOpen,
  ] =
    useState(false);

  const [
    specialties,
    setSpecialties,
  ] =
    useState<ClinicSpecialty[]>(
      []
    );

  const [
    specialtyForm,
    setSpecialtyForm,
  ] =
    useState<SpecialtyForm>(
      emptySpecialtyForm(
        configurationFromData(
          null
        )
      )
    );

  const [
    savingSpecialty,
    setSavingSpecialty,
  ] =
    useState(false);

  const [
    editingSpecialtyId,
    setEditingSpecialtyId,
  ] =
    useState<string | null>(
      null
    );

  const [
    deletingSpecialtyId,
    setDeletingSpecialtyId,
  ] =
    useState<string | null>(
      null
    );

  /* ============================================================
     AUTH + CLINIC PROFILE
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
        "Firebase is not initialized. Check your Firebase environment variables."
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

          unsubscribeClinic =
            onSnapshot(
              doc(
                firestoreInstance,
                "clinics",
                user.uid
              ),
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
                  "[ClinicConfiguration] Profile realtime error:",
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
     CONFIGURATION REALTIME
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
        "configuration",
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

        setConfiguration(
          configurationFromData(
            snapshot.data()
          )
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicConfiguration] Configuration realtime error:",
          snapshotError
        );

        setError(
          "Unable to load clinic activity configuration."
        );
      }
    );
  }, [
    uid,
  ]);

  /* ============================================================
     SPECIALTIES REALTIME
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
        "specialties"
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
                  ClinicSpecialty,
                  "id"
                >
              ),
            })
          );

        rows.sort(
          (
            a,
            b
          ) =>
            safeString(
              a.name
            ).localeCompare(
              safeString(
                b.name
              )
            )
        );

        setSpecialties(
          rows
        );
      },
      (
        snapshotError
      ) => {
        console.error(
          "[ClinicConfiguration] Specialties realtime error:",
          snapshotError
        );

        setError(
          "Unable to load clinic specialties."
        );
      }
    );
  }, [
    uid,
  ]);

  /* ============================================================
     SETTERS
  ============================================================ */

  function setBooleanField(
    key:
      | "clinicVisible"
      | "acceptsNewPatients"
      | "inPersonEnabled"
      | "teleconsultationEnabled"
      | "phoneConsultationEnabled"
      | "messagingEnabled"
      | "showPhone"
      | "showAddress"
      | "autoConfirmAppointments"
      | "appointmentRemindersEnabled",
    value: boolean
  ) {
    setConfiguration(
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

  function setTextField(
    key:
      | "defaultConsultationDuration"
      | "language"
      | "locale"
      | "timezone"
      | "currency",
    value: string
  ) {
    setConfiguration(
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
     SPECIALTY MANAGEMENT
  ============================================================ */

  function updateSpecialtyField<
    K extends keyof SpecialtyForm
  >(
    key: K,
    value: SpecialtyForm[K]
  ) {
    setSpecialtyForm(
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

  function resetSpecialtyForm() {
    setEditingSpecialtyId(
      null
    );

    setSpecialtyForm(
      emptySpecialtyForm(
        configuration
      )
    );
  }

  function editSpecialty(
    specialty: ClinicSpecialty
  ) {
    const pricing =
      safeObject(
        specialty.pricing
      );

    const inPerson =
      safeObject(
        pricing.inPerson
      );

    const video =
      safeObject(
        pricing.video
      );

    const phone =
      safeObject(
        pricing.phone
      );

    setEditingSpecialtyId(
      specialty.id
    );

    setSpecialtyForm({
      name:
        safeString(
          specialty.name
        ),

      description:
        safeString(
          specialty.description
        ),

      inPersonEnabled:
        safeBoolean(
          inPerson.enabled,
          false
        ),

      inPersonPrice:
        String(
          safeNumber(
            inPerson.amount,
            0
          ) || ""
        ),

      videoEnabled:
        safeBoolean(
          video.enabled,
          false
        ),

      videoPrice:
        String(
          safeNumber(
            video.amount,
            0
          ) || ""
        ),

      phoneEnabled:
        safeBoolean(
          phone.enabled,
          false
        ),

      phonePrice:
        String(
          safeNumber(
            phone.amount,
            0
          ) || ""
        ),
    });

    setError(
      null
    );

    window.setTimeout(
      () => {
        document
          .getElementById(
            "clinic-specialty-form"
          )
          ?.scrollIntoView({
            behavior:
              "smooth",
            block:
              "start",
          });
      },
      50
    );
  }

  async function saveSpecialty() {
    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      savingSpecialty
    ) {
      return;
    }

    const cleanName =
      specialtyForm.name.trim();

    if (
      cleanName.length <
      2
    ) {
      setError(
        "Enter a specialty name."
      );

      return;
    }

    const enabledModes =
      [
        specialtyForm.inPersonEnabled,
        specialtyForm.videoEnabled,
        specialtyForm.phoneEnabled,
      ].filter(Boolean)
        .length;

    if (
      enabledModes ===
      0
    ) {
      setError(
        "Enable at least one consultation mode for this specialty."
      );

      return;
    }

    const inPersonPrice =
      specialtyPrice(
        specialtyForm.inPersonPrice
      );

    const videoPrice =
      specialtyPrice(
        specialtyForm.videoPrice
      );

    const phonePrice =
      specialtyPrice(
        specialtyForm.phonePrice
      );

    if (
      specialtyForm.inPersonEnabled &&
      inPersonPrice <=
        0
    ) {
      setError(
        "Enter a valid in-person consultation price."
      );

      return;
    }

    if (
      specialtyForm.videoEnabled &&
      videoPrice <=
        0
    ) {
      setError(
        "Enter a valid teleconsultation price."
      );

      return;
    }

    if (
      specialtyForm.phoneEnabled &&
      phonePrice <=
        0
    ) {
      setError(
        "Enter a valid phone consultation price."
      );

      return;
    }

    const duplicate =
      specialties.some(
        (
          item
        ) =>
          item.id !==
            editingSpecialtyId &&
          safeString(
            item.name
          ).toLowerCase() ===
            cleanName.toLowerCase()
      );

    if (
      duplicate
    ) {
      setError(
        "This specialty already exists for your clinic."
      );

      return;
    }

    setSavingSpecialty(
      true
    );

    setError(
      null
    );

    const payload = {
      clinicId:
        uid,

      clinicName,

      name:
        cleanName,

      normalizedName:
        cleanName.toLowerCase(),

      description:
        specialtyForm.description.trim() ||
        null,

      active:
        true,

      status:
        "active",

      pricing: {
        currency:
          "GHS",

        inPerson: {
          enabled:
            specialtyForm.inPersonEnabled,

          amount:
            specialtyForm.inPersonEnabled
              ? inPersonPrice
              : 0,
        },

        video: {
          enabled:
            specialtyForm.videoEnabled,

          amount:
            specialtyForm.videoEnabled
              ? videoPrice
              : 0,
        },

        phone: {
          enabled:
            specialtyForm.phoneEnabled,

          amount:
            specialtyForm.phoneEnabled
              ? phonePrice
              : 0,
        },
      },

      country:
        "GH",

      locale:
        "en-GH",

      timezone:
        "Africa/Accra",

      application:
        "doc_chap_ghana",

      source:
        "clinic_configuration",

      updatedAt:
        serverTimestamp(),
    };

    try {
      if (
        editingSpecialtyId
      ) {
        await updateDoc(
          doc(
            firestore,
            "clinics",
            uid,
            "specialties",
            editingSpecialtyId
          ),
          payload
        );

        setPopup({
          type:
            "success",

          title:
            "Specialty updated",

          message:
            `${cleanName} and its consultation prices have been updated successfully.`,
        });
      } else {
        await addDoc(
          collection(
            firestore,
            "clinics",
            uid,
            "specialties"
          ),
          {
            ...payload,

            createdAt:
              serverTimestamp(),
          }
        );

        setPopup({
          type:
            "success",

          title:
            "Specialty added",

          message:
            `${cleanName} has been added to your clinic with its consultation prices.`,
        });
      }

      resetSpecialtyForm();
    } catch (
      specialtyError
    ) {
      console.error(
        "[ClinicConfiguration] Specialty save error:",
        specialtyError
      );

      setError(
        "Unable to save this specialty."
      );
    } finally {
      setSavingSpecialty(
        false
      );
    }
  }

  async function removeSpecialty(
    specialty: ClinicSpecialty
  ) {
    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      deletingSpecialtyId
    ) {
      return;
    }

    const name =
      safeString(
        specialty.name
      ) ||
      "Specialty";

    const confirmed =
      window.confirm(
        `Remove ${name} from this clinic?`
      );

    if (
      !confirmed
    ) {
      return;
    }

    setDeletingSpecialtyId(
      specialty.id
    );

    setError(
      null
    );

    try {
      await deleteDoc(
        doc(
          firestore,
          "clinics",
          uid,
          "specialties",
          specialty.id
        )
      );

      if (
        editingSpecialtyId ===
        specialty.id
      ) {
        resetSpecialtyForm();
      }

      setPopup({
        type:
          "success",

        title:
          "Specialty removed",

        message:
          `${name} has been removed from your clinic.`,
      });
    } catch (
      deleteError
    ) {
      console.error(
        "[ClinicConfiguration] Specialty delete error:",
        deleteError
      );

      setError(
        "Unable to remove this specialty."
      );
    } finally {
      setDeletingSpecialtyId(
        null
      );
    }
  }

  /* ============================================================
     SAVE
  ============================================================ */

  async function saveConfiguration() {
    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      saving
    ) {
      return;
    }

    const duration =
      Number(
        configuration.defaultConsultationDuration
      );

    if (
      !Number.isFinite(
        duration
      ) ||
      duration <
        5 ||
      duration >
        240
    ) {
      setError(
        "Default consultation duration must be between 5 and 240 minutes."
      );

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
          "configuration",
          "general"
        ),
        {
          clinicVisible:
            configuration.clinicVisible,

          acceptsNewPatients:
            configuration.acceptsNewPatients,

          inPersonEnabled:
            configuration.inPersonEnabled,

          teleconsultationEnabled:
            configuration.teleconsultationEnabled,

          phoneConsultationEnabled:
            configuration.phoneConsultationEnabled,

          messagingEnabled:
            configuration.messagingEnabled,

          showPhone:
            configuration.showPhone,

          showAddress:
            configuration.showAddress,

          autoConfirmAppointments:
            configuration.autoConfirmAppointments,

          appointmentRemindersEnabled:
            configuration.appointmentRemindersEnabled,

          defaultConsultationDuration:
            duration,

          language:
            configuration.language,

          locale:
            configuration.locale,

          timezone:
            configuration.timezone,

          currency:
            configuration.currency,

          clinicId:
            uid,

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
          "Configuration saved",

        message:
          "Your clinic activity configuration has been updated successfully.",
      });
    } catch (
      saveError
    ) {
      console.error(
        "[ClinicConfiguration] Save error:",
        saveError
      );

      setError(
        "Unable to save your clinic configuration. Please try again."
      );

      setPopup({
        type:
          "error",

        title:
          "Configuration not saved",

        message:
          "We could not save your clinic activity settings. Please try again.",
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

  const clinicName =
    useMemo(
      () =>
        getClinicName(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const location =
    useMemo(
      () =>
        getClinicLocation(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const verified =
    useMemo(
      () =>
        isVerifiedClinic(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const verificationStatus =
    useMemo(
      () =>
        getVerificationStatus(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const activeConsultationModes =
    useMemo(
      () => {
        const modes: Array<{
          label: string;
          icon: React.ElementType;
          className: string;
        }> = [];

        if (
          configuration.inPersonEnabled
        ) {
          modes.push({
            label:
              "In-person",

            icon:
              UserRound,

            className:
              "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
          });
        }

        if (
          configuration.teleconsultationEnabled
        ) {
          modes.push({
            label:
              "Video",

            icon:
              Video,

            className:
              "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
          });
        }

        if (
          configuration.phoneConsultationEnabled
        ) {
          modes.push({
            label:
              "Phone",

            icon:
              Smartphone,

            className:
              "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
          });
        }

        return modes;
      },
      [
        configuration.inPersonEnabled,
        configuration.teleconsultationEnabled,
        configuration.phoneConsultationEnabled,
      ]
    );

  const enabledActivityCount =
    [
      configuration.inPersonEnabled,
      configuration.teleconsultationEnabled,
      configuration.phoneConsultationEnabled,
      configuration.messagingEnabled,
    ].filter(Boolean).length;

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
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200/80 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <div className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading clinic configuration...
              </div>
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

          <section className="relative overflow-hidden border-b border-blue-900/20 bg-gradient-to-br from-[#071b3a] via-[#0b2d5f] to-[#164a8a] text-white">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <Building2 className="h-4 w-4 text-cyan-300" />

                      Clinic configuration
                    </span>

                    {verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified clinic
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <ShieldCheck className="h-4 w-4" />

                        Verification{" "}
                        {verificationStatus}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    {clinicName}
                  </h1>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold">
                      <MapPin className="h-4 w-4 text-emerald-300" />

                      {location}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold">
                      <Globe2 className="h-4 w-4 text-cyan-300" />

                      Ghana
                    </span>
                  </div>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                    Configure how your clinic operates, how patients can interact with it and which consultation services are available on Doc Chap Ghana.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                  <Link
                    href="/clinics/my-account"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/15"
                  >
                    <ArrowLeft className="h-4 w-4" />

                    My clinic account
                  </Link>

                  <Link
                    href="/clinics/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/15"
                  >
                    <LayoutDashboard className="h-4 w-4" />

                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      setAvailabilitiesModalOpen(
                        true
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                  >
                    <CalendarDays className="h-4 w-4" />

                    Availability
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveConfiguration()
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

                        Save configuration
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
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  {error}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
              {/* MAIN */}

              <div className="space-y-6">
                {/* VISIBILITY */}

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <Eye className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                        Clinic visibility
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        Control how patients can discover and contact your clinic.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ToggleSetting
                      title="Public clinic profile"
                      description="Allow patients to discover your clinic on Doc Chap."
                      checked={
                        configuration.clinicVisible
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "clinicVisible",
                          value
                        )
                      }
                      icon={
                        configuration.clinicVisible
                          ? Eye
                          : EyeOff
                      }
                      iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                    />

                    <ToggleSetting
                      title="Accept new patients"
                      description="Allow new patients to book appointments with the clinic."
                      checked={
                        configuration.acceptsNewPatients
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "acceptsNewPatients",
                          value
                        )
                      }
                      icon={
                        UsersRound
                      }
                      iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                    />

                    <ToggleSetting
                      title="Show clinic phone"
                      description="Display the clinic contact number to patients."
                      checked={
                        configuration.showPhone
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "showPhone",
                          value
                        )
                      }
                      icon={
                        Phone
                      }
                      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    />

                    <ToggleSetting
                      title="Show clinic address"
                      description="Display the clinic address on its public profile."
                      checked={
                        configuration.showAddress
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "showAddress",
                          value
                        )
                      }
                      icon={
                        MapPin
                      }
                      iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
                    />
                  </div>
                </section>

                {/* SERVICES */}

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                      <Stethoscope className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                        Consultation services
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        Choose the consultation services your clinic offers to patients.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ToggleSetting
                      title="In-person appointments"
                      description="Allow patients to book physical appointments at the clinic."
                      checked={
                        configuration.inPersonEnabled
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "inPersonEnabled",
                          value
                        )
                      }
                      icon={
                        UserRound
                      }
                      iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300"
                    />

                    <ToggleSetting
                      title="Teleconsultation"
                      description="Allow the clinic to manage remote video consultations."
                      checked={
                        configuration.teleconsultationEnabled
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "teleconsultationEnabled",
                          value
                        )
                      }
                      icon={
                        Video
                      }
                      iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"
                    />

                    <ToggleSetting
                      title="Phone consultation"
                      description="Allow consultation appointments that take place by phone."
                      checked={
                        configuration.phoneConsultationEnabled
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "phoneConsultationEnabled",
                          value
                        )
                      }
                      icon={
                        Smartphone
                      }
                      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    />

                    <ToggleSetting
                      title="Clinic messaging"
                      description="Allow the clinic to use Doc Chap messaging with patients and healthcare professionals."
                      checked={
                        configuration.messagingEnabled
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "messagingEnabled",
                          value
                        )
                      }
                      icon={
                        MessageCircle
                      }
                      iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                    />
                  </div>
                </section>

                {/* SPECIALTIES & PRICING */}

                <section
                  id="clinic-specialty-form"
                  className="scroll-mt-24 rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300">
                        <Stethoscope className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                          Clinic specialties & consultation prices
                        </h2>

                        <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
                          Add each medical specialty offered by your clinic and define a different price for in-person, video and phone consultations.
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                      <Stethoscope className="h-4 w-4" />

                      {specialties.length} specialt
                      {specialties.length ===
                      1
                        ? "y"
                        : "ies"}
                    </span>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                          {editingSpecialtyId
                            ? "Edit specialty"
                            : "Add a specialty"}
                        </h3>

                        <p className="mt-1 text-xs text-zinc-500">
                          Only enable the consultation modes available for this specialty.
                        </p>
                      </div>

                      {editingSpecialtyId && (
                        <button
                          type="button"
                          onClick={
                            resetSpecialtyForm
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                        >
                          <X className="h-4 w-4" />

                          Cancel editing
                        </button>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                          Specialty name *
                        </span>

                        <input
                          value={
                            specialtyForm.name
                          }
                          onChange={(
                            event
                          ) =>
                            updateSpecialtyField(
                              "name",
                              event.target
                                .value
                            )
                          }
                          placeholder="Example: Cardiology"
                          className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                          Description
                        </span>

                        <input
                          value={
                            specialtyForm.description
                          }
                          onChange={(
                            event
                          ) =>
                            updateSpecialtyField(
                              "description",
                              event.target
                                .value
                            )
                          }
                          placeholder="Optional short description"
                          className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                        />
                      </label>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
                      <div
                        className={`rounded-2xl border p-4 ${
                          specialtyForm.inPersonEnabled
                            ? "border-cyan-200 bg-cyan-50/70 dark:border-cyan-900/40 dark:bg-cyan-950/20"
                            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <UserRound className="h-5 w-5 text-cyan-600" />

                            <span className="text-sm font-black text-zinc-950 dark:text-white">
                              In-person
                            </span>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={
                              specialtyForm.inPersonEnabled
                            }
                            onClick={() =>
                              updateSpecialtyField(
                                "inPersonEnabled",
                                !specialtyForm.inPersonEnabled
                              )
                            }
                            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                              specialtyForm.inPersonEnabled
                                ? "bg-cyan-600"
                                : "bg-zinc-300 dark:bg-zinc-700"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                specialtyForm.inPersonEnabled
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />
                          </button>
                        </div>

                        <label className="mt-4 block">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                            Consultation price
                          </span>

                          <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={
                                !specialtyForm.inPersonEnabled
                              }
                              value={
                                specialtyForm.inPersonPrice
                              }
                              onChange={(
                                event
                              ) =>
                                updateSpecialtyField(
                                  "inPersonPrice",
                                  event.target
                                    .value
                                )
                              }
                              placeholder="0"
                              className="h-11 w-full bg-transparent text-sm font-bold text-zinc-950 outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-white"
                            />

                            <span className="text-xs font-black text-zinc-400">
                              GHS
                            </span>
                          </div>
                        </label>
                      </div>

                      <div
                        className={`rounded-2xl border p-4 ${
                          specialtyForm.videoEnabled
                            ? "border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/40 dark:bg-indigo-950/20"
                            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-indigo-600" />

                            <span className="text-sm font-black text-zinc-950 dark:text-white">
                              Teleconsultation
                            </span>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={
                              specialtyForm.videoEnabled
                            }
                            onClick={() =>
                              updateSpecialtyField(
                                "videoEnabled",
                                !specialtyForm.videoEnabled
                              )
                            }
                            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                              specialtyForm.videoEnabled
                                ? "bg-indigo-600"
                                : "bg-zinc-300 dark:bg-zinc-700"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                specialtyForm.videoEnabled
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />
                          </button>
                        </div>

                        <label className="mt-4 block">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                            Consultation price
                          </span>

                          <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={
                                !specialtyForm.videoEnabled
                              }
                              value={
                                specialtyForm.videoPrice
                              }
                              onChange={(
                                event
                              ) =>
                                updateSpecialtyField(
                                  "videoPrice",
                                  event.target
                                    .value
                                )
                              }
                              placeholder="0"
                              className="h-11 w-full bg-transparent text-sm font-bold text-zinc-950 outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-white"
                            />

                            <span className="text-xs font-black text-zinc-400">
                              GHS
                            </span>
                          </div>
                        </label>
                      </div>

                      <div
                        className={`rounded-2xl border p-4 ${
                          specialtyForm.phoneEnabled
                            ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-emerald-600" />

                            <span className="text-sm font-black text-zinc-950 dark:text-white">
                              Phone
                            </span>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={
                              specialtyForm.phoneEnabled
                            }
                            onClick={() =>
                              updateSpecialtyField(
                                "phoneEnabled",
                                !specialtyForm.phoneEnabled
                              )
                            }
                            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                              specialtyForm.phoneEnabled
                                ? "bg-emerald-600"
                                : "bg-zinc-300 dark:bg-zinc-700"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                specialtyForm.phoneEnabled
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />
                          </button>
                        </div>

                        <label className="mt-4 block">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                            Consultation price
                          </span>

                          <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={
                                !specialtyForm.phoneEnabled
                              }
                              value={
                                specialtyForm.phonePrice
                              }
                              onChange={(
                                event
                              ) =>
                                updateSpecialtyField(
                                  "phonePrice",
                                  event.target
                                    .value
                                )
                              }
                              placeholder="0"
                              className="h-11 w-full bg-transparent text-sm font-bold text-zinc-950 outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-white"
                            />

                            <span className="text-xs font-black text-zinc-400">
                              GHS
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void saveSpecialty()
                      }
                      disabled={
                        savingSpecialty
                      }
                      className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingSpecialty ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />

                          Saving specialty...
                        </>
                      ) : editingSpecialtyId ? (
                        <>
                          <Save className="h-4 w-4" />

                          Update specialty
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />

                          Add specialty
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                      Configured specialties
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Each specialty keeps its own consultation modes and prices.
                    </p>

                    {specialties.length ===
                    0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                        <Stethoscope className="mx-auto h-7 w-7 text-zinc-400" />

                        <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          No specialty configured yet.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 gap-4">
                        {specialties.map(
                          (
                            specialty
                          ) => {
                            const pricing =
                              safeObject(
                                specialty.pricing
                              );

                            const inPerson =
                              safeObject(
                                pricing.inPerson
                              );

                            const video =
                              safeObject(
                                pricing.video
                              );

                            const phone =
                              safeObject(
                                pricing.phone
                              );

                            return (
                              <article
                                key={
                                  specialty.id
                                }
                                className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
                              >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-sm font-black text-zinc-950 dark:text-white">
                                        {safeString(
                                          specialty.name
                                        ) ||
                                          "Specialty"}
                                      </h4>

                                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                        Active
                                      </span>
                                    </div>

                                    {safeString(
                                      specialty.description
                                    ) && (
                                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                                        {safeString(
                                          specialty.description
                                        )}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex shrink-0 items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        editSpecialty(
                                          specialty
                                        )
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
                                      aria-label="Edit specialty"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void removeSpecialty(
                                          specialty
                                        )
                                      }
                                      disabled={
                                        deletingSpecialtyId ===
                                        specialty.id
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                                      aria-label="Delete specialty"
                                    >
                                      {deletingSpecialtyId ===
                                      specialty.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                  <div
                                    className={`rounded-2xl p-3 ${
                                      safeBoolean(
                                        inPerson.enabled,
                                        false
                                      )
                                        ? "bg-cyan-50 dark:bg-cyan-950/20"
                                        : "bg-zinc-100 opacity-60 dark:bg-zinc-950"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                                      <UserRound className="h-3.5 w-3.5" />

                                      In-person
                                    </div>

                                    <div className="mt-2 text-sm font-black text-zinc-950 dark:text-white">
                                      {safeBoolean(
                                        inPerson.enabled,
                                        false
                                      )
                                        ? formatGhs(
                                            safeNumber(
                                              inPerson.amount,
                                              0
                                            )
                                          )
                                        : "Not offered"}
                                    </div>
                                  </div>

                                  <div
                                    className={`rounded-2xl p-3 ${
                                      safeBoolean(
                                        video.enabled,
                                        false
                                      )
                                        ? "bg-indigo-50 dark:bg-indigo-950/20"
                                        : "bg-zinc-100 opacity-60 dark:bg-zinc-950"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                                      <Video className="h-3.5 w-3.5" />

                                      Video
                                    </div>

                                    <div className="mt-2 text-sm font-black text-zinc-950 dark:text-white">
                                      {safeBoolean(
                                        video.enabled,
                                        false
                                      )
                                        ? formatGhs(
                                            safeNumber(
                                              video.amount,
                                              0
                                            )
                                          )
                                        : "Not offered"}
                                    </div>
                                  </div>

                                  <div
                                    className={`rounded-2xl p-3 ${
                                      safeBoolean(
                                        phone.enabled,
                                        false
                                      )
                                        ? "bg-emerald-50 dark:bg-emerald-950/20"
                                        : "bg-zinc-100 opacity-60 dark:bg-zinc-950"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                      <Smartphone className="h-3.5 w-3.5" />

                                      Phone
                                    </div>

                                    <div className="mt-2 text-sm font-black text-zinc-950 dark:text-white">
                                      {safeBoolean(
                                        phone.enabled,
                                        false
                                      )
                                        ? formatGhs(
                                            safeNumber(
                                              phone.amount,
                                              0
                                            )
                                          )
                                        : "Not offered"}
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* APPOINTMENT WORKFLOW */}

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CalendarCheck2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                        Appointment workflow
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500">
                        Configure how the clinic handles appointment requests and reminders.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ToggleSetting
                      title="Automatic appointment confirmation"
                      description="Automatically confirm new clinic appointments when they are created."
                      checked={
                        configuration.autoConfirmAppointments
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "autoConfirmAppointments",
                          value
                        )
                      }
                      icon={
                        CheckCircle2
                      }
                      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    />

                    <ToggleSetting
                      title="Appointment reminders"
                      description="Enable appointment reminder notifications for clinic activity."
                      checked={
                        configuration.appointmentRemindersEnabled
                      }
                      onChange={(
                        value
                      ) =>
                        setBooleanField(
                          "appointmentRemindersEnabled",
                          value
                        )
                      }
                      icon={
                        BellRing
                      }
                      iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                    />
                  </div>
                </section>

                {/* SAVE */}

                <button
                  type="button"
                  onClick={() =>
                    void saveConfiguration()
                  }
                  disabled={
                    saving
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#0b2d5f] disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      Saving configuration...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />

                      Save clinic configuration
                    </>
                  )}
                </button>
              </div>

              {/* RIGHT */}

              <aside className="space-y-6">
                {/* SUMMARY */}

                <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                      <Building2 className="h-7 w-7" />
                    </div>

                    <h3 className="mt-4 text-lg font-black">
                      {clinicName}
                    </h3>

                    <p className="mt-1 text-sm text-blue-100">
                      {location}
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                      <span className="text-xs text-zinc-500">
                        Clinic profile
                      </span>

                      <span
                        className={`text-xs font-bold ${
                          configuration.clinicVisible
                            ? "text-emerald-600"
                            : "text-zinc-500"
                        }`}
                      >
                        {configuration.clinicVisible
                          ? "Visible"
                          : "Hidden"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                      <span className="text-xs text-zinc-500">
                        New patients
                      </span>

                      <span
                        className={`text-xs font-bold ${
                          configuration.acceptsNewPatients
                            ? "text-blue-600"
                            : "text-zinc-500"
                        }`}
                      >
                        {configuration.acceptsNewPatients
                          ? "Accepted"
                          : "Paused"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                      <span className="text-xs text-zinc-500">
                        Active services
                      </span>

                      <span className="text-xs font-bold text-violet-600">
                        {enabledActivityCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                      <span className="text-xs text-zinc-500">
                        Specialties
                      </span>

                      <span className="text-xs font-bold text-blue-600">
                        {specialties.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                      <span className="text-xs text-zinc-500">
                        Currency
                      </span>

                      <span className="text-xs font-bold text-emerald-600">
                        {configuration.currency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DEFAULT CONSULTATION */}

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Clock3 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                        Default appointment settings
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        Set the default duration used when creating clinic consultation slots.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <NumberField
                      label="Consultation duration"
                      value={
                        configuration.defaultConsultationDuration
                      }
                      onChange={(
                        value
                      ) =>
                        setTextField(
                          "defaultConsultationDuration",
                          value
                        )
                      }
                      suffix="minutes"
                      icon={
                        Clock3
                      }
                      iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                    />
                  </div>
                </section>

                {/* MODES */}

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                      <Stethoscope className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                        Active consultation modes
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        Services currently enabled for this clinic.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {activeConsultationModes.length >
                    0 ? (
                      activeConsultationModes.map(
                        (
                          mode
                        ) => {
                          const ModeIcon =
                            mode.icon;

                          return (
                            <span
                              key={
                                mode.label
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${mode.className}`}
                            >
                              <ModeIcon className="h-3.5 w-3.5" />

                              {mode.label}
                            </span>
                          );
                        }
                      )
                    ) : (
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Enable at least one consultation mode.
                      </span>
                    )}
                  </div>
                </section>

                {/* SPECIALTIES SUMMARY */}

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <Stethoscope className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                        Specialty pricing
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        Consultation pricing configured by specialty.
                      </p>
                    </div>
                  </div>

                  {specialties.length ===
                  0 ? (
                    <p className="mt-5 text-xs text-zinc-500">
                      Add a specialty to configure its prices.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {specialties
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (
                            specialty
                          ) => {
                            const pricing =
                              safeObject(
                                specialty.pricing
                              );

                            const prices =
                              [
                                safeObject(
                                  pricing.inPerson
                                ),
                                safeObject(
                                  pricing.video
                                ),
                                safeObject(
                                  pricing.phone
                                ),
                              ]
                                .filter(
                                  (
                                    item
                                  ) =>
                                    safeBoolean(
                                      item.enabled,
                                      false
                                    )
                                )
                                .map(
                                  (
                                    item
                                  ) =>
                                    safeNumber(
                                      item.amount,
                                      0
                                    )
                                )
                                .filter(
                                  (
                                    amount
                                  ) =>
                                    amount >
                                    0
                                );

                            const minimum =
                              prices.length >
                              0
                                ? Math.min(
                                    ...prices
                                  )
                                : 0;

                            return (
                              <div
                                key={
                                  specialty.id
                                }
                                className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/70"
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                    {safeString(
                                      specialty.name
                                    ) ||
                                      "Specialty"}
                                  </div>

                                  <div className="mt-1 text-[10px] text-zinc-400">
                                    {prices.length} consultation mode
                                    {prices.length ===
                                    1
                                      ? ""
                                      : "s"}
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <div className="text-[10px] font-semibold text-zinc-400">
                                    From
                                  </div>

                                  <div className="text-xs font-black text-blue-600">
                                    {minimum >
                                    0
                                      ? formatGhs(
                                          minimum
                                        )
                                      : "—"}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}

                      {specialties.length >
                        5 && (
                        <div className="text-center text-[11px] font-semibold text-zinc-400">
                          +{" "}
                          {specialties.length -
                            5}{" "}
                          more specialt
                          {specialties.length -
                            5 ===
                          1
                            ? "y"
                            : "ies"}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* REGIONAL SETTINGS */}

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300">
                      <Globe2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                        Regional settings
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        Configure the clinic workspace for Ghana.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <SelectField
                      label="Language"
                      value={
                        configuration.language
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
                        setTextField(
                          "language",
                          value
                        )
                      }
                    />

                    <SelectField
                      label="Locale"
                      value={
                        configuration.locale
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
                        setTextField(
                          "locale",
                          value
                        )
                      }
                    />

                    <SelectField
                      label="Timezone"
                      value={
                        configuration.timezone
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
                        setTextField(
                          "timezone",
                          value
                        )
                      }
                    />

                    <SelectField
                      label="Currency"
                      value={
                        configuration.currency
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
                        setTextField(
                          "currency",
                          value
                        )
                      }
                    />
                  </div>
                </section>

                {/* INFO */}

                <div className="rounded-[28px] border border-cyan-200 bg-cyan-50/70 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                      <Sparkles className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                        Clinic activity
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                        These settings control how the clinic operates and how patients interact with it. They do not modify the clinic identity or verification documents.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      <ClinicDisponibilitiesModal
        open={
          availabilitiesModalOpen
        }
        clinicId={
          uid
        }
        clinicName={
          clinicName
        }
        consultationModes={{
          inPersonEnabled:
            configuration.inPersonEnabled,

          teleconsultationEnabled:
            configuration.teleconsultationEnabled,

          phoneConsultationEnabled:
            configuration.phoneConsultationEnabled,
        }}
        onClose={() =>
          setAvailabilitiesModalOpen(
            false
          )
        }
        onSaved={() =>
          setPopup({
            type:
              "success",

            title:
              "Availability saved",

            message:
              "Your clinic weekly availability has been updated successfully.",
          })
        }
      />

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