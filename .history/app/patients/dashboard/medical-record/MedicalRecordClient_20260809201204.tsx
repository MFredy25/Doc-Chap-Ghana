"use client";

import {
  useCallback,
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
  type User,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileHeart,
  FileText,
  HeartPulse,
  Info,
  Loader2,
  LockKeyhole,
  Microscope,
  Pill,
  Save,
  Shield,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserCheck,
  UserRound,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PatientsSidebar from "@/app/components/PatientsSidebar";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type PatientData = {
  uid?: string;
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    dob?: string | null;
    gender?: string | null;
  };
};

type MedicalProfile = {
  bloodGroup: string;
  genotype: string;
  heightCm: string;
  weightKg: string;
  chronicConditions: string;
  pastMedicalHistory: string;
  surgicalHistory: string;
  familyMedicalHistory: string;
  allergies: string;
  currentMedications: string;
  previousMedications: string;
  vaccinations: string;
  pregnancyStatus: string;
  lastMenstrualPeriod: string;
  nhisNumber: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  prescriptionsNotes: string;
  examinationsNotes: string;
  medicalReportsNotes: string;
  additionalNotes: string;
};

type ConsentKey =
  | "shareBasicInfo"
  | "consentHealthInfo"
  | "consentInsurance"
  | "consentAllergies"
  | "consentMedications"
  | "consentPrescriptions"
  | "consentMedicalReports"
  | "consentMedicalExams";

type ConsentPreferences = Partial<Record<ConsentKey, boolean>> & {
  consentAll?: boolean;
  autoRevokeEnabled?: boolean;
  autoRevokeHours?: number;
  consentValidUntil?: unknown;
  updatedAt?: unknown;
};

type ConsentEvent = {
  title?: string;
  status?: string;
  timestamp?: unknown;
};

const CONSENT_KEYS: ConsentKey[] = [
  "shareBasicInfo",
  "consentHealthInfo",
  "consentInsurance",
  "consentAllergies",
  "consentMedications",
  "consentPrescriptions",
  "consentMedicalReports",
  "consentMedicalExams",
];

const EMPTY_MEDICAL_PROFILE: MedicalProfile = {
  bloodGroup: "",
  genotype: "",
  heightCm: "",
  weightKg: "",
  chronicConditions: "",
  pastMedicalHistory: "",
  surgicalHistory: "",
  familyMedicalHistory: "",
  allergies: "",
  currentMedications: "",
  previousMedications: "",
  vaccinations: "",
  pregnancyStatus: "",
  lastMenstrualPeriod: "",
  nhisNumber: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  prescriptionsNotes: "",
  examinationsNotes: "",
  medicalReportsNotes: "",
  additionalNotes: "",
};

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function toDate(
  value: unknown
): Date | null {
  if (!value) return null;

  if (
    value instanceof Date
  ) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    try {
      return (
        value as {
          toDate: () => Date;
        }
      ).toDate();
    } catch {
      return null;
    }
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

  return null;
}

function formatDateTime(
  value: unknown
): string {
  const date =
    toDate(
      value
    );

  if (
    !date
  ) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    date
  );
}

function normalizeGhanaPhone(
  value: string
): string {
  const raw =
    s(value);

  if (
    !raw
  ) {
    return "";
  }

  const compact =
    raw.replace(
      /[^\d+]/g,
      ""
    );

  if (
    compact.startsWith(
      "+233"
    )
  ) {
    return `+233${compact
      .slice(4)
      .replace(/\D/g, "")}`;
  }

  let digits =
    compact.replace(
      /\D/g,
      ""
    );

  if (
    digits.startsWith(
      "233"
    )
  ) {
    digits =
      digits.slice(3);
  }

  if (
    digits.startsWith(
      "0"
    )
  ) {
    digits =
      digits.slice(1);
  }

  return `+233${digits}`;
}

function asMedicalProfile(
  value: unknown
): MedicalProfile {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return EMPTY_MEDICAL_PROFILE;
  }

  const data =
    value as Record<
      string,
      unknown
    >;

  return {
    bloodGroup:
      s(
        data.bloodGroup
      ),

    genotype:
      s(
        data.genotype
      ),

    heightCm:
      s(
        data.heightCm
      ),

    weightKg:
      s(
        data.weightKg
      ),

    chronicConditions:
      s(
        data.chronicConditions
      ),

    pastMedicalHistory:
      s(
        data.pastMedicalHistory
      ),

    surgicalHistory:
      s(
        data.surgicalHistory
      ),

    familyMedicalHistory:
      s(
        data.familyMedicalHistory
      ),

    allergies:
      s(
        data.allergies
      ),

    currentMedications:
      s(
        data.currentMedications
      ),

    previousMedications:
      s(
        data.previousMedications
      ),

    vaccinations:
      s(
        data.vaccinations
      ),

    pregnancyStatus:
      s(
        data.pregnancyStatus
      ),

    lastMenstrualPeriod:
      s(
        data.lastMenstrualPeriod
      ),

    nhisNumber:
      s(
        data.nhisNumber
      ),

    insuranceProvider:
      s(
        data.insuranceProvider
      ),

    insurancePolicyNumber:
      s(
        data.insurancePolicyNumber
      ),

    emergencyContactName:
      s(
        data.emergencyContactName
      ),

    emergencyContactPhone:
      s(
        data.emergencyContactPhone
      ),

    emergencyContactRelationship:
      s(
        data.emergencyContactRelationship
      ),

    prescriptionsNotes:
      s(
        data.prescriptionsNotes
      ),

    examinationsNotes:
      s(
        data.examinationsNotes
      ),

    medicalReportsNotes:
      s(
        data.medicalReportsNotes
      ),

    additionalNotes:
      s(
        data.additionalNotes
      ),
  };
}

function ConsentSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={() =>
        onChange(
          !checked
        )
      }
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-emerald-700 bg-emerald-600"
          : "border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
      }`}
      aria-pressed={
        checked
      }
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked
            ? "translate-x-6"
            : "translate-x-1"
        }`}
      />
    </button>
  );
}

function FormCard({
  title,
  subtitle,
  icon: Icon,
  iconClass,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-base font-black text-zinc-950 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
      {children}
    </span>
  );
}

const inputClass =
  "mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:ring-emerald-950/40";

const textareaClass =
  "mt-2 min-h-28 w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:ring-emerald-950/40";

export default function MedicalRecordClient() {
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
    savingConsent,
    setSavingConsent,
  ] =
    useState(false);

  const [
    firebaseUser,
    setFirebaseUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    patientData,
    setPatientData,
  ] =
    useState<PatientData | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<MedicalProfile>(
      EMPTY_MEDICAL_PROFILE
    );

  const [
    preferences,
    setPreferences,
  ] =
    useState<ConsentPreferences>(
      {}
    );

  const [
    lastConsent,
    setLastConsent,
  ] =
    useState<ConsentEvent | null>(
      null
    );

  const [
    consentOpen,
    setConsentOpen,
  ] =
    useState(true);

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

    let unsubscribePatient:
      | (() => void)
      | null =
      null;

    let unsubscribeMedicalProfile:
      | (() => void)
      | null =
      null;

    let unsubscribeConsent:
      | (() => void)
      | null =
      null;

    let unsubscribeConsentHistory:
      | (() => void)
      | null =
      null;

    const stopListeners =
      () => {
        unsubscribePatient?.();
        unsubscribeMedicalProfile?.();
        unsubscribeConsent?.();
        unsubscribeConsentHistory?.();

        unsubscribePatient =
          null;

        unsubscribeMedicalProfile =
          null;

        unsubscribeConsent =
          null;

        unsubscribeConsentHistory =
          null;
      };

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuthInstance,
        (
          user
        ) => {
          stopListeners();

          if (
            !user?.uid
          ) {
            setFirebaseUser(
              null
            );

            setPatientData(
              null
            );

            router.replace(
              "/patients/login"
            );

            return;
          }

          setFirebaseUser(
            user
          );

          const uid =
            user.uid;

          unsubscribePatient =
            onSnapshot(
              doc(
                firestoreInstance,
                "patients",
                uid
              ),
              async (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  stopListeners();

                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {}

                  router.replace(
                    "/patients/login"
                  );

                  return;
                }

                const data =
                  snapshot.data() as PatientData;

                const accountType =
                  s(
                    data.accountType ||
                      data.role
                  ).toLowerCase();

                if (
                  (
                    accountType &&
                    accountType !==
                      "patient"
                  ) ||
                  data.active === false ||
                  s(
                    data.status
                  ).toLowerCase() ===
                    "disabled"
                ) {
                  stopListeners();

                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {}

                  router.replace(
                    "/patients/login"
                  );

                  return;
                }

                setPatientData(
                  data
                );

                setError(
                  null
                );
              },
              (
                snapshotError
              ) => {
                if (
                  !firebaseAuthInstance.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientMedicalRecord] Patient profile error:",
                  snapshotError
                );

                setError(
                  "Unable to load your patient profile."
                );

                setLoading(
                  false
                );
              }
            );

          unsubscribeMedicalProfile =
            onSnapshot(
              doc(
                firestoreInstance,
                "patients",
                uid,
                "medicalRecord",
                "profile"
              ),
              (
                snapshot
              ) => {
                if (
                  snapshot.exists()
                ) {
                  setForm(
                    asMedicalProfile(
                      snapshot.data()
                    )
                  );
                } else {
                  setForm(
                    EMPTY_MEDICAL_PROFILE
                  );
                }

                setLoading(
                  false
                );
              },
              (
                snapshotError
              ) => {
                if (
                  !firebaseAuthInstance.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientMedicalRecord] Medical profile error:",
                  snapshotError
                );

                setError(
                  "Unable to load your medical information."
                );

                setLoading(
                  false
                );
              }
            );

          unsubscribeConsent =
            onSnapshot(
              doc(
                firestoreInstance,
                "patients",
                uid,
                "privacy",
                "preferences"
              ),
              (
                snapshot
              ) => {
                setPreferences(
                  snapshot.exists()
                    ? (
                        snapshot.data() as ConsentPreferences
                      )
                    : {}
                );
              },
              (
                snapshotError
              ) => {
                if (
                  !firebaseAuthInstance.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientMedicalRecord] Consent preferences error:",
                  snapshotError
                );
              }
            );

          unsubscribeConsentHistory =
            onSnapshot(
              collection(
                firestoreInstance,
                "patients",
                uid,
                "privacy",
                "preferences",
                "consents"
              ),
              (
                snapshot
              ) => {
                const rows =
                  snapshot.docs
                    .map(
                      (
                        item
                      ) =>
                        item.data() as ConsentEvent
                    )
                    .sort(
                      (
                        a,
                        b
                      ) =>
                        (
                          toDate(
                            b.timestamp
                          )?.getTime() ||
                          0
                        ) -
                        (
                          toDate(
                            a.timestamp
                          )?.getTime() ||
                          0
                        )
                    );

                setLastConsent(
                  rows[0] ||
                    null
                );
              },
              (
                snapshotError
              ) => {
                if (
                  !firebaseAuthInstance.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientMedicalRecord] Consent history error:",
                  snapshotError
                );
              }
            );
        }
      );

    return () => {
      stopListeners();
      unsubscribeAuth();
    };
  }, [
    router,
  ]);

  const patientName =
    useMemo(
      () => {
        const profile =
          patientData
            ?.profile;

        return (
          s(
            profile
              ?.fullName
          ) ||
          s(
            profile
              ?.displayName
          ) ||
          `${s(
            profile
              ?.firstName
          )} ${s(
            profile
              ?.lastName
          )}`.trim() ||
          s(
            firebaseUser
              ?.displayName
          ) ||
          "Patient"
        );
      },
      [
        firebaseUser,
        patientData,
      ]
    );

  const allConsentsEnabled =
    CONSENT_KEYS.every(
      (
        key
      ) =>
        preferences[
          key
        ] === true
    );

  const filledSections =
    useMemo(
      () => {
        const sections = [
          Boolean(
            form.bloodGroup ||
              form.genotype ||
              form.heightCm ||
              form.weightKg
          ),
          Boolean(
            form.chronicConditions ||
              form.pastMedicalHistory ||
              form.surgicalHistory ||
              form.familyMedicalHistory
          ),
          Boolean(
            form.allergies
          ),
          Boolean(
            form.currentMedications ||
              form.previousMedications ||
              form.vaccinations
          ),
          Boolean(
            form.nhisNumber ||
              form.insuranceProvider ||
              form.insurancePolicyNumber
          ),
          Boolean(
            form.emergencyContactName ||
              form.emergencyContactPhone
          ),
          Boolean(
            form.prescriptionsNotes ||
              form.examinationsNotes ||
              form.medicalReportsNotes
          ),
        ];

        return sections.filter(
          Boolean
        ).length;
      },
      [
        form,
      ]
    );

  function setField(
    key: keyof MedicalProfile,
    value: string
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

  async function saveMedicalRecord() {
    const firestore =
      db;

    const user =
      auth?.currentUser ||
      firebaseUser;

    if (
      !firestore ||
      !user?.uid ||
      saving
    ) {
      return;
    }

    const emergencyPhone =
      normalizeGhanaPhone(
        form.emergencyContactPhone
      );

    if (
      emergencyPhone &&
      !/^\+233\d{9}$/.test(
        emergencyPhone
      )
    ) {
      setError(
        "Please enter a valid Ghanaian emergency contact phone number."
      );

      return;
    }

    const height =
      form.heightCm
        ? Number(
            form.heightCm
          )
        : null;

    const weight =
      form.weightKg
        ? Number(
            form.weightKg
          )
        : null;

    if (
      height !== null &&
      (
        Number.isNaN(
          height
        ) ||
        height < 30 ||
        height > 260
      )
    ) {
      setError(
        "Please enter a valid height in centimetres."
      );

      return;
    }

    if (
      weight !== null &&
      (
        Number.isNaN(
          weight
        ) ||
        weight < 1 ||
        weight > 500
      )
    ) {
      setError(
        "Please enter a valid weight in kilograms."
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
      await setDoc(
        doc(
          firestore,
          "patients",
          user.uid,
          "medicalRecord",
          "profile"
        ),
        {
          ...form,

          emergencyContactPhone:
            emergencyPhone,

          heightCm:
            form.heightCm.trim(),

          weightKg:
            form.weightKg.trim(),

          ownerUid:
            user.uid,

          country:
            "Ghana",

          countryIso2:
            "GH",

          updatedAt:
            serverTimestamp(),
        },
        {
          merge:
            true,
        }
      );

      await setDoc(
        doc(
          firestore,
          "patients",
          user.uid
        ),
        {
          medicalRecord: {
            hasProfile:
              true,

            lastUpdatedAt:
              serverTimestamp(),
          },
        },
        {
          merge:
            true,
        }
      );

      setForm(
        (
          current
        ) => ({
          ...current,
          emergencyContactPhone:
            emergencyPhone,
        })
      );

      setSuccess(
        "Your medical record has been saved successfully."
      );
    } catch (
      saveError
    ) {
      console.error(
        "[PatientMedicalRecord] Save error:",
        saveError
      );

      setError(
        "Unable to save your medical record."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  const logConsent =
    useCallback(
      async (
        title: string,
        value: boolean
      ) => {
        const firestore =
          db;

        const user =
          auth?.currentUser;

        if (
          !firestore ||
          !user?.uid
        ) {
          return;
        }

        await addDoc(
          collection(
            firestore,
            "patients",
            user.uid,
            "privacy",
            "preferences",
            "consents"
          ),
          {
            title,

            status:
              value
                ? "consented"
                : "revoked",

            timestamp:
              serverTimestamp(),

            source:
              "patient_web",

            country:
              "GH",
          }
        );
      },
      []
    );

  const updateSingleConsent =
    useCallback(
      async (
        key: ConsentKey,
        value: boolean,
        title: string
      ) => {
        const firestore =
          db;

        const user =
          auth?.currentUser;

        if (
          !firestore ||
          !user?.uid ||
          savingConsent
        ) {
          return;
        }

        setSavingConsent(
          true
        );

        setError(
          null
        );

        try {
          const preferencesRef =
            doc(
              firestore,
              "patients",
              user.uid,
              "privacy",
              "preferences"
            );

          await setDoc(
            preferencesRef,
            {
              [key]:
                value,

              updatedAt:
                serverTimestamp(),
            },
            {
              merge:
                true,
            }
          );

          await logConsent(
            title,
            value
          );

          const snapshot =
            await getDoc(
              preferencesRef
            );

          const next =
            snapshot.exists()
              ? (
                  snapshot.data() as ConsentPreferences
                )
              : {};

          const consentAll =
            CONSENT_KEYS.every(
              (
                consentKey
              ) =>
                next[
                  consentKey
                ] === true
            );

          await setDoc(
            preferencesRef,
            {
              consentAll,
              updatedAt:
                serverTimestamp(),
            },
            {
              merge:
                true,
            }
          );
        } catch (
          consentError
        ) {
          console.error(
            "[PatientMedicalRecord] Consent update error:",
            consentError
          );

          setError(
            "Unable to update your consent preferences."
          );
        } finally {
          setSavingConsent(
            false
          );
        }
      },
      [
        logConsent,
        savingConsent,
      ]
    );

  const updateAllConsents =
    useCallback(
      async (
        value: boolean
      ) => {
        const firestore =
          db;

        const user =
          auth?.currentUser;

        if (
          !firestore ||
          !user?.uid ||
          savingConsent
        ) {
          return;
        }

        setSavingConsent(
          true
        );

        setError(
          null
        );

        try {
          const preferencesRef =
            doc(
              firestore,
              "patients",
              user.uid,
              "privacy",
              "preferences"
            );

          const currentSnapshot =
            await getDoc(
              preferencesRef
            );

          const current =
            currentSnapshot.exists()
              ? (
                  currentSnapshot.data() as ConsentPreferences
                )
              : {};

          const autoRevokeEnabled =
            current.autoRevokeEnabled ??
            true;

          const autoRevokeHours =
            current.autoRevokeHours ??
            48;

          const validUntil =
            value &&
            autoRevokeEnabled
              ? new Date(
                  Date.now() +
                    autoRevokeHours *
                      60 *
                      60 *
                      1000
                )
              : null;

          const patch:
            Record<
              string,
              unknown
            > = {
              consentAll:
                value,

              autoRevokeEnabled,

              autoRevokeHours,

              consentValidUntil:
                validUntil,

              updatedAt:
                serverTimestamp(),
            };

          for (
            const key of
            CONSENT_KEYS
          ) {
            patch[
              key
            ] =
              value;
          }

          const batch =
            writeBatch(
              firestore
            );

          batch.set(
            preferencesRef,
            patch,
            {
              merge:
                true,
            }
          );

          const eventRef =
            doc(
              collection(
                preferencesRef,
                "consents"
              )
            );

          batch.set(
            eventRef,
            {
              title:
                "Medical record — all consent permissions",

              status:
                value
                  ? "consented"
                  : "revoked",

              timestamp:
                serverTimestamp(),

              source:
                "patient_web",

              country:
                "GH",
            }
          );

          await batch.commit();
        } catch (
          consentError
        ) {
          console.error(
            "[PatientMedicalRecord] Update all consent error:",
            consentError
          );

          setError(
            "Unable to update all consent preferences."
          );
        } finally {
          setSavingConsent(
            false
          );
        }
      },
      [
        savingConsent,
      ]
    );

  const consentRows: Array<{
    key:
      ConsentKey;
    label:
      string;
    description:
      string;
    icon:
      React.ElementType;
    iconClass:
      string;
  }> = [
    {
      key:
        "shareBasicInfo",

      label:
        "Basic patient information",

      description:
        "Allow the practitioner to see your basic identity and contact information.",

      icon:
        UserCheck,

      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300",
    },
    {
      key:
        "consentHealthInfo",

      label:
        "General health information",

      description:
        "Allow access to blood group, genotype, health history and chronic conditions.",

      icon:
        HeartPulse,

      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
    {
      key:
        "consentInsurance",

      label:
        "NHIS & insurance",

      description:
        "Allow access to the insurance information saved in your medical record.",

      icon:
        Shield,

      iconClass:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300",
    },
    {
      key:
        "consentAllergies",

      label:
        "Allergies",

      description:
        "Allow the practitioner to view the allergies and sensitivities you declared.",

      icon:
        AlertTriangle,

      iconClass:
        "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300",
    },
    {
      key:
        "consentMedications",

      label:
        "Medications",

      description:
        "Allow access to your current and previous treatments and vaccinations.",

      icon:
        Pill,

      iconClass:
        "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300",
    },
    {
      key:
        "consentPrescriptions",

      label:
        "Prescriptions",

      description:
        "Allow access to prescription information linked to your medical record.",

      icon:
        ClipboardList,

      iconClass:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300",
    },
    {
      key:
        "consentMedicalReports",

      label:
        "Medical reports",

      description:
        "Allow access to medical reports and consultation summaries.",

      icon:
        FileText,

      iconClass:
        "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-300",
    },
    {
      key:
        "consentMedicalExams",

      label:
        "Medical examinations",

      description:
        "Allow access to laboratory, imaging and other medical examination information.",

      icon:
        Microscope,

      iconClass:
        "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300",
    },
  ];

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <PatientsSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center">
            <div className="rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

              <p className="mt-4 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                Loading your medical record...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <PatientsSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          <section className="relative overflow-hidden border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                      <FileHeart className="h-4 w-4" />

                      Medical record
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                      <ShieldCheck className="h-4 w-4" />

                      Private health data
                    </span>
                  </div>

                  <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                    Your medical record
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">
                    Add and keep your health information up to date. You decide what parts of your medical record may be shared with a healthcare practitioner.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                    <UserRound className="h-4 w-4" />

                    {patientName}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void saveMedicalRecord()
                  }
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#063b34] shadow-xl transition hover:bg-emerald-50 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />

                      Save medical record
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          <section className="px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                <BadgeCheck className="mr-2 inline h-4 w-4" />

                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white shadow-sm">
                <FileHeart className="h-5 w-5" />

                <div className="mt-4 text-2xl font-black">
                  {filledSections}/7
                </div>

                <div className="mt-1 text-xs font-bold text-emerald-50">
                  Medical sections completed
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white shadow-sm">
                <LockKeyhole className="h-5 w-5" />

                <div className="mt-4 text-2xl font-black">
                  {allConsentsEnabled
                    ? "Shared"
                    : "Private"}
                </div>

                <div className="mt-1 text-xs font-bold text-emerald-50">
                  Medical record consent
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-5 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />

                <div className="mt-4 text-2xl font-black">
                  Ghana
                </div>

                <div className="mt-1 text-xs font-bold text-emerald-50">
                  Patient healthcare file
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-6">
                <FormCard
                  title="General health information"
                  subtitle="Core information that can help healthcare professionals understand your health profile."
                  icon={HeartPulse}
                  iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <label>
                      <FieldLabel>
                        Blood group
                      </FieldLabel>

                      <select
                        value={
                          form.bloodGroup
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "bloodGroup",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Select
                        </option>
                        <option value="A+">
                          A+
                        </option>
                        <option value="A-">
                          A-
                        </option>
                        <option value="B+">
                          B+
                        </option>
                        <option value="B-">
                          B-
                        </option>
                        <option value="AB+">
                          AB+
                        </option>
                        <option value="AB-">
                          AB-
                        </option>
                        <option value="O+">
                          O+
                        </option>
                        <option value="O-">
                          O-
                        </option>
                        <option value="unknown">
                          I do not know
                        </option>
                      </select>
                    </label>

                    <label>
                      <FieldLabel>
                        Genotype
                      </FieldLabel>

                      <select
                        value={
                          form.genotype
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "genotype",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Select
                        </option>
                        <option value="AA">
                          AA
                        </option>
                        <option value="AS">
                          AS
                        </option>
                        <option value="SS">
                          SS
                        </option>
                        <option value="AC">
                          AC
                        </option>
                        <option value="SC">
                          SC
                        </option>
                        <option value="unknown">
                          I do not know
                        </option>
                      </select>
                    </label>

                    <label>
                      <FieldLabel>
                        Height (cm)
                      </FieldLabel>

                      <input
                        type="number"
                        min="30"
                        max="260"
                        value={
                          form.heightCm
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "heightCm",
                            event.target.value
                          )
                        }
                        placeholder="e.g. 172"
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Weight (kg)
                      </FieldLabel>

                      <input
                        type="number"
                        min="1"
                        max="500"
                        step="0.1"
                        value={
                          form.weightKg
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "weightKg",
                            event.target.value
                          )
                        }
                        placeholder="e.g. 70"
                        className={inputClass}
                      />
                    </label>
                  </div>
                </FormCard>

                <FormCard
                  title="Medical history"
                  subtitle="Tell healthcare professionals about your current and previous medical conditions."
                  icon={Stethoscope}
                  iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <label>
                      <FieldLabel>
                        Chronic conditions
                      </FieldLabel>

                      <textarea
                        value={
                          form.chronicConditions
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "chronicConditions",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Hypertension, diabetes, asthma..."
                        className={textareaClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Past medical history
                      </FieldLabel>

                      <textarea
                        value={
                          form.pastMedicalHistory
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "pastMedicalHistory",
                            event.target.value
                          )
                        }
                        placeholder="Previous illnesses, hospitalisations or important health events..."
                        className={textareaClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Surgical history
                      </FieldLabel>

                      <textarea
                        value={
                          form.surgicalHistory
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "surgicalHistory",
                            event.target.value
                          )
                        }
                        placeholder="Previous operations and approximate dates..."
                        className={textareaClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Family medical history
                      </FieldLabel>

                      <textarea
                        value={
                          form.familyMedicalHistory
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "familyMedicalHistory",
                            event.target.value
                          )
                        }
                        placeholder="Important conditions in close relatives..."
                        className={textareaClass}
                      />
                    </label>
                  </div>
                </FormCard>

                <FormCard
                  title="Allergies"
                  subtitle="Declare known allergies or sensitivities, including reactions when known."
                  icon={AlertTriangle}
                  iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  <label>
                    <FieldLabel>
                      Known allergies
                    </FieldLabel>

                    <textarea
                      value={
                        form.allergies
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "allergies",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Penicillin — rash; peanuts — severe reaction; no known allergy..."
                      className={textareaClass}
                    />
                  </label>
                </FormCard>

                <FormCard
                  title="Medications & vaccinations"
                  subtitle="Keep your current treatment and vaccination information available in one place."
                  icon={Pill}
                  iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <label>
                      <FieldLabel>
                        Current medications
                      </FieldLabel>

                      <textarea
                        value={
                          form.currentMedications
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "currentMedications",
                            event.target.value
                          )
                        }
                        placeholder="Medication, dose and frequency..."
                        className={textareaClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Previous medications
                      </FieldLabel>

                      <textarea
                        value={
                          form.previousMedications
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "previousMedications",
                            event.target.value
                          )
                        }
                        placeholder="Relevant previous treatments..."
                        className={textareaClass}
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <FieldLabel>
                        Vaccinations
                      </FieldLabel>

                      <textarea
                        value={
                          form.vaccinations
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "vaccinations",
                            event.target.value
                          )
                        }
                        placeholder="Vaccines received and dates if known..."
                        className={textareaClass}
                      />
                    </label>
                  </div>
                </FormCard>

                <FormCard
                  title="Women’s health"
                  subtitle="Optional information. Complete only what is relevant to you."
                  icon={Activity}
                  iconClass="bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-300"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <label>
                      <FieldLabel>
                        Pregnancy status
                      </FieldLabel>

                      <select
                        value={
                          form.pregnancyStatus
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "pregnancyStatus",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Not specified
                        </option>

                        <option value="not_pregnant">
                          Not pregnant
                        </option>

                        <option value="pregnant">
                          Pregnant
                        </option>

                        <option value="possibly_pregnant">
                          Possibly pregnant
                        </option>

                        <option value="not_applicable">
                          Not applicable
                        </option>
                      </select>
                    </label>

                    <label>
                      <FieldLabel>
                        Last menstrual period
                      </FieldLabel>

                      <input
                        type="date"
                        value={
                          form.lastMenstrualPeriod
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "lastMenstrualPeriod",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>
                </FormCard>

                <FormCard
                  title="NHIS & health insurance"
                  subtitle="Add your Ghana National Health Insurance Scheme number or private insurance information."
                  icon={Shield}
                  iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <label>
                      <FieldLabel>
                        NHIS number
                      </FieldLabel>

                      <input
                        value={
                          form.nhisNumber
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "nhisNumber",
                            event.target.value
                          )
                        }
                        placeholder="NHIS membership number"
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Insurance provider
                      </FieldLabel>

                      <input
                        value={
                          form.insuranceProvider
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "insuranceProvider",
                            event.target.value
                          )
                        }
                        placeholder="Insurance company or scheme"
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Policy / membership number
                      </FieldLabel>

                      <input
                        value={
                          form.insurancePolicyNumber
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "insurancePolicyNumber",
                            event.target.value
                          )
                        }
                        placeholder="Policy or member ID"
                        className={inputClass}
                      />
                    </label>
                  </div>
                </FormCard>

                <FormCard
                  title="Emergency contact"
                  subtitle="Add someone who can be contacted if necessary during your care."
                  icon={UserCheck}
                  iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <label>
                      <FieldLabel>
                        Full name
                      </FieldLabel>

                      <input
                        value={
                          form.emergencyContactName
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "emergencyContactName",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Ghana phone number
                      </FieldLabel>

                      <input
                        value={
                          form.emergencyContactPhone
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "emergencyContactPhone",
                            event.target.value
                          )
                        }
                        placeholder="+233 24 123 4567"
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Relationship
                      </FieldLabel>

                      <input
                        value={
                          form.emergencyContactRelationship
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "emergencyContactRelationship",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Parent, spouse, sibling"
                        className={inputClass}
                      />
                    </label>
                  </div>
                </FormCard>

                <FormCard
                  title="Prescriptions, exams & medical reports"
                  subtitle="Keep useful notes related to prescriptions, medical examinations and healthcare reports."
                  icon={FileText}
                  iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  <div className="space-y-5">
                    <label>
                      <FieldLabel>
                        Prescription notes
                      </FieldLabel>

                      <textarea
                        value={
                          form.prescriptionsNotes
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "prescriptionsNotes",
                            event.target.value
                          )
                        }
                        placeholder="Prescription information you want to keep in your medical record..."
                        className={textareaClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Medical examination notes
                      </FieldLabel>

                      <textarea
                        value={
                          form.examinationsNotes
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "examinationsNotes",
                            event.target.value
                          )
                        }
                        placeholder="Laboratory tests, imaging, screening results or other examinations..."
                        className={textareaClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Medical report notes
                      </FieldLabel>

                      <textarea
                        value={
                          form.medicalReportsNotes
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "medicalReportsNotes",
                            event.target.value
                          )
                        }
                        placeholder="Important medical reports or consultation summaries..."
                        className={textareaClass}
                      />
                    </label>

                    <label>
                      <FieldLabel>
                        Additional health notes
                      </FieldLabel>

                      <textarea
                        value={
                          form.additionalNotes
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "additionalNotes",
                            event.target.value
                          )
                        }
                        placeholder="Anything else a healthcare practitioner should know..."
                        className={textareaClass}
                      />
                    </label>
                  </div>
                </FormCard>

                <button
                  type="button"
                  onClick={() =>
                    void saveMedicalRecord()
                  }
                  disabled={
                    saving
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      Saving medical record...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />

                      Save my medical record
                    </>
                  )}
                </button>
              </div>

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <FileHeart className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                    {patientName}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Doc Chap Ghana medical record
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <span className="text-xs text-zinc-500">
                        Sections completed
                      </span>

                      <span className="text-xs font-black text-emerald-600">
                        {filledSections}/7
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <span className="text-xs text-zinc-500">
                        Sharing
                      </span>

                      <span
                        className={`text-xs font-black ${
                          allConsentsEnabled
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {allConsentsEnabled
                          ? "Enabled"
                          : "Restricted"}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-white shadow-sm dark:border-indigo-900/40 dark:bg-zinc-950">
                  <button
                    type="button"
                    onClick={() =>
                      setConsentOpen(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className="flex w-full items-center gap-3 p-5 text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
                      <LockKeyhole className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                        Medical record consent
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        You control what can be shared.
                      </p>
                    </div>

                    {consentOpen ? (
                      <ChevronUp className="h-5 w-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-zinc-400" />
                    )}
                  </button>

                  {consentOpen && (
                    <div className="border-t border-zinc-200 p-5 dark:border-zinc-800">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-black text-zinc-950 dark:text-white">
                              Share all medical information
                            </div>

                            <p className="mt-1 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">
                              Enable or revoke all medical record permissions at once.
                            </p>
                          </div>

                          <ConsentSwitch
                            checked={
                              allConsentsEnabled
                            }
                            disabled={
                              savingConsent
                            }
                            onChange={(
                              value
                            ) =>
                              void updateAllConsents(
                                value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {consentRows.map(
                          (
                            item
                          ) => {
                            const Icon =
                              item.icon;

                            return (
                              <div
                                key={
                                  item.key
                                }
                                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50"
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-black text-zinc-900 dark:text-white">
                                      {item.label}
                                    </div>

                                    <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                                      {item.description}
                                    </p>
                                  </div>

                                  <ConsentSwitch
                                    checked={
                                      preferences[
                                        item.key
                                      ] ===
                                      true
                                    }
                                    disabled={
                                      savingConsent
                                    }
                                    onChange={(
                                      value
                                    ) =>
                                      void updateSingleConsent(
                                        item.key,
                                        value,
                                        item.label
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                        <div className="flex items-start gap-2">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                          <p className="text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">
                            Consent is controlled by you. You can grant or revoke access at any time. When all permissions are enabled, automatic revocation defaults to 48 hours unless a different duration has already been configured.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
                          Last consent activity
                        </div>

                        {lastConsent ? (
                          <>
                            <div className="mt-2 text-xs font-black text-zinc-900 dark:text-white">
                              {s(
                                lastConsent.title
                              ) ||
                                "Consent update"}
                            </div>

                            <div className="mt-1 text-[11px] text-zinc-500">
                              {s(
                                lastConsent.status
                              ) ===
                              "revoked"
                                ? "Revoked"
                                : "Consented"}{" "}
                              •{" "}
                              {formatDateTime(
                                lastConsent.timestamp
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="mt-2 text-xs text-zinc-500">
                            No consent activity yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Patient-controlled record
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Your medical information is saved only under your authenticated patient account. Sharing permissions are managed separately from the medical data itself.
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